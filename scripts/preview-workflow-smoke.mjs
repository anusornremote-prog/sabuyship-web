import crypto from "node:crypto"
import { spawnSync } from "node:child_process"
import fs from "node:fs"

import { createClient } from "@supabase/supabase-js"

function loadEnv(filename) {
  return Object.fromEntries(
    fs.readFileSync(filename, "utf8")
      .split(/\r?\n/)
      .filter((line) => line && !line.trimStart().startsWith("#"))
      .map((line) => {
        const separator = line.indexOf("=")
        return separator === -1
          ? [line.trim(), ""]
          : [line.slice(0, separator).trim(), line.slice(separator + 1).trim()]
      }),
  )
}

const deployment = process.argv[2]
if (!deployment) {
  throw new Error("Usage: node scripts/preview-workflow-smoke.mjs <vercel-deployment-id-or-url>")
}

const env = loadEnv(".env.local")
const url = env.NEXT_PUBLIC_SUPABASE_URL
const publishableKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const secretKey = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !publishableKey || !secretKey) throw new Error("Missing staging Supabase environment")

const projectRef = new URL(url).hostname.split(".")[0]
const linkedRef = fs.readFileSync("supabase/.temp/project-ref", "utf8").trim()
if (projectRef !== linkedRef) throw new Error("Linked Supabase project does not match .env.local")

const service = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const runId = `${Date.now()}-${crypto.randomBytes(3).toString("hex")}`
const password = `${crypto.randomBytes(18).toString("base64url")}Aa1!`
const customerEmail = `preview-customer-${runId}@example.com`
const adminEmail = `preview-admin-${runId}@example.com`
const ids = {}
const uploadedPaths = []

function pass(message) {
  console.log(`PASS ${message}`)
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
  pass(message)
}

function must(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`)
  return result.data
}

async function createConfirmedUser(email, fullName) {
  const result = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone: "0800000000" },
  })
  return must(result, `create ${fullName}`).user
}

async function signedInClient(email) {
  const client = createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const data = must(await client.auth.signInWithPassword({ email, password }), `sign in ${email}`)
  return { client, session: data.session }
}

function sessionCookie(session) {
  const key = `sb-${projectRef}-auth-token`
  const encoded = `base64-${Buffer.from(JSON.stringify(session), "utf8").toString("base64url")}`
  const chunks = []
  for (let offset = 0; offset < encoded.length; offset += 3180) {
    chunks.push(encoded.slice(offset, offset + 3180))
  }
  if (chunks.length === 1) return `${key}=${chunks[0]}`
  return chunks.map((chunk, index) => `${key}.${index}=${chunk}`).join("; ")
}

function previewRequest(path, { method = "GET", body, cookie } = {}) {
  const vercelEntry = "node_modules/vercel/dist/index.js"
  const args = [vercelEntry, "curl", path, "--deployment", deployment, "--", "--silent", "--show-error"]
  if (cookie) args.push("--header", `Cookie: ${cookie}`)
  if (body !== undefined) {
    args.push(
      "--request",
      method,
      "--header",
      "Content-Type: application/json",
      "--data",
      JSON.stringify(body),
    )
  } else if (method !== "GET") {
    args.push("--request", method)
  }
  args.push("--write-out", "\n__STATUS__:%{http_code}")

  const result = spawnSync(process.execPath, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, NO_UPDATE_NOTIFIER: "1" },
    timeout: 30_000,
  })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`Preview request failed: ${result.stderr || result.stdout}`)

  const marker = "\n__STATUS__:"
  const markerIndex = result.stdout.lastIndexOf(marker)
  if (markerIndex === -1) throw new Error(`Missing status marker for ${method} ${path}`)
  const responseBody = result.stdout.slice(0, markerIndex)
  const status = Number(result.stdout.slice(markerIndex + marker.length).trim())
  let json = null
  if (responseBody.trim()) {
    try {
      json = JSON.parse(responseBody)
    } catch {
      json = null
    }
  }
  return { status, json, body: responseBody }
}

async function approveRound(orderId, adminCookie, round) {
  const payment = must(
    await service.from("payments").select("id").eq("order_id", orderId).eq("payment_round", round).single(),
    `read payment round ${round}`,
  )
  const approval = previewRequest(`/api/admin/payments/${payment.id}/review`, {
    method: "POST",
    cookie: adminCookie,
    body: { decision: "APPROVE" },
  })
  assert(approval.status === 200, `Preview admin approves payment round ${round} (${approval.status})`)
}

async function cleanup() {
  if (uploadedPaths.length) {
    must(
      await service.storage.from("payment_slips").remove(uploadedPaths),
      "remove preview payment slips",
    )
  }
  if (ids.order) {
    must(await service.from("tracking_logs").delete().eq("order_id", ids.order), "remove preview logs")
    must(await service.from("payments").delete().eq("order_id", ids.order), "remove preview payments")
    must(await service.from("orders").delete().eq("id", ids.order), "remove preview order")
  }
  if (ids.adminUser || ids.customerUser) {
    const actorIds = [ids.adminUser, ids.customerUser].filter(Boolean)
    await service.from("admin_audit_logs").delete().in("actor_id", actorIds)
    await service.from("notification_logs").delete().in("recipient_profile_id", actorIds)
  }
  if (ids.quotation) must(await service.from("quotations").delete().eq("id", ids.quotation), "remove preview quotation")
  if (ids.inquiry) must(await service.from("inquiries").delete().eq("id", ids.inquiry), "remove preview inquiry")
  if (ids.address) must(await service.from("addresses").delete().eq("id", ids.address), "remove preview address")
  if (ids.customerUser) must(await service.auth.admin.deleteUser(ids.customerUser), "remove preview customer")
  if (ids.adminUser) must(await service.auth.admin.deleteUser(ids.adminUser), "remove preview admin")
}

try {
  const customerUser = await createConfirmedUser(customerEmail, "Preview Customer")
  const adminUser = await createConfirmedUser(adminEmail, "Preview Admin")
  ids.customerUser = customerUser.id
  ids.adminUser = adminUser.id
  must(await service.from("profiles").update({ role: "ADMIN" }).eq("id", adminUser.id), "promote preview admin")

  const customerAuth = await signedInClient(customerEmail)
  const adminAuth = await signedInClient(adminEmail)
  const customerCookie = sessionCookie(customerAuth.session)
  const adminCookie = sessionCookie(adminAuth.session)

  const customerDashboard = previewRequest("/dashboard", { cookie: customerCookie })
  assert(customerDashboard.status === 200, `Preview customer opens dashboard (${customerDashboard.status})`)
  const customerAdmin = previewRequest("/admin", { cookie: customerCookie })
  assert(
    [307, 308].includes(customerAdmin.status),
    `Preview blocks customer from admin (${customerAdmin.status})`,
  )
  const adminDashboard = previewRequest("/admin", { cookie: adminCookie })
  assert(adminDashboard.status === 200, `Preview admin opens admin dashboard (${adminDashboard.status})`)
  for (const adminPath of ["/admin/refunds", "/admin/audit", "/admin/notifications", "/admin/imports", "/admin/security", "/admin/settings", "/admin/tracking"]) {
    const response = previewRequest(adminPath, { cookie: adminCookie })
    assert(response.status === 200, `Preview admin opens ${adminPath} (${response.status})`)
  }
  const unauthenticatedBadges = previewRequest("/api/admin/badge-counts")
  assert(unauthenticatedBadges.status === 401, `Preview protects admin badge API (${unauthenticatedBadges.status})`)
  const directNotification = previewRequest("/api/notify", { method: "POST", cookie: customerCookie, body: {} })
  assert(directNotification.status === 410, `Preview blocks direct notification spoofing (${directNotification.status})`)
  const invalidCallback = previewRequest("/api/auth/callback?code=invalid&next=/dashboard")
  assert(
    [302, 303, 307, 308].includes(invalidCallback.status),
    `Preview rejects invalid auth callback safely (${invalidCallback.status})`,
  )

  const address = must(
    await customerAuth.client.from("addresses").insert({
      customer_id: customerUser.id,
      full_name: "Preview Customer",
      phone: "0800000000",
      address_line: "99 Preview Test Road",
      district: "Test District",
      province: "Bangkok",
      postal_code: "10000",
      is_default: true,
    }).select().single(),
    "create preview address",
  )
  ids.address = address.id

  const inquiryResponse = previewRequest("/api/inquiry", {
    method: "POST",
    cookie: customerCookie,
    body: {
      customer_name: "Preview Customer",
      phone: "0800000000",
      items: [{ url: "https://example.com/preview-product", quantity: 1 }],
      shipping_type: "CAR",
      service_type: "BUY_AND_IMPORT",
      privacy_notice_acknowledged: true,
    },
  })
  assert(inquiryResponse.status === 201, `Preview creates inquiry through API (${inquiryResponse.status})`)
  const createdInquiryNumber = inquiryResponse.json?.inquiry_number
  assert(Boolean(createdInquiryNumber), "Preview inquiry response contains inquiry number")
  const inquiry = must(
    await service.from("inquiries").select("*").eq("inquiry_number", createdInquiryNumber).single(),
    "read preview inquiry",
  )
  assert(inquiry.customer_id === customerUser.id, "Preview inquiry belongs to signed-in customer")
  ids.inquiry = inquiry.id

  const forbiddenQuotation = previewRequest("/api/quotation", {
    method: "POST",
    cookie: customerCookie,
    body: { inquiry_id: inquiry.id, product_cost: 100, shipping_cost_cn_cn: 20 },
  })
  assert(forbiddenQuotation.status === 403, `Preview blocks customer quotation (${forbiddenQuotation.status})`)

  const quotationResponse = previewRequest("/api/quotation", {
    method: "POST",
    cookie: adminCookie,
    body: { inquiry_id: inquiry.id, product_cost: 100, shipping_cost_cn_cn: 20 },
  })
  assert(quotationResponse.status === 201, `Preview admin creates quotation through API (${quotationResponse.status})`)
  const quotationResult = quotationResponse.json?.data
  const quotation = quotationResult ? { ...quotationResult, id: quotationResult.quotation_id } : null
  assert(Boolean(quotation?.id), "Preview quotation response contains quotation id")
  assert(quotation.customer_id === customerUser.id, "Preview quotation belongs to customer")
  ids.quotation = quotation.id

  const orderResponse = previewRequest("/api/order", {
    method: "POST",
    cookie: customerCookie,
    body: { quotation_id: quotation.id, shipping_address_id: address.id, terms_accepted: true },
  })
  assert(orderResponse.status === 201, `Preview creates order through API (${orderResponse.status})`)
  const order = orderResponse.json?.order
  assert(Boolean(order?.id), "Preview order response contains order id")
  ids.order = order.id

  const png = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])
  const slipPath = `${customerUser.id}/${order.id}/preview-smoke-${runId}.png`
  must(
    await customerAuth.client.storage.from("payment_slips").upload(slipPath, png, { contentType: "image/png" }),
    "upload preview payment slip",
  )
  uploadedPaths.push(slipPath)
  const round1 = previewRequest(`/api/order/${order.id}/payment`, {
    method: "POST",
    cookie: customerCookie,
    body: { payment_round: 1, amount: 120, slip_path: slipPath },
  })
  assert(round1.status === 201, `Preview accepts payment round 1 (${round1.status})`)
  const round1Payment = must(
    await service.from("payments").select("id").eq("order_id", order.id).eq("payment_round", 1).single(),
    "read preview payment round 1",
  )
  const signedSlip = previewRequest(`/api/admin/payment-slip?payment_id=${round1Payment.id}`, {
    cookie: adminCookie,
  })
  assert(signedSlip.status === 200 && Boolean(signedSlip.json?.signed_url), "Preview admin receives a signed private slip URL")
  await approveRound(order.id, adminCookie, 1)

  const quote2 = previewRequest(`/api/order/${order.id}/quote-round-2`, {
    method: "POST",
    cookie: adminCookie,
    body: { shipping_cost_cn_th: 50 },
  })
  assert(quote2.status === 200, `Preview admin quotes round 2 (${quote2.status})`)
  const round2 = previewRequest(`/api/order/${order.id}/payment`, {
    method: "POST",
    cookie: customerCookie,
    body: { payment_round: 2, amount: 50, slip_path: slipPath },
  })
  assert(round2.status === 201, `Preview accepts payment round 2 (${round2.status})`)
  await approveRound(order.id, adminCookie, 2)

  const quote3 = previewRequest(`/api/order/${order.id}/quote-round-3`, {
    method: "POST",
    cookie: adminCookie,
    body: { shipping_cost_th_th: 40 },
  })
  assert(quote3.status === 200, `Preview admin quotes round 3 (${quote3.status})`)
  const shippingMethod = previewRequest(`/api/order/${order.id}`, {
    method: "PATCH",
    cookie: customerCookie,
    body: { shipping_company: "จัดส่งโดยขนส่งภายในประเทศ" },
  })
  assert(shippingMethod.status === 200, `Preview saves shipping method (${shippingMethod.status})`)
  const round3 = previewRequest(`/api/order/${order.id}/payment`, {
    method: "POST",
    cookie: customerCookie,
    body: { payment_round: 3, amount: 40, slip_path: slipPath },
  })
  assert(round3.status === 201, `Preview accepts payment round 3 (${round3.status})`)
  await approveRound(order.id, adminCookie, 3)

  const delivered = previewRequest(`/api/order/${order.id}/confirm-receipt`, {
    method: "POST",
    cookie: customerCookie,
    body: {},
  })
  assert(delivered.status === 200, `Preview confirms receipt (${delivered.status})`)

  const finalOrder = must(
    await customerAuth.client.from("orders")
      .select("status,payment_round_1_status,payment_round_2_status,payment_round_3_status,shipping_company,delivered_at")
      .eq("id", order.id)
      .single(),
    "read final preview order",
  )
  assert(
    finalOrder.status === "DELIVERED" &&
      finalOrder.payment_round_1_status === "PAID" &&
      finalOrder.payment_round_2_status === "PAID" &&
      finalOrder.payment_round_3_status === "PAID" &&
      finalOrder.shipping_company === "จัดส่งโดยขนส่งภายในประเทศ" &&
      Boolean(finalOrder.delivered_at),
    "Preview reaches DELIVERED with all three rounds paid",
  )

  const logs = must(
    await customerAuth.client.from("tracking_logs").select("status").eq("order_id", order.id),
    "read preview timeline",
  )
  const statuses = new Set(logs.map((log) => log.status))
  for (const required of [
    "WAITING_PAYMENT",
    "UPLOADED_ROUND_1",
    "PAID_ROUND_1",
    "QUOTED_ROUND_2",
    "UPLOADED_ROUND_2",
    "PAID_ROUND_2",
    "QUOTED_ROUND_3",
    "UPLOADED_ROUND_3",
    "PAID_ROUND_3",
    "DELIVERED",
  ]) {
    assert(statuses.has(required), `Preview timeline contains ${required}`)
  }
} finally {
  await cleanup()
  pass("Preview test data cleaned up")
}

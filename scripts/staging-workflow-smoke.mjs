import crypto from "node:crypto"
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
const anonymous = createClient(url, publishableKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const runId = `${Date.now()}-${crypto.randomBytes(3).toString("hex")}`
const password = `${crypto.randomBytes(18).toString("base64url")}Aa1!`
const customerEmail = `e2e-customer-${runId}@example.com`
const adminEmail = `e2e-admin-${runId}@example.com`
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
  must(await client.auth.signInWithPassword({ email, password }), `sign in ${email}`)
  return client
}

async function cleanup() {
  if (uploadedPaths.length) {
    const inquiryPaths = uploadedPaths.filter((item) => item.bucket === "inquiries").map((item) => item.path)
    const slipPaths = uploadedPaths.filter((item) => item.bucket === "payment_slips").map((item) => item.path)
    if (inquiryPaths.length) await service.storage.from("inquiries").remove(inquiryPaths)
    if (slipPaths.length) await service.storage.from("payment_slips").remove(slipPaths)
  }
  if (ids.order) {
    await service.from("tracking_logs").delete().eq("order_id", ids.order)
    await service.from("payments").delete().eq("order_id", ids.order)
    await service.from("orders").delete().eq("id", ids.order)
  }
  if (ids.quotation) await service.from("quotations").delete().eq("id", ids.quotation)
  if (ids.inquiry) await service.from("inquiries").delete().eq("id", ids.inquiry)
  if (ids.address) await service.from("addresses").delete().eq("id", ids.address)
  if (ids.customerUser) await service.auth.admin.deleteUser(ids.customerUser)
  if (ids.adminUser) await service.auth.admin.deleteUser(ids.adminUser)
}

try {
  const customerUser = await createConfirmedUser(customerEmail, "Staging Customer")
  const adminUser = await createConfirmedUser(adminEmail, "Staging Admin")
  ids.customerUser = customerUser.id
  ids.adminUser = adminUser.id

  must(
    await service.from("profiles").update({ role: "ADMIN" }).eq("id", adminUser.id),
    "promote staging admin",
  )
  const customer = await signedInClient(customerEmail)
  const admin = await signedInClient(adminEmail)

  const anonymousProfiles = must(await anonymous.from("profiles").select("id"), "anonymous profile query")
  assert(anonymousProfiles.length === 0, "anonymous cannot read profiles")

  const customerProfiles = must(await customer.from("profiles").select("id, role"), "customer profile query")
  assert(customerProfiles.length === 1 && customerProfiles[0].id === customerUser.id, "customer sees only own profile")

  const escalation = await customer
    .from("profiles")
    .update({ role: "ADMIN", wallet_balance: 999999 })
    .eq("id", customerUser.id)
  assert(Boolean(escalation.error), "customer cannot change role or wallet balance")

  const address = must(
    await customer.from("addresses").insert({
      customer_id: customerUser.id,
      full_name: "Staging Customer",
      phone: "0800000000",
      address_line: "99 Test Road",
      district: "Test District",
      province: "Bangkok",
      postal_code: "10000",
      is_default: true,
    }).select().single(),
    "create customer address",
  )
  ids.address = address.id
  pass("customer address RLS")

  const inquiryNumber = `TEST-${runId}`
  const inquiry = must(
    await customer.from("inquiries").insert({
      inquiry_number: inquiryNumber,
      customer_id: customerUser.id,
      customer_name: "Staging Customer",
      phone: "0800000000",
      product_url: "https://example.com/test-product",
      quantity: 1,
      items: [{ url: "https://example.com/test-product", quantity: 1 }],
      shipping_type: "CAR",
      service_type: "BUY_AND_IMPORT",
    }).select().single(),
    "create inquiry",
  )
  ids.inquiry = inquiry.id
  pass("customer inquiry insert RLS")

  const quotation = must(
    await admin.from("quotations").insert({
      inquiry_id: inquiry.id,
      customer_id: customerUser.id,
      product_cost: 100,
      shipping_cost_cn_cn: 20,
      total_price: 120,
      status: "SENT",
    }).select().single(),
    "create quotation as admin",
  )
  ids.quotation = quotation.id
  must(await admin.from("inquiries").update({ status: "QUOTED" }).eq("id", inquiry.id), "quote inquiry")

  const visibleQuote = must(
    await customer.from("quotations").select("id, total_price").eq("id", quotation.id).single(),
    "customer reads quotation",
  )
  assert(Number(visibleQuote.total_price) === 120, "customer can read own quotation")

  const order = must(
    await admin.from("orders").insert({
      order_number: inquiryNumber,
      customer_id: customerUser.id,
      quotation_id: quotation.id,
      shipping_address_id: address.id,
      status: "WAITING_PAYMENT",
      payment_round_1_status: "PENDING",
    }).select().single(),
    "create order as admin",
  )
  ids.order = order.id
  must(await admin.from("tracking_logs").insert({
    order_id: order.id,
    status: "WAITING_PAYMENT",
    notes: "Staging smoke: waiting for round 1",
    created_by: adminUser.id,
  }), "initial tracking log")

  await customer.from("orders").update({ status: "DELIVERED" }).eq("id", order.id)
  const protectedOrder = must(
    await customer.from("orders").select("status").eq("id", order.id).single(),
    "verify protected order",
  )
  assert(protectedOrder.status === "WAITING_PAYMENT", "customer cannot directly change order status")

  const png = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])
  const inquiryImagePath = `smoke/${runId}.png`
  must(await anonymous.storage.from("inquiries").upload(inquiryImagePath, png, { contentType: "image/png" }), "guest image upload")
  uploadedPaths.push({ bucket: "inquiries", path: inquiryImagePath })
  pass("guest inquiry image storage policy")

  const slipPath = `smoke/${runId}.png`
  must(await customer.storage.from("payment_slips").upload(slipPath, png, { contentType: "image/png" }), "customer slip upload")
  uploadedPaths.push({ bucket: "payment_slips", path: slipPath })
  pass("customer payment slip storage policy")

  const { data: slipPublicUrl } = customer.storage.from("payment_slips").getPublicUrl(slipPath)

  async function submitAndApproveRound(round, amount, nextStatus, paidLog) {
    must(await service.from("payments").insert({
      order_id: order.id,
      payment_round: round,
      amount,
      slip_url: slipPublicUrl.publicUrl,
      status: "PENDING",
    }), `submit payment round ${round}`)
    must(await service.from("orders").update({ [`payment_round_${round}_status`]: "UPLOADED" }).eq("id", order.id), `upload round ${round}`)
    must(await service.from("tracking_logs").insert({ order_id: order.id, status: `UPLOADED_ROUND_${round}`, notes: `Staging smoke round ${round}` }), `log upload round ${round}`)
    must(await admin.from("payments").update({ status: "APPROVED" }).eq("order_id", order.id).eq("payment_round", round), `approve payment round ${round}`)
    must(await admin.from("orders").update({ [`payment_round_${round}_status`]: "PAID", status: nextStatus }).eq("id", order.id), `advance order round ${round}`)
    must(await admin.from("tracking_logs").insert({ order_id: order.id, status: paidLog, notes: `Staging smoke approved round ${round}`, created_by: adminUser.id }), `log approval round ${round}`)
    pass(`payment round ${round}`)
  }

  await submitAndApproveRound(1, 120, "ORDERED", "PAID_ROUND_1")

  must(await admin.from("quotations").update({ shipping_cost_cn_th: 50, total_price: 170 }).eq("id", quotation.id), "quote round 2")
  must(await admin.from("orders").update({ status: "CHINA_WAREHOUSE", payment_round_2_status: "PENDING" }).eq("id", order.id), "open round 2")
  must(await admin.from("tracking_logs").insert({ order_id: order.id, status: "QUOTED_ROUND_2", notes: "Staging smoke round 2 quote", created_by: adminUser.id }), "log round 2 quote")
  await submitAndApproveRound(2, 50, "SHIPPING", "PAID_ROUND_2")

  must(await admin.from("orders").update({ status: "THAILAND_WAREHOUSE", shipping_company: "จัดส่งโดยขนส่งภายในประเทศ", payment_round_3_status: "PENDING" }).eq("id", order.id), "open round 3")
  must(await admin.from("quotations").update({ shipping_cost_th_th: 40, total_price: 210 }).eq("id", quotation.id), "quote round 3")
  must(await admin.from("tracking_logs").insert({ order_id: order.id, status: "QUOTED_ROUND_3", notes: "Staging smoke round 3 quote", created_by: adminUser.id }), "log round 3 quote")
  await submitAndApproveRound(3, 40, "OUT_FOR_DELIVERY", "PAID_ROUND_3")

  must(await service.from("orders").update({ status: "DELIVERED", delivered_at: new Date().toISOString() }).eq("id", order.id), "confirm delivery")
  must(await service.from("tracking_logs").insert({ order_id: order.id, status: "DELIVERED", notes: "Staging smoke delivered", created_by: customerUser.id }), "log delivery")

  const finalOrder = must(
    await customer.from("orders").select("status,payment_round_1_status,payment_round_2_status,payment_round_3_status,delivered_at").eq("id", order.id).single(),
    "read final order",
  )
  assert(
    finalOrder.status === "DELIVERED" &&
      finalOrder.payment_round_1_status === "PAID" &&
      finalOrder.payment_round_2_status === "PAID" &&
      finalOrder.payment_round_3_status === "PAID" &&
      Boolean(finalOrder.delivered_at),
    "workflow reaches DELIVERED with all three rounds paid",
  )

  const logs = must(
    await customer.from("tracking_logs").select("status").eq("order_id", order.id),
    "read customer timeline",
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
    assert(statuses.has(required), `timeline contains ${required}`)
  }
} finally {
  await cleanup()
  pass("staging test data cleaned up")
}

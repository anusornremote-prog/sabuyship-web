import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { sendAdminNotification } from "@/lib/notify"
import {
  generateTicketNumber,
  getTicketCategoryLabel,
  getTicketStatusMeta,
  isTicketCategory,
  isTicketStatus,
  sanitizeTicketAttachmentPaths,
  validateOptionalVideoUrl,
} from "@/lib/tickets"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("order_id")?.trim() || ""
    const statusFilter = searchParams.get("status")?.trim() || ""

    const adminClient = createAdminClient()
    let query = adminClient
      .from("support_tickets")
      .select(
        `
        id,
        ticket_number,
        order_id,
        category,
        subject,
        status,
        evidence_urls,
        video_url,
        resolution_note,
        last_activity_at,
        resolved_at,
        closed_at,
        created_at,
        updated_at,
        order:order_id (
          id,
          order_number,
          status,
          tracking_number,
          shipping_company
        )
      `
      )
      .eq("customer_id", user.id)
      .order("last_activity_at", { ascending: false })

    if (orderId) {
      if (!UUID_REGEX.test(orderId)) {
        return NextResponse.json({ error: "รหัสคำสั่งซื้อไม่ถูกต้อง" }, { status: 400 })
      }
      query = query.eq("order_id", orderId)
    }

    if (statusFilter && statusFilter !== "ALL") {
      if (statusFilter === "OPEN") {
        query = query.in("status", ["NEW", "IN_PROGRESS", "WAITING_CUSTOMER"])
      } else if (isTicketStatus(statusFilter)) {
        query = query.eq("status", statusFilter)
      }
    }

    const { data: tickets, error } = await query.limit(100)
    if (error) throw error

    return NextResponse.json({ tickets: tickets || [] })
  } catch (error) {
    console.error("Failed to fetch customer support tickets:", error)
    return NextResponse.json(
      { error: "ไม่สามารถโหลดรายการเคสประสานงานได้ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const limitResult = checkRateLimit(request, {
    namespace: "customer-create-ticket",
    limit: 12,
    windowMs: 60_000,
  })
  if (!limitResult.allowed) {
    return rateLimitResponse(
      limitResult.retryAfterSeconds,
      "คุณเปิดเคสบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง"
    )
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนเปิดเคสประสานงาน" }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "ข้อมูลคำขอไม่ถูกต้อง" }, { status: 400 })
    }

    const orderId = typeof body.order_id === "string" ? body.order_id.trim() : ""
    const category = body.category
    const subject = typeof body.subject === "string" ? body.subject.trim() : ""
    const description = typeof body.description === "string" ? body.description.trim() : ""
    const acknowledgedScope = body.acknowledged_scope === true

    if (!UUID_REGEX.test(orderId)) {
      return NextResponse.json({ error: "รหัสคำสั่งซื้อไม่ถูกต้อง" }, { status: 400 })
    }
    if (!isTicketCategory(category)) {
      return NextResponse.json({ error: "กรุณาเลือกประเภทปัญหาให้ถูกต้อง" }, { status: 400 })
    }
    if (subject.length < 2 || subject.length > 160) {
      return NextResponse.json(
        { error: "กรุณาระบุหัวข้อปัญหาความยาว 2–160 ตัวอักษร" },
        { status: 400 }
      )
    }
    if (description.length < 5 || description.length > 4000) {
      return NextResponse.json(
        { error: "กรุณาระบุรายละเอียดปัญหาอย่างน้อย 5 ตัวอักษร" },
        { status: 400 }
      )
    }
    if (!acknowledgedScope) {
      return NextResponse.json(
        { error: "กรุณายืนยันรับทราบขอบเขตการประสานงานของทีมงานก่อนเปิดเคส" },
        { status: 400 }
      )
    }

    const videoValidation = validateOptionalVideoUrl(body.video_url)
    if (!videoValidation.ok) {
      return NextResponse.json({ error: videoValidation.error }, { status: 400 })
    }

    const evidenceUrls = sanitizeTicketAttachmentPaths(body.evidence_paths, user.id)
    const adminClient = createAdminClient()

    const [{ data: order, error: orderError }, { data: profile }] = await Promise.all([
      adminClient
        .from("orders")
        .select("id, order_number, customer_id, status")
        .eq("id", orderId)
        .maybeSingle(),
      adminClient
        .from("profiles")
        .select("id, full_name, customer_code")
        .eq("id", user.id)
        .maybeSingle(),
    ])

    if (orderError) throw orderError
    if (!order || order.customer_id !== user.id) {
      return NextResponse.json(
        { error: "ไม่พบคำสั่งซื้อนี้หรือคุณไม่มีสิทธิ์เปิดเคสสำหรับคำสั่งซื้อนี้" },
        { status: 404 }
      )
    }

    let createdTicket: {
      id: string
      ticket_number: string
      status: string
      created_at: string
    } | null = null

    for (let attempt = 0; attempt < 3; attempt++) {
      const candidateNumber = generateTicketNumber()
      const { data: inserted, error: insertError } = await adminClient
        .from("support_tickets")
        .insert({
          ticket_number: candidateNumber,
          order_id: order.id,
          customer_id: user.id,
          category,
          subject,
          description,
          evidence_urls: evidenceUrls,
          video_url: videoValidation.url,
          status: "NEW",
          coordinator_scope_acknowledged_at: new Date().toISOString(),
        })
        .select("id, ticket_number, status, created_at")
        .single()

      if (!insertError && inserted) {
        createdTicket = inserted
        break
      }
      if (insertError?.code !== "23505") {
        throw insertError
      }
    }

    if (!createdTicket) {
      return NextResponse.json(
        { error: "ไม่สามารถสร้างรหัสเคสได้ชั่วคราว กรุณาลองใหม่อีกครั้ง" },
        { status: 500 }
      )
    }

    const categoryLabel = getTicketCategoryLabel(category)
    const statusLabel = getTicketStatusMeta("NEW").label

    await Promise.all([
      adminClient.from("ticket_updates").insert({
        ticket_id: createdTicket.id,
        author_id: user.id,
        author_role: "SYSTEM",
        message: `เปิดเคสขอประสานงาน (${categoryLabel}) เรียบร้อยแล้ว ทีมงานกำลังตรวจสอบหลักฐานเบื้องต้น`,
        attachments: [],
        is_internal: false,
        status_from: null,
        status_to: "NEW",
      }),
      adminClient.from("tracking_logs").insert({
        order_id: order.id,
        status: order.status,
        notes: `เปิดเคสประสานงาน ${createdTicket.ticket_number}: ${categoryLabel}`,
        description: subject,
        created_by: user.id,
      }),
    ])

    const customerDisplay = profile?.full_name || "ลูกค้า"
    const customerCode = profile?.customer_code ? ` (${profile.customer_code})` : ""
    const adminNotifyText = [
      `🆘 เปิดเคสประสานงานใหม่ ${createdTicket.ticket_number}`,
      `ออเดอร์: ${order.order_number}`,
      `ลูกค้า: ${customerDisplay}${customerCode}`,
      `ประเภท: ${categoryLabel}`,
      `หัวข้อ: ${subject}`,
      `สถานะ: ${statusLabel}`,
      `แนบรูป: ${evidenceUrls.length} รูป${videoValidation.url ? " + ลิงก์วิดีโอ" : ""}`,
      `เปิดดูเคส: https://www.sabuyship.com/admin/tickets/${createdTicket.id}`,
    ].join("\n")

    await sendAdminNotification(adminNotifyText)

    return NextResponse.json(
      {
        ticket: createdTicket,
        message: "เปิดเคสขอประสานงานเรียบร้อยแล้ว ทีมงานจะรีบตรวจสอบและช่วยติดตามให้โดยเร็ว",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Failed to create support ticket:", error)
    return NextResponse.json(
      { error: "ไม่สามารถเปิดเคสได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    )
  }
}

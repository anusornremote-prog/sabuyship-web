import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { sendAdminNotification } from "@/lib/notify"
import { getCustomerDisplayName } from "@/lib/display-name"
import {
  sanitizeTicketAttachmentPaths,
  signTicketAttachmentUrls,
  validateOptionalVideoUrl,
} from "@/lib/tickets"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const target = decodeURIComponent(id).trim()
    if (!target) {
      return NextResponse.json({ error: "ไม่พบรหัสเคส" }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const { data: viewerProfile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    const isAdmin = viewerProfile?.role === "ADMIN"

    let ticketQuery = adminClient
      .from("support_tickets")
      .select(
        `
        id,
        ticket_number,
        order_id,
        customer_id,
        category,
        subject,
        description,
        evidence_urls,
        video_url,
        status,
        coordinator_scope_acknowledged_at,
        resolution_note,
        assigned_admin_id,
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
          shipping_company,
          quotation:quotation_id (
            inquiry:inquiry_id (
              items,
              shipping_type,
              product_url
            )
          )
        ),
        customer:customer_id (
          id,
          full_name,
          customer_code,
          phone,
          line_uid
        )
      `
      )

    if (UUID_REGEX.test(target)) {
      ticketQuery = ticketQuery.eq("id", target)
    } else {
      ticketQuery = ticketQuery.eq("ticket_number", target)
    }

    const { data: ticket, error: ticketError } = await ticketQuery.maybeSingle()
    if (ticketError) throw ticketError

    if (!ticket) {
      return NextResponse.json({ error: "ไม่พบเคสประสานงานนี้" }, { status: 404 })
    }

    if (!isAdmin && ticket.customer_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let updatesQuery = adminClient
      .from("ticket_updates")
      .select(
        `
        id,
        ticket_id,
        author_id,
        author_role,
        message,
        attachments,
        is_internal,
        status_from,
        status_to,
        created_at,
        author:author_id (
          id,
          full_name,
          role,
          customer_code
        )
      `
      )
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: true })

    if (!isAdmin) {
      updatesQuery = updatesQuery.eq("is_internal", false)
    }

    const { data: updates, error: updatesError } = await updatesQuery
    if (updatesError) throw updatesError

    const allPaths: string[] = [
      ...(Array.isArray(ticket.evidence_urls) ? ticket.evidence_urls : []),
      ...(updates || []).flatMap((u) => (Array.isArray(u.attachments) ? u.attachments : [])),
    ]

    const signedUrlMap = await signTicketAttachmentUrls(adminClient, allPaths, 600)

    const signedEvidence = (Array.isArray(ticket.evidence_urls) ? ticket.evidence_urls : [])
      .map((path: string) => ({
        path,
        signedUrl: signedUrlMap.get(path) || null,
      }))
      .filter((item) => Boolean(item.signedUrl))

    const signedUpdates = (updates || []).map((u) => {
      const authorRow = Array.isArray(u.author) ? u.author[0] : u.author
      const rawAttachments = Array.isArray(u.attachments) ? u.attachments : []
      return {
        id: u.id,
        ticket_id: u.ticket_id,
        author_id: u.author_id,
        author_role: u.author_role,
        author_name:
          u.author_role === "ADMIN"
            ? "ทีมงานแอดมิน Sabuy Ship"
            : u.author_role === "SYSTEM"
              ? "ระบบ Sabuy Ship"
              : getCustomerDisplayName({ profileName: authorRow?.full_name }),
        message: u.message,
        is_internal: u.is_internal,
        status_from: u.status_from,
        status_to: u.status_to,
        created_at: u.created_at,
        attachments: rawAttachments
          .map((path: string) => ({
            path,
            signedUrl: signedUrlMap.get(path) || null,
          }))
          .filter((item) => Boolean(item.signedUrl)),
      }
    })

    const customerRow = Array.isArray(ticket.customer) ? ticket.customer[0] : ticket.customer

    return NextResponse.json({
      ticket: {
        ...ticket,
        customer: customerRow
          ? {
              ...customerRow,
              display_name: getCustomerDisplayName({ profileName: customerRow.full_name }),
            }
          : null,
        evidence_signed: signedEvidence,
      },
      updates: signedUpdates,
    })
  } catch (error) {
    console.error("Failed to fetch support ticket detail:", error)
    return NextResponse.json(
      { error: "ไม่สามารถโหลดรายละเอียดเคสได้ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const limitResult = checkRateLimit(request, {
    namespace: "customer-reply-ticket",
    limit: 20,
    windowMs: 60_000,
  })
  if (!limitResult.allowed) {
    return rateLimitResponse(
      limitResult.retryAfterSeconds,
      "คุณส่งข้อความถี่เกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง"
    )
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const ticketId = decodeURIComponent(id).trim()
    if (!UUID_REGEX.test(ticketId)) {
      return NextResponse.json({ error: "รหัสเคสไม่ถูกต้อง" }, { status: 400 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "ข้อมูลคำขอไม่ถูกต้อง" }, { status: 400 })
    }

    const message = typeof body.message === "string" ? body.message.trim() : ""
    const attachments = sanitizeTicketAttachmentPaths(body.attachments, user.id)

    if (message.length < 1 || message.length > 4000) {
      return NextResponse.json(
        { error: "กรุณาระบุข้อความหรือรายละเอียดเพิ่มเติม (1–4,000 ตัวอักษร)" },
        { status: 400 }
      )
    }

    const videoValidation = validateOptionalVideoUrl(body.video_url)
    if (!videoValidation.ok) {
      return NextResponse.json({ error: videoValidation.error }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const { data: ticket, error: ticketError } = await adminClient
      .from("support_tickets")
      .select(
        `
        id,
        ticket_number,
        order_id,
        customer_id,
        status,
        video_url,
        order:order_id (
          order_number
        )
      `
      )
      .eq("id", ticketId)
      .maybeSingle()

    if (ticketError) throw ticketError
    if (!ticket || ticket.customer_id !== user.id) {
      return NextResponse.json({ error: "ไม่พบเคสประสานงานนี้" }, { status: 404 })
    }

    if (ticket.status === "CLOSED") {
      return NextResponse.json(
        { error: "เคสนี้ถูกปิดการติดตามแล้ว หากพบปัญหาเพิ่มเติมกรุณาติดต่อแอดมินผ่าน LINE" },
        { status: 400 }
      )
    }

    const nowIso = new Date().toISOString()
    const nextStatus = ticket.status === "WAITING_CUSTOMER" ? "IN_PROGRESS" : ticket.status

    const ticketPatch: Record<string, unknown> = {
      status: nextStatus,
      last_activity_at: nowIso,
      updated_at: nowIso,
    }
    if (videoValidation.url && !ticket.video_url) {
      ticketPatch.video_url = videoValidation.url
    }

    const [{ error: insertUpdateErr }, { error: updateTicketErr }] = await Promise.all([
      adminClient.from("ticket_updates").insert({
        ticket_id: ticket.id,
        author_id: user.id,
        author_role: "CUSTOMER",
        message,
        attachments,
        is_internal: false,
        status_from: nextStatus !== ticket.status ? ticket.status : null,
        status_to: nextStatus !== ticket.status ? nextStatus : null,
      }),
      adminClient.from("support_tickets").update(ticketPatch).eq("id", ticket.id),
    ])

    if (insertUpdateErr) throw insertUpdateErr
    if (updateTicketErr) throw updateTicketErr

    const orderRow = Array.isArray(ticket.order) ? ticket.order[0] : ticket.order
    await sendAdminNotification(
      [
        `💬 ลูกค้าตอบกลับเคส ${ticket.ticket_number}`,
        `ออเดอร์: ${orderRow?.order_number || "-"}`,
        `ข้อความ: ${message.slice(0, 220)}${message.length > 220 ? "..." : ""}`,
        attachments.length > 0 ? `แนบรูปเพิ่ม: ${attachments.length} รูป` : "",
        `ตรวจสอบเคส: https://www.sabuyship.com/admin/tickets/${ticket.id}`,
      ]
        .filter(Boolean)
        .join("\n")
    )

    return NextResponse.json({
      success: true,
      status: nextStatus,
      message: "ส่งข้อมูลเพิ่มเติมเรียบร้อยแล้ว",
    })
  } catch (error) {
    console.error("Failed to post customer ticket reply:", error)
    return NextResponse.json(
      { error: "ไม่สามารถส่งข้อความได้ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    )
  }
}

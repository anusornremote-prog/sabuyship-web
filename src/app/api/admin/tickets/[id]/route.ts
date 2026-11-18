import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/require-admin"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendCustomerNotification } from "@/lib/notify"
import {
  getTicketStatusMeta,
  isTicketStatus,
  sanitizeTicketAttachmentPaths,
} from "@/lib/tickets"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
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
    const isInternal = body.is_internal === true
    const notifyCustomer = body.notify_customer === true && !isInternal
    const hasResolutionField = Object.prototype.hasOwnProperty.call(body, "resolution_note")
    const resolutionNote =
      typeof body.resolution_note === "string" ? body.resolution_note.trim().slice(0, 2000) : null
    const attachments = sanitizeTicketAttachmentPaths(body.attachments, auth.user.id)

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
        resolution_note,
        resolved_at,
        closed_at,
        order:order_id (
          id,
          order_number,
          status
        )
      `
      )
      .eq("id", ticketId)
      .maybeSingle()

    if (ticketError) throw ticketError
    if (!ticket) {
      return NextResponse.json({ error: "ไม่พบเคสประสานงานนี้" }, { status: 404 })
    }

    const nextStatus =
      body.status && body.status !== ticket.status
        ? isTicketStatus(body.status)
          ? body.status
          : null
        : ticket.status

    if (nextStatus === null) {
      return NextResponse.json({ error: "สถานะเคสไม่ถูกต้อง" }, { status: 400 })
    }

    const statusChanged = nextStatus !== ticket.status
    const hasMessage = message.length > 0 || attachments.length > 0

    if (!statusChanged && !hasMessage && !hasResolutionField) {
      return NextResponse.json(
        { error: "กรุณาระบุข้อความ อัปเดตสถานะ หรือบันทึกผลสรุป" },
        { status: 400 }
      )
    }

    if (message.length > 4000) {
      return NextResponse.json(
        { error: "ข้อความต้องยาวไม่เกิน 4,000 ตัวอักษร" },
        { status: 400 }
      )
    }

    const nowIso = new Date().toISOString()
    const updatePayload: Record<string, unknown> = {
      status: nextStatus,
      assigned_admin_id: auth.user.id,
      last_activity_at: nowIso,
      updated_at: nowIso,
    }

    if (hasResolutionField) {
      updatePayload.resolution_note = resolutionNote || null
    }
    if (nextStatus === "RESOLVED" && !ticket.resolved_at) {
      updatePayload.resolved_at = nowIso
    }
    if (nextStatus === "CLOSED" && !ticket.closed_at) {
      updatePayload.closed_at = nowIso
    } else if (nextStatus !== "CLOSED" && ticket.closed_at) {
      updatePayload.closed_at = null
    }

    const { error: ticketUpdateErr } = await adminClient
      .from("support_tickets")
      .update(updatePayload)
      .eq("id", ticket.id)

    if (ticketUpdateErr) throw ticketUpdateErr

    const statusMeta = getTicketStatusMeta(nextStatus)
    const updateMessage =
      message ||
      (statusChanged
        ? `เปลี่ยนสถานะเคสเป็น "${statusMeta.label}"`
        : "อัปเดตบันทึกสรุปผลเคสประสานงาน")

    const { error: insertTimelineErr } = await adminClient.from("ticket_updates").insert({
      ticket_id: ticket.id,
      author_id: auth.user.id,
      author_role: "ADMIN",
      message: updateMessage,
      attachments,
      is_internal: isInternal,
      status_from: statusChanged ? ticket.status : null,
      status_to: statusChanged ? nextStatus : null,
    })

    if (insertTimelineErr) throw insertTimelineErr

    const orderRow = Array.isArray(ticket.order) ? ticket.order[0] : ticket.order

    await adminClient.from("admin_audit_logs").insert({
      actor_id: auth.user.id,
      action: "UPDATE_SUPPORT_TICKET",
      entity_type: "support_ticket",
      entity_id: ticket.id,
      old_data: {
        status: ticket.status,
        resolution_note: ticket.resolution_note,
      },
      new_data: {
        status: nextStatus,
        is_internal: isInternal,
        notified_customer: notifyCustomer,
        resolution_note: hasResolutionField ? resolutionNote : ticket.resolution_note,
      },
      reason: updateMessage.slice(0, 300),
    })

    if (!isInternal && statusChanged && orderRow?.id) {
      await adminClient.from("tracking_logs").insert({
        order_id: orderRow.id,
        status: orderRow.status,
        notes: `อัปเดตเคส ${ticket.ticket_number}: ${statusMeta.label}`,
        description: message ? message.slice(0, 200) : undefined,
        created_by: auth.user.id,
      })
    }

    let lineSent = false
    if (notifyCustomer) {
      const customerMsg = [
        `📋 อัปเดตเคสประสานงาน ${ticket.ticket_number}`,
        `ออเดอร์: ${orderRow?.order_number || "-"}`,
        `สถานะล่าสุด: ${statusMeta.label}`,
        message ? `ข้อความจากแอดมิน: ${message.slice(0, 240)}${message.length > 240 ? "..." : ""}` : "",
        `ดูรายละเอียดและตอบกลับ: https://www.sabuyship.com/dashboard/tickets/${ticket.id}`,
      ]
        .filter(Boolean)
        .join("\n")

      lineSent = await sendCustomerNotification(ticket.customer_id, customerMsg)
    }

    return NextResponse.json({
      success: true,
      status: nextStatus,
      line_notified: lineSent,
    })
  } catch (error) {
    console.error("Failed to update support ticket:", error)
    return NextResponse.json(
      { error: "ไม่สามารถอัปเดตเคสประสานงานได้ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    )
  }
}

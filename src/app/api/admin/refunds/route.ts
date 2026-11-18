import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/require-admin"
import { createAdminClient } from "@/lib/supabase/admin"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "ข้อมูลคำขอไม่ถูกต้อง" }, { status: 400 })
    }

    const orderId = typeof body.order_id === "string" ? body.order_id.trim() : ""
    const ticketId = typeof body.ticket_id === "string" ? body.ticket_id.trim() : ""
    const rawAmount = Number(body.amount)
    const reason = typeof body.reason === "string" ? body.reason.trim() : ""

    if (!UUID_REGEX.test(orderId)) {
      return NextResponse.json({ error: "รหัสคำสั่งซื้อไม่ถูกต้อง" }, { status: 400 })
    }
    if (ticketId && !UUID_REGEX.test(ticketId)) {
      return NextResponse.json({ error: "รหัสเคสไม่ถูกต้อง" }, { status: 400 })
    }
    if (!Number.isFinite(rawAmount) || rawAmount <= 0 || rawAmount > 10_000_000) {
      return NextResponse.json(
        { error: "กรุณาระบุจำนวนเงินคืนที่ถูกต้อง (มากกว่า 0 บาท)" },
        { status: 400 }
      )
    }
    if (reason.length < 3 || reason.length > 500) {
      return NextResponse.json(
        { error: "กรุณาระบุเหตุผลการคืนเงิน (3–500 ตัวอักษร)" },
        { status: 400 }
      )
    }

    const roundedAmount = Math.round(rawAmount * 100) / 100
    const adminClient = createAdminClient()

    const { data: order, error: orderError } = await adminClient
      .from("orders")
      .select("id, order_number, customer_id")
      .eq("id", orderId)
      .maybeSingle()

    if (orderError) throw orderError
    if (!order || !order.customer_id) {
      return NextResponse.json(
        { error: "ไม่พบคำสั่งซื้อหรือข้อมูลลูกค้าที่เชื่อมโยง" },
        { status: 404 }
      )
    }

    let linkedTicket: { id: string; ticket_number: string; order_id: string } | null = null
    if (ticketId) {
      const { data: ticketRow, error: ticketError } = await adminClient
        .from("support_tickets")
        .select("id, ticket_number, order_id")
        .eq("id", ticketId)
        .maybeSingle()
      if (ticketError) throw ticketError
      if (!ticketRow || ticketRow.order_id !== order.id) {
        return NextResponse.json(
          { error: "ไม่พบเคสประสานงานที่ตรงกับคำสั่งซื้อนี้" },
          { status: 404 }
        )
      }
      linkedTicket = ticketRow
    }

    const fullReason = linkedTicket
      ? `[เคส ${linkedTicket.ticket_number}] ${reason}`
      : reason

    const { data: createdRefund, error: insertError } = await adminClient
      .from("refunds")
      .insert({
        order_id: order.id,
        customer_id: order.customer_id,
        amount: roundedAmount,
        reason: fullReason.slice(0, 500),
        status: "PENDING",
        requested_by: auth.user.id,
      })
      .select("id, order_id, customer_id, amount, reason, status, created_at")
      .single()

    if (insertError) throw insertError

    const nowIso = new Date().toISOString()

    await adminClient.from("admin_audit_logs").insert({
      actor_id: auth.user.id,
      action: linkedTicket ? "CREATE_TICKET_REFUND" : "CREATE_REFUND",
      entity_type: "refund",
      entity_id: createdRefund.id,
      new_data: {
        order_id: order.id,
        order_number: order.order_number,
        ticket_id: linkedTicket?.id || null,
        ticket_number: linkedTicket?.ticket_number || null,
        amount: roundedAmount,
        reason: fullReason,
      },
      reason: fullReason.slice(0, 300),
    })

    if (linkedTicket) {
      await Promise.all([
        adminClient.from("ticket_updates").insert({
          ticket_id: linkedTicket.id,
          author_id: auth.user.id,
          author_role: "ADMIN",
          message: `บันทึกคำขอคืนเงินจากการประสานงานจำนวน ฿${roundedAmount.toLocaleString("th-TH", {
            minimumFractionDigits: 2,
          })} เข้าระบบเงินคืนแล้ว (${reason})`,
          attachments: [],
          is_internal: false,
        }),
        adminClient
          .from("support_tickets")
          .update({
            last_activity_at: nowIso,
            updated_at: nowIso,
          })
          .eq("id", linkedTicket.id),
      ])
    }

    return NextResponse.json(
      {
        refund: createdRefund,
        message: "สร้างรายการเงินคืนเรียบร้อยแล้ว สามารถดำเนินการอนุมัติและโอนคืนได้ที่หน้าเงินคืน",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Failed to create refund record:", error)
    return NextResponse.json(
      { error: "ไม่สามารถสร้างรายการเงินคืนได้ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    )
  }
}

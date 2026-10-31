import { NextResponse } from "next/server"

import { sendCustomerNotification } from "@/lib/notify"
import { requireAdmin } from "@/lib/require-admin"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { id } = await params
    const body = await request.json()
    const { tracking_number, items: updatedItemsInput, notify_customer } = body

    // 1. Fetch order and inquiry items
    const { data: order, error: orderError } = await auth.supabase
      .from("orders")
      .select(`
        id,
        order_number,
        customer_id,
        status,
        quotation:quotation_id (
          id,
          inquiry:inquiry_id (
            id,
            items
          )
        )
      `)
      .eq("id", id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 })
    }

    const quotation = Array.isArray(order.quotation) ? order.quotation[0] : order.quotation
    const inquiry = Array.isArray(quotation?.inquiry) ? quotation.inquiry[0] : quotation?.inquiry

    if (!inquiry) {
      return NextResponse.json({ error: "ไม่พบข้อมูลรายการสินค้าในคำสั่งซื้อ" }, { status: 400 })
    }

    let currentItems = inquiry.items || []
    if (typeof currentItems === "string") {
      try {
        currentItems = JSON.parse(currentItems)
      } catch {
        currentItems = []
      }
    }

    let finalItems = []
    const trackingStrings: string[] = []
    const splitTrackings = (raw: any): string[] => {
      if (!raw) return []
      if (Array.isArray(raw)) {
        return raw.map((s) => String(s || "").trim()).filter(Boolean)
      }
      return String(raw)
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean)
    }

    if (Array.isArray(updatedItemsInput) && updatedItemsInput.length > 0) {
      finalItems = currentItems.map((item: any, idx: number) => {
        const matchingInput = updatedItemsInput[idx]
        const list = splitTrackings(
          matchingInput?.tracking_numbers_cn ??
          matchingInput?.tracking_cn_cn ??
          matchingInput?.china_tracking_number
        )
        const joined = Array.from(new Set(list)).join(", ")
        list.forEach((t) => trackingStrings.push(t))
        return {
          ...item,
          tracking_cn_cn: joined,
          china_tracking_number: joined,
          tracking_numbers_cn: Array.from(new Set(list)),
        }
      })
    } else {
      const list = splitTrackings(body.tracking_numbers ?? tracking_number)
      const cleanTn = Array.from(new Set(list)).join(", ")
      list.forEach((t) => trackingStrings.push(t))
      finalItems = currentItems.map((item: any) => ({
        ...item,
        tracking_cn_cn: cleanTn,
        china_tracking_number: cleanTn,
        tracking_numbers_cn: Array.from(new Set(list)),
      }))
    }

    const uniqueTrackings = Array.from(new Set(trackingStrings)).filter(Boolean)
    const trackingSummary = uniqueTrackings.join(", ")

    // 2. Update inquiries.items
    const { error: updateError } = await auth.supabase
      .from("inquiries")
      .update({
        items: finalItems,
        updated_at: new Date().toISOString(),
      })
      .eq("id", inquiry.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 409 })
    }

    // 3. Log to tracking_logs
    const logNote = trackingSummary
      ? `ร้านค้าจีนจัดส่งสินค้าแล้ว เลขแทร็กจีน: ${trackingSummary} (กำลังเดินทางไปโกดังจีน)`
      : `อัปเดตข้อมูลพัสดุจีน`

    await auth.supabase.from("tracking_logs").insert({
      order_id: id,
      status: "CHINA_TRANSIT",
      notes: logNote,
      created_by: auth.user.id,
    })

    // 4. Audit log
    await auth.supabase.from("admin_audit_logs").insert({
      actor_id: auth.user.id,
      action: "UPDATE_CHINA_TRACKING",
      entity_type: "order",
      entity_id: id,
      new_data: {
        tracking_summary: trackingSummary,
        items_count: finalItems.length,
      },
      reason: "บันทึกเลขแทร็กขนส่งจีน",
    })

    // 5. Send notification if customer_id exists and notify_customer is true
    let notificationSent = false
    if (order.customer_id && trackingSummary && notify_customer !== false) {
      notificationSent = await sendCustomerNotification(
        order.customer_id,
        `🚚 พัสดุจีนเริ่มจัดส่งแล้ว!\n📋 ออเดอร์: ${order.order_number}\n📦 เลขแทร็กจีน: ${trackingSummary}\nร้านค้าจัดส่งสินค้าแล้ว กำลังเดินทางไปยังโกดังจีน รอสินค้าถึงโกดังเพื่อประเมินค่าขนส่งรอบ 2 ต่อไปครับ\n👉 ติดตามสถานะได้ที่ https://www.sabuyship.com/dashboard/orders/${order.order_number}`,
      )
    }

    return NextResponse.json({
      success: true,
      tracking_summary: trackingSummary,
      notification_sent: notificationSent,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "ไม่สามารถบันทึกเลขแทร็กจีนได้" },
      { status: 500 },
    )
  }
}

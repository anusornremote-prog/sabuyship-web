import { NextResponse } from "next/server"

import { sendCustomerNotification } from "@/lib/notify"
import { requireAdmin } from "@/lib/require-admin"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  try {
    const { id } = await params
    const body = await request.json()
    const reason = typeof body.admin_note === "string" && body.admin_note.trim()
      ? body.admin_note.trim()
      : "สินค้าหมดจากร้านค้าจีน"
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "ไม่พบรายการสินค้า" }, { status: 400 })
    }

    const { data, error } = await auth.supabase.rpc("admin_record_out_of_stock", {
      p_order_id: id,
      p_items: body.items,
      p_cancel_entire_order: Boolean(body.cancel_entire_order),
      p_reason: reason,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 409 })
    const result = data as { customer_id?: string; order_number?: string; refund_amount?: number }
    const notificationSent = result.customer_id
      ? await sendCustomerNotification(
          result.customer_id,
          `📢 ออเดอร์ ${result.order_number} มีสินค้าหมด\n💰 ยอดรอดำเนินการคืน: ${Number(result.refund_amount || 0).toLocaleString("th-TH")} บาท\nแอดมินจะยืนยันการคืนเงินและแจ้งเลขอ้างอิงอีกครั้งค่ะ`,
        )
      : false
    return NextResponse.json({ success: true, ...result, notification_sent: notificationSent })
  } catch {
    return NextResponse.json({ error: "ไม่สามารถบันทึกสินค้าหมดได้" }, { status: 500 })
  }
}

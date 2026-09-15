import { NextResponse } from "next/server"

import { sendCustomerNotification } from "@/lib/notify"
import { requireAdmin } from "@/lib/require-admin"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  try {
    const { id } = await params
    const body = await request.json()
    const reason = typeof body.reason === "string" ? body.reason.trim() : ""
    if (!reason) return NextResponse.json({ error: "กรุณาระบุเหตุผลหรือช่องทางรับเงิน" }, { status: 400 })
    const { data, error } = await auth.supabase.rpc("admin_record_manual_payment", {
      p_order_id: id,
      p_reason: reason,
      p_payment_reference: typeof body.payment_reference === "string" ? body.payment_reference : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 409 })
    const result = data as { customer_id?: string; order_number?: string; payment_round?: number }
    const notificationSent = result.customer_id
      ? await sendCustomerNotification(result.customer_id, `✅ ได้รับชำระเงินรอบที่ ${result.payment_round} สำหรับออเดอร์ ${result.order_number} แล้วค่ะ`)
      : false
    return NextResponse.json({ success: true, data: result, notification_sent: notificationSent })
  } catch {
    return NextResponse.json({ error: "ไม่สามารถบันทึกการรับเงินได้" }, { status: 500 })
  }
}

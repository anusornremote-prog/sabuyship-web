import { NextResponse } from "next/server"

import { sendCustomerNotification } from "@/lib/notify"
import { requireAdmin } from "@/lib/require-admin"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  try {
    const { id } = await params
    const body = await request.json()
    const { data, error } = await auth.supabase.rpc("admin_update_refund", {
      p_refund_id: id,
      p_status: body.status,
      p_refund_method: body.refund_method || null,
      p_payment_reference: body.payment_reference || null,
      p_reason: body.reason || null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 409 })
    const result = data as { customer_id?: string; amount?: number; status?: string }
    const notificationSent = result.customer_id && result.status === "PAID"
      ? await sendCustomerNotification(result.customer_id, `✅ ดำเนินการคืนเงินจำนวน ${Number(result.amount).toLocaleString("th-TH")} บาทเรียบร้อยแล้วค่ะ`)
      : false
    return NextResponse.json({ success: true, data: result, notification_sent: notificationSent })
  } catch {
    return NextResponse.json({ error: "ไม่สามารถอัปเดตเงินคืนได้" }, { status: 500 })
  }
}

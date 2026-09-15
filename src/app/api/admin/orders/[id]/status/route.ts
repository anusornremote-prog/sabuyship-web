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
    if (!body.status || !reason) return NextResponse.json({ error: "กรุณาระบุสถานะและเหตุผล" }, { status: 400 })

    const { data, error } = await auth.supabase.rpc("admin_update_order_status", {
      p_order_id: id,
      p_status: body.status,
      p_tracking_number: typeof body.tracking_number === "string" ? body.tracking_number : "",
      p_shipping_company: typeof body.shipping_company === "string" ? body.shipping_company : "",
      p_reason: reason,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 409 })
    const result = data as { customer_id?: string; order_number?: string; status?: string }
    const notificationSent = result.customer_id
      ? await sendCustomerNotification(result.customer_id, `📦 อัปเดตออเดอร์ ${result.order_number}: ${reason}`)
      : false
    return NextResponse.json({ success: true, data: result, notification_sent: notificationSent })
  } catch {
    return NextResponse.json({ error: "ไม่สามารถอัปเดตสถานะได้" }, { status: 500 })
  }
}

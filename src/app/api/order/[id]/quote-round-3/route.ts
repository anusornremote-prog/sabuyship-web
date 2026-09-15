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
    const amount = Number(body.shipping_cost_th_th)
    if (!Number.isFinite(amount) || amount < 0 || amount > 10_000_000) {
      return NextResponse.json({ error: "ยอดค่าจัดส่งไม่ถูกต้อง" }, { status: 400 })
    }
    const updatedItems = body.updated_items === undefined ? null : body.updated_items
    if (updatedItems !== null && !Array.isArray(updatedItems)) {
      return NextResponse.json({ error: "รายการสินค้าต้องเป็น array" }, { status: 400 })
    }

    const { data, error } = await auth.supabase.rpc("admin_quote_shipping_round", {
      p_order_id: id,
      p_round: 3,
      p_amount: amount,
      p_updated_items: updatedItems,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 409 })

    const result = data as { customer_id?: string; order_number?: string }
    const notificationSent = result.customer_id
      ? await sendCustomerNotification(
          result.customer_id,
          amount > 0
            ? `📦 แจ้งยอดค่าจัดส่งในไทย (รอบ 3)\n📋 ออเดอร์: ${result.order_number}\n💰 ยอดชำระ: ฿${amount.toLocaleString("th-TH")}\n👉 ชำระเงินและแนบสลิปได้ที่ https://www.sabuyship.com/dashboard/orders/${result.order_number}`
            : `📦 ออเดอร์ ${result.order_number} ถึงโกดังไทยแล้ว และไม่มีค่าจัดส่งรอบ 3 เพิ่มเติมค่ะ`,
        )
      : false

    return NextResponse.json({ success: true, data: result, notification_sent: notificationSent })
  } catch {
    return NextResponse.json({ error: "ไม่สามารถบันทึกค่าขนส่งรอบ 3 ได้" }, { status: 500 })
  }
}

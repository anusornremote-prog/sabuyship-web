import { NextResponse } from "next/server"

import { sendCustomerNotification } from "@/lib/notify"
import { requireAdmin } from "@/lib/require-admin"

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const body = await request.json()
    const productCost = Number(body.product_cost)
    const chinaShipping = Number(body.shipping_cost_cn_cn || 0)
    const otherFee = Number(body.other_fee || 0)
    if (typeof body.inquiry_id !== "string" || !body.inquiry_id
      || ![productCost, chinaShipping, otherFee].every(Number.isFinite)
      || [productCost, chinaShipping, otherFee].some((amount) => amount < 0 || amount > 100_000_000)
      || (body.updated_items !== undefined && !Array.isArray(body.updated_items))) {
      return NextResponse.json({ error: "Invalid quotation details" }, { status: 400 })
    }

    const { data, error } = await auth.supabase.rpc("admin_upsert_round1_quotation", {
      p_inquiry_id: body.inquiry_id,
      p_quotation_id: typeof body.quotation_id === "string" ? body.quotation_id : null,
      p_product_cost: productCost,
      p_shipping_cost_cn_cn: chinaShipping,
      p_other_fee: otherFee,
      p_updated_items: body.updated_items ?? null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 409 })

    const result = data as { customer_id: string; inquiry_number: string; total_price: number }
    const formattedTotal = Number(result.total_price).toLocaleString("th-TH")
    const notificationSent = await sendCustomerNotification(
      result.customer_id,
      `🧾 ใบเสนอราคารอบ 1\nคำขอ: ${result.inquiry_number}\nยอดชำระ: ฿${formattedTotal}\nตรวจสอบและยืนยันได้ที่ https://www.sabuyship.com/dashboard/orders`,
    )
    return NextResponse.json({ success: true, data: result, notification_sent: notificationSent }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Unable to save quotation" }, { status: 500 })
  }
}

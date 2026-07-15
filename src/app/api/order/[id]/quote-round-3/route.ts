import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: orderId } = await params
    const body = await request.json()

    // Admins must be authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (!profile || profile.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 })
    }

    if (body.shipping_cost_th_th === undefined) {
      return NextResponse.json({ error: "Missing shipping_cost_th_th" }, { status: 400 })
    }

    // Get order to find quotation_id
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, quotation_id, payment_round_3_status")
      .eq("id", orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (!order.quotation_id) {
      return NextResponse.json({ error: "No quotation linked to this order" }, { status: 400 })
    }

    // Get current quotation to update total_price
    const { data: quotation } = await supabase
      .from("quotations")
      .select("*")
      .eq("id", order.quotation_id)
      .single()

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
    }

    const newShippingCost = Number(body.shipping_cost_th_th)
    const oldShippingCost = Number(quotation.shipping_cost_th_th || 0)
    const newTotal = Number(quotation.total_price || 0) - oldShippingCost + newShippingCost

    // Update Quotation
    const { error: updateError } = await supabase
      .from("quotations")
      .update({
        shipping_cost_th_th: newShippingCost,
        total_price: newTotal
      })
      .eq("id", order.quotation_id)

    if (updateError) throw updateError

    // 2. Update inquiry items if provided
    if (body.updated_items && body.inquiry_id) {
      const { error: inquiryError } = await supabase
        .from("inquiries")
        .update({ items: body.updated_items })
        .eq("id", body.inquiry_id)
      
      if (inquiryError) throw inquiryError
    }

    // 3. Update Order payment_round_3_status to PENDING (or PAID if cost is 0) and status to THAILAND_WAREHOUSE
    const orderUpdates: any = { status: 'THAILAND_WAREHOUSE' }
    if (order.payment_round_3_status !== 'PAID') {
      orderUpdates.payment_round_3_status = newShippingCost === 0 ? 'PAID' : 'PENDING'
    }

    await supabase
      .from("orders")
      .update(orderUpdates)
      .eq("id", orderId)

    // Add tracking log for Quotation
    await supabase.from("tracking_logs").insert({
      order_id: orderId,
      status: "QUOTED_ROUND_3",
      notes: `อัปเดตค่าจัดส่งในไทย (รอบ 3) เป็นจำนวน ${newShippingCost.toLocaleString('th-TH')} บาท`
    })

    if (newShippingCost === 0 && order.payment_round_3_status !== 'PAID') {
      await supabase.from("tracking_logs").insert({
        order_id: orderId,
        status: "PAID_ROUND_3",
        notes: "ชำระเงินรอบที่ 3 อัตโนมัติ (ไม่มีค่าใช้จ่ายเพิ่มเติม)"
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

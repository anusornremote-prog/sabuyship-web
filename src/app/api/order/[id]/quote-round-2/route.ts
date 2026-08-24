import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendCustomerNotification } from "@/lib/notify"

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

    if (body.shipping_cost_cn_th === undefined) {
      return NextResponse.json({ error: "Missing shipping_cost_cn_th" }, { status: 400 })
    }

    // Get order to find quotation_id
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    let orderQuery = supabase
      .from("orders")
      .select("id, customer_id, quotation_id, payment_round_2_status")
      
    if (isUUID) {
      orderQuery = orderQuery.eq("id", orderId)
    } else {
      orderQuery = orderQuery.eq("order_number", orderId)
    }
    
    const { data: order, error: orderError } = await orderQuery.single()

    if (orderError || !order) {
      return NextResponse.json({ error: `Order not found. Query by: ${isUUID ? "id" : "order_number"}, Value: ${orderId}, Error: ${orderError?.message}` }, { status: 404 })
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

    const newShippingCost = Number(body.shipping_cost_cn_th)
    const oldShippingCost = Number(quotation.shipping_cost_cn_th || 0)
    const newTotal = Number(quotation.total_price || 0) - oldShippingCost + newShippingCost

    // Update Quotation
    const { error: updateError } = await supabase
      .from("quotations")
      .update({
        shipping_cost_cn_th: newShippingCost,
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

    // 3. Update Order payment_round_2_status to PENDING (or PAID if cost is 0) and status to CHINA_WAREHOUSE (or SHIPPING if cost is 0)
    const orderUpdates: any = {}
    if (order.payment_round_2_status !== 'PAID') {
      if (newShippingCost === 0) {
        orderUpdates.payment_round_2_status = 'PAID'
        orderUpdates.status = 'SHIPPING'
      } else {
        orderUpdates.payment_round_2_status = 'PENDING'
        orderUpdates.status = 'CHINA_WAREHOUSE'
      }
    } else {
      orderUpdates.status = 'CHINA_WAREHOUSE'
    }

    await supabase
      .from("orders")
      .update(orderUpdates)
      .eq("id", order.id)

    // Add tracking log for Quotation
    await supabase.from("tracking_logs").insert({
      order_id: order.id,
      status: "QUOTED_ROUND_2",
      notes: `อัปเดตค่าจัดส่ง จีน-ไทย (รอบ 2) เป็นจำนวน ${newShippingCost.toLocaleString('th-TH')} บาท`
    })

    if (newShippingCost === 0 && order.payment_round_2_status !== 'PAID') {
      await supabase.from("tracking_logs").insert({
        order_id: order.id,
        status: "PAID_ROUND_2",
        notes: "ชำระเงินรอบที่ 2 อัตโนมัติ (ไม่มีค่าใช้จ่ายเพิ่มเติม)"
      })
    }

    if (order.customer_id && newShippingCost > 0) {
      const formattedCost = new Intl.NumberFormat('th-TH').format(newShippingCost)
      await sendCustomerNotification(
        order.customer_id,
        `🚚 แจ้งยอดค่าขนส่ง จีน-ไทย (รอบ 2)\n` +
        `━━━━━━━━━━━━━━━\n` +
        `📋 ออเดอร์: ${order.order_number}\n` +
        `💰 ยอดชำระ: ฿${formattedCost}\n` +
        `━━━━━━━━━━━━━━━\n` +
        `👉 ชำระเงินและแนบสลิปได้ที่: https://www.sabuyship.com/dashboard/orders/${order.order_number}`
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

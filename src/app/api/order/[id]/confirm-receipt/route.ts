import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: orderId } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    let orderQuery = supabase
      .from("orders")
      .select("id, status, customer_id")
      
    if (isUUID) {
      orderQuery = orderQuery.eq("id", orderId)
    } else {
      orderQuery = orderQuery.eq("order_number", orderId)
    }
    
    const { data: order, error: orderError } = await orderQuery.single()

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.customer_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (order.status !== 'OUT_FOR_DELIVERY') {
      return NextResponse.json({ error: "Invalid status for confirming receipt" }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const deliveredAt = new Date().toISOString()
    const { error: updateError } = await adminClient
      .from("orders")
      .update({ status: 'DELIVERED', delivered_at: deliveredAt })
      .eq("id", order.id)
      .eq("customer_id", user.id)
      .eq("status", "OUT_FOR_DELIVERY")

    if (updateError) throw updateError

    const { error: logError } = await adminClient.from("tracking_logs").insert({
      order_id: order.id,
      status: "DELIVERED",
      notes: "ลูกค้ายืนยันการได้รับสินค้าเรียบร้อยแล้ว (การขนส่งเสร็จสิ้น)",
      created_by: user.id,
    })
    if (logError) throw logError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

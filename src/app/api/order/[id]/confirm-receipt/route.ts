import { NextResponse } from "next/server"
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

    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: 'DELIVERED' })
      .eq("id", order.id)

    if (updateError) throw updateError

    await supabase.from("tracking_logs").insert({
      order_id: order.id,
      status: "DELIVERED",
      notes: "ลูกค้ายืนยันการได้รับสินค้าเรียบร้อยแล้ว (การขนส่งเสร็จสิ้น)"
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

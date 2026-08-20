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

    const { items, inquiry_id, total_refund_amount, cancel_entire_order, admin_note } = body

    if (!items || !Array.isArray(items) || !inquiry_id) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ครบถ้วน: กรุณาระบุ items และ inquiry_id" },
        { status: 400 }
      )
    }

    // 1. Verify User is Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: สำหรับแอดมินเท่านั้น" }, { status: 403 })
    }

    // 2. Fetch current Order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, order_number, customer_id, status")
      .eq("id", orderId)
      .single()

    if (orderErr || !order) {
      return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 })
    }

    // 3. Update Inquiry Items
    const { error: inqError } = await supabase
      .from("inquiries")
      .update({ items: items })
      .eq("id", inquiry_id)

    if (inqError) throw inqError

    // 4. Update Order status if canceled
    const refundNumber = Number(total_refund_amount) || 0
    const formattedRefund = new Intl.NumberFormat('th-TH').format(refundNumber)

    if (cancel_entire_order) {
      await supabase
        .from("orders")
        .update({ status: "CANCELED" })
        .eq("id", orderId)

      await supabase.from("tracking_logs").insert({
        order_id: orderId,
        status: "ORDER_CANCELED",
        notes: `ยกเลิกคำสั่งซื้อเนื่องจากสินค้าหมดทุกรายการ (ยอดเงินคืน ฿${formattedRefund}) ${admin_note ? `- ${admin_note}` : ''}`
      })

      if (order.customer_id) {
        await sendCustomerNotification(
          order.customer_id,
          `⚠️ คำสั่งซื้อ ${order.order_number} ถูกยกเลิก\nเนื่องจากสินค้าหมดจากร้านค้าจีนทุกรายการ\n💰 ยอดเงินคืน: ${formattedRefund} บาท\nกรุณาติดต่อแอดมินเพื่อรับเงินโอนคืนค่ะ`
        )
      }
    } else {
      await supabase.from("tracking_logs").insert({
        order_id: orderId,
        status: "ITEM_OUT_OF_STOCK",
        notes: `แจ้งสินค้าหมดบางรายการ (ยอดเงินคืนสะสม ฿${formattedRefund}) ${admin_note ? `- ${admin_note}` : ''}`
      })

      if (order.customer_id && refundNumber > 0) {
        await sendCustomerNotification(
          order.customer_id,
          `📢 แจ้งเตือน: มีสินค้าบางรายการในออเดอร์ ${order.order_number} หมดจากร้านค้าจีน\n💰 ยอดเงินคืน: ${formattedRefund} บาท\n(ยอดนี้จะถูกนำไปหักลบในค่าส่งรอบถัดไป หรือติดต่อแอดมินเพื่อขอรับเงินโอนคืนค่ะ)`
        )
      }
    }

    return NextResponse.json({ 
      success: true, 
      total_refund_amount: refundNumber,
      is_canceled: !!cancel_entire_order 
    })
  } catch (error: any) {
    console.error("Error in out-of-stock API:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

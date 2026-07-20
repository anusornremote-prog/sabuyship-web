import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendAdminNotification } from "@/lib/notify"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Validate authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { event, data } = body

    if (event === 'PAYMENT_UPLOADED') {
      const { orderId, amount, round } = data
      
      // Get order number for the notification
      const { data: order } = await supabase
        .from('orders')
        .select('order_number')
        .eq('id', orderId)
        .single()
        
      const orderNumber = order?.order_number || orderId

      await sendAdminNotification(`💰 ลูกค้าแนบสลิปชำระเงินแล้ว!\nออเดอร์: ${orderNumber}\nรอบที่: ${round}\nยอดเงิน: ${amount} บาท\nเข้าไปตรวจสลิปด่วน: https://www.sabuyship.com/admin/orders`);
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error("Notify API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

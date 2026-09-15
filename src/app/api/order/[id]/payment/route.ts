import { NextResponse } from "next/server"

import { sendAdminNotification } from "@/lib/notify"
import { isPaymentConfigured } from "@/lib/public-business-config"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!isPaymentConfigured) {
      return NextResponse.json({ error: "Payment channel is not available" }, { status: 503 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id: orderId } = await params
    const body = await request.json()
    const paymentRound = Number(body.payment_round)
    const amount = Number(body.amount)
    const slipPath = typeof body.slip_path === "string" ? body.slip_path.trim() : ""
    const paymentDate = body.payment_date ? new Date(body.payment_date) : new Date()

    if (![1, 2, 3].includes(paymentRound) || !Number.isFinite(amount) || amount <= 0 || Number.isNaN(paymentDate.getTime())) {
      return NextResponse.json({ error: "Invalid payment details" }, { status: 400 })
    }

    const expectedPrefix = `${user.id}/${orderId}/`
    if (!slipPath.startsWith(expectedPrefix) || slipPath.includes("..")) {
      return NextResponse.json({ error: "Invalid payment slip path" }, { status: 400 })
    }

    const { data, error } = await supabase.rpc("customer_submit_payment", {
      p_order_id: orderId,
      p_payment_round: paymentRound,
      p_amount: amount,
      p_payment_date: paymentDate.toISOString(),
      p_slip_path: slipPath,
    })
    if (error) {
      const status = /not found/i.test(error.message) ? 404 : /not accepting|already exists/i.test(error.message) ? 409 : 400
      return NextResponse.json({ error: error.message }, { status })
    }

    const result = data as {
      order_number: string
      customer_name: string
      payment_round: number
      amount: number
    }
    const notified = await sendAdminNotification(
      `💰 ลูกค้าคุณ ${result.customer_name} แนบสลิปชำระเงินแล้ว\nออเดอร์: ${result.order_number}\nรอบที่: ${result.payment_round}\nยอดเงิน: ${Number(result.amount).toLocaleString("th-TH")} บาท`,
    )

    return NextResponse.json({ success: true, notification_sent: notified }, { status: 201 })
  } catch (error: unknown) {
    console.error("Payment submission failed", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

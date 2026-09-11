import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

type PaymentRound = 1 | 2 | 3

const roundColumns: Record<PaymentRound, string> = {
  1: "payment_round_1_status",
  2: "payment_round_2_status",
  3: "payment_round_3_status",
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionClient = await createClient()
    const {
      data: { user },
    } = await sessionClient.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id: orderId } = await params
    const body = await request.json()
    const paymentRound = Number(body.payment_round) as PaymentRound
    const amount = Number(body.amount)

    if (![1, 2, 3].includes(paymentRound) || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid payment details" }, { status: 400 })
    }

    const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const slipUrl = typeof body.slip_url === "string" ? body.slip_url : ""
    if (!projectUrl) throw new Error("Supabase URL is not configured")

    const expectedHost = new URL(projectUrl).host
    let parsedSlipUrl: URL
    try {
      parsedSlipUrl = new URL(slipUrl)
    } catch {
      return NextResponse.json({ error: "Invalid payment slip URL" }, { status: 400 })
    }
    if (
      parsedSlipUrl.host !== expectedHost ||
      !parsedSlipUrl.pathname.startsWith("/storage/v1/object/public/payment_slips/")
    ) {
      return NextResponse.json({ error: "Invalid payment slip source" }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const { data: order, error: orderError } = await adminClient
      .from("orders")
      .select(`
        id,
        customer_id,
        payment_round_1_status,
        payment_round_2_status,
        payment_round_3_status,
        quotation:quotation_id (
          product_cost,
          shipping_cost_cn_cn,
          shipping_cost_cn_th,
          shipping_cost_th_th
        )
      `)
      .eq("id", orderId)
      .maybeSingle()

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }
    if (order.customer_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const quotation = order.quotation as unknown as {
      product_cost: number | null
      shipping_cost_cn_cn: number | null
      shipping_cost_cn_th: number | null
      shipping_cost_th_th: number | null
    }
    const expectedAmounts: Record<PaymentRound, number> = {
      1: Number(quotation?.product_cost || 0) + Number(quotation?.shipping_cost_cn_cn || 0),
      2: Number(quotation?.shipping_cost_cn_th || 0),
      3: Number(quotation?.shipping_cost_th_th || 0),
    }
    if (Math.abs(amount - expectedAmounts[paymentRound]) > 0.01) {
      return NextResponse.json({ error: "Payment amount does not match this round" }, { status: 400 })
    }

    const roundColumn = roundColumns[paymentRound]
    const currentStatus = order[roundColumn as keyof typeof order]
    if (currentStatus !== "PENDING" && currentStatus !== "REJECTED") {
      return NextResponse.json({ error: "This payment round is not accepting a slip" }, { status: 409 })
    }

    const { data: existingPayment } = await adminClient
      .from("payments")
      .select("id")
      .eq("order_id", orderId)
      .eq("payment_round", paymentRound)
      .in("status", ["PENDING", "APPROVED"])
      .maybeSingle()
    if (existingPayment) {
      return NextResponse.json({ error: "A payment for this round already exists" }, { status: 409 })
    }

    const paymentDate = body.payment_date ? new Date(body.payment_date) : new Date()
    if (Number.isNaN(paymentDate.getTime())) {
      return NextResponse.json({ error: "Invalid payment date" }, { status: 400 })
    }

    const { data: payment, error: paymentError } = await adminClient
      .from("payments")
      .insert({
        order_id: orderId,
        payment_round: paymentRound,
        amount,
        payment_date: paymentDate.toISOString(),
        slip_url: slipUrl,
        status: "PENDING",
      })
      .select("id")
      .single()
    if (paymentError) throw paymentError

    const { error: updateError } = await adminClient
      .from("orders")
      .update({ [roundColumn]: "UPLOADED" })
      .eq("id", orderId)
      .eq("customer_id", user.id)

    if (updateError) {
      await adminClient.from("payments").delete().eq("id", payment.id)
      throw updateError
    }

    const { error: logError } = await adminClient.from("tracking_logs").insert({
      order_id: orderId,
      status: `UPLOADED_ROUND_${paymentRound}`,
      notes: `แนบหลักฐานชำระเงิน รอบที่ ${paymentRound} (ยอด ${amount} บาท)`,
      created_by: user.id,
    })

    if (logError) {
      await adminClient.from("orders").update({ [roundColumn]: currentStatus }).eq("id", orderId)
      await adminClient.from("payments").delete().eq("id", payment.id)
      throw logError
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextResponse } from "next/server"

import { hasValidApiKey } from "@/lib/api-auth"
import { sendAdminNotification } from "@/lib/notify"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

// POST /api/order - Create an order from an accepted quotation.
export async function POST(request: Request) {
  try {
    const sessionClient = await createClient()
    const adminClient = createAdminClient()
    const apiKeyAuthorized = hasValidApiKey(request)
    const {
      data: { user },
    } = await sessionClient.auth.getUser()

    if (!apiKeyAuthorized && !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const targetCustomerId = apiKeyAuthorized ? body.customer_id : user?.id

    if (!targetCustomerId || !body.quotation_id) {
      return NextResponse.json(
        { error: "Missing required fields: customer_id, quotation_id" },
        { status: 400 },
      )
    }

    const { data: quotation, error: quotationError } = await adminClient
      .from("quotations")
      .select("id, inquiry_id, status, inquiries!inner(customer_id, inquiry_number)")
      .eq("id", body.quotation_id)
      .maybeSingle()

    const inquiry = quotation?.inquiries as unknown as {
      customer_id: string | null
      inquiry_number: string
    } | null

    if (quotationError || !quotation || !inquiry) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
    }

    if (inquiry.customer_id !== targetCustomerId) {
      return NextResponse.json({ error: "Invalid quotation or unauthorized" }, { status: 403 })
    }

    if (body.shipping_address_id) {
      const { data: address } = await adminClient
        .from("addresses")
        .select("id")
        .eq("id", body.shipping_address_id)
        .eq("customer_id", targetCustomerId)
        .maybeSingle()

      if (!address) {
        return NextResponse.json({ error: "Invalid shipping address" }, { status: 400 })
      }
    }

    const orderNumber = inquiry.inquiry_number
    const { data: existingOrder, error: existingOrderError } = await adminClient
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber)
      .maybeSingle()

    if (existingOrderError) throw existingOrderError
    if (existingOrder) {
      if (existingOrder.customer_id !== targetCustomerId) {
        return NextResponse.json({ error: "Order number conflict" }, { status: 409 })
      }
      return NextResponse.json(
        { success: true, data: existingOrder, order: existingOrder, existing: true },
        { status: 200 },
      )
    }

    const { data: order, error: orderError } = await adminClient
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_id: targetCustomerId,
        quotation_id: quotation.id,
        status: "WAITING_PAYMENT",
        payment_round_1_status: "PENDING",
        admin_notes: body.admin_notes || null,
        shipping_address_id: body.shipping_address_id || null,
      })
      .select()
      .single()

    if (orderError) throw orderError

    const { error: trackingError } = await adminClient.from("tracking_logs").insert({
      order_id: order.id,
      status: "WAITING_PAYMENT",
      notes: "สร้างคำสั่งซื้อและรอชำระเงินรอบที่ 1",
      created_by: user?.id || null,
    })

    if (trackingError) {
      await adminClient.from("orders").delete().eq("id", order.id)
      throw trackingError
    }

    const { error: quotationUpdateError } = await adminClient
      .from("quotations")
      .update({ status: "ACCEPTED" })
      .eq("id", quotation.id)
    if (quotationUpdateError) throw quotationUpdateError

    const { error: inquiryUpdateError } = await adminClient
      .from("inquiries")
      .update({ status: "ORDERED" })
      .eq("id", quotation.inquiry_id)
    if (inquiryUpdateError) throw inquiryUpdateError

    try {
      await sendAdminNotification(
        `✅ ลูกค้ายอมรับใบเสนอราคาแล้ว!\nออเดอร์ถูกสร้าง: ${orderNumber}\nตรวจสอบในระบบด่วน: https://www.sabuyship.com/admin/orders`,
      )
    } catch (notificationError) {
      console.error("Order notification failed:", notificationError)
    }

    return NextResponse.json(
      { success: true, data: order, order },
      { status: 201 },
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import crypto from "node:crypto"
import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

type NormalizedItem = {
  product_url: string
  product_name: string
  product_options: string
  quantity: number
  unit_price: number
}

export async function POST(request: Request) {
  try {
    const sessionClient = await createClient()
    const {
      data: { user },
    } = await sessionClient.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: actor } = await sessionClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()
    if (actor?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const items = Array.isArray(body.items) ? body.items : []
    if (!body.customer_id || items.length === 0 || !["NEW", "PAID"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid order details" }, { status: 400 })
    }

    const normalizedItems: NormalizedItem[] = items.map((item: Record<string, unknown>) => ({
      product_url: typeof item.product_url === "string" ? item.product_url.trim() : "",
      product_name: typeof item.product_name === "string" ? item.product_name.trim() : "",
      product_options: typeof item.product_options === "string" ? item.product_options.trim() : "",
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
    }))
    if (normalizedItems.some((item) => !item.product_name || !Number.isInteger(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.unit_price) || item.unit_price < 0)) {
      return NextResponse.json({ error: "Invalid item details" }, { status: 400 })
    }

    const shippingCost = Number(body.shipping_cost_cn_cn || 0)
    if (!Number.isFinite(shippingCost) || shippingCost < 0) {
      return NextResponse.json({ error: "Invalid shipping cost" }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const { data: customer } = await adminClient
      .from("profiles")
      .select("id, full_name, phone, line_id")
      .eq("id", body.customer_id)
      .eq("role", "CUSTOMER")
      .eq("is_active", true)
      .maybeSingle()
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 })

    const date = new Date()
    const orderNumber = `ORD-${date.getFullYear().toString().slice(-2)}${String(date.getMonth() + 1).padStart(2, "0")}${crypto.randomBytes(3).toString("hex").toUpperCase()}`
    const productCost = normalizedItems.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0,
    )
    const totalPrice = productCost + shippingCost
    let inquiryId: string | null = null
    let quotationId: string | null = null
    let orderId: string | null = null

    try {
      const { data: inquiry, error: inquiryError } = await adminClient
        .from("inquiries")
        .insert({
          inquiry_number: orderNumber,
          customer_id: customer.id,
          customer_name: customer.full_name || "Manual Customer",
          phone: customer.phone || "-",
          line_id: customer.line_id,
          product_url: normalizedItems[0].product_url || "Manual Order",
          product_name: normalizedItems[0].product_name,
          quantity: normalizedItems.reduce((sum, item) => sum + item.quantity, 0),
          items: normalizedItems,
          shipping_type: "CAR",
          service_type: "BUY_AND_IMPORT",
          notes: "สร้างโดยแอดมิน (Manual)",
          status: "ORDERED",
        })
        .select("id")
        .single()
      if (inquiryError) throw inquiryError
      inquiryId = inquiry.id

      const { data: quotation, error: quotationError } = await adminClient
        .from("quotations")
        .insert({
          inquiry_id: inquiry.id,
          customer_id: customer.id,
          product_cost: productCost,
          shipping_cost_cn_cn: shippingCost,
          total_price: totalPrice,
          admin_notes: "สร้างโดยแอดมิน (Manual)",
          valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: "ACCEPTED",
        })
        .select("id")
        .single()
      if (quotationError) throw quotationError
      quotationId = quotation.id

      const alreadyPaid = body.status === "PAID"
      const { data: order, error: orderError } = await adminClient
        .from("orders")
        .insert({
          customer_id: customer.id,
          quotation_id: quotation.id,
          order_number: orderNumber,
          status: alreadyPaid ? "ORDERED" : "WAITING_PAYMENT",
          payment_round_1_status: alreadyPaid ? "PAID" : "PENDING",
        })
        .select("id, order_number")
        .single()
      if (orderError) throw orderError
      orderId = order.id

      const { error: logError } = await adminClient.from("tracking_logs").insert({
        order_id: order.id,
        status: alreadyPaid ? "PAID_ROUND_1" : "WAITING_PAYMENT",
        notes: alreadyPaid
          ? "สร้างออเดอร์ด้วยมือและยืนยันการชำระรอบที่ 1 แล้ว"
          : "สร้างออเดอร์ด้วยมือและรอชำระเงินรอบที่ 1",
        created_by: user.id,
      })
      if (logError) throw logError

      return NextResponse.json({ success: true, data: order }, { status: 201 })
    } catch (error) {
      if (orderId) {
        await adminClient.from("tracking_logs").delete().eq("order_id", orderId)
        await adminClient.from("orders").delete().eq("id", orderId)
      }
      if (quotationId) await adminClient.from("quotations").delete().eq("id", quotationId)
      if (inquiryId) await adminClient.from("inquiries").delete().eq("id", inquiryId)
      throw error
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextResponse } from "next/server"

import { hasValidApiKey } from "@/lib/api-auth"
import { createAdminClient } from "@/lib/supabase/admin"

const validStatuses = new Set([
  "NEW",
  "QUOTED",
  "WAITING_PAYMENT",
  "PAYMENT_REJECTED",
  "PAID",
  "ORDERED",
  "CHINA_WAREHOUSE",
  "SHIPPING",
  "THAILAND_WAREHOUSE",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELED",
])

// POST /api/tracking - Add a tracking event from an authorized integration.
export async function POST(request: Request) {
  try {
    if (!hasValidApiKey(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    if (!body.order_id || !validStatuses.has(body.status)) {
      return NextResponse.json({ error: "Invalid order_id or status" }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const { data: order, error: orderError } = await adminClient
      .from("orders")
      .select("id, status")
      .eq("id", body.order_id)
      .maybeSingle()
    if (orderError) throw orderError
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })

    const { error: updateError } = await adminClient
      .from("orders")
      .update({
        status: body.status,
        delivered_at: body.status === "DELIVERED" ? new Date().toISOString() : undefined,
      })
      .eq("id", order.id)
    if (updateError) throw updateError

    const { data: log, error: logError } = await adminClient
      .from("tracking_logs")
      .insert({
        order_id: order.id,
        status: body.status,
        notes: body.notes || null,
      })
      .select()
      .single()

    if (logError) {
      await adminClient.from("orders").update({ status: order.status }).eq("id", order.id)
      throw logError
    }

    return NextResponse.json({ success: true, data: log }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

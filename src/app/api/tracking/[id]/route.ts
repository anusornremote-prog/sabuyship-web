import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"

// Public tracking response. Keep this payload free of customer contact, address,
// payment, and internal admin information.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const rawSearch = decodeURIComponent(id).trim()
    if (!/^[a-zA-Z0-9-]{4,80}$/.test(rawSearch)) {
      return NextResponse.json({ error: "Invalid tracking number" }, { status: 400 })
    }

    const normalizedOrderNumber = /^\d+$/.test(rawSearch)
      ? `ORD-${rawSearch}`
      : rawSearch.toUpperCase()
    const adminClient = createAdminClient()
    const selection = `
      id,
      order_number,
      status,
      tracking_number,
      shipping_company,
      created_at,
      quotation:quotation_id (
        inquiry:inquiry_id (
          product_url,
          items,
          shipping_type
        )
      ),
      shipments (
        tracking_number,
        container_date,
        arrival_date,
        thailand_tracking_number,
        status
      )
    `

    let { data: order, error } = await adminClient
      .from("orders")
      .select(selection)
      .eq("order_number", normalizedOrderNumber)
      .maybeSingle()

    if (!order && !error) {
      const trackingResult = await adminClient
        .from("orders")
        .select(selection)
        .eq("tracking_number", rawSearch)
        .maybeSingle()
      order = trackingResult.data
      error = trackingResult.error
    }

    if (error) throw error
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })

    return NextResponse.json({ success: true, data: order })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

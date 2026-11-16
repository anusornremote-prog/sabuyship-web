import { NextResponse } from "next/server"

import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { createAdminClient } from "@/lib/supabase/admin"

function sanitizeTrackingInquiry(rawQuotation: unknown) {
  const quotation = Array.isArray(rawQuotation) ? rawQuotation[0] : rawQuotation
  const rawInquiry = (quotation as { inquiry?: unknown } | null | undefined)?.inquiry
  const inquiry = Array.isArray(rawInquiry) ? rawInquiry[0] : rawInquiry
  if (!inquiry || typeof inquiry !== "object") return null

  const typedInquiry = inquiry as { shipping_type?: unknown; items?: unknown }
  let rawItems: unknown[] = []
  if (Array.isArray(typedInquiry.items)) {
    rawItems = typedInquiry.items
  } else if (typeof typedInquiry.items === "string") {
    try {
      const parsed = JSON.parse(typedInquiry.items)
      if (Array.isArray(parsed)) rawItems = parsed
    } catch {
      rawItems = []
    }
  }

  // Expose only China tracking numbers needed for the public tracker; omit supplier URLs, prices, and remarks.
  const sanitizedItems = rawItems
    .map((item) => {
      if (!item || typeof item !== "object") return ""
      const record = item as Record<string, unknown>
      const val = record.tracking_cn_cn ?? record.china_tracking_number ?? ""
      return typeof val === "string" ? val.trim() : ""
    })
    .filter(Boolean)
    .map((tracking) => ({ tracking_cn_cn: tracking }))

  return {
    inquiry: {
      shipping_type: typeof typedInquiry.shipping_type === "string" ? typedInquiry.shipping_type : null,
      items: sanitizedItems,
    },
  }
}

// Public tracking response. Keep this payload free of customer contact, address,
// payment, supplier product links/prices, and internal admin information.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimit = checkRateLimit(request, {
    namespace: "public-tracking",
    limit: 20,
    windowMs: 60_000,
  })
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds)
  }

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

    const sanitizedOrder = {
      ...order,
      quotation: sanitizeTrackingInquiry(order.quotation),
    }

    return NextResponse.json({ success: true, data: sanitizedOrder })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

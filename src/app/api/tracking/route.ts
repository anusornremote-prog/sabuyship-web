import { NextResponse } from "next/server"

import { hasValidApiKey } from "@/lib/api-auth"
import { createAdminClient } from "@/lib/supabase/admin"

const validStatuses = new Set([
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
    const { data, error } = await adminClient.rpc("integration_update_tracking", {
      p_order_id: body.order_id,
      p_status: body.status,
      p_notes: typeof body.notes === "string" ? body.notes : null,
    })
    if (error) {
      const status = /not found/i.test(error.message) ? 404 : 409
      return NextResponse.json({ error: error.message }, { status })
    }
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

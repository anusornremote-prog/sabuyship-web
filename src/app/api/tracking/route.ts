import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST /api/tracking - Add a tracking event (Node-RED integration)
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    if (!body.order_id || !body.status) {
      return NextResponse.json(
        { error: "Missing required fields: order_id, status" },
        { status: 400 }
      )
    }

    const validStatuses = [
      'NEW', 'QUOTED', 'WAITING_PAYMENT', 'PAID', 'ORDERED',
      'CHINA_WAREHOUSE', 'SHIPPING', 'THAILAND_WAREHOUSE',
      'OUT_FOR_DELIVERY', 'DELIVERED'
    ]

    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 })
    }

    // 1. Insert tracking log
    const { data: logData, error: logError } = await supabase
      .from("tracking_logs")
      .insert({
        order_id: body.order_id,
        status: body.status,
        notes: body.notes || null
      })
      .select()
      .single()

    if (logError) throw logError

    // 2. Update order status
    await supabase.from("orders").update({ status: body.status }).eq("id", body.order_id)

    return NextResponse.json({ success: true, data: logData }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST /api/quotation - Create a quotation (Node-RED integration)
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    if (!body.inquiry_id || body.product_cost === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: inquiry_id, product_cost" },
        { status: 400 }
      )
    }

    const total = 
      (body.product_cost || 0) + 
      (body.shipping_fee || 0) + 
      (body.other_fee || 0)

    const { data, error } = await supabase
      .from("quotations")
      .insert({
        inquiry_id: body.inquiry_id,
        product_cost: body.product_cost,
        shipping_fee: body.shipping_fee || 0,
        other_fee: body.other_fee || 0,
        total_price: total,
        status: "SENT"
      })
      .select()
      .single()

    if (error) throw error

    // Update inquiry status and optionally the items breakdown
    const updatePayload: any = { status: "QUOTED" }
    if (body.updated_items) {
      updatePayload.items = body.updated_items
    }
    await supabase.from("inquiries").update(updatePayload).eq("id", body.inquiry_id)

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

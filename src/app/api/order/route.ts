import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST /api/order - Create an order (Node-RED integration)
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    if (!body.customer_id || !body.quotation_id) {
      return NextResponse.json(
        { error: "Missing required fields: customer_id, quotation_id" },
        { status: 400 }
      )
    }

    // Next order number logic could be complex, simple timestamp for MVP
    const date = new Date()
    const orderNumber = `ORD-${date.getFullYear().toString().substring(2)}${String(date.getMonth() + 1).padStart(2, '0')}${Math.floor(1000 + Math.random() * 9000)}`

    const { data, error } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_id: body.customer_id,
        quotation_id: body.quotation_id,
        status: "NEW",
        admin_notes: body.admin_notes || null,
        shipping_address_id: body.shipping_address_id || null
      })
      .select()
      .single()

    if (error) throw error

    // Initial tracking log
    await supabase.from("tracking_logs").insert({
      order_id: data.id,
      status: "NEW",
      notes: "Order created"
    })

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

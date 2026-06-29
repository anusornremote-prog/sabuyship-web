import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

// POST /api/order - Create an order (Node-RED integration or external API)
export async function POST(request: Request) {
  try {
    // 1. Check API Key
    const apiKey = request.headers.get("x-api-key")
    if (!apiKey || apiKey !== process.env.SABUY_API_KEY) {
      return NextResponse.json({ error: "Unauthorized: Invalid API Key" }, { status: 401 })
    }

    // 2. Use Service Role Key to bypass RLS for background tasks
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseServiceKey) {
      return NextResponse.json({ error: "Server Configuration Error: Missing Service Role Key" }, { status: 500 })
    }

    const supabase = createServerClient(supabaseUrl, supabaseServiceKey, {
      cookies: {
        get() { return null },
        set() {},
        remove() {}
      }
    })
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

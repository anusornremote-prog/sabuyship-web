import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST /api/order - Create an order (Node-RED integration or external API)
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Check Auth (API Key or User Session)
    let isAuthorized = false
    let customerId = null
    const apiKey = request.headers.get("x-api-key")

    if (apiKey === process.env.SABUY_API_KEY && apiKey) {
      isAuthorized = true
    } else {
      // Check user session
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        isAuthorized = true
        customerId = user.id
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const targetCustomerId = customerId || body.customer_id // enforce own id if user, or allow body if api key

    if (!targetCustomerId || !body.quotation_id) {
      return NextResponse.json(
        { error: "Missing required fields: customer_id, quotation_id" },
        { status: 400 }
      )
    }

    // 2. Validate Ownership (Prevent stealing quotes)
    if (!apiKey) {
      const { data: quoteCheck, error: quoteError } = await supabase
        .from('quotations')
        .select(`inquiry_id, inquiries!inner(customer_id)`)
        .eq('id', body.quotation_id)
        .single()
        
      if (quoteError || !quoteCheck || (quoteCheck.inquiries as any)?.customer_id !== targetCustomerId) {
        return NextResponse.json({ error: "Invalid quotation or unauthorized" }, { status: 403 })
      }
    }

    // Next order number logic could be complex, simple timestamp for MVP
    const date = new Date()
    const orderNumber = `ORD-${date.getFullYear().toString().substring(2)}${String(date.getMonth() + 1).padStart(2, '0')}${Math.floor(1000 + Math.random() * 9000)}`

    const { data, error } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_id: targetCustomerId,
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

    // Update quotation status to ACCEPTED
    await supabase.from("quotations").update({ status: "ACCEPTED" }).eq("id", body.quotation_id)

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

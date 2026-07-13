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

    // 2. Validate Ownership and Get Inquiry Number
    let orderNumber = ""
    let inquiryId = null
    
    if (!apiKey) {
      const { data: quoteCheck, error: quoteError } = await supabase
        .from('quotations')
        .select(`inquiry_id, inquiries!inner(customer_id, inquiry_number)`)
        .eq('id', body.quotation_id)
        .single()
        
      if (quoteError || !quoteCheck || (quoteCheck.inquiries as any)?.customer_id !== targetCustomerId) {
        return NextResponse.json({ error: "Invalid quotation or unauthorized" }, { status: 403 })
      }
      
      orderNumber = (quoteCheck.inquiries as any)?.inquiry_number
      inquiryId = quoteCheck.inquiry_id
    } else {
      // For API key flow, we still need to get the inquiry number
      const { data: quoteCheck, error: quoteError } = await supabase
        .from('quotations')
        .select(`inquiries!inner(inquiry_number)`)
        .eq('id', body.quotation_id)
        .single()
        
      if (!quoteError && quoteCheck) {
        orderNumber = (quoteCheck.inquiries as any)?.inquiry_number
      } else {
        const date = new Date()
        orderNumber = `ORD-${date.getFullYear().toString().substring(2)}${String(date.getMonth() + 1).padStart(2, '0')}${Math.floor(1000 + Math.random() * 9000)}`
      }
    }

    // Check if order already exists to prevent duplicate key errors
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id")
      .eq("order_number", orderNumber)
      .maybeSingle()

    let orderData = existingOrder;

    if (!existingOrder) {
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
      orderData = data

      // Initial tracking log (catch error silently in case of RLS issues)
      await supabase.from("tracking_logs").insert({
        order_id: data.id,
        status: "NEW",
        notes: "Order created"
      }).catch(console.error)
    }

    // Update quotation status to ACCEPTED
    await supabase.from("quotations").update({ status: "ACCEPTED" }).eq("id", body.quotation_id)
    
    // Also update inquiry status so it's formally closed
    if (!apiKey && inquiryId) {
      await supabase.from("inquiries").update({ status: "ORDERED" }).eq("id", inquiryId)
    }

    return NextResponse.json({ success: true, data: orderData }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

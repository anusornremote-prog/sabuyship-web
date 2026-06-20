import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST /api/inquiry - Create a new inquiry (Node-RED integration)
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Validate required fields
    if (!body.customer_name || !body.phone || !body.product_url) {
      return NextResponse.json(
        { error: "Missing required fields: customer_name, phone, product_url" },
        { status: 400 }
      )
    }

    // Get the logged in user if any, to associate the customer_id
    const { data: { user } } = await supabase.auth.getUser()
    const customerId = user ? user.id : null

    // Generate Inquiry ID
    const inquiryNumber = `INQ-${Math.floor(Date.now() / 1000)}`

    const { error } = await supabase
      .from("inquiries")
      .insert({
        inquiry_number: inquiryNumber,
        customer_id: customerId,
        customer_name: body.customer_name,
        phone: body.phone,
        line_id: body.line_id || null,
        product_url: body.product_url,
        quantity: body.quantity || 1,
        remark: body.remark || null,
        status: "PENDING"
      })

    if (error) throw error

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST /api/inquiry - Create a new inquiry (Node-RED integration)
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Validate required fields
    if (!body.customer_name || !body.phone || !body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: customer_name, phone, items" },
        { status: 400 }
      )
    }

    // Get the logged in user if any, to associate the customer_id
    const { data: { user } } = await supabase.auth.getUser()
    const customerId = user ? user.id : null

    // Generate base Inquiry ID
    const baseInquiryNumber = `INQ-${Math.floor(Date.now() / 1000)}`

    // Create a single record with all items stored in the 'items' column (JSONB)
    const recordToInsert = {
      inquiry_number: baseInquiryNumber,
      customer_id: customerId,
      customer_name: body.customer_name,
      phone: body.phone,
      line_id: body.line_id || null,
      items: body.items, // Ensure your DB schema has an 'items' jsonb column
      status: "PENDING"
    }

    const { error } = await supabase
      .from("inquiries")
      .insert([recordToInsert])

    if (error) throw error

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

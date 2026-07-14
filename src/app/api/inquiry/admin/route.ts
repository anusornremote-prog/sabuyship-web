import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST /api/inquiry/admin - Create a new inquiry as an admin for a customer
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

    // Admins must be authenticated to use this route
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is an admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (!profile || profile.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 })
    }

    // Generate base Inquiry ID as ORD-
    const date = new Date()
    const baseInquiryNumber = `ORD-${date.getFullYear().toString().substring(2)}${String(date.getMonth() + 1).padStart(2, '0')}${Math.floor(1000 + Math.random() * 9000)}`

    // Create a single record with all items stored in the 'items' column (JSONB)
    const recordToInsert = {
      inquiry_number: baseInquiryNumber,
      customer_id: body.customer_id || null, // Provided by the admin
      customer_name: body.customer_name,
      phone: body.phone,
      line_id: body.line_id || null,
      shipping_type: body.shipping_type || "CAR",
      items: body.items,
      product_url: body.items[0]?.url || "-", 
      quantity: body.items[0]?.quantity || 1, 
      status: "PENDING"
    }

    const { error } = await supabase
      .from("inquiries")
      .insert([recordToInsert])

    if (error) throw error

    return NextResponse.json({ success: true, inquiry_number: baseInquiryNumber }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/inquiry/admin - Delete multiple inquiries
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json({ error: "No inquiry IDs provided" }, { status: 400 })
    }

    // Admins must be authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is an admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (!profile || profile.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 })
    }

    const { error } = await supabase
      .from("inquiries")
      .delete()
      .in("id", body.ids)

    if (error) throw error

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

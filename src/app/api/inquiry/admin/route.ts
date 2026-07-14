import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

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

    // Try to use service role key to bypass RLS, fallback to normal client
    const adminSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY)
      : supabase

    // Find all quotations related to these inquiries
    const { data: quotations } = await adminSupabase
      .from("quotations")
      .select("id")
      .in("inquiry_id", body.ids)

    if (quotations && quotations.length > 0) {
      const quotationIds = quotations.map((q: any) => q.id)

      // 1. Delete associated orders first to avoid foreign key constraint violations
      const { error: orderError } = await adminSupabase
        .from("orders")
        .delete()
        .in("quotation_id", quotationIds)

      if (orderError) throw orderError

      // 2. Delete quotations
      const { error: quotationError } = await adminSupabase
        .from("quotations")
        .delete()
        .in("id", quotationIds)
        
      if (quotationError) throw quotationError
    }

    // 3. Finally delete inquiries
    const { error } = await adminSupabase
      .from("inquiries")
      .delete()
      .in("id", body.ids)

    if (error) throw error

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

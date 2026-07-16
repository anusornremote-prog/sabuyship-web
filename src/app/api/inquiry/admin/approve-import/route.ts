import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// POST /api/inquiry/admin/approve-import - Approve an IMPORT_ONLY inquiry directly to CHINA_WAREHOUSE
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    if (!body.inquiry_id) {
      return NextResponse.json({ error: "Missing inquiry_id" }, { status: 400 })
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

    const adminSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY)
      : supabase

    // 1. Fetch the inquiry
    const { data: inquiry, error: fetchError } = await adminSupabase
      .from("inquiries")
      .select("*")
      .eq("id", body.inquiry_id)
      .single()

    if (fetchError || !inquiry) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 })
    }

    if (inquiry.service_type !== "IMPORT_ONLY") {
      return NextResponse.json({ error: "This inquiry is not for IMPORT_ONLY" }, { status: 400 })
    }

    if (inquiry.status !== "PENDING") {
      return NextResponse.json({ error: "Inquiry is not in PENDING status" }, { status: 400 })
    }

    // 2. Create a dummy quotation for schema compliance
    const { data: quotation, error: quoteError } = await adminSupabase
      .from("quotations")
      .insert([{
        inquiry_id: inquiry.id,
        product_cost: 0,
        shipping_cost_cn_cn: 0,
        other_fee: 0,
        status: 'ACCEPTED',
        customer_id: inquiry.customer_id
      }])
      .select()
      .single()

    if (quoteError) throw quoteError

    // 3. Create the order with CHINA_WAREHOUSE status and NOT_APPLICABLE for round 1
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`
    
    // Extract tracking numbers to add to notes/tracking field if needed
    const trackingNumbers = inquiry.items
      ?.map((item: any) => item.china_tracking_number)
      .filter(Boolean)
      .join(", ") || ""

    const { data: order, error: orderError } = await adminSupabase
      .from("orders")
      .insert([{
        order_number: orderNumber,
        quotation_id: quotation.id,
        customer_id: inquiry.customer_id,
        status: "CHINA_WAREHOUSE",
        payment_round_1_status: "NOT_APPLICABLE"
      }])
      .select()
      .single()

    if (orderError) {
      // Clean up quotation if order creation fails
      await adminSupabase.from("quotations").delete().eq("id", quotation.id)
      throw orderError
    }

    // 4. Update inquiry status to ORDERED
    await adminSupabase
      .from("inquiries")
      .update({ status: "ORDERED" })
      .eq("id", inquiry.id)

    // 5. Create tracking log
    await adminSupabase.from("tracking_logs").insert([{
      order_id: order.id,
      status: "CHINA_WAREHOUSE",
      description: `สร้างคำสั่งซื้อ (นำเข้าอย่างเดียว) เลขพัสดุจีน: ${trackingNumbers || '-'}`,
      created_by: user.id
    }])

    return NextResponse.json({ success: true, order_id: order.id }, { status: 201 })
  } catch (error: any) {
    console.error("Approve Import Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendAdminNotification } from "@/lib/notify"

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

    // Generate base Inquiry ID as ORD-
    const date = new Date()
    const baseInquiryNumber = `ORD-${date.getFullYear().toString().substring(2)}${String(date.getMonth() + 1).padStart(2, '0')}${Math.floor(1000 + Math.random() * 9000)}`

    // Create a single record with all items stored in the 'items' column (JSONB)
    const recordToInsert = {
      inquiry_number: baseInquiryNumber,
      customer_id: customerId,
      customer_name: body.customer_name,
      phone: body.phone,
      line_id: body.line_id || null,
      shipping_type: body.shipping_type || "CAR",
      items: body.items, // Ensure your DB schema has an 'items' jsonb column
      product_url: body.items[0]?.url || "-", // Fallback to satisfy DB NOT NULL constraint
      quantity: body.items[0]?.quantity || 1, // Fallback to satisfy DB NOT NULL constraint
      status: "PENDING",
      service_type: body.service_type || 'BUY_AND_IMPORT'
    }

    const { error } = await supabase
      .from("inquiries")
      .insert([recordToInsert])

    if (error) throw error

    // Send admin notification
    await sendAdminNotification(`📢 มีรายการขอใบเสนอราคาใหม่!\nรหัส: ${baseInquiryNumber}\nลูกค้า: ${body.customer_name}\nขนส่ง: ${body.shipping_type === 'BOAT' ? 'ทางเรือ' : 'ทางรถ'}\nเข้าไปตรวจสอบได้ที่: https://www.sabuyship.com/admin/inquiries`);

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

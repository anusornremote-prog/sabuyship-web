import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendAdminNotification } from "@/lib/notify"
import crypto from "crypto"

// POST /api/inquiry - Create a new inquiry (Support both Authenticated & Guest Users)
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

    // Check optional authentication
    const { data: { user } } = await supabase.auth.getUser()
    let customerId = user?.id || null

    // If guest, try to link with existing profile matching the phone number if available
    if (!customerId && body.phone) {
      const cleanPhone = body.phone.trim().replace(/[-\s]/g, '')
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', cleanPhone)
        .maybeSingle()
      
      if (existingProfile?.id) {
        customerId = existingProfile.id
      }
    }

    // Generate base Inquiry ID as ORD-YYMMXXXX
    const date = new Date()
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase()
    const baseInquiryNumber = `ORD-${date.getFullYear().toString().substring(2)}${String(date.getMonth() + 1).padStart(2, '0')}${randomHex}`

    // Create record with all items stored in the 'items' column (JSONB)
    const recordToInsert = {
      inquiry_number: baseInquiryNumber,
      customer_id: customerId,
      customer_name: body.customer_name.trim(),
      phone: body.phone.trim(),
      line_id: body.line_id ? body.line_id.trim() : null,
      shipping_type: body.shipping_type || "CAR",
      items: body.items,
      product_url: body.items[0]?.url || "-", // Fallback to satisfy DB constraint
      quantity: body.items[0]?.quantity || 1, // Fallback to satisfy DB constraint
      status: "PENDING",
      service_type: body.service_type || 'BUY_AND_IMPORT'
    }

    const { error } = await supabase
      .from("inquiries")
      .insert([recordToInsert])

    if (error) throw error

    // Send admin notification
    try {
      const shippingLabel = body.shipping_type === 'BOAT' ? '🛳️ ทางเรือ (SEA)' : '🚚 ทางรถ (EK)';
      const itemCount = body.items.length;
      await sendAdminNotification(
        `📢 มีรายการขอใบเสนอราคาใหม่!\n` +
        `━━━━━━━━━━━━━━━\n` +
        `📋 รหัส: ${baseInquiryNumber}\n` +
        `👤 ลูกค้า: ${body.customer_name}\n` +
        `📞 เบอร์: ${body.phone}\n` +
        `${body.line_id ? `💬 LINE: ${body.line_id}\n` : ''}` +
        `📦 จำนวนสินค้า: ${itemCount} รายการ\n` +
        `🚀 ขนส่ง: ${shippingLabel}\n` +
        `━━━━━━━━━━━━━━━\n` +
        `🔗 ตรวจสอบและทำใบเสนอราคา: https://www.sabuyship.com/admin/inquiries`
      );
    } catch (notifyErr) {
      console.error("Failed to send admin notification:", notifyErr);
    }

    return NextResponse.json({ 
      success: true, 
      inquiry_number: baseInquiryNumber 
    }, { status: 201 })
  } catch (error: any) {
    console.error("Inquiry API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

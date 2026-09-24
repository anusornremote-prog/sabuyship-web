import { NextResponse } from "next/server"
import { canAcceptBusiness } from "@/lib/public-business-config"
import { createClient } from "@/lib/supabase/server"
import { sendAdminNotification } from "@/lib/notify"
import crypto from "crypto"
import { extractProductUrl } from "@/lib/product-link"

// POST /api/inquiry - Create a new inquiry (Support both Authenticated & Guest Users)
export async function POST(request: Request) {
  try {
    if (!canAcceptBusiness) {
      return NextResponse.json({ error: "Service is not accepting new inquiries" }, { status: 503 })
    }
    const supabase = await createClient()
    const body = await request.json()

    // Validate required fields
    if (!body.customer_name || !body.phone || !body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: customer_name, phone, items" },
        { status: 400 }
      )
    }
    if (body.privacy_notice_acknowledged !== true) {
      return NextResponse.json({ error: "Privacy notice acknowledgement is required" }, { status: 400 })
    }

    const serviceType = body.service_type || 'BUY_AND_IMPORT'
    const normalizedItems = body.items.map((item: Record<string, unknown>) => {
      const rawUrl = typeof item?.url === "string" ? item.url : ""
      return { ...item, url: extractProductUrl(rawUrl) || rawUrl.trim() }
    })

    if (serviceType === 'BUY_AND_IMPORT' && normalizedItems.some((item: { url?: string }) => !extractProductUrl(item.url || ""))) {
      return NextResponse.json({ error: "กรุณาระบุลิงก์สินค้าที่ถูกต้อง (รองรับลิงก์จาก Taobao, 1688 หรือ Tmall)" }, { status: 400 })
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
      items: normalizedItems,
      product_url: normalizedItems[0]?.url || "-", // Fallback to satisfy DB constraint
      quantity: normalizedItems[0]?.quantity || 1, // Fallback to satisfy DB constraint
      status: "PENDING",
      service_type: serviceType,
      privacy_notice_version: "2026-09-14",
      privacy_acknowledged_at: new Date().toISOString(),
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

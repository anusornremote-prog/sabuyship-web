import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendCustomerNotification } from "@/lib/notify"

// POST /api/quotation - Create a quotation (Node-RED integration)
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    if (!body.inquiry_id || body.product_cost === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: inquiry_id, product_cost" },
        { status: 400 }
      )
    }

    let total = 
      (body.product_cost || 0) + 
      (body.shipping_cost_cn_cn || 0) + 
      (body.other_fee || 0)

    let quotationData: any
    
    if (body.quotation_id) {
      // If updating, we must preserve Round 2 and Round 3 shipping costs
      const { data: existingQuotation } = await supabase
        .from("quotations")
        .select("shipping_cost_cn_th, shipping_cost_th_th")
        .eq("id", body.quotation_id)
        .single()
        
      if (existingQuotation) {
        total += (existingQuotation.shipping_cost_cn_th || 0) + (existingQuotation.shipping_cost_th_th || 0)
      }
      
      const { data, error } = await supabase
        .from("quotations")
        .update({
          product_cost: body.product_cost,
          shipping_cost_cn_cn: body.shipping_cost_cn_cn || 0,
          other_fee: body.other_fee || 0,
          total_price: total
        })
        .eq("id", body.quotation_id)
        .select()
        .single()
        
      if (error) throw error
      quotationData = data
    } else {
      const { data, error } = await supabase
        .from("quotations")
        .insert({
          inquiry_id: body.inquiry_id,
          product_cost: body.product_cost,
          shipping_cost_cn_cn: body.shipping_cost_cn_cn || 0,
          other_fee: body.other_fee || 0,
          total_price: total,
          status: "SENT"
        })
        .select()
        .single()
        
      if (error) throw error
      quotationData = data
    }

    // Update inquiry status and optionally the items breakdown
    const updatePayload: any = { status: "QUOTED" }
    if (body.updated_items) {
      updatePayload.items = body.updated_items
    }
    await supabase.from("inquiries").update(updatePayload).eq("id", body.inquiry_id)

    // Notify customer about Round 1 quote
    const { data: inquiry } = await supabase
      .from("inquiries")
      .select("customer_id, inquiry_number")
      .eq("id", body.inquiry_id)
      .single()

    if (inquiry && inquiry.customer_id) {
      const formattedTotal = new Intl.NumberFormat('th-TH').format(total)
      const actionText = body.quotation_id ? 'อัปเดตยอดชำระ' : 'แจ้งยอดชำระ'
      await sendCustomerNotification(
        inquiry.customer_id,
        `🧾 ${actionText}รอบ 1 (ค่าสินค้า) สำหรับคำสั่งซื้อ ${inquiry.inquiry_number}\nยอดชำระ: ${formattedTotal} บาท\nกรุณาเข้าสู่ระบบเพื่อชำระเงินค่ะ`
      )
    }

    return NextResponse.json({ success: true, data: quotationData }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

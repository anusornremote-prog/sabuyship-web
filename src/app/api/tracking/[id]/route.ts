import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/tracking/[id] - Get tracking history for an order
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: orderId } = await params

    // Check if ID is UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    
    let targetOrderId = orderId;
    
    // If not UUID, we assume it's the order_number, so we need to get the UUID first
    if (!isUUID) {
       const { data: orderData, error: orderError } = await supabase
         .from("orders")
         .select("id")
         .eq("order_number", orderId)
         .single()
         
       if (orderError || !orderData) {
         return NextResponse.json({ error: "Order not found" }, { status: 404 })
       }
       targetOrderId = orderData.id;
    }

    // Fetch tracking logs ordered by newest first
    const { data, error } = await supabase
      .from("tracking_logs")
      .select("*")
      .eq("order_id", targetOrderId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

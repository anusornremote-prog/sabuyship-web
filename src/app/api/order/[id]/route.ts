import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/order/[id] - Get order details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: orderId } = await params

    // Since users might search by order_number instead of UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    
    let query = supabase.from("orders").select(`
      *,
      quotations (*),
      profiles (full_name, phone, line_id)
    `)
    
    if (isUUID) {
      query = query.eq("id", orderId)
    } else {
      query = query.eq("order_number", orderId)
    }

    const { data, error } = await query.single()

    if (error) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Security check: only allow Admin or the owner to view
    const { data: { user } } = await supabase.auth.getUser()
    let isAdmin = false
    
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      isAdmin = profile?.role === 'ADMIN'
    }

    if (!isAdmin) {
      if (!user || (user.id !== data.customer_id && user.id !== data.user_id)) {
        return NextResponse.json({ error: "Forbidden: You are not authorized to view this order" }, { status: 403 })
      }
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

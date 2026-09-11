import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

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

const shippingMethods = new Set([
  "รับสินค้าด้วยตัวเองที่โกดัง",
  "จัดส่งแบบเหมาจ่าย(เฉพาะกรุงเทพและปริมณฑล)",
  "จัดส่งโดยขนส่งภายในประเทศ",
])

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    if (!shippingMethods.has(body.shipping_company)) {
      return NextResponse.json({ error: "Invalid shipping method" }, { status: 400 })
    }

    const { id } = await params
    const adminClient = createAdminClient()
    const { data: order } = await adminClient
      .from("orders")
      .select("id, customer_id, status, payment_round_3_status")
      .eq("id", id)
      .maybeSingle()

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })
    if (order.customer_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    if (order.status !== "THAILAND_WAREHOUSE" || ["UPLOADED", "PAID"].includes(order.payment_round_3_status)) {
      return NextResponse.json({ error: "Shipping method cannot be changed now" }, { status: 409 })
    }

    const { error } = await adminClient
      .from("orders")
      .update({ shipping_company: body.shipping_company })
      .eq("id", id)
      .eq("customer_id", user.id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

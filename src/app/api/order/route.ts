import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

// POST /api/order - Create an order (Node-RED integration or external API)
export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseServiceKey) {
      return NextResponse.json({ error: "Server Configuration Error: Missing Service Role Key" }, { status: 500 })
    }

    // 1. Check Auth (API Key or User Session)
    let isAuthorized = false
    let customerId = null
    const apiKey = request.headers.get("x-api-key")

    // Setup standard client for session checking
    const supabaseClient = createServerClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        getAll() {
          const cookieHeader = request.headers.get('cookie')
          if (!cookieHeader) return []
          return cookieHeader.split(';').map(c => {
            const [name, ...rest] = c.split('=')
            return { name: name.trim(), value: rest.join('=') }
          })
        },
        setAll() {}
      }
    })

    if (apiKey === process.env.SABUY_API_KEY) {
      isAuthorized = true
    } else {
      // Check user session
      const { data: { user } } = await supabaseClient.auth.getUser()
      if (user) {
        isAuthorized = true
        customerId = user.id
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }


    const supabase = createServerClient(supabaseUrl, supabaseServiceKey, {
      cookies: {
        get() { return null },
        set() {},
        remove() {}
      }
    })
    const body = await request.json()
    const targetCustomerId = customerId || body.customer_id // enforce own id if user, or allow body if api key

    if (!targetCustomerId || !body.quotation_id) {
      return NextResponse.json(
        { error: "Missing required fields: customer_id, quotation_id" },
        { status: 400 }
      )
    }

    // Next order number logic could be complex, simple timestamp for MVP
    const date = new Date()
    const orderNumber = `ORD-${date.getFullYear().toString().substring(2)}${String(date.getMonth() + 1).padStart(2, '0')}${Math.floor(1000 + Math.random() * 9000)}`

    const { data, error } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_id: targetCustomerId,
        quotation_id: body.quotation_id,
        status: "NEW",
        admin_notes: body.admin_notes || null,
        shipping_address_id: body.shipping_address_id || null
      })
      .select()
      .single()

    if (error) throw error

    // Initial tracking log
    await supabase.from("tracking_logs").insert({
      order_id: data.id,
      status: "NEW",
      notes: "Order created"
    })

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

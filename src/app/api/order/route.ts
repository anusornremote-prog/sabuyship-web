import { NextResponse } from "next/server"

import { hasValidApiKey } from "@/lib/api-auth"
import { sendAdminNotification } from "@/lib/notify"
import { canAcceptBusiness } from "@/lib/public-business-config"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    if (!canAcceptBusiness) return NextResponse.json({ error: "Service is not accepting new orders" }, { status: 503 })

    const sessionClient = await createClient()
    const apiKeyAuthorized = hasValidApiKey(request)
    const { data: { user } } = await sessionClient.auth.getUser()
    if (!apiKeyAuthorized && !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const targetCustomerId = apiKeyAuthorized ? body.customer_id : user?.id
    if (!apiKeyAuthorized && body.terms_accepted !== true) {
      return NextResponse.json({ error: "Terms acceptance is required" }, { status: 400 })
    }
    if (typeof targetCustomerId !== "string" || typeof body.quotation_id !== "string") {
      return NextResponse.json({ error: "Missing customer_id or quotation_id" }, { status: 400 })
    }

    const rpcClient = apiKeyAuthorized ? createAdminClient() : sessionClient
    const { data, error } = await rpcClient.rpc("accept_quotation_as_order", {
      p_quotation_id: body.quotation_id,
      p_customer_id: targetCustomerId,
      p_shipping_address_id: typeof body.shipping_address_id === "string" ? body.shipping_address_id : null,
      p_admin_notes: typeof body.admin_notes === "string" ? body.admin_notes : null,
      p_terms_version: apiKeyAuthorized ? null : "2026-09-14",
    })
    if (error) {
      const status = /not found/i.test(error.message) ? 404 : /forbidden/i.test(error.message) ? 403 : 409
      return NextResponse.json({ error: error.message }, { status })
    }

    const result = data as { existing: boolean; order: { id: string; order_number: string } }
    if (!result.existing) {
      await sendAdminNotification(`✅ ลูกค้ายอมรับใบเสนอราคาแล้ว\nออเดอร์: ${result.order.order_number}`)
    }
    return NextResponse.json(
      { success: true, data: result.order, order: result.order, existing: result.existing },
      { status: result.existing ? 200 : 201 },
    )
  } catch (error: unknown) {
    console.error("Order creation failed", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

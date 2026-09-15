import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await params
    const { data, error } = await supabase.rpc("customer_confirm_order_receipt", { p_order_identifier: id })
    if (error) {
      const status = /not found/i.test(error.message) ? 404 : 409
      return NextResponse.json({ error: error.message }, { status })
    }
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ error: "Unable to confirm receipt" }, { status: 500 })
  }
}

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { parent_id, child_ids } = body

    if (!parent_id || !child_ids || !Array.isArray(child_ids)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
    }

    // Update child orders: set consolidated_into_id and set round 3 payment to NOT_APPLICABLE
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        consolidated_into_id: parent_id,
        payment_round_3_status: "NOT_APPLICABLE"
      })
      .in("id", child_ids)

    if (updateError) throw updateError

    // Also update parent order's payment_round_3_status to PENDING if it was null/not set,
    // so it shows up as needing quoting/payment.
    const { data: parentOrder } = await supabase
      .from("orders")
      .select("payment_round_3_status")
      .eq("id", parent_id)
      .single()

    if (parentOrder && !parentOrder.payment_round_3_status) {
      await supabase
        .from("orders")
        .update({ payment_round_3_status: "PENDING" })
        .eq("id", parent_id)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

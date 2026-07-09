import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 1. Get Quoted Inquiries Count (Waiting for customer to pay Round 1)
    const { count: inquiriesCount, error: inquiriesError } = await supabase
      .from("inquiries")
      .select("*", { count: 'exact', head: true })
      .eq("customer_id", user.id)
      .eq("status", "QUOTED")

    if (inquiriesError) throw inquiriesError

    // 2. Get Orders needing Round 2 or 3 payment
    // Instead of complex OR conditions on payment_round_x_status which might require postgrest filters,
    // we can fetch the orders in ARRIVED or DELIVERED status and filter in JS if the count is small,
    // or use Supabase or() filter.
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("status, payment_round_2_status, payment_round_3_status")
      .eq("customer_id", user.id)
      .in("status", ["ARRIVED", "DELIVERED"])

    if (ordersError) throw ordersError

    let ordersCount = 0
    if (ordersData) {
      ordersCount = ordersData.filter(o => 
        o.payment_round_2_status === 'PENDING' || 
        o.payment_round_3_status === 'PENDING'
      ).length
    }

    return NextResponse.json({
      inquiriesCount: inquiriesCount || 0,
      ordersCount: ordersCount || 0
    }, { status: 200 })

  } catch (error: any) {
    console.error("Error fetching customer badge counts:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

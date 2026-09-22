import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [
      { data: profile, error: profileError },
      { count: inquiriesCount, error: inquiriesError },
      { data: ordersData, error: ordersError }
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("phone")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("inquiries")
        .select("*", { count: 'exact', head: true })
        .eq("customer_id", user.id)
        .eq("status", "QUOTED"),
      supabase
        .from("orders")
        .select("status, payment_round_2_status, payment_round_3_status")
        .eq("customer_id", user.id)
        .in("status", ["ARRIVED", "DELIVERED"])
    ])

    if (profileError) throw profileError
    if (inquiriesError) throw inquiriesError
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
      ordersCount: ordersCount || 0,
      hasPhone: !!profile?.phone
    }, { status: 200 })

  } catch (error: any) {
    console.error("Error fetching customer badge counts:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

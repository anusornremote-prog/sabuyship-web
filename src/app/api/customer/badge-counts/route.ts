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
        .eq("status", "QUOTED")
        .is("archived_at", null),
      supabase
        .from("orders")
        .select("status, payment_round_1_status, payment_round_2_status, payment_round_3_status, consolidated_into_id")
        .eq("customer_id", user.id)
        .in("status", ["WAITING_PAYMENT", "PAYMENT_REJECTED", "CHINA_WAREHOUSE", "THAILAND_WAREHOUSE", "OUT_FOR_DELIVERY", "DELIVERED"])
    ])

    if (profileError) throw profileError
    if (inquiriesError) throw inquiriesError
    if (ordersError) throw ordersError

    let ordersCount = 0
    if (ordersData) {
      ordersCount = ordersData.filter(o => {
        if (o.consolidated_into_id) return false
        const r1 = (o.status === 'WAITING_PAYMENT' || o.status === 'PAYMENT_REJECTED') && (!o.payment_round_1_status || o.payment_round_1_status === 'PENDING' || o.payment_round_1_status === 'REJECTED')
        const r2 = (o.status === 'CHINA_WAREHOUSE' || o.status === 'THAILAND_WAREHOUSE' || o.status === 'DELIVERED' || o.status === 'PAYMENT_REJECTED') && (o.payment_round_2_status === 'PENDING' || o.payment_round_2_status === 'REJECTED')
        const r3 = (o.status === 'THAILAND_WAREHOUSE' || o.status === 'OUT_FOR_DELIVERY' || o.status === 'DELIVERED' || o.status === 'PAYMENT_REJECTED') && (o.payment_round_3_status === 'PENDING' || o.payment_round_3_status === 'REJECTED')
        return r1 || r2 || r3
      }).length
    }

    const cleanPhone = (profile?.phone || "").replace(/\D/g, "")
    return NextResponse.json({
      inquiriesCount: inquiriesCount || 0,
      ordersCount: ordersCount || 0,
      hasPhone: cleanPhone.length >= 9 && cleanPhone.length <= 10 && cleanPhone.startsWith("0")
    }, { status: 200 })

  } catch (error: any) {
    console.error("Error fetching customer badge counts:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

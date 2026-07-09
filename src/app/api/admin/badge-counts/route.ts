import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Get Pending Inquiries Count
    const { count: inquiriesCount, error: inquiriesError } = await supabase
      .from("inquiries")
      .select("*", { count: 'exact', head: true })
      .eq("status", "PENDING")

    if (inquiriesError) throw inquiriesError

    // 2. Get Paid Orders Count (Waiting to be ordered)
    const { count: ordersCount, error: ordersError } = await supabase
      .from("orders")
      .select("*", { count: 'exact', head: true })
      .eq("status", "PAID")

    if (ordersError) throw ordersError

    // 3. Get Tracking Needs Action Count (ORDERED or SHIPPING)
    const { count: trackingCount, error: trackingError } = await supabase
      .from("orders")
      .select("*", { count: 'exact', head: true })
      .in("status", ["ORDERED", "SHIPPING"])

    if (trackingError) throw trackingError

    return NextResponse.json({
      inquiriesCount: inquiriesCount || 0,
      ordersCount: ordersCount || 0,
      trackingCount: trackingCount || 0
    }, { status: 200 })

  } catch (error: any) {
    console.error("Error fetching badge counts:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

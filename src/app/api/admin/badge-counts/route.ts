import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/require-admin"

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
    const supabase = auth.supabase

    // 1. Get Pending Inquiries Count
    const { count: inquiriesCount, error: inquiriesError } = await supabase
      .from("inquiries")
      .select("*", { count: 'exact', head: true })
      .eq("status", "PENDING")

    if (inquiriesError) throw inquiriesError

    // 2. Payments that need an administrator review.
    const { count: paymentsCount, error: ordersError } = await supabase
      .from("payments")
      .select("*", { count: 'exact', head: true })
      .eq("status", "PENDING")

    if (ordersError) throw ordersError

    // 3. Get Tracking Needs Action Count (ORDERED or SHIPPING)
    const { count: trackingCount, error: trackingError } = await supabase
      .from("orders")
      .select("*", { count: 'exact', head: true })
      .in("status", ["ORDERED", "SHIPPING"])

    if (trackingError) throw trackingError

    return NextResponse.json({
      inquiriesCount: inquiriesCount || 0,
      ordersCount: paymentsCount || 0,
      trackingCount: trackingCount || 0
    }, { status: 200 })

  } catch (error: any) {
    console.error("Error fetching badge counts:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

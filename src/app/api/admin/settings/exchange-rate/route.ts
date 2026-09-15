import { NextResponse } from "next/server"

import { requireAdmin } from "@/lib/require-admin"

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  try {
    const body = await request.json()
    const rate = Number(body.rate)
    const reason = typeof body.reason === "string" ? body.reason.trim() : ""
    if (!Number.isFinite(rate) || rate < 0.1 || rate > 100) {
      return NextResponse.json({ error: "เรทเงินไม่ถูกต้อง" }, { status: 400 })
    }
    const { data, error } = await auth.supabase.rpc("admin_set_exchange_rate", {
      p_new_rate: rate,
      p_reason: reason || null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ error: "ไม่สามารถบันทึกเรทเงินได้" }, { status: 500 })
  }
}

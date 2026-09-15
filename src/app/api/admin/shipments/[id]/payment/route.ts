import { NextResponse } from "next/server"

import { requireAdmin } from "@/lib/require-admin"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  try {
    const { id } = await params
    const body = await request.json()
    const { data, error } = await auth.supabase.rpc("admin_mark_shipment_paid", {
      p_shipment_id: id,
      p_payment_reference: typeof body.payment_reference === "string" ? body.payment_reference : null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 409 })
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ error: "ไม่สามารถบันทึกการรับเงินได้" }, { status: 500 })
  }
}

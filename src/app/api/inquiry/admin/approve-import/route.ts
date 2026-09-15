import { NextResponse } from "next/server"

import { requireAdmin } from "@/lib/require-admin"

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const body = await request.json()
    if (typeof body.inquiry_id !== "string" || !body.inquiry_id) {
      return NextResponse.json({ error: "Missing inquiry_id" }, { status: 400 })
    }
    const { data, error } = await auth.supabase.rpc("admin_approve_import_inquiry", {
      p_inquiry_id: body.inquiry_id,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 409 })
    return NextResponse.json({ success: true, ...data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Unable to approve import request" }, { status: 500 })
  }
}

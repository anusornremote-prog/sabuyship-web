import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

function objectPathFromStoredValue(value: string) {
  if (!value.startsWith("http")) return value
  try {
    const pathname = new URL(value).pathname
    const marker = "/storage/v1/object/public/payment_slips/"
    const index = pathname.indexOf(marker)
    return index >= 0 ? decodeURIComponent(pathname.slice(index + marker.length)) : ""
  } catch {
    return ""
  }
}

export async function GET(request: Request) {
  const sessionClient = await createClient()
  const { data: { user } } = await sessionClient.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await sessionClient.from("profiles").select("role").eq("id", user.id).maybeSingle()
  if (profile?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const paymentId = new URL(request.url).searchParams.get("payment_id")
  if (!paymentId) return NextResponse.json({ error: "Missing payment_id" }, { status: 400 })

  const adminClient = createAdminClient()
  const { data: payment } = await adminClient.from("payments").select("slip_url").eq("id", paymentId).maybeSingle()
  const objectPath = payment?.slip_url ? objectPathFromStoredValue(payment.slip_url) : ""
  if (!objectPath || objectPath.includes("..")) return NextResponse.json({ error: "Slip not found" }, { status: 404 })

  const { data, error } = await adminClient.storage.from("payment_slips").createSignedUrl(objectPath, 300)
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Unable to open slip" }, { status: 404 })

  return NextResponse.json({ signed_url: data.signedUrl })
}

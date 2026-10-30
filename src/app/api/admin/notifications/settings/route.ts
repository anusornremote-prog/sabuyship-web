import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/require-admin"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAdminLineUserIds } from "@/lib/notify"

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const adminClient = createAdminClient()

    // 1. Get site_settings custom UIDs
    const { data: setting } = await adminClient
      .from("site_settings")
      .select("value")
      .eq("key", "line_admin_user_ids")
      .maybeSingle()

    const settingUserIds = (setting?.value as string) || ""

    // 2. Get env user IDs (masked for safety)
    const envIds = (process.env.LINE_ADMIN_USER_ID || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)

    // 3. Get all admin accounts from profiles
    const { data: adminProfiles } = await adminClient
      .from("profiles")
      .select("id, full_name, role, line_uid, is_active")
      .eq("role", "ADMIN")

    // 4. Get active recipient list
    const allRecipients = await getAdminLineUserIds()

    return NextResponse.json({
      success: true,
      settingUserIds,
      envRecipientCount: envIds.length,
      totalActiveRecipients: allRecipients.length,
      admins: (adminProfiles || []).map(a => ({
        id: a.id,
        fullName: a.full_name || "Admin",
        isActive: a.is_active,
        hasLineUid: Boolean(a.line_uid),
        lineUidMasked: a.line_uid ? `${a.line_uid.slice(0, 5)}...${a.line_uid.slice(-4)}` : null,
      })),
    })
  } catch (err: any) {
    console.error("Failed to get notification settings:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await request.json()
    const customUserIds = typeof body.customUserIds === "string" ? body.customUserIds.trim() : ""

    const adminClient = createAdminClient()

    // Upsert into site_settings
    const { error } = await adminClient
      .from("site_settings")
      .upsert({
        key: "line_admin_user_ids",
        value: customUserIds,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      console.error("Failed to save line_admin_user_ids:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const allRecipients = await getAdminLineUserIds()

    return NextResponse.json({
      success: true,
      message: "บันทึกรายชื่อผู้รับแจ้งเตือนแอดมินเรียบร้อยแล้ว",
      totalActiveRecipients: allRecipients.length,
    })
  } catch (err: any) {
    console.error("Failed to update notification settings:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}

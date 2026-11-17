import { NextResponse } from "next/server"
import type { User } from "@supabase/supabase-js"
import { requireAdmin } from "@/lib/require-admin"
import { createAdminClient } from "@/lib/supabase/admin"
import { isSyntheticLineEmail } from "@/lib/display-name"

async function listAllAuthUsers(adminClient: ReturnType<typeof createAdminClient>): Promise<User[]> {
  const users: User[] = []
  const perPage = 200

  for (let page = 1; page <= 15; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const batch = data?.users || []
    users.push(...batch)
    if (batch.length < perPage) break
  }

  return users
}

function buildCountMap(rows: Array<{ customer_id: string | null }> | null | undefined): Map<string, number> {
  const counts = new Map<string, number>()
  for (const row of rows || []) {
    if (!row.customer_id) continue
    counts.set(row.customer_id, (counts.get(row.customer_id) || 0) + 1)
  }
  return counts
}

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { searchParams } = new URL(request.url)
    const tab = searchParams.get("tab") === "orphans" ? "orphans" : "customers"
    const search = (searchParams.get("search") || "").trim()
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1)
    const limit = Math.min(50, Math.max(1, Number.parseInt(searchParams.get("limit") || "20", 10) || 20))

    const adminClient = createAdminClient()
    const authUsers = await listAllAuthUsers(adminClient)
    const authUserMap = new Map(authUsers.map((user) => [user.id, user]))

    if (tab === "orphans") {
      const { data: allProfileIds, error: profileIdsError } = await adminClient
        .from("profiles")
        .select("id")

      if (profileIdsError) throw profileIdsError

      const existingIds = new Set((allProfileIds || []).map((row) => row.id))
      const normalizedSearch = search.toLowerCase()
      const orphans = authUsers
        .filter((user) => !existingIds.has(user.id))
        .map((user) => ({
          id: user.id,
          customer_code: null,
          full_name:
            (user.user_metadata?.full_name as string | undefined) ||
            (user.user_metadata?.name as string | undefined) ||
            null,
          phone: user.phone || null,
          line_id: null,
          line_uid: null,
          role: "ORPHAN",
          created_at: user.created_at,
          email: user.email && !isSyntheticLineEmail(user.email) ? user.email : null,
          auth_provider: (user.app_metadata?.provider as string | undefined) || "email",
          orders_count: 0,
          inquiries_count: 0,
          shipments_count: 0,
        }))
        .filter((row) => {
          if (!normalizedSearch) return true
          return (
            (row.full_name || "").toLowerCase().includes(normalizedSearch) ||
            (row.email || "").toLowerCase().includes(normalizedSearch) ||
            row.id.toLowerCase().includes(normalizedSearch)
          )
        })
        .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))

      const start = (page - 1) * limit
      return NextResponse.json({
        customers: orphans.slice(start, start + limit),
        totalCount: orphans.length,
        orphanCount: orphans.length,
      })
    }

    let query = adminClient
      .from("profiles")
      .select("id, customer_code, full_name, phone, line_id, line_uid, created_at, role", { count: "exact" })
      .eq("role", "CUSTOMER")

    if (search) {
      const safeSearch = search.replace(/[,%()]/g, " ").trim()
      if (safeSearch) {
        query = query.or(
          `full_name.ilike.%${safeSearch}%,customer_code.ilike.%${safeSearch}%,phone.ilike.%${safeSearch}%,line_id.ilike.%${safeSearch}%`
        )
      }
    }

    const { data: profiles, count, error } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (error) throw error

    const customerIds = (profiles || []).map((row) => row.id)
    let ordersCount = new Map<string, number>()
    let inquiriesCount = new Map<string, number>()
    let shipmentsCount = new Map<string, number>()

    if (customerIds.length > 0) {
      const [ordersRes, inquiriesRes, shipmentsRes] = await Promise.all([
        adminClient.from("orders").select("customer_id").in("customer_id", customerIds),
        adminClient.from("inquiries").select("customer_id").in("customer_id", customerIds),
        adminClient.from("shipments").select("customer_id").in("customer_id", customerIds),
      ])

      if (ordersRes.error) throw ordersRes.error
      if (inquiriesRes.error) throw inquiriesRes.error
      if (shipmentsRes.error) throw shipmentsRes.error

      ordersCount = buildCountMap(ordersRes.data)
      inquiriesCount = buildCountMap(inquiriesRes.data)
      shipmentsCount = buildCountMap(shipmentsRes.data)
    }

    const { data: profileIdRows } = await adminClient.from("profiles").select("id")
    const profileIdSet = new Set((profileIdRows || []).map((row) => row.id))
    const orphanCount = authUsers.filter((user) => !profileIdSet.has(user.id)).length

    const customers = (profiles || []).map((profile) => {
      const authUser = authUserMap.get(profile.id)
      const rawEmail = authUser?.email || null
      return {
        ...profile,
        email: rawEmail && !isSyntheticLineEmail(rawEmail) ? rawEmail : null,
        auth_provider: (authUser?.app_metadata?.provider as string | undefined) || "email",
        orders_count: ordersCount.get(profile.id) || 0,
        inquiries_count: inquiriesCount.get(profile.id) || 0,
        shipments_count: shipmentsCount.get(profile.id) || 0,
      }
    })

    return NextResponse.json({
      customers,
      totalCount: count || 0,
      orphanCount,
    })
  } catch (error) {
    console.error("Failed to list admin customers:", error)
    return NextResponse.json(
      { error: "โหลดข้อมูลลูกค้าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    )
  }
}

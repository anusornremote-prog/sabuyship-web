import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/require-admin"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCustomerDisplayName } from "@/lib/display-name"
import { isTicketCategory, isTicketStatus } from "@/lib/tickets"

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get("status")?.trim() || "ALL"
    const categoryFilter = searchParams.get("category")?.trim() || "ALL"
    const queryText = searchParams.get("q")?.trim().toLowerCase() || ""

    const adminClient = createAdminClient()

    let query = adminClient
      .from("support_tickets")
      .select(
        `
        id,
        ticket_number,
        order_id,
        customer_id,
        category,
        subject,
        status,
        evidence_urls,
        video_url,
        resolution_note,
        last_activity_at,
        resolved_at,
        closed_at,
        created_at,
        order:order_id (
          id,
          order_number,
          status
        ),
        customer:customer_id (
          id,
          full_name,
          customer_code,
          phone
        )
      `
      )
      .order("last_activity_at", { ascending: false })
      .limit(250)

    if (categoryFilter && categoryFilter !== "ALL" && isTicketCategory(categoryFilter)) {
      query = query.eq("category", categoryFilter)
    }

    const { data: rows, error } = await query
    if (error) throw error

    const counts = {
      ALL: 0,
      OPEN: 0,
      NEW: 0,
      IN_PROGRESS: 0,
      WAITING_CUSTOMER: 0,
      RESOLVED: 0,
      CLOSED: 0,
    }

    const normalizedRows = (rows || []).map((row) => {
      const orderRow = Array.isArray(row.order) ? row.order[0] : row.order
      const customerRow = Array.isArray(row.customer) ? row.customer[0] : row.customer
      const displayName = getCustomerDisplayName({ profileName: customerRow?.full_name })

      counts.ALL += 1
      if (isTicketStatus(row.status)) {
        counts[row.status] += 1
        if (row.status === "NEW" || row.status === "IN_PROGRESS" || row.status === "WAITING_CUSTOMER") {
          counts.OPEN += 1
        }
      }

      return {
        ...row,
        order: orderRow || null,
        customer: customerRow
          ? {
              ...customerRow,
              display_name: displayName,
            }
          : null,
      }
    })

    const filtered = normalizedRows.filter((row) => {
      if (statusFilter === "OPEN") {
        if (!["NEW", "IN_PROGRESS", "WAITING_CUSTOMER"].includes(row.status)) return false
      } else if (statusFilter !== "ALL" && isTicketStatus(statusFilter)) {
        if (row.status !== statusFilter) return false
      }

      if (!queryText) return true

      const haystack = [
        row.ticket_number,
        row.subject,
        row.order?.order_number || "",
        row.customer?.customer_code || "",
        row.customer?.display_name || "",
        row.customer?.phone || "",
      ]
        .join(" ")
        .toLowerCase()

      return haystack.includes(queryText)
    })

    return NextResponse.json({
      tickets: filtered,
      counts,
    })
  } catch (error) {
    console.error("Failed to fetch admin tickets:", error)
    return NextResponse.json(
      { error: "ไม่สามารถโหลดรายการเคสประสานงานได้" },
      { status: 500 }
    )
  }
}

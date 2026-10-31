import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { sendAdminNotification } from "@/lib/notify"

export async function POST(request: Request) {
  try {
    const sessionClient = await createClient()
    const {
      data: { user },
    } = await sessionClient.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const parentId = typeof body.parent_id === "string" ? body.parent_id : ""
    const childIds = Array.isArray(body.child_ids)
      ? [...new Set(body.child_ids.filter((id: unknown): id is string => typeof id === "string"))]
      : []

    if (!parentId || childIds.length === 0 || childIds.includes(parentId)) {
      return NextResponse.json({ error: "Invalid consolidation selection" }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const { data: orders, error: ordersError } = await adminClient
      .from("orders")
      .select("id, order_number, customer_id, status, payment_round_3_status, consolidated_into_id")
      .in("id", [parentId, ...childIds])

    if (ordersError) throw ordersError
    if (!orders || orders.length !== childIds.length + 1) {
      return NextResponse.json({ error: "One or more orders were not found" }, { status: 404 })
    }
    if (orders.some((order) => order.customer_id !== user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const parent = orders.find((order) => order.id === parentId)
    const children = orders.filter((order) => childIds.includes(order.id))
    const canConsolidate = (order: (typeof orders)[number]) =>
      (order.status === "THAILAND_WAREHOUSE" || order.status === "PAYMENT_REJECTED") &&
      !order.consolidated_into_id &&
      order.payment_round_3_status !== "PAID" &&
      order.payment_round_3_status !== "UPLOADED"

    if (!parent || !canConsolidate(parent) || children.some((order) => !canConsolidate(order))) {
      return NextResponse.json(
        { error: "Only unpaid orders at the Thailand warehouse can be consolidated" },
        { status: 409 },
      )
    }

    // Prevent chained consolidation: ensure none of the childIds are already parents of other orders
    const { data: existingSubChildren } = await adminClient
      .from("orders")
      .select("id")
      .in("consolidated_into_id", childIds)
      .limit(1)
    if (existingSubChildren && existingSubChildren.length > 0) {
      return NextResponse.json(
        { error: "Cannot consolidate an order that already has other orders consolidated into it" },
        { status: 409 },
      )
    }

    const { error: childUpdateError } = await adminClient
      .from("orders")
      .update({
        consolidated_into_id: parentId,
        payment_round_3_status: "NOT_APPLICABLE",
      })
      .in("id", childIds)
      .eq("customer_id", user.id)
    if (childUpdateError) throw childUpdateError

    const { error: parentUpdateError } = await adminClient
      .from("orders")
      .update({ payment_round_3_status: "PENDING" })
      .eq("id", parentId)
      .eq("customer_id", user.id)
    if (parentUpdateError) {
      await Promise.all(
        children.map((child) =>
          adminClient
            .from("orders")
            .update({
              consolidated_into_id: null,
              payment_round_3_status: child.payment_round_3_status,
            })
            .eq("id", child.id)
        )
      )
      throw parentUpdateError
    }

    const logs = [
      {
        order_id: parentId,
        status: "CONSOLIDATION_PARENT",
        notes: `รวม ${children.length} ออเดอร์เพื่อคิดค่าจัดส่งในไทยร่วมกัน`,
        created_by: user.id,
      },
      ...children.map((order) => ({
        order_id: order.id,
        status: "CONSOLIDATED",
        notes: `รวมค่าจัดส่งรอบที่ 3 กับออเดอร์หลัก ${parent.order_number}`,
        created_by: user.id,
      })),
    ]
    const { error: logError } = await adminClient.from("tracking_logs").insert(logs)
    if (logError) throw logError

    await sendAdminNotification(
      `📦 ลูกค้ากดรวมพัสดุเพื่อจัดส่งในไทย!\nออเดอร์หลัก: ${parent.order_number}\nรวมกับออเดอร์: ${children.map((c) => c.order_number).join(", ")}\nกรุณาประเมินค่าจัดส่งรอบที่ 3 ที่ออเดอร์หลัก`
    ).catch((err) => console.error("Failed to send admin notification for consolidation:", err))

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

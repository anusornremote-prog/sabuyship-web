import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/require-admin"
import { createAdminClient } from "@/lib/supabase/admin"
import { extractStorageObjectPath } from "@/lib/storage-path"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function collectInquiryStoragePaths(
  inquiries: Array<{ image_url: string | null; items: unknown }>
): string[] {
  const paths = new Set<string>()

  for (const inquiry of inquiries) {
    const mainPath = extractStorageObjectPath(inquiry.image_url, "inquiries")
    if (mainPath) paths.add(mainPath)

    let items: unknown[] = []
    if (Array.isArray(inquiry.items)) {
      items = inquiry.items
    } else if (typeof inquiry.items === "string") {
      try {
        const parsed = JSON.parse(inquiry.items)
        if (Array.isArray(parsed)) items = parsed
      } catch {
        items = []
      }
    }

    for (const item of items) {
      if (!item || typeof item !== "object") continue
      const record = item as Record<string, unknown>
      const itemPath = extractStorageObjectPath(
        typeof record.image_url === "string" ? record.image_url : null,
        "inquiries"
      )
      if (itemPath) paths.add(itemPath)

      if (Array.isArray(record.images)) {
        for (const img of record.images) {
          if (typeof img !== "string") continue
          const nestedPath = extractStorageObjectPath(img, "inquiries")
          if (nestedPath) paths.add(nestedPath)
        }
      }
    }
  }

  return Array.from(paths)
}

async function removeStorageFiles(
  adminClient: ReturnType<typeof createAdminClient>,
  bucket: string,
  paths: string[]
) {
  if (paths.length === 0) return
  for (let i = 0; i < paths.length; i += 50) {
    const batch = paths.slice(i, i + 50)
    const { error } = await adminClient.storage.from(bucket).remove(batch)
    if (error) {
      console.error(`Best-effort storage cleanup warning (${bucket}):`, error.message)
    }
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { id } = await params
    const targetId = decodeURIComponent(id).trim()

    if (!UUID_REGEX.test(targetId)) {
      return NextResponse.json({ error: "รหัสผู้ใช้งานไม่ถูกต้อง" }, { status: 400 })
    }

    if (targetId === auth.user.id) {
      return NextResponse.json(
        { error: "ไม่สามารถลบบัญชีแอดมินที่กำลังใช้งานอยู่ได้" },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const confirmText = typeof body.confirm_text === "string" ? body.confirm_text.trim() : ""
    const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 300) : ""

    const adminClient = createAdminClient()

    const [{ data: profile, error: profileError }, { data: authLookup, error: authLookupError }] =
      await Promise.all([
        adminClient
          .from("profiles")
          .select("id, customer_code, full_name, role, line_uid")
          .eq("id", targetId)
          .maybeSingle(),
        adminClient.auth.admin.getUserById(targetId),
      ])

    if (profileError) throw profileError
    if (authLookupError && !/not found/i.test(authLookupError.message)) {
      throw authLookupError
    }

    if (!profile && !authLookup?.user) {
      return NextResponse.json({ error: "ไม่พบบัญชีผู้ใช้งานนี้ในระบบ" }, { status: 404 })
    }

    if (profile?.role === "ADMIN") {
      return NextResponse.json(
        { error: "ไม่สามารถลบบัญชีผู้ดูแลระบบ (ADMIN) จากหน้านี้ได้" },
        { status: 403 }
      )
    }

    const expectedConfirmation = profile?.customer_code?.trim() || "DELETE"
    if (confirmText.toUpperCase() !== expectedConfirmation.toUpperCase()) {
      return NextResponse.json(
        { error: `กรุณากรอกรหัสยืนยัน "${expectedConfirmation}" ให้ถูกต้อง` },
        { status: 400 }
      )
    }

    // 1. Collect all customer-owned & linked records before deleting
    const [{ data: customerInquiries, error: inqErr }, { data: customerOrders, error: ordErr }] =
      await Promise.all([
        adminClient.from("inquiries").select("id, image_url, items").eq("customer_id", targetId),
        adminClient.from("orders").select("id").eq("customer_id", targetId),
      ])

    if (inqErr) throw inqErr
    if (ordErr) throw ordErr

    const inquiryIds = (customerInquiries || []).map((row) => row.id)

    const quotationIdSet = new Set<string>()
    const { data: directQuotations, error: qErr1 } = await adminClient
      .from("quotations")
      .select("id")
      .eq("customer_id", targetId)
    if (qErr1) throw qErr1
    for (const row of directQuotations || []) quotationIdSet.add(row.id)

    if (inquiryIds.length > 0) {
      const { data: inquiryQuotations, error: qErr2 } = await adminClient
        .from("quotations")
        .select("id")
        .in("inquiry_id", inquiryIds)
      if (qErr2) throw qErr2
      for (const row of inquiryQuotations || []) quotationIdSet.add(row.id)
    }

    const quotationIds = Array.from(quotationIdSet)
    const orderIdSet = new Set<string>((customerOrders || []).map((row) => row.id))

    if (quotationIds.length > 0) {
      const { data: quotedOrders, error: qOrdErr } = await adminClient
        .from("orders")
        .select("id")
        .in("quotation_id", quotationIds)
      if (qOrdErr) throw qOrdErr
      for (const row of quotedOrders || []) orderIdSet.add(row.id)
    }

    const allOrderIds = Array.from(orderIdSet)

    // 2. Collect storage object paths from payments & inquiries
    let slipPaths: string[] = []
    if (allOrderIds.length > 0) {
      const { data: paymentsData, error: paySelectErr } = await adminClient
        .from("payments")
        .select("slip_url")
        .in("order_id", allOrderIds)
      if (paySelectErr) throw paySelectErr

      slipPaths = Array.from(
        new Set(
          (paymentsData || [])
            .map((row) => extractStorageObjectPath(row.slip_url, "payment_slips"))
            .filter(Boolean)
        )
      )
    }
    const inquiryImagePaths = collectInquiryStoragePaths(customerInquiries || [])

    await Promise.all([
      removeStorageFiles(adminClient, "payment_slips", slipPaths),
      removeStorageFiles(adminClient, "inquiries", inquiryImagePaths),
    ])

    // 3. Delete child records in strict foreign-key order (handles ON DELETE RESTRICT cleanly)
    const { error: refundByCustErr } = await adminClient.from("refunds").delete().eq("customer_id", targetId)
    if (refundByCustErr) throw refundByCustErr

    if (allOrderIds.length > 0) {
      const { error: refundByOrderErr } = await adminClient.from("refunds").delete().in("order_id", allOrderIds)
      if (refundByOrderErr) throw refundByOrderErr

      const { error: payDelErr } = await adminClient.from("payments").delete().in("order_id", allOrderIds)
      if (payDelErr) throw payDelErr

      const { error: logsByOrderErr } = await adminClient.from("tracking_logs").delete().in("order_id", allOrderIds)
      if (logsByOrderErr) throw logsByOrderErr

      const { error: shipByOrderErr } = await adminClient.from("shipments").delete().in("order_id", allOrderIds)
      if (shipByOrderErr) throw shipByOrderErr

      const { error: unconsolidateErr } = await adminClient
        .from("orders")
        .update({ consolidated_into_id: null })
        .in("consolidated_into_id", allOrderIds)
      if (unconsolidateErr) throw unconsolidateErr
    }

    const { error: shipByCustErr } = await adminClient.from("shipments").delete().eq("customer_id", targetId)
    if (shipByCustErr) throw shipByCustErr

    if (allOrderIds.length > 0) {
      const { error: ordDelByIdsErr } = await adminClient.from("orders").delete().in("id", allOrderIds)
      if (ordDelByIdsErr) throw ordDelByIdsErr
    }

    const { error: ordDelByCustErr } = await adminClient.from("orders").delete().eq("customer_id", targetId)
    if (ordDelByCustErr) throw ordDelByCustErr

    if (quotationIds.length > 0) {
      const { error: quotDelByIdsErr } = await adminClient.from("quotations").delete().in("id", quotationIds)
      if (quotDelByIdsErr) throw quotDelByIdsErr
    }

    const { error: quotDelByCustErr } = await adminClient.from("quotations").delete().eq("customer_id", targetId)
    if (quotDelByCustErr) throw quotDelByCustErr

    const { error: inqDelErr } = await adminClient.from("inquiries").delete().eq("customer_id", targetId)
    if (inqDelErr) throw inqDelErr

    const { error: walletDelErr } = await adminClient.from("wallet_transactions").delete().eq("customer_id", targetId)
    if (walletDelErr) throw walletDelErr

    const { error: addrDelErr } = await adminClient.from("addresses").delete().eq("customer_id", targetId)
    if (addrDelErr) throw addrDelErr

    const { error: notifDelErr } = await adminClient
      .from("notification_logs")
      .delete()
      .eq("recipient_profile_id", targetId)
    if (notifDelErr) throw notifDelErr

    const { error: trackingActorErr } = await adminClient
      .from("tracking_logs")
      .update({ created_by: null })
      .eq("created_by", targetId)
    if (trackingActorErr) throw trackingActorErr

    // 4. Delete profile row & Supabase Auth user
    if (profile) {
      const { error: profileDelErr } = await adminClient.from("profiles").delete().eq("id", targetId)
      if (profileDelErr) throw profileDelErr
    }

    if (authLookup?.user) {
      const { error: authDelErr } = await adminClient.auth.admin.deleteUser(targetId)
      if (authDelErr) throw authDelErr
    }

    // 5. Record deletion in admin audit log
    await adminClient.from("admin_audit_logs").insert({
      actor_id: auth.user.id,
      action: "DELETE_CUSTOMER_ACCOUNT",
      entity_type: "customer",
      entity_id: targetId,
      old_data: {
        customer_code: profile?.customer_code || null,
        full_name: profile?.full_name || null,
        had_profile: Boolean(profile),
        had_auth_user: Boolean(authLookup?.user),
        deleted_orders: allOrderIds.length,
        deleted_inquiries: inquiryIds.length,
        deleted_storage_files: slipPaths.length + inquiryImagePaths.length,
      },
      reason: reason || "ลบบัญชีลูกค้า/ข้อมูลทดสอบแบบสะอาดจากหน้า Admin",
    })

    return NextResponse.json({
      success: true,
      message: "ลบบัญชีและข้อมูลที่เกี่ยวข้องทั้งหมดเรียบร้อยแล้ว",
      deleted: {
        orders: allOrderIds.length,
        inquiries: inquiryIds.length,
        storageFiles: slipPaths.length + inquiryImagePaths.length,
      },
    })
  } catch (error) {
    console.error("Failed to cleanly delete customer account:", error)
    return NextResponse.json(
      { error: "ไม่สามารถลบบัญชีได้ครบถ้วน กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง" },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"

import { requireAdmin } from "@/lib/require-admin"
import { sendCustomerNotification } from "@/lib/notify"

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

    if (data?.customer_id && data?.order_number) {
      await sendCustomerNotification(
        data.customer_id,
        `📦 อนุมัติรายการฝากนำเข้าเรียบร้อยแล้ว!\nเลขที่ออเดอร์: ${data.order_number}\nสถานะ: รอรับพัสดุที่โกดังจีน\nดูรายละเอียดได้ที่: https://www.sabuyship.com/dashboard/orders/${data.order_number}`
      ).catch((err) => console.error("Failed to send import approval notification:", err))
    }

    return NextResponse.json({ success: true, ...data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Unable to approve import request" }, { status: 500 })
  }
}

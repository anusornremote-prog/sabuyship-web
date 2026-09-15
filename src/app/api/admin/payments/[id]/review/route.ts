import { NextResponse } from "next/server"

import { sendCustomerNotification } from "@/lib/notify"
import { requireAdmin } from "@/lib/require-admin"

type ReviewResult = {
  customer_id: string | null
  decision: "APPROVE" | "REJECT"
  order_number: string
  payment_round: 1 | 2 | 3
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { id } = await params
    const body = await request.json()
    const decision = body.decision === "APPROVE" ? "APPROVE" : body.decision === "REJECT" ? "REJECT" : null
    const rejectionReason = typeof body.rejection_reason === "string" ? body.rejection_reason.trim() : ""

    if (!decision || (decision === "REJECT" && !rejectionReason)) {
      return NextResponse.json({ error: "Invalid review details" }, { status: 400 })
    }

    const { data, error } = await auth.supabase.rpc("admin_review_payment", {
      p_payment_id: id,
      p_decision: decision,
      p_rejection_reason: rejectionReason || null,
    })
    if (error) {
      const status = /already reviewed|not awaiting review|does not match/i.test(error.message) ? 409 : 400
      return NextResponse.json({ error: error.message }, { status })
    }

    const result = data as ReviewResult
    let message = ""
    if (decision === "APPROVE") {
      const details: Record<number, string> = {
        1: "ระบบกำลังดำเนินการสั่งซื้อสินค้าให้คุณค่ะ",
        2: "สินค้าจะถูกจัดส่งมายังโกดังไทยในขั้นตอนต่อไปค่ะ",
        3: "สินค้ากำลังเตรียมนำจ่ายถึงมือคุณค่ะ",
      }
      message = `✅ ยอดชำระเงินรอบที่ ${result.payment_round} ได้รับการอนุมัติแล้ว\n${details[result.payment_round]}`
    } else {
      message = `⚠️ สลิปชำระเงินรอบที่ ${result.payment_round} สำหรับออเดอร์ ${result.order_number} ไม่ผ่านการตรวจสอบ\n\n📌 เหตุผล: ${rejectionReason}\n\n👉 กรุณาเข้าสู่ระบบเพื่อแนบสลิปใหม่อีกครั้งค่ะ`
    }

    const notificationSent = result.customer_id
      ? await sendCustomerNotification(result.customer_id, message)
      : false

    return NextResponse.json({ success: true, data: result, notification_sent: notificationSent })
  } catch {
    return NextResponse.json({ error: "Unable to review payment" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"

import { sendAdminNotification } from "@/lib/notify"
import { isPaymentConfigured } from "@/lib/public-business-config"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!isPaymentConfigured) {
      return NextResponse.json({ error: "Payment channel is not available" }, { status: 503 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบใหม่ก่อนแนบสลิป" }, { status: 401 })

    const { id: orderId } = await params
    const contentType = request.headers.get("content-type") || ""

    let paymentRound = 0
    let amount = 0
    let slipPath = ""
    let paymentDate = new Date()

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      paymentRound = Number(formData.get("payment_round"))
      amount = Number(formData.get("amount"))
      const rawDate = formData.get("payment_date")
      paymentDate = rawDate ? new Date(String(rawDate)) : new Date()
      const file = formData.get("file") as File | null

      if (!file || file.size === 0) {
        return NextResponse.json({ error: "กรุณาเลือกรูปสลิปหลักฐานการโอน" }, { status: 400 })
      }
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "ไฟล์สลิปมีขนาดใหญ่เกิน 5MB" }, { status: 400 })
      }

      const mime = file.type && ["image/jpeg", "image/png", "image/webp"].includes(file.type)
        ? file.type
        : "image/jpeg"
      const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg"
      const targetPath = `${user.id}/${orderId}/slip-${Date.now()}.${ext}`

      const arrayBuffer = await file.arrayBuffer()
      const adminClient = createAdminClient()
      const { data: uploadData, error: uploadError } = await adminClient.storage
        .from("payment_slips")
        .upload(targetPath, Buffer.from(arrayBuffer), {
          contentType: mime,
          upsert: true,
        })

      if (uploadError || !uploadData?.path) {
        console.error("Server-side slip upload failed:", uploadError)
        return NextResponse.json({ error: uploadError?.message || "อัปโหลดรูปสลิปไม่สำเร็จ" }, { status: 400 })
      }
      slipPath = uploadData.path
    } else {
      const body = await request.json()
      paymentRound = Number(body.payment_round)
      amount = Number(body.amount)
      slipPath = typeof body.slip_path === "string" ? body.slip_path.trim() : ""
      paymentDate = body.payment_date ? new Date(body.payment_date) : new Date()
    }

    if (Number.isNaN(paymentDate.getTime())) {
      paymentDate = new Date()
    }

    if (![1, 2, 3].includes(paymentRound) || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "ข้อมูลยอดชำระเงินไม่ถูกต้อง" }, { status: 400 })
    }

    const expectedPrefix = `${user.id}/${orderId}/`
    if (!slipPath.startsWith(expectedPrefix) || slipPath.includes("..")) {
      return NextResponse.json({ error: "เส้นทางไฟล์สลิปไม่ถูกต้อง" }, { status: 400 })
    }

    const { data, error } = await supabase.rpc("customer_submit_payment", {
      p_order_id: orderId,
      p_payment_round: paymentRound,
      p_amount: amount,
      p_payment_date: paymentDate.toISOString(),
      p_slip_path: slipPath,
    })
    if (error) {
      const status = /not found/i.test(error.message) ? 404 : /not accepting|already exists/i.test(error.message) ? 409 : 400
      return NextResponse.json({ error: error.message }, { status })
    }

    const result = data as {
      order_number: string
      customer_name: string
      payment_round: number
      amount: number
    }
    const notified = await sendAdminNotification(
      `💰 ลูกค้าคุณ ${result.customer_name} แนบสลิปชำระเงินแล้ว\nออเดอร์: ${result.order_number}\nรอบที่: ${result.payment_round}\nยอดเงิน: ${Number(result.amount).toLocaleString("th-TH")} บาท`,
    )

    return NextResponse.json({ success: true, notification_sent: notified }, { status: 201 })
  } catch (error: unknown) {
    console.error("Payment submission failed", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

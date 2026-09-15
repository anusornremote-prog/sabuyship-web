"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function RefundActions({ refund }: { refund: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const update = async (status: "APPROVED" | "PAID" | "FAILED" | "CANCELED") => {
    const reason = prompt("ระบุหมายเหตุการดำเนินการ")?.trim() || ""
    let refundMethod = ""
    let paymentReference = ""
    if (status === "PAID") {
      refundMethod = prompt("วิธีคืนเงิน เช่น โอนธนาคาร")?.trim() || ""
      paymentReference = prompt("เลขอ้างอิงการคืนเงิน")?.trim() || ""
      if (!refundMethod || !paymentReference) return
    }
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/refunds/${refund.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason, refund_method: refundMethod, payment_reference: paymentReference }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "ดำเนินการไม่สำเร็จ")
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : "ดำเนินการไม่สำเร็จ")
    } finally {
      setLoading(false)
    }
  }

  if (["PAID", "CANCELED"].includes(refund.status)) return null
  return (
    <div className="flex flex-wrap gap-2">
      {refund.status === "PENDING" && <Button size="sm" variant="outline" disabled={loading} onClick={() => update("APPROVED")}>อนุมัติยอดคืน</Button>}
      <Button size="sm" disabled={loading} onClick={() => update("PAID")}>ยืนยันคืนเงินแล้ว</Button>
      <Button size="sm" variant="outline" disabled={loading} onClick={() => update("FAILED")}>ดำเนินการไม่สำเร็จ</Button>
      <Button size="sm" variant="ghost" disabled={loading} onClick={() => update("CANCELED")}>ยกเลิก</Button>
    </div>
  )
}

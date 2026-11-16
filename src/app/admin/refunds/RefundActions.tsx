"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ConfirmDialog, type ConfirmDialogField } from "@/components/ui/confirm-dialog"

type RefundStatusAction = "APPROVED" | "PAID" | "FAILED" | "CANCELED"

const ACTION_DIALOG_CONFIG: Record<
  RefundStatusAction,
  {
    title: string
    description: string
    confirmLabel: string
    variant: "default" | "destructive"
    fields: ConfirmDialogField[]
  }
> = {
  APPROVED: {
    title: "อนุมัติยอดคืนเงิน",
    description: "ยืนยันการอนุมัติคำขอคืนเงินรายการนี้",
    confirmLabel: "อนุมัติ",
    variant: "default",
    fields: [
      {
        name: "reason",
        label: "หมายเหตุการดำเนินการ",
        placeholder: "ระบุหมายเหตุ (ถ้ามี)",
      },
    ],
  },
  PAID: {
    title: "ยืนยันคืนเงินให้ลูกค้าแล้ว",
    description: "กรอกช่องทางและเลขอ้างอิงการโอนเงินคืนเพื่อบันทึกหลักฐาน",
    confirmLabel: "ยืนยันคืนเงินแล้ว",
    variant: "default",
    fields: [
      {
        name: "refund_method",
        label: "วิธีคืนเงิน",
        placeholder: "เช่น โอนธนาคาร / พร้อมเพย์",
        required: true,
      },
      {
        name: "payment_reference",
        label: "เลขอ้างอิงการคืนเงิน",
        placeholder: "เลขที่รายการ / สลิปอ้างอิง",
        required: true,
      },
      {
        name: "reason",
        label: "หมายเหตุเพิ่มเติม",
        placeholder: "ระบุหมายเหตุ (ถ้ามี)",
      },
    ],
  },
  FAILED: {
    title: "บันทึกการคืนเงินไม่สำเร็จ",
    description: "กรุณาระบุสาเหตุที่การคืนเงินไม่สำเร็จ",
    confirmLabel: "บันทึกสถานะ",
    variant: "destructive",
    fields: [
      {
        name: "reason",
        label: "สาเหตุที่ไม่สำเร็จ",
        placeholder: "เช่น บัญชีปลายทางไม่ถูกต้อง",
        required: true,
      },
    ],
  },
  CANCELED: {
    title: "ยกเลิกรายการคืนเงิน",
    description: "ยืนยันการยกเลิกรายการคืนเงินนี้",
    confirmLabel: "ยืนยันยกเลิก",
    variant: "destructive",
    fields: [
      {
        name: "reason",
        label: "เหตุผลการยกเลิก",
        placeholder: "ระบุเหตุผล (ถ้ามี)",
      },
    ],
  },
}

export function RefundActions({ refund }: { refund: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [pendingAction, setPendingAction] = useState<RefundStatusAction | null>(null)

  const handleConfirm = async (values: Record<string, string>) => {
    if (!pendingAction) return
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/refunds/${refund.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: pendingAction,
          reason: values.reason || "",
          refund_method: values.refund_method || "",
          payment_reference: values.payment_reference || "",
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "ดำเนินการไม่สำเร็จ")
      toast.success("อัปเดตสถานะการคืนเงินเรียบร้อยแล้ว")
      setPendingAction(null)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ดำเนินการไม่สำเร็จ")
    } finally {
      setLoading(false)
    }
  }

  if (["PAID", "CANCELED"].includes(refund.status)) return null
  const dialogConfig = pendingAction ? ACTION_DIALOG_CONFIG[pendingAction] : null

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {refund.status === "PENDING" && (
          <Button size="sm" variant="outline" disabled={loading} onClick={() => setPendingAction("APPROVED")}>
            อนุมัติยอดคืน
          </Button>
        )}
        <Button size="sm" disabled={loading} onClick={() => setPendingAction("PAID")}>
          ยืนยันคืนเงินแล้ว
        </Button>
        <Button size="sm" variant="outline" disabled={loading} onClick={() => setPendingAction("FAILED")}>
          ดำเนินการไม่สำเร็จ
        </Button>
        <Button size="sm" variant="ghost" disabled={loading} onClick={() => setPendingAction("CANCELED")}>
          ยกเลิก
        </Button>
      </div>

      {dialogConfig && (
        <ConfirmDialog
          open={Boolean(pendingAction)}
          onOpenChange={(open) => !open && setPendingAction(null)}
          title={dialogConfig.title}
          description={dialogConfig.description}
          confirmLabel={dialogConfig.confirmLabel}
          variant={dialogConfig.variant}
          fields={dialogConfig.fields}
          loading={loading}
          onConfirm={handleConfirm}
        />
      )}
    </>
  )
}

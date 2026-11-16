'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { CheckCircle, Loader2 } from "lucide-react"

export function ConfirmReceiptButton({ orderId, status }: { orderId: string, status: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (status !== 'OUT_FOR_DELIVERY') return null

  const executeConfirm = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/order/${orderId}/confirm-receipt`, {
        method: "POST"
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการยืนยัน")
      }

      toast.success("ยืนยันการได้รับสินค้าสำเร็จ!")
      setConfirmOpen(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการยืนยัน")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button 
        onClick={() => setConfirmOpen(true)}
        disabled={loading}
        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-sm min-h-11"
      >
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" /> : <CheckCircle className="h-4 w-4 mr-2" aria-hidden="true" />}
        <span>ยืนยันการได้รับสินค้า</span>
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="ยืนยันการได้รับสินค้า"
        description="คุณได้รับสินค้าเรียบร้อยแล้วใช่หรือไม่?"
        confirmLabel="ยืนยันได้รับสินค้า"
        loading={loading}
        onConfirm={executeConfirm}
      />
    </>
  )
}

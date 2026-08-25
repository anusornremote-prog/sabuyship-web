'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2 } from "lucide-react"

export function ConfirmReceiptButton({ orderId, status }: { orderId: string, status: string }) {
  const [loading, setLoading] = useState(false)

  if (status !== 'OUT_FOR_DELIVERY') return null

  const handleConfirm = async () => {
    if (!confirm("คุณได้รับสินค้าเรียบร้อยแล้วใช่หรือไม่?")) return

    try {
      setLoading(true)
      const res = await fetch(`/api/order/${orderId}/confirm-receipt`, {
        method: "POST"
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการยืนยัน")
      }

      alert("ยืนยันการได้รับสินค้าสำเร็จ!")
      window.location.reload()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleConfirm}
      disabled={loading}
      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-sm"
    >
      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
      ยืนยันการได้รับสินค้า
    </Button>
  )
}

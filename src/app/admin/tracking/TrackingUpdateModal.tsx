import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/custom-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Truck, AlertCircle } from "lucide-react"

interface TrackingUpdateModalProps {
  isOpen: boolean
  onClose: () => void
  order: any
  onSuccess: () => void
}

const ORDER_STATUSES = [
  { value: "SHIPPING", label: "กำลังจัดส่งมาไทย" },
  { value: "THAILAND_WAREHOUSE", label: "ถึงโกดังไทยแล้ว" },
  { value: "DELIVERED", label: "จัดส่งให้ลูกค้าแล้ว (เสร็จสิ้น)" }
]

export function TrackingUpdateModal({ isOpen, onClose, order, onSuccess }: TrackingUpdateModalProps) {
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const [status, setStatus] = useState("")
  const [shippingCompany, setShippingCompany] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (order) {
      setStatus(order.status || "SHIPPING")
      setShippingCompany(order.shipping_company || "")
      setTrackingNumber(order.tracking_number || "")
      setNotes("")
    }
    setErrorMsg("")
  }, [order, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!status || !notes.trim()) {
      setErrorMsg("กรุณาเลือกสถานะและระบุรายละเอียดการอัปเดต")
      return
    }

    try {
      setLoading(true)
      setErrorMsg("")

      const response = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          shipping_company: shippingCompany,
          tracking_number: trackingNumber,
          reason: notes.trim(),
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "ไม่สามารถอัปเดตข้อมูลได้")

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error("Error updating tracking:", error)
      setErrorMsg(error.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล")
    } finally {
      setLoading(false)
    }
  }

  if (!order) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            อัปเดตสถานะและการจัดส่ง
          </DialogTitle>
          <DialogDescription>
            อัปเดตข้อมูลการจัดส่งและเลขพัสดุสำหรับออเดอร์ <span className="font-bold text-slate-900">{order.order_number}</span>
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm flex items-center gap-2 border border-rose-100 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">สถานะปัจจุบัน</label>
            <select
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              required
            >
              <option value="" disabled>-- เลือกสถานะ --</option>
              {ORDER_STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">บริษัทขนส่งในไทย (เช่น Kerry, Flash Express)</label>
            <Input
              placeholder="ไม่ต้องระบุหากยังไม่ถึงไทย"
              value={shippingCompany}
              onChange={(e) => setShippingCompany(e.target.value)}
              list="shipping-companies"
            />
            <datalist id="shipping-companies">
              <option value="Flash Express" />
              <option value="Kerry Express" />
              <option value="J&T Express" />
              <option value="Thailand Post (EMS)" />
              <option value="Best Express" />
              <option value="Shopee Express" />
            </datalist>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">หมายเลขพัสดุ (Tracking Number)</label>
            <Input
              placeholder="ระบุหมายเลขพัสดุ..."
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">บันทึกเพิ่มเติม (บันทึกลงใน Timeline ของลูกค้า)</label>
            <Input
              placeholder="ตัวอย่าง: สินค้าถึงโกดังไทย กำลังเตรียมจัดส่งให้ลูกค้า"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required
            />
          </div>

          <DialogFooter className="pt-4 border-t mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              บันทึกอัปเดต
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Truck, Package, Info, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface ChinaTrackingModalProps {
  isOpen: boolean
  onClose: () => void
  order: any
  onSuccess: () => void
}

export function ChinaTrackingModal({
  isOpen,
  onClose,
  order,
  onSuccess,
}: ChinaTrackingModalProps) {
  const [singleTracking, setSingleTracking] = useState("")
  const [usePerItem, setUsePerItem] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [notifyCustomer, setNotifyCustomer] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen && order) {
      setError("")
      let inquiryItems = order.quotation?.inquiry?.items || []
      if (typeof inquiryItems === "string") {
        try {
          inquiryItems = JSON.parse(inquiryItems)
        } catch {
          inquiryItems = []
        }
      }

      const parsedItems = inquiryItems.map((item: any) => ({
        ...item,
        inputTrackingCN: item.tracking_cn_cn || item.china_tracking_number || "",
      }))

      setItems(parsedItems)

      // Find if all items have same tracking or if there's an existing tracking
      const existingTrackings: string[] = parsedItems
        .map((it: any) => (it.inputTrackingCN || "").toString().trim())
        .filter((s: string) => s.length > 0)
      const uniqueTrackings: string[] = Array.from(new Set(existingTrackings))

      if (uniqueTrackings.length > 1) {
        setUsePerItem(true)
        setSingleTracking("")
      } else {
        setUsePerItem(false)
        setSingleTracking(uniqueTrackings[0] || "")
      }
    }
  }, [isOpen, order])

  const handleItemTrackingChange = (idx: number, value: string) => {
    const updated = [...items]
    updated[idx].inputTrackingCN = value
    setItems(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    let payload: any = {
      notify_customer: notifyCustomer,
    }

    if (usePerItem) {
      const hasAny = items.some((it) => it.inputTrackingCN?.trim())
      if (!hasAny && !confirm("คุณยังไม่ได้กรอกเลขแทร็กจีน ต้องการบันทึกเป็นค่าว่างใช่หรือไม่?")) {
        return
      }
      payload.items = items.map((it) => ({
        tracking_cn_cn: it.inputTrackingCN?.trim() || "",
        china_tracking_number: it.inputTrackingCN?.trim() || "",
      }))
    } else {
      if (!singleTracking.trim() && !confirm("คุณยังไม่ได้กรอกเลขแทร็กจีน ต้องการบันทึกเป็นค่าว่างใช่หรือไม่?")) {
        return
      }
      payload.tracking_number = singleTracking.trim()
    }

    try {
      setLoading(true)
      setError("")

      const res = await fetch(`/api/admin/orders/${order.id}/china-tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการบันทึก")
      }

      toast.success(
        payload.tracking_number || (payload.items && payload.items.some((i: any) => i.tracking_cn_cn))
          ? "บันทึกเลขแทร็กขนส่งจีนสำเร็จ!"
          : "อัปเดตข้อมูลพัสดุเรียบร้อย"
      )

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการบันทึก")
    } finally {
      setLoading(false)
    }
  }

  if (!order) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90dvh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xl">🇨🇳</span>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                ใส่เลขแทร็กขนส่งจีน (China Domestic Tracking)
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                ออเดอร์: <span className="font-semibold text-slate-700">{order.order_number}</span>
                {order.profiles?.customer_code && (
                  <span className="ml-2 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-mono text-[11px]">
                    {order.profiles.customer_code}
                  </span>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Workflow Info Box */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-amber-950">
                <Info className="h-4 w-4 shrink-0 text-amber-600" />
                <span>ขั้นตอนการติดตามพัสดุในจีน:</span>
              </div>
              <p className="leading-relaxed pl-5">
                1. <strong>ใส่เลขแทร็กจีนตอนนี้:</strong> ลูกค้าจะได้รับเลขแทร็กและทราบว่าร้านค้าในจีนจัดส่งแล้ว กำลังเดินทางไปโกดังจีน
              </p>
              <p className="leading-relaxed pl-5">
                2. <strong>เมื่อของมาถึงโกดังจีน:</strong> แอดมินจึงกดปุ่ม <em>&quot;ถึงโกดังจีน (แจ้งบิล)&quot;</em> เพื่อใส่ค่าขนส่งจีน-ไทย (รอบ 2)
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
                {error}
              </div>
            )}

            {/* Toggle per item if multiple items exist */}
            {items.length > 1 && (
              <div className="flex items-center justify-between bg-slate-100/70 p-2.5 rounded-lg border border-slate-200">
                <span className="text-xs font-medium text-slate-700">รูปแบบการกรอกเลขแทร็ก</span>
                <div className="flex gap-1 bg-white p-0.5 rounded border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setUsePerItem(false)}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      !usePerItem
                        ? "bg-primary text-white font-medium"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    เลขเดียวทั้งหมด
                  </button>
                  <button
                    type="button"
                    onClick={() => setUsePerItem(true)}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      usePerItem
                        ? "bg-primary text-white font-medium"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    แยกตามสินค้า ({items.length} รายการ)
                  </button>
                </div>
              </div>
            )}

            {!usePerItem ? (
              <div className="space-y-2">
                <label htmlFor="single-tracking" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 text-primary" />
                  หมายเลขพัสดุจีน (Chinese Domestic Tracking Number)
                </label>
                <Input
                  id="single-tracking"
                  value={singleTracking}
                  onChange={(e) => setSingleTracking(e.target.value)}
                  placeholder="เช่น YT7732189498274, 781293849102"
                  className="font-mono text-sm uppercase tracking-wide bg-white"
                  autoFocus
                />
                <p className="text-[11px] text-slate-400">
                  ใส่เลขแทร็กกิ้งที่ได้จากร้านค้าจีน (Taobao, 1688, Tmall ฯลฯ)
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-700 block">
                  ระบุเลขพัสดุจีนสำหรับแต่ละรายการสินค้า
                </label>
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">
                          รายการที่ {idx + 1}
                        </span>
                        {item.quantity && (
                          <span className="text-slate-500 text-[11px]">
                            จำนวน: {item.quantity} ชิ้น
                          </span>
                        )}
                      </div>
                      {item.url && (
                        <p className="text-[11px] text-slate-500 truncate" title={item.url}>
                          {item.url}
                        </p>
                      )}
                      <Input
                        value={item.inputTrackingCN}
                        onChange={(e) => handleItemTrackingChange(idx, e.target.value)}
                        placeholder="เลขแทร็กจีนของรายการนี้"
                        className="font-mono text-xs uppercase bg-white h-8"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notification Checkbox */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 hover:text-slate-900">
                <input
                  type="checkbox"
                  checked={notifyCustomer}
                  onChange={(e) => setNotifyCustomer(e.target.checked)}
                  className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4"
                />
                <span>ส่งแจ้งเตือนให้ลูกค้าผ่าน LINE / ระบบแจ้งเตือน</span>
              </label>
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="text-xs"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Truck className="h-3.5 w-3.5" />
                  บันทึกเลขแทร็กจีน
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

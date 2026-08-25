"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Loader2, PackageX, CheckCircle2, DollarSign } from "lucide-react"
import { toast } from "sonner"

interface OutOfStockModalProps {
  isOpen: boolean
  onClose: () => void
  order: any
  onSuccess: () => void
}

export function OutOfStockModal({ isOpen, onClose, order, onSuccess }: OutOfStockModalProps) {
  const [items, setItems] = useState<any[]>([])
  const [cancelEntireOrder, setCancelEntireOrder] = useState(false)
  const [generalNote, setGeneralNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen && order) {
      const quotation = Array.isArray(order.quotation) ? order.quotation[0] : order.quotation
      const inquiry = Array.isArray(quotation?.inquiry) ? quotation.inquiry[0] : quotation?.inquiry

      let inquiryItems = inquiry?.items || []
      if (typeof inquiryItems === "string") {
        try {
          inquiryItems = JSON.parse(inquiryItems)
        } catch (e) {
          inquiryItems = []
        }
      }

      // Initialize state for each item
      const initialized = inquiryItems.map((item: any) => {
        const totalQty = Number(item.quantity) || 1
        const pricePerUnit = Number(item.price_thb) || (item.quoted_price ? Number(item.quoted_price) / totalQty : 0)

        return {
          ...item,
          totalQty,
          pricePerUnit: Math.round(pricePerUnit),
          isOutOfStock: !!item.is_out_of_stock,
          outOfStockQty: item.out_of_stock_qty !== undefined ? item.out_of_stock_qty : (item.is_out_of_stock ? totalQty : 0),
          outOfStockNote: item.out_of_stock_note || ""
        }
      })

      setItems(initialized)
      setCancelEntireOrder(order.status === "CANCELED")
      setGeneralNote("")
      setError("")
    }
  }, [isOpen, order])

  const handleToggleItem = (index: number, checked: boolean) => {
    const updated = [...items]
    updated[index].isOutOfStock = checked
    if (checked) {
      if (!updated[index].outOfStockQty || updated[index].outOfStockQty === 0) {
        updated[index].outOfStockQty = updated[index].totalQty
      }
    } else {
      updated[index].outOfStockQty = 0
    }
    setItems(updated)
  }

  const handleQtyChange = (index: number, val: number) => {
    const updated = [...items]
    const maxQty = updated[index].totalQty
    const safeQty = Math.max(1, Math.min(val, maxQty))
    updated[index].outOfStockQty = safeQty
    setItems(updated)
  }

  const handleNoteChange = (index: number, note: string) => {
    const updated = [...items]
    updated[index].outOfStockNote = note
    setItems(updated)
  }

  // Calculate total refund
  const totalRefundAmount = items.reduce((sum, item) => {
    if (item.isOutOfStock && item.outOfStockQty > 0) {
      return sum + (item.outOfStockQty * item.pricePerUnit)
    }
    return sum
  }, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!order) return

    try {
      setLoading(true)
      setError("")

      const quotation = Array.isArray(order.quotation) ? order.quotation[0] : order.quotation
      const inquiry = Array.isArray(quotation?.inquiry) ? quotation.inquiry[0] : quotation?.inquiry
      const inquiryId = inquiry?.id

      if (!inquiryId) {
        throw new Error("ไม่พบ Inquiry ID ที่ผูกกับออเดอร์นี้")
      }

      // Format items to save
      const updatedItemsToSave = items.map((item) => {
        const itemRefund = item.isOutOfStock && item.outOfStockQty > 0 ? (item.outOfStockQty * item.pricePerUnit) : 0
        return {
          ...item,
          is_out_of_stock: item.isOutOfStock,
          out_of_stock_qty: item.isOutOfStock ? item.outOfStockQty : 0,
          out_of_stock_note: item.isOutOfStock ? item.outOfStockNote : "",
          refund_amount: itemRefund,
          out_of_stock_at: item.isOutOfStock ? (item.out_of_stock_at || new Date().toISOString()) : null,
          totalQty: undefined,
          pricePerUnit: undefined,
          isOutOfStock: undefined,
          outOfStockQty: undefined,
          outOfStockNote: undefined
        }
      })

      const res = await fetch(`/api/order/${order.id}/out-of-stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: updatedItemsToSave,
          inquiry_id: inquiryId,
          total_refund_amount: totalRefundAmount,
          cancel_entire_order: cancelEntireOrder,
          admin_note: generalNote
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการบันทึก")
      }

      toast.success(cancelEntireOrder ? "ยกเลิกคำสั่งซื้อและบันทึกยอดเงินคืนสำเร็จ" : "บันทึกสถานะสินค้าหมดและแจ้งเตือนลูกค้าเรียบร้อย")
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error(err)
      setError(err.message || "เกิดข้อผิดพลาดในการบันทึก")
    } finally {
      setLoading(false)
    }
  }

  if (!order) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="flex items-center gap-2 text-rose-700">
            <PackageX className="w-5 h-5 text-rose-600" />
            แจ้งสินค้าหมด / ปรับยอดเงินคืน
          </DialogTitle>
          <DialogDescription>
            ออเดอร์: <span className="font-semibold text-slate-900">{order.order_number}</span> (ระบุสินค้าที่ร้านจีนแจ้งว่าหมด เพื่อคำนวณยอดเงินคืนให้ลูกค้า)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Items List */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-800">
              รายการสินค้าในออเดอร์ ({items.length} รายการ)
            </label>

            {items.map((item, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-lg border transition-all ${
                  item.isOutOfStock
                    ? "bg-rose-50/70 border-rose-200 shadow-sm"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id={`oos-${idx}`}
                    checked={item.isOutOfStock}
                    onChange={(e) => handleToggleItem(idx, e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={`Item ${idx + 1}`}
                      className="w-12 h-12 object-cover rounded border border-slate-200 shrink-0 bg-white"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-slate-200 rounded flex items-center justify-center text-[10px] text-slate-500 shrink-0">
                      ไม่มีรูป
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <label htmlFor={`oos-${idx}`} className="cursor-pointer">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                          {item.url || `รายการที่ ${idx + 1}`}
                        </p>
                        <span className="text-xs font-bold text-slate-700 shrink-0">
                          ฿{(item.totalQty * item.pricePerUnit).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {item.color || item.size ? `ตัวเลือก: ${[item.color, item.size].filter(Boolean).join(" / ")}` : ""}
                        {" • "}จำนวนสั่ง: <span className="font-semibold text-slate-700">{item.totalQty} ชิ้น</span>
                        {" • "}ราคาชิ้นละ: ฿{item.pricePerUnit.toLocaleString()}
                      </p>
                    </label>

                    {/* Out of Stock Inputs */}
                    {item.isOutOfStock && (
                      <div className="mt-3 pt-3 border-t border-rose-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-semibold text-rose-900 block mb-1">
                            จำนวนที่หมด (ชิ้น) *
                          </label>
                          <Input
                            type="number"
                            min="1"
                            max={item.totalQty}
                            value={item.outOfStockQty}
                            onChange={(e) => handleQtyChange(idx, parseInt(e.target.value) || 1)}
                            className="h-8 text-sm bg-white border-rose-300 text-rose-900 font-bold"
                          />
                          <span className="text-[10px] text-rose-700 mt-0.5 block">
                            ยอดเงินคืนชิ้นนี้: ฿{(item.outOfStockQty * item.pricePerUnit).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-rose-900 block mb-1">
                            หมายเหตุ / เหตุผลจากร้านจีน
                          </label>
                          <Input
                            placeholder="เช่น สีนี้หมด, โรงงานเลิกผลิต"
                            value={item.outOfStockNote}
                            onChange={(e) => handleNoteChange(idx, e.target.value)}
                            className="h-8 text-sm bg-white border-rose-300"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Refund Summary Card */}
          <div className="p-4 bg-gradient-to-r from-rose-50 to-orange-50 rounded-xl border border-rose-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span className="text-xs font-semibold text-rose-900 block">ยอดเงินคืนลูกค้าทั้งหมด (Total Refund)</span>
              <p className="text-xs text-rose-700 mt-0.5">
                {items.filter(i => i.isOutOfStock).length > 0 
                  ? `สินค้าหมด ${items.filter(i => i.isOutOfStock).reduce((acc, i) => acc + (i.outOfStockQty || 0), 0)} ชิ้น จาก ${items.filter(i => i.isOutOfStock).length} รายการ`
                  : "ยังไม่ได้เลือกรายการที่หมด"}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-rose-600">
                ฿{totalRefundAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                id="cancel-entire"
                checked={cancelEntireOrder}
                onChange={(e) => setCancelEntireOrder(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
              <label htmlFor="cancel-entire" className="text-xs font-semibold text-slate-800 cursor-pointer">
                ยกเลิกทั้งคำสั่งซื้อ (เปลี่ยนสถานะออเดอร์เป็น CANCELED)
              </label>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                หมายเหตุเพิ่มเติมถึงลูกค้า (จะแนบไปกับข้อความ LINE)
              </label>
              <Input
                placeholder="เช่น ร้านจีนแจ้งของหมด สามารถกดขอรับเงินคืนได้เลยค่ะ"
                value={generalNote}
                onChange={(e) => setGeneralNote(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          <DialogFooter className="border-t pt-4 flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={loading || (totalRefundAmount === 0 && !cancelEntireOrder)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังบันทึก...
                </div>
              ) : (
                "บันทึกและส่งแจ้งเตือนลูกค้า"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

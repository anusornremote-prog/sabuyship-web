"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Truck, Info, ExternalLink, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface ChinaTrackingModalProps {
  isOpen: boolean
  onClose: () => void
  order: any
  onSuccess: () => void
}

const parseTrackingList = (raw: any): string[] => {
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw.map((s) => String(s || "").trim()).filter(Boolean)
  }
  return String(raw)
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function ChinaTrackingModal({
  isOpen,
  onClose,
  order,
  onSuccess,
}: ChinaTrackingModalProps) {
  const [trackingList, setTrackingList] = useState<string[]>([""])
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

      const parsedItems = inquiryItems.map((item: any) => {
        const list = parseTrackingList(
          item.tracking_numbers_cn || item.tracking_cn_cn || item.china_tracking_number
        )
        return {
          ...item,
          trackingList: list.length > 0 ? list : [""],
        }
      })

      setItems(parsedItems)

      // Check if different items have different tracking lists
      const itemJoinedStrings: string[] = parsedItems
        .map((it: any) => it.trackingList.filter(Boolean).join(", "))
        .filter((s: string) => s.length > 0)
      const uniqueItemJoined = Array.from(new Set(itemJoinedStrings))

      // Collect all unique tracking numbers across the order
      const allTrackings = Array.from(
        new Set(
          parsedItems.flatMap((it: any) =>
            it.trackingList.map((t: string) => t.trim()).filter(Boolean)
          )
        )
      ) as string[]

      if (parsedItems.length > 1 && uniqueItemJoined.length > 1) {
        setUsePerItem(true)
        setTrackingList(allTrackings.length > 0 ? allTrackings : [""])
      } else {
        setUsePerItem(false)
        setTrackingList(allTrackings.length > 0 ? allTrackings : [""])
      }
    }
  }, [isOpen, order])

  // Handlers for general multi-tracking list
  const handleTrackingRowChange = (index: number, value: string) => {
    const next = [...trackingList]
    next[index] = value
    setTrackingList(next)
  }

  const handleAddTrackingRow = () => {
    setTrackingList([...trackingList, ""])
  }

  const handleRemoveTrackingRow = (index: number) => {
    if (trackingList.length <= 1) {
      setTrackingList([""])
      return
    }
    setTrackingList(trackingList.filter((_, i) => i !== index))
  }

  // Handlers for per-item multi-tracking list
  const handleItemTrackingChange = (itemIdx: number, trackIdx: number, value: string) => {
    const updated = [...items]
    const nextList = [...(updated[itemIdx].trackingList || [""])]
    nextList[trackIdx] = value
    updated[itemIdx] = { ...updated[itemIdx], trackingList: nextList }
    setItems(updated)
  }

  const handleAddItemTrackingRow = (itemIdx: number) => {
    const updated = [...items]
    const nextList = [...(updated[itemIdx].trackingList || [""]), ""]
    updated[itemIdx] = { ...updated[itemIdx], trackingList: nextList }
    setItems(updated)
  }

  const handleRemoveItemTrackingRow = (itemIdx: number, trackIdx: number) => {
    const updated = [...items]
    const currentList = updated[itemIdx].trackingList || [""]
    const nextList = currentList.length <= 1 ? [""] : currentList.filter((_: any, i: number) => i !== trackIdx)
    updated[itemIdx] = { ...updated[itemIdx], trackingList: nextList }
    setItems(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload: any = {
      notify_customer: notifyCustomer,
    }

    if (usePerItem) {
      const cleanedPerItem = items.map((it) => {
        const list = (it.trackingList || [])
          .flatMap((s: string) => parseTrackingList(s))
          .filter(Boolean)
        const joined = Array.from(new Set(list)).join(", ")
        return {
          tracking_cn_cn: joined,
          china_tracking_number: joined,
          tracking_numbers_cn: Array.from(new Set(list)),
        }
      })
      const hasAny = cleanedPerItem.some((it) => it.tracking_cn_cn.length > 0)
      if (!hasAny && !confirm("คุณยังไม่ได้กรอกเลขแทร็กจีน ต้องการบันทึกเป็นค่าว่างใช่หรือไม่?")) {
        return
      }
      payload.items = cleanedPerItem
    } else {
      const cleanedList = Array.from(
        new Set(
          trackingList
            .flatMap((s) => parseTrackingList(s))
            .filter(Boolean)
        )
      )
      if (cleanedList.length === 0 && !confirm("คุณยังไม่ได้กรอกเลขแทร็กจีน ต้องการบันทึกเป็นค่าว่างใช่หรือไม่?")) {
        return
      }
      payload.tracking_number = cleanedList.join(", ")
      payload.tracking_numbers = cleanedList
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
        data.tracking_summary
          ? `บันทึกเลขแทร็กขนส่งจีนสำเร็จ! (${data.tracking_summary})`
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

  const activePreviewTrackings = !usePerItem
    ? Array.from(new Set(trackingList.flatMap((s) => parseTrackingList(s)).filter(Boolean)))
    : Array.from(
        new Set(
          items.flatMap((it) =>
            (it.trackingList || []).flatMap((s: string) => parseTrackingList(s)).filter(Boolean)
          )
        )
      )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90dvh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xl">🇨🇳</span>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                ใส่เลขแทร็กขนส่งจีน (รองรับหลายชิ้น/หลายกล่อง)
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
                <span>รองรับการใส่หลายเลขแทร็ก (กรณีมีสินค้าหลายชิ้นหรือร้านจีนแยกส่งหลายกล่อง):</span>
              </div>
              <p className="leading-relaxed pl-5">
                กดปุ่ม <strong>&quot;+ เพิ่มช่องใส่เลขแทร็ก&quot;</strong> เพื่อเพิ่มเลขพัสดุได้ไม่จำกัด ลูกค้าจะเห็นเลขแทร็กครบทุกชิ้นทันที
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
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      !usePerItem
                        ? "bg-primary text-white font-medium"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    รวมทั้งออเดอร์ (เพิ่มได้หลายเลข)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUsePerItem(true)}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      usePerItem
                        ? "bg-primary text-white font-medium"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    แยกตามลิงก์สินค้า ({items.length} รายการ)
                  </button>
                </div>
              </div>
            )}

            {!usePerItem ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-primary" />
                    หมายเลขพัสดุจีน ({trackingList.length} ช่อง)
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddTrackingRow}
                    className="h-7 px-2.5 text-xs font-bold text-primary border-blue-200 hover:bg-blue-50 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    เพิ่มช่องใส่เลขแทร็ก
                  </Button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {trackingList.map((tn, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-2 rounded-lg shrink-0 min-w-[72px] text-center">
                        ชิ้นที่ {index + 1}
                      </span>
                      <Input
                        value={tn}
                        onChange={(e) => handleTrackingRowChange(index, e.target.value)}
                        placeholder={`เลขแทร็กจีนชิ้นที่ ${index + 1} (เช่น YT7732189498274)`}
                        className="font-mono text-sm uppercase tracking-wide bg-white flex-1"
                        autoFocus={index === trackingList.length - 1}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveTrackingRow(index)}
                        className="h-9 w-9 text-rose-500 hover:text-rose-700 hover:bg-rose-50 shrink-0 cursor-pointer"
                        title="ลบช่องนี้"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddTrackingRow}
                  className="w-full py-2.5 border-2 border-dashed border-blue-200 hover:border-primary bg-blue-50/30 hover:bg-blue-50/70 text-primary rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>เพิ่มเลขแทร็กขนส่งจีนอีก 1 ชิ้น / กล่อง</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-700 block">
                  ระบุเลขพัสดุจีนสำหรับแต่ละรายการสินค้า (แต่ละรายการเพิ่มได้หลายเลข)
                </label>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {items.map((item, itemIdx) => {
                    const rowList: string[] = item.trackingList || [""]
                    return (
                      <div
                        key={itemIdx}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">
                            รายการสินค้าที่ {itemIdx + 1}
                            {item.quantity ? ` (จำนวน ${item.quantity} ชิ้น)` : ""}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddItemTrackingRow(itemIdx)}
                            className="h-6 px-2 text-[11px] font-bold text-primary border-blue-200 hover:bg-blue-50 cursor-pointer"
                          >
                            <Plus className="h-3 w-3 mr-1" /> เพิ่มเลขแทร็ก
                          </Button>
                        </div>
                        {item.url && (
                          <p className="text-[11px] text-slate-500 truncate" title={item.url}>
                            {item.url}
                          </p>
                        )}
                        <div className="space-y-1.5">
                          {rowList.map((tn: string, trackIdx: number) => (
                            <div key={trackIdx} className="flex items-center gap-1.5">
                              <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded shrink-0">
                                #{trackIdx + 1}
                              </span>
                              <Input
                                value={tn}
                                onChange={(e) => handleItemTrackingChange(itemIdx, trackIdx, e.target.value)}
                                placeholder={`เลขแทร็กจีน #${trackIdx + 1} ของรายการนี้`}
                                className="font-mono text-xs uppercase bg-white h-8 flex-1"
                              />
                              {rowList.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveItemTrackingRow(itemIdx, trackIdx)}
                                  className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 shrink-0 cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quick 17Track verification link if tracking is entered */}
            {activePreviewTrackings.length > 0 && (
              <div className="flex items-center justify-between bg-blue-50/70 px-3 py-2 rounded-lg border border-blue-100 text-xs">
                <span className="text-slate-600">
                  รวมทั้งหมด <strong>{activePreviewTrackings.length}</strong> เลขแทร็ก:
                </span>
                <a
                  href={`https://t.17track.net/en#nums=${encodeURIComponent(activePreviewTrackings.join(","))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 underline"
                >
                  <span>เช็คบน 17TRACK ทั้งหมด</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {/* Notify Customer Checkbox */}
            <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={notifyCustomer}
                onChange={(e) => setNotifyCustomer(e.target.checked)}
                className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-800 block">
                  แจ้งเตือนลูกค้าทาง LINE Official Account
                </span>
                <span className="text-slate-500 text-[11px]">
                  ส่งข้อความแจ้งเลขแทร็กจีนทั้งหมดให้ลูกค้าทราบทันที
                </span>
              </div>
            </label>
          </div>

          <DialogFooter className="p-4 px-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="cursor-pointer"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold cursor-pointer"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              บันทึกเลขแทร็กจีน ({activePreviewTrackings.length || 0} เลข)
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

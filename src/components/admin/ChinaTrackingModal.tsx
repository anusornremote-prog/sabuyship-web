"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, ExternalLink, Plus, Trash2, Package, Store, Tag } from "lucide-react"
import { toast } from "sonner"
import { getMarketplaceInfo } from "@/lib/product-link"

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
  const [items, setItems] = useState<any[]>([])
  const [notifyCustomer, setNotifyCustomer] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen && order) {
      setError("")
      const inquiry = order.quotation?.inquiry
      let inquiryItems = inquiry?.items || []
      if (typeof inquiryItems === "string") {
        try {
          inquiryItems = JSON.parse(inquiryItems)
        } catch {
          inquiryItems = []
        }
      }

      if (!Array.isArray(inquiryItems) || inquiryItems.length === 0) {
        inquiryItems = [
          {
            url: inquiry?.product_url || "",
            product_name: inquiry?.product_name || "",
            remark: inquiry?.remark || "",
            quantity: inquiry?.quantity || 1,
            image_url: inquiry?.image_url || null,
          },
        ]
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
    }
  }, [isOpen, order])

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
    const nextList =
      currentList.length <= 1 ? [""] : currentList.filter((_: any, i: number) => i !== trackIdx)
    updated[itemIdx] = { ...updated[itemIdx], trackingList: nextList }
    setItems(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanedPerItem = items.map((it) => {
      const list = (it.trackingList || [])
        .flatMap((s: string) => parseTrackingList(s))
        .filter(Boolean)
      const uniqueList = Array.from(new Set(list)) as string[]
      const joined = uniqueList.join(", ")
      return {
        tracking_cn_cn: joined,
        china_tracking_number: joined,
        tracking_numbers_cn: uniqueList,
      }
    })

    const hasAny = cleanedPerItem.some((it) => it.tracking_cn_cn.length > 0)
    if (!hasAny && !confirm("คุณยังไม่ได้กรอกเลขแทร็กจีน ต้องการบันทึกเป็นค่าว่างใช่หรือไม่?")) {
      return
    }

    const payload = {
      notify_customer: notifyCustomer,
      items: cleanedPerItem,
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

  const activePreviewTrackings = Array.from(
    new Set(
      items.flatMap((it) =>
        (it.trackingList || []).flatMap((s: string) => parseTrackingList(s)).filter(Boolean)
      )
    )
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[88dvh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="shrink-0 p-4 sm:p-5 pb-3.5 pr-10 border-b border-slate-100 bg-slate-50/50 text-left">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🇨🇳</span>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
                ใส่เลขแทร็กขนส่งจีน (แยกตามรายการสินค้า)
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                ออเดอร์: <span className="font-semibold text-slate-700">{order.order_number}</span>
                {(order.customer?.customer_code || order.profiles?.customer_code) && (
                  <span className="ml-2 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-mono text-[11px] font-bold">
                    {order.customer?.customer_code || order.profiles?.customer_code}
                  </span>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch] flex-1 min-h-0">
            {error && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200 font-medium">
                {error}
              </div>
            )}

            <div className="space-y-3.5">
              {items.map((item, itemIdx) => {
                const rowList: string[] = item.trackingList || [""]
                const itemUrl = item.url || item.product_url || ""
                const market = getMarketplaceInfo(itemUrl)
                const itemDesc = [item.product_name, item.product_options, item.remark, item.note, item.color]
                  .map((v) => (typeof v === "string" ? v.trim() : ""))
                  .filter(Boolean)
                  .filter((v, idx, arr) => arr.indexOf(v) === idx)
                  .join(" • ")

                return (
                  <div
                    key={itemIdx}
                    className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-3 shadow-2xs"
                  >
                    {/* Header: Item number + Add Tracking button */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/70">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md bg-slate-800 text-white text-xs font-bold">
                          รายการที่ {itemIdx + 1}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-bold ${market.badgeClass}`}>
                          <Store className="w-3 h-3" />
                          {market.platform}
                        </span>
                        {market.itemId && (
                          <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                            ID: {market.itemId}
                          </span>
                        )}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddItemTrackingRow(itemIdx)}
                        className="h-7 px-2.5 text-[11px] font-bold text-primary border-blue-200 bg-white hover:bg-blue-50 shrink-0 cursor-pointer"
                      >
                        <Plus className="h-3 w-3 mr-1" /> เพิ่มเลขแทร็ก
                      </Button>
                    </div>

                    {/* Product Info Row: Thumbnail + Details/Remark + Link */}
                    <div className="flex items-start gap-3 bg-white p-2.5 rounded-xl border border-slate-200/80">
                      {item.image_url ? (
                        <a
                          href={item.image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 group relative block"
                          title="คลิกเพื่อดูรูปสินค้าขนาดเต็ม"
                        >
                          <img
                            src={item.image_url}
                            alt={`สินค้าชิ้นที่ ${itemIdx + 1}`}
                            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-slate-200 group-hover:opacity-90 transition-opacity"
                          />
                        </a>
                      ) : (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 shrink-0">
                          <Package className="w-5 h-5 mb-0.5" />
                          <span className="text-[9px] font-medium">ไม่มีรูป</span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0 space-y-1.5">
                        {/* Product Remark / Options / Color / Size */}
                        {itemDesc ? (
                          <div className="flex items-start gap-1.5 text-xs sm:text-sm font-bold text-slate-900 bg-amber-50/90 border border-amber-200/80 px-2.5 py-1.5 rounded-lg">
                            <Tag className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span className="break-words leading-snug">{itemDesc}</span>
                          </div>
                        ) : (
                          <div className="text-xs font-medium text-slate-500 italic">
                            ไม่ได้ระบุชื่อหรือตัวเลือกสินค้า (ดูได้จากรูปหรือลิงก์สินค้า)
                          </div>
                        )}

                        {/* Quantity & Quoted Price info */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                          <span>
                            จำนวน: <strong className="text-slate-900">{item.quantity || 1} ชิ้น</strong>
                          </span>
                          {item.quoted_price !== undefined && Number(item.quoted_price) > 0 && (
                            <span>
                              ค่าสินค้า:{" "}
                              <strong className="text-primary">
                                ฿{Number(item.quoted_price).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </strong>
                            </span>
                          )}
                          {item.quoted_shipping_cn_cn !== undefined && Number(item.quoted_shipping_cn_cn) > 0 && (
                            <span>
                              ค่าส่งจีน:{" "}
                              <strong className="text-slate-800">
                                ฿{Number(item.quoted_shipping_cn_cn).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </strong>
                            </span>
                          )}
                        </div>

                        {/* Clickable Product Link */}
                        {itemUrl && (
                          <div className="pt-0.5">
                            <a
                              href={itemUrl.startsWith("http") ? itemUrl : `https://${itemUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline max-w-full"
                              title={itemUrl}
                            >
                              <ExternalLink className="w-3 h-3 shrink-0" />
                              <span className="truncate">เปิดดูหน้าสินค้าใน {market.platform}</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tracking Inputs for this Item */}
                    <div className="space-y-1.5 pt-0.5">
                      {rowList.map((tn: string, trackIdx: number) => (
                        <div key={trackIdx} className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg shrink-0 min-w-[36px] text-center">
                            #{trackIdx + 1}
                          </span>
                          <Input
                            value={tn}
                            onChange={(e) => handleItemTrackingChange(itemIdx, trackIdx, e.target.value)}
                            placeholder={`กรอกเลขแทร็กจีน #${trackIdx + 1} ของรายการที่ ${itemIdx + 1}`}
                            className="font-mono text-xs sm:text-sm uppercase bg-white h-9 flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItemTrackingRow(itemIdx, trackIdx)}
                            className="h-9 w-9 text-rose-500 hover:text-rose-700 hover:bg-rose-50 shrink-0 cursor-pointer"
                            title="ลบเลขแทร็กนี้"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

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

          <DialogFooter className="shrink-0 p-4 px-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
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

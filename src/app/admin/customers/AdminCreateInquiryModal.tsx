"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/custom-dialog"

interface AdminCreateInquiryModalProps {
  isOpen: boolean
  onClose: () => void
  customer: any
}

export default function AdminCreateInquiryModal({ isOpen, onClose, customer }: AdminCreateInquiryModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const [items, setItems] = useState([
    { url: "", quantity: 1, remark: "", image_url: "" }
  ])

  const handleAddItem = () => {
    setItems([...items, { url: "", quantity: 1, remark: "", image_url: "" }])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate
    if (items.some(i => !i.url || i.quantity < 1)) {
      setErrorMsg("กรุณากรอกลิงก์และจำนวนสินค้าให้ครบถ้วนทุกรายการ")
      return
    }

    setIsSubmitting(true)
    setErrorMsg("")

    try {
      const payload = {
        customer_id: customer.id,
        customer_name: customer.full_name || customer.customer_code,
        phone: customer.phone,
        line_id: customer.line_id,
        items: items
      }

      const res = await fetch("/api/inquiry/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล")

      alert(`สร้างคำขอประเมินราคาสำเร็จ! หมายเลข: ${data.inquiry_number}`)
      
      // Reset form
      setItems([{ url: "", quantity: 1, remark: "", image_url: "" }])
      onClose()
      router.refresh()
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!customer) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose} className="max-w-4xl w-[95vw]">
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">สร้างคำขอประเมินราคาแทนลูกค้า</DialogTitle>
          <div className="text-sm text-slate-500 mt-1">
            สำหรับลูกค้า: <span className="font-semibold text-slate-800">{customer.full_name || customer.customer_code}</span>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm border border-red-100">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-slate-800">รายการสินค้า ({items.length} รายการ)</h3>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="gap-1 h-8 text-xs">
                <PlusCircle className="h-3.5 w-3.5" />
                เพิ่มสินค้าอีกชิ้น
              </Button>
            </div>

            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-lg relative">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors bg-white rounded-full p-1 shadow-sm border border-slate-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  
                  <div className="font-semibold text-slate-800 text-sm mb-3">ชิ้นที่ {idx + 1}</div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-8 space-y-1">
                      <label className="text-xs font-semibold text-slate-600">ลิงก์สินค้า (URL) *</label>
                      <Input
                        required
                        placeholder="https://taobao.com/..."
                        value={item.url}
                        onChange={(e) => updateItem(idx, "url", e.target.value)}
                        className="h-9"
                      />
                    </div>
                    
                    <div className="md:col-span-4 space-y-1">
                      <label className="text-xs font-semibold text-slate-600">จำนวน *</label>
                      <Input
                        required
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                        className="h-9"
                      />
                    </div>

                    <div className="md:col-span-12 space-y-1">
                      <label className="text-xs font-semibold text-slate-600">ลิงก์รูปภาพตัวอย่าง (ถ้ามี)</label>
                      <Input
                        placeholder="https://..."
                        value={item.image_url}
                        onChange={(e) => updateItem(idx, "image_url", e.target.value)}
                        className="h-9"
                      />
                    </div>

                    <div className="md:col-span-12 space-y-1">
                      <label className="text-xs font-semibold text-slate-600">รายละเอียดเพิ่มเติม/ระบุความต้องการ (ถ้ามี)</label>
                      <Textarea
                        placeholder="เช่น สี, ไซส์ หรือขนาด"
                        value={item.remark}
                        onChange={(e) => updateItem(idx, "remark", e.target.value)}
                        className="resize-none h-16"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="mt-8 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              ยกเลิก
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "กำลังบันทึก..." : "ยืนยันสร้างคำขอ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

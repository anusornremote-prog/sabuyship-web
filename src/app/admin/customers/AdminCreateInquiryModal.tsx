"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import imageCompression from 'browser-image-compression'
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
  const [shippingType, setShippingType] = useState("CAR")

  const [items, setItems] = useState<{ url: string; quantity: number | string; remark: string; file: File | null; wooden_crate?: boolean }>([{ url: "", quantity: 1, remark: "", file: null, wooden_crate: false }])

  const handleAddItem = () => {
    setItems([...items, { url: "", quantity: 1, remark: "", file: null, wooden_crate: false }])
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
    if (items.some(i => !i.url.trim() || Number(i.quantity) < 1)) {
      setErrorMsg("กรุณากรอกลิงก์และจำนวนสินค้าให้ครบถ้วนทุกรายการ")
      return
    }

    setIsSubmitting(true)
    setErrorMsg("")

    try {
      const supabase = createClient()
      
      // Upload images if any
      const uploadedItems = await Promise.all(items.map(async (item, idx) => {
        let image_url = null
        if (item.file) {
          // Compress image before uploading
          const options = {
            maxSizeMB: 0.2, // ~200KB limit
            maxWidthOrHeight: 1200,
            useWebWorker: true,
            initialQuality: 0.7
          }
          let fileToUpload = item.file
          try {
            fileToUpload = await imageCompression(item.file, options)
          } catch (error) {
            console.error("Compression error:", error)
            // Fallback to original if compression fails
          }
          
          const fileExt = fileToUpload.name.split('.').pop() || 'jpg'
          const fileName = `${Date.now()}-${idx}.${fileExt}`
          const { error: uploadError } = await supabase.storage
            .from('inquiries')
            .upload(fileName, fileToUpload, {
               cacheControl: '3600',
               upsert: false
            })
          
          if (uploadError) throw new Error(`Upload failed for item ${idx + 1}: ${uploadError.message}`)
          
          const { data: { publicUrl } } = supabase.storage
            .from('inquiries')
            .getPublicUrl(fileName)
            
          image_url = publicUrl
        }
        
        return {
          url: item.url,
          quantity: typeof item.quantity === 'string' ? parseInt(item.quantity) || 1 : item.quantity,
          remark: item.remark,
          wooden_crate: item.wooden_crate,
          image_url
        }
      }))

      const payload = {
        customer_id: customer.id,
        customer_name: customer.full_name || customer.customer_code,
        phone: customer.phone,
        line_id: customer.line_id,
        shipping_type: shippingType,
        items: uploadedItems
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
      setItems([{ url: "", quantity: 1, remark: "", file: null, wooden_crate: false }])
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
            <h3 className="font-semibold border-b pb-2">รูปแบบการขนส่ง *</h3>
            <div className="flex gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="adminShippingType" 
                  value="CAR" 
                  checked={shippingType === 'CAR'}
                  onChange={() => setShippingType('CAR')}
                  className="w-4 h-4 text-primary" 
                />
                <span>ทางรถ (Car)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="adminShippingType" 
                  value="BOAT" 
                  checked={shippingType === 'BOAT'}
                  onChange={() => setShippingType('BOAT')}
                  className="w-4 h-4 text-primary" 
                />
                <span>ทางเรือ (Boat)</span>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-semibold">ข้อมูลสินค้า</h3>
            </div>
            
            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4 relative">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-700 text-sm">รายการที่ {idx + 1}</span>
                    {items.length > 1 && (
                      <button type="button" onClick={() => handleRemoveItem(idx)} className="text-rose-500 hover:text-rose-700 text-xs font-semibold cursor-pointer">
                        ลบรายการนี้
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">ลิงก์สินค้า หรือ ข้อมูลสินค้า *</label>
                    <Input 
                      required 
                      type="text" 
                      placeholder="https://item.taobao.com/... หรือใส่ข้อความได้" 
                      value={item.url}
                      onChange={(e) => updateItem(idx, 'url', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">จำนวนที่ต้องการ *</label>
                    <Input 
                      required 
                      type="number" 
                      min="1" 
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">หมายเหตุ / สี / ไซส์ (ถ้ามี)</label>
                    <textarea 
                      value={item.remark}
                      onChange={(e) => updateItem(idx, 'remark', e.target.value)}
                      className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="เช่น สีดำ ไซส์ M 2 ชิ้น"
                    ></textarea>
                  </div>

                  <div className="flex flex-col space-y-2 pt-1 border-t mt-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`admin-wooden-crate-${idx}`}
                        checked={item.wooden_crate || false}
                        onChange={(e) => updateItem(idx, 'wooden_crate', e.target.checked)}
                        className="w-4 h-4 text-primary rounded border-slate-300"
                      />
                      <label htmlFor={`admin-wooden-crate-${idx}`} className="text-sm font-medium text-slate-700 cursor-pointer">
                        ต้องการบริการตีลังไม้ (ป้องกันสินค้าเสียหาย)
                      </label>
                    </div>
                    <div className="text-[10px] text-slate-500 bg-slate-100 p-2 rounded ml-6">
                      <span className="font-semibold block mb-1">อัตราค่าบริการตีลังไม้:</span>
                      <ul className="list-disc list-inside grid grid-cols-1 sm:grid-cols-2 gap-x-2">
                        <li>ต่ำกว่า 0.2 คิว: 200 บาท</li>
                        <li>0.2 - 0.5 คิว: 350 บาท</li>
                        <li>0.5 - 1 คิว: 550 บาท</li>
                        <li>1 - 2 คิว: 950 บาท</li>
                        <li>2 คิวขึ้นไป: 1,250 บาท</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-2">
                    <label className="text-sm font-medium">รูปภาพสินค้าเพิ่มเติม (ถ้ามี)</label>
                    <Input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        updateItem(idx, 'file', file)
                      }}
                    />
                    {item.file && (
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {item.file.name}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              <Button 
                type="button" 
                onClick={handleAddItem} 
                variant="outline" 
                className="w-full border-dashed border-2 py-6 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                + เพิ่มรายการสินค้า
              </Button>
            </div>
          </div>

          <DialogFooter className="mt-8 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              ยกเลิก
            </Button>
            <Button type="submit" className="px-8 cursor-pointer" disabled={isSubmitting}>
              {isSubmitting ? "กำลังบันทึก..." : "ยืนยันสร้างคำขอ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/custom-dialog"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import imageCompression from 'browser-image-compression'
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function PaymentSection({ orderId, paymentRound, isRejected = false }: { orderId: string, paymentRound: 1 | 2 | 3, isRejected?: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !paymentDate || !file) return toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')

    setIsSubmitting(true)
    try {
      const options = {
        maxSizeMB: 0.1, // ~100KB
        maxWidthOrHeight: 800,
        useWebWorker: true,
        initialQuality: 0.5,
      }
      const compressedFile = await imageCompression(file, options)

      const fileExt = file.name.split('.').pop()
      const fileName = `slip-${orderId}-${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment_slips')
        .upload(fileName, compressedFile)

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('payment_slips')
        .getPublicUrl(uploadData.path)

      const slipUrl = publicUrlData.publicUrl

      const { error: insertError } = await supabase
        .from('payments')
        .insert({
          order_id: orderId,
          amount: parseFloat(amount),
          payment_date: new Date(paymentDate).toISOString(),
          slip_url: slipUrl,
          status: 'PENDING'
        })

      if (insertError) throw insertError

      const roundColumn = `payment_round_${paymentRound}_status`
      const { error: orderError } = await supabase
        .from('orders')
        .update({ [roundColumn]: 'UPLOADED' })
        .eq('id', orderId)

      if (orderError) throw orderError

      toast.success('แจ้งชำระเงินสำเร็จ กรุณารอเจ้าหน้าที่ตรวจสอบ')
      setIsOpen(false)
      window.location.reload()
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาด: ' + (err.message || 'ไม่สามารถอัปโหลดไฟล์ได้ กรุณาลองอีกครั้ง'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)} 
        size="sm" 
        variant={isRejected ? "destructive" : "default"}
        className={isRejected ? "w-full mt-2 font-medium" : "bg-primary text-white hover:bg-primary/90 font-medium w-full mt-2"}
      >
        {isRejected ? `แนบสลีปใหม่อีกครั้ง รอบที่ ${paymentRound}` : `แนบหลักฐานชำระเงิน รอบที่ ${paymentRound}`}
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && setIsOpen(false)}>
        <DialogContent>
          <div className="flex justify-between items-start">
            <DialogHeader>
              <DialogTitle>แจ้งชำระเงิน รอบที่ {paymentRound}</DialogTitle>
              <DialogDescription>กรุณากรอกข้อมูลการโอนเงินและแนบสลิปหลักฐาน</DialogDescription>
            </DialogHeader>
            <Button variant="ghost" size="icon" onClick={() => !isSubmitting && setIsOpen(false)} className="h-8 w-8 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm">
              <h4 className="font-semibold text-slate-800 mb-2">บัญชีสำหรับการโอนเงิน</h4>
              <p className="text-slate-600">ธนาคาร: กสิกรไทย (KBank)</p>
              <p className="text-slate-600">ชื่อบัญชี: บจก. สบายชิป</p>
              <p className="font-mono text-lg font-bold text-primary mt-1">123-4-56789-0</p>
            </div>

            <div className="space-y-2 text-left">
              <label htmlFor="amount" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">จำนวนเงินที่โอน (บาท)</label>
              <Input 
                id="amount" 
                type="number" 
                step="0.01" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="เช่น 4500.00"
                required 
              />
            </div>

            <div className="space-y-2 text-left">
              <label htmlFor="paymentDate" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">วัน-เวลาที่โอน (ตามสลิป)</label>
              <Input 
                id="paymentDate" 
                type="datetime-local" 
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required 
              />
            </div>

            <div className="space-y-2 text-left">
              <label htmlFor="slip" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">หลักฐานการโอนเงิน (สลิป)</label>
              <Input 
                id="slip" 
                type="file" 
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required 
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันแจ้งชำระเงิน'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

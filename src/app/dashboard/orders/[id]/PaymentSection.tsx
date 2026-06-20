'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/custom-dialog"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function PaymentSection({ orderId, currentStatus }: { orderId: string, currentStatus: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Show button only if status is WAITING_PAYMENT
  if (currentStatus !== 'WAITING_PAYMENT') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !paymentDate || !file) return alert('กรุณากรอกข้อมูลให้ครบถ้วน')

    setIsSubmitting(true)
    try {
      // For mock, read file as base64 for slip_url
      const reader = new FileReader()
      reader.onload = async () => {
        const base64Str = reader.result as string
        
        // Upload to storage (mocked to just return the data url or a fake path)
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payment_slips')
          .upload(`slip-${orderId}-${Date.now()}`, base64Str)

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

        alert('แจ้งชำระเงินสำเร็จ กรุณารอเจ้าหน้าที่ตรวจสอบ')
        setIsOpen(false)
        router.refresh()
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message)
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="bg-primary text-white hover:bg-primary/90 font-medium">
        แจ้งชำระเงิน
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && setIsOpen(false)}>
        <DialogContent>
          <div className="flex justify-between items-start">
            <DialogHeader>
              <DialogTitle>แจ้งชำระเงิน</DialogTitle>
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

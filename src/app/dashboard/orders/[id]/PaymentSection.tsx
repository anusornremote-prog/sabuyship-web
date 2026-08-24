'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/custom-dialog"
import { Input } from "@/components/ui/input"
import { X, Copy, Check, Upload, CheckCircle2, QrCode, AlertTriangle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import imageCompression from 'browser-image-compression'
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface PaymentSectionProps {
  orderId: string
  paymentRound: 1 | 2 | 3
  isRejected?: boolean
  defaultAmount?: number
}

export function PaymentSection({ orderId, paymentRound, isRejected = false, defaultAmount = 0 }: PaymentSectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [amount, setAmount] = useState(defaultAmount ? defaultAmount.toString() : '')
  const [paymentDate, setPaymentDate] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copiedBank, setCopiedBank] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Format current local datetime as YYYY-MM-DDTHH:mm
  const getCurrentLocalDateTime = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const handleOpenModal = () => {
    if (defaultAmount && defaultAmount > 0) {
      setAmount(defaultAmount.toString())
    }
    setPaymentDate(getCurrentLocalDateTime())
    setIsOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }

  const handleCopyAccount = (accountNo: string) => {
    navigator.clipboard.writeText(accountNo.replace(/-/g, ''))
    setCopiedBank(true)
    toast.success("คัดลอกเลขบัญชีเรียบร้อย")
    setTimeout(() => setCopiedBank(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !file) return toast.error('กรุณาเลือกรูปสลิปหลักฐานการโอน')

    setIsSubmitting(true)
    try {
      const options = {
        maxSizeMB: 0.15, // ~150KB
        maxWidthOrHeight: 800,
        useWebWorker: true,
        initialQuality: 0.5,
      }
      const compressedFile = await imageCompression(file, options)

      const fileExt = file.name.split('.').pop() || 'jpg'
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
          payment_date: paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString(),
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

      // Insert tracking log
      await supabase.from('tracking_logs').insert({
        order_id: orderId,
        status: `UPLOADED_ROUND_${paymentRound}`,
        notes: `แนบหลักฐานชำระเงิน รอบที่ ${paymentRound} (ยอด ${amount} บาท)`
      })

      // Trigger admin notification
      try {
        await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'PAYMENT_UPLOADED',
            data: {
              orderId,
              amount: parseFloat(amount),
              round: paymentRound
            }
          })
        })
      } catch (notifyErr) {
        console.error("Failed to notify admin:", notifyErr)
      }

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
        onClick={handleOpenModal} 
        size="sm" 
        variant={isRejected ? "destructive" : "default"}
        className={`w-full mt-2 font-bold cursor-pointer rounded-xl h-11 shadow-sm transition-all ${
          isRejected 
            ? "bg-rose-600 hover:bg-rose-700 text-white" 
            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
        }`}
      >
        <Upload className="w-4 h-4 mr-2" />
        {isRejected ? `แนบสลิปใหม่อีกครั้ง (รอบที่ ${paymentRound})` : `แนบสลิปชำระเงิน (รอบที่ ${paymentRound})`}
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && setIsOpen(false)}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-6 shadow-2xl">
          <div className="flex justify-between items-start border-b border-slate-100 pb-3">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                แจ้งชำระเงิน รอบที่ {paymentRound}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                สแกนชำระเงินตามยอด และอัปโหลดสลิปเพื่อยืนยัน
              </DialogDescription>
            </DialogHeader>
            <Button variant="ghost" size="icon" onClick={() => !isSubmitting && setIsOpen(false)} className="h-8 w-8 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Bank Account Info Card */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  ธนาคารสำหรับโอนเงิน
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                  พร้อมเพย์ / บัญชีบริษัท
                </span>
              </div>

              <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200">
                <div>
                  <p className="font-black text-slate-900 text-sm">ธนาคารกสิกรไทย (KBank)</p>
                  <p className="text-slate-500 text-xs">ชื่อบัญชี: บจก. สบายชิป เอ็กซ์เพรส</p>
                  <p className="font-mono text-base font-black text-primary tracking-wider mt-0.5">123-4-56789-0</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopyAccount("123-4-56789-0")}
                  className="h-8 px-2.5 text-xs font-bold shrink-0 cursor-pointer"
                >
                  {copiedBank ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  {copiedBank ? "คัดลอกแล้ว" : "คัดลอก"}
                </Button>
              </div>
            </div>

            {/* Auto-filled Amount */}
            <div className="space-y-1 text-left">
              <div className="flex justify-between items-center">
                <label htmlFor="amount" className="text-xs font-bold text-slate-700">
                  จำนวนเงินที่โอน (บาท)
                </label>
                <span className="text-[10px] text-emerald-600 font-bold">
                  ✓ ดึงยอดตามบิลให้อัตโนมัติ
                </span>
              </div>
              <Input 
                id="amount" 
                type="number" 
                step="0.01" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required 
                className="h-11 rounded-xl bg-slate-50 font-bold text-base text-primary"
              />
            </div>

            {/* Slip File Upload with Live Preview */}
            <div className="space-y-1.5 text-left">
              <label htmlFor="slip" className="text-xs font-bold text-slate-700 block">
                แนบรูปสลิปหลักฐานการโอน *
              </label>
              
              <Input 
                id="slip" 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                required 
                className="h-11 rounded-xl bg-white text-xs cursor-pointer file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-primary"
              />

              {previewUrl && (
                <div className="mt-2 p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                  <img src={previewUrl} alt="Slip preview" className="w-12 h-12 object-cover rounded-lg border" />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 block text-xs">เลือกสลิปแล้ว</span>
                    <span className="text-slate-400 text-[10px]">พร้อมกดบันทึกยืนยัน</span>
                  </div>
                </div>
              )}
            </div>

            {/* Collapsible Date/Time (Auto-filled) */}
            <div className="space-y-1 text-left pt-1">
              <label htmlFor="paymentDate" className="text-[11px] font-medium text-slate-500">
                วัน-เวลาที่โอน (ตามสลิป)
              </label>
              <Input 
                id="paymentDate" 
                type="datetime-local" 
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="h-9 rounded-xl bg-slate-50 text-xs text-slate-600 font-mono"
              />
            </div>

            <DialogFooter className="pt-2 sm:justify-between gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isSubmitting} className="cursor-pointer text-xs">
                ยกเลิก
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !file}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-6 rounded-xl cursor-pointer shadow-md text-sm"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>กำลังบันทึก...</span>
                  </div>
                ) : (
                  <span>✓ ยืนยันแจ้งชำระเงิน (2 คลิก)</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

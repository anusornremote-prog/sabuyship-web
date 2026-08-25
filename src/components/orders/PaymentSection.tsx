'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/custom-dialog"
import { Input } from "@/components/ui/input"
import { X, Copy, Check, Upload, CheckCircle2, QrCode, AlertTriangle, Download, Camera, Image as ImageIcon, Trash2 } from "lucide-react"
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
  const [copiedAmount, setCopiedAmount] = useState(false)
  const [paymentMethodTab, setPaymentMethodTab] = useState<'promptpay' | 'bank'>('promptpay')
  
  const router = useRouter()
  const supabase = createClient()

  // Company bank details
  const bankAccount = "123-4-56789-0"
  const bankName = "ธนาคารกสิกรไทย (KBank)"
  const accountName = "บจก. สบายชิป เอ็กซ์เพรส"
  const promptpayId = "0105565000000" // Company Tax ID or Phone for PromptPay

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

  const handleCopyAmount = () => {
    if (!amount) return
    navigator.clipboard.writeText(amount)
    setCopiedAmount(true)
    toast.success(`คัดลอกยอด ฿${amount} เรียบร้อย`)
    setTimeout(() => setCopiedAmount(false), 2000)
  }

  // QR Code URL based on PromptPay
  const qrAmount = parseFloat(amount) || 0
  const qrUrl = `https://promptpay.io/${promptpayId}/${qrAmount > 0 ? qrAmount.toFixed(2) : ''}.png`

  const handleDownloadQr = async () => {
    try {
      const response = await fetch(qrUrl)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `PromptPay-SabuyShip-Round${paymentRound}-${amount || '0'}THB.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(blobUrl)
      toast.success("บันทึกรูป QR Code ลงเครื่องเรียบร้อยแล้วค่ะ")
    } catch (e) {
      // Fallback: Open in new tab
      window.open(qrUrl, '_blank')
    }
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
        <DialogContent className="max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
          <div className="flex justify-between items-start border-b border-slate-100 pb-3">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                แจ้งชำระเงิน รอบที่ {paymentRound}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                สแกน QR หรือโอนเข้าบัญชี แล้วแนบรูปสลิปเพื่อยืนยัน
              </DialogDescription>
            </DialogHeader>
            <Button variant="ghost" size="icon" onClick={() => !isSubmitting && setIsOpen(false)} className="h-8 w-8 rounded-full cursor-pointer">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            
            {/* Amount Banner with 1-Tap Copy */}
            <div className="p-3.5 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl text-white flex justify-between items-center shadow-md shadow-blue-600/20">
              <div>
                <span className="text-[10px] text-blue-100 uppercase tracking-wider block font-bold">
                  ยอดที่ต้องชำระ (รอบที่ {paymentRound})
                </span>
                <span className="text-xl sm:text-2xl font-black font-mono">
                  ฿ {Number(amount || defaultAmount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleCopyAmount}
                className="h-9 px-3 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl backdrop-blur-sm border border-white/20 shrink-0 cursor-pointer shadow-xs"
              >
                {copiedAmount ? (
                  <span className="flex items-center gap-1 text-emerald-300">
                    <Check className="w-3.5 h-3.5" /> คัดลอกแล้ว
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Copy className="w-3.5 h-3.5" /> คัดลอกยอดเงิน
                  </span>
                )}
              </Button>
            </div>

            {/* Payment Method Switcher: PromptPay QR / Bank Transfer */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPaymentMethodTab('promptpay')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  paymentMethodTab === 'promptpay' ? 'bg-white text-primary shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <QrCode className="w-3.5 h-3.5 text-primary" />
                <span>สแกน PromptPay QR</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethodTab('bank')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  paymentMethodTab === 'bank' ? 'bg-white text-primary shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>โอนผ่านเลขบัญชี</span>
              </button>
            </div>

            {/* Tab 1: Dynamic PromptPay QR Code with Download Button */}
            {paymentMethodTab === 'promptpay' && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3 animate-in fade-in duration-200">
                <div className="bg-white p-3 rounded-2xl border border-slate-200 inline-block shadow-xs">
                  <img 
                    src={qrUrl} 
                    alt="PromptPay QR Code" 
                    className="w-44 h-44 sm:w-48 sm:h-48 object-contain mx-auto rounded-lg" 
                  />
                  <div className="mt-1 flex items-center justify-center gap-1 text-[11px] font-bold text-slate-700">
                    <span>พร้อมเพย์: {accountName}</span>
                  </div>
                </div>

                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadQr}
                    className="h-10 px-4 text-xs font-bold text-primary border-blue-200 hover:bg-blue-50 rounded-xl cursor-pointer shadow-xs"
                  >
                    <Download className="w-4 h-4 mr-1.5 text-primary" />
                    📥 บันทึกรูป QR Code ลงมือถือ
                  </Button>
                  <p className="text-[10px] text-slate-400 mt-1">
                    * บันทึกแล้วเปิดแอปธนาคาร เลือกสแกนรูปภาพจากคลังรูปภาพได้ทันที
                  </p>
                </div>
              </div>
            )}

            {/* Tab 2: Bank Account Info Card */}
            {paymentMethodTab === 'bank' && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2.5 animate-in fade-in duration-200">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    บัญชีธนาคารสำหรับโอนเงิน
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                    บัญชีบริษัท
                  </span>
                </div>

                <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200">
                  <div>
                    <p className="font-black text-slate-900 text-sm">{bankName}</p>
                    <p className="text-slate-500 text-xs">ชื่อบัญชี: {accountName}</p>
                    <p className="font-mono text-base font-black text-primary tracking-wider mt-0.5">{bankAccount}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyAccount(bankAccount)}
                    className="h-9 px-3 text-xs font-bold shrink-0 cursor-pointer rounded-xl border-slate-200 hover:bg-blue-50 hover:text-primary shadow-2xs"
                  >
                    {copiedBank ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    {copiedBank ? "คัดลอกแล้ว" : "คัดลอก"}
                  </Button>
                </div>
              </div>
            )}

            {/* Slip File Upload (Touch-Friendly Box) */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-700 flex justify-between items-center">
                <span>แนบรูปสลิปหลักฐานการโอน *</span>
                <span className="text-[10px] text-slate-400 font-normal">รองรับไฟล์ JPG, PNG</span>
              </label>

              {!previewUrl ? (
                <label className="border-2 border-dashed border-blue-200 hover:border-primary bg-blue-50/30 hover:bg-blue-50/60 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]">
                  <div className="w-11 h-11 rounded-full bg-blue-100 text-primary flex items-center justify-center shadow-xs">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-bold text-primary block">แตะเพื่อถ่ายรูปหรือเลือกสลิปจากคลังภาพ</span>
                    <span className="text-[10px] text-slate-400">ระบบจะช่วยบีบอัดรูปให้โหลดเร็วขึ้น</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    required
                  />
                </label>
              ) : (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={previewUrl} alt="Slip preview" className="w-14 h-14 object-cover rounded-xl border border-slate-200 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-bold text-slate-800 text-xs block truncate">เลือกสลิปเรียบร้อยแล้ว</span>
                      <span className="text-emerald-600 text-[11px] font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> พร้อมกดยืนยันด้านล่าง
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => { setFile(null); setPreviewUrl(null); }}
                    className="h-9 w-9 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Collapsible Date/Time (Auto-filled) */}
            <div className="space-y-1 text-left pt-1">
              <label htmlFor="paymentDate" className="text-[11px] font-semibold text-slate-500">
                วัน-เวลาที่โอน (ตามสลิป)
              </label>
              <Input 
                id="paymentDate" 
                type="datetime-local" 
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="h-10 rounded-xl bg-slate-50 text-xs text-slate-700 font-mono"
              />
            </div>

            <DialogFooter className="pt-2 sm:justify-between gap-2 flex-col-reverse sm:flex-row">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isSubmitting} className="cursor-pointer text-xs h-11">
                ยกเลิก
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !file}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black h-12 px-6 rounded-xl cursor-pointer shadow-md shadow-emerald-600/25 text-sm"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>กำลังบันทึก...</span>
                  </div>
                ) : (
                  <span>✓ ยืนยันแจ้งชำระเงิน</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

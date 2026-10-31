'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/custom-dialog"
import { Input } from "@/components/ui/input"
import { X, Copy, Check, Upload, CheckCircle2, QrCode, Download, Camera, Trash2, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { vibrateTap, vibrateSuccess } from "@/lib/haptics"
import {
  hasBankTransfer,
  hasPromptPay,
  isPaymentConfigured,
  paymentAccountMatchesOperator,
  publicBusinessConfig,
} from "@/lib/public-business-config"

interface PaymentSectionProps {
  orderId: string
  paymentRound: 1 | 2 | 3
  isRejected?: boolean
  defaultAmount?: number
  triggerId?: string
  buttonLabel?: string
  buttonClassName?: string
}

export function PaymentSection({ 
  orderId, 
  paymentRound, 
  isRejected = false, 
  defaultAmount = 0,
  triggerId,
  buttonLabel,
  buttonClassName
}: PaymentSectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [amount, setAmount] = useState(defaultAmount ? defaultAmount.toString() : '')
  const [paymentDate, setPaymentDate] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copiedBank, setCopiedBank] = useState(false)
  const [copiedAmount, setCopiedAmount] = useState(false)
  const [paymentMethodTab, setPaymentMethodTab] = useState<'promptpay' | 'bank'>(hasPromptPay ? 'promptpay' : 'bank')

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Listen to custom open event if triggerId is provided
  useEffect(() => {
    if (!triggerId) return
    const handleTrigger = (e: CustomEvent) => {
      if (e.detail?.orderId === orderId && e.detail?.round === paymentRound) {
        handleOpenModal()
      }
    }
    window.addEventListener('open-payment-modal' as any, handleTrigger as any)
    return () => window.removeEventListener('open-payment-modal' as any, handleTrigger as any)
  }, [triggerId, orderId, paymentRound])

  const bankAccount = publicBusinessConfig.bankAccountNumber
  const bankName = publicBusinessConfig.bankName
  const accountName = publicBusinessConfig.bankAccountName
  const promptpayId = publicBusinessConfig.promptPayId

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
    vibrateTap()
    if (!isPaymentConfigured) {
      toast.error("ช่องทางชำระเงินยังไม่พร้อม กรุณาติดต่อผู้ให้บริการก่อนโอนเงิน")
      return
    }
    if (defaultAmount && defaultAmount > 0) {
      setAmount(defaultAmount.toString())
    }
    setPaymentDate(getCurrentLocalDateTime())
    setIsOpen(true)
  }

  const handleTriggerFileSelect = () => {
    vibrateTap()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    if (selectedFile) {
      vibrateTap()
      const url = URL.createObjectURL(selectedFile)
      setPreviewUrl(url)
      toast.success("เลือกรูปสลิปแล้ว กดปุ่มยืนยันแจ้งชำระเงินด้านล่างได้เลยครับ")
      // Scroll modal down so confirm area and preview are clearly visible on mobile
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth',
        })
      }, 150)
    } else {
      setPreviewUrl(null)
    }
  }

  const handleCopyAccount = (accountNo: string) => {
    navigator.clipboard.writeText(accountNo.replace(/-/g, ''))
    vibrateSuccess()
    setCopiedBank(true)
    toast.success("คัดลอกเลขบัญชีเรียบร้อย")
    setTimeout(() => setCopiedBank(false), 2000)
  }

  const handleCopyAmount = () => {
    if (!amount) return
    navigator.clipboard.writeText(amount)
    vibrateSuccess()
    setCopiedAmount(true)
    toast.success(`คัดลอกยอด ฿${amount} เรียบร้อย`)
    setTimeout(() => setCopiedAmount(false), 2000)
  }

  // QR Code URL based on PromptPay
  const qrAmount = parseFloat(amount) || 0
  const qrUrl = hasPromptPay
    ? `https://promptpay.io/${encodeURIComponent(promptpayId)}/${qrAmount > 0 ? qrAmount.toFixed(2) : ''}.png`
    : ""

  const handleDownloadQr = async () => {
    vibrateTap()
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
      vibrateSuccess()
      toast.success("บันทึกรูป QR Code ลงเครื่องเรียบร้อยแล้วค่ะ")
    } catch {
      window.open(qrUrl, '_blank')
    }
  }

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault()
    if (isSubmitting) return

    const numericAmount = parseFloat(amount || String(defaultAmount || 0))
    if (!numericAmount || numericAmount <= 0) {
      toast.error('ยอดชำระเงินไม่ถูกต้อง')
      return
    }
    if (!file) {
      toast.error('กรุณาแตะเลือกรูปสลิปหลักฐานการโอนก่อนกดยืนยัน')
      handleTriggerFileSelect()
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Compress image safely on mobile (with fallback to original file if compression fails)
      let fileToUpload: File | Blob = file
      try {
        const { default: imageCompression } = await import('browser-image-compression')
        const compressed = await Promise.race([
          imageCompression(file, {
            maxSizeMB: 0.3,
            maxWidthOrHeight: 1200,
            useWebWorker: false,
            fileType: 'image/jpeg',
            initialQuality: 0.7,
          }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Compression timeout')), 6000)),
        ])
        if (compressed && compressed.size > 0) {
          fileToUpload = compressed
        }
      } catch (compressErr) {
        console.warn('Image compression skipped, using original file:', compressErr)
        fileToUpload = file
      }

      const isoPaymentDate = paymentDate && !Number.isNaN(new Date(paymentDate).getTime())
        ? new Date(paymentDate).toISOString()
        : new Date().toISOString()

      // 2. Try client-side upload first; fallback to server multipart upload if blocked on mobile
      let paymentResponse: Response | null = null

      try {
        const { data: authData } = await supabase.auth.getUser()
        if (authData?.user) {
          const uploadMime = fileToUpload.type && ['image/jpeg', 'image/png', 'image/webp'].includes(fileToUpload.type)
            ? fileToUpload.type
            : 'image/jpeg'
          const ext = uploadMime === 'image/png' ? 'png' : uploadMime === 'image/webp' ? 'webp' : 'jpg'
          const fileName = `${authData.user.id}/${orderId}/slip-${Date.now()}.${ext}`

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('payment_slips')
            .upload(fileName, fileToUpload, {
              contentType: uploadMime,
              upsert: true,
            })

          if (!uploadError && uploadData?.path) {
            paymentResponse = await fetch(`/api/order/${orderId}/payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                payment_round: paymentRound,
                amount: numericAmount,
                payment_date: isoPaymentDate,
                slip_path: uploadData.path,
              }),
            })
          }
        }
      } catch (clientUploadErr) {
        console.warn('Client storage upload fallback to server FormData:', clientUploadErr)
      }

      // Fallback: Upload directly via server API using multipart/form-data
      if (!paymentResponse) {
        const formData = new FormData()
        formData.append('payment_round', String(paymentRound))
        formData.append('amount', String(numericAmount))
        formData.append('payment_date', isoPaymentDate)
        const finalFile = fileToUpload instanceof File
          ? fileToUpload
          : new File([fileToUpload], `slip-${Date.now()}.jpg`, { type: 'image/jpeg' })
        formData.append('file', finalFile)

        paymentResponse = await fetch(`/api/order/${orderId}/payment`, {
          method: 'POST',
          body: formData,
        })
      }

      const paymentResult = await paymentResponse.json()
      if (!paymentResponse.ok) {
        throw new Error(paymentResult.error || 'ไม่สามารถบันทึกการชำระเงินได้')
      }

      vibrateSuccess()
      toast.success('แจ้งชำระเงินสำเร็จ! กรุณารอเจ้าหน้าที่ตรวจสอบ')
      setIsOpen(false)
      router.refresh()
      window.location.reload()
    } catch (err: any) {
      console.error('Submit slip error:', err)
      toast.error('เกิดข้อผิดพลาด: ' + (err.message || 'ไม่สามารถอัปโหลดไฟล์ได้ กรุณาลองอีกครั้ง'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {!isPaymentConfigured && (
        <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
          {!paymentAccountMatchesOperator && publicBusinessConfig.bankAccountName
            ? "ชื่อบัญชีรับเงินไม่ตรงกับชื่อผู้ประกอบการ ระบบจึงปิดรับชำระ กรุณาอย่าโอนเงิน"
            : "ยังไม่เปิดรับชำระผ่านหน้าเว็บ กรุณาติดต่อผู้ให้บริการและตรวจสอบชื่อผู้รับเงินก่อนโอนทุกครั้ง"}
        </div>
      )}
      {publicBusinessConfig.demoMode && (
        <div className="mt-2 rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-black text-red-800">
          DEMO PAYMENT — ใช้สลิปตัวอย่างเท่านั้น ห้ามโอนเงินจริงเข้าบัญชีใด ๆ
        </div>
      )}
      <Button 
        type="button"
        onClick={handleOpenModal} 
        disabled={!isPaymentConfigured}
        size="sm" 
        variant={isRejected ? "destructive" : "default"}
        className={buttonClassName || `w-full mt-2 font-bold cursor-pointer rounded-xl h-11 shadow-sm transition-all active:scale-[0.98] ${
          isRejected 
            ? "bg-rose-600 hover:bg-rose-700 text-white" 
            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
        }`}
      >
        <Upload className="w-4 h-4 mr-2" />
        {buttonLabel || (isRejected ? `แนบสลิปใหม่อีกครั้ง (รอบที่ ${paymentRound})` : `แนบสลิปชำระเงิน (รอบที่ ${paymentRound})`)}
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && setIsOpen(false)}>
        <DialogContent className="p-0 space-y-0 gap-0 overflow-hidden flex flex-col max-h-[90dvh]">
          {/* Fixed Header */}
          <div className="flex justify-between items-center p-4 border-b border-slate-100 shrink-0 bg-white">
            <DialogHeader className="text-left pr-4">
              <DialogTitle className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>แจ้งชำระเงิน รอบที่ {paymentRound}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                โอนเงินเข้าบัญชีแล้วแตะแนบรูปสลิปเพื่อยืนยัน
              </DialogDescription>
            </DialogHeader>
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              onClick={() => !isSubmitting && setIsOpen(false)} 
              className="h-8 w-8 rounded-full cursor-pointer shrink-0 text-slate-400 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Hidden File Input - Always Mounted (Never Unmounted) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="sr-only"
          />

          {/* Scrollable Form Body */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3.5 min-h-0"
          >
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
            {hasPromptPay && hasBankTransfer && (
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
            )}

            {/* Tab 1: Dynamic PromptPay QR Code with Download Button */}
            {paymentMethodTab === 'promptpay' && hasPromptPay && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2.5">
                <div className="bg-white p-2.5 rounded-2xl border border-slate-200 inline-block shadow-xs">
                  <img 
                    src={qrUrl} 
                    alt="PromptPay QR Code" 
                    className="w-36 h-36 sm:w-44 sm:h-44 object-contain mx-auto rounded-lg" 
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
                    className="h-9 px-3.5 text-xs font-bold text-primary border-blue-200 hover:bg-blue-50 rounded-xl cursor-pointer shadow-xs"
                  >
                    <Download className="w-4 h-4 mr-1.5 text-primary" />
                    📥 บันทึกรูป QR Code ลงมือถือ
                  </Button>
                </div>
              </div>
            )}

            {/* Tab 2: Bank Account Info Card */}
            {(paymentMethodTab === 'bank' || !hasPromptPay) && hasBankTransfer && (
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    บัญชีธนาคารสำหรับโอนเงิน
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                    พร้อมรับโอน
                  </span>
                </div>

                <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 gap-2">
                  <div className="min-w-0">
                    <p className="font-black text-slate-900 text-sm">{bankName}</p>
                    <p className="text-slate-500 text-xs truncate">ชื่อบัญชี: {accountName}</p>
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
              <label className="text-xs font-bold text-slate-800 flex justify-between items-center">
                <span>แนบรูปสลิปหลักฐานการโอน *</span>
                <span className="text-[10px] text-slate-400 font-normal">รองรับ JPG, PNG, รูปแคปหน้าจอ</span>
              </label>

              {!previewUrl ? (
                <button
                  type="button"
                  onClick={handleTriggerFileSelect}
                  className="w-full border-2 border-dashed border-blue-300 hover:border-primary bg-blue-50/40 hover:bg-blue-50/80 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <div className="w-11 h-11 rounded-full bg-blue-100 text-primary flex items-center justify-center shadow-xs">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-black text-primary block">แตะที่นี่เพื่อเลือกรูปสลิปจากมือถือ</span>
                    <span className="text-[11px] text-slate-500">เลือกจากอัลบั้มรูปภาพ หรือถ่ายรูปสลิป</span>
                  </div>
                </button>
              ) : (
                <div className="p-3 bg-emerald-50/70 rounded-2xl border-2 border-emerald-300 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={previewUrl} alt="Slip preview" className="w-14 h-14 object-cover rounded-xl border border-emerald-200 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-black text-emerald-900 text-xs block truncate">✓ แนบรูปสลิปเรียบร้อยแล้ว</span>
                      <span className="text-emerald-700 text-[11px] font-semibold block">
                        กดปุ่ม &quot;ยืนยันแจ้งชำระเงิน&quot; สีเขียวด้านล่างได้เลย
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleTriggerFileSelect}
                      className="h-8 px-2.5 text-[11px] font-bold rounded-xl border-emerald-300 text-emerald-800 hover:bg-emerald-100 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" /> เปลี่ยนรูป
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => { setFile(null); setPreviewUrl(null); }}
                      className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Date/Time (Auto-filled) */}
            <div className="space-y-1 text-left">
              <label htmlFor={`paymentDate-${orderId}-${paymentRound}`} className="text-[11px] font-semibold text-slate-500">
                วัน-เวลาที่โอน (ระบุอัตโนมัติ แก้ไขได้)
              </label>
              <Input 
                id={`paymentDate-${orderId}-${paymentRound}`}
                type="datetime-local" 
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="h-10 rounded-xl bg-slate-50 text-xs text-slate-700 font-mono"
              />
            </div>
          </div>

          {/* Pinned Sticky Footer - Always Visible Above Mobile Safe Area */}
          <div className="p-3.5 sm:p-4 pb-[max(env(safe-area-inset-bottom),0.875rem)] border-t border-slate-200 bg-white shrink-0 flex items-center justify-between gap-2.5 shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => !isSubmitting && setIsOpen(false)} 
              disabled={isSubmitting} 
              className="cursor-pointer text-xs font-bold h-12 px-4 rounded-xl text-slate-600"
            >
              ปิด
            </Button>
            <Button 
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`font-black h-12 px-5 rounded-xl cursor-pointer shadow-lg text-sm flex-1 transition-all active:scale-[0.98] ${
                file
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20"
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>กำลังอัปโหลดสลิป...</span>
                </div>
              ) : file ? (
                <span>✓ ยืนยันแจ้งชำระเงิน</span>
              ) : (
                <span>📷 เลือกรูปสลิปเพื่อแจ้งโอน</span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

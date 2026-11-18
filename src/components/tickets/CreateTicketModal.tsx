"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  COORDINATOR_SCOPE_NOTICE,
  MAX_TICKET_ATTACHMENTS,
  TICKET_CATEGORIES,
  TICKET_CATEGORY_META,
  type TicketCategory,
  validateOptionalVideoUrl,
} from "@/lib/tickets"
import { uploadTicketImages } from "@/lib/ticket-upload"
import {
  AlertCircle,
  Camera,
  ExternalLink,
  Info,
  LifeBuoy,
  Loader2,
  PackageX,
  ShieldAlert,
  Sparkles,
  Trash2,
  Video,
} from "lucide-react"

interface SelectedPhoto {
  id: string
  file: File
  previewUrl: string
}

interface CreateTicketModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
  orderNumber: string
  onCreated?: (ticket: { id: string; ticket_number: string }) => void
}

const CATEGORY_ICONS: Record<TicketCategory, typeof PackageX> = {
  MISSING_ITEM: PackageX,
  DAMAGED_TRANSIT: ShieldAlert,
  NOT_AS_DESCRIBED: Sparkles,
  OTHER: LifeBuoy,
}

export function CreateTicketModal({
  open,
  onOpenChange,
  orderId,
  orderNumber,
  onCreated,
}: CreateTicketModalProps) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [category, setCategory] = useState<TicketCategory>("MISSING_ITEM")
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [acknowledged, setAcknowledged] = useState(false)
  const [photos, setPhotos] = useState<SelectedPhoto[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resetForm = () => {
    photos.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    setCategory("MISSING_ITEM")
    setSubject("")
    setDescription("")
    setVideoUrl("")
    setAcknowledged(false)
    setPhotos([])
    setErrorMessage(null)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !submitting) {
      resetForm()
    }
    onOpenChange(nextOpen)
  }

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return

    const remainingSlots = MAX_TICKET_ATTACHMENTS - photos.length
    if (remainingSlots <= 0) {
      toast.error(`แนบรูปหลักฐานได้สูงสุด ${MAX_TICKET_ATTACHMENTS} รูปต่อครั้ง`)
      e.target.value = ""
      return
    }

    const incoming: SelectedPhoto[] = []
    for (const file of Array.from(fileList).slice(0, remainingSlots)) {
      if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type) && !file.type.startsWith("image/")) {
        toast.error(`ไฟล์ ${file.name} ไม่ใช่รูปภาพที่รองรับ`)
        continue
      }
      if (file.size > 15 * 1024 * 1024) {
        toast.error(`รูป ${file.name} มีขนาดใหญ่เกินไป (สูงสุด 15 MB ก่อนบีบอัด)`)
        continue
      }
      incoming.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      })
    }

    if (incoming.length > 0) {
      setPhotos((prev) => [...prev, ...incoming])
    }
    e.target.value = ""
  }

  const removePhoto = (photoId: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === photoId)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((p) => p.id !== photoId)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return

    setErrorMessage(null)

    const trimmedSubject = subject.trim()
    const trimmedDescription = description.trim()

    if (trimmedSubject.length < 2) {
      setErrorMessage("กรุณาระบุหัวข้อปัญหาอย่างน้อย 2 ตัวอักษร")
      return
    }
    if (trimmedDescription.length < 5) {
      setErrorMessage("กรุณาอธิบายรายละเอียดปัญหาอย่างน้อย 5 ตัวอักษร")
      return
    }

    const videoValidation = validateOptionalVideoUrl(videoUrl)
    if (!videoValidation.ok) {
      setErrorMessage(videoValidation.error || "ลิงก์วิดีโอไม่ถูกต้อง")
      return
    }

    if (!acknowledged) {
      setErrorMessage("กรุณาติ๊กยืนยันรับทราบขอบเขตการประสานงานก่อนเปิดเคส")
      return
    }

    setSubmitting(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setErrorMessage("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง")
        setSubmitting(false)
        return
      }

      const evidencePaths = await uploadTicketImages(
        supabase,
        user.id,
        orderId,
        photos.map((p) => p.file)
      )

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          category,
          subject: trimmedSubject,
          description: trimmedDescription,
          evidence_paths: evidencePaths,
          video_url: videoValidation.url,
          acknowledged_scope: true,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || "ไม่สามารถเปิดเคสได้ในขณะนี้")
      }

      toast.success(`เปิดเคส ${data.ticket?.ticket_number || ""} เรียบร้อยแล้ว`)
      resetForm()
      onOpenChange(false)
      if (onCreated && data.ticket) {
        onCreated(data.ticket)
      }
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const activeCategoryMeta = TICKET_CATEGORY_META[category]

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90dvh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 sm:px-6 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
            <LifeBuoy className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
            <span>เปิดเคสแจ้งปัญหา / ขอช่วยประสานงาน</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-slate-600">
            คำสั่งซื้ออ้างอิง:{" "}
            <span className="font-mono font-bold text-slate-800">{orderNumber}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y px-5 py-4 sm:px-6 space-y-5">
            {/* Non-liability & Full-Support Coordination Policy Banner */}
            <div className="rounded-xl border border-sky-200 bg-sky-50/80 p-3.5 sm:p-4 space-y-2">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-1.5 text-xs leading-relaxed text-sky-950">
                  <p className="font-bold">{COORDINATOR_SCOPE_NOTICE.title}</p>
                  <p>{COORDINATOR_SCOPE_NOTICE.summary}</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-sky-900/90">
                    {COORDINATOR_SCOPE_NOTICE.highlights.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <div className="pt-0.5">
                    <Link
                      href="/terms#section-6"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
                    >
                      <span>อ่านเงื่อนไขบริการฉบับเต็ม (ข้อ 6)</span>
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs sm:text-sm font-medium text-rose-800"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Category Selector */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800">
                1. เลือกประเภทปัญหาที่พบ <span className="text-rose-500">*</span>
              </label>
              <div role="radiogroup" aria-label="ประเภทปัญหาสินค้า" className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {TICKET_CATEGORIES.map((catKey) => {
                  const meta = TICKET_CATEGORY_META[catKey]
                  const Icon = CATEGORY_ICONS[catKey]
                  const selected = category === catKey
                  return (
                    <button
                      key={catKey}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setCategory(catKey)}
                      className={`min-h-11 text-left rounded-xl border p-3 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        selected
                          ? "border-primary bg-blue-50/70 ring-1 ring-primary"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <Icon
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            selected ? "text-primary" : "text-slate-400"
                          }`}
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <div
                            className={`text-xs sm:text-sm font-bold ${
                              selected ? "text-primary" : "text-slate-800"
                            }`}
                          >
                            {meta.label}
                          </div>
                          <div className="text-[11px] text-slate-500 leading-snug mt-0.5">
                            {meta.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
              <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200/80 rounded-lg px-3 py-2 leading-relaxed">
                {activeCategoryMeta.evidenceTip}
              </p>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <label htmlFor="ticket-subject" className="text-sm font-bold text-slate-800">
                2. หัวข้อปัญหาโดยย่อ <span className="text-rose-500">*</span>
              </label>
              <Input
                id="ticket-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={160}
                placeholder="เช่น สินค้าขาด 1 ชิ้น / กล่องบุบและสินค้าด้านในแตก / ร้านส่งผิดสี"
                className="h-11 rounded-xl"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label htmlFor="ticket-description" className="text-sm font-bold text-slate-800">
                3. รายละเอียดที่ต้องการให้ทีมงานช่วยประสานงาน <span className="text-rose-500">*</span>
              </label>
              <Textarea
                id="ticket-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={4000}
                placeholder="ระบุจำนวน/รายการที่มีปัญหา เลขพัสดุที่พบ และสิ่งที่ต้องการให้ทีมงานช่วยเจรจากับร้านค้าหรือขนส่ง"
                className="rounded-xl resize-y min-h-[104px]"
                required
              />
            </div>

            {/* Photos Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-bold text-slate-800">
                  4. รูปภาพหลักฐาน ({photos.length}/{MAX_TICKET_ATTACHMENTS} รูป)
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photos.length >= MAX_TICKET_ATTACHMENTS || submitting}
                  className="min-h-11 sm:min-h-9 rounded-xl cursor-pointer gap-1.5 text-xs font-bold"
                >
                  <Camera className="w-4 h-4 text-primary" aria-hidden="true" />
                  <span>เพิ่มรูปหลักฐาน</span>
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFilesSelected}
                  className="hidden"
                />
              </div>

              {photos.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                  {photos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="relative group aspect-square rounded-xl border border-slate-200 overflow-hidden bg-slate-100"
                    >
                      <img
                        src={photo.previewUrl}
                        alt={`หลักฐานรูปที่ ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        aria-label={`ลบรูปหลักฐานที่ ${index + 1}`}
                        className="absolute top-1.5 right-1.5 h-8 w-8 rounded-full bg-slate-900/75 text-white flex items-center justify-center hover:bg-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50/70 hover:bg-slate-100/70 px-4 py-5 text-center transition-colors cursor-pointer"
                >
                  <Camera className="w-6 h-6 text-slate-400 mx-auto mb-1.5" aria-hidden="true" />
                  <p className="text-xs font-semibold text-slate-700">
                    แตะเพื่อเลือกรูปถ่ายกล่อง/ใบปะหน้า/สินค้าที่มีปัญหา
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ระบบจะย่อขนาดรูปอัตโนมัติ (JPG, PNG, WebP สูงสุด {MAX_TICKET_ATTACHMENTS} รูป)
                  </p>
                </button>
              )}
            </div>

            {/* Optional External Video Link */}
            <div className="space-y-1.5">
              <label htmlFor="ticket-video-url" className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-slate-500" aria-hidden="true" />
                <span>ลิงก์วิดีโอตอนแกะพัสดุ (ถ้ามี / ไม่บังคับ)</span>
              </label>
              <Input
                id="ticket-video-url"
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://drive.google.com/... หรือลิงก์วิดีโอจาก LINE"
                className="h-11 rounded-xl"
              />
              <p className="text-[11px] text-slate-500">
                หากมีวิดีโอขณะแกะกล่อง แนะนำฝากไฟล์ใน Google Drive หรือส่งใน LINE แล้ววางลิงก์เพื่อให้ร้านค้าจีนตรวจสอบได้ง่ายขึ้น
              </p>
            </div>

            {/* Explicit Scope Acknowledgment */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex items-start gap-3">
                <input
                  id="ticket-scope-ack"
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-0.5 h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer shrink-0"
                />
                <label
                  htmlFor="ticket-scope-ack"
                  className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed cursor-pointer"
                >
                  {COORDINATOR_SCOPE_NOTICE.ackLabel}
                </label>
              </div>
            </div>
          </div>

          <div className="px-5 py-3.5 sm:px-6 border-t border-slate-100 bg-white flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
              className="min-h-11 rounded-xl cursor-pointer font-semibold"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={submitting || !acknowledged}
              className="min-h-11 rounded-xl cursor-pointer font-bold bg-primary hover:bg-primary/90 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  <span>กำลังอัปโหลดและเปิดเคส...</span>
                </>
              ) : (
                <span>ส่งเรื่องขอช่วยประสานงาน</span>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

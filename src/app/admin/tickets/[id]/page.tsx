"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { TicketCategoryBadge, TicketStatusBadge } from "@/components/tickets/TicketBadges"
import {
  TicketEvidenceGallery,
  type SignedAttachmentItem,
} from "@/components/tickets/TicketEvidenceGallery"
import { TicketActivityFeed, type TicketUpdateEntry } from "@/components/tickets/TicketActivityFeed"
import { formatBangkokDateTime } from "@/lib/date-format"
import { isValidThaiPhone } from "@/lib/phone"
import {
  MAX_TICKET_ATTACHMENTS,
  TICKET_STATUSES,
  TICKET_STATUS_META,
  type TicketStatus,
} from "@/lib/tickets"
import { uploadTicketImages } from "@/lib/ticket-upload"
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  Camera,
  CircleDollarSign,
  ExternalLink,
  Loader2,
  Lock,
  MessageSquare,
  Package,
  Phone,
  Send,
  Trash2,
  User,
} from "lucide-react"

interface AdminTicketDetailResponse {
  ticket: {
    id: string
    ticket_number: string
    order_id: string
    customer_id: string
    category: string
    subject: string
    description: string
    video_url: string | null
    status: TicketStatus
    resolution_note: string | null
    created_at: string
    last_activity_at: string
    order: {
      id: string
      order_number: string
      status: string
      tracking_number: string | null
      shipping_company: string | null
      quotation: {
        inquiry: {
          items: Array<{
            tracking_cn_cn?: string | null
            tracking_cn_cn_list?: string[] | null
          }> | null
          shipping_type: string | null
        } | null
      } | null
    } | null
    customer: {
      id: string
      full_name: string | null
      display_name: string
      customer_code: string | null
      phone: string | null
      line_uid: string | null
    } | null
    evidence_signed: SignedAttachmentItem[]
  }
  updates: TicketUpdateEntry[]
  refunds?: Array<{
    id: string
    amount: number
    status: string
    reason: string
    payment_reference?: string | null
    created_at: string
  }>
}

const REFUND_STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "รออนุมัติ", cls: "bg-amber-50 text-amber-800 border-amber-200" },
  APPROVED: { label: "รอดำเนินการโอน", cls: "bg-sky-50 text-sky-800 border-sky-200" },
  PAID: { label: "โอนคืนแล้ว", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  FAILED: { label: "โอนไม่สำเร็จ", cls: "bg-rose-50 text-rose-800 border-rose-200" },
  CANCELED: { label: "ยกเลิก", cls: "bg-slate-100 text-slate-600 border-slate-200" },
}

export default function AdminTicketDetailPage() {
  const params = useParams<{ id: string }>()
  const ticketId = params?.id
  const [supabase] = useState(() => createClient())
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [data, setData] = useState<AdminTicketDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [nextStatus, setNextStatus] = useState<TicketStatus>("IN_PROGRESS")
  const [message, setMessage] = useState("")
  const [resolutionNote, setResolutionNote] = useState("")
  const [isInternal, setIsInternal] = useState(false)
  const [notifyCustomer, setNotifyCustomer] = useState(true)
  const [photos, setPhotos] = useState<Array<{ id: string; file: File; previewUrl: string }>>([])
  const [saving, setSaving] = useState(false)
  const [refundModalOpen, setRefundModalOpen] = useState(false)
  const [refundAmount, setRefundAmount] = useState("")
  const [refundReason, setRefundReason] = useState("")
  const [creatingRefund, setCreatingRefund] = useState(false)

  const loadTicket = useCallback(async () => {
    if (!ticketId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/tickets/${encodeURIComponent(ticketId)}`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.error || "ไม่สามารถโหลดรายละเอียดเคสได้")
      }
      setData(json)
      setNextStatus(json.ticket.status)
      setResolutionNote(json.ticket.resolution_note || "")
      setNotifyCustomer(Boolean(json.ticket.customer?.line_uid))
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล")
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  useEffect(() => {
    loadTicket()
  }, [loadTicket])

  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSelectPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList) return
    const slots = MAX_TICKET_ATTACHMENTS - photos.length
    if (slots <= 0) {
      toast.error(`แนบรูปได้สูงสุด ${MAX_TICKET_ATTACHMENTS} รูปต่อครั้ง`)
      e.target.value = ""
      return
    }
    const next: Array<{ id: string; file: File; previewUrl: string }> = []
    for (const file of Array.from(fileList).slice(0, slots)) {
      if (!file.type.startsWith("image/")) continue
      next.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      })
    }
    setPhotos((prev) => [...prev, ...next])
    e.target.value = ""
  }

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((p) => p.id !== id)
    })
  }

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!data || saving) return

    const trimmedMsg = message.trim()
    const statusChanged = nextStatus !== data.ticket.status
    const resolutionChanged = resolutionNote.trim() !== (data.ticket.resolution_note || "")

    if (!trimmedMsg && !statusChanged && !resolutionChanged && photos.length === 0) {
      toast.error("กรุณาระบุข้อความ เปลี่ยนสถานะ หรือแก้บันทึกสรุปผลก่อนบันทึก")
      return
    }

    setSaving(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("เซสชันแอดมินหมดอายุ กรุณาเข้าสู่ระบบใหม่")

      const uploadedPaths = await uploadTicketImages(
        supabase,
        user.id,
        data.ticket.id,
        photos.map((p) => p.file)
      )

      const res = await fetch(`/api/admin/tickets/${encodeURIComponent(data.ticket.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          message: trimmedMsg,
          is_internal: isInternal,
          notify_customer: !isInternal && notifyCustomer,
          resolution_note: resolutionNote,
          attachments: uploadedPaths,
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.error || "ไม่สามารถบันทึกข้อมูลได้")
      }

      if (json.line_notified) {
        toast.success("บันทึกอัปเดตและส่งแจ้งเตือนเข้า LINE ลูกค้าเรียบร้อยแล้ว")
      } else if (!isInternal && notifyCustomer) {
        toast.success("บันทึกอัปเดตเคสแล้ว (ไม่ได้ส่งแจ้งเตือน LINE เนื่องจากยังไม่มีการเชื่อม LINE)")
      } else {
        toast.success("บันทึกอัปเดตเคสเรียบร้อยแล้ว")
      }

      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl))
      setPhotos([])
      setMessage("")
      await loadTicket()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 w-72 rounded-xl bg-white border border-slate-200 animate-pulse" />
        <div className="h-72 rounded-2xl bg-white border border-slate-200 animate-pulse" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card className="border-rose-200 bg-rose-50/70 max-w-2xl mx-auto">
        <CardContent className="p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" aria-hidden="true" />
          <p className="text-sm font-bold text-rose-900">
            {error || "ไม่พบเคสประสานงานนี้"}
          </p>
          <Link href="/admin/tickets">
            <Button variant="outline" className="min-h-11 rounded-xl">
              กลับไปหน้ารายการเคส
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  const { ticket, updates } = data
  const inquiryItems = ticket.order?.quotation?.inquiry?.items || []
  const chinaTrackings = Array.from(
    new Set(
      inquiryItems.flatMap((item) => {
        const list = Array.isArray(item.tracking_cn_cn_list) ? item.tracking_cn_cn_list : []
        const single = item.tracking_cn_cn ? [item.tracking_cn_cn] : []
        return [...list, ...single].filter(Boolean) as string[]
      })
    )
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/tickets">
            <Button
              variant="outline"
              size="icon"
              aria-label="กลับไปรายการเคสประสานงาน"
              className="min-h-11 min-w-11 rounded-xl bg-white cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </Button>
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-extrabold text-primary">
                {ticket.ticket_number}
              </span>
              <TicketStatusBadge status={ticket.status} />
              <TicketCategoryBadge category={ticket.category} />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              {ticket.subject}
            </h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Main Workspace */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">
                รายละเอียดปัญหาที่ลูกค้าแจ้ง
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </p>
              <TicketEvidenceGallery
                evidence={ticket.evidence_signed}
                videoUrl={ticket.video_url}
                title="หลักฐานจากลูกค้า"
              />
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">
                ไทม์ไลน์และบันทึกการประสานงาน
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <TicketActivityFeed updates={updates} />
            </CardContent>
          </Card>

          {/* Admin Action Composer */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">
                อัปเดตสถานะ / ตอบกลับเคส
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSaveUpdate} className="space-y-4">
                {/* Mode Toggle: Public vs Internal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsInternal(false)}
                    className={`min-h-11 rounded-xl border px-3.5 py-2.5 text-left transition-colors cursor-pointer flex items-center gap-2.5 ${
                      !isInternal
                        ? "border-primary bg-blue-50/70 text-primary ring-1 ring-primary"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <div>
                      <div className="text-xs font-bold">ส่งให้ลูกค้าเห็น</div>
                      <div className="text-[11px] opacity-80">อัปเดตบนหน้า Tracking ของลูกค้า</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsInternal(true)}
                    className={`min-h-11 rounded-xl border px-3.5 py-2.5 text-left transition-colors cursor-pointer flex items-center gap-2.5 ${
                      isInternal
                        ? "border-amber-500 bg-amber-50 text-amber-950 ring-1 ring-amber-500"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Lock className="w-4 h-4 shrink-0 text-amber-600" aria-hidden="true" />
                    <div>
                      <div className="text-xs font-bold">บันทึกภายในแอดมิน</div>
                      <div className="text-[11px] opacity-80">เก็บไว้ดูเองภายใน (ลูกค้าไม่เห็น)</div>
                    </div>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="admin-ticket-status" className="text-xs font-bold text-slate-700">
                      สถานะเคส
                    </label>
                    <select
                      id="admin-ticket-status"
                      value={nextStatus}
                      onChange={(e) => setNextStatus(e.target.value as TicketStatus)}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {TICKET_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {TICKET_STATUS_META[st].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="admin-ticket-resolution" className="text-xs font-bold text-slate-700">
                      สรุปผลเคส (แสดงให้ลูกค้าเห็นเมื่อปิด/เสร็จสิ้น)
                    </label>
                    <Input
                      id="admin-ticket-resolution"
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      placeholder="เช่น ร้านค้าตกลงคืนเงิน 120 หยวน ดำเนินการบันทึกคืนเข้าบัญชีแล้ว"
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="admin-ticket-message" className="text-xs font-bold text-slate-700">
                    {isInternal ? "ข้อความบันทึกภายใน" : "ข้อความแจ้งลูกค้า"}
                  </label>
                  <Textarea
                    id="admin-ticket-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    maxLength={4000}
                    placeholder={
                      isInternal
                        ? "จดบันทึกผลคุยกับร้านค้าจีน / เลขเคลมขนส่ง / ข้อควรระวังภายในทีม..."
                        : "แจ้งความคืบหน้าหรือขอหลักฐานเพิ่มเติมจากลูกค้า..."
                    }
                    className={`rounded-xl ${
                      isInternal ? "border-amber-300 bg-amber-50/40" : "bg-white"
                    }`}
                  />
                </div>

                {photos.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {photos.map((p, idx) => (
                      <div
                        key={p.id}
                        className="relative aspect-square rounded-xl border border-slate-200 overflow-hidden bg-slate-100"
                      >
                        <img
                          src={p.previewUrl}
                          alt={`รูปแนบ ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(p.id)}
                          aria-label={`ลบรูปแนบที่ ${idx + 1}`}
                          className="absolute top-1 right-1 h-7 w-7 rounded-full bg-slate-900/75 text-white flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {!isInternal && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 flex items-center gap-3">
                    <input
                      id="admin-notify-line"
                      type="checkbox"
                      checked={notifyCustomer}
                      onChange={(e) => setNotifyCustomer(e.target.checked)}
                      disabled={!ticket.customer?.line_uid}
                      className="h-5 w-5 rounded border-slate-300 text-primary cursor-pointer"
                    />
                    <label
                      htmlFor="admin-notify-line"
                      className="text-xs font-medium text-slate-700 cursor-pointer flex items-center gap-1.5"
                    >
                      <Bell className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
                      {ticket.customer?.line_uid ? (
                        <span>ส่งข้อความแจ้งเตือนเข้า LINE ลูกค้าอัตโนมัติ</span>
                      ) : (
                        <span className="text-slate-500">
                          ลูกค้ายังไม่ได้เชื่อมบัญชี LINE (ระบบจะอัปเดตเฉพาะหน้าเว็บ)
                        </span>
                      )}
                    </label>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photos.length >= MAX_TICKET_ATTACHMENTS || saving}
                    className="min-h-11 rounded-xl cursor-pointer text-xs font-bold gap-1.5"
                  >
                    <Camera className="w-4 h-4 text-primary" aria-hidden="true" />
                    <span>แนบรูปภาพ ({photos.length}/{MAX_TICKET_ATTACHMENTS})</span>
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleSelectPhotos}
                    className="hidden"
                  />

                  <Button
                    type="submit"
                    disabled={saving}
                    className="min-h-11 rounded-xl cursor-pointer font-bold bg-primary hover:bg-primary/90 text-white gap-1.5"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        <span>กำลังบันทึก...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" aria-hidden="true" />
                        <span>{isInternal ? "บันทึกโน้ตภายใน" : "บันทึกและอัปเดตเคส"}</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Context Column */}
        <div className="lg:col-span-4 space-y-5">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" aria-hidden="true" />
                <span>ข้อมูลคำสั่งซื้อ & Tracking</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs sm:text-sm">
              <div>
                <span className="text-slate-500 text-xs block">คำสั่งซื้อ</span>
                {ticket.order ? (
                  <Link
                    href={`/admin/orders/${ticket.order.id}`}
                    className="font-mono font-extrabold text-primary hover:underline inline-flex items-center gap-1 mt-0.5"
                  >
                    <span>{ticket.order.order_number}</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                ) : (
                  <span>-</span>
                )}
              </div>

              {chinaTrackings.length > 0 && (
                <div>
                  <span className="text-slate-500 text-xs block mb-1">เลขพัสดุจีน-จีน</span>
                  <div className="flex flex-wrap gap-1.5">
                    {chinaTrackings.map((code) => (
                      <span
                        key={code}
                        className="font-mono text-xs bg-slate-100 border border-slate-200 px-2 py-0.5 rounded"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {ticket.order?.tracking_number && (
                <div>
                  <span className="text-slate-500 text-xs block">เลขพัสดุไทย</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {ticket.order.tracking_number}
                  </span>
                </div>
              )}

              <div>
                <span className="text-slate-500 text-xs block">เปิดเคสเมื่อ</span>
                <span className="text-slate-800 font-medium">
                  {formatBangkokDateTime(ticket.created_at)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" aria-hidden="true" />
                <span>ข้อมูลลูกค้า</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs sm:text-sm">
              <div>
                <span className="text-slate-500 text-xs block">ชื่อลูกค้า / รหัส</span>
                <p className="font-bold text-slate-900">
                  {ticket.customer?.display_name || "ลูกค้า"}{" "}
                  {ticket.customer?.customer_code ? (
                    <span className="font-mono text-xs text-primary">
                      ({ticket.customer.customer_code})
                    </span>
                  ) : null}
                </p>
              </div>

              <div>
                <span className="text-slate-500 text-xs block">เบอร์โทร</span>
                {isValidThaiPhone(ticket.customer?.phone) ? (
                  <a
                    href={`tel:${ticket.customer?.phone}`}
                    className="inline-flex items-center gap-1.5 font-mono font-semibold text-primary hover:underline mt-0.5"
                  >
                    <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{ticket.customer?.phone}</span>
                  </a>
                ) : (
                  <span className="text-slate-400">ไม่ได้ระบุเบอร์โทร</span>
                )}
              </div>

              <div>
                <span className="text-slate-500 text-xs block">การเชื่อม LINE</span>
                <span
                  className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                    ticket.customer?.line_uid
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {ticket.customer?.line_uid ? "เชื่อมบัญชี LINE แล้ว" : "ยังไม่เชื่อม LINE"}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <CircleDollarSign className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                    <span>คืนเงินที่ได้รับจากร้านค้า/ขนส่ง</span>
                  </span>
                  <Link href="/admin/refunds" className="text-[11px] font-bold text-primary hover:underline">
                    หน้าเงินคืน →
                  </Link>
                </div>

                {Array.isArray(data.refunds) && data.refunds.length > 0 && (
                  <div className="space-y-2">
                    {data.refunds.map((refund) => {
                      const badge = REFUND_STATUS_LABELS[refund.status] || {
                        label: refund.status,
                        cls: "bg-slate-100 text-slate-700 border-slate-200",
                      }
                      return (
                        <div
                          key={refund.id}
                          className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 space-y-1 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-extrabold text-slate-900">
                              ฿{Number(refund.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-2">{refund.reason}</p>
                        </div>
                      )
                    })}
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setRefundAmount("")
                    setRefundReason(`เงินคืนจากร้านค้า/ขนส่ง (${ticket.subject})`)
                    setRefundModalOpen(true)
                  }}
                  className="w-full min-h-11 rounded-xl border-emerald-300 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900 font-bold cursor-pointer gap-1.5"
                >
                  <CircleDollarSign className="w-4 h-4" aria-hidden="true" />
                  <span>สร้างรายการคืนเงินจากเคสนี้</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={refundModalOpen} onOpenChange={setRefundModalOpen}>
        <DialogContent className="max-w-md max-h-[90dvh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
            <DialogTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <CircleDollarSign className="w-5 h-5 text-emerald-600" aria-hidden="true" />
              <span>สร้างรายการคืนเงินจากเคสนี้</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              เคส {ticket.ticket_number} · ออเดอร์ {ticket.order?.order_number || "-"}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (creatingRefund) return
              const numAmount = Number(refundAmount)
              if (!Number.isFinite(numAmount) || numAmount <= 0) {
                toast.error("กรุณาระบุจำนวนเงินคืนที่ถูกต้อง")
                return
              }
              if (refundReason.trim().length < 3) {
                toast.error("กรุณาระบุเหตุผลการคืนเงินอย่างน้อย 3 ตัวอักษร")
                return
              }
              setCreatingRefund(true)
              try {
                const res = await fetch("/api/admin/refunds", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    order_id: ticket.order_id,
                    ticket_id: ticket.id,
                    amount: numAmount,
                    reason: refundReason.trim(),
                  }),
                })
                const json = await res.json().catch(() => ({}))
                if (!res.ok) {
                  throw new Error(json.error || "ไม่สามารถสร้างรายการคืนเงินได้")
                }
                toast.success("บันทึกรายการคืนเงินเข้าระบบเรียบร้อยแล้ว")
                setRefundModalOpen(false)
                await loadTicket()
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด")
              } finally {
                setCreatingRefund(false)
              }
            }}
            className="p-5 space-y-4 overflow-y-auto overscroll-contain"
          >
            <div className="space-y-1.5">
              <label htmlFor="ticket-refund-amount" className="text-xs font-bold text-slate-800 block">
                จำนวนเงินคืนที่ร้านค้า/ขนส่งอนุมัติ (บาท) *
              </label>
              <Input
                id="ticket-refund-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="เช่น 350.00"
                className="h-11 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ticket-refund-reason" className="text-xs font-bold text-slate-800 block">
                รายละเอียดการคืนเงิน *
              </label>
              <Textarea
                id="ticket-refund-reason"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={3}
                maxLength={450}
                className="rounded-xl"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRefundModalOpen(false)}
                disabled={creatingRefund}
                className="min-h-11 rounded-xl cursor-pointer"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={creatingRefund}
                className="min-h-11 rounded-xl cursor-pointer font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {creatingRefund ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <span>สร้างรายการเงินคืน</span>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

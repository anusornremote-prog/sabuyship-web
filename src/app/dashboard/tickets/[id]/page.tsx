"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
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
import {
  COORDINATOR_SCOPE_NOTICE,
  getTicketStatusMeta,
  MAX_TICKET_ATTACHMENTS,
  validateOptionalVideoUrl,
} from "@/lib/tickets"
import { uploadTicketImages } from "@/lib/ticket-upload"
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  ExternalLink,
  Info,
  Loader2,
  Package,
  Send,
  Trash2,
} from "lucide-react"

interface TicketDetailResponse {
  ticket: {
    id: string
    ticket_number: string
    order_id: string
    category: string
    subject: string
    description: string
    video_url: string | null
    status: string
    resolution_note: string | null
    created_at: string
    last_activity_at: string
    order: {
      id: string
      order_number: string
      status: string
      tracking_number: string | null
      shipping_company: string | null
    } | null
    evidence_signed: SignedAttachmentItem[]
  }
  updates: TicketUpdateEntry[]
}

export default function CustomerTicketDetailPage() {
  const params = useParams<{ id: string }>()
  const ticketId = params?.id
  const [supabase] = useState(() => createClient())
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [data, setData] = useState<TicketDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [replyMessage, setReplyMessage] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [replyPhotos, setReplyPhotos] = useState<Array<{ id: string; file: File; previewUrl: string }>>([])
  const [sending, setSending] = useState(false)
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [closing, setClosing] = useState(false)

  const loadTicket = useCallback(async () => {
    if (!ticketId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/tickets/${encodeURIComponent(ticketId)}`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.error || "ไม่สามารถโหลดข้อมูลเคสนี้ได้")
      }
      setData(json)
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
      replyPhotos.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSelectPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList) return
    const slots = MAX_TICKET_ATTACHMENTS - replyPhotos.length
    if (slots <= 0) {
      toast.error(`แนบรูปเพิ่มได้สูงสุด ${MAX_TICKET_ATTACHMENTS} รูปต่อข้อความ`)
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
    setReplyPhotos((prev) => [...prev, ...next])
    e.target.value = ""
  }

  const removeReplyPhoto = (photoId: string) => {
    setReplyPhotos((prev) => {
      const target = prev.find((p) => p.id === photoId)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((p) => p.id !== photoId)
    })
  }

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!data || sending) return

    const trimmed = replyMessage.trim()
    if (!trimmed) {
      toast.error("กรุณากรอกข้อความก่อนส่ง")
      return
    }

    const videoCheck = validateOptionalVideoUrl(videoUrl)
    if (!videoCheck.ok) {
      toast.error(videoCheck.error || "ลิงก์วิดีโอไม่ถูกต้อง")
      return
    }

    setSending(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("กรุณาเข้าสู่ระบบใหม่อีกครั้ง")

      const uploadedPaths = await uploadTicketImages(
        supabase,
        user.id,
        data.ticket.order_id,
        replyPhotos.map((p) => p.file)
      )

      const res = await fetch(`/api/tickets/${encodeURIComponent(data.ticket.id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          attachments: uploadedPaths,
          video_url: videoCheck.url,
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.error || "ไม่สามารถส่งข้อความได้")
      }

      toast.success("ส่งข้อมูลเพิ่มเติมให้ทีมงานเรียบร้อยแล้ว")
      replyPhotos.forEach((p) => URL.revokeObjectURL(p.previewUrl))
      setReplyPhotos([])
      setReplyMessage("")
      setVideoUrl("")
      await loadTicket()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด")
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto">
        <div className="h-12 w-64 rounded-xl bg-white border border-slate-200 animate-pulse" />
        <div className="h-64 rounded-2xl bg-white border border-slate-200 animate-pulse" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <Card className="border-rose-200 bg-rose-50/70">
          <CardContent className="p-6 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" aria-hidden="true" />
            <p className="text-sm font-bold text-rose-900">
              {error || "ไม่พบเคสประสานงานนี้"}
            </p>
            <Link href="/dashboard/tickets">
              <Button variant="outline" className="min-h-11 rounded-xl cursor-pointer">
                กลับไปศูนย์ประสานงาน
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { ticket, updates } = data
  const statusMeta = getTicketStatusMeta(ticket.status)
  const isClosed = ticket.status === "CLOSED"

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/tickets">
            <Button
              variant="outline"
              size="icon"
              aria-label="กลับไปรายการเคสประสานงาน"
              className="min-h-11 min-w-11 rounded-xl cursor-pointer"
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

        {!isClosed && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setCloseDialogOpen(true)}
            className="min-h-11 rounded-xl cursor-pointer font-bold text-slate-700 border-slate-300 hover:bg-slate-100 self-start sm:self-auto"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" aria-hidden="true" />
            <span>ปิดเคส (เสร็จสิ้นแล้ว)</span>
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={closeDialogOpen}
        onOpenChange={setCloseDialogOpen}
        title="ยืนยันปิดเคสประสานงาน"
        description={`ต้องการปิดเคส ${ticket.ticket_number} ใช่หรือไม่? หากปิดเคสแล้วจะไม่สามารถส่งข้อความเพิ่มเติมในเคสนี้ได้`}
        confirmLabel="ยืนยันปิดเคส"
        loading={closing}
        onConfirm={async () => {
          setClosing(true)
          try {
            const res = await fetch(`/api/tickets/${encodeURIComponent(ticket.id)}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "CLOSE" }),
            })
            const json = await res.json().catch(() => ({}))
            if (!res.ok) {
              throw new Error(json.error || "ไม่สามารถปิดเคสได้")
            }
            toast.success("ปิดเคสเรียบร้อยแล้ว")
            setCloseDialogOpen(false)
            await loadTicket()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด")
          } finally {
            setClosing(false)
          }
        }}
      />

      {/* Status Guidance Banner */}
      <div
        className={`rounded-2xl border p-4 flex items-start gap-3 ${
          ticket.status === "WAITING_CUSTOMER"
            ? "border-orange-200 bg-orange-50/80 text-orange-950"
            : ticket.status === "RESOLVED"
              ? "border-emerald-200 bg-emerald-50/80 text-emerald-950"
              : "border-sky-200 bg-sky-50/70 text-sky-950"
        }`}
      >
        {ticket.status === "RESOLVED" ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
        ) : (
          <Info className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
        )}
        <div className="space-y-1 text-xs sm:text-sm">
          <p className="font-bold">สถานะปัจจุบัน: {statusMeta.label}</p>
          <p className="opacity-90 leading-relaxed">{statusMeta.customerDescription}</p>
          {ticket.resolution_note && (
            <div className="mt-2 rounded-xl bg-white/80 border border-emerald-200 p-3 text-slate-800">
              <span className="font-bold block text-xs text-emerald-800 mb-0.5">
                สรุปผลการประสานงาน:
              </span>
              <p className="whitespace-pre-wrap">{ticket.resolution_note}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Main Content */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-slate-200/90 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">
                รายละเอียดปัญหาและหลักฐานที่ส่งไว้
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </p>
              <TicketEvidenceGallery
                evidence={ticket.evidence_signed}
                videoUrl={ticket.video_url}
                title="หลักฐานตั้งต้น"
              />
            </CardContent>
          </Card>

          <Card className="border-slate-200/90 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">
                ไทม์ไลน์การประสานงานและการสื่อสาร
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-6">
              <TicketActivityFeed updates={updates} />

              {!isClosed ? (
                <form
                  onSubmit={handleReplySubmit}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3.5"
                >
                  <label
                    htmlFor="customer-ticket-reply"
                    className="text-sm font-bold text-slate-800 block"
                  >
                    ส่งข้อมูลหรือรูปหลักฐานเพิ่มเติมให้ทีมงาน
                  </label>
                  <Textarea
                    id="customer-ticket-reply"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={3}
                    maxLength={4000}
                    placeholder="พิมพ์ข้อความตอบกลับแอดมิน หรือแจ้งรายละเอียดเพิ่มเติม..."
                    className="bg-white rounded-xl"
                    required
                  />

                  {!ticket.video_url && (
                    <div className="space-y-1">
                      <label htmlFor="customer-reply-video" className="text-xs font-semibold text-slate-600">
                        แนบลิงก์วิดีโอเพิ่มเติม (ถ้ามี)
                      </label>
                      <Input
                        id="customer-reply-video"
                        type="url"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="https://drive.google.com/..."
                        className="bg-white h-10 rounded-xl text-xs"
                      />
                    </div>
                  )}

                  {replyPhotos.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {replyPhotos.map((p, idx) => (
                        <div
                          key={p.id}
                          className="relative aspect-square rounded-xl border border-slate-200 overflow-hidden bg-white"
                        >
                          <img
                            src={p.previewUrl}
                            alt={`รูปแนบเพิ่มเติม ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeReplyPhoto(p.id)}
                            aria-label={`ลบรูปที่ ${idx + 1}`}
                            className="absolute top-1 right-1 h-7 w-7 rounded-full bg-slate-900/75 text-white flex items-center justify-center cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={replyPhotos.length >= MAX_TICKET_ATTACHMENTS || sending}
                      className="min-h-11 rounded-xl cursor-pointer text-xs font-bold gap-1.5"
                    >
                      <Camera className="w-4 h-4 text-primary" aria-hidden="true" />
                      <span>แนบรูปเพิ่ม ({replyPhotos.length}/{MAX_TICKET_ATTACHMENTS})</span>
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
                      disabled={sending || !replyMessage.trim()}
                      className="min-h-11 rounded-xl cursor-pointer font-bold bg-primary hover:bg-primary/90 text-white gap-1.5"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                          <span>กำลังส่ง...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" aria-hidden="true" />
                          <span>ส่งข้อความ</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-100/70 p-4 text-center text-xs sm:text-sm text-slate-600">
                  เคสนี้ปิดการติดตามเรียบร้อยแล้ว
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Context Sidebar */}
        <div className="lg:col-span-4 space-y-5">
          <Card className="border-slate-200/90 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" aria-hidden="true" />
                <span>ข้อมูลอ้างอิง</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs sm:text-sm">
              <div>
                <span className="text-slate-500 block text-xs">คำสั่งซื้อ</span>
                {ticket.order ? (
                  <Link
                    href={`/dashboard/orders/${ticket.order.id}`}
                    className="font-mono font-bold text-primary hover:underline inline-flex items-center gap-1 mt-0.5"
                  >
                    <span>{ticket.order.order_number}</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                ) : (
                  <span className="font-bold text-slate-800">-</span>
                )}
              </div>

              <div>
                <span className="text-slate-500 block text-xs">เปิดเคสเมื่อ</span>
                <span className="font-medium text-slate-800">
                  {formatBangkokDateTime(ticket.created_at)}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-xs">อัปเดตล่าสุด</span>
                <span className="font-medium text-slate-800">
                  {formatBangkokDateTime(ticket.last_activity_at)}
                </span>
              </div>

              {ticket.order?.tracking_number && (
                <div>
                  <span className="text-slate-500 block text-xs">เลขพัสดุไทย</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {ticket.order.tracking_number}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-sky-200 bg-sky-50/60">
            <CardContent className="p-4 space-y-2 text-xs text-sky-950 leading-relaxed">
              <p className="font-bold">{COORDINATOR_SCOPE_NOTICE.title}</p>
              <p className="text-sky-900/90">{COORDINATOR_SCOPE_NOTICE.summary}</p>
              <Link
                href="/terms#section-6"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
              >
                <span>อ่านเงื่อนไขบริการ</span>
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

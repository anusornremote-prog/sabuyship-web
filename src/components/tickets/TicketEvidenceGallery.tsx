"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Camera, ExternalLink, Video, ZoomIn } from "lucide-react"

export interface SignedAttachmentItem {
  path: string
  signedUrl: string
}

export function TicketEvidenceGallery({
  evidence,
  videoUrl,
  title = "หลักฐานประกอบ",
}: {
  evidence: SignedAttachmentItem[]
  videoUrl?: string | null
  title?: string
}) {
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null)

  if (evidence.length === 0 && !videoUrl) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-5 text-center text-xs text-slate-500">
        ไม่มีรูปภาพหรือลิงก์วิดีโอแนบไว้ในส่วนนี้
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {evidence.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <Camera className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            <span>
              {title} ({evidence.length} รูป)
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {evidence.map((item, idx) => (
              <button
                key={item.path}
                type="button"
                onClick={() => setSelectedUrl(item.signedUrl)}
                aria-label={`ขยายดู${title} รูปที่ ${idx + 1}`}
                className="group relative aspect-square rounded-xl border border-slate-200 bg-slate-100 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
              >
                <img
                  src={item.signedUrl}
                  alt={`${title} รูปที่ ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
                <span className="absolute bottom-1.5 right-1.5 rounded-lg bg-slate-900/70 text-white p-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {videoUrl && (
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/70 px-3.5 py-2 text-xs font-bold text-indigo-900 transition-colors"
        >
          <Video className="w-4 h-4 text-indigo-600 shrink-0" aria-hidden="true" />
          <span>เปิดดูลิงก์วิดีโอหลักฐานภายนอก</span>
          <ExternalLink className="w-3.5 h-3.5 text-indigo-500 shrink-0" aria-hidden="true" />
        </a>
      )}

      <Dialog open={Boolean(selectedUrl)} onOpenChange={(open) => !open && setSelectedUrl(null)}>
        <DialogContent className="max-w-3xl max-h-[90dvh] flex flex-col p-4 sm:p-5 gap-3">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-base font-bold text-slate-900">{title}</DialogTitle>
          </DialogHeader>
          {selectedUrl && (
            <>
              <div className="flex-1 min-h-0 overflow-auto overscroll-contain flex items-center justify-center rounded-xl bg-slate-950/95 p-2">
                <img
                  src={selectedUrl}
                  alt="ภาพหลักฐานขยาย"
                  className="max-h-[68dvh] w-auto object-contain rounded"
                />
              </div>
              <div className="flex justify-end shrink-0">
                <a
                  href={selectedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <span>เปิดภาพเต็มในแท็บใหม่</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

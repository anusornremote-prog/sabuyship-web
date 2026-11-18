"use client"

import { formatBangkokDateTime } from "@/lib/date-format"
import { getTicketStatusMeta } from "@/lib/tickets"
import {
  TicketEvidenceGallery,
  type SignedAttachmentItem,
} from "@/components/tickets/TicketEvidenceGallery"
import { Lock, ShieldCheck, User, Workflow } from "lucide-react"

export interface TicketUpdateEntry {
  id: string
  author_role: "CUSTOMER" | "ADMIN" | "SYSTEM"
  author_name: string
  message: string
  is_internal: boolean
  status_from: string | null
  status_to: string | null
  created_at: string
  attachments: SignedAttachmentItem[]
}

export function TicketActivityFeed({ updates }: { updates: TicketUpdateEntry[] }) {
  if (updates.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center text-sm text-slate-500">
        ยังไม่มีความเคลื่อนไหวเพิ่มเติมในเคสนี้
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {updates.map((entry) => {
        const formattedTime = formatBangkokDateTime(entry.created_at)
        const nextStatusMeta = entry.status_to ? getTicketStatusMeta(entry.status_to) : null

        if (entry.author_role === "SYSTEM") {
          return (
            <div key={entry.id} className="flex flex-col items-center text-center py-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs text-slate-700">
                <Workflow className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                <span>{entry.message}</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1">{formattedTime}</span>
            </div>
          )
        }

        if (entry.is_internal) {
          return (
            <div
              key={entry.id}
              className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/80 p-4 space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" aria-hidden="true" />
                  <span>บันทึกภายในแอดมิน (ลูกค้าไม่เห็น)</span>
                </div>
                <span className="text-[11px] text-amber-800/80">{formattedTime}</span>
              </div>
              {nextStatusMeta && (
                <div className="text-[11px] font-bold text-amber-800">
                  เปลี่ยนสถานะเคส → {nextStatusMeta.label}
                </div>
              )}
              <p className="text-sm text-amber-950 whitespace-pre-wrap leading-relaxed">
                {entry.message}
              </p>
              {entry.attachments.length > 0 && (
                <TicketEvidenceGallery
                  evidence={entry.attachments}
                  title="ไฟล์แนบภายใน"
                />
              )}
            </div>
          )
        }

        const isAdmin = entry.author_role === "ADMIN"

        return (
          <div
            key={entry.id}
            className={`rounded-2xl border p-4 space-y-2.5 ${
              isAdmin
                ? "border-blue-200 bg-blue-50/60"
                : "border-slate-200 bg-white shadow-2xs"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${
                    isAdmin ? "bg-primary text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {isAdmin ? (
                    <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <User className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                </span>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900">
                    {entry.author_name}
                  </p>
                </div>
              </div>
              <span className="text-[11px] text-slate-500">{formattedTime}</span>
            </div>

            {nextStatusMeta && (
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                <span>อัปเดตสถานะเป็น:</span>
                <span className="text-primary">{nextStatusMeta.label}</span>
              </div>
            )}

            <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
              {entry.message}
            </p>

            {entry.attachments.length > 0 && (
              <TicketEvidenceGallery
                evidence={entry.attachments}
                title="รูปภาพเพิ่มเติม"
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

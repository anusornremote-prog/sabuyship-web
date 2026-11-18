"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TicketCategoryBadge, TicketStatusBadge } from "@/components/tickets/TicketBadges"
import { formatBangkokShortDate } from "@/lib/date-format"
import { isTicketOpen } from "@/lib/tickets"
import { AlertTriangle, ChevronRight, LifeBuoy } from "lucide-react"

interface OrderTicketItem {
  id: string
  ticket_number: string
  category: string
  subject: string
  status: string
  last_activity_at: string
}

export function AdminOrderTicketsCard({ orderId }: { orderId: string }) {
  const [tickets, setTickets] = useState<OrderTicketItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(`/api/admin/tickets?order_id=${encodeURIComponent(orderId)}`)
        if (res.ok) {
          const json = await res.json()
          if (!cancelled) {
            setTickets(Array.isArray(json.tickets) ? json.tickets : [])
          }
        }
      } catch (err) {
        console.error("Failed to fetch admin order tickets:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [orderId])

  const openTickets = tickets.filter((t) => isTicketOpen(t.status))

  return (
    <Card
      className={`shadow-sm ${
        openTickets.length > 0 ? "border-amber-300 bg-amber-50/30" : "border-slate-200"
      }`}
    >
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <LifeBuoy
              className={`w-5 h-5 ${openTickets.length > 0 ? "text-amber-600" : "text-primary"}`}
              aria-hidden="true"
            />
            <span>เคสประสานงานสินค้า</span>
          </CardTitle>
          {openTickets.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-900 px-2.5 py-0.5 text-xs font-extrabold">
              <AlertTriangle className="w-3 h-3" aria-hidden="true" />
              เปิดอยู่ {openTickets.length}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="h-14 rounded-xl bg-slate-100 animate-pulse" />
        ) : tickets.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-2">
            ไม่มีเคสแจ้งปัญหาสำหรับคำสั่งซื้อนี้
          </p>
        ) : (
          <div className="space-y-2.5">
            {openTickets.length > 0 && (
              <p className="text-xs font-semibold text-amber-900 bg-amber-100/80 border border-amber-200 rounded-lg px-3 py-2">
                คำสั่งซื้อนี้มีเคสรอประสานงาน กรุณาตรวจสอบก่อนปิดงานหรืออนุมัติขั้นตอนถัดไป
              </p>
            )}
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/admin/tickets/${ticket.id}`}
                className="block rounded-xl border border-slate-200 bg-white hover:border-primary/40 hover:bg-blue-50/30 p-3 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-xs font-extrabold text-primary">
                        {ticket.ticket_number}
                      </span>
                      <TicketStatusBadge status={ticket.status} />
                    </div>
                    <p className="text-xs font-bold text-slate-900 truncate">{ticket.subject}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <TicketCategoryBadge category={ticket.category} className="text-[10px] py-0" />
                      <span>{formatBangkokShortDate(ticket.last_activity_at)}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

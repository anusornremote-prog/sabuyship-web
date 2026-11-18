"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreateTicketModal } from "@/components/tickets/CreateTicketModal"
import { TicketCategoryBadge, TicketStatusBadge } from "@/components/tickets/TicketBadges"
import { formatBangkokShortDate } from "@/lib/date-format"
import { ChevronRight, LifeBuoy, PlusCircle } from "lucide-react"

interface OrderTicketSummary {
  id: string
  ticket_number: string
  category: string
  subject: string
  status: string
  last_activity_at: string
  created_at: string
}

export function OrderTicketsCard({
  orderId,
  orderNumber,
}: {
  orderId: string
  orderNumber: string
}) {
  const [tickets, setTickets] = useState<OrderTicketSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const loadOrderTickets = useCallback(async () => {
    try {
      const res = await fetch(`/api/tickets?order_id=${encodeURIComponent(orderId)}`)
      if (res.ok) {
        const data = await res.json()
        setTickets(Array.isArray(data.tickets) ? data.tickets : [])
      }
    } catch (err) {
      console.error("Failed to load order tickets:", err)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    loadOrderTickets()
  }, [loadOrderTickets])

  return (
    <>
      <Card className="shadow-sm border-slate-200/90">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <LifeBuoy className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              <span>แจ้งปัญหา / ประสานงานสินค้า</span>
            </CardTitle>
            {tickets.length > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {tickets.length} เคส
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-3.5">
          <p className="text-xs text-slate-600 leading-relaxed">
            พบสินค้าไม่ครบ ชำรุดระหว่างขนส่ง หรือไม่ตรงปก?{" "}
            <span className="font-semibold text-slate-800">
              ทีมงานพร้อมช่วยรวบรวมหลักฐานและประสานงานร้านค้าจีน/ขนส่งให้คุณอย่างเต็มที่
            </span>
          </p>

          <Button
            type="button"
            variant="outline"
            onClick={() => setModalOpen(true)}
            className="w-full min-h-11 rounded-xl border-primary/30 text-primary hover:bg-blue-50 hover:text-primary font-bold cursor-pointer gap-2"
          >
            <PlusCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>แจ้งปัญหา / ขอช่วยประสานงาน</span>
          </Button>

          {!loading && tickets.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                เคสของคำสั่งซื้อนี้
              </p>
              <div className="space-y-2">
                {tickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/dashboard/tickets/${ticket.id}`}
                    className="block rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50/40 hover:border-primary/30 p-3 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-800">
                            {ticket.ticket_number}
                          </span>
                          <TicketStatusBadge status={ticket.status} />
                        </div>
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {ticket.subject}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <TicketCategoryBadge category={ticket.category} className="text-[10px] py-0" />
                          <span>อัปเดต {formatBangkokShortDate(ticket.last_activity_at)}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" aria-hidden="true" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateTicketModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        orderId={orderId}
        orderNumber={orderNumber}
        onCreated={() => {
          loadOrderTickets()
        }}
      />
    </>
  )
}

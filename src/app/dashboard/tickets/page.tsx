"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { CreateTicketModal } from "@/components/tickets/CreateTicketModal"
import { TicketCategoryBadge, TicketStatusBadge } from "@/components/tickets/TicketBadges"
import { formatBangkokDateTime, formatBangkokShortDate } from "@/lib/date-format"
import { getCustomerOrderStatusText } from "@/lib/order-status"
import { COORDINATOR_SCOPE_NOTICE } from "@/lib/tickets"
import {
  ChevronRight,
  ExternalLink,
  Info,
  LifeBuoy,
  Loader2,
  Package,
  PlusCircle,
  RefreshCw,
} from "lucide-react"

interface PickableOrder {
  id: string
  order_number: string
  status: string
  created_at: string
}

interface CustomerTicketRow {
  id: string
  ticket_number: string
  order_id: string
  category: string
  subject: string
  status: string
  evidence_urls: string[]
  video_url: string | null
  last_activity_at: string
  created_at: string
  order: {
    id: string
    order_number: string
    status: string
  } | null
}

type StatusFilter = "ALL" | "OPEN" | "WAITING_CUSTOMER" | "RESOLVED"

const FILTER_TABS: Array<{ key: StatusFilter; label: string }> = [
  { key: "ALL", label: "ทั้งหมด" },
  { key: "OPEN", label: "กำลังติดตาม" },
  { key: "WAITING_CUSTOMER", label: "รอข้อมูลจากคุณ" },
  { key: "RESOLVED", label: "เสร็จสิ้น" },
]

export default function CustomerTicketsPage() {
  const [tickets, setTickets] = useState<CustomerTicketRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<StatusFilter>("ALL")
  const [error, setError] = useState<string | null>(null)
  const [orderPickerOpen, setOrderPickerOpen] = useState(false)
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [orders, setOrders] = useState<PickableOrder[]>([])
  const [selectedOrder, setSelectedOrder] = useState<{ id: string; order_number: string } | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const openOrderPicker = async () => {
    setOrderPickerOpen(true)
    setLoadingOrders(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from("orders")
        .select("id, order_number, status, created_at")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50)
      setOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Failed to fetch customer orders for ticket creation:", err)
    } finally {
      setLoadingOrders(false)
    }
  }

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/tickets")
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || "ไม่สามารถโหลดรายการเคสประสานงานได้")
      }
      setTickets(Array.isArray(data.tickets) ? data.tickets : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const filteredTickets = tickets.filter((ticket) => {
    if (filter === "ALL") return true
    if (filter === "OPEN") {
      return ["NEW", "IN_PROGRESS", "WAITING_CUSTOMER"].includes(ticket.status)
    }
    if (filter === "RESOLVED") {
      return ticket.status === "RESOLVED" || ticket.status === "CLOSED"
    }
    return ticket.status === filter
  })

  const waitingCustomerCount = tickets.filter((t) => t.status === "WAITING_CUSTOMER").length

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <LifeBuoy className="w-6 h-6 text-primary shrink-0" aria-hidden="true" />
            <span>ศูนย์ประสานงาน / แจ้งปัญหาสินค้า</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            ติดตามความคืบหน้าเคสที่ทีมงานกำลังช่วยประสานร้านค้าจีนและขนส่งให้คุณ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={fetchTickets}
            disabled={loading}
            className="min-h-11 rounded-xl cursor-pointer gap-1.5 font-semibold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
            <span>รีเฟรช</span>
          </Button>
          <Button
            type="button"
            onClick={openOrderPicker}
            className="min-h-11 rounded-xl cursor-pointer font-bold bg-primary hover:bg-primary/90 text-white gap-1.5"
          >
            <PlusCircle className="w-4 h-4" aria-hidden="true" />
            <span>เปิดเคสใหม่</span>
          </Button>
        </div>
      </div>

      {/* Policy Clarification Banner */}
      <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-xs sm:text-sm text-sky-950 leading-relaxed space-y-1">
          <p className="font-bold">{COORDINATOR_SCOPE_NOTICE.title}</p>
          <p className="text-sky-900/90">{COORDINATOR_SCOPE_NOTICE.summary}</p>
          <Link
            href="/terms#section-6"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            <span>ดูขอบเขตการประสานงาน (เงื่อนไขข้อ 6)</span>
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="กรองสถานะเคส">
        {FILTER_TABS.map((tab) => {
          const active = filter === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(tab.key)}
              className={`min-h-11 px-4 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer inline-flex items-center gap-2 ${
                active
                  ? "bg-primary text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>{tab.label}</span>
              {tab.key === "WAITING_CUSTOMER" && waitingCustomerCount > 0 && (
                <span
                  className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                    active ? "bg-white text-primary" : "bg-orange-500 text-white"
                  }`}
                >
                  {waitingCustomerCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Ticket List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-white border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <Card className="border-rose-200 bg-rose-50/70">
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-sm font-bold text-rose-800">{error}</p>
            <Button
              type="button"
              variant="outline"
              onClick={fetchTickets}
              className="min-h-11 rounded-xl cursor-pointer"
            >
              ลองใหม่อีกครั้ง
            </Button>
          </CardContent>
        </Card>
      ) : filteredTickets.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="p-8 sm:p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-primary flex items-center justify-center mx-auto">
              <LifeBuoy className="w-6 h-6" aria-hidden="true" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              {tickets.length === 0
                ? "ยังไม่มีเคสขอประสานงานในระบบ"
                : "ไม่มีเคสในสถานะที่เลือก"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              หากคำสั่งซื้อใดพบสินค้าขาด ชำรุด หรือไม่ตรงปก สามารถเข้าไปที่หน้ารายละเอียดคำสั่งซื้อแล้วกดปุ่ม
              {" "}"แจ้งปัญหา / ขอช่วยประสานงาน" ได้ทันที
            </p>
            <div className="pt-2">
              <Link href="/dashboard/orders">
                <Button className="min-h-11 rounded-xl cursor-pointer font-bold">
                  ไปหน้าคำสั่งซื้อของฉัน
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/dashboard/tickets/${ticket.id}`}
              className="block group"
            >
              <Card className="border-slate-200/90 hover:border-primary/40 hover:shadow-md transition-all">
                <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs sm:text-sm font-extrabold text-primary">
                        {ticket.ticket_number}
                      </span>
                      <TicketStatusBadge status={ticket.status} />
                      <TicketCategoryBadge category={ticket.category} />
                    </div>

                    <h2 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-primary transition-colors">
                      {ticket.subject}
                    </h2>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>
                        ออเดอร์:{" "}
                        <strong className="font-mono text-slate-700">
                          {ticket.order?.order_number || "-"}
                        </strong>
                      </span>
                      <span>
                        อัปเดตล่าสุด: {formatBangkokDateTime(ticket.last_activity_at)}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1 text-xs font-bold text-slate-400 group-hover:text-primary mt-1">
                    <span className="hidden sm:inline">ดูความคืบหน้า</span>
                    <ChevronRight className="w-5 h-5" aria-hidden="true" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Order Picker Dialog for direct ticket creation */}
      <Dialog open={orderPickerOpen} onOpenChange={setOrderPickerOpen}>
        <DialogContent className="max-w-lg max-h-[85dvh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
            <DialogTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" aria-hidden="true" />
              <span>เลือกคำสั่งซื้อที่ต้องการแจ้งปัญหา</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              แตะเลือกคำสั่งซื้อที่พบปัญหา เพื่อกรอกรายละเอียดและแนบหลักฐาน
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y p-4 space-y-2.5">
            {loadingOrders ? (
              <div className="py-10 text-center text-slate-500 flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" aria-hidden="true" />
                <span className="text-xs font-medium">กำลังโหลดรายการคำสั่งซื้อ...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <p className="text-sm font-bold text-slate-700">ยังไม่มีคำสั่งซื้อในระบบ</p>
                <p className="text-xs text-slate-500">
                  เมื่อมีคำสั่งซื้อแล้ว คุณสามารถเปิดเคสประสานงานได้ทันทีจากหน้านี้
                </p>
              </div>
            ) : (
              orders.map((ord) => (
                <button
                  key={ord.id}
                  type="button"
                  onClick={() => {
                    setSelectedOrder({ id: ord.id, order_number: ord.order_number })
                    setOrderPickerOpen(false)
                    setCreateModalOpen(true)
                  }}
                  className="w-full min-h-14 text-left rounded-xl border border-slate-200 bg-white hover:border-primary/40 hover:bg-blue-50/40 p-3.5 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="font-mono text-sm font-extrabold text-primary">
                      {ord.order_number}
                    </div>
                    <div className="text-xs text-slate-600">
                      {getCustomerOrderStatusText(ord.status)} · สร้างเมื่อ{" "}
                      {formatBangkokShortDate(ord.created_at)}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {selectedOrder && (
        <CreateTicketModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          orderId={selectedOrder.id}
          orderNumber={selectedOrder.order_number}
          onCreated={() => {
            fetchTickets()
          }}
        />
      )}
    </div>
  )
}

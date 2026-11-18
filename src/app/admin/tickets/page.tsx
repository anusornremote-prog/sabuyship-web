"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TicketCategoryBadge, TicketStatusBadge } from "@/components/tickets/TicketBadges"
import { formatBangkokDateTime } from "@/lib/date-format"
import { TICKET_CATEGORIES, TICKET_CATEGORY_META } from "@/lib/tickets"
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Inbox,
  LifeBuoy,
  RefreshCw,
  Search,
  X,
} from "lucide-react"

interface AdminTicketRow {
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
  customer: {
    id: string
    full_name: string | null
    display_name: string
    customer_code: string | null
    phone: string | null
  } | null
}

interface TicketCounts {
  ALL: number
  OPEN: number
  NEW: number
  IN_PROGRESS: number
  WAITING_CUSTOMER: number
  RESOLVED: number
  CLOSED: number
}

const STATUS_TABS = [
  { key: "OPEN", label: "เคสที่ต้องติดตาม" },
  { key: "ALL", label: "ทั้งหมด" },
  { key: "NEW", label: "เปิดเคสใหม่" },
  { key: "IN_PROGRESS", label: "กำลังประสานงาน" },
  { key: "WAITING_CUSTOMER", label: "รอลูกค้าตอบ" },
  { key: "RESOLVED", label: "เสร็จสิ้น" },
  { key: "CLOSED", label: "ปิดเคส" },
] as const

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<AdminTicketRow[]>([])
  const [counts, setCounts] = useState<TicketCounts>({
    ALL: 0,
    OPEN: 0,
    NEW: 0,
    IN_PROGRESS: 0,
    WAITING_CUSTOMER: 0,
    RESOLVED: 0,
    CLOSED: 0,
  })
  const [statusFilter, setStatusFilter] = useState<string>("OPEN")
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTickets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams()
      if (statusFilter) qs.set("status", statusFilter)
      if (categoryFilter && categoryFilter !== "ALL") qs.set("category", categoryFilter)
      if (searchQuery.trim()) qs.set("q", searchQuery.trim())

      const res = await fetch(`/api/admin/tickets?${qs.toString()}`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.error || "ไม่สามารถโหลดรายการเคสประสานงานได้")
      }
      setTickets(Array.isArray(json.tickets) ? json.tickets : [])
      if (json.counts) setCounts(json.counts)
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด")
    } finally {
      setLoading(false)
    }
  }, [statusFilter, categoryFilter, searchQuery])

  useEffect(() => {
    const timer = window.setTimeout(loadTickets, 180)
    return () => window.clearTimeout(timer)
  }, [loadTickets])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <LifeBuoy className="w-6 h-6 text-primary shrink-0" aria-hidden="true" />
            <span>จัดการเคสประสานงานสินค้า (Support Tickets)</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            ศูนย์ติดตามปัญหาของหาย เสียหาย หรือสินค้าไม่ตรงปก เพื่อช่วยประสานงานร้านค้าจีนและขนส่งอย่างเต็มที่
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={loadTickets}
          disabled={loading}
          className="min-h-11 rounded-xl cursor-pointer gap-1.5 font-bold bg-white"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
          <span>รีเฟรช</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-sky-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">เปิดเคสใหม่ (NEW)</p>
              <p className="text-2xl font-black text-sky-700 mt-1">{counts.NEW}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Inbox className="w-5 h-5" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">กำลังประสานงาน</p>
              <p className="text-2xl font-black text-amber-700 mt-1">{counts.IN_PROGRESS}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">รอลูกค้าตอบ</p>
              <p className="text-2xl font-black text-orange-700 mt-1">{counts.WAITING_CUSTOMER}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">เสร็จสิ้น / ปิดเคส</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">
                {counts.RESOLVED + counts.CLOSED}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="border-slate-200">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="กรองตามสถานะเคส">
            {STATUS_TABS.map((tab) => {
              const active = statusFilter === tab.key
              const tabCount = counts[tab.key as keyof TicketCounts] ?? 0
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`min-h-10 px-3.5 rounded-xl text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                    active
                      ? "bg-primary text-white shadow-2xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      active ? "bg-white/20 text-white" : "bg-white text-slate-600"
                    }`}
                  >
                    {tabCount}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาเลขเคส, เลขออเดอร์, รหัสลูกค้า, ชื่อลูกค้า หรือหัวข้อปัญหา..."
                aria-label="ค้นหาเคสประสานงาน"
                className="h-11 pl-10 pr-10 rounded-xl bg-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="ล้างคำค้นหา"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="กรองตามประเภทปัญหา"
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:w-64"
            >
              <option value="ALL">ทุกประเภทปัญหา</option>
              {TICKET_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {TICKET_CATEGORY_META[cat].label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Queue List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-white border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <Card className="border-rose-200 bg-rose-50/70">
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-sm font-bold text-rose-800">{error}</p>
            <Button type="button" variant="outline" onClick={loadTickets} className="min-h-11">
              ลองใหม่อีกครั้ง
            </Button>
          </CardContent>
        </Card>
      ) : tickets.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="p-10 text-center space-y-2">
            <LifeBuoy className="w-8 h-8 text-slate-400 mx-auto" aria-hidden="true" />
            <p className="text-sm font-bold text-slate-700">ไม่พบเคสตามตัวกรองที่เลือก</p>
            <p className="text-xs text-slate-500">
              ลองเปลี่ยนแท็บสถานะหรือล้างคำค้นหาเพื่อดูรายการทั้งหมด
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <Card className="hidden md:block border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                  <tr>
                    <th className="px-4 py-3">เลขเคส / ออเดอร์</th>
                    <th className="px-4 py-3">ลูกค้า</th>
                    <th className="px-4 py-3">ประเภท / หัวข้อ</th>
                    <th className="px-4 py-3">สถานะ</th>
                    <th className="px-4 py-3">อัปเดตล่าสุด</th>
                    <th className="px-4 py-3 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 align-top whitespace-nowrap">
                        <div className="font-mono font-extrabold text-primary">
                          {ticket.ticket_number}
                        </div>
                        <div className="text-xs font-mono text-slate-500 mt-0.5">
                          {ticket.order?.order_number || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        <div className="font-semibold text-slate-900">
                          {ticket.customer?.display_name || "ลูกค้า"}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          {ticket.customer?.customer_code || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-top max-w-md">
                        <TicketCategoryBadge category={ticket.category} />
                        <p className="font-semibold text-slate-800 mt-1 line-clamp-2">
                          {ticket.subject}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 align-top whitespace-nowrap">
                        <TicketStatusBadge status={ticket.status} />
                      </td>
                      <td className="px-4 py-3.5 align-top whitespace-nowrap text-xs text-slate-500">
                        {formatBangkokDateTime(ticket.last_activity_at)}
                      </td>
                      <td className="px-4 py-3.5 align-top text-right whitespace-nowrap">
                        <Link href={`/admin/tickets/${ticket.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="min-h-10 rounded-xl font-bold cursor-pointer gap-1"
                          >
                            <span>เปิดจัดการ</span>
                            <ChevronRight className="w-4 h-4" aria-hidden="true" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/admin/tickets/${ticket.id}`}
                className="block"
              >
                <Card className="border-slate-200 hover:border-primary/40 transition-colors">
                  <CardContent className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span className="font-mono text-xs font-extrabold text-primary block">
                          {ticket.ticket_number}
                        </span>
                        <TicketStatusBadge status={ticket.status} />
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">
                        {ticket.order?.order_number || "-"}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-slate-900">{ticket.subject}</p>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-1 border-t border-slate-100">
                      <span>
                        {ticket.customer?.display_name || "ลูกค้า"}{" "}
                        {ticket.customer?.customer_code ? `(${ticket.customer.customer_code})` : ""}
                      </span>
                      <TicketCategoryBadge category={ticket.category} className="text-[10px]" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Truck, Loader2, Package, Clock, CheckCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { TrackingUpdateModal } from "./TrackingUpdateModal"

const STATUS_CONFIG: Record<string, { label: string, color: string, icon: any }> = {
  SHIPPING: { label: "กำลังจัดส่งมาไทย", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Truck },
  ARRIVED: { label: "ถึงโกดังไทยแล้ว", color: "bg-purple-100 text-purple-700 border-purple-200", icon: Package },
  DELIVERED: { label: "จัดส่งแล้ว", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle }
}

export default function AdminTrackingPage() {
  const supabase = createClient()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          profiles:customer_id(full_name, phone)
        `)
        .in('status', ['SHIPPING', 'ARRIVED', 'DELIVERED'])
        .order("created_at", { ascending: false })

      if (error) throw error

      setOrders(data || [])
    } catch (error) {
      console.error("Error fetching tracking orders:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const filteredOrders = orders.filter(order => {
    const searchLower = searchQuery.toLowerCase()
    return (
      (order.order_number?.toLowerCase() || "").includes(searchLower) ||
      (order.profiles?.full_name?.toLowerCase() || "").includes(searchLower) ||
      (order.tracking_number?.toLowerCase() || "").includes(searchLower)
    )
  })

  const openUpdateModal = (order: any) => {
    setSelectedOrder(order)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary" />
            จัดการ Tracking & สถานะการจัดส่ง
          </h1>
          <p className="text-slate-500 mt-1">อัปเดตสถานะพัสดุและแจ้งเลขพัสดุในไทยให้ลูกค้า</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4 bg-white flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="ค้นหา รหัสออเดอร์, ชื่อลูกค้า, หรือหมายเลขพัสดุ..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
              <p>กำลังโหลดข้อมูลพัสดุ...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-4 font-semibold">ออเดอร์</th>
                    <th className="px-6 py-4 font-semibold">ลูกค้า</th>
                    <th className="px-6 py-4 font-semibold">สถานะการขนส่ง</th>
                    <th className="px-6 py-4 font-semibold">บริษัทขนส่ง</th>
                    <th className="px-6 py-4 font-semibold">เลขพัสดุ (Tracking)</th>
                    <th className="px-6 py-4 font-semibold text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => {
                      const statusConfig = STATUS_CONFIG[order.status] || { label: order.status, color: "bg-slate-100 text-slate-700 border-slate-200", icon: Clock }
                      const StatusIcon = statusConfig.icon
                      
                      return (
                        <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                              {order.order_number}
                            </span>
                            <div className="text-xs text-slate-500 mt-1">
                              {new Date(order.created_at).toLocaleDateString('th-TH')}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-800">{order.profiles?.full_name || "ไม่มีชื่อ"}</p>
                            <p className="text-xs text-slate-500">{order.profiles?.phone || "-"}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig.color}`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-medium">
                            {order.shipping_company || "-"}
                          </td>
                          <td className="px-6 py-4">
                            {order.tracking_number ? (
                              <span className="font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                                {order.tracking_number}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs italic">ยังไม่ระบุ</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Button size="sm" onClick={() => openUpdateModal(order)} className="w-full max-w-[120px]">
                              อัปเดตสถานะ
                            </Button>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Truck className="w-8 h-8 opacity-20" />
                          <p>ไม่พบรายการที่กำลังจัดส่ง</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {modalOpen && (
        <TrackingUpdateModal 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)} 
          order={selectedOrder} 
          onSuccess={fetchOrders} 
        />
      )}
    </div>
  )
}

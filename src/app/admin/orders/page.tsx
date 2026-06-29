"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Eye, MapPin, X, Loader2, FileText, PackagePlus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { PaymentApprovalModal } from "./PaymentApprovalModal"
import { WalletDeductModal } from "../wallet/WalletDeductModal"

export default function AdminOrders() {
  const supabase = createClient()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  
  // Status update modal states
  const [editingOrder, setEditingOrder] = useState<any | null>(null)
  const [newStatus, setNewStatus] = useState("")
  const [trackingNotes, setTrackingNotes] = useState("")
  const [updating, setUpdating] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  // Payment Modal states
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)

  // Wallet Deduct states
  const [deductModalOpen, setDeductModalOpen] = useState(false)
  const [selectedDeductOrder, setSelectedDeductOrder] = useState<any>(null)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          status,
          created_at,
          customer_id,
          customer:customer_id (
            id,
            full_name,
            phone,
            wallet_balance
          ),
          address:shipping_address_id (
            address_line,
            subdistrict,
            district,
            province,
            postalCode
          ),
          quotation:quotation_id (
            total_price
          ),
          payments (
            id,
            amount,
            payment_date,
            slip_url,
            status
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (err: any) {
      console.error("Error fetching orders:", err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleOpenPaymentModal = (order: any, payment: any) => {
    setSelectedPayment({ ...payment, order })
    setPaymentModalOpen(true)
  }

  const handleOpenStatusModal = (order: any) => {
    setEditingOrder(order)
    setNewStatus(order.status)
    setTrackingNotes("")
    setSuccessMsg("")
    setErrorMsg("")
  }

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingOrder) return

    try {
      setUpdating(true)
      setErrorMsg("")
      setSuccessMsg("")

      // 1. Update order status
      const { error: orderError } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", editingOrder.id)

      if (orderError) throw orderError

      // 2. Insert tracking log
      const { error: logError } = await supabase
        .from("tracking_logs")
        .insert({
          order_id: editingOrder.id,
          status: newStatus,
          notes: trackingNotes || `อัปเดตสถานะเป็น: ${getStatusText(newStatus)}`
        })

      if (logError) throw logError

      setSuccessMsg("อัปเดตสถานะสำเร็จเรียบร้อยแล้ว!")
      
      // Refresh the orders list
      await fetchOrders()

      // Close modal after delay
      setTimeout(() => {
        setEditingOrder(null)
      }, 1500)
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการอัปเดต")
    } finally {
      setUpdating(false)
    }
  }

  const handleManualPayment = async (order: any) => {
    if (!confirm(`ยืนยันการรับชำระเงินสำหรับออเดอร์ ${order.order_number} (ผ่านช่องทางอื่น ไม่หัก Wallet)?`)) return

    try {
      setLoading(true)
      
      const { error: orderError } = await supabase
        .from("orders")
        .update({ status: 'PAID' })
        .eq("id", order.id)

      if (orderError) throw orderError

      const { error: logError } = await supabase
        .from("tracking_logs")
        .insert({
          order_id: order.id,
          status: 'PAID',
          notes: 'ยืนยันรับชำระเงินแล้ว (ผ่านช่องทางอื่น/โอนตรง)'
        })

      if (logError) throw logError

      alert("อัปเดตสถานะการชำระเงินสำเร็จ!")
      fetchOrders()
    } catch (err: any) {
      alert(err.message || "เกิดข้อผิดพลาดในการอัปเดต")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-100 text-blue-800'
      case 'WAITING_PAYMENT': return 'bg-amber-100 text-amber-800'
      case 'PAID': return 'bg-green-100 text-green-800'
      case 'CHINA_WAREHOUSE': return 'bg-purple-100 text-purple-800'
      case 'SHIPPING': return 'bg-sky-100 text-sky-800'
      case 'THAILAND_WAREHOUSE': return 'bg-teal-100 text-teal-800'
      case 'DELIVERED': return 'bg-emerald-100 text-emerald-800'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'NEW': return 'รอดำเนินการ (NEW)'
      case 'WAITING_PAYMENT': return 'รอชำระเงิน (WAITING PAYMENT)'
      case 'PAID': return 'ชำระเงินแล้ว (PAID)'
      case 'ORDERED': return 'สั่งซื้อสำเร็จ (ORDERED)'
      case 'CHINA_WAREHOUSE': return 'ถึงโกดังจีน (CHINA WAREHOUSE)'
      case 'SHIPPING': return 'อยู่ระหว่างส่งมาไทย (SHIPPING)'
      case 'THAILAND_WAREHOUSE': return 'ถึงโกดังไทย (THAILAND WAREHOUSE)'
      case 'OUT_FOR_DELIVERY': return 'กำลังนำจ่าย (OUT FOR DELIVERY)'
      case 'DELIVERED': return 'จัดส่งสำเร็จ (DELIVERED)'
      default: return status
    }
  }

  // Filter orders client-side
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customer?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === "ALL" || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">จัดการคำสั่งซื้อ (Orders)</h1>
          <p className="text-slate-600">ตรวจสอบและอัปเดตสถานะคำสั่งซื้อพัสดุทั้งหมด</p>
        </div>
        <Link href="/admin/orders/new">
          <Button className="bg-primary hover:bg-primary/90 text-white shadow-sm flex items-center gap-2">
            <PackagePlus className="w-4 h-4" />
            สร้างออเดอร์ (Manual)
          </Button>
        </Link>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4 border-b bg-slate-50/50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
             <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
             <Input 
               placeholder="ค้นหา Order ID, ชื่อลูกค้า..." 
               className="pl-9" 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
          </div>
          <select 
            className="flex h-10 w-full sm:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">สถานะทั้งหมด</option>
            <option value="NEW">NEW (รอดำเนินการ)</option>
            <option value="WAITING_PAYMENT">WAITING_PAYMENT (รอชำระเงิน)</option>
            <option value="PAID">PAID (ชำระเงินแล้ว)</option>
            <option value="CHINA_WAREHOUSE">CHINA_WAREHOUSE (ถึงโกดังจีน)</option>
            <option value="SHIPPING">SHIPPING (กำลังส่งมาไทย)</option>
            <option value="THAILAND_WAREHOUSE">THAILAND_WAREHOUSE (ถึงโกดังไทย)</option>
            <option value="DELIVERED">DELIVERED (จัดส่งสำเร็จ)</option>
          </select>
        </CardContent>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium">Order ID</th>
                  <th className="px-6 py-4 font-medium">ลูกค้า</th>
                  <th className="px-6 py-4 font-medium">ยอดชำระ</th>
                  <th className="px-6 py-4 font-medium">สถานะล่าสุด</th>
                  <th className="px-6 py-4 font-medium text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      <div className="flex justify-center items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span>กำลังโหลดข้อมูลคำสั่งซื้อ...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-primary">{order.order_number}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{order.customer?.full_name || '-'}</p>
                        <p className="text-xs text-slate-500 mb-1">{order.customer?.phone || '-'}</p>
                        {order.address && (
                          <div className="text-[11px] text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-100 max-w-[200px] line-clamp-2" title={`${order.address.address_line} ต.${order.address.subdistrict} อ.${order.address.district} จ.${order.address.province} ${order.address.postalCode}`}>
                            <MapPin className="inline w-3 h-3 mr-1 text-slate-400" />
                            {order.address.province} {order.address.postalCode}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">
                          {order.quotation?.total_price !== undefined 
                            ? `฿ ${Number(order.quotation.total_price).toLocaleString('th-TH', { minimumFractionDigits: 2 })}` 
                            : '-'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded ${getStatusBadge(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                        <p className="text-xs text-slate-500 mt-1">
                          อัปเดต: {order.created_at ? new Date(order.created_at).toLocaleDateString('th-TH') : '-'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right space-y-2">
                        {order.payments?.some((p: any) => p.status === 'PENDING') && (
                          <Button 
                            size="sm" 
                            onClick={() => handleOpenPaymentModal(order, order.payments.find((p: any) => p.status === 'PENDING'))}
                            className="bg-amber-500 hover:bg-amber-600 w-full max-w-[120px] mb-2"
                          >
                            ตรวจสลิป
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-orange-600 border-orange-200 hover:bg-orange-50 cursor-pointer w-full max-w-[120px] mb-2"
                          onClick={() => handleOpenStatusModal(order)}
                        >
                          <MapPin className="h-4 w-4 mr-1" />
                          อัปเดตสถานะ
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedDeductOrder(order)
                            setDeductModalOpen(true)
                          }}
                          className="text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer w-full max-w-[120px] mb-2"
                        >
                          หัก Wallet
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleManualPayment(order)}
                          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 cursor-pointer w-full max-w-[120px] mb-2"
                        >
                          รับเงิน (โอนตรง)
                        </Button>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" className="cursor-pointer" asChild>
                            <Link href={`/dashboard/orders/${order.id}/invoice`} target="_blank" title="เอกสาร Invoice/Receipt">
                              <FileText className="h-4 w-4 text-blue-500" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" className="cursor-pointer" asChild>
                            <Link href={`/dashboard/orders/${order.order_number}`} target="_blank" title="ดูรายละเอียด">
                              <Eye className="h-4 w-4 text-slate-500 hover:text-slate-900" />
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      ไม่พบข้อมูลคำสั่งซื้อที่ค้นหา
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Approval Modal */}
      <PaymentApprovalModal 
        isOpen={paymentModalOpen} 
        onClose={() => setPaymentModalOpen(false)} 
        payment={selectedPayment} 
        order={selectedPayment?.order}
        onSuccess={() => {
          setPaymentModalOpen(false)
          fetchOrders()
        }}
      />

      {/* Wallet Deduct Modal */}
      <WalletDeductModal 
        isOpen={deductModalOpen}
        onClose={() => setDeductModalOpen(false)}
        customer={selectedDeductOrder?.customer || null}
        referenceId={selectedDeductOrder?.order_number}
        defaultAmount={selectedDeductOrder?.quotation?.total_price || 0}
        defaultDescription={`หักค่าสินค้า ออเดอร์ ${selectedDeductOrder?.order_number || ''}`}
        onSuccess={() => {
          setDeductModalOpen(false)
          fetchOrders()
        }}
      />

      {/* Status Update Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl bg-white border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-900">อัปเดตสถานะสินค้า</h3>
                <p className="text-xs text-slate-500">คำสั่งซื้อ: {editingOrder.order_number}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setEditingOrder(null)}
                className="text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <form onSubmit={handleUpdateStatus}>
              <CardContent className="p-6 space-y-4">
                {successMsg && (
                  <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg font-medium border border-green-200">
                    {successMsg}
                  </div>
                )}
                {errorMsg && (
                  <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg font-medium border border-red-200">
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">เลือกสถานะใหม่ *</label>
                  <select 
                    required
                    className="flex h-11 w-full rounded-lg border border-slate-200 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="NEW">NEW (รอดำเนินการ)</option>
                    <option value="WAITING_PAYMENT">WAITING_PAYMENT (รอชำระเงิน)</option>
                    <option value="PAID">PAID (ชำระเงินแล้ว)</option>
                    <option value="CHINA_WAREHOUSE">CHINA_WAREHOUSE (ถึงโกดังจีน)</option>
                    <option value="SHIPPING">SHIPPING (อยู่ระหว่างส่งมาไทย)</option>
                    <option value="THAILAND_WAREHOUSE">THAILAND_WAREHOUSE (ถึงโกดังไทย)</option>
                    <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY (อยู่ระหว่างนำจ่าย)</option>
                    <option value="DELIVERED">DELIVERED (จัดส่งสำเร็จ)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">บันทึกประวัติ (Tracking Note)</label>
                  <textarea 
                    className="flex min-h-[100px] w-full rounded-lg border border-slate-200 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-slate-400"
                    placeholder="ใส่บันทึกรายละเอียดขนส่ง เช่น 'ตู้สินค้าขึ้นเรือจากกวางโจวแล้ว' หรือ 'พัสดุถึงจุดแยกปทุมธานี'"
                    value={trackingNotes}
                    onChange={(e) => setTrackingNotes(e.target.value)}
                  />
                </div>
              </CardContent>

              <div className="flex gap-3 justify-end p-4 bg-slate-50 border-t border-slate-100 rounded-b-xl">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingOrder(null)}
                  disabled={updating}
                  className="cursor-pointer"
                >
                  ยกเลิก
                </Button>
                <Button 
                  type="submit" 
                  variant="orange" 
                  disabled={updating}
                  className="cursor-pointer"
                >
                  {updating ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>กำลังบันทึก...</span>
                    </div>
                  ) : "บันทึกการอัปเดต"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}

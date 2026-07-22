"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Eye, MapPin, X, Loader2, FileText, PackagePlus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import * as XLSX from "xlsx"
import { PaymentApprovalModal } from "./PaymentApprovalModal"
import { QuoteModal } from "./QuoteModal"
import { sendCustomerNotification } from "@/lib/notify"

export default function AdminOrders() {
  const supabase = createClient()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  
  // Status update modal states
  const [editingOrder, setEditingOrder] = useState<any | null>(null)
  const [newStatus, setNewStatus] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [trackingNotes, setTrackingNotes] = useState("")
  const [updating, setUpdating] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  // Payment Modal states
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)

  // Quote Modal states
  const [quoteModalOpen, setQuoteModalOpen] = useState(false)
  const [quoteOrder, setQuoteOrder] = useState<any>(null)
  const [quoteRound, setQuoteRound] = useState<2 | 3>(2)

  const ITEMS_PER_PAGE = 20
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from("orders")
        .select(`
          id,
          order_number,
          status,
          created_at,
          payment_round_1_status,
          payment_round_2_status,
          payment_round_3_status,
          customer_id,
          customer:customer_id (
            id,
            full_name,
            phone,
            wallet_balance,
            customer_code
          ),
          address:shipping_address_id (
            address_line,
            subdistrict,
            district,
            province,
            postal_code
          ),
          quotation:quotation_id (
            total_price,
            inquiry:inquiry_id (
              id,
              shipping_type,
              items
            )
          ),
          payments (
            id,
            amount,
            payment_date,
            slip_url,
            status
          )
        `, { count: 'exact' })

      if (statusFilter !== "ALL") {
        query = query.eq("status", statusFilter)
      }

      if (searchQuery) {
        query = query.ilike("order_number", `%${searchQuery}%`)
      }

      const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1)

      if (error) throw error
      setOrders(data || [])
      setTotalCount(count || 0)
    } catch (err: any) {
      console.error("Error fetching orders:", err.message)
    } finally {
      setLoading(false)
    }
  }

  // Re-fetch when page, search, or filter changes
  useEffect(() => {
    fetchOrders()
  }, [currentPage, statusFilter]) // We don't auto-fetch on searchQuery to avoid spam, we rely on a submit or debounce if needed. Wait, we should fetch on search. 
  // Let's add a debounced search later, or just fetch on Enter/Search button. For now, fetch when search is applied.

  const handleExport = async () => {
    if (selectedOrderIds.length === 0) {
      alert("กรุณาติ๊กเลือกออเดอร์ที่ต้องการส่งออก (Export) อย่างน้อย 1 รายการ")
      return
    }

    try {
      let query = supabase
        .from("orders")
        .select(`
          order_number,
          status,
          created_at,
          payment_round_1_status,
          payment_round_2_status,
          payment_round_3_status,
          customer:customer_id (
            full_name,
            customer_code
          ),
          quotation:quotation_id (
            total_price,
            inquiry:inquiry_id (
              shipping_type
            )
          )
        `)
        .in("id", selectedOrderIds)
        
      const { data, error } = await query.order("created_at", { ascending: false })
      if (error) throw error

      if (!data || data.length === 0) {
        alert("ไม่มีข้อมูลสำหรับส่งออก")
        return
      }

      const exportData = data.map(order => {
        const shippingType = order.quotation?.inquiry?.shipping_type === "CAR" ? "(EK)" : order.quotation?.inquiry?.shipping_type === "BOAT" ? "(SEA)" : ""
        const customerCode = order.customer?.customer_code ? `${order.customer.customer_code} ${shippingType}`.trim() : `ไม่ระบุ ${shippingType}`.trim()

        return {
          "วันที่สั่งซื้อ": new Date(order.created_at).toLocaleString('th-TH'),
          "เลขออเดอร์": order.order_number,
          "รหัสลูกค้า": customerCode,
          "ชื่อลูกค้า": order.customer?.full_name || "ไม่ระบุ",
          "สถานะ": getStatusText(order.status, order),
          "ยอดรวมสุทธิ (บาท)": order.quotation?.total_price || 0,
          "ชำระรอบ 1": order.payment_round_1_status === 'PAID' ? 'จ่ายแล้ว' : order.payment_round_1_status,
          "ชำระรอบ 2": order.payment_round_2_status === 'PAID' ? 'จ่ายแล้ว' : order.payment_round_2_status,
          "ชำระรอบ 3": order.payment_round_3_status === 'PAID' ? 'จ่ายแล้ว' : order.payment_round_3_status,
        }
      })

      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Orders")
      
      const fileName = `sabuyship-orders-${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(workbook, fileName)
      
    } catch (err: any) {
      console.error("Export error:", err.message)
      alert("เกิดข้อผิดพลาดในการส่งออกไฟล์")
    }
  }


  const handleOpenPaymentModal = (order: any, payment: any) => {
    setSelectedPayment({ ...payment, order })
    setPaymentModalOpen(true)
  }

  const handleOpenQuoteModal = (order: any, round: 2 | 3) => {
    setQuoteOrder(order)
    setQuoteRound(round)
    setQuoteModalOpen(true)
  }

  const handleArrivedInThailand = async (order: any) => {
    if (order.shipping_company === "รับสินค้าด้วยตัวเองที่โกดัง") {
      if (!confirm(`ออเดอร์ ${order.order_number} เลือกร้านมารับเอง ยืนยันเปลี่ยนสถานะเป็นถึงโกดังไทย? (จะไม่มีการเรียกเก็บเงินรอบ 3)`)) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/order/${order.id}/quote-round-3`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shipping_cost_th_th: 0 })
        });
        if (!res.ok) throw new Error("Failed to update status");
        
        if (order.customer_id) {
          await sendCustomerNotification(order.customer_id, `📦 อัปเดตสถานะออเดอร์ ${order.order_number}: พัสดุถึงโกดังไทยเรียบร้อยแล้วค่ะ`);
        }
        
        alert("อัปเดตสถานะสำเร็จ");
        fetchOrders();
      } catch (err: any) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    } else if (order.shipping_company === "จัดส่งแบบเหมาจ่าย(เฉพาะกรุงเทพและปริมณฑล)") {
      if (!confirm(`ออเดอร์ ${order.order_number} เลือกจัดส่งแบบเหมาจ่าย ยืนยันเปลี่ยนสถานะเป็นถึงโกดังไทยและคิดค่าจัดส่ง 200 บาท?`)) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/order/${order.id}/quote-round-3`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shipping_cost_th_th: 200 })
        });
        if (!res.ok) throw new Error("Failed to update status");
        alert("อัปเดตค่าจัดส่งเหมาจ่ายสำเร็จ");
        fetchOrders();
      } catch (err: any) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      // Default / Domestic carrier / Not selected
      handleOpenQuoteModal(order, 3);
    }
  }

  const handleOpenStatusModal = (order: any) => {
    setEditingOrder(order)
    setNewStatus(order.status)
    setTrackingNumber(order.tracking_number || "")
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

      // 1. Update order status and tracking number
      const { error: orderError } = await supabase
        .from("orders")
        .update({ 
          status: newStatus,
          tracking_number: trackingNumber || null 
        })
        .eq("id", editingOrder.id)

      if (orderError) throw orderError

      // 2. Insert tracking log
      const { error: logError } = await supabase
        .from("tracking_logs")
        .insert({
          order_id: editingOrder.id,
          status: newStatus,
          notes: trackingNotes || `อัปเดตสถานะเป็น: ${getStatusText(newStatus, editingOrder)}`
        })

      if (logError) throw logError

      // Send customer notification
      if (editingOrder.customer_id) {
        let message = `📦 อัปเดตสถานะออเดอร์ ${editingOrder.order_number}: พัสดุอยู่ในสถานะ "${getStatusText(newStatus, editingOrder)}" ค่ะ`;
        if (trackingNumber && trackingNumber !== editingOrder.tracking_number) {
          message = `🎉 พัสดุของคุณถูกจัดส่งแล้ว!\nเลขออเดอร์: ${editingOrder.order_number}\nเลขพัสดุ (Tracking): ${trackingNumber}\nสามารถนำเลขพัสดุไปเช็คสถานะได้เลยค่ะ`;
        }
        await sendCustomerNotification(editingOrder.customer_id, message);
      }

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
    if (!confirm(`ยืนยันการรับชำระเงินสำหรับออเดอร์ ${order.order_number}?`)) return

    try {
      setLoading(true)

      let roundToUpdate = null;
      if (order.status === 'WAITING_PAYMENT' || order.status === 'NEW' || (order.payment_round_1_status !== 'PAID' && order.payment_round_1_status !== 'NOT_APPLICABLE')) {
        roundToUpdate = 'payment_round_1_status';
      } else if ((order.status === 'CHINA_WAREHOUSE' || order.status === 'ORDERED') && order.payment_round_2_status !== 'PAID') {
        roundToUpdate = 'payment_round_2_status';
      } else if ((order.status === 'THAILAND_WAREHOUSE' || order.status === 'SHIPPING') && order.payment_round_3_status !== 'PAID') {
        roundToUpdate = 'payment_round_3_status';
      }

      let updates: any = {};
      let logStatus = 'PAID';
      let logNotes = 'ยืนยันรับชำระเงินแล้ว';

      if (roundToUpdate) {
        updates[roundToUpdate] = 'PAID';
        if (roundToUpdate === 'payment_round_1_status') {
          updates.status = 'ORDERED';
          logStatus = 'PAID_ROUND_1';
          logNotes = 'ชำระเงินรอบที่ 1 เรียบร้อยแล้ว';
        } else if (roundToUpdate === 'payment_round_2_status') {
          updates.status = 'SHIPPING';
          logStatus = 'PAID_ROUND_2';
          logNotes = 'ชำระเงินรอบที่ 2 เรียบร้อยแล้ว';
        } else if (roundToUpdate === 'payment_round_3_status') {
          updates.status = 'OUT_FOR_DELIVERY';
          logStatus = 'PAID_ROUND_3';
          logNotes = 'ชำระเงินรอบที่ 3 เรียบร้อยแล้ว';
        }
      } else {
        setLoading(false);
        alert("ออเดอร์นี้ชำระเงินในรอบปัจจุบันไปแล้ว หากต้องการเปลี่ยนสถานะให้ใช้ 'แก้แมนนวล' แทนครับ");
        return;
      }
      
      const { error: orderError } = await supabase
        .from("orders")
        .update(updates)
        .eq("id", order.id)

      if (orderError) throw orderError

      const { error: logError } = await supabase
        .from("tracking_logs")
        .insert({
          order_id: order.id,
          status: logStatus,
          notes: logNotes
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

  const getStatusBadge = (status: string, order: any) => {
    // Check Payment Round 1
    if (order.payment_round_1_status === 'REJECTED') return 'bg-red-100 text-red-800'
    if (order.payment_round_1_status === 'PENDING') return 'bg-amber-100 text-amber-800'
    if (order.payment_round_1_status === 'UPLOADED') return 'bg-amber-100 text-amber-800'
    
    // Check Payment Round 2 (When in China Warehouse)
    if (status === 'CHINA_WAREHOUSE' || status === 'SHIPPING' || status === 'THAILAND_WAREHOUSE' || status === 'DELIVERED') {
      if (order.payment_round_2_status === 'REJECTED') return 'bg-red-100 text-red-800'
      if (order.payment_round_2_status === 'PENDING') return 'bg-amber-100 text-amber-800'
      if (order.payment_round_2_status === 'UPLOADED') return 'bg-amber-100 text-amber-800'
    }
    
    // Check Payment Round 3 (When in Thai Warehouse)
    if (status === 'THAILAND_WAREHOUSE' || status === 'OUT_FOR_DELIVERY' || status === 'DELIVERED') {
      if (order.payment_round_3_status === 'REJECTED') return 'bg-red-100 text-red-800'
      if (order.payment_round_3_status === 'PENDING') return 'bg-amber-100 text-amber-800'
      if (order.payment_round_3_status === 'UPLOADED') return 'bg-amber-100 text-amber-800'
    }

    switch (status) {
      case 'ORDERED': return 'bg-blue-100 text-blue-800'
      case 'CHINA_WAREHOUSE': return 'bg-purple-100 text-purple-800'
      case 'SHIPPING': return 'bg-sky-100 text-sky-800'
      case 'THAILAND_WAREHOUSE': return 'bg-teal-100 text-teal-800'
      case 'OUT_FOR_DELIVERY': return 'bg-orange-100 text-orange-800'
      case 'DELIVERED': return 'bg-emerald-100 text-emerald-800'
      case 'PAID': return 'bg-green-100 text-green-800'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  const getStatusText = (status: string, order: any) => {
    // Payment Round 1
    if (order.payment_round_1_status === 'REJECTED') return 'สลิปถูกปฏิเสธ รอบ 1'
    if (order.payment_round_1_status === 'PENDING') return 'รอชำระเงิน รอบ 1 (ค่าสินค้า)'
    if (order.payment_round_1_status === 'UPLOADED') return 'ลูกค้ายื่นสลิป รอบ 1 (รอตรวจสอบ)'
    
    // Payment Round 2
    if (status === 'CHINA_WAREHOUSE' || status === 'SHIPPING') {
       if (order.payment_round_2_status === 'REJECTED') return 'สลิปถูกปฏิเสธ รอบ 2'
       if (order.payment_round_2_status === 'PENDING') return 'รอชำระเงิน รอบ 2 (ค่าขนส่งจีน-ไทย)'
       if (order.payment_round_2_status === 'UPLOADED') return 'ลูกค้ายื่นสลิป รอบ 2 (รอตรวจสอบ)'
    }
    
    // Payment Round 3
    if (status === 'THAILAND_WAREHOUSE' || status === 'OUT_FOR_DELIVERY') {
       if (order.payment_round_3_status === 'REJECTED') return 'สลิปถูกปฏิเสธ รอบ 3'
       if (order.payment_round_3_status === 'PENDING') return 'รอชำระเงิน รอบ 3 (ค่าจัดส่งในไทย)'
       if (order.payment_round_3_status === 'UPLOADED') return 'ลูกค้ายื่นสลิป รอบ 3 (รอตรวจสอบ)'
    }

    switch (status) {
      case 'NEW': return 'รอดำเนินการ'
      case 'WAITING_PAYMENT': return 'รอชำระเงิน'
      case 'PAID': return 'ชำระรอบ 1 แล้ว (รอแอดมินสั่งของ)'
      case 'ORDERED': return 'ชำระรอบ 1 แล้ว (ร้านจีนเตรียมจัดส่ง)'
      case 'CHINA_WAREHOUSE': return 'พัสดุถึงโกดังจีน (รอคำนวณค่าขนส่ง)'
      case 'SHIPPING': return 'ชำระรอบ 2 แล้ว (กำลังส่งมาไทย)'
      case 'THAILAND_WAREHOUSE': return 'พัสดุถึงโกดังไทย (รอคำนวณค่าส่งในไทย)'
      case 'OUT_FOR_DELIVERY': return 'ชำระครบถ้วน (กำลังนำส่งไปบ้านลูกค้า)'
      case 'DELIVERED': return 'จัดส่งสำเร็จเรียบร้อย'
      default: return status
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchOrders()
  }

  const handleFilterChange = (val: string) => {
    setStatusFilter(val)
    setCurrentPage(1)
  }

  // We no longer filter client-side because we have server-side pagination
  const filteredOrders = orders

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const newIds = [...selectedOrderIds]
      filteredOrders.forEach(order => {
        if (!newIds.includes(order.id)) newIds.push(order.id)
      })
      setSelectedOrderIds(newIds)
    } else {
      const pageIds = filteredOrders.map(o => o.id)
      setSelectedOrderIds(selectedOrderIds.filter(id => !pageIds.includes(id)))
    }
  }

  const handleSelectRow = (id: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">จัดการคำสั่งซื้อ (Orders)</h1>
          <p className="text-slate-600">ตรวจสอบและอัปเดตสถานะคำสั่งซื้อพัสดุทั้งหมด</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-300 shadow-sm flex items-center gap-2" onClick={handleExport}>
            <FileText className="w-4 h-4 text-emerald-600" />
            Export Excel
          </Button>
          <Link href="/admin/orders/new">
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-sm flex items-center gap-2">
              <PackagePlus className="w-4 h-4" />
              สร้างออเดอร์ (Manual)
            </Button>
          </Link>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4 border-b bg-slate-50/50 flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 flex">
             <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
             <Input 
               placeholder="ค้นหา Order ID... (กด Enter)" 
               className="pl-9 w-full" 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
          </form>
          <select 
            className="flex h-10 w-full sm:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={statusFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
          >
            <option value="ALL">สถานะทั้งหมด</option>
            <option value="NEW">NEW (รอชำระเงิน/อัปสลิป)</option>
            <option value="WAITING_PAYMENT">WAITING_PAYMENT (รอชำระเงิน/อัปสลิป)</option>
            <option value="PAID">PAID (ชำระเงินแล้ว/รอสั่งของ)</option>
            <option value="CHINA_WAREHOUSE">CHINA_WAREHOUSE (ถึงโกดังจีน/รอชำระรอบ2)</option>
            <option value="SHIPPING">SHIPPING (ส่งข้ามแดนมาไทย)</option>
            <option value="THAILAND_WAREHOUSE">THAILAND_WAREHOUSE (ถึงโกดังไทย/รอชำระรอบ3)</option>
            <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY (กำลังนำส่งลูกค้า)</option>
            <option value="DELIVERED">DELIVERED (จัดส่งสำเร็จ)</option>
          </select>
        </CardContent>
        <CardContent className="p-0">
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium w-12">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll} 
                      checked={filteredOrders.length > 0 && filteredOrders.every(o => selectedOrderIds.includes(o.id))} 
                      className="rounded border-slate-300 text-primary focus:ring-primary"
                    />
                  </th>
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
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <div className="flex justify-center items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span>กำลังโหลดข้อมูลคำสั่งซื้อ...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          checked={selectedOrderIds.includes(order.id)} 
                          onChange={() => handleSelectRow(order.id)} 
                          className="rounded border-slate-300 text-primary focus:ring-primary"
                        />
                      </td>
                      <td className="px-6 py-4 font-semibold text-primary">{order.order_number}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{order.customer?.full_name || '-'}</p>
                        <p className="text-xs text-slate-500 mb-1">
                          {order.customer?.customer_code || order.customer?.phone || '-'}
                          {order.quotation?.inquiry?.shipping_type === 'BOAT' ? ' (SEA)' : order.quotation?.inquiry?.shipping_type === 'CAR' ? ' (EK)' : ''}
                        </p>
                        {order.shipping_company && (
                          <div className="text-[11px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 mb-1 inline-block">
                            จัดส่ง: {order.shipping_company}
                          </div>
                        )}
                        {order.address && (
                          <div className="text-[11px] text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-100 max-w-[200px] line-clamp-2" title={`${order.address.address_line} ต.${order.address.subdistrict} อ.${order.address.district} จ.${order.address.province} ${order.address.postal_code}`}>
                            <MapPin className="inline w-3 h-3 mr-1 text-slate-400" />
                            {order.address.province} {order.address.postal_code}
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
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded ${getStatusBadge(order.status, order)}`}>
                          {getStatusText(order.status, order)}
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
                        
                        {(order.status === 'ORDERED' || (order.status === 'CHINA_WAREHOUSE' && !order.payment_round_2_status)) && (
                          <Button 
                            size="sm" 
                            onClick={() => handleOpenQuoteModal(order, 2)}
                            className="bg-blue-500 hover:bg-blue-600 w-full max-w-[120px] mb-2"
                          >
                            ถึงโกดังจีน (แจ้งบิล)
                          </Button>
                        )}

                        {(order.status === 'SHIPPING' || (order.status === 'THAILAND_WAREHOUSE' && !order.payment_round_3_status)) && (
                          <Button 
                            size="sm" 
                            onClick={() => handleArrivedInThailand(order)}
                            className="bg-blue-500 hover:bg-blue-600 w-full max-w-[120px] mb-2"
                          >
                            ถึงโกดังไทย (แจ้งบิล)
                          </Button>
                        )}

                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-slate-400 hover:text-slate-600 cursor-pointer w-full max-w-[120px] mb-2 text-xs"
                          onClick={() => handleOpenStatusModal(order)}
                          title="แก้ไขสถานะแมนนวล (ฉุกเฉินเท่านั้น)"
                        >
                          <MapPin className="h-3 w-3 mr-1" />
                          แก้แมนนวล
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleManualPayment(order)}
                          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 cursor-pointer w-full max-w-[120px] mb-2"
                        >
                          ยืนยันรับเงิน
                        </Button>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" className="cursor-pointer" asChild>
                            <Link href={`/dashboard/orders/${order.id}/invoice`} target="_blank" title="เอกสาร Invoice/Receipt">
                              <FileText className="h-4 w-4 text-blue-500" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" className="cursor-pointer" asChild>
                            <Link href={`/admin/orders/${order.order_number}`} target="_blank" title="ดูรายละเอียด">
                              <Eye className="h-4 w-4 text-slate-500 hover:text-slate-900" />
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      ไม่พบข้อมูลคำสั่งซื้อ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden flex flex-col">
            <div className="bg-slate-50 border-b p-3 flex items-center gap-2">
               <input 
                  type="checkbox" 
                  onChange={handleSelectAll} 
                  checked={filteredOrders.length > 0 && filteredOrders.every(o => selectedOrderIds.includes(o.id))} 
                  className="rounded border-slate-300 text-primary focus:ring-primary w-5 h-5"
                />
                <span className="text-xs font-semibold text-slate-500">เลือกทั้งหมดในหน้านี้</span>
            </div>
            {loading ? (
              <div className="p-12 text-center text-slate-400 flex flex-col justify-center items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span>กำลังโหลดข้อมูลคำสั่งซื้อ...</span>
              </div>
            ) : filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <div key={order.id} className="p-4 border-b border-slate-100 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={selectedOrderIds.includes(order.id)} 
                        onChange={() => handleSelectRow(order.id)} 
                        className="rounded border-slate-300 text-primary focus:ring-primary w-5 h-5"
                      />
                      <span className="font-bold text-primary text-base">{order.order_number}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${getStatusBadge(order.status, order)}`}>
                      {getStatusText(order.status, order)}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                    <p className="font-medium text-slate-900 text-sm">{order.customer?.full_name || '-'}</p>
                    <p className="text-xs text-slate-500">
                      {order.customer?.customer_code || order.customer?.phone || '-'}
                      {order.quotation?.inquiry?.shipping_type === 'BOAT' ? ' (SEA)' : order.quotation?.inquiry?.shipping_type === 'CAR' ? ' (EK)' : ''}
                    </p>
                    {order.shipping_company && (
                      <div className="text-[11px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 inline-block">
                        จัดส่ง: {order.shipping_company}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">ยอดชำระ:</span>
                    <span className="font-bold text-slate-900 text-lg">
                      {order.quotation?.total_price !== undefined 
                        ? `฿ ${Number(order.quotation.total_price).toLocaleString('th-TH', { minimumFractionDigits: 2 })}` 
                        : '-'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {order.payments?.some((p: any) => p.status === 'PENDING') && (
                      <Button size="sm" onClick={() => handleOpenPaymentModal(order, order.payments.find((p: any) => p.status === 'PENDING'))} className="bg-amber-500 hover:bg-amber-600 min-h-[44px]">
                        ตรวจสลิป
                      </Button>
                    )}
                    {(order.status === 'ORDERED' || (order.status === 'CHINA_WAREHOUSE' && !order.payment_round_2_status)) && (
                      <Button size="sm" onClick={() => handleOpenQuoteModal(order, 2)} className="bg-blue-500 hover:bg-blue-600 min-h-[44px]">
                        ถึงโกดังจีน
                      </Button>
                    )}
                    {(order.status === 'SHIPPING' || (order.status === 'THAILAND_WAREHOUSE' && !order.payment_round_3_status)) && (
                      <Button size="sm" onClick={() => handleArrivedInThailand(order)} className="bg-blue-500 hover:bg-blue-600 min-h-[44px]">
                        ถึงโกดังไทย
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-slate-500 border border-slate-200 min-h-[44px]" onClick={() => handleOpenStatusModal(order)}>
                      แก้แมนนวล
                    </Button>
                    <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 min-h-[44px]" onClick={() => handleManualPayment(order)}>
                      ยืนยันรับเงิน
                    </Button>
                    <div className="col-span-2 flex justify-between gap-2">
                      <Button variant="outline" className="flex-1 min-h-[44px]" asChild>
                        <Link href={`/dashboard/orders/${order.id}/invoice`} target="_blank">
                          <FileText className="h-4 w-4 mr-2 text-blue-500" /> Invoice
                        </Link>
                      </Button>
                      <Button variant="outline" className="flex-1 min-h-[44px]" asChild>
                        <Link href={`/admin/orders/${order.order_number}`} target="_blank">
                          <Eye className="h-4 w-4 mr-2" /> รายละเอียด
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-slate-400">
                ไม่พบข้อมูลคำสั่งซื้อ
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalCount > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between p-4 border-t">
              <span className="text-sm text-slate-500">
                แสดง {(currentPage - 1) * ITEMS_PER_PAGE + 1} ถึง {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} จากทั้งหมด {totalCount} รายการ
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1 || loading}
                >
                  ก่อนหน้า
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage * ITEMS_PER_PAGE >= totalCount || loading}
                >
                  ถัดไป
                </Button>
              </div>
            </div>
          )}
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

      {/* Quote Modal */}
      <QuoteModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        order={quoteOrder}
        round={quoteRound}
        onSuccess={fetchOrders}
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
                    <option value="NEW">NEW (รอชำระเงิน/อัปสลิป)</option>
                    <option value="WAITING_PAYMENT">WAITING_PAYMENT (รอชำระเงิน/อัปสลิป)</option>
                    <option value="PAID">PAID (ชำระเงินแล้ว/รอสั่งของ)</option>
                    <option value="ORDERED">ORDERED (ร้านจีนเตรียมจัดส่ง)</option>
                    <option value="CHINA_WAREHOUSE">CHINA_WAREHOUSE (ถึงโกดังจีน/รอชำระรอบ2)</option>
                    <option value="SHIPPING">SHIPPING (ส่งข้ามแดนมาไทย)</option>
                    <option value="THAILAND_WAREHOUSE">THAILAND_WAREHOUSE (ถึงโกดังไทย/รอชำระรอบ3)</option>
                    <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY (กำลังนำส่งลูกค้า)</option>
                    <option value="DELIVERED">DELIVERED (จัดส่งสำเร็จ)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">หมายเลขพัสดุ (Tracking Number)</label>
                  <Input 
                    type="text"
                    placeholder="กรอกเลขพัสดุสำหรับจัดส่งในไทย (ถ้ามี)"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full"
                  />
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

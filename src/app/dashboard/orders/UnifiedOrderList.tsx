"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, Inbox, AlertTriangle, FileText, CheckCircle, CreditCard, Globe, ExternalLink, Package, Copy, Check, Sparkles } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { AddressSelectionModal } from "../inquiries/AddressSelectionModal"
import { vibrateTap, vibrateSuccess } from "@/lib/haptics"

interface UnifiedOrderListProps {
  items: any[]
  customerId: string
}

export default function UnifiedOrderList({ items, customerId }: UnifiedOrderListProps) {
  const router = useRouter()
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedDetailsItem, setSelectedDetailsItem] = useState<any>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [previewQuotationItem, setPreviewQuotationItem] = useState<any>(null)
  const [selectedConsolidationIds, setSelectedConsolidationIds] = useState<string[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopyNumber = (e: React.MouseEvent, num: string) => {
    e.stopPropagation()
    navigator.clipboard.writeText(num)
    vibrateSuccess()
    setCopiedId(num)
    setTimeout(() => setCopiedId(null), 1800)
  }

  const handleToggleSelectConsolidation = (id: string) => {
    setSelectedConsolidationIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleConsolidate = async () => {
    if (selectedConsolidationIds.length < 2) return
    if (!confirm(`ยืนยันการรวมบิลจัดส่งในไทยสำหรับออเดอร์ที่เลือกจำนวน ${selectedConsolidationIds.length} รายการ?\n\n*ระบบจะคิดค่าส่งรอบ 3 รวมกันเป็นบิลเดียว*`)) return
    
    try {
      setProcessingId("consolidating")
      // The first selected ID will be the parent order
      const parent_id = selectedConsolidationIds[0]
      const child_ids = selectedConsolidationIds.slice(1)
      
      const res = await fetch("/api/order/consolidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parent_id, child_ids })
      })
      
      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || "Failed to consolidate orders")
      }
      
      alert("รวมบิลจัดส่งเรียบร้อยแล้ว แอดมินจะดำเนินการประเมินยอดส่งรวมให้ค่ะ")
      setSelectedConsolidationIds([])
      window.location.reload()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setProcessingId(null)
    }
  }

  const formatCurrency = (amount: any) => amount ? new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount) : '฿ 0.00'

  const openAddressModal = (quotationId: string) => {
    setSelectedQuotationId(quotationId)
    setAddressModalOpen(true)
  }

  const handleConfirmOrder = async (addressId: string) => {
    if (!selectedQuotationId) return
    
    try {
      setAddressModalOpen(false)
      setProcessingId(selectedQuotationId)
      setErrorMsg("")
      
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          quotation_id: selectedQuotationId,
          shipping_address_id: addressId
        })
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || "Failed to create order")
      }

      const order = result.data

      alert("ยืนยันคำสั่งซื้อสำเร็จ!")
      window.location.reload()
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการยืนยันคำสั่งซื้อ")
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string, item: any) => {
    if (item.type === 'INQUIRY') {
      switch (status) {
        case 'PENDING': return 'bg-amber-100 text-amber-800'
        case 'QUOTED': return 'bg-green-100 text-green-800'
        case 'REJECTED': return 'bg-rose-100 text-rose-800'
        default: return 'bg-slate-100 text-slate-800'
      }
    } else {
      // Check Payment Round 1
      if (item.payment_round_1_status === 'PENDING') return 'bg-amber-100 text-amber-800'
      if (item.payment_round_1_status === 'UPLOADED') return 'bg-amber-100 text-amber-800'
      
      // Check Payment Round 2 (When in China Warehouse)
      if (status === 'CHINA_WAREHOUSE' || status === 'SHIPPING' || status === 'THAILAND_WAREHOUSE' || status === 'DELIVERED') {
        if (item.payment_round_2_status === 'PENDING') return 'bg-amber-100 text-amber-800'
        if (item.payment_round_2_status === 'UPLOADED') return 'bg-amber-100 text-amber-800'
      }
      
      // Check Payment Round 3 (When in Thai Warehouse)
      if (status === 'THAILAND_WAREHOUSE' || status === 'OUT_FOR_DELIVERY' || status === 'DELIVERED') {
        if (item.payment_round_3_status === 'PENDING') return 'bg-amber-100 text-amber-800'
        if (item.payment_round_3_status === 'UPLOADED') return 'bg-amber-100 text-amber-800'
      }

      // Base Statuses
      switch (status) {
        case 'ORDERED': return 'bg-blue-100 text-blue-800'
        case 'CHINA_WAREHOUSE': return 'bg-purple-100 text-purple-800'
        case 'SHIPPING': return 'bg-sky-100 text-sky-800'
        case 'THAILAND_WAREHOUSE': return 'bg-teal-100 text-teal-800'
        case 'OUT_FOR_DELIVERY': return 'bg-orange-100 text-orange-800'
        case 'DELIVERED': return 'bg-emerald-100 text-emerald-800'
        case 'PAID': return 'bg-green-100 text-green-800'
        case 'CANCELED': return 'bg-rose-100 text-rose-800 border-rose-200'
        default: return 'bg-slate-100 text-slate-800'
      }
    }
  }

  const getStatusText = (status: string, item: any) => {
    if (item.type === 'INQUIRY') {
      switch (status) {
        case 'PENDING': return 'รอแอดมินประเมินราคา'
        case 'QUOTED': return 'แอดมินเสนอราคาแล้ว (รอยืนยันสั่งซื้อ)'
        case 'REJECTED': return 'ยกเลิกคำขอ'
        default: return status
      }
    } else {
      // Payment Round 1
      if (item.payment_round_1_status === 'PENDING') return 'รอชำระเงิน รอบ 1 (ค่าสินค้า)'
      if (item.payment_round_1_status === 'UPLOADED') return 'แอดมินกำลังตรวจสอบสลิป รอบ 1'
      
      // Payment Round 2
      if (status === 'CHINA_WAREHOUSE' || status === 'SHIPPING') {
         if (item.payment_round_2_status === 'PENDING') return 'รอชำระเงิน รอบ 2 (ค่าขนส่งจีน-ไทย)'
         if (item.payment_round_2_status === 'UPLOADED') return 'แอดมินกำลังตรวจสอบสลิป รอบ 2'
      }
      
      // Payment Round 3
      if (status === 'THAILAND_WAREHOUSE' || status === 'OUT_FOR_DELIVERY') {
         if (item.consolidated_into_id) return 'รวมจัดส่ง (ชำระรอบ 3 ที่ออเดอร์หลัก)'
         if (item.payment_round_3_status === 'PENDING') return 'รอชำระเงิน รอบ 3 (ค่าจัดส่งในไทย)'
         if (item.payment_round_3_status === 'UPLOADED') return 'แอดมินกำลังตรวจสอบสลิป รอบ 3'
      }

      // Base Statuses
      switch (status) {
        case 'NEW': return 'รอดำเนินการ'
        case 'WAITING_PAYMENT': return 'รอชำระเงิน'
        case 'PAID': return 'ชำระรอบ 1 แล้ว (รอแอดมินสั่งของ)'
        case 'ORDERED': return item.payment_round_1_status === 'NOT_APPLICABLE' ? 'กำลังจัดส่งไปโกดังจีน' : 'ชำระรอบ 1 แล้ว (ร้านจีนเตรียมจัดส่ง)'
        case 'CHINA_WAREHOUSE': return 'พัสดุถึงโกดังจีน (รอคำนวณค่าขนส่ง)'
        case 'SHIPPING': return 'ชำระรอบ 2 แล้ว (กำลังส่งมาไทย)'
        case 'THAILAND_WAREHOUSE': return 'พัสดุถึงโกดังไทย (รอคำนวณค่าส่งในไทย)'
        case 'OUT_FOR_DELIVERY': return 'ชำระครบถ้วน (กำลังนำส่งไปบ้านลูกค้า)'
        case 'DELIVERED': return 'จัดส่งสำเร็จเรียบร้อย'
        case 'CANCELED': return 'ยกเลิกคำสั่งซื้อ'
        default: return status
      }
    }
  }

  const isWaitingPayment = (item: any) => {
    if (item.consolidated_into_id) return false;
    return item.status === 'WAITING_PAYMENT' || 
           item.payment_round_1_status === 'PENDING' || 
           ((item.status === 'CHINA_WAREHOUSE' || item.status === 'SHIPPING') && item.payment_round_2_status === 'PENDING') ||
           ((item.status === 'THAILAND_WAREHOUSE' || item.status === 'OUT_FOR_DELIVERY') && item.payment_round_3_status === 'PENDING');
  }

  const eligibleConsolidationItems = items.filter(item => 
    item.type === 'ORDER' && 
    item.status === 'THAILAND_WAREHOUSE' && 
    item.payment_round_3_status !== 'PAID' && 
    !item.consolidated_into_id
  )

  return (
    <div className="space-y-4">
      {eligibleConsolidationItems.length >= 1 && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 p-4 sm:p-5 rounded-2xl border border-blue-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm mb-4 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded-full text-xs font-black">
                ✨ รวมบิลประหยัดค่าส่ง ({eligibleConsolidationItems.length} รายการ)
              </span>
            </div>
            <h4 className="font-bold text-blue-950 text-base">ระบบรวมบิลค่าจัดส่งในไทย (รอบ 3)</h4>
            <p className="text-blue-800 text-xs sm:text-sm leading-relaxed">
              ติ๊กเลือกออเดอร์ที่พัสดุถึงไทยแล้วตั้งแต่ 2 รายการขึ้นไป เพื่อแพ็ครวมกล่องใหญ่จัดส่งพร้อมกัน ช่วยคุณประหยัดค่าขนส่งในไทยได้ทันที
            </p>
          </div>
          {selectedConsolidationIds.length >= 2 ? (
            <Button onClick={handleConsolidate} className="bg-blue-600 hover:bg-blue-700 text-white font-bold shrink-0 min-h-[44px] rounded-xl px-5 shadow-md cursor-pointer animate-pulse">
              🚀 ดำเนินการรวมบิล ({selectedConsolidationIds.length} รายการ)
            </Button>
          ) : (
            <div className="text-xs text-blue-600 font-bold bg-white/80 px-3 py-2 rounded-xl border border-blue-200 shrink-0">
              ติ๊กเลือกอย่างน้อย 2 รายการด้านล่าง
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium">หมายเลขคำสั่งซื้อ</th>
                  <th className="px-6 py-4 font-medium">วันที่สร้าง</th>
                  <th className="px-6 py-4 font-medium">ยอดชำระ</th>
                  <th className="px-6 py-4 font-medium">สถานะ</th>
                  <th className="px-6 py-4 font-medium text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {items && items.length > 0 ? (
                  items.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-primary flex items-center gap-2">
                        {item.type === 'ORDER' && item.status === 'THAILAND_WAREHOUSE' && item.payment_round_3_status !== 'PAID' && !item.consolidated_into_id && (
                          <input 
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer accent-blue-600"
                            checked={selectedConsolidationIds.includes(item.id)}
                            onChange={() => handleToggleSelectConsolidation(item.id)}
                            title="เลือกเพื่อรวมบิล"
                          />
                        )}
                        <span 
                          onClick={() => {
                            setSelectedDetailsItem(item);
                            setIsDetailsOpen(true);
                          }}
                          className="cursor-pointer hover:underline"
                        >
                          {item.order_number || item.inquiry_number}
                        </span>
                        {item.type === 'ORDER' && item.status === 'THAILAND_WAREHOUSE' && item.payment_round_3_status !== 'PAID' && !item.consolidated_into_id && (
                          <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                            ✨ พร้อมรวมบิล
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : '-'}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {item.total_price !== undefined 
                          ? `฿ ${Number(item.total_price).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                          : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded ${getStatusBadge(item.status, item)}`}>
                          {getStatusText(item.status, item)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {item.type === 'INQUIRY' && item.status === 'QUOTED' && item.quotation_id && (
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer mr-2"
                            onClick={() => setPreviewQuotationItem(item)}
                            disabled={processingId === item.quotation_id}
                          >
                            ยืนยันคำสั่งซื้อ
                          </Button>
                        )}
                        
                        {item.type === 'ORDER' && (
                          <Link href={`/dashboard/orders/${item.order_number}${isWaitingPayment(item) ? '#payment' : ''}`}>
                            <Button variant={isWaitingPayment(item) ? "default" : "ghost"} size="sm" className="cursor-pointer">
                              {isWaitingPayment(item) ? (
                                <>
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  ดำเนินการชำระเงิน
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  ดูรายละเอียด
                                </>
                              )}
                            </Button>
                          </Link>
                        )}
                        
                        {item.type === 'INQUIRY' && item.status === 'PENDING' && (
                          <span className="text-slate-400 text-xs italic">กำลังรอราคา</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Inbox className="h-10 w-10 text-slate-300" />
                        <p className="text-slate-500">ยังไม่มีข้อมูลคำสั่งซื้อ</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (Elevated Touch-Friendly Cards) */}
          <div className="md:hidden p-3 bg-slate-50/60 space-y-3">
            {items && items.length > 0 ? (
              items.map((item) => {
                const itemNum = item.order_number || item.inquiry_number
                const waitingPay = isWaitingPayment(item)

                return (
                  <div 
                    key={item.id} 
                    className={`p-4 bg-white rounded-2xl border transition-all shadow-xs flex flex-col gap-3 ${
                      waitingPay ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200/90'
                    }`}
                  >
                    {/* Header: Number & Status Badge */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {item.type === 'ORDER' && item.status === 'THAILAND_WAREHOUSE' && item.payment_round_3_status !== 'PAID' && !item.consolidated_into_id && (
                          <input 
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer shrink-0"
                            checked={selectedConsolidationIds.includes(item.id)}
                            onChange={() => handleToggleSelectConsolidation(item.id)}
                            title="เลือกเพื่อรวมบิล"
                          />
                        )}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span 
                            onClick={() => {
                              setSelectedDetailsItem(item);
                              setIsDetailsOpen(true);
                            }}
                            className="font-black text-primary text-sm sm:text-base cursor-pointer hover:underline truncate"
                          >
                            {itemNum}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyNumber(e, itemNum)}
                            className="text-slate-400 hover:text-primary p-1 rounded-md transition-colors shrink-0"
                            title="คัดลอกรหัสคำสั่งซื้อ"
                          >
                            {copiedId === itemNum ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg shrink-0 ${getStatusBadge(item.status, item)}`}>
                        {getStatusText(item.status, item)}
                      </span>
                    </div>

                    {/* Consolidation Badge if eligible */}
                    {item.type === 'ORDER' && item.status === 'THAILAND_WAREHOUSE' && item.payment_round_3_status !== 'PAID' && !item.consolidated_into_id && (
                      <div className="flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg font-bold">
                        <Sparkles className="w-3 h-3 text-blue-600" />
                        <span>สินค้าถึงไทยแล้ว สามารถติ๊กหน้ารายการเพื่อรวมบิลได้</span>
                      </div>
                    )}

                    {/* Meta Row: Date and Total Price */}
                    <div className="flex justify-between items-center bg-slate-50/80 p-2.5 rounded-xl text-xs border border-slate-100">
                      <span className="text-slate-500">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : '-'}
                      </span>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">ยอดรวม</span>
                        <span className="font-black text-slate-900 text-sm font-mono">
                          {item.total_price !== undefined 
                            ? `฿ ${Number(item.total_price).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                            : '-'}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-1">
                      {item.type === 'INQUIRY' && item.status === 'QUOTED' && item.quotation_id && (
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer w-full min-h-[44px] rounded-xl font-black text-xs active:scale-[0.98] shadow-sm shadow-emerald-600/20"
                          onClick={() => setPreviewQuotationItem(item)}
                          disabled={processingId === item.quotation_id}
                        >
                          ✓ ยืนยันคำสั่งซื้อ
                        </Button>
                      )}
                      
                      {item.type === 'ORDER' && (
                        <Link href={`/dashboard/orders/${item.order_number}${waitingPay ? '#payment' : ''}`} className="w-full block">
                          <Button 
                            variant={waitingPay ? "default" : "outline"} 
                            size="sm" 
                            className={`cursor-pointer w-full min-h-[44px] rounded-xl font-black text-xs active:scale-[0.98] transition-all ${
                              waitingPay 
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/25' 
                                : 'text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {waitingPay ? (
                              <>
                                <CreditCard className="h-4 w-4 mr-1.5 text-white" />
                                ⚡ ดำเนินการชำระเงิน
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-1.5 text-slate-500" />
                                ดูรายละเอียดคำสั่งซื้อ
                              </>
                            )}
                          </Button>
                        </Link>
                      )}
                      
                      {item.type === 'INQUIRY' && item.status === 'PENDING' && (
                        <div className="text-center w-full py-2.5 bg-slate-50 rounded-xl text-slate-400 text-xs italic font-medium">
                          กำลังรอแอดมินประเมินราคา
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2 bg-white rounded-2xl border border-slate-200">
                <Package className="h-8 w-8 text-slate-300" />
                <p className="text-xs font-semibold">ไม่พบข้อมูลคำสั่งซื้อ</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AddressSelectionModal 
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        onConfirm={handleConfirmOrder}
      />

      {/* Quotation Preview Modal */}
      {previewQuotationItem && previewQuotationItem.quotations && previewQuotationItem.quotations[0] && (
        <Dialog open={!!previewQuotationItem} onOpenChange={(open) => !open && setPreviewQuotationItem(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                ใบเสนอราคาประเมินเรียบร้อย
              </DialogTitle>
              <DialogDescription className="text-slate-500">
                รหัสอ้างอิง: {previewQuotationItem.inquiry_number} | {previewQuotationItem.customer?.customer_code || "ไม่มีรหัส"} {previewQuotationItem.shipping_type === 'BOAT' ? '(SEA) 🛳️' : '(EK) 🚚'}
              </DialogDescription>
            </DialogHeader>

            <div className="py-2 space-y-4">
              <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="font-semibold text-sm text-slate-800 border-b pb-2">รายละเอียดราคานำเข้าพัสดุ</h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between pb-1 border-b text-slate-600">
                    <span>ค่าสินค้า (Product Cost)</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(previewQuotationItem.quotations[0].product_cost)}</span>
                  </div>

                  {previewQuotationItem.items && previewQuotationItem.items.length > 0 && (
                    <div className="py-2 space-y-2 border-b border-dashed border-slate-200">
                      <p className="text-xs font-bold text-slate-500 mb-1">รายการสินค้า:</p>
                      {previewQuotationItem.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-start justify-between text-xs text-slate-600 pl-2">
                          <div className="flex items-start gap-2 max-w-[280px] flex-1">
                            <span className="shrink-0 font-semibold">{idx + 1}.</span>
                            {item.image_url ? (
                              <a href={item.image_url} target="_blank" rel="noopener noreferrer">
                                <img src={item.image_url} alt={`Item ${idx + 1}`} className="w-10 h-10 object-cover rounded border border-slate-200 shrink-0 cursor-zoom-in hover:opacity-80 transition-opacity" />
                              </a>
                            ) : (
                              <div className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded border border-dashed border-slate-200 text-[9px] text-slate-400 shrink-0">
                                ไม่มีรูป
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary truncate block w-full">{item.url}</a>
                              <div className="text-[10px] text-slate-500 mt-1">จำนวน {item.quantity} ชิ้น</div>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <span className="font-semibold text-slate-800">{formatCurrency(item.quoted_price || 0)}</span>
                            <div className="text-[10px] text-slate-400 mt-1">ค่าส่ง: {formatCurrency(item.quoted_shipping_cn_cn || 0)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm pt-2">
                    <span className="text-slate-600 font-medium">ค่าจัดส่ง จีน-จีน</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(previewQuotationItem.quotations[0].shipping_cost_cn_cn)}</span>
                  </div>
                  <div className="flex justify-between pb-1 border-b text-slate-600">
                    <span>ค่าธรรมเนียมอื่น ๆ (Other Fee)</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(previewQuotationItem.quotations[0].other_fee)}</span>
                  </div>
                  <div className="flex justify-between pt-2 text-base font-bold">
                    <span className="text-slate-900">ยอดสุทธิ (Grand Total)</span>
                    <span className="text-primary text-lg">{formatCurrency(previewQuotationItem.quotations[0].total_price)}</span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4 gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setPreviewQuotationItem(null)}>
                ยกเลิก
              </Button>
              <Button 
                type="button" 
                variant="orange" 
                onClick={() => {
                  const qId = previewQuotationItem.quotation_id
                  setPreviewQuotationItem(null)
                  openAddressModal(qId)
                }}
                className="font-bold cursor-pointer"
              >
                ยืนยันและยอมรับราคา
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Details Modal */}
      {selectedDetailsItem && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-slate-900 font-bold text-xl">รายละเอียดคำสั่งซื้อ {selectedDetailsItem.order_number || selectedDetailsItem.inquiry_number}</DialogTitle>
              <DialogDescription>
                รายการสินค้าทั้งหมดในออเดอร์นี้
              </DialogDescription>
            </DialogHeader>

            <div className="overflow-x-auto mt-4 rounded-lg border border-slate-200">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 font-semibold w-16 text-center">ลำดับ</th>
                    <th className="px-4 py-3 font-semibold w-24">รูปภาพ</th>
                    <th className="px-4 py-3 font-semibold">ลิงก์สินค้า</th>
                    <th className="px-4 py-3 font-semibold">รายละเอียด / ความต้องการ</th>
                    <th className="px-4 py-3 font-semibold text-right">ราคา & ค่าส่งในจีน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    let parsedItems = []
                    if (selectedDetailsItem.items) {
                      parsedItems = typeof selectedDetailsItem.items === 'string' ? JSON.parse(selectedDetailsItem.items) : selectedDetailsItem.items
                    }
                    if (!parsedItems || parsedItems.length === 0) {
                      if (selectedDetailsItem.product_url) {
                        parsedItems = [{
                          url: selectedDetailsItem.product_url,
                          image_url: selectedDetailsItem.image_url,
                          quantity: selectedDetailsItem.quantity,
                          remark: selectedDetailsItem.remark
                        }]
                      }
                    }
                    
                    return parsedItems.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-4 font-bold text-slate-900 text-center">{idx + 1}</td>
                        <td className="px-4 py-4">
                          {item.image_url ? (
                            <a href={item.image_url} target="_blank" rel="noopener noreferrer">
                              <img src={item.image_url} alt={`Item ${idx + 1}`} className="h-16 w-16 object-cover rounded border border-slate-200 hover:opacity-80 transition-opacity cursor-zoom-in" />
                            </a>
                          ) : (
                            <div className="h-16 w-16 flex items-center justify-center bg-slate-50 rounded border border-dashed border-slate-200 text-xs text-slate-400">
                              ไม่มีรูป
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 max-w-[200px]">
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 break-all truncate">
                            <Globe className="h-4 w-4 shrink-0 text-slate-400" />
                            <span className="truncate">{item.url}</span>
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                          <div className="mt-2 text-xs font-semibold text-slate-700 bg-slate-100 inline-block px-2 py-1 rounded">
                            จำนวน {item.quantity} ชิ้น
                          </div>
                        </td>
                        <td className="px-4 py-4 max-w-[250px] text-xs text-slate-600 whitespace-pre-wrap">
                          {item.remark || "-"}
                        </td>
                        <td className="px-4 py-4 text-right">
                          {item.quoted_price ? (
                            <div className="font-bold text-slate-900">฿ {Number(item.quoted_price).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">-</span>
                          )}
                          {item.quoted_shipping_cn_cn > 0 && (
                            <div className="text-[10px] text-slate-500 mt-1">ค่าส่งในจีน: ฿ {Number(item.quoted_shipping_cn_cn).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</div>
                          )}
                        </td>
                      </tr>
                    ))
                  })()}
                </tbody>
              </table>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsDetailsOpen(false)} className="w-full sm:w-auto">
                ปิดหน้าต่าง
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

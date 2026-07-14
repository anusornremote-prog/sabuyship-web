"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, Inbox, AlertTriangle, FileText, CheckCircle, CreditCard, Globe, ExternalLink } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { AddressSelectionModal } from "../inquiries/AddressSelectionModal"

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
         if (item.payment_round_3_status === 'PENDING') return 'รอชำระเงิน รอบ 3 (ค่าจัดส่งในไทย)'
         if (item.payment_round_3_status === 'UPLOADED') return 'แอดมินกำลังตรวจสอบสลิป รอบ 3'
      }

      // Base Statuses
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
  }

  const isWaitingPayment = (item: any) => {
    return item.status === 'WAITING_PAYMENT' || 
           item.payment_round_1_status === 'PENDING' || 
           ((item.status === 'CHINA_WAREHOUSE' || item.status === 'SHIPPING') && item.payment_round_2_status === 'PENDING') ||
           ((item.status === 'THAILAND_WAREHOUSE' || item.status === 'OUT_FOR_DELIVERY') && item.payment_round_3_status === 'PENDING');
  }

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
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
                      <td className="px-6 py-4 font-medium text-primary">
                        <span 
                          onClick={() => {
                            setSelectedDetailsItem(item);
                            setIsDetailsOpen(true);
                          }}
                          className="cursor-pointer hover:underline"
                        >
                          {item.order_number || item.inquiry_number}
                        </span>
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
                        <div key={idx} className="flex justify-between text-xs text-slate-600 pl-2">
                          <span className="truncate max-w-[200px] flex-1">{idx + 1}. {item.url} (x{item.quantity})</span>
                          <div className="text-right">
                            <span className="font-semibold text-slate-800 ml-2">{formatCurrency(item.quoted_price || 0)}</span>
                            <div className="text-[10px] text-slate-400">ค่าส่ง: {formatCurrency(item.quoted_shipping_cn_cn || 0)}</div>
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

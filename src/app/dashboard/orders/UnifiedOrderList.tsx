"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, Inbox, AlertTriangle, FileText, CheckCircle } from "lucide-react"
import { AddressSelectionModal } from "../inquiries/AddressSelectionModal"

interface UnifiedOrderListProps {
  items: any[]
  customerId: string
}

export default function UnifiedOrderList({ items, customerId }: UnifiedOrderListProps) {
  const router = useRouter()
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [processingId, setProcessingId] = useState<string | null>(null)

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

      router.push(`/dashboard/orders/${order.order_number}`)
      router.refresh()
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการยืนยันคำสั่งซื้อ")
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string, type: 'INQUIRY' | 'ORDER') => {
    if (type === 'INQUIRY') {
      switch (status) {
        case 'PENDING': return 'bg-amber-100 text-amber-800'
        case 'QUOTED': return 'bg-green-100 text-green-800'
        case 'REJECTED': return 'bg-rose-100 text-rose-800'
        default: return 'bg-slate-100 text-slate-800'
      }
    } else {
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
  }

  const getStatusText = (status: string, type: 'INQUIRY' | 'ORDER') => {
    if (type === 'INQUIRY') {
      switch (status) {
        case 'PENDING': return 'รอเจ้าหน้าที่ประเมินราคา'
        case 'QUOTED': return 'ประเมินราคาเสร็จสิ้น (รอสั่งซื้อ)'
        case 'REJECTED': return 'ยกเลิกคำขอ'
        default: return status
      }
    } else {
      switch (status) {
        case 'NEW': return 'รอดำเนินการ'
        case 'WAITING_PAYMENT': return 'รอชำระเงิน'
        case 'PAID': return 'ชำระเงินแล้ว'
        case 'ORDERED': return 'สั่งซื้อสำเร็จ'
        case 'CHINA_WAREHOUSE': return 'ถึงโกดังจีน'
        case 'SHIPPING': return 'อยู่ระหว่างจัดส่งมาไทย'
        case 'THAILAND_WAREHOUSE': return 'ถึงโกดังไทย'
        case 'OUT_FOR_DELIVERY': return 'อยู่ระหว่างนำจ่าย'
        case 'DELIVERED': return 'จัดส่งสำเร็จ'
        default: return status
      }
    }
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
                      <td className="px-6 py-4 font-medium text-primary">{item.order_number || item.inquiry_number}</td>
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
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded ${getStatusBadge(item.status, item.type)}`}>
                          {getStatusText(item.status, item.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {item.type === 'INQUIRY' && item.status === 'QUOTED' && item.quotation_id && (
                          <Button 
                            variant="green" 
                            size="sm" 
                            className="cursor-pointer mr-2"
                            onClick={() => openAddressModal(item.quotation_id)}
                            disabled={processingId === item.quotation_id}
                          >
                            ยืนยันสั่งซื้อ
                          </Button>
                        )}
                        
                        {item.type === 'ORDER' && (
                          <Link href={`/dashboard/orders/${item.order_number}`}>
                            <Button variant="ghost" size="sm" className="cursor-pointer">
                              <Eye className="h-4 w-4 mr-2" />
                              ดูรายละเอียด
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
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Eye, 
  EyeOff,
  Globe, 
  ExternalLink, 
  Check, 
  Loader2, 
  Inbox,
  AlertTriangle 
} from "lucide-react"
import Link from "next/link"
import { AddressSelectionModal } from "./AddressSelectionModal"

interface InquiryListProps {
  initialInquiries: any[]
  customerId: string
}

export default function InquiryList({ initialInquiries, customerId }: InquiryListProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("ALL")
  const [approvingQuotationId, setApprovingQuotationId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(null)

  const formatCurrency = (amount: any) => {
    return `฿ ${Number(amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const openAddressModal = (quotationId: string) => {
    setSelectedQuotationId(quotationId)
    setAddressModalOpen(true)
  }

  const handleConfirmOrder = async (addressId: string) => {
    if (!selectedQuotationId) return
    
    try {
      setAddressModalOpen(false)
      setApprovingQuotationId(selectedQuotationId)
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


      // Redirect immediately to order detail page
      router.push(`/dashboard/orders/${order.order_number}`)
      router.refresh()
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการยืนยันคำสั่งซื้อ")
    } finally {
      setApprovingQuotationId(null)
    }
  }

  // Filter inquiries
  const filteredInquiries = initialInquiries.filter(inq => {
    const matchesSearch = 
      inq.inquiry_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inq.product_url && inq.product_url.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inq.items && inq.items.some((item: any) => item.url.toLowerCase().includes(searchQuery.toLowerCase())))
    
    const matchesTab = activeTab === "ALL" || inq.status === activeTab
    return matchesSearch && matchesTab
  })

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100/60 max-w-max">
          <button 
            onClick={() => setActiveTab("ALL")}
            className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-md transition-all cursor-pointer ${activeTab === 'ALL' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            ทั้งหมด
          </button>
          <button 
            onClick={() => setActiveTab("PENDING")}
            className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-md transition-all cursor-pointer ${activeTab === 'PENDING' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            รอประเมินราคา
          </button>
          <button 
            onClick={() => setActiveTab("QUOTED")}
            className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-md transition-all cursor-pointer ${activeTab === 'QUOTED' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            ประเมินเสร็จสิ้น
          </button>
          <button 
            onClick={() => setActiveTab("REJECTED")}
            className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-md transition-all cursor-pointer ${activeTab === 'REJECTED' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            ยกเลิก
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="ค้นหา รหัสคำขอ, ลิงก์สินค้า..." 
            className="pl-9 bg-slate-50 border-transparent focus:bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Inquiry Cards List */}
      <div className="space-y-4">
        {filteredInquiries.length > 0 ? (
          filteredInquiries.map((inq) => (
            <InquiryCard 
              key={inq.id}
              inq={inq}
              customerId={customerId}
              openAddressModal={openAddressModal}
              approvingQuotationId={approvingQuotationId}
              formatCurrency={formatCurrency}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-100 shadow-sm">
            <Inbox className="h-12 w-12 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">ไม่พบรายการประเมินราคาในหมวดหมู่นี้</p>
            <Link href="/inquiry" className="mt-4">
              <Button variant="orange" size="sm" className="cursor-pointer">
                ขอใบเสนอราคาใหม่
              </Button>
            </Link>
          </div>
        )}
      </div>

      <AddressSelectionModal 
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        onConfirm={handleConfirmOrder}
      />
    </div>
  )
}

interface InquiryCardProps {
  inq: any
  customerId: string
  openAddressModal: (quotationId: string) => void
  approvingQuotationId: string | null
  formatCurrency: (amount: any) => string
}

function InquiryCard({ inq, customerId, openAddressModal, approvingQuotationId, formatCurrency }: InquiryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const quotation = inq.quotations?.[0]
  const order = quotation?.orders?.[0]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-800'
      case 'QUOTED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-rose-100 text-rose-800'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'รอเจ้าหน้าที่ประเมิน'
      case 'QUOTED': return 'ประเมินราคาเสร็จสิ้น'
      case 'REJECTED': return 'ยกเลิกคำขอ'
      default: return status
    }
  }

  return (
    <Card className="border border-slate-100 hover:border-slate-200 transition-shadow shadow-sm overflow-hidden">
      <CardContent className="p-6 space-y-4">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-50">
          <div>
            <h3 className="font-bold text-lg text-slate-900">{inq.inquiry_number}</h3>
            <p className="text-xs text-slate-500">
              ขอราคาเมื่อ: {inq.created_at ? new Date(inq.created_at).toLocaleString('th-TH') : '-'}
            </p>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${getStatusBadge(inq.status)}`}>
            {getStatusText(inq.status)}
          </span>
        </div>

        {/* Card Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-4 col-span-1 md:col-span-2">
            <div>
                <span className="text-slate-400 block text-xs font-semibold uppercase tracking-wider mb-2">รายการสินค้า</span>
                <div className="space-y-3">
                  {inq.items && inq.items.length > 0 ? (
                    inq.items.map((item: any, idx: number) => (
                      <div key={idx} className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                        <div className="flex flex-col sm:flex-row justify-between gap-2">
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline flex items-center gap-1.5 break-all text-sm">
                            <Globe className="h-4 w-4 shrink-0 text-slate-400" />
                            <span className="line-clamp-1">{item.url}</span>
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                          <span className="font-semibold text-slate-800 text-sm shrink-0 whitespace-nowrap">จำนวน {item.quantity} ชิ้น</span>
                        </div>
                        {item.remark && (
                          <p className="text-slate-600 text-xs mt-2 bg-white p-2 border border-slate-100 rounded">
                            {item.remark}
                          </p>
                        )}
                        {item.image_url && (
                          <div className="mt-2">
                            <a href={item.image_url} target="_blank" rel="noopener noreferrer">
                              <img src={item.image_url} alt="Product Image" className="h-16 w-16 object-cover rounded border border-slate-200 hover:opacity-80 transition-opacity shadow-sm" />
                            </a>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                        <div className="flex flex-col sm:flex-row justify-between gap-2">
                          <a href={inq.product_url} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline flex items-center gap-1.5 break-all text-sm">
                            <Globe className="h-4 w-4 shrink-0 text-slate-400" />
                            <span className="line-clamp-1">{inq.product_url}</span>
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                          <span className="font-semibold text-slate-800 text-sm shrink-0 whitespace-nowrap">จำนวน {inq.quantity} ชิ้น</span>
                        </div>
                        {inq.remark && (
                          <p className="text-slate-600 text-xs mt-2 bg-white p-2 border border-slate-100 rounded">
                            {inq.remark}
                          </p>
                        )}
                        {inq.image_url && (
                          <div className="mt-2">
                            <a href={inq.image_url} target="_blank" rel="noopener noreferrer">
                              <img src={inq.image_url} alt="Product Image" className="h-16 w-16 object-cover rounded border border-slate-200 hover:opacity-80 transition-opacity shadow-sm" />
                            </a>
                          </div>
                        )}
                      </div>
                  )}
                </div>
            </div>
            <div>
              <span className="text-slate-400 block text-xs font-semibold uppercase tracking-wider">บัญชี LINE / WeChat</span>
              <span className="font-medium text-slate-800 text-sm">{inq.line_id || '-'}</span>
            </div>
          </div>
        </div>

        {/* Quotation Preview and Details */}
        {inq.status === 'QUOTED' && quotation && (
          <div className="pt-4 border-t border-dashed border-slate-100 flex flex-col gap-4">
            <div className="flex justify-between items-center bg-green-50/40 p-3 rounded-lg border border-green-100/30">
              <div>
                <span className="text-xs text-green-700 font-semibold">ใบเสนอราคาประเมินเรียบร้อย</span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">
                  ยอดชำระทั้งสิ้น: <span className="text-primary font-extrabold">{formatCurrency(quotation.total_price)}</span>
                </p>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-slate-600 border border-slate-200 hover:bg-slate-100 cursor-pointer shadow-sm"
              >
                {isExpanded ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1.5" />
                    ซ่อนใบประเมินราคา
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1.5" />
                    ดูรายละเอียดค่าใช้จ่าย
                  </>
                )}
              </Button>
            </div>

            {/* Cost Breakdown & Confirmation */}
            {isExpanded && (
              <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-top-3 duration-200">
                <h4 className="font-semibold text-sm text-slate-800 border-b pb-2">รายละเอียดราคานำเข้าพัสดุ</h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between pb-1 border-b text-slate-600">
                    <span>ค่าสินค้า (Product Cost)</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(quotation.product_cost)}</span>
                  </div>

                  <div className="flex justify-between pb-1 border-b text-slate-600">
                    <span>ค่าจัดส่งจีน-ไทย (Shipping Fee)</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(quotation.shipping_fee)}</span>
                  </div>
                  <div className="flex justify-between pb-1 border-b text-slate-600">
                    <span>ค่าธรรมเนียมอื่น ๆ (Other Fee)</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(quotation.other_fee)}</span>
                  </div>
                  <div className="flex justify-between pt-2 text-base font-bold">
                    <span className="text-slate-900">ยอดสุทธิ (Grand Total)</span>
                    <span className="text-primary text-lg">{formatCurrency(quotation.total_price)}</span>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  {order ? (
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                        <Check className="h-4 w-4" />
                        สั่งซื้อเรียบร้อยแล้ว ({order.order_number})
                      </span>
                      <Link href={`/dashboard/orders/${order.order_number}`}>
                        <Button size="sm" variant="outline" className="cursor-pointer">
                          ติดตามสถานะพัสดุ
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => openAddressModal(quotation.id)}
                      disabled={approvingQuotationId === quotation.id}
                      variant="orange"
                      className="cursor-pointer shadow-md shadow-orange-600/10 font-bold px-6"
                    >
                      {approvingQuotationId === quotation.id ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>กำลังสร้างออเดอร์...</span>
                        </div>
                      ) : "ยืนยันและยอมรับใบประเมินราคา เพื่อเริ่มสั่งซื้อ"}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

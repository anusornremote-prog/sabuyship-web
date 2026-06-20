"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, PlusCircle, ExternalLink, Globe, FileText, CheckCircle2, XCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/custom-dialog"

interface InquiryListProps {
  initialInquiries: any[]
}

export default function AdminInquiryList({ initialInquiries }: InquiryListProps) {
  const router = useRouter()
  const [inquiries, setInquiries] = useState(initialInquiries)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  
  // Modal states
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null)
  const [isQuotingOpen, setIsQuotingOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  // Form input fields
  const [productCost, setProductCost] = useState("")
  const [shippingFee, setShippingFee] = useState("")
  const [otherFee, setOtherFee] = useState("")

  const openQuoteModal = (inquiry: any) => {
    setSelectedInquiry(inquiry)
    setProductCost("")
    setShippingFee("200") // Default shipping fee placeholder
    setOtherFee("0")
    setErrorMsg("")
    setIsQuotingOpen(true)
  }

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInquiry) return
    setIsSubmitting(true)
    setErrorMsg("")

    try {
      const payload = {
        inquiry_id: selectedInquiry.id,
        product_cost: parseFloat(productCost) || 0,
        shipping_fee: parseFloat(shippingFee) || 0,
        other_fee: parseFloat(otherFee) || 0,
      }

      if (payload.product_cost <= 0) {
        throw new Error("กรุณากรอกค่าสินค้ามากกว่า 0 บาท")
      }

      // Create quotation and update inquiry status
      const res = await fetch("/api/quotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || "Failed to create quotation")
      }

      // Mock Local Storage synchronization
      const isMockEnabled = 
        !process.env.NEXT_PUBLIC_SUPABASE_URL || 
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project')

      if (isMockEnabled && result.data) {
        const quotation = result.data

        // 1. Sync quotations in mock storage
        const localQuotations = JSON.parse(localStorage.getItem('sb-mock-quotations') || '[]')
        localQuotations.push(quotation)
        localStorage.setItem('sb-mock-quotations', JSON.stringify(localQuotations))

        // 2. Update status of the inquiry in mock inquiries to QUOTED
        const localInquiries = JSON.parse(localStorage.getItem('sb-mock-inquiries') || '[]')
        const updatedInquiries = localInquiries.map((inq: any) => 
          inq.id === selectedInquiry.id ? { ...inq, status: 'QUOTED' } : inq
        )
        localStorage.setItem('sb-mock-inquiries', JSON.stringify(updatedInquiries))

        // 3. Sync to in-memory databases via API
        await fetch('/api/mock-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table: 'quotations', data: localQuotations })
        })
        await fetch('/api/mock-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table: 'inquiries', data: updatedInquiries })
        })
      }

      setIsQuotingOpen(false)
      router.refresh()
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการสร้างใบเสนอราคา")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRejectInquiry = async (inquiryId: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการยกเลิกคำขอประเมินราคานี้?")) return

    try {
      // Direct supabase client implementation if needed or update via API (using REST update logic)
      // Since we already have a mockClient we can perform this directly or call standard API.
      // For simplicity, we can do a mock synchronization or API path if implemented.
      const isMockEnabled = 
        !process.env.NEXT_PUBLIC_SUPABASE_URL || 
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project')

      if (isMockEnabled) {
        const localInquiries = JSON.parse(localStorage.getItem('sb-mock-inquiries') || '[]')
        const updatedInquiries = localInquiries.map((inq: any) => 
          inq.id === inquiryId ? { ...inq, status: 'REJECTED' } : inq
        )
        localStorage.setItem('sb-mock-inquiries', JSON.stringify(updatedInquiries))
        await fetch('/api/mock-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table: 'inquiries', data: updatedInquiries })
        })
      }

      router.refresh()
    } catch (err) {
      console.error(err)
      alert("ไม่สามารถปฏิเสธคำขอราคาได้")
    }
  }

  // Filter logic
  const filtered = initialInquiries.filter((inq) => {
    const matchesSearch =
      inq.inquiry_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inq.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inq.phone && inq.phone.includes(searchQuery))
    
    const matchesStatus = statusFilter === "ALL" || inq.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4 bg-white flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="ค้นหา รหัสคำขอ, ชื่อลูกค้า, เบอร์โทร..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="flex h-10 w-full sm:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">สถานะทั้งหมด</option>
            <option value="PENDING">PENDING (รอประเมิน)</option>
            <option value="QUOTED">QUOTED (ส่งใบเสนอราคาแล้ว)</option>
            <option value="REJECTED">REJECTED (ยกเลิก)</option>
          </select>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-4 font-semibold">รหัสคำขอ</th>
                  <th className="px-6 py-4 font-semibold">ลูกค้า</th>
                  <th className="px-6 py-4 font-semibold">ลิงก์สินค้า</th>
                  <th className="px-6 py-4 font-semibold">รายละเอียด / ความต้องการ</th>
                  <th className="px-6 py-4 font-semibold">สถานะ</th>
                  <th className="px-6 py-4 font-semibold text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length > 0 ? (
                  filtered.map((inq: any) => (
                    <tr key={inq.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{inq.inquiry_number}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-800">{inq.customer_name}</p>
                        <p className="text-xs text-slate-500">{inq.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={inq.product_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 max-w-[200px] truncate"
                        >
                          <Globe className="h-4 w-4 shrink-0 text-slate-400" />
                          <span>{inq.product_url}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                        <p className="text-xs text-slate-500 mt-1 font-semibold">จำนวน: {inq.quantity} ชิ้น</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 max-w-[200px] truncate">
                        {inq.remark || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            inq.status === "PENDING"
                              ? "bg-amber-100 text-amber-800"
                              : inq.status === "QUOTED"
                              ? "bg-green-100 text-green-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {inq.status === "PENDING"
                            ? "รอประเมินราคา"
                            : inq.status === "QUOTED"
                            ? "ส่งใบเสนอราคาแล้ว"
                            : "ยกเลิกคำขอ"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {inq.status === "PENDING" ? (
                            <>
                              <Button
                                size="sm"
                                variant="orange"
                                className="cursor-pointer font-bold"
                                onClick={() => openQuoteModal(inq)}
                              >
                                <PlusCircle className="h-4 w-4 mr-1.5" />
                                ทำใบเสนอราคา
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                                onClick={() => handleRejectInquiry(inq.id)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium py-1 px-2 flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ดำเนินการแล้ว
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      ไม่พบข้อมูลรายการคำขอประเมินราคา
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quoting Dialog Modal */}
      {isQuotingOpen && selectedInquiry && (
        <Dialog open={isQuotingOpen} onOpenChange={setIsQuotingOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-slate-900 font-bold">สร้างใบเสนอราคา {selectedInquiry.inquiry_number}</DialogTitle>
              <DialogDescription>
                กรอกรายละเอียดค่าใช้จ่ายเพื่อจัดส่งเสนอราคากลับไปยังหน้าสั่งซื้อของลูกค้า
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateQuotation} className="space-y-4 py-2">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-2">
                <span className="text-xs text-slate-500 uppercase tracking-wider block font-bold">ลิงก์สินค้าต้นฉบับ</span>
                <a
                  href={selectedInquiry.product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-xs hover:underline flex items-center gap-1 truncate"
                >
                  <Globe className="h-4 w-4 shrink-0 text-slate-400" />
                  <span>{selectedInquiry.product_url}</span>
                </a>
                <span className="text-xs text-slate-600 block mt-1 font-semibold">จำนวนสั่งซื้อ: {selectedInquiry.quantity} ชิ้น</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">ค่าสินค้า (บาท) *</label>
                  <Input
                    required
                    type="number"
                    min="1"
                    placeholder="เช่น 1500"
                    value={productCost}
                    onChange={(e) => setProductCost(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">ค่าจัดส่งจีน-ไทย (บาท)</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="เช่น 300"
                    value={shippingFee}
                    onChange={(e) => setShippingFee(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">ค่าธรรมเนียมอื่น ๆ (บาท)</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="เช่น 50"
                    value={otherFee}
                    onChange={(e) => setOtherFee(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center text-sm font-bold mt-4">
                <span className="text-slate-700">รวมราคาสุทธิเสนอขาย:</span>
                <span className="text-primary text-base">
                  ฿ {(
                    (parseFloat(productCost) || 0) +
                    (parseFloat(shippingFee) || 0) +
                    (parseFloat(otherFee) || 0)
                  ).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <DialogFooter className="mt-6 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsQuotingOpen(false)}
                  disabled={isSubmitting}
                  className="cursor-pointer"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  variant="orange"
                  size="sm"
                  disabled={isSubmitting}
                  className="cursor-pointer font-bold"
                >
                  {isSubmitting ? "กำลังส่งใบประเมิน..." : "ยืนยันและส่งราคา"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

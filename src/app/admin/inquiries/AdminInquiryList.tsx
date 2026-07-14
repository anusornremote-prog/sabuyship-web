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
  const [isCleaning, setIsCleaning] = useState(false)
  
  // Modal states
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null)
  const [selectedDetailsInquiry, setSelectedDetailsInquiry] = useState<any | null>(null)
  const [selectedQuote, setSelectedQuote] = useState<any | null>(null)
  const [isQuotingOpen, setIsQuotingOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  // Delete states
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletePin, setDeletePin] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  // Form input fields
  const [productCost, setProductCost] = useState("")
  const [itemCosts, setItemCosts] = useState<Record<number, string>>({})
  const [itemShippingCosts, setItemShippingCosts] = useState<Record<number, string>>({})
  const [shippingCostCnCn, setShippingCostCnCn] = useState("")
  const [otherFee, setOtherFee] = useState("")

  const openQuoteModal = (inquiry: any) => {
    setSelectedInquiry(inquiry)
    setProductCost("")
    setItemCosts({})
    setShippingCostCnCn("")
    setOtherFee("")
    setItemCosts({})
    setItemShippingCosts({})
    setErrorMsg("")
    setIsQuotingOpen(true)
  }

  const openDetailsModal = (inquiry: any) => {
    setSelectedDetailsInquiry(inquiry)
    setIsDetailsOpen(true)
  }

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInquiry) return
    setIsSubmitting(true)
    setErrorMsg("")

    try {
      const isMultiItem = selectedInquiry.items && selectedInquiry.items.length > 0;
      let totalProductCost = 0;
      let totalItemShippingCost = 0;
      let updatedItems = selectedInquiry.items;

      if (isMultiItem) {
        let sumCost = 0;
        let sumShipping = 0;
        updatedItems = selectedInquiry.items.map((item: any, idx: number) => {
          const cost = parseFloat(itemCosts[idx]) || 0;
          const shipping = parseFloat(itemShippingCosts[idx]) || 0;
          sumCost += cost;
          sumShipping += shipping;
          return { ...item, quoted_price: cost, quoted_shipping_cn_cn: shipping };
        });
        totalProductCost = sumCost;
        totalItemShippingCost = sumShipping;
      } else {
        totalProductCost = parseFloat(productCost) || 0;
      }

      const payload = {
        inquiry_id: selectedInquiry.id,
        product_cost: totalProductCost,
        shipping_cost_cn_cn: (parseFloat(shippingCostCnCn) || 0) + totalItemShippingCost,
        other_fee: parseFloat(otherFee) || 0,
        updated_items: isMultiItem ? updatedItems : null,
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


      router.refresh()
    } catch (err) {
      console.error(err)
      alert("ไม่สามารถปฏิเสธคำขอราคาได้")
    }
  }

  const handleCleanupImages = async () => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการล้างรูปภาพเก่าที่เกิน 90 วันทิ้ง? (ข้อมูลข้อความยังอยู่ครบ แต่รูปจะถูกลบเพื่อคืนพื้นที่)")) return
    
    setIsCleaning(true)
    try {
      const res = await fetch("/api/inquiry/cleanup", { method: "POST" })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || "Cleanup failed")
      
      alert(`ล้างรูปภาพสำเร็จแล้ว ${data.count} รูปภาพ จากทั้งหมดที่เจอ ${data.totalFound || 0} รายการ`)
      router.refresh()
    } catch (err: any) {
      console.error(err)
      alert("เกิดข้อผิดพลาด: " + err.message)
    } finally {
      setIsCleaning(false)
    }
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filtered.map((inq: any) => inq.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleDeleteSelected = async () => {
    if (deletePin !== "1234") {
      alert("รหัส PIN ไม่ถูกต้อง")
      return
    }

    try {
      setIsDeleting(true)
      const res = await fetch("/api/inquiry/admin", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || "Failed to delete inquiries")
      }

      setInquiries(prev => prev.filter((inq: any) => !selectedIds.includes(inq.id)))
      setSelectedIds([])
      setIsDeleteModalOpen(false)
      setDeletePin("")
      alert("ลบรายการที่เลือกเรียบร้อยแล้ว")
    } catch (error: any) {
      alert("เกิดข้อผิดพลาด: " + error.message)
    } finally {
      setIsDeleting(false)
    }
  }

  // Filter logic
  const filtered = initialInquiries.filter((inq) => {
    const matchesSearch =
      inq.inquiry_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inq.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inq.phone && inq.phone.includes(searchQuery)) ||
      (inq.items && inq.items.some((item: any) => item.url.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (inq.product_url && inq.product_url.toLowerCase().includes(searchQuery.toLowerCase()))
    
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
            <option value="ORDERED">ORDERED (สั่งซื้อแล้ว)</option>
            <option value="REJECTED">REJECTED (ยกเลิก)</option>
          </select>
          <Button 
            variant="outline" 
            className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 w-full sm:w-auto"
            onClick={handleCleanupImages}
            disabled={isCleaning}
          >
            {isCleaning ? 'กำลังล้าง...' : 'ล้างรูปภาพเก่า (เกิน 90 วัน)'}
          </Button>

          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 font-bold"
              onClick={() => {
                setDeletePin("")
                setIsDeleteModalOpen(true)
              }}
            >
              ลบรายการที่เลือก ({selectedIds.length})
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-4 w-12">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      checked={filtered.length > 0 && selectedIds.length === filtered.length}
                      onChange={handleSelectAll}
                    />
                  </th>
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
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                          checked={selectedIds.includes(inq.id)}
                          onChange={() => handleSelectRow(inq.id)}
                        />
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">{inq.inquiry_number}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-800">{inq.customer_name}</p>
                        <p className="text-sm font-semibold text-primary mt-1">
                          {inq.customer?.customer_code || "ไม่มีรหัส"} {inq.shipping_type === 'BOAT' ? '(SEA) 🛳️' : '(EK) 🚚'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {inq.items && inq.items.length > 1 ? (
                          <div className="space-y-2">
                            <span className="font-semibold text-primary block">รวม {inq.items.length} รายการ</span>
                            <Button variant="outline" size="sm" onClick={() => openDetailsModal(inq)} className="text-xs">
                              👀 ดูรายละเอียด
                            </Button>
                          </div>
                        ) : (
                          <>
                            <a
                              href={inq.items && inq.items.length === 1 ? inq.items[0].url : inq.product_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1 max-w-[200px] truncate"
                            >
                              <Globe className="h-4 w-4 shrink-0 text-slate-400" />
                              <span>{inq.items && inq.items.length === 1 ? inq.items[0].url : inq.product_url}</span>
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                            <p className="text-xs text-slate-500 mt-1 font-semibold">จำนวน: {inq.items && inq.items.length === 1 ? inq.items[0].quantity : inq.quantity} ชิ้น</p>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 max-w-[200px] truncate">
                        {inq.items && inq.items.length > 1 ? (
                          <span className="text-slate-400 italic">กรุณากดดูรายละเอียด</span>
                        ) : (
                          <>
                            {inq.items && inq.items.length === 1 ? (inq.items[0].remark || "-") : (inq.remark || "-")}
                            {((inq.items && inq.items.length === 1 && inq.items[0].image_url) || inq.image_url) && (
                              <div className="mt-2">
                                <a href={inq.items && inq.items.length === 1 ? inq.items[0].image_url : inq.image_url} target="_blank" rel="noopener noreferrer">
                                  <img src={inq.items && inq.items.length === 1 ? inq.items[0].image_url : inq.image_url} alt="Attached" className="h-10 w-10 object-cover rounded border border-slate-200 hover:opacity-80 transition-opacity cursor-zoom-in" />
                                </a>
                              </div>
                            )}
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            (inq.status === "ORDERED" || (inq.quotations && inq.quotations.some((q: any) => q.orders && q.orders.length > 0)))
                              ? "bg-emerald-100 text-emerald-800"
                              : inq.status === "PENDING"
                              ? "bg-amber-100 text-amber-800"
                              : inq.status === "QUOTED"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {(inq.status === "ORDERED" || (inq.quotations && inq.quotations.some((q: any) => q.orders && q.orders.length > 0)))
                            ? "ลูกค้าสั่งซื้อแล้ว"
                            : inq.status === "PENDING"
                            ? "รอแอดมินประเมินราคา"
                            : inq.status === "QUOTED"
                            ? "แอดมินเสนอราคาแล้ว (รอสั่งซื้อ)"
                            : "ยกเลิกคำขอ"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {inq.status === "PENDING" ? (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer font-bold"
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
                          ) : inq.quotations && inq.quotations.length > 0 ? (
                            <Button
                              size="sm"
                              variant="orange"
                              className="font-bold cursor-pointer"
                              onClick={() => setSelectedQuote({ ...inq.quotations[0], inquiry: inq })}
                            >
                              <FileText className="h-4 w-4 mr-1.5" />
                              ดูใบเสนอราคา
                            </Button>
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
                <span className="text-xs text-slate-500 uppercase tracking-wider block font-bold">รายการสินค้าและประเมินราคา</span>
                {selectedInquiry.items && selectedInquiry.items.length > 0 ? (
                  <div className="space-y-3 max-h-60 overflow-y-auto bg-slate-50 p-2 rounded border border-slate-100">
                    {selectedInquiry.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex flex-col gap-2 p-2 bg-white rounded border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center text-xs">
                           <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[200px]">
                             {idx + 1}. {item.url}
                           </a>
                           <span className="font-semibold text-slate-600 whitespace-nowrap">จำนวน: {item.quantity}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-semibold text-slate-500 uppercase">ค่าสินค้า (บาท):</label>
                            <Input
                              required
                              type="number"
                              min="0"
                              placeholder="ราคาชิ้นนี้"
                              className="h-8 text-xs"
                              value={itemCosts[idx] || ""}
                              onChange={(e) => setItemCosts({ ...itemCosts, [idx]: e.target.value })}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-semibold text-slate-500 uppercase">ค่าจัดส่งจีน-จีน (ถ้ามี):</label>
                            <Input
                              type="number"
                              min="0"
                              placeholder="ค่าจัดส่งชิ้นนี้"
                              className="h-8 text-xs"
                              value={itemShippingCosts[idx] || ""}
                              onChange={(e) => setItemShippingCosts({ ...itemShippingCosts, [idx]: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {(!selectedInquiry.items || selectedInquiry.items.length === 0) && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">ค่าสินค้ารวม (บาท) *</label>
                    <Input
                      required
                      type="number"
                      min="1"
                      placeholder="เช่น 1500"
                      value={productCost}
                      onChange={(e) => setProductCost(e.target.value)}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {selectedInquiry.items && selectedInquiry.items.length > 0 
                      ? 'ค่าส่งรวมทั้งหมด (จีน-จีน)' 
                      : 'ค่าจัดส่ง จีน-จีน (ถ้ามี)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500">฿</span>
                    {selectedInquiry.items && selectedInquiry.items.length > 0 ? (
                      <Input 
                        type="number" 
                        disabled
                        className="pl-8 bg-slate-100 font-bold"
                        value={Object.values(itemShippingCosts).reduce((sum, cost) => sum + (parseFloat(cost as string) || 0), 0)}
                      />
                    ) : (
                      <Input 
                        type="number" 
                        min="0"
                        className="pl-8 bg-white"
                        value={shippingCostCnCn}
                        onChange={(e) => setShippingCostCnCn(e.target.value)}
                      />
                    )}
                  </div>
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
                    (selectedInquiry?.items && selectedInquiry.items.length > 0 
                      ? Object.values(itemCosts).reduce((sum, cost) => sum + (parseFloat(cost as string) || 0), 0) +
                        Object.values(itemShippingCosts).reduce((sum, cost) => sum + (parseFloat(cost as string) || 0), 0)
                      : parseFloat(productCost) || 0) +
                    (parseFloat(shippingCostCnCn) || 0) +
                    (parseFloat(otherFee) || 0)
                  ).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <DialogFooter className="mt-6 sm:justify-between">
                <Button type="button" variant="outline" onClick={() => setIsQuotingOpen(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={isSubmitting} variant="default" className="w-full sm:w-auto">
                  {isSubmitting ? "กำลังบันทึก..." : "ส่งใบเสนอราคาให้ลูกค้า"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Details Dialog Modal */}
      {isDetailsOpen && selectedDetailsInquiry && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen} className="max-w-6xl w-[95vw]">
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-slate-900 font-bold text-xl">รายละเอียดคำขอ {selectedDetailsInquiry.inquiry_number}</DialogTitle>
              <DialogDescription>
                รายการสินค้าทั้งหมดในคำขอนี้
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
                  {selectedDetailsInquiry.items?.map((item: any, idx: number) => (
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
                  ))}
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

      {/* Quotation Detail Modal */}
      {selectedQuote && (
        <Dialog open={!!selectedQuote} onOpenChange={(open) => !open && setSelectedQuote(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="border-b border-slate-100 pb-4">
              <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                รายละเอียดใบเสนอราคา
              </DialogTitle>
              <DialogDescription className="text-slate-500 font-medium mt-1">
                รหัสอ้างอิง: <span className="text-slate-800 font-bold">{selectedQuote.inquiry?.inquiry_number}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">ชื่อลูกค้า</span>
                  <span className="font-semibold text-slate-800 block">{selectedQuote.inquiry?.customer_name || "-"}</span>
                  <span className="text-xs font-semibold text-primary mt-0.5 inline-block bg-primary/10 px-1.5 py-0.5 rounded">
                    {selectedQuote.inquiry?.customer?.customer_code || "ไม่มีรหัส"} {selectedQuote.inquiry?.shipping_type === 'BOAT' ? '(SEA) 🛳️' : '(EK) 🚚'}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">สถานะปัจจุบัน</span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full inline-block ${
                      selectedQuote.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' :
                      selectedQuote.status === 'SENT' ? 'bg-blue-100 text-blue-800' :
                      'bg-slate-200 text-slate-800'
                    }`}>
                      {selectedQuote.status}
                    </span>
                </div>
              </div>

              <div className="space-y-3 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                <h4 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2 mb-3">รายละเอียดสินค้าที่สั่งซื้อ</h4>
                
                {selectedQuote.inquiry?.items && selectedQuote.inquiry.items.length > 0 ? (
                  <div className="space-y-3 mb-4">
                    {selectedQuote.inquiry.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-start text-xs border-b border-dashed border-slate-100 pb-2">
                        <div className="flex-1 pr-2 truncate">
                          <span className="font-semibold block truncate text-slate-700">รายการที่ {idx + 1}: {item.url}</span>
                          <span className="text-slate-500">จำนวน: {item.quantity} ชิ้น</span>
                        </div>
                        <div className="text-right whitespace-nowrap">
                          <div className="font-bold text-slate-800">฿ {Number(item.quoted_price || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</div>
                          <div className="text-[10px] text-slate-500">ค่าส่ง: ฿ {Number(item.quoted_shipping_cn_cn || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 mb-4 italic">ไม่พบรายละเอียดสินค้าย่อย</div>
                )}

                <h4 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2 mb-3">สรุปค่าใช้จ่ายทั้งหมด</h4>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 font-medium">ค่าสินค้า</span>
                  <span className="font-bold text-slate-900">฿ {Number(selectedQuote.product_cost || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 font-medium">ค่าจัดส่ง จีน-จีน</span>
                  <span className="font-bold text-slate-900">฿ {Number(selectedQuote.shipping_cost_cn_cn || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 font-medium">ค่าธรรมเนียมอื่น ๆ</span>
                  <span className="font-bold text-slate-900">฿ {Number(selectedQuote.other_fee || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                </div>
                
                <div className="flex justify-between items-center pt-3 mt-3 border-t border-dashed border-slate-200">
                  <span className="font-bold text-slate-900 text-base">ยอดรวมสุทธิ</span>
                  <span className="text-xl font-black text-primary">฿ {Number(selectedQuote.total_price || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="button" variant="outline" className="font-bold cursor-pointer" onClick={() => setSelectedQuote(null)}>
                ปิดหน้าต่าง
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

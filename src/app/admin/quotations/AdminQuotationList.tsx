"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Edit, FileText, CheckCircle2, Send, XCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/custom-dialog"

export default function AdminQuotationList({ initialQuotations }: { initialQuotations: any[] }) {
  const [quotations] = useState(initialQuotations)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [selectedQuote, setSelectedQuote] = useState<any | null>(null)

  const filtered = quotations.filter((quote) => {
    const matchesSearch =
      quote.inquiry?.inquiry_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.inquiry?.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === "ALL" || quote.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <>
      <Card className="shadow-sm border-slate-100/60 rounded-xl overflow-hidden">
        <CardContent className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
             <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
             <Input 
                placeholder="ค้นหา รหัสใบเสนอราคา, ลูกค้า..." 
                className="pl-9 bg-slate-50 border-transparent focus:bg-white transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
          </div>
          <select 
            className="flex h-10 w-full sm:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none transition-colors"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">สถานะทั้งหมด</option>
            <option value="DRAFT">DRAFT (ร่าง)</option>
            <option value="SENT">SENT (ส่งแล้ว)</option>
            <option value="ACCEPTED">ACCEPTED (อนุมัติแล้ว)</option>
          </select>
        </CardContent>
        <CardContent className="p-0 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-semibold tracking-wider">รหัสอ้างอิง (Inquiry)</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">ยอดรวมสุทธิ</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">วันที่สร้าง</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">สถานะ</th>
                  <th className="px-6 py-4 font-semibold tracking-wider text-right">การจัดการ</th>
                </tr>
              </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length > 0 ? (
                    filtered.map((quote: any) => (
                      <tr key={quote.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{quote.inquiry?.inquiry_number || '-'}</p>
                          <p className="text-xs font-medium text-slate-500 mt-0.5">{quote.inquiry?.customer_name || 'ลูกค้าทั่วไป'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-primary text-base">฿ {Number(quote.total_price || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</p>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-600">
                          {quote.created_at ? new Date(quote.created_at).toLocaleString('th-TH') : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                            quote.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' :
                            quote.status === 'SENT' ? 'bg-blue-100 text-blue-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {quote.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            size="sm" 
                            variant="orange" 
                            className="font-bold cursor-pointer shadow-sm shadow-orange-600/10"
                            onClick={() => setSelectedQuote(quote)}
                          >
                            <FileText className="h-4 w-4 mr-1.5" />
                            ดูรายละเอียด
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center">
                          <FileText className="h-10 w-10 text-slate-200 mb-3" />
                          <p className="font-medium">ยังไม่มีรายการใบเสนอราคา</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
                  <span className="font-semibold text-slate-800">{selectedQuote.inquiry?.customer_name || "-"}</span>
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
                <h4 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2 mb-3">สรุปค่าใช้จ่าย</h4>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 font-medium">ค่าสินค้า</span>
                  <span className="font-bold text-slate-900">฿ {Number(selectedQuote.product_cost || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 font-medium">ค่าจัดส่งจีน-ไทย</span>
                  <span className="font-bold text-slate-900">฿ {Number(selectedQuote.shipping_fee || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
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
    </>
  )
}

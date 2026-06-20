import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Send, Edit } from "lucide-react"
import { Input } from "@/components/ui/input"

import { createClient } from "@/lib/supabase/server"

export default async function AdminQuotations() {
  const supabase = await createClient()

  const { data: quotations } = await supabase
    .from("quotations")
    .select(`
      id,
      total_price,
      status,
      created_at,
      inquiry:inquiry_id (
        inquiry_number,
        customer_name
      )
    `)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">จัดการใบเสนอราคา</h1>
          <p className="text-slate-600">สร้าง ส่ง และติดตามสถานะใบเสนอราคา</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4 border-b bg-slate-50/50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
             <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
             <Input placeholder="ค้นหา รหัสใบเสนอราคา, ลูกค้า..." className="pl-9" />
          </div>
          <select className="flex h-10 w-full sm:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <option>สถานะทั้งหมด</option>
            <option>DRAFT (ร่าง)</option>
            <option>SENT (ส่งแล้ว)</option>
            <option>ACCEPTED (อนุมัติแล้ว)</option>
          </select>
        </CardContent>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium">รหัสอ้างอิง (Inquiry)</th>
                  <th className="px-6 py-4 font-medium">ยอดรวม</th>
                  <th className="px-6 py-4 font-medium">วันที่</th>
                  <th className="px-6 py-4 font-medium">สถานะ</th>
                  <th className="px-6 py-4 font-medium text-right">จัดการ</th>
                </tr>
              </thead>
                <tbody>
                  {quotations && quotations.length > 0 ? (
                    quotations.map((quote: any) => (
                      <tr key={quote.id} className="border-b hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-primary">{quote.inquiry?.inquiry_number || '-'}</p>
                          <p className="text-xs text-slate-500">{quote.inquiry?.customer_name || 'ลูกค้าทั่วไป'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium">฿ {Number(quote.total_price || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {quote.created_at ? new Date(quote.created_at).toLocaleString('th-TH') : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${
                            quote.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                            quote.status === 'SENT' ? 'bg-blue-100 text-blue-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {quote.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4 mr-1" />
                            ดูรายละเอียด
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400">ยังไม่มีรายการใบเสนอราคา</td>
                    </tr>
                  )}
                </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

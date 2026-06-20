import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Send, Edit } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function AdminQuotations() {
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
                {/* Mock Data */}
                <tr className="border-b hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-primary">INQ-240001</p>
                    <p className="text-xs text-slate-500">สมชาย ใจดี</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium">฿ 4,500.00</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600">15 มิ.ย. 2024</td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-800 text-xs font-medium px-2.5 py-0.5 rounded">DRAFT</span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button size="sm" variant="ghost">
                      <Edit className="h-4 w-4 mr-1" />
                      แก้ไข
                    </Button>
                    <Button size="sm" variant="default" className="bg-primary hover:bg-primary/90">
                      <Send className="h-4 w-4 mr-1" />
                      ส่งให้ลูกค้า
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileQuestion, FileText, Package } from "lucide-react"

export default function AdminOverview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">ภาพรวมระบบ (Admin Dashboard)</h1>
        <p className="text-slate-600">ข้อมูลสรุปการทำงานของ Sabuy Ship</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">คำขอประเมินราคา (รอตรวจสอบ)</CardTitle>
            <FileQuestion className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">5</div>
            <p className="text-xs text-slate-500 mt-1">คำขอใหม่วันนี้ 2 รายการ</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">ใบเสนอราคา (รอชำระเงิน)</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">12</div>
            <p className="text-xs text-slate-500 mt-1">มูลค่ารวม ฿ 125,400</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">คำสั่งซื้อ (กำลังดำเนินการ)</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">34</div>
            <p className="text-xs text-slate-500 mt-1">อยู่ระหว่างขนส่ง 28 รายการ</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">ลูกค้าทั้งหมด</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">1,204</div>
            <p className="text-xs text-slate-500 mt-1">เพิ่มขึ้น 12 คนในสัปดาห์นี้</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>คำขอประเมินราคาล่าสุด</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1,2,3].map((i) => (
                <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-sm">INQ-2400{i}</p>
                    <p className="text-xs text-slate-500">ลูกค้า: สมชาย ใจดี</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">PENDING</span>
                    <p className="text-xs text-slate-500 mt-1">10 นาทีที่แล้ว</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>อัปเดตสถานะขนส่งล่าสุด</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1,2,3].map((i) => (
                <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-sm text-primary">ORD-2401{i}</p>
                    <p className="text-xs text-slate-500">อัปเดต: สินค้าถึงโกดังไทย</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">TH_WAREHOUSE</span>
                    <p className="text-xs text-slate-500 mt-1">1 ชม. ที่แล้ว</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

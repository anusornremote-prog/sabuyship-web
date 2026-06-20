import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Truck, Clock, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardOverview() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
    profile = data
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || "ลูกค้า Sabuy Ship"

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">ภาพรวม</h1>
          <p className="text-slate-600">ยินดีต้อนรับคุณ {displayName} เข้าสู่ระบบลูกค้า Sabuy Ship</p>
        </div>
      </div>

      {profile?.customer_code && (
        <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50/50 shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                    Logistics Account
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  รหัสสมาชิกลูกค้า: <span className="text-primary text-3xl font-extrabold tracking-wider">{profile.customer_code}</span>
                </h2>
                <div className="text-sm text-slate-600 space-y-2 leading-relaxed">
                  <p>
                    <strong>คำแนะนำสำหรับการสั่งซื้อสินค้าจีน:</strong> เพื่อความถูกต้องและรวดเร็วในการนำเข้า โปรดระบุรหัสลูกค้าของคุณต่อท้ายชื่อผู้รับในข้อมูลที่อยู่ส่งของโกดังจีนทุกครั้ง ตัวอย่างเช่น: 
                  </p>
                  <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100/60 font-medium text-slate-800 text-xs md:text-sm inline-block">
                    ชื่อผู้รับ (Consignee Name): <span className="text-primary font-bold">ชื่อของคุณ ({profile.customer_code})</span>
                  </div>
                </div>
              </div>
              
              <div className="w-full lg:w-80 flex-shrink-0 bg-white p-4 rounded-xl border border-blue-100 shadow-sm space-y-3">
                <h3 className="font-semibold text-sm text-slate-800 border-b pb-2 flex items-center gap-2">
                  🇨🇳 ที่อยู่โกดังจีน (กวางโจว)
                </h3>
                <div className="text-xs text-slate-600 space-y-2 font-mono">
                  <div>
                    <strong className="text-slate-800 block">ผู้รับ (Consignee Name):</strong>
                    <span className="bg-slate-50 px-1 py-0.5 rounded block border border-slate-100 mt-0.5">SBS / {profile.customer_code}</span>
                  </div>
                  <div>
                    <strong className="text-slate-800 block">เบอร์โทรศัพท์ (Phone):</strong>
                    <span className="bg-slate-50 px-1 py-0.5 rounded block border border-slate-100 mt-0.5">13800138000</span>
                  </div>
                  <div>
                    <strong className="text-slate-800 block">ที่อยู่โกดัง (Address):</strong>
                    <span className="bg-slate-50 px-1 py-0.5 rounded block border border-slate-100 mt-0.5">广东省广州市白云区石井街道 (SBS / {profile.customer_code})</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">คำสั่งซื้อทั้งหมด</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">12</div>
            <p className="text-xs text-slate-500 mt-1">อัปเดตล่าสุดวันนี้</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-orange-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">อยู่ระหว่างดำเนินการ</CardTitle>
            <Clock className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">3</div>
            <p className="text-xs text-slate-500 mt-1">สินค้าอยู่ระหว่างทาง</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">จัดส่งสำเร็จแล้ว</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">9</div>
            <p className="text-xs text-slate-500 mt-1">ส่งถึงหน้าบ้าน</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">รอชำระเงิน / อนุมัติ</CardTitle>
            <Truck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">1</div>
            <p className="text-xs text-slate-500 mt-1">ใบเสนอราคาใหม่</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4">สถานะคำสั่งซื้อล่าสุด</h2>
        <Card className="shadow-sm">
          <CardContent className="p-0">
             <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-4 font-medium">หมายเลขคำสั่งซื้อ</th>
                    <th className="px-6 py-4 font-medium">วันที่</th>
                    <th className="px-6 py-4 font-medium">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="px-6 py-4 font-medium text-primary">ORD-240001</td>
                    <td className="px-6 py-4 text-slate-600">15 มิ.ย. 2024</td>
                    <td className="px-6 py-4"><span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded">กำลังจัดส่ง</span></td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-6 py-4 font-medium text-primary">ORD-240002</td>
                    <td className="px-6 py-4 text-slate-600">14 มิ.ย. 2024</td>
                    <td className="px-6 py-4"><span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">รอชำระเงิน</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

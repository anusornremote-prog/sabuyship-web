import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, Truck, Clock, CheckCircle2, ShoppingBag, ArrowRight, ExternalLink, Box, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { CustomerWarehouseCard } from "@/components/dashboard/CustomerWarehouseCard"

export default async function DashboardOverview() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
    profile = data
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || "ลูกค้า Sabuy Ship"

  // Fetch real order stats concurrently
  const [
    { count: totalOrders },
    { count: pendingOrders },
    { count: completedOrders },
    { count: waitingPayment },
    { data: recentOrders },
    { data: recentShipments }
  ] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("customer_id", user?.id),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("customer_id", user?.id).neq("status", "DELIVERED"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("customer_id", user?.id).eq("status", "DELIVERED"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("customer_id", user?.id).eq("status", "WAITING_PAYMENT"),
    supabase.from("orders").select("id, order_number, status, created_at").eq("customer_id", user?.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("shipments").select("*").eq("customer_id", user?.id).order("created_at", { ascending: false }).limit(5)
  ])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'WAITING_PAYMENT': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'PAID': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'CHINA_WAREHOUSE': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'SHIPPING': return 'bg-sky-100 text-sky-800 border-sky-200'
      case 'THAILAND_WAREHOUSE': return 'bg-teal-100 text-teal-800 border-teal-200'
      case 'DELIVERED': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      default: return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'NEW': return 'รอดำเนินการ'
      case 'WAITING_PAYMENT': return 'รอชำระเงิน'
      case 'PAID': return 'ชำระเงินแล้ว'
      case 'ORDERED': return 'สั่งซื้อสำเร็จ'
      case 'CHINA_WAREHOUSE': return 'ถึงโกดังจีน'
      case 'SHIPPING': return 'อยู่ระหว่างจัดส่ง'
      case 'THAILAND_WAREHOUSE': return 'ถึงโกดังไทย'
      case 'DELIVERED': return 'จัดส่งสำเร็จ'
      default: return status
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      {/* 1. Welcome Greeting Banner */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            ภาพรวมบัญชี (Dashboard)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ยินดีต้อนรับคุณ <strong className="text-slate-800">{displayName}</strong> เข้าสู่ระบบลูกค้า Sabuy Ship
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/inquiry">
            <Button variant="orange" className="font-bold text-sm h-11 px-5 rounded-xl shadow-md cursor-pointer">
              + ขอใบเสนอราคาใหม่
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Customer Logistics Account & China Warehouse Card */}
      {profile?.customer_code ? (
        <CustomerWarehouseCard customerCode={profile.customer_code} />
      ) : null}

      {/* 3. Stat Cards (Balanced 4-Column Grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* Total Orders */}
        <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">คำสั่งซื้อทั้งหมด</span>
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-primary flex items-center justify-center">
                <Package className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 tracking-tight">{totalOrders || 0}</div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">รวมทุกคำสั่งซื้อในระบบ</p>
            </div>
          </CardContent>
        </Card>
        
        {/* In Transit */}
        <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">อยู่ระหว่างดำเนินการ</span>
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-orange-600 tracking-tight">{pendingOrders || 0}</div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">พัสดุอยู่ระหว่างนำเข้า</p>
            </div>
          </CardContent>
        </Card>

        {/* Waiting Payment */}
        <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">รอชำระเงิน</span>
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Truck className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-amber-600 tracking-tight">{waitingPayment || 0}</div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">มีรายการรอตรวจสอบยอด</p>
            </div>
          </CardContent>
        </Card>

        {/* Completed */}
        <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">จัดส่งสำเร็จแล้ว</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-emerald-600 tracking-tight">{completedOrders || 0}</div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">พัสดุส่งถึงปลายทางแล้ว</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Recent Orders Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-black text-slate-900">
            สถานะคำสั่งซื้อล่าสุด (Recent Orders)
          </h2>
          <Link href="/dashboard/orders">
            <Button variant="ghost" size="sm" className="text-primary text-xs font-bold hover:underline cursor-pointer">
              ดูทั้งหมด ➔
            </Button>
          </Link>
        </div>

        <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs font-bold text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">หมายเลขคำสั่งซื้อ (Order Number)</th>
                    <th className="px-6 py-4">วันที่ทำรายการ</th>
                    <th className="px-6 py-4">สถานะปัจจุบัน</th>
                    <th className="px-6 py-4 text-right">การกระทำ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders && recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <Link href={`/dashboard/orders/${order.order_number}`} className="font-bold text-primary hover:underline font-mono">
                            {order.order_number}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-xs font-medium">
                          {new Date(order.created_at).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getStatusBadge(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/dashboard/orders/${order.order_number}`}>
                            <Button variant="ghost" size="sm" className="text-xs text-slate-600 hover:text-primary font-bold cursor-pointer">
                              ดูรายละเอียด
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">
                        <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        ยังไม่มีรายการคำสั่งซื้อในขณะนี้
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Chinese Warehouse Incoming Parcels Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-black text-slate-900">
            พัสดุนำเข้า / สินค้าโกดังจีนล่าสุด (Shipments)
          </h2>
          <Link href="/dashboard/orders">
            <Button variant="ghost" size="sm" className="text-primary text-xs font-bold hover:underline cursor-pointer">
              ดูทั้งหมด ➔
            </Button>
          </Link>
        </div>

        <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs font-bold text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">เลขแทร็ก (Tracking Number)</th>
                    <th className="px-6 py-4">ชื่อสินค้า</th>
                    <th className="px-6 py-4">วันที่เข้าตู้</th>
                    <th className="px-6 py-4 text-right">ค่าขนส่ง</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentShipments && recentShipments.length > 0 ? (
                    recentShipments.map((shipment) => (
                      <tr key={shipment.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-800 text-xs">
                          {shipment.tracking_number || "-"}
                        </td>
                        <td className="px-6 py-4 text-slate-700 text-xs font-medium">
                          {shipment.product_name || "-"}
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs">
                          {shipment.container_date || "-"}
                        </td>
                        <td className="px-6 py-4 text-right text-emerald-600 font-bold text-xs">
                          {shipment.shipping_cost ? `${shipment.shipping_cost} ฿` : "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">
                        <Truck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        ยังไม่มีรายการพัสดุนำเข้า
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

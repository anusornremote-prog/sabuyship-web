import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileQuestion, FileText, Package } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export default async function AdminOverview() {
  const supabase = await createClient()

  // Fetch Pending Inquiries
  const { count: pendingInquiriesCount } = await supabase
    .from("inquiries")
    .select("*", { count: 'exact', head: true })
    .eq("status", "PENDING")

  // Fetch Waiting Payment Orders and calculate total value
  const { data: waitingPaymentOrders } = await supabase
    .from("orders")
    .select("id, quotation:quotation_id(total_price)")
    .eq("status", "WAITING_PAYMENT")

  const waitingPaymentCount = waitingPaymentOrders?.length || 0
  const waitingPaymentTotal = waitingPaymentOrders?.reduce((sum: number, order: any) => {
    return sum + Number(order.quotation?.total_price || 0)
  }, 0) || 0

  // Fetch Active Shipping Orders
  const { count: shippingOrdersCount } = await supabase
    .from("orders")
    .select("*", { count: 'exact', head: true })
    .in("status", ["CHINA_WAREHOUSE", "SHIPPING", "THAILAND_WAREHOUSE", "OUT_FOR_DELIVERY"])

  // Fetch Total Customers
  const { count: customersCount } = await supabase
    .from("profiles")
    .select("*", { count: 'exact', head: true })
    .eq("role", "CUSTOMER")

  // Fetch Recent Inquiries for list
  const { data: recentInquiries } = await supabase
    .from("inquiries")
    .select(`
      id,
      product_url,
      status,
      created_at,
      customer:customer_id(full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(5)

  // Fetch Recent Tracking Updates for list
  const { data: recentTracking } = await supabase
    .from("tracking_logs")
    .select(`
      id,
      status,
      notes,
      created_at,
      order:order_id(order_number)
    `)
    .order("created_at", { ascending: false })
    .limit(5)

  const formatCurrency = (amount: number) => {
    return `฿ ${amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-orange-100 text-orange-800'
      case 'QUOTED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-rose-100 text-rose-800'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'CHINA_WAREHOUSE': return 'bg-purple-100 text-purple-800'
      case 'SHIPPING': return 'bg-sky-100 text-sky-800'
      case 'THAILAND_WAREHOUSE': return 'bg-teal-100 text-teal-800'
      case 'DELIVERED': return 'bg-emerald-100 text-emerald-800'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">ภาพรวมระบบ (Admin Dashboard)</h1>
        <p className="text-slate-600">ข้อมูลสรุปการทำงานของ Sabuy Ship (Real-time)</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">คำขอประเมินราคา (รอตรวจสอบ)</CardTitle>
            <FileQuestion className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{pendingInquiriesCount || 0}</div>
            <p className="text-xs text-slate-500 mt-1">รอการประเมินราคาจากเจ้าหน้าที่</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">ใบเสนอราคา (รอชำระเงิน)</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{waitingPaymentCount}</div>
            <p className="text-xs text-slate-500 mt-1">มูลค่ารวม {formatCurrency(waitingPaymentTotal)}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">คำสั่งซื้อ (กำลังดำเนินการ)</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{shippingOrdersCount || 0}</div>
            <p className="text-xs text-slate-500 mt-1">อยู่ระหว่างการขนส่ง (จีน-ไทย)</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">ลูกค้าทั้งหมด</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{customersCount || 0}</div>
            <p className="text-xs text-slate-500 mt-1">ผู้ใช้งานในระบบ Sabuy Ship</p>
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
              {recentInquiries && recentInquiries.length > 0 ? (
                recentInquiries.map((inq: any) => (
                  <div key={inq.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-medium text-sm truncate">{inq.product_url}</p>
                      <p className="text-xs text-slate-500">ลูกค้า: {inq.customer?.full_name || '-'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`${getStatusBadge(inq.status)} text-xs px-2 py-1 rounded font-semibold`}>
                        {inq.status}
                      </span>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(inq.created_at).toLocaleDateString('th-TH')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm text-center py-4">ไม่มีคำขอประเมินราคา</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>อัปเดตสถานะขนส่งล่าสุด</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTracking && recentTracking.length > 0 ? (
                recentTracking.map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-medium text-sm text-primary">{log.order?.order_number || 'Unknown'}</p>
                      <p className="text-xs text-slate-500 truncate">{log.notes || 'อัปเดตสถานะแล้ว'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`${getOrderStatusBadge(log.status)} text-xs px-2 py-1 rounded font-semibold`}>
                        {log.status}
                      </span>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(log.created_at).toLocaleDateString('th-TH')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm text-center py-4">ไม่มีประวัติการขนส่ง</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Users, FileQuestion, FileText, Package, ArrowRight, Clock3, Warehouse, Ship, Truck, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { DashboardChartsWrapper } from "@/components/admin/DashboardChartsWrapper"

export default async function AdminOverview() {
  try {
    const supabase = await createClient()

  // Prepare date for charts
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString()

  const [pendingResult, waitingResult, shippingResult, activeResult, customersResult,
    recentInquiriesResult, recentTrackingResult, chartInquiriesResult, chartOrdersResult] = await Promise.all([
    supabase.from("inquiries").select("*", { count: 'exact', head: true }).eq("status", "PENDING").is("archived_at", null),
    supabase.from("orders").select("id, quotation:quotation_id(total_price)").eq("status", "WAITING_PAYMENT"),
    supabase.from("orders").select("*", { count: 'exact', head: true }).in("status", ["CHINA_WAREHOUSE", "SHIPPING", "THAILAND_WAREHOUSE", "OUT_FOR_DELIVERY"]),
    supabase.from("orders").select("status, payment_round_1_status, payment_round_2_status, payment_round_3_status").neq("status", "DELIVERED").neq("status", "CANCELED"),
    supabase.from("profiles").select("*", { count: 'exact', head: true }).eq("role", "CUSTOMER"),
    supabase.from("inquiries").select(`id, product_url, status, created_at, customer:customer_id(full_name)`).is("archived_at", null).order("created_at", { ascending: false }).limit(5),
    supabase.from("tracking_logs").select(`id, status, notes, created_at, order:order_id(order_number)`).order("created_at", { ascending: false }).limit(5),
    supabase.from("inquiries").select("created_at").is("archived_at", null).gte("created_at", thirtyDaysAgoStr),
    supabase.from("orders").select("created_at, quotation:quotation_id(total_price)").gte("created_at", thirtyDaysAgoStr),
  ])
  const results = [pendingResult, waitingResult, shippingResult, activeResult, customersResult,
    recentInquiriesResult, recentTrackingResult, chartInquiriesResult, chartOrdersResult]
  const firstError = results.find((result) => result.error)?.error
  if (firstError) throw firstError
  const pendingInquiriesCount = pendingResult.count
  const waitingPaymentOrders = waitingResult.data
  const shippingOrdersCount = shippingResult.count
  const activeOrders = activeResult.data
  const customersCount = customersResult.count
  const recentInquiries = recentInquiriesResult.data
  const recentTracking = recentTrackingResult.data
  const chartInquiries = chartInquiriesResult.data
  const chartOrders = chartOrdersResult.data

  const bangkokDateParts = (date: Date) => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date)
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
    return { key: `${values.year}-${values.month}-${values.day}`, label: `${Number(values.day)}/${Number(values.month)}` }
  }

  const waitingPaymentCount = waitingPaymentOrders?.length || 0
  const waitingPaymentTotal = waitingPaymentOrders?.reduce((sum: number, order: any) => {
    return sum + Number(order.quotation?.total_price || 0)
  }, 0) || 0

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

  const getInquiryStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'รอตรวจสอบ'
      case 'QUOTED': return 'เสนอราคาแล้ว'
      case 'REJECTED': return 'ไม่รับดำเนินการ'
      default: return 'กำลังดำเนินการ'
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

  const getOrderStatusLabel = (status: string) => {
    switch (status) {
      case 'NEW': return 'สร้างคำสั่งซื้อแล้ว'
      case 'WAITING_PAYMENT': return 'รอชำระค่าสินค้า'
      case 'ORDERED': return 'สั่งซื้อจากร้านจีนแล้ว'
      case 'CHINA_WAREHOUSE': return 'ถึงโกดังจีน'
      case 'SHIPPING': return 'กำลังขนส่งมาไทย'
      case 'THAILAND_WAREHOUSE': return 'ถึงโกดังไทย'
      case 'OUT_FOR_DELIVERY': return 'กำลังนำส่งลูกค้า'
      case 'DELIVERED': return 'จัดส่งสำเร็จ'
      default: return 'อัปเดตสถานะแล้ว'
    }
  }

  const getProductSource = (productUrl: string) => {
    try {
      const hostname = new URL(productUrl).hostname.replace(/^www\./, '')
      if (hostname.includes('1688')) return 'สินค้า 1688'
      if (hostname.includes('taobao')) return 'สินค้า Taobao'
      if (hostname.includes('tmall')) return 'สินค้า Tmall'
      if (hostname.includes('pinduoduo')) return 'สินค้า Pinduoduo'
      return `สินค้าจาก ${hostname}`
    } catch {
      return 'รายการสินค้า'
    }
  }

  const pipeline = [
    {
      label: 'รอชำระรอบ 1',
      hint: 'ค่าสินค้า',
      icon: Clock3,
      count: activeOrders?.filter((order) => order.status === 'WAITING_PAYMENT' && order.payment_round_1_status !== 'PAID').length || 0,
      tone: 'bg-amber-50 text-amber-700 border-amber-200',
      href: '/admin/orders?status=WAITING_PAYMENT',
    },
    {
      label: 'รอประเมินรอบ 2',
      hint: 'ถึงโกดังจีน',
      icon: Warehouse,
      count: activeOrders?.filter((order) => order.status === 'CHINA_WAREHOUSE' && order.payment_round_2_status !== 'PAID').length || 0,
      tone: 'bg-violet-50 text-violet-700 border-violet-200',
      href: '/admin/orders?status=CHINA_WAREHOUSE',
    },
    {
      label: 'ขนส่งมาไทย',
      hint: 'ชำระรอบ 2 แล้ว',
      icon: Ship,
      count: activeOrders?.filter((order) => order.status === 'SHIPPING').length || 0,
      tone: 'bg-sky-50 text-sky-700 border-sky-200',
      href: '/admin/orders?status=SHIPPING',
    },
    {
      label: 'รอประเมินรอบ 3',
      hint: 'ถึงโกดังไทย',
      icon: Package,
      count: activeOrders?.filter((order) => order.status === 'THAILAND_WAREHOUSE' && order.payment_round_3_status !== 'PAID').length || 0,
      tone: 'bg-teal-50 text-teal-700 border-teal-200',
      href: '/admin/orders?status=THAILAND_WAREHOUSE',
    },
    {
      label: 'กำลังนำส่ง',
      hint: 'ชำระครบแล้ว',
      icon: Truck,
      count: activeOrders?.filter((order) => order.status === 'OUT_FOR_DELIVERY').length || 0,
      tone: 'bg-orange-50 text-orange-700 border-orange-200',
      href: '/admin/orders?status=OUT_FOR_DELIVERY',
    },
  ]

  // Aggregate Data by Date
  const aggregatedData: Record<string, any> = {}
  
  // Initialize last 30 days
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const { key: dateStr, label } = bangkokDateParts(d)
    aggregatedData[dateStr] = {
      date: label,
      fullDate: dateStr,
      inquiries: 0,
      orders: 0,
      revenue: 0
    }
  }

  // Populate Inquiries
  if (chartInquiries) {
    chartInquiries.forEach((inq) => {
      const dateStr = bangkokDateParts(new Date(inq.created_at)).key
      if (aggregatedData[dateStr]) {
        aggregatedData[dateStr].inquiries += 1
      }
    })
  }

  // Populate Orders and Revenue
  if (chartOrders) {
    chartOrders.forEach((order) => {
      const dateStr = bangkokDateParts(new Date(order.created_at)).key
      if (aggregatedData[dateStr]) {
        aggregatedData[dateStr].orders += 1
        const quotation = Array.isArray(order.quotation) ? order.quotation[0] : order.quotation
        aggregatedData[dateStr].revenue += Number(quotation?.total_price || 0)
      }
    })
  }

  const chartData = Object.values(aggregatedData)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-xs font-black tracking-widest text-primary uppercase">ศูนย์ควบคุมงาน</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-black text-slate-900">ภาพรวมระบบ</h1>
          <p className="mt-1 text-sm text-slate-600">งานที่ต้องจัดการและสถานะล่าสุดของ Sabuy Ship</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl self-start sm:self-auto">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          ข้อมูลอัปเดตจากระบบล่าสุด
        </div>
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

      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <CardHeader className="pb-3 bg-slate-50/70 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base font-black text-slate-900">งานในกระบวนการขนส่ง</CardTitle>
              <p className="text-xs text-slate-500 mt-1">แยกตามจุดที่ทีมงานต้องตรวจสอบในระบบชำระเงิน 3 รอบ</p>
            </div>
            <Link href="/admin/orders" className="inline-flex items-center gap-1 text-xs font-black text-primary hover:underline">
              ดูคำสั่งซื้อทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3">
            {pipeline.map(({ label, hint, icon: StageIcon, count, tone, href }, index) => (
              <Link href={href} key={label} className={`relative rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${tone}`}>
                {index < pipeline.length - 1 && (
                  <ArrowRight className="hidden xl:block absolute -right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 z-10" aria-hidden="true" />
                )}
                <div className="flex items-start justify-between gap-3">
                  <div className="w-9 h-9 bg-white/80 rounded-xl flex items-center justify-center shadow-xs">
                    <StageIcon className="w-4.5 h-4.5" aria-hidden="true" />
                  </div>
                  <span className="text-2xl font-black tabular-nums">{count}</span>
                </div>
                <p className="mt-3 text-sm font-black">{label}</p>
                <p className="mt-0.5 text-xs opacity-75">{hint}</p>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <DashboardChartsWrapper data={chartData} />

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
                      <p className="font-bold text-sm text-slate-900 truncate">{getProductSource(inq.product_url)}</p>
                      <p className="text-xs text-slate-500">ลูกค้า: {inq.customer?.full_name || '-'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`${getStatusBadge(inq.status)} text-xs px-2 py-1 rounded font-semibold`}>
                        {getInquiryStatusLabel(inq.status)}
                      </span>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(inq.created_at).toLocaleDateString('th-TH')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-9 h-9 mx-auto text-emerald-500" />
                  <p className="mt-3 text-sm font-black text-slate-800">ไม่มีคำขอที่ต้องจัดการ</p>
                  <p className="mt-1 text-xs text-slate-500">เมื่อมีคำขอใหม่ รายการจะแสดงตรงนี้</p>
                  <Link href="/admin/inquiries" className="inline-flex items-center gap-1 mt-4 text-xs font-black text-primary hover:underline">
                    เปิดหน้าคำขอประเมินราคา <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
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
                      <p className="font-bold text-sm text-primary">{log.order?.order_number || 'ไม่พบเลขคำสั่งซื้อ'}</p>
                      <p className="text-xs text-slate-500 truncate">{log.notes || 'อัปเดตสถานะแล้ว'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`${getOrderStatusBadge(log.status)} text-xs px-2 py-1 rounded font-semibold`}>
                        {getOrderStatusLabel(log.status)}
                      </span>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(log.created_at).toLocaleDateString('th-TH')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Package className="w-9 h-9 mx-auto text-slate-300" />
                  <p className="mt-3 text-sm font-black text-slate-800">ยังไม่มีการอัปเดตขนส่ง</p>
                  <p className="mt-1 text-xs text-slate-500">รายการเคลื่อนไหวล่าสุดจะแสดงตรงนี้</p>
                  <Link href="/admin/tracking" className="inline-flex items-center gap-1 mt-4 text-xs font-black text-primary hover:underline">
                    เปิดหน้าติดตามสินค้า <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
  } catch (err: any) {
    return (
      <div className="p-8 text-red-500 bg-red-50 rounded-lg">
        <h1 className="text-2xl font-bold mb-4">🚨 เกิดข้อผิดพลาดในหน้า Admin (Production Error)</h1>
        <p>ระบบยังไม่ได้แก้ไขข้อมูลใด ๆ กรุณากดลองใหม่หรือกลับเข้าหน้านี้อีกครั้ง</p>
      </div>
    )
  }
}

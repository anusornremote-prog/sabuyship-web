import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, Inbox, FileText, Package } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import InquiryList from "../inquiries/InquiryList"

export default async function MyOrders({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const params = await searchParams
  const tab = params.tab === 'inquiries' ? 'inquiries' : 'orders'

  let orders: any[] = []
  let inquiries: any[] = []
  
  if (user) {
    if (tab === 'orders') {
      const { data } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          status,
          created_at,
          quotation:quotation_id (
            total_price
          )
        `)
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })
      
      if (data) {
        orders = data
      }
    } else {
      const { data } = await supabase
        .from("inquiries")
        .select(`
          id,
          inquiry_number,
          customer_id,
          customer_name,
          phone,
          line_id,
          product_url,
          quantity,
          remark,
          image_url,
          status,
          created_at,
          quotations:quotations(
            id,
            product_cost,
            service_fee,
            shipping_cost_cn_cn,
            other_fee,
            total_price,
            status,
            orders:orders(
              id,
              order_number,
              status
            )
          )
        `)
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })
        
      if (data) {
        inquiries = data
      }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-100 text-blue-800'
      case 'WAITING_PAYMENT': return 'bg-amber-100 text-amber-800'
      case 'PAID': return 'bg-green-100 text-green-800'
      case 'CHINA_WAREHOUSE': return 'bg-purple-100 text-purple-800'
      case 'SHIPPING': return 'bg-sky-100 text-sky-800'
      case 'THAILAND_WAREHOUSE': return 'bg-teal-100 text-teal-800'
      case 'DELIVERED': return 'bg-emerald-100 text-emerald-800'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'NEW': return 'รอดำเนินการ'
      case 'WAITING_PAYMENT': return 'รอชำระเงิน'
      case 'PAID': return 'ชำระเงินแล้ว'
      case 'ORDERED': return 'สั่งซื้อสำเร็จ'
      case 'CHINA_WAREHOUSE': return 'ถึงโกดังจีน'
      case 'SHIPPING': return 'อยู่ระหว่างจัดส่งมาไทย'
      case 'THAILAND_WAREHOUSE': return 'ถึงโกดังไทย'
      case 'OUT_FOR_DELIVERY': return 'อยู่ระหว่างนำจ่าย'
      case 'DELIVERED': return 'จัดส่งสำเร็จ'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">คำสั่งซื้อของฉัน</h1>
          <p className="text-slate-600">ประวัติการสั่งซื้อและสถานะปัจจุบัน</p>
        </div>
        <Link href="/inquiry">
          <Button variant="orange">ขอใบเสนอราคาใหม่</Button>
        </Link>
      </div>
      
      <div className="flex gap-4 border-b">
        <Link 
          href="?tab=orders" 
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${tab === 'orders' ? 'border-b-2 border-primary text-primary' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <Package className="h-4 w-4" />
          สถานะการจัดส่ง (Orders)
        </Link>
        <Link 
          href="?tab=inquiries" 
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${tab === 'inquiries' ? 'border-b-2 border-primary text-primary' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <FileText className="h-4 w-4" />
          รอประเมินราคา (Inquiries)
        </Link>
      </div>

      {tab === 'inquiries' ? (
        <InquiryList initialInquiries={inquiries} customerId={user?.id || ""} />
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium">หมายเลขคำสั่งซื้อ</th>
                  <th className="px-6 py-4 font-medium">วันที่สร้าง</th>
                  <th className="px-6 py-4 font-medium">ยอดชำระ</th>
                  <th className="px-6 py-4 font-medium">สถานะ</th>
                  <th className="px-6 py-4 font-medium text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {orders && orders.length > 0 ? (
                  orders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-primary">{order.order_number}</td>
                      <td className="px-6 py-4 text-slate-600">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : '-'}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {order.quotation?.total_price !== undefined 
                          ? `฿ ${Number(order.quotation.total_price).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                          : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded ${getStatusBadge(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/dashboard/orders/${order.order_number}`}>
                          <Button variant="ghost" size="sm" className="cursor-pointer">
                            <Eye className="h-4 w-4 mr-2" />
                            ดูรายละเอียด
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Inbox className="h-10 w-10 text-slate-300" />
                        <p className="text-slate-500">ยังไม่มีข้อมูลคำสั่งซื้อ</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  )
}

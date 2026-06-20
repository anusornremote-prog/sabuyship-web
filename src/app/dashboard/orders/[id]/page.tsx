import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Timeline, TimelineItem } from "@/components/ui/timeline"
import { ArrowLeft, FileText, Globe, Truck, Printer } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { PaymentSection } from "./PaymentSection"

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params
  const orderIdOrNumber = id

  // Check if uuid format or order number
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderIdOrNumber)

  let query = supabase.from("orders").select(`
    id,
    order_number,
    status,
    created_at,
    admin_notes,
    tracking_number,
    shipping_company,
    shipping_address_id,
    address:shipping_address_id (
      full_name,
      phone,
      address_line,
      subdistrict,
      district,
      province,
      postal_code
    ),
    quotation:quotation_id (
      id,
      product_cost,
      service_fee,
      shipping_fee,
      other_fee,
      total_price,
      inquiry:inquiry_id (
        product_url,
        quantity,
        remark
      )
    )
  `)

  if (isUuid) {
    query = query.eq("id", orderIdOrNumber)
  } else {
    query = query.eq("order_number", orderIdOrNumber)
  }

  const { data: order } = await query.single()

  if (!order) {
    notFound()
  }

  // Fetch tracking logs sorted by created_at descending
  const { data: trackingLogs } = await supabase
    .from("tracking_logs")
    .select("*")
    .eq("order_id", order.id)
    .order("created_at", { ascending: false })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-100 text-blue-800 border-none'
      case 'WAITING_PAYMENT': return 'bg-amber-100 text-amber-800 border-none'
      case 'PAID': return 'bg-green-100 text-green-800 border-none'
      case 'CHINA_WAREHOUSE': return 'bg-purple-100 text-purple-800 border-none'
      case 'SHIPPING': return 'bg-sky-100 text-sky-800 border-none'
      case 'THAILAND_WAREHOUSE': return 'bg-teal-100 text-teal-800 border-none'
      case 'DELIVERED': return 'bg-emerald-100 text-emerald-800 border-none'
      default: return 'bg-slate-100 text-slate-800 border-none'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'NEW': return 'รอดำเนินการ (NEW)'
      case 'WAITING_PAYMENT': return 'รอชำระเงิน (WAITING PAYMENT)'
      case 'PAID': return 'ชำระเงินแล้ว (PAID)'
      case 'ORDERED': return 'สั่งซื้อสำเร็จ (ORDERED)'
      case 'CHINA_WAREHOUSE': return 'สินค้าถึงโกดังจีน (CHINA WAREHOUSE)'
      case 'SHIPPING': return 'อยู่ระหว่างจัดส่งมาไทย (SHIPPING)'
      case 'THAILAND_WAREHOUSE': return 'สินค้าถึงโกดังไทย (THAILAND WAREHOUSE)'
      case 'OUT_FOR_DELIVERY': return 'อยู่ระหว่างนำจ่าย (OUT FOR DELIVERY)'
      case 'DELIVERED': return 'จัดส่งสำเร็จ (DELIVERED)'
      default: return status
    }
  }

  const formatCurrency = (amount: any) => {
    return `฿ ${Number(amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const quotation = order.quotation as any
  const inquiry = quotation?.inquiry as any

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/orders">
            <Button variant="outline" size="icon" className="cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">รายละเอียดคำสั่งซื้อ {order.order_number}</h1>
            <p className="text-slate-600 text-sm">
              สร้างเมื่อ: {order.created_at ? new Date(order.created_at).toLocaleString('th-TH') : '-'}
            </p>
          </div>
        </div>
        <div className="sm:ml-auto flex flex-wrap items-center gap-3">
          <Badge variant="outline" className={`text-sm px-3 py-1 font-bold ${getStatusBadge(order.status)}`}>
            {getStatusText(order.status)}
          </Badge>
          <PaymentSection orderId={order.id} currentStatus={order.status} />
          
          <Button variant="outline" size="sm" className="hidden sm:flex gap-2" asChild>
            <Link href={`/dashboard/orders/${order.id}/invoice`} target="_blank">
              <Printer className="h-4 w-4" />
              <span>พิมพ์ใบแจ้งหนี้/ใบเสร็จ</span>
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Mobile Invoice Button */}
      <div className="sm:hidden">
        <Button variant="outline" className="w-full flex gap-2" asChild>
          <Link href={`/dashboard/orders/${order.id}/invoice`} target="_blank">
            <Printer className="h-4 w-4" />
            <span>พิมพ์ใบแจ้งหนี้/ใบเสร็จ</span>
          </Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>ข้อมูลใบเสนอราคา (Quotation)</CardTitle>
            </CardHeader>
            <CardContent>
              {quotation ? (
                <div className="space-y-4">
                  <div className="flex justify-between border-b pb-2 text-sm">
                    <span className="text-slate-600">ค่าสินค้า (Product Cost)</span>
                    <span className="font-medium">{formatCurrency(quotation.product_cost)}</span>
                  </div>

                  <div className="flex justify-between border-b pb-2 text-sm">
                    <span className="text-slate-600">ค่าขนส่งจีน-ไทย (Shipping Fee)</span>
                    <span className="font-medium">{formatCurrency(quotation.shipping_fee)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2 text-sm">
                    <span className="text-slate-600">ค่าบริการอื่นๆ (Other Fee)</span>
                    <span className="font-medium">{formatCurrency(quotation.other_fee)}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="font-bold text-lg text-slate-950">ยอดรวมทั้งสิ้น (Total)</span>
                    <span className="font-bold text-lg text-primary">{formatCurrency(quotation.total_price)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 text-center py-4 text-sm">ไม่พบข้อมูลใบเสนอราคา</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>ข้อมูลอ้างอิง</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {inquiry ? (
                <>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">ลิงก์สินค้า (URL)</h4>
                    <a href={inquiry.product_url} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline break-all flex items-center gap-1">
                      <Globe className="h-4 w-4 shrink-0" />
                      {inquiry.product_url}
                    </a>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">จำนวนที่สั่ง</h4>
                      <p className="text-slate-900 font-medium">{inquiry.quantity} ชิ้น</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">หมายเหตุเพิ่มเติม</h4>
                      <p className="text-slate-900 font-medium whitespace-pre-wrap">{inquiry.remark || '-'}</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-slate-400 text-center py-2">ไม่พบข้อมูลคำขอนำเข้า</p>
              )}
              {order.admin_notes && (
                <div className="pt-4 border-t">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">บันทึกเพิ่มเติมจากเจ้าหน้าที่ (Admin Notes)</h4>
                  <p className="text-slate-800 italic bg-slate-50 p-3 rounded-lg border border-slate-100">{order.admin_notes}</p>
                </div>
              )}
              {order.address && (
                <div className="pt-4 border-t">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">จัดส่งไปที่</h4>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="font-semibold text-slate-900">{(Array.isArray(order.address) ? order.address[0] : order.address)?.full_name}</p>
                    <p className="text-slate-600 text-xs mb-1">โทร: {(Array.isArray(order.address) ? order.address[0] : order.address)?.phone}</p>
                    <p className="text-slate-700 text-sm">{(Array.isArray(order.address) ? order.address[0] : order.address)?.address_line} ต.{(Array.isArray(order.address) ? order.address[0] : order.address)?.subdistrict} อ.{(Array.isArray(order.address) ? order.address[0] : order.address)?.district} จ.{(Array.isArray(order.address) ? order.address[0] : order.address)?.province} {(Array.isArray(order.address) ? order.address[0] : order.address)?.postal_code}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 mb-4">
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                ข้อมูลการจัดส่งในไทย
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.tracking_number ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">บริษัทขนส่ง</h4>
                    <p className="font-medium text-slate-800">{order.shipping_company || '-'}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">หมายเลขพัสดุ (Tracking)</h4>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-md border border-blue-100">
                        {order.tracking_number}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-slate-400">
                  <p className="text-sm">ยังไม่มีหมายเลขพัสดุ</p>
                  <p className="text-xs mt-1">แอดมินจะอัปเดตเมื่อสินค้าถึงไทย</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm sticky top-6">
            <CardHeader>
              <CardTitle>การติดตามสถานะ (Timeline)</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline>
                {trackingLogs && trackingLogs.length > 0 ? (
                  trackingLogs.map((log: any, index: number) => (
                    <TimelineItem 
                      key={log.id}
                      status={getStatusText(log.status)} 
                      date={log.created_at ? new Date(log.created_at).toLocaleString('th-TH') : ''}
                      description={log.notes || undefined} 
                      isActive={index === 0}
                      isLast={index === trackingLogs.length - 1}
                    />
                  ))
                ) : (
                  <TimelineItem 
                    status="รอดำเนินการ (NEW)" 
                    date={order.created_at ? new Date(order.created_at).toLocaleString('th-TH') : ''}
                    description="สร้างคำสั่งซื้อเข้าระบบเรียบร้อยแล้ว" 
                    isActive={true}
                    isLast={true}
                  />
                )}
              </Timeline>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

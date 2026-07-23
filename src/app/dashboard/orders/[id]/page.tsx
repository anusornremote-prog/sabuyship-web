import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Timeline, TimelineItem } from "@/components/ui/timeline"
import { ArrowLeft, FileText, Globe, Truck, Printer } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { PaymentStepper } from "./PaymentStepper"
import { ConfirmReceiptButton } from "./ConfirmReceiptButton"
import { CopyTrackingButton } from "./CopyTrackingButton"

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
  const supabase = await createClient()
  const resolvedParams = await params
  const { id } = resolvedParams as { id: string }
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
    payment_round_1_status,
    payment_round_2_status,
    payment_round_3_status,
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
      shipping_cost_cn_cn,
      shipping_cost_cn_th,
      shipping_cost_th_th,
      other_fee,
      total_price,
      inquiry:inquiry_id (
        product_url,
        quantity,
        remark,
        items,
        shipping_type,
        image_url
      )
    )
  `)

  if (isUuid) {
    query = query.eq("id", orderIdOrNumber)
  } else {
    query = query.eq("order_number", orderIdOrNumber)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  const { data: order, error } = await query.single()

  if (error) {
    console.error("ORDER FETCH ERROR:", error)
    return <div className="p-8 text-red-500 font-mono">SUPABASE ERROR: {JSON.stringify(error)}</div>
  }

  // Fetch latest rejected payment to show rejection reason
  const { data: rejectedPayment } = order ? await supabase
    .from('payments')
    .select('rejection_reason, created_at')
    .eq('order_id', order.id)
    .eq('status', 'REJECTED')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle() : { data: null }

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
      case 'PAID_ROUND_1': return 'ชำระเงินรอบที่ 1 สำเร็จ (ค่าสินค้า)'
      case 'PAID_ROUND_2': return 'ชำระเงินรอบที่ 2 สำเร็จ (ค่าขนส่งจีน-ไทย)'
      case 'PAID_ROUND_3': return 'ชำระเงินรอบที่ 3 สำเร็จ (ค่าจัดส่งในไทย)'
      case 'PAYMENT_REJECTED': return 'สลิปถูกปฏิเสธ (REJECTED)'
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

  // Safely extract relations which might be arrays
  const quotation = Array.isArray(order.quotation) ? order.quotation[0] : order.quotation
  const inquiry = Array.isArray(quotation?.inquiry) ? quotation.inquiry[0] : quotation?.inquiry
  const address = Array.isArray(order.address) ? order.address[0] : order.address

  // Safely parse items if it's a string
  let inquiryItems = inquiry?.items || [];
  if (typeof inquiryItems === 'string') {
    try {
      inquiryItems = JSON.parse(inquiryItems);
    } catch (e) {
      inquiryItems = [];
    }
  }

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
          
          <Link href={`/dashboard/orders/${order.id}/invoice`} target="_blank">
            <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
              <Printer className="h-4 w-4" />
              <span>พิมพ์ใบแจ้งหนี้/ใบเสร็จ</span>
            </Button>
          </Link>

          <ConfirmReceiptButton orderId={order.id} status={order.status} />
        </div>
      </div>
      
      {/* Mobile Invoice Button */}
      <div className="sm:hidden">
        <Link href={`/dashboard/orders/${order.id}/invoice`} target="_blank">
          <Button variant="outline" className="w-full flex gap-2">
            <Printer className="h-4 w-4" />
            <span>พิมพ์ใบแจ้งหนี้/ใบเสร็จ</span>
          </Button>
        </Link>
      </div>

      <div id="payment">
        <PaymentStepper 
          orderId={order.id}
          status={order.status}
          paymentRound1Status={order.payment_round_1_status || (order.status !== 'WAITING_PAYMENT' && order.status !== 'NEW' ? 'PAID' : 'PENDING')}
          paymentRound2Status={order.payment_round_2_status}
          paymentRound3Status={order.payment_round_3_status}
          productCost={quotation?.product_cost || 0}
          shippingCostCnCn={quotation?.shipping_cost_cn_cn || 0}
          shippingCostCnTh={quotation?.shipping_cost_cn_th || 0}
          shippingCostThTh={quotation?.shipping_cost_th_th || 0}
          initialShippingMethod={order.shipping_company || ''}
          rejectionReason={rejectedPayment?.rejection_reason || null}
        />
      </div>


      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>ข้อมูลอ้างอิง</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {inquiry ? (
                <>
                  <div className="flex justify-between items-center mb-4 pb-2 border-b">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">รูปแบบการขนส่ง</h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {inquiry.shipping_type === 'BOAT' ? '🛳️ ทางเรือ (Boat)' : '🚚 ทางรถ (Car)'}
                    </span>
                  </div>
                  
                  {inquiryItems && inquiryItems.length > 0 ? (
                    <div className="space-y-4">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">รายการสินค้า ({inquiryItems.length} รายการ)</h4>
                      {inquiryItems.map((item: any, idx: number) => (
                        <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex flex-col sm:flex-row gap-4">
                          {item.image_url && (
                            <a href={item.image_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                              <img src={item.image_url} alt="Product" className="w-20 h-20 object-cover rounded-md border border-slate-200" />
                            </a>
                          )}
                          <div className="flex-1 space-y-2">
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline flex items-center gap-1 break-all text-sm">
                              <Globe className="h-4 w-4 shrink-0" />
                              <span className="line-clamp-1">{item.url}</span>
                            </a>
                            {item.wooden_crate && (
                              <div className="inline-block mt-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wide">
                                  📦 ต้องการตีลังไม้
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between items-end flex-wrap gap-4 mt-2">
                              <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase">จำนวนที่สั่ง</p>
                                <p className="text-sm font-medium text-slate-900">{item.quantity} ชิ้น</p>
                              </div>
                              <div className="flex gap-4 text-right flex-wrap justify-end">
                                {item.quoted_price !== undefined && (
                                  <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase">ราคาประเมิน</p>
                                    <p className="text-sm font-bold text-primary">{formatCurrency(item.quoted_price)}</p>
                                  </div>
                                )}
                                {item.shipping_cost_cn_th !== undefined && item.shipping_cost_cn_th > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase">ค่าส่ง จีน-ไทย</p>
                                    <p className="text-sm font-bold text-purple-600">{formatCurrency(item.shipping_cost_cn_th)}</p>
                                  </div>
                                )}
                                {item.wooden_crate_cost !== undefined && item.wooden_crate_cost > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase">ค่าตีลังไม้</p>
                                    <p className="text-sm font-bold text-amber-600">{formatCurrency(item.wooden_crate_cost)}</p>
                                  </div>
                                )}
                                {item.shipping_cost_th_th !== undefined && item.shipping_cost_th_th > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase">ค่าจัดส่งในไทย</p>
                                    <p className="text-sm font-bold text-teal-600">{formatCurrency(item.shipping_cost_th_th)}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            {item.remark && (
                              <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">หมายเหตุ</p>
                                <p className="text-sm text-slate-700 bg-white p-2 rounded border border-slate-100">{item.remark}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex flex-col sm:flex-row gap-4">
                      {inquiry.image_url && (
                        <a href={inquiry.image_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                          <img src={inquiry.image_url} alt="Product" className="w-20 h-20 object-cover rounded-md border border-slate-200" />
                        </a>
                      )}
                      <div className="flex-1 space-y-3">
                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">ลิงก์สินค้า / ข้อมูลสินค้า</h4>
                          <a href={inquiry.product_url} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline break-all flex items-start gap-1">
                            <Globe className="h-4 w-4 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{inquiry.product_url}</span>
                          </a>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">จำนวนที่สั่ง</h4>
                            <p className="text-slate-900 font-medium text-sm">{inquiry.quantity} ชิ้น</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">หมายเหตุเพิ่มเติม</h4>
                            <p className="text-slate-900 font-medium text-sm whitespace-pre-wrap bg-white p-2 rounded border border-slate-100">{inquiry.remark || '-'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
            </CardContent>
          </Card>

          {order.address && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>จัดส่งไปที่</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <p className="font-semibold text-slate-900">{address?.full_name}</p>
                  <p className="text-slate-600 text-sm mb-2 mt-1">โทร: {address?.phone}</p>
                  <p className="text-slate-700 text-sm leading-relaxed">{address?.address_line} ต.{address?.subdistrict} อ.{address?.district} จ.{address?.province} {address?.postal_code}</p>
                </div>
              </CardContent>
            </Card>
          )}

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

                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-slate-600">ค่าจัดส่ง จีน-จีน</span>
                    <span className="font-medium">{formatCurrency(quotation.shipping_cost_cn_cn)}</span>
                  </div>
                  {/* Only show Round 2 cost if Round 1 is PAID or cost > 0 */}
                  {(order.payment_round_1_status === 'PAID' || (quotation.shipping_cost_cn_th || 0) > 0) && (
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span className="text-slate-600">ค่าจัดส่ง จีน-ไทย</span>
                      <div className="text-right">
                        <span className="font-medium">{(quotation.shipping_cost_cn_th || 0) > 0 ? formatCurrency(quotation.shipping_cost_cn_th) : "กำลังประเมิน"}</span>
                        {order.payment_round_2_status === 'PAID' && <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-700 border-none">จ่ายแล้ว</Badge>}
                      </div>
                    </div>
                  )}
                  {/* Only show Round 3 cost if Round 2 is PAID or cost > 0 */}
                  {(order.payment_round_2_status === 'PAID' || (quotation.shipping_cost_th_th || 0) > 0) && (
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span className="text-slate-600">ค่าจัดส่ง ไทย-ไทย</span>
                      <div className="text-right">
                        <span className="font-medium">
                          {(quotation.shipping_cost_th_th || 0) > 0 ? formatCurrency(quotation.shipping_cost_th_th) : "รับเองที่โกดัง / ไม่มีค่าใช้จ่าย"}
                        </span>
                        {order.payment_round_3_status === 'PAID' && (quotation.shipping_cost_th_th || 0) > 0 && <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-700 border-none">จ่ายแล้ว</Badge>}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between border-b pb-2 text-sm">
                    <span className="text-slate-600">ค่าบริการอื่นๆ (Other Fee)</span>
                    <span className="font-medium">{formatCurrency(quotation.other_fee)}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="font-bold text-lg text-slate-950">ยอดรวมทั้งสิ้น (รวมทุกรอบ)</span>
                    <span className="font-bold text-lg text-primary">{formatCurrency((quotation.total_price || 0) + (quotation.shipping_cost_cn_th || 0) + (quotation.shipping_cost_th_th || 0))}</span>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 text-center py-4 text-sm">ไม่พบข้อมูลใบเสนอราคา</p>
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
                      <CopyTrackingButton trackingNumber={order.tracking_number} label="เลขพัสดุไทย" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-slate-400">
                  <p className="text-sm">รอเลขพัสดุ</p>
                  <p className="text-xs mt-1">แอดมินจะอัปเดตเมื่อจัดส่งแล้ว</p>
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
  } catch (err: any) {
    return (
      <div className="p-8 bg-red-50 text-red-600 font-mono text-sm whitespace-pre-wrap">
        <h2>Server Error: {err.message}</h2>
        <p>{err.stack}</p>
      </div>
    )
  }
}

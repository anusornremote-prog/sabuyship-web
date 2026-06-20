import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Printer, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  // Check if uuid format or order number
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)

  let query = supabase.from("orders").select(`
    id,
    order_number,
    status,
    created_at,
    tracking_number,
    shipping_company,
    customer:customer_id (
      full_name,
      phone,
      line_id
    ),
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
    query = query.eq("id", id)
  } else {
    query = query.eq("order_number", id)
  }

  const { data: order } = await query.single()

  if (!order) {
    notFound()
  }

  const quotation = order.quotation as any
  const inquiry = quotation?.inquiry as any
  const customer = order.customer as any
  const address = order.address as any

  const formatCurrency = (amount: number) => {
    return `฿ ${Number(amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Determine document type based on payment status
  const isPaid = !['NEW', 'WAITING_PAYMENT'].includes(order.status)
  const docTitle = isPaid ? "ใบเสร็จรับเงิน (Receipt)" : "ใบแจ้งหนี้ (Invoice)"

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
      
      {/* Controls - Hidden when printing */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden px-4 sm:px-0">
        <Link href={`/dashboard/orders/${id}`} className="text-slate-600 hover:text-slate-900 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> กลับหน้าออเดอร์
        </Link>
        <button 
          id="print-btn"
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md font-semibold flex items-center gap-2 shadow-sm transition-colors"
          style={{ cursor: 'pointer' }}
        >
          <Printer className="w-4 h-4" /> พิมพ์เอกสาร / Save PDF
        </button>
      </div>

      {/* A4 Document Container */}
      <div className="max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-lg print:shadow-none p-12 print:p-0 relative text-slate-900">
        
        {/* Print Button Script Workaround for Server Component */}
        <script dangerouslySetInnerHTML={{
          __html: `
            document.getElementById('print-btn')?.addEventListener('click', function() {
              window.print();
            });
          `
        }} />

        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-200 pb-8 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-1">Sabuy Ship</h1>
            <p className="text-sm text-slate-500 font-medium tracking-wide uppercase">Import Service Provider</p>
            <div className="mt-4 text-sm text-slate-600 space-y-1">
              <p>บริษัท สบายชิป นำเข้า จำกัด (สำนักงานใหญ่)</p>
              <p>123/45 ถนนทดสอบ แขวงทดสอบ</p>
              <p>เขตจำลอง กรุงเทพมหานคร 10000</p>
              <p>เลขประจำตัวผู้เสียภาษี: 0105555555555</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">{docTitle}</h2>
            <table className="text-sm text-slate-600 ml-auto border-separate border-spacing-x-4 border-spacing-y-1">
              <tbody>
                <tr>
                  <td className="font-semibold text-right">เลขที่เอกสาร:</td>
                  <td className="text-right">{order.order_number}</td>
                </tr>
                <tr>
                  <td className="font-semibold text-right">วันที่:</td>
                  <td className="text-right">{new Date(order.created_at).toLocaleDateString('th-TH')}</td>
                </tr>
                <tr>
                  <td className="font-semibold text-right">สถานะ:</td>
                  <td className="text-right font-bold text-primary">{isPaid ? 'ชำระเงินแล้ว' : 'รอชำระเงิน'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer & Shipping Info */}
        <div className="flex justify-between mb-10 text-sm">
          <div className="w-1/2 pr-4">
            <h3 className="font-bold text-slate-800 mb-2 border-b pb-1">ลูกค้า (Customer)</h3>
            <p className="font-semibold text-slate-900 mt-2">{customer?.full_name}</p>
            <p className="text-slate-600 mt-1">โทร: {customer?.phone || '-'}</p>
            <p className="text-slate-600 mt-1">LINE: {customer?.line_id || '-'}</p>
          </div>
          
          {address && (
            <div className="w-1/2 pl-4">
              <h3 className="font-bold text-slate-800 mb-2 border-b pb-1">จัดส่งไปที่ (Shipping Address)</h3>
              <p className="font-semibold text-slate-900 mt-2">{address.full_name}</p>
              <p className="text-slate-600 mt-1">โทร: {address.phone}</p>
              <p className="text-slate-600 mt-1">
                {address.address_line} ต.{address.subdistrict} อ.{address.district} <br/>
                จ.{address.province} {address.postal_code}
              </p>
            </div>
          )}
        </div>

        {/* Order Items Table */}
        <table className="w-full mb-8 text-sm">
          <thead>
            <tr className="bg-slate-100 text-slate-700">
              <th className="py-3 px-4 text-left font-bold border-y border-slate-200">รายละเอียดรายการ (Description)</th>
              <th className="py-3 px-4 text-center font-bold border-y border-slate-200 w-24">จำนวน</th>
              <th className="py-3 px-4 text-right font-bold border-y border-slate-200 w-32">จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="py-4 px-4 text-slate-800">
                <p className="font-medium">ค่าสินค้า (Product Cost)</p>
                {inquiry?.product_url && (
                  <p className="text-xs text-slate-500 mt-1 truncate max-w-md">{inquiry.product_url}</p>
                )}
              </td>
              <td className="py-4 px-4 text-center text-slate-600">{inquiry?.quantity || 1}</td>
              <td className="py-4 px-4 text-right font-medium text-slate-900">{formatCurrency(quotation?.product_cost)}</td>
            </tr>
            {quotation?.shipping_fee > 0 && (
              <tr>
                <td className="py-4 px-4 text-slate-800">
                  <p className="font-medium">ค่าขนส่งจีน-ไทย (Shipping Fee)</p>
                </td>
                <td className="py-4 px-4 text-center text-slate-600">1</td>
                <td className="py-4 px-4 text-right font-medium text-slate-900">{formatCurrency(quotation.shipping_fee)}</td>
              </tr>
            )}
            {quotation?.service_fee > 0 && (
              <tr>
                <td className="py-4 px-4 text-slate-800">
                  <p className="font-medium">ค่าบริการนำเข้า (Service Fee)</p>
                </td>
                <td className="py-4 px-4 text-center text-slate-600">1</td>
                <td className="py-4 px-4 text-right font-medium text-slate-900">{formatCurrency(quotation.service_fee)}</td>
              </tr>
            )}
            {quotation?.other_fee > 0 && (
              <tr>
                <td className="py-4 px-4 text-slate-800">
                  <p className="font-medium">ค่าบริการอื่นๆ (Other Fee)</p>
                </td>
                <td className="py-4 px-4 text-center text-slate-600">1</td>
                <td className="py-4 px-4 text-right font-medium text-slate-900">{formatCurrency(quotation.other_fee)}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-1/2 lg:w-1/3">
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-2 text-slate-600 font-medium">รวมเป็นเงิน</td>
                  <td className="py-2 text-right font-medium text-slate-900">{formatCurrency(quotation?.total_price)}</td>
                </tr>
                <tr className="border-t-2 border-slate-800 text-lg">
                  <td className="py-3 font-bold text-slate-900">ยอดสุทธิ (Total)</td>
                  <td className="py-3 text-right font-bold text-primary">{formatCurrency(quotation?.total_price)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="absolute bottom-12 left-12 right-12 text-center text-xs text-slate-500 border-t border-slate-200 pt-6">
          <p>เอกสารฉบับนี้ออกโดยระบบอัตโนมัติ หากมีข้อสงสัยกรุณาติดต่อฝ่ายบริการลูกค้า</p>
          <p className="mt-1">โทร: 02-xxx-xxxx | LINE: @sabuyship</p>
        </div>

        {/* Watermark for paid status */}
        {isPaid && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 pointer-events-none opacity-10">
            <div className="border-8 border-green-600 text-green-600 font-bold text-9xl p-8 rounded-lg tracking-widest uppercase">
              PAID
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

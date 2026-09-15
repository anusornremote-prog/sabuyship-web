import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { RefundActions } from "./RefundActions"

export default async function AdminRefundsPage() {
  const supabase = await createClient()
  const { data: refunds, error } = await supabase
    .from("refunds")
    .select("*, order:order_id(order_number), customer:customer_id(full_name, customer_code)")
    .order("created_at", { ascending: false })
    .limit(200)

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-black text-slate-900">เงินคืนลูกค้า</h1><p className="text-sm text-slate-600">ติดตามยอดที่ต้องคืนจนถึงการโอนสำเร็จ พร้อมเลขอ้างอิง</p></div>
      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700">โหลดข้อมูลเงินคืนไม่สำเร็จ</div> : null}
      <div className="grid gap-3">
        {(refunds || []).map((refund: any) => (
          <Card key={refund.id}><CardContent className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div><div className="font-bold">{refund.order?.order_number || "-"} · {refund.customer?.full_name || refund.customer?.customer_code || "-"}</div><div className="text-sm text-slate-500">{refund.reason}</div></div>
              <div className="text-left sm:text-right"><div className="text-xl font-black text-rose-700">฿{Number(refund.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</div><div className="text-xs font-bold text-slate-600">{refund.status}</div></div>
            </div>
            {refund.payment_reference && <div className="text-xs text-slate-600">อ้างอิง: {refund.payment_reference}</div>}
            <RefundActions refund={refund} />
          </CardContent></Card>
        ))}
        {!error && refunds?.length === 0 ? <div className="rounded-lg border bg-white p-10 text-center text-slate-500">ยังไม่มียอดเงินคืน</div> : null}
      </div>
    </div>
  )
}

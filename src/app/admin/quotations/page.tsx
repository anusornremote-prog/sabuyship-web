import { createClient } from "@/lib/supabase/server"
import AdminQuotationList from "./AdminQuotationList"

export default async function AdminQuotations() {
  const supabase = await createClient()

  const { data: quotations } = await supabase
    .from("quotations")
    .select(`
      id,
      product_cost,
      shipping_fee,
      other_fee,
      total_price,
      status,
      created_at,
      inquiry:inquiry_id (
        inquiry_number,
        customer_name
      )
    `)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">จัดการใบเสนอราคา</h1>
          <p className="text-slate-600">สร้าง ส่ง และติดตามสถานะใบเสนอราคา</p>
        </div>
      </div>

      <AdminQuotationList initialQuotations={quotations || []} />
    </div>
  )
}

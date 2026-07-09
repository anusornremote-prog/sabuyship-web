import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import InquiryList from "./InquiryList"

export default async function DashboardInquiries() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch inquiries for the user, joining their quotations and the quotation's orders
  const { data: inquiries } = await supabase
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
        shipping_fee,
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">ประวัติการขอราคา</h1>
        <p className="text-slate-600">ประวัติการส่งลิงก์ประเมินราคาและใบเสนอราคาของคุณ</p>
      </div>
      <InquiryList initialInquiries={inquiries || []} customerId={user.id} />
    </div>
  )
}

import { createClient } from "@/lib/supabase/server"
import AdminInquiryList from "./AdminInquiryList"

export default async function AdminInquiries() {
  const supabase = await createClient()
  const { data: inquiries } = await supabase
    .from("inquiries")
    .select("*, quotations(*)")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">จัดการคำขอประเมินราคา</h1>
        <p className="text-slate-600">รายการลูกค้าส่งลิงก์สินค้าให้ประเมินราคาและสร้างใบเสนอราคา</p>
      </div>

      <AdminInquiryList initialInquiries={inquiries || []} />
    </div>
  )
}


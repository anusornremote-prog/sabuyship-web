import { createClient } from "@/lib/supabase/server"
import AdminInquiryList from "./AdminInquiryList"

export default async function AdminInquiries() {
  const supabase = await createClient()
  const { data: inquiries } = await supabase
    .from("inquiries")
    .select("*, quotations(*, orders(*)), customer:customer_id(customer_code)")
    .order("created_at", { ascending: false })

  if (inquiries && inquiries.length > 0) {
    const missingPhones = inquiries.filter(i => !i.customer && i.phone).map(i => i.phone);
    if (missingPhones.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("phone, customer_code")
        .in("phone", missingPhones);

      if (profiles && profiles.length > 0) {
        inquiries.forEach(inq => {
          if (!inq.customer && inq.phone) {
            const profile = profiles.find(p => p.phone === inq.phone);
            if (profile) {
              inq.customer = { customer_code: profile.customer_code };
            }
          }
        });
      }
    }
  }

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


import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import UnifiedOrderList from "./UnifiedOrderList"

export default async function MyOrders() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let orders: any[] = []
  let unifiedItems: any[] = []
  
  if (user) {
    // 1. Fetch Orders
    const { data: ordersData } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        status,
        created_at,
        payment_round_1_status,
        payment_round_2_status,
        payment_round_3_status,
        quotation:quotation_id (
          total_price
        )
      `)
      .eq("customer_id", user.id)
      
    // 2. Fetch Inquiries
    const { data: inquiriesData } = await supabase
      .from("inquiries")
      .select(`
        id,
        inquiry_number,
        status,
        created_at,
        items,
        product_url,
        image_url,
        quantity,
        remark,
        quotations(
          id,
          total_price
        )
      `)
      .eq("customer_id", user.id)

    const orders = ordersData || []
    const inquiries = inquiriesData || []

    // Extract existing order numbers (since inquiry_number === order_number)
    const orderNumbers = new Set(orders.map(o => o.order_number))

    // Map Orders
    const formattedOrders = orders.map(o => ({
      ...o,
      type: 'ORDER',
      total_price: (o as any).quotation?.total_price
    }))

    // Map Inquiries (skip if order already exists for this number)
    const formattedInquiries = inquiries
      .filter(inq => !orderNumbers.has(inq.inquiry_number))
      .map(inq => ({
        id: inq.id,
        inquiry_number: inq.inquiry_number,
        status: inq.status,
        created_at: inq.created_at,
        type: 'INQUIRY',
        total_price: inq.quotations?.[0]?.total_price,
        quotation_id: inq.quotations?.[0]?.id
      }))

    // Combine and sort by created_at DESC
    unifiedItems = [...formattedOrders, ...formattedInquiries].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
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
      
      <UnifiedOrderList items={unifiedItems} customerId={user?.id || ""} />
    </div>
  )
}

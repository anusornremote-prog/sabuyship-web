import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export interface CustomerNotification {
  id: string
  type: 'TRACKING' | 'PAYMENT_DUE' | 'QUOTATION' | 'PAYMENT_APPROVED' | 'PAYMENT_REJECTED' | 'OUT_OF_STOCK'
  title: string
  message: string
  timestamp: string
  link: string
  read?: boolean
  orderNumber?: string
  round?: number
  amount?: number
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notifications: CustomerNotification[] = []

    // 1. Fetch Quoted Inquiries (Waiting for customer to order/pay Round 1)
    const { data: quotedInquiries } = await supabase
      .from("inquiries")
      .select("id, inquiry_number, status, updated_at, created_at, quotations:quotation_id(total_price)")
      .eq("customer_id", user.id)
      .eq("status", "QUOTED")
      .order("updated_at", { ascending: false })
      .limit(10)

    if (quotedInquiries) {
      quotedInquiries.forEach((inq) => {
        const quotation = Array.isArray(inq.quotations) ? inq.quotations[0] : inq.quotations
        const amount = quotation?.total_price || 0
        notifications.push({
          id: `inq-quoted-${inq.id}`,
          type: 'QUOTATION',
          title: '📋 ใบเสนอราคาพร้อมแล้ว!',
          message: `คำขอ ${inq.inquiry_number} แอดมินประเมินราคาเรียบร้อยแล้ว (ยอดประเมิน: ฿${Number(amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}) กดเพื่อยืนยันสั่งซื้อ`,
          timestamp: inq.updated_at || inq.created_at,
          link: `/dashboard/orders`,
          orderNumber: inq.inquiry_number,
          amount
        })
      })
    }

    // 2. Fetch Customer's Orders
    const { data: orders } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        status,
        created_at,
        updated_at,
        payment_round_1_status,
        payment_round_2_status,
        payment_round_3_status,
        shipping_company,
        tracking_number,
        quotation:quotation_id (
          product_cost,
          shipping_cost_cn_cn,
          shipping_cost_cn_th,
          shipping_cost_th_th,
          total_price,
          inquiry:inquiry_id (items)
        )
      `)
      .eq("customer_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(25)

    if (orders && orders.length > 0) {
      const orderIds = orders.map(o => o.id)

      // Fetch tracking logs for these orders
      const { data: trackingLogs } = await supabase
        .from("tracking_logs")
        .select("id, order_id, status, notes, created_at")
        .in("order_id", orderIds)
        .order("created_at", { ascending: false })
        .limit(40)

      // Map tracking logs into notifications
      if (trackingLogs) {
        trackingLogs.forEach(log => {
          const matchedOrder = orders.find(o => o.id === log.order_id)
          if (!matchedOrder) return

          const orderNum = matchedOrder.order_number
          let title = "📦 อัปเดตสถานะพัสดุ"
          let message = log.notes || `สถานะออเดอร์ ${orderNum} มีการเปลี่ยนแปลง`

          switch (log.status) {
            case 'PAID_ROUND_1':
            case 'ORDERED':
              title = "🛒 สั่งซื้อสินค้าสำเร็จแล้ว"
              message = `ออเดอร์ ${orderNum} ทางโกดังจีนได้ดำเนินการสั่งซื้อสินค้ากับทางร้านค้าเรียบร้อยแล้ว`
              break
            case 'CHINA_WAREHOUSE':
              title = "🇨🇳 สินค้าถึงโกดังจีนแล้ว"
              message = `พัสดุออเดอร์ ${orderNum} มาถึงโกดังจีนแล้ว กำลังเตรียมโหลดตู้จัดส่งมาไทย`
              break
            case 'SHIPPING':
              title = "🚢 อยู่ระหว่างจัดส่งมาไทย"
              message = `พัสดุออเดอร์ ${orderNum} ถูกส่งออกจากโกดังจีนแล้ว อยู่ระหว่างการขนส่งข้ามแดนมายังไทย`
              break
            case 'THAILAND_WAREHOUSE':
              title = "🇹🇭 สินค้าถึงโกดังไทยแล้ว!"
              message = `พัสดุออเดอร์ ${orderNum} เดินทางถึงโกดังไทยเรียบร้อยแล้ว พร้อมส่งต่อไปยังที่อยู่ของคุณ`
              break
            case 'OUT_FOR_DELIVERY':
              title = "🚚 พัสดุอยู่ระหว่างนำจ่าย"
              message = `ออเดอร์ ${orderNum} ส่งมอบให้ ${matchedOrder.shipping_company || 'บริษัทขนส่งในไทย'} นำจ่ายแล้ว ${matchedOrder.tracking_number ? `(เลขแทร็กกิ้ง: ${matchedOrder.tracking_number})` : ''}`
              break
            case 'DELIVERED':
              title = "🎉 จัดส่งสำเร็จเรียบร้อย"
              message = `ออเดอร์ ${orderNum} ดำเนินการจัดส่งถึงมือลูกค้าเรียบร้อยแล้ว ขอบคุณที่ใช้บริการ Sabuy Ship ค่ะ`
              break
            case 'PAYMENT_REJECTED':
              title = "⚠️ สลิปโอนเงินถูกปฏิเสธ"
              message = `สลิปสำหรับออเดอร์ ${orderNum} ไม่ผ่านการตรวจสอบ: ${log.notes || 'กรุณาแนบสลิปใหม่อีกครั้ง'}`
              break
          }

          notifications.push({
            id: `track-${log.id}`,
            type: log.status === 'PAYMENT_REJECTED' ? 'PAYMENT_REJECTED' : 'TRACKING',
            title,
            message,
            timestamp: log.created_at,
            link: `/dashboard/orders/${orderNum}`,
            orderNumber: orderNum
          })
        })
      }

      // Check Payment Due Alerts on Orders
      orders.forEach(order => {
        const quotation = Array.isArray(order.quotation) ? order.quotation[0] : order.quotation
        const orderNum = order.order_number

        // Round 1 Payment Due
        if (order.payment_round_1_status === 'PENDING' && order.status === 'WAITING_PAYMENT') {
          const round1Amount = (quotation?.product_cost || 0) + (quotation?.shipping_cost_cn_cn || 0)
          notifications.push({
            id: `pay-r1-${order.id}`,
            type: 'PAYMENT_DUE',
            title: '⚡ รอยืนยันชำระเงิน รอบที่ 1 (ค่าสินค้า)',
            message: `ออเดอร์ ${orderNum} มียอดค่าสินค้า ฿${Number(round1Amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })} รอการชำระเงินเพื่อสั่งซื้อ`,
            timestamp: order.updated_at || order.created_at,
            link: `/dashboard/orders/${orderNum}#payment`,
            orderNumber: orderNum,
            round: 1,
            amount: round1Amount
          })
        }

        // Round 2 Payment Due (China-Thai shipping)
        if (order.payment_round_2_status === 'PENDING' && (quotation?.shipping_cost_cn_th || 0) > 0 && order.status === 'CHINA_WAREHOUSE') {
          const round2Amount = quotation?.shipping_cost_cn_th || 0
          notifications.push({
            id: `pay-r2-${order.id}`,
            type: 'PAYMENT_DUE',
            title: '⚡ รอชำระเงิน รอบที่ 2 (ค่าขนส่งจีน-ไทย)',
            message: `ออเดอร์ ${orderNum} ประเมินค่าส่งจีน-ไทยแล้ว ยอด ฿${Number(round2Amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`,
            timestamp: order.updated_at || order.created_at,
            link: `/dashboard/orders/${orderNum}#payment`,
            orderNumber: orderNum,
            round: 2,
            amount: round2Amount
          })
        }

        // Round 3 Payment Due (Local Thai Delivery)
        if (order.payment_round_3_status === 'PENDING' && (quotation?.shipping_cost_th_th || 0) > 0 && order.status === 'THAILAND_WAREHOUSE') {
          const round3Amount = quotation?.shipping_cost_th_th || 0
          notifications.push({
            id: `pay-r3-${order.id}`,
            type: 'PAYMENT_DUE',
            title: '⚡ รอชำระเงิน รอบที่ 3 (ค่าจัดส่งในไทย)',
            message: `ออเดอร์ ${orderNum} สินค้าถึงไทยแล้ว มียอดค่าจัดส่งในไทย ฿${Number(round3Amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`,
            timestamp: order.updated_at || order.created_at,
            link: `/dashboard/orders/${orderNum}#payment`,
            orderNumber: orderNum,
            round: 3,
            amount: round3Amount
          })
        }

        // Check Out of Stock
        let items = quotation?.inquiry?.items
        if (typeof items === 'string') {
          try { items = JSON.parse(items) } catch { items = [] }
        }
        if (Array.isArray(items) && items.some((item: any) => item.is_out_of_stock)) {
          const outCount = items.filter((i: any) => i.is_out_of_stock).length
          notifications.push({
            id: `oos-${order.id}`,
            type: 'OUT_OF_STOCK',
            title: '⚠️ สินค้าบางรายการหมด',
            message: `ออเดอร์ ${orderNum} มีสินค้าหมดจากร้านค้าจีน ${outCount} รายการ กรุณาตรวจสอบรายละเอียด`,
            timestamp: order.updated_at || order.created_at,
            link: `/dashboard/orders/${orderNum}`,
            orderNumber: orderNum
          })
        }
      })
    }

    // Sort all notifications chronologically descending
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({
      success: true,
      notifications: notifications.slice(0, 30),
      totalCount: notifications.length
    }, { status: 200 })

  } catch (error: any) {
    console.error("Customer Notifications API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * Centralized status labels and badge classes for customer and admin order views.
 * Keeps wording and status colors consistent across overview, lists, and detail pages.
 */

export interface OrderStatusContext {
  type?: string
  status?: string
  payment_round_1_status?: string | null
  payment_round_2_status?: string | null
  payment_round_3_status?: string | null
  consolidated_into_id?: string | null
  shipping_company?: string | null
}

const CUSTOMER_EVENT_LABELS: Record<string, string> = {
  NEW: "รอดำเนินการ",
  WAITING_PAYMENT: "รอชำระเงิน",
  PAID: "ชำระเงินแล้ว",
  PAID_ROUND_1: "ชำระเงินรอบที่ 1 สำเร็จ (ค่าสินค้า)",
  UPLOADED_ROUND_1: "รอตรวจสอบการชำระเงิน รอบที่ 1",
  PAID_ROUND_2: "ชำระเงินรอบที่ 2 สำเร็จ (ค่าขนส่งจีน-ไทย)",
  UPLOADED_ROUND_2: "รอตรวจสอบการชำระเงิน รอบที่ 2",
  QUOTED_ROUND_2: "ประเมินค่าขนส่งจีน-ไทย (รอบที่ 2)",
  PAID_ROUND_3: "ชำระเงินรอบที่ 3 สำเร็จ (ค่าจัดส่งในไทย)",
  UPLOADED_ROUND_3: "รอตรวจสอบการชำระเงิน รอบที่ 3",
  QUOTED_ROUND_3: "ประเมินค่าจัดส่งในไทย (รอบที่ 3)",
  PAYMENT_REJECTED: "สลิปไม่ผ่าน/รอแนบใหม่",
  ORDERED: "สั่งซื้อสำเร็จ",
  CHINA_TRANSIT: "ร้านค้าจีนจัดส่งแล้ว (กำลังไปโกดังจีน)",
  CHINA_WAREHOUSE: "สินค้าถึงโกดังจีน",
  SHIPPING: "อยู่ระหว่างจัดส่งมาไทย",
  THAILAND_WAREHOUSE: "สินค้าถึงโกดังไทย",
  CONSOLIDATION_PARENT: "รวมพัสดุเพื่อจัดส่งในไทย (ออเดอร์หลัก)",
  CONSOLIDATED: "รวมจัดส่งกับออเดอร์หลัก",
  OUT_FOR_DELIVERY: "กำลังนำส่งลูกค้า",
  DELIVERED: "จัดส่งสำเร็จ",
  ITEM_OUT_OF_STOCK: "สินค้าบางรายการหมดสต็อก",
  ORDER_CANCELED: "ยกเลิกรายการ",
  CANCELED: "ยกเลิกรายการ",
  CANCELLED: "ยกเลิกรายการ",
}

export function getCustomerOrderStatusText(
  status: string,
  order?: OrderStatusContext
): string {
  if (order?.type === "INQUIRY") {
    switch (status) {
      case "PENDING":
        return "รอแอดมินประเมินราคา"
      case "QUOTED":
        return "แอดมินเสนอราคาแล้ว (รอยืนยันสั่งซื้อ)"
      case "REJECTED":
        return "ยกเลิกคำขอ"
      default:
        return status
    }
  }

  if (order) {
    // Round 1 payment states
    if (order.payment_round_1_status === "REJECTED") {
      return "สลิปรอบ 1 ไม่ผ่าน (กรุณาแนบใหม่)"
    }
    if (order.payment_round_1_status === "PENDING") {
      return "รอชำระเงิน รอบ 1 (ค่าสินค้า)"
    }
    if (order.payment_round_1_status === "UPLOADED") {
      return "แอดมินกำลังตรวจสอบสลิป รอบ 1"
    }

    // Round 2 payment states (only once in China Warehouse or Shipping)
    if (status === "CHINA_WAREHOUSE" || status === "SHIPPING") {
      if (order.payment_round_2_status === "REJECTED") {
        return "สลิปรอบ 2 ไม่ผ่าน (กรุณาแนบใหม่)"
      }
      if (order.payment_round_2_status === "PENDING") {
        return "รอชำระเงิน รอบ 2 (ค่าขนส่งจีน-ไทย)"
      }
      if (order.payment_round_2_status === "UPLOADED") {
        return "แอดมินกำลังตรวจสอบสลิป รอบ 2"
      }
    }

    // Round 3 payment states (only once in Thailand Warehouse or Out for Delivery)
    if (status === "THAILAND_WAREHOUSE" || status === "OUT_FOR_DELIVERY") {
      if (order.consolidated_into_id) {
        return "รวมจัดส่ง (ชำระรอบ 3 ที่ออเดอร์หลัก)"
      }
      if (order.payment_round_3_status === "REJECTED") {
        return "สลิปรอบ 3 ไม่ผ่าน (กรุณาแนบใหม่)"
      }
      if (order.payment_round_3_status === "PENDING") {
        return "รอชำระเงิน รอบ 3 (ค่าจัดส่งในไทย)"
      }
      if (order.payment_round_3_status === "UPLOADED") {
        return "แอดมินกำลังตรวจสอบสลิป รอบ 3"
      }
    }

    // Contextual stage messages when payment round is clear
    if (status === "PAID") return "ชำระรอบ 1 แล้ว (รอแอดมินสั่งของ)"
    if (status === "ORDERED") {
      return order.payment_round_1_status === "NOT_APPLICABLE"
        ? "กำลังจัดส่งไปโกดังจีน"
        : "สั่งซื้อสำเร็จ (ร้านจีนเตรียมจัดส่ง)"
    }
    if (status === "CHINA_WAREHOUSE") {
      return "พัสดุถึงโกดังจีน (รอคำนวณค่าขนส่ง)"
    }
    if (status === "SHIPPING") {
      return "ชำระรอบ 2 แล้ว (กำลังส่งมาไทย)"
    }
    if (status === "THAILAND_WAREHOUSE") {
      return order.shipping_company
        ? "สินค้าถึงไทยแล้ว (รอแอดมินแจ้งค่าส่งในไทย)"
        : "สินค้าถึงไทยแล้ว (กรุณาเลือกวิธีจัดส่งในไทย)"
    }
    if (status === "OUT_FOR_DELIVERY") {
      return "ชำระครบถ้วน (กำลังนำส่งไปบ้านลูกค้า)"
    }
    if (status === "DELIVERED") {
      return "จัดส่งสำเร็จเรียบร้อย"
    }
  }

  return CUSTOMER_EVENT_LABELS[status] || status
}

export function getCustomerOrderStatusBadge(
  status: string,
  order?: OrderStatusContext
): string {
  if (order?.type === "INQUIRY") {
    switch (status) {
      case "PENDING":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "QUOTED":
        return "bg-green-100 text-green-800 border-green-200"
      case "REJECTED":
        return "bg-rose-100 text-rose-800 border-rose-200"
      default:
        return "bg-slate-100 text-slate-800 border-slate-200"
    }
  }

  if (order) {
    if (
      order.payment_round_1_status === "REJECTED" ||
      ((status === "CHINA_WAREHOUSE" || status === "SHIPPING") &&
        order.payment_round_2_status === "REJECTED") ||
      ((status === "THAILAND_WAREHOUSE" || status === "OUT_FOR_DELIVERY") &&
        order.payment_round_3_status === "REJECTED")
    ) {
      return "bg-rose-100 text-rose-800 border-rose-200"
    }

    if (
      order.payment_round_1_status === "PENDING" ||
      order.payment_round_1_status === "UPLOADED" ||
      ((status === "CHINA_WAREHOUSE" ||
        status === "SHIPPING" ||
        status === "THAILAND_WAREHOUSE" ||
        status === "DELIVERED") &&
        (order.payment_round_2_status === "PENDING" ||
          order.payment_round_2_status === "UPLOADED")) ||
      ((status === "THAILAND_WAREHOUSE" ||
        status === "OUT_FOR_DELIVERY" ||
        status === "DELIVERED") &&
        !order.consolidated_into_id &&
        (order.payment_round_3_status === "PENDING" ||
          order.payment_round_3_status === "UPLOADED"))
    ) {
      return "bg-amber-100 text-amber-800 border-amber-200"
    }
  }

  switch (status) {
    case "NEW":
    case "ORDERED":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "WAITING_PAYMENT":
      return "bg-amber-100 text-amber-800 border-amber-200"
    case "PAYMENT_REJECTED":
      return "bg-rose-100 text-rose-800 border-rose-200"
    case "PAID":
      return "bg-green-100 text-green-800 border-green-200"
    case "CHINA_WAREHOUSE":
      return "bg-purple-100 text-purple-800 border-purple-200"
    case "SHIPPING":
      return "bg-sky-100 text-sky-800 border-sky-200"
    case "THAILAND_WAREHOUSE":
      return "bg-teal-100 text-teal-800 border-teal-200"
    case "OUT_FOR_DELIVERY":
      return "bg-orange-100 text-orange-800 border-orange-200"
    case "DELIVERED":
      return "bg-emerald-100 text-emerald-800 border-emerald-200"
    case "CANCELED":
    case "CANCELLED":
      return "bg-rose-100 text-rose-800 border-rose-200"
    default:
      return "bg-slate-100 text-slate-800 border-slate-200"
  }
}

export function getAdminOrderStageBadge(status: string): string {
  switch (status) {
    case "NEW":
    case "ORDERED":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "WAITING_PAYMENT":
      return "bg-amber-100 text-amber-800 border-amber-200"
    case "PAYMENT_REJECTED":
      return "bg-rose-100 text-rose-800 border-rose-200"
    case "PAID":
      return "bg-green-100 text-green-800 border-green-200"
    case "CHINA_WAREHOUSE":
      return "bg-purple-100 text-purple-800 border-purple-200"
    case "SHIPPING":
      return "bg-sky-100 text-sky-800 border-sky-200"
    case "THAILAND_WAREHOUSE":
      return "bg-teal-100 text-teal-800 border-teal-200"
    case "OUT_FOR_DELIVERY":
      return "bg-orange-100 text-orange-800 border-orange-200"
    case "DELIVERED":
      return "bg-emerald-100 text-emerald-800 border-emerald-200"
    case "CANCELED":
    case "CANCELLED":
      return "bg-slate-200 text-slate-700 border-slate-300"
    default:
      return "bg-slate-100 text-slate-800 border-slate-200"
  }
}


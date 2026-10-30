import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/require-admin"
import { sendAdminNotification } from "@/lib/notify"

export async function POST() {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN
  const lineUserId = process.env.LINE_ADMIN_USER_ID

  if (!lineToken || !lineUserId) {
    return NextResponse.json({
      success: false,
      error: "ยังไม่ได้ตั้งค่า LINE_CHANNEL_ACCESS_TOKEN หรือ LINE_ADMIN_USER_ID ใน Environment Variables",
      hasToken: Boolean(lineToken),
      hasAdminUserId: Boolean(lineUserId),
    }, { status: 400 })
  }

  try {
    const timeStr = new Date().toLocaleTimeString("th-TH")
    const testMessage = `🔔 [ทดสอบระบบ] ทดสอบการแจ้งเตือนแอดมินทาง LINE สำเร็จ!\nเวลา: ${timeStr}\nผู้ทดสอบ: ${auth.user?.email || "Admin"}`
    const success = await sendAdminNotification(testMessage)

    if (success) {
      return NextResponse.json({
        success: true,
        message: "ส่งข้อความทดสอบเข้า LINE เรียบร้อยแล้ว",
      })
    } else {
      return NextResponse.json({
        success: false,
        error: "LINE API ปฏิเสธการส่งข้อความ หรือเกิดข้อผิดพลาดในการเชื่อมต่อ",
      }, { status: 502 })
    }
  } catch (error: any) {
    console.error("Test notification error:", error)
    return NextResponse.json({
      success: false,
      error: error?.message || "เกิดข้อผิดพลาดที่ไม่คาดคิด",
    }, { status: 500 })
  }
}

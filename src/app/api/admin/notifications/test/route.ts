import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/require-admin"
import { sendAdminNotification, getAdminLineUserIds } from "@/lib/notify"

export async function POST() {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN
  const userIds = await getAdminLineUserIds()

  if (!lineToken || userIds.length === 0) {
    return NextResponse.json({
      success: false,
      error: "ยังไม่ได้ตั้งค่า LINE Token หรือยังไม่มีรายชื่อ LINE User ID ของแอดมิน",
      hasToken: Boolean(lineToken),
      recipientCount: userIds.length,
    }, { status: 400 })
  }

  try {
    const timeStr = new Date().toLocaleTimeString("th-TH")
    const testMessage = `🔔 [ทดสอบระบบ] ทดสอบการแจ้งเตือนแอดมินทุกคนทาง LINE!\nจำนวนแอดมินที่ได้รับ: ${userIds.length} ท่าน\nเวลา: ${timeStr}\nผู้ทดสอบ: ${auth.user?.email || "Admin"}`
    const success = await sendAdminNotification(testMessage)

    if (success) {
      return NextResponse.json({
        success: true,
        recipientCount: userIds.length,
        message: `ส่งข้อความทดสอบไปยังแอดมินทั้งหมด ${userIds.length} ท่านเรียบร้อยแล้ว`,
      })
    } else {
      return NextResponse.json({
        success: false,
        recipientCount: userIds.length,
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

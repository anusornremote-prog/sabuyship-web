import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN
    if (!lineToken || !Array.isArray(body.events)) {
      return NextResponse.json({ status: "ok" })
    }

    for (const event of body.events) {
      if (event.type === "message" && event.message?.type === "text") {
        const text = (event.message.text || "").trim().toLowerCase()
        const replyToken = event.replyToken
        const userId = event.source?.userId
        const groupId = event.source?.groupId
        const roomId = event.source?.roomId

        if (text === "#uid" || text === "#id" || text === "รหัสแจ้งเตือน") {
          const targetId = groupId || roomId || userId
          const targetType = groupId ? "รหัสกลุ่ม LINE (Group ID)" : roomId ? "รหัสห้องแชท (Room ID)" : "รหัสส่วนตัว (User ID)"

          const replyMessage = `🔑 ข้อมูลสำหรับตั้งค่ารับแจ้งเตือนแอดมิน SabuyShip\n━━━━━━━━━━━━━━━\n📌 ประเภท: ${targetType}\n📋 รหัสของคุณคือ:\n${targetId}\n━━━━━━━━━━━━━━━\nนำรหัสนี้ไปวางในหน้า "ประวัติการแจ้งเตือน -> จัดการแอดมินรับแจ้งเตือน" บนเว็บไซต์ได้เลยครับ`

          if (replyToken && targetId) {
            await fetch("https://api.line.me/v2/bot/message/reply", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${lineToken}`,
              },
              body: JSON.stringify({
                replyToken,
                messages: [{ type: "text", text: replyMessage }],
              }),
            })
          }
        }
      }
    }

    return NextResponse.json({ status: "ok" })
  } catch (err) {
    console.error("LINE webhook error:", err)
    return NextResponse.json({ status: "ok" })
  }
}

export async function GET() {
  return NextResponse.json({ status: "LINE Webhook Ready" })
}


import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, phone, message } = body

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' },
        { status: 400 }
      )
    }

    const lineToken = process.env.LINE_NOTIFY_TOKEN

    if (!lineToken) {
      // If no token is configured, we just return success so the frontend works,
      // but log a warning on the server.
      console.warn('LINE_NOTIFY_TOKEN is not set. Message was not sent to LINE.')
      return NextResponse.json({ success: true, warning: 'No LINE token configured' })
    }

    // Format the message for LINE
    const lineMessage = `
🔔 มีข้อความใหม่จากหน้าเว็บติดต่อเรา
-------------------------
👤 ชื่อ: ${name}
📧 อีเมล: ${email}
📱 เบอร์โทร: ${phone || '-'}
💬 ข้อความ:
${message}
-------------------------`

    const response = await fetch('https://notify-api.line.me/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${lineToken}`,
      },
      body: new URLSearchParams({
        message: lineMessage,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('LINE Notify Error:', errorData)
      return NextResponse.json(
        { error: 'ไม่สามารถส่งข้อความได้ กรุณาลองใหม่อีกครั้ง' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในระบบ' },
      { status: 500 }
    )
  }
}

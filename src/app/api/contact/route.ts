import { NextResponse } from 'next/server'
import { sendAdminNotification } from '@/lib/notify'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, phone, message } = body

    if (!name || !email || !message || body.privacy_notice_acknowledged !== true) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' },
        { status: 400 }
      )
    }
    if (
      typeof name !== 'string' || name.trim().length > 120 ||
      typeof email !== 'string' || email.trim().length > 254 || !/^\S+@\S+\.\S+$/.test(email) ||
      (phone && (typeof phone !== 'string' || phone.trim().length > 30)) ||
      typeof message !== 'string' || message.trim().length > 3000
    ) {
      return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้องหรือยาวเกินกำหนด' }, { status: 400 })
    }

    const lineMessage = `🔔 มีข้อความใหม่จากหน้าเว็บติดต่อเรา
━━━━━━━━━━━━━━━
👤 ชื่อ: ${name}
📧 อีเมล: ${email}
📱 เบอร์โทร: ${phone || '-'}
💬 ข้อความ:
${message}
━━━━━━━━━━━━━━━`

    const sent = await sendAdminNotification(lineMessage)

    return NextResponse.json({ success: true, notification_sent: sent })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    )
  }
}

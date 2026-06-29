import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const trackingNumber = searchParams.get("tracking_number")

  if (!trackingNumber) {
    return NextResponse.json({ error: "Missing tracking_number" }, { status: 400 })
  }

  // TODO: Replace with real 17TRACK / Kuaidi100 API call when API key is available.
  // const API_KEY = process.env.TRACKING_API_KEY
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800))

  // For demonstration, we will generate a realistic mock timeline for ANY tracking number.
  // In reality, this data would come from the external API.
  const mockTimeline = [
    {
      date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      status: "พัสดุถึงศูนย์คัดแยกสินค้า กวางโจว (Guangzhou Sorting Center)",
      location: "Guangzhou, China",
    },
    {
      date: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      status: "พัสดุออกจากสาขาย่อย กำลังเดินทางไปศูนย์คัดแยก",
      location: "Guangzhou, China",
    },
    {
      date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      status: "บริษัทขนส่งเข้ารับพัสดุเรียบร้อยแล้ว",
      location: "Shenzhen, China",
    },
    {
      date: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
      status: "ร้านค้ากำลังเตรียมจัดส่งพัสดุ",
      location: "Shenzhen, China",
    }
  ]

  // Add random variation to mock
  const isFound = trackingNumber.length > 5;

  if (!isFound) {
    return NextResponse.json({
      success: false,
      message: "ไม่พบข้อมูลพัสดุ หรือหมายเลขพัสดุไม่ถูกต้อง",
      data: null
    })
  }

  return NextResponse.json({
    success: true,
    message: "Success",
    data: {
      tracking_number: trackingNumber,
      carrier: "ZTO Express",
      status: "IN_TRANSIT",
      timeline: mockTimeline
    }
  })
}

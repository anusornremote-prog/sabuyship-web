import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const trackingNumber = searchParams.get("tracking_number")

  if (!trackingNumber) {
    return NextResponse.json({ error: "Missing tracking_number" }, { status: 400 })
  }

  const API_KEY = process.env.TRACKINGMORE_API_KEY

  if (API_KEY) {
    try {
      // Real TrackingMore API Integration
      const response = await fetch(`https://api.trackingmore.com/v4/trackings/get?tracking_numbers=${trackingNumber}`, {
        method: "GET",
        headers: {
          "Tracking-Api-Key": API_KEY,
          "Content-Type": "application/json"
        }
      })

      const data = await response.json()

      if (data.meta?.code === 200 && data.data && data.data.length > 0) {
        const trackingData = data.data[0]
        
        // Format TrackingMore data to our timeline structure
        const timeline = trackingData.tracking_detail?.map((detail: any) => ({
          date: detail.checkpoint_date,
          status: detail.checkpoint_delivery_status || detail.checkpoint_status,
          location: detail.checkpoint_location || "Unknown",
        })) || []

        return NextResponse.json({
          success: true,
          message: "Success",
          data: {
            tracking_number: trackingData.tracking_number,
            carrier: trackingData.courier_code,
            status: trackingData.delivery_status,
            timeline: timeline
          }
        })
      } else {
         return NextResponse.json({
          success: false,
          message: "ไม่พบข้อมูลพัสดุจาก TrackingMore หรือหมายเลขพัสดุไม่ถูกต้อง",
          data: null
        })
      }
    } catch (err) {
      console.error("Error fetching from TrackingMore:", err)
      // Fallback to mock on error just for demo purposes (or return error)
    }
  }

  // Fallback to Mock Data (if no API Key or error occurred)
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800))

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
    message: "Success (Mock Data)",
    data: {
      tracking_number: trackingNumber,
      carrier: "ZTO Express",
      status: "IN_TRANSIT",
      timeline: mockTimeline
    }
  })
}

"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2, Package, Truck, CheckCircle2, MapPin } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type TimelineEvent = {
  date: string
  status: string
  location: string
  icon?: any
  color?: string
}

export default function TrackOrder() {
  const [trackingNumber, setTrackingNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [packageInfo, setPackageInfo] = useState<any>(null)
  const supabase = createClient()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackingNumber.trim()) return

    setLoading(true)
    setError("")
    setTimeline([])
    setPackageInfo(null)

    try {
      const searchNumber = trackingNumber.trim().toUpperCase()
      
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          status,
          created_at,
          quotation:quotation_id (
            inquiry:inquiry_id (
              product_url,
              items,
              shipping_type
            )
          ),
          shipments (
            tracking_number,
            container_date,
            arrival_date,
            thailand_tracking_number,
            status
          )
        `)
        .eq("order_number", searchNumber)
        .maybeSingle()

      if (orderError || !order) {
        setError("ไม่พบข้อมูลคำสั่งซื้อในระบบ กรุณาตรวจสอบหมายเลข Order ID อีกครั้ง")
        setLoading(false)
        return
      }

      setPackageInfo({
        tracking_number: order.order_number,
        product_name: (() => {
          const quotation = Array.isArray(order.quotation) ? order.quotation[0] : order.quotation
          const inquiry = Array.isArray(quotation?.inquiry) ? quotation.inquiry[0] : quotation?.inquiry
          return inquiry?.shipping_type === 'BOAT' ? 'ขนส่งทางเรือ (SEA)' : inquiry?.shipping_type === 'CAR' ? 'ขนส่งทางรถ (EK)' : 'สินค้าจาก SabuyShip'
        })(),
      })

      const statusMap: Record<string, number> = {
        'NEW': 0,
        'QUOTED': 0,
        'WAITING_PAYMENT': 0,
        'ORDERED': 1,
        'CHINA_WAREHOUSE': 2,
        'THAILAND_WAREHOUSE': 3,
        'OUT_FOR_DELIVERY': 4,
        'DELIVERED': 5
      }

      const currentStep = statusMap[order.status] || 0
      
      const allSteps = [
        { status: 'รับเข้าระบบ / กำลังดำเนินการสั่งซื้อ', location: 'SabuyShip', icon: Package, color: 'text-slate-500' },
        { status: 'สั่งซื้อสินค้าจากจีนเรียบร้อยแล้ว', location: 'ร้านค้าจีน', icon: Truck, color: 'text-blue-500' },
        { status: 'พัสดุถึงโกดังจีน (China Warehouse)', location: 'Guangzhou', icon: MapPin, color: 'text-orange-500' },
        { status: 'พัสดุถึงโกดังไทย (Thailand Warehouse)', location: 'Bangkok', icon: CheckCircle2, color: 'text-indigo-500' },
        { status: 'กำลังนำส่งไปที่บ้านลูกค้า', location: 'Thailand', icon: Truck, color: 'text-amber-500' },
        { status: 'จัดส่งสำเร็จ', location: 'Customer', icon: CheckCircle2, color: 'text-green-500' }
      ]

      let combinedTimeline: TimelineEvent[] = []
      
      for (let i = currentStep; i >= 0; i--) {
        // If it's NEW or WAITING_PAYMENT, we just show step 0
        if (i === 0 && currentStep > 0 && order.status !== 'ORDERED') continue; 
        
        let dateStr = new Date(order.created_at).toISOString() // Default to created_at
        
        // If there's shipments data, try to use it for dates
        if (order.shipments && order.shipments.length > 0) {
          const shipment = order.shipments[0]
          if (i === 2 && shipment.container_date) dateStr = new Date(shipment.container_date).toISOString()
          if (i === 3 && shipment.arrival_date) dateStr = new Date(shipment.arrival_date).toISOString()
        }

        combinedTimeline.push({
          date: dateStr,
          status: allSteps[i].status,
          location: allSteps[i].location,
          icon: allSteps[i].icon,
          color: allSteps[i].color
        })
      }

      setTimeline(combinedTimeline)
    } catch (err: any) {
      console.error(err)
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อระบบ กรุณาลองใหม่อีกครั้ง")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-20 px-4 md:px-8 min-h-screen bg-slate-50">
      <div className="container max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">ติดตามสถานะออเดอร์</h1>
          <p className="text-lg text-slate-600">
            กรอกหมายเลขคำสั่งซื้อ (Order ID) เพื่อดูสถานะสินค้าล่าสุด
          </p>
        </div>

        <Card className="shadow-md mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <Input 
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="ตัวอย่าง: ORD-26077893" 
                className="h-14 text-lg px-6 rounded-full uppercase"
                required
              />
              <Button type="submit" size="lg" className="h-14 px-10 rounded-full" variant="orange" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
                {loading ? "กำลังค้นหา..." : "ติดตามออเดอร์"}
              </Button>
            </form>
            {error && (
              <p className="text-red-500 text-center mt-4 font-medium">{error}</p>
            )}
          </CardContent>
        </Card>

        {packageInfo && timeline.length > 0 && (
          <Card className="shadow-sm border-t-4 border-t-primary">
            <CardHeader className="pb-2 border-b bg-slate-50/50">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <p className="text-sm text-slate-500 font-medium">หมายเลข Order ID</p>
                  <CardTitle className="text-2xl font-mono text-slate-800 tracking-wider">
                    {packageInfo.tracking_number}
                  </CardTitle>
                </div>
                {packageInfo.product_name && (
                  <div className="text-right">
                    <p className="text-sm text-slate-500 font-medium">สินค้า</p>
                    <p className="font-semibold text-slate-800">{packageInfo.product_name}</p>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative border-l-2 border-slate-200 ml-4 pl-8 py-2 space-y-10">
                {timeline.map((event, index) => {
                  const Icon = event.icon || MapPin
                  const isLatest = index === 0
                  return (
                    <div key={index} className="relative">
                      <div className={`absolute -left-[41px] p-1.5 rounded-full bg-white border-2 ${isLatest ? 'border-primary ring-4 ring-primary/20' : 'border-slate-300'}`}>
                        <Icon className={`w-5 h-5 ${event.color || (isLatest ? 'text-primary' : 'text-slate-400')}`} />
                      </div>
                      <div className="flex flex-col">
                        <span className={`font-semibold ${isLatest ? 'text-slate-900 text-lg' : 'text-slate-700'}`}>
                          {event.status}
                        </span>
                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                          <span>{new Date(event.date).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" /> {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

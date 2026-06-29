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
      // 1. Fetch Local Data (Shipments table)
      const { data: localShipment } = await supabase
        .from("shipments")
        .select("*")
        .eq("tracking_number", trackingNumber.trim())
        .maybeSingle()

      // 2. Fetch External Data (API)
      const res = await fetch(`/api/track/external?tracking_number=${trackingNumber.trim()}`)
      const externalData = await res.json()

      if (!localShipment && (!externalData.success || !externalData.data)) {
        setError("ไม่พบข้อมูลพัสดุในระบบ กรุณาตรวจสอบหมายเลขอีกครั้ง")
        setLoading(false)
        return
      }

      // Combine Data
      let combinedTimeline: TimelineEvent[] = []
      
      // External Timeline
      if (externalData.success && externalData.data?.timeline) {
        combinedTimeline = externalData.data.timeline.map((item: any) => ({
          date: item.date,
          status: item.status,
          location: item.location,
          icon: Package,
          color: "text-blue-500"
        }))
      }

      // Local Timeline (If exists)
      if (localShipment) {
        setPackageInfo(localShipment)
        
        // Add container date if exists
        if (localShipment.container_date) {
          // Attempt to parse container_date or just use a generic date
          // If it's just text, we'll place it at the end of the timeline
          combinedTimeline.push({
            date: new Date().toISOString(), // Mocking date for display if container_date is string
            status: `พัสดุขึ้นตู้แล้ว (วันที่: ${localShipment.container_date})`,
            location: "China Warehouse",
            icon: Truck,
            color: "text-orange-500"
          })
        }

        // Add arrival date if exists
        if (localShipment.arrival_date) {
          combinedTimeline.push({
            date: new Date().toISOString(),
            status: `พัสดุถึงไทยแล้ว (วันที่: ${localShipment.arrival_date})`,
            location: "Thailand Warehouse",
            icon: CheckCircle2,
            color: "text-green-500"
          })
        }
      }

      // Sort timeline (assuming date format is ISO string, latest first)
      // For local items with mocked date, they will appear at the top.
      combinedTimeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setTimeline(combinedTimeline)
      
      if (!packageInfo && externalData.data) {
        setPackageInfo({
          tracking_number: externalData.data.tracking_number,
          carrier: externalData.data.carrier
        })
      }

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
          <h1 className="text-4xl font-bold text-slate-900 mb-4">ติดตามสถานะพัสดุจีน</h1>
          <p className="text-lg text-slate-600">
            กรอกหมายเลขพัสดุ (Tracking Number) เพื่อดูสถานะล่าสุดจาก 17TRACK
          </p>
        </div>

        <Card className="shadow-md mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <Input 
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="ตัวอย่าง: YT1234567890" 
                className="h-14 text-lg px-6 rounded-full"
                required
              />
              <Button type="submit" size="lg" className="h-14 px-10 rounded-full" variant="orange" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
                {loading ? "กำลังค้นหา..." : "ติดตามพัสดุ"}
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
                  <p className="text-sm text-slate-500 font-medium">หมายเลขพัสดุ</p>
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

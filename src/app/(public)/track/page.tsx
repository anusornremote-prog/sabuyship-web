"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Loader2, 
  Package, 
  Truck, 
  CheckCircle2, 
  MapPin, 
  Copy, 
  Check, 
  ExternalLink,
  ArrowRight,
  Sparkles,
  Ship,
  Clock
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

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
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("คัดลอกรหัสออเดอร์แล้ว")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackingNumber.trim()) return

    setLoading(true)
    setError("")
    setTimeline([])
    setPackageInfo(null)

    try {
      const searchRaw = trackingNumber.trim()
      let searchClean = searchRaw.toUpperCase()
      if (!searchClean.startsWith("ORD-") && /^\d+$/.test(searchClean)) {
        searchClean = `ORD-${searchClean}`
      }
      
      // Try searching by order_number or tracking_number
      let { data: order, error: orderError } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          status,
          tracking_number,
          shipping_company,
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
        .or(`order_number.eq.${searchClean},tracking_number.eq.${searchRaw}`)
        .maybeSingle()

      if (orderError || !order) {
        setError("ไม่พบข้อมูลคำสั่งซื้อในระบบ กรุณาตรวจสอบหมายเลข Order ID อีกครั้ง เช่น ORD-XXXXXX")
        setLoading(false)
        return
      }

      const quotation = Array.isArray(order.quotation) ? order.quotation[0] : order.quotation
      const inquiry = Array.isArray(quotation?.inquiry) ? quotation.inquiry[0] : quotation?.inquiry

      setPackageInfo({
        order_id: order.id,
        tracking_number: order.order_number,
        thai_tracking: order.tracking_number,
        thai_carrier: order.shipping_company,
        status: order.status,
        created_at: order.created_at,
        shipping_type: inquiry?.shipping_type === 'BOAT' ? 'ขนส่งทางเรือ (SEA)' : 'ขนส่งทางรถ (EK)',
        is_boat: inquiry?.shipping_type === 'BOAT'
      })

      const statusMap: Record<string, number> = {
        'NEW': 0,
        'QUOTED': 0,
        'WAITING_PAYMENT': 0,
        'PAID': 1,
        'ORDERED': 1,
        'CHINA_WAREHOUSE': 2,
        'SHIPPING': 2,
        'THAILAND_WAREHOUSE': 3,
        'OUT_FOR_DELIVERY': 4,
        'DELIVERED': 5
      }

      const currentStep = statusMap[order.status] ?? 0
      setCurrentStepIndex(currentStep)
      
      const allSteps = [
        { status: 'รับคำขอเข้าระบบ / สรุปใบเสนอราคา', location: 'SabuyShip System', icon: Package, color: 'text-slate-500' },
        { status: 'สั่งซื้อสินค้าจากร้านค้าจีนเรียบร้อยแล้ว', location: 'ร้านค้าจีน (Taobao/1688)', icon: Truck, color: 'text-blue-500' },
        { status: 'พัสดุถึงโกดังจีน & ขึ้นตู้ส่งออก', location: 'โกดังกว่างโจว (Guangzhou)', icon: MapPin, color: 'text-purple-500' },
        { status: 'พัสดุถึงโกดังไทย (Thailand Warehouse)', location: 'โกดังไทย (Bangkok)', icon: CheckCircle2, color: 'text-indigo-500' },
        { status: 'กำลังนำส่งไปที่บ้านลูกค้า', location: 'ขนส่งในประเทศ', icon: Truck, color: 'text-orange-500' },
        { status: 'จัดส่งสำเร็จเรียบร้อย', location: 'หน้าบ้านลูกค้า', icon: CheckCircle2, color: 'text-emerald-500' }
      ]

      let combinedTimeline: TimelineEvent[] = []
      
      for (let i = currentStep; i >= 0; i--) {
        let dateStr = new Date(order.created_at).toISOString()
        
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

  const stepLabels = [
    { title: "สั่งซื้อสำเร็จ", icon: Package },
    { title: "ถึงโกดังจีน", icon: MapPin },
    { title: "ถึงโกดังไทย", icon: Ship },
    { title: "กำลังนำส่ง", icon: Truck },
    { title: "ส่งมอบสำเร็จ", icon: CheckCircle2 }
  ]

  return (
    <div className="py-16 md:py-24 px-4 md:px-8 min-h-screen bg-slate-50">
      <div className="container max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 text-primary rounded-full text-xs font-black uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            ระบบติดตามสถานะพัสดุเรียลไทม์ 24 ชม.
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            ติดตามสถานะพัสดุ <span className="text-primary">SabuyShip</span>
          </h1>
          <p className="text-base text-slate-600">
            กรอกหมายเลขคำสั่งซื้อ (Order ID) เพื่อตรวจสอบความเคลื่อนไหวล่าสุด
          </p>
        </div>

        {/* Search Box Card */}
        <Card className="border border-slate-200 shadow-xl rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Input 
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="กรอก Order ID เช่น ORD-26077893 หรือตัวเลข" 
                  className="h-14 text-base sm:text-lg px-5 pr-10 rounded-xl uppercase font-bold border-slate-300 focus:border-primary shadow-2xs"
                  required
                />
                {trackingNumber && (
                  <button
                    type="button"
                    onClick={() => setTrackingNumber("")}
                    className="absolute right-3.5 top-4.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ล้าง
                  </button>
                )}
              </div>
              <Button 
                type="submit" 
                size="lg" 
                className="h-14 px-8 rounded-xl font-black text-base shadow-md cursor-pointer shrink-0" 
                variant="orange" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    กำลังค้นหา...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    ติดตามออเดอร์
                  </div>
                )}
              </Button>
            </form>

            {error && (
              <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold rounded-xl text-center">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search Result View */}
        {packageInfo && timeline.length > 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Result Card */}
            <Card className="border border-slate-200 shadow-lg rounded-2xl bg-white overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-blue-50/80 via-white to-slate-50 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">หมายเลขคำสั่งซื้อ (Order Number)</span>
                  <div className="flex items-center gap-2.5 mt-1">
                    <span className="text-2xl font-black text-slate-900 tracking-wider">
                      {packageInfo.tracking_number}
                    </span>
                    <button
                      onClick={() => handleCopy(packageInfo.tracking_number)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                      title="คัดลอก Order ID"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-primary text-white font-bold px-3 py-1 text-xs border-0">
                    {packageInfo.shipping_type}
                  </Badge>
                  {packageInfo.thai_tracking && (
                    <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 font-bold px-3 py-1 text-xs">
                      {packageInfo.thai_carrier || "ขนส่งในไทย"}: {packageInfo.thai_tracking}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Visual 5-Stage Stepper Progress Bar */}
              <div className="p-6 md:p-8 bg-slate-50/60 border-b border-slate-100">
                <div className="grid grid-cols-5 gap-2 relative">
                  {stepLabels.map((step, idx) => {
                    const isPassed = currentStepIndex >= idx
                    const isCurrent = currentStepIndex === idx
                    const Icon = step.icon

                    return (
                      <div key={idx} className="flex flex-col items-center text-center relative z-10">
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center font-black transition-all ${
                          isCurrent
                            ? "bg-primary text-white shadow-lg shadow-blue-500/30 scale-110 ring-4 ring-blue-100"
                            : isPassed
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-200 text-slate-400"
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className={`text-[11px] sm:text-xs font-bold mt-2.5 ${
                          isCurrent ? "text-primary" : isPassed ? "text-slate-800" : "text-slate-400"
                        }`}>
                          {step.title}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Timeline Detail Events */}
              <CardContent className="p-6 md:p-8">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-6">
                  ประวัติการเดินทางของพัสดุ (Tracking History)
                </h4>

                <div className="relative border-l-2 border-blue-200 ml-4 pl-8 py-1 space-y-8">
                  {timeline.map((event, index) => {
                    const Icon = event.icon || MapPin
                    const isLatest = index === 0

                    return (
                      <div key={index} className="relative group">
                        {/* Dot / Icon badge */}
                        <div className={`absolute -left-[45px] p-2 rounded-full bg-white border-2 shadow-2xs ${
                          isLatest ? 'border-primary ring-4 ring-primary/20 scale-110' : 'border-slate-300'
                        }`}>
                          <Icon className={`w-4 h-4 ${isLatest ? 'text-primary' : 'text-slate-400'}`} />
                        </div>

                        {/* Event Content */}
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${isLatest ? 'text-slate-900 text-base' : 'text-slate-700 text-sm'}`}>
                              {event.status}
                            </span>
                            {isLatest && (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase">
                                ล่าสุด
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span>{new Date(event.date).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                            {event.location && (
                              <span className="flex items-center gap-1 text-slate-600 font-medium">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {event.location}
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
          </div>
        )}
      </div>
    </div>
  )
}

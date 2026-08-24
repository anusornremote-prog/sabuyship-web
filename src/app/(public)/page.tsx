"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Ship, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  ShoppingCart, 
  ArrowRight, 
  CheckCircle2, 
  Truck, 
  Sparkles, 
  Search, 
  CreditCard, 
  PackageCheck,
  Headphones,
  BadgePercent,
  Zap,
  Globe,
  Layers,
  Check
} from "lucide-react"
import { useTranslation } from "@/components/providers/language-provider"
import { createClient } from "@/lib/supabase/client"

export default function Home() {
  const router = useRouter()
  const { t, locale } = useTranslation()
  const [exchangeRate, setExchangeRate] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"quote" | "track">("quote")
  const [quickUrl, setQuickUrl] = useState("")
  const [quickTrackId, setQuickTrackId] = useState("")

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase.from('site_settings').select('value').eq('key', 'exchange_rate').single()
        if (data?.value) {
          setExchangeRate(data.value.toString())
        }
      } catch (err) {
        console.error("Error fetching exchange rate:", err)
      }
    }
    fetchRate()
  }, [])

  const handleQuickQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickUrl.trim()) {
      router.push("/inquiry")
      return
    }
    router.push(`/inquiry?url=${encodeURIComponent(quickUrl.trim())}`)
  }

  const handleQuickTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickTrackId.trim()) {
      router.push("/track")
      return
    }
    router.push(`/track?id=${encodeURIComponent(quickTrackId.trim())}`)
  }

  const platforms = [
    { name: "1688", tag: locale === 'en' ? 'Wholesale' : locale === 'zh' ? '源头厂家' : 'ราคาส่งโรงงาน', bg: "bg-orange-50 text-orange-700 border-orange-200" },
    { name: "Taobao", tag: locale === 'en' ? 'Trending' : locale === 'zh' ? '海量正品' : 'ปลีก-ส่งครบ', bg: "bg-amber-50 text-amber-700 border-amber-200" },
    { name: "Tmall", tag: locale === 'en' ? 'Authentic' : locale === 'zh' ? '官方旗舰' : 'แบรนด์แท้ 100%', bg: "bg-rose-50 text-rose-700 border-rose-200" },
    { name: "Pinduoduo", tag: locale === 'en' ? 'Deals' : locale === 'zh' ? '超值拼团' : 'ดีลสุดคุ้ม', bg: "bg-red-50 text-red-700 border-red-200" },
    { name: "Poizon", tag: locale === 'en' ? 'Streetwear' : locale === 'zh' ? '得物潮牌' : 'สตรีทแวร์', bg: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  ]

  return (
    <div className="flex flex-col bg-white">
      {/* 1. Hero Section (Mobile-First & Desktop Optimized) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/90 via-indigo-50/30 to-white pt-8 pb-12 sm:pt-14 sm:pb-20 px-4 sm:px-6 md:px-8">
        {/* Subtle background ambient circles */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-tr from-blue-400/15 to-orange-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="container max-w-6xl mx-auto relative z-10 space-y-8 sm:space-y-12">
          
          {/* Top Row: Exchange Rate Pill & Service Badges */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            {/* Live Exchange Rate Capsule */}
            {exchangeRate ? (
              <div className="inline-flex items-center gap-2 p-1.5 sm:px-3.5 sm:py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-blue-200/80 shadow-xs">
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-black uppercase tracking-wider">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  {locale === 'en' ? 'Live Rate' : locale === 'zh' ? '今日汇率' : 'เรทหยวนวันนี้'}
                </div>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-slate-800 pr-1.5">
                  <img src="https://flagcdn.com/w20/cn.png" width="16" alt="CN" className="rounded-xs" />
                  <span>1 ¥</span>
                  <span className="text-slate-300 font-black">=</span>
                  <img src="https://flagcdn.com/w20/th.png" width="16" alt="TH" className="rounded-xs" />
                  <span className="text-primary font-black text-sm sm:text-base">{exchangeRate} ฿</span>
                </div>
              </div>
            ) : <div />}

            {/* Micro USP Badges */}
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-900 rounded-full border border-amber-200/80">
                <Sparkles className="w-3 h-3 text-amber-600" />
                {locale === 'en' ? '0% Sourcing Fee' : locale === 'zh' ? '0% 免费代购' : 'ฟรีค่ากดสั่ง 0 บาท'}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-900 rounded-full border border-blue-200/80">
                <Zap className="w-3 h-3 text-blue-600" />
                {locale === 'en' ? 'Zero Minimum' : locale === 'zh' ? '无起运门槛' : 'ไม่มีขั้นต่ำ 1 ชิ้นก็ส่ง'}
              </span>
            </div>
          </div>

          {/* Main Hero Grid: Text & Action Card (Left) | Mascot (Right) */}
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-10 items-center">
            
            {/* Mascot Container (Appears First on Mobile with order-1, Right side on Desktop with lg:order-2) */}
            <div className="lg:col-span-5 flex justify-center order-1 lg:order-2">
              <div className="relative w-44 sm:w-60 lg:w-full max-w-sm aspect-square">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-300/30 via-indigo-200/20 to-orange-200/30 rounded-full blur-2xl animate-pulse" />
                <img 
                  src="/mascod.png" 
                  alt="Sabuy Ship Mascot" 
                  className="relative z-10 w-full h-full object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500" 
                />
              </div>
            </div>

            {/* Main Content (Appears Under Mascot on Mobile with order-2, Left side on Desktop with lg:order-1) */}
            <div className="lg:col-span-7 space-y-6 text-center sm:text-left order-2 lg:order-1">
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-[1.25]">
                  <span>{t.heroTitle1 || "สั่งของจีนง่าย"}</span>{" "}
                  <span className="text-slate-900">{t.heroTitle2 || "เหมือนช้อปในไทย"}</span>
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500">
                    {t.heroTitleHighlight1 || "แค่ส่งลิงก์มา..."}{" "}
                    {t.heroTitleHighlight2 || "ที่เหลือเราดูแลให้ครบ!"}
                  </span>
                </h1>
                
                <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto sm:mx-0 leading-relaxed">
                  {t.heroSub || "บริการฝากสั่งซื้อและนำเข้าสินค้าจากจีน Taobao, 1688, Tmall เรทหยวนตรงไปตรงมา ตรวจสอบสถานะได้ 24 ชั่วโมง"}
                </p>
              </div>

              {/* 🌟 Interactive Quick Action Box (Link Paste / Tracking) */}
              <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border-2 border-blue-200/90 shadow-xl shadow-blue-900/10 p-2 sm:p-4 space-y-3 text-left">
                {/* Tab Switcher */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveTab("quote")}
                    className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === "quote" 
                        ? "bg-white text-primary shadow-sm" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4 text-orange-500" />
                    <span>{locale === 'en' ? 'Paste Link for Quote' : locale === 'zh' ? '粘贴链接询价' : 'แปะลิงก์ขอราคาฟรี'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("track")}
                    className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === "track" 
                        ? "bg-white text-primary shadow-sm" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Search className="w-4 h-4 text-blue-600" />
                    <span>{locale === 'en' ? 'Track Parcel' : locale === 'zh' ? '查询快递状态' : 'เช็คสถานะพัสดุ'}</span>
                  </button>
                </div>

                {/* Tab Content 1: Quick Quote Form */}
                {activeTab === "quote" && (
                  <form onSubmit={handleQuickQuoteSubmit} className="flex flex-col sm:flex-row gap-2 pt-1 animate-in fade-in duration-200">
                    <div className="relative flex-1">
                      <Input
                        type="url"
                        placeholder="วางลิงก์ 1688, Taobao, Tmall ที่นี่..."
                        value={quickUrl}
                        onChange={(e) => setQuickUrl(e.target.value)}
                        className="h-12 sm:h-13 rounded-xl bg-slate-50 border-slate-200 font-mono text-xs sm:text-sm pl-3 pr-3"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      variant="orange" 
                      className="h-12 sm:h-13 px-6 text-sm sm:text-base font-black rounded-xl cursor-pointer shadow-md shadow-orange-500/25 shrink-0"
                    >
                      <Sparkles className="w-4 h-4 mr-1.5" />
                      {locale === 'en' ? 'Get Free Quote' : locale === 'zh' ? '获取报价' : 'ประเมินราคาฟรี ➔'}
                    </Button>
                  </form>
                )}

                {/* Tab Content 2: Quick Track Form */}
                {activeTab === "track" && (
                  <form onSubmit={handleQuickTrackSubmit} className="flex flex-col sm:flex-row gap-2 pt-1 animate-in fade-in duration-200">
                    <div className="relative flex-1">
                      <Input
                        type="text"
                        placeholder="กรอกรหัสออเดอร์ เช่น ORD-2608... หรือเลขพัสดุ"
                        value={quickTrackId}
                        onChange={(e) => setQuickTrackId(e.target.value)}
                        className="h-12 sm:h-13 rounded-xl bg-slate-50 border-slate-200 font-mono text-xs sm:text-sm pl-3 pr-3"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="h-12 sm:h-13 px-6 bg-primary text-white hover:bg-primary/90 text-sm sm:text-base font-black rounded-xl cursor-pointer shadow-md shrink-0"
                    >
                      <Search className="w-4 h-4 mr-1.5" />
                      {locale === 'en' ? 'Track Now' : locale === 'zh' ? '立即查询' : 'ตรวจสอบสถานะ ➔'}
                    </Button>
                  </form>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-0.5">
                  <span>⚡ ออกใบเสนอราคาฟรีใน 1-2 ชม.</span>
                  <Link href="/how-it-works" className="text-primary font-bold hover:underline">
                    ดูวิธีสั่งซื้อ ➔
                  </Link>
                </div>
              </div>

              {/* Supported Platforms Chips */}
              <div className="space-y-2 pt-1">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider text-left">
                  {locale === 'en' ? 'Supported Platforms:' : locale === 'zh' ? '支持采购平台：' : 'รองรับการสั่งซื้อจากทุกเว็บจีน:'}
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center sm:justify-start">
                  {platforms.map((p, idx) => (
                    <span 
                      key={idx} 
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border shadow-2xs ${p.bg}`}
                    >
                      <span className="font-black">{p.name}</span>
                      <span className="text-[10px] opacity-75">({p.tag})</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Speed & Shipping Channels (2x2 Mobile / 4 Desktop) */}
      <section className="py-6 sm:py-8 bg-slate-50/80 border-y border-slate-200/80">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            {/* Channel 1: Express Road */}
            <div className="flex items-center gap-3 p-3 sm:p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-orange-300 transition-colors">
              <div className="p-2.5 sm:p-3 bg-orange-100 text-orange-600 rounded-xl shrink-0">
                <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider block">
                  {t.speedRoad || "ทางรถด่วน (EK)"}
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-900 block truncate">
                  {t.speedRoadSub || "5 - 7 วันถึงไทย"}
                </span>
              </div>
            </div>

            {/* Channel 2: Economy Sea */}
            <div className="flex items-center gap-3 p-3 sm:p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 transition-colors">
              <div className="p-2.5 sm:p-3 bg-blue-100 text-primary rounded-xl shrink-0">
                <Ship className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider block">
                  {t.speedSea || "ทางเรือประหยัด (SEA)"}
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-900 block truncate">
                  {t.speedSeaSub || "15 - 20 วัน"}
                </span>
              </div>
            </div>

            {/* Channel 3: Free QC Check */}
            <div className="flex items-center gap-3 p-3 sm:p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-colors">
              <div className="p-2.5 sm:p-3 bg-emerald-100 text-emerald-600 rounded-xl shrink-0">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider block">
                  {t.speedCheck || "ตรวจเช็คสินค้า"}
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-900 block truncate">
                  {t.speedCheckSub || "มั่นใจของตรงปก"}
                </span>
              </div>
            </div>

            {/* Channel 4: LINE Push Support */}
            <div className="flex items-center gap-3 p-3 sm:p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-green-300 transition-colors">
              <div className="p-2.5 sm:p-3 bg-green-100 text-green-600 rounded-xl shrink-0">
                <Headphones className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider block">
                  {t.speedSupport || "ดูแลใกล้ชิด"}
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-900 block truncate">
                  {t.speedSupportSub || "แจ้งเตือนผ่าน LINE"}
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Simple 3 Steps Section (Clean & Touch-friendly) */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 md:px-8 bg-white">
        <div className="container max-w-6xl mx-auto space-y-8 sm:space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="inline-block px-3 py-1 bg-blue-100 text-primary rounded-full text-xs font-black uppercase tracking-wider">
              {t.homeStepsTag || "Easy Workflow"}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              {t.homeStepsTitle || "3 ขั้นตอนง่ายๆ สั่งของจีนถึงหน้าบ้านคุณ"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {t.homeStepsSub || "ไม่ต้องรู้ภาษาจีน ไม่ต้องมีบัญชีเถาเป่า แค่ส่งลิงก์มา ที่เหลือเราจัดการให้ครบ"}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            {/* Step 1 */}
            <div className="p-6 sm:p-8 bg-gradient-to-br from-blue-50/50 to-white rounded-3xl border border-blue-100 shadow-sm relative space-y-3">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-md shadow-blue-600/25">
                1
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">{t.homeStep1Title || "ก๊อปปี้ลิงก์สินค้าส่งให้เรา"}</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                {t.homeStep1Desc || "คัดลอกลิงก์สินค้าจาก Taobao, 1688 หรือ Tmall พร้อมแนบรูปหรือระบุสี/ไซส์ ส่งผ่านระบบเพื่อขอใบเสนอราคาฟรี"}
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 sm:p-8 bg-gradient-to-br from-orange-50/50 to-white rounded-3xl border border-orange-100 shadow-sm relative space-y-3">
              <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-md shadow-orange-500/25">
                2
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">{t.homeStep2Title || "ตรวจสอบราคา & ชำระเงิน"}</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                {t.homeStep2Desc || "ทีมงานต่อรองราคาส่งและแจ้งยอดค่าสินค้า (รอบ 1) คุณยืนยันและโอนชำระเงิน เรากดสั่งของจากร้านจีนทันที"}
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 sm:p-8 bg-gradient-to-br from-emerald-50/50 to-white rounded-3xl border border-emerald-100 shadow-sm relative space-y-3">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-md shadow-emerald-600/25">
                3
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">{t.homeStep3Title || "รอรับพัสดุส่งตรงถึงบ้าน"}</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                {t.homeStep3Desc || "สินค้าขนส่งมายังไทย ชำระค่าขนส่งตามจริง จากนั้นรอรับของส่งถึงหน้าบ้านพร้อมเลขแทร็กกิ้งตรวจสอบได้ตลอด 24 ชม."}
              </p>
            </div>
          </div>

          <div className="text-center pt-2">
            <Link href="/how-it-works">
              <Button variant="outline" className="font-bold text-xs sm:text-sm h-11 px-6 rounded-xl border-slate-300 hover:bg-slate-50 cursor-pointer">
                {t.homeViewAllSteps || "ดูขั้นตอนการทำงานแบบละเอียด 7 สเต็ป ➔"}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Why Choose Us (Value Proposition Grid) */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 md:px-8 bg-slate-50/80 border-t border-slate-200/80">
        <div className="container max-w-6xl mx-auto space-y-8 sm:space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              {t.whyTitle || "ทำไมต้องเลือก Sabuyship?"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              {t.whySub || "จุดเด่นที่ทำให้เราแตกต่าง มั่นใจ ปลอดภัย และคุ้มค่าทุกการสั่งซื้อ"}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 bg-blue-100 text-primary rounded-2xl flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">{t.cardSpeedTitle || "ขนส่งรวดเร็ว ตรงเวลา"}</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{t.cardSpeedDesc || "ขนส่งทางรถ 5-7 วัน ทางเรือ 15-20 วัน ตู้สินค้าออกตรงเวลาทุกสัปดาห์"}</p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">{t.cardSafeTitle || "ปลอดภัย สินค้าไม่สูญหาย"}</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{t.cardSafeDesc || "มีระบบบันทึกภาพและตรวจนับพัสดุในโกดังจีน ประกันสินค้าคุ้มครองความเสียหาย"}</p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 bg-orange-100 text-orange-700 rounded-2xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">{t.cardTrackTitle || "เช็คสถานะสดได้ 24 ชั่วโมง"}</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{t.cardTrackDesc || "ติดตามพัสดุได้ทุกขั้นตอนผ่านระบบหน้าเว็บ และแจ้งเตือนข้อความตรงเข้า LINE"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Bottom Call to Action Banner */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 md:px-8 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-orange-500/15 rounded-full blur-3xl" />
        <div className="container max-w-3xl mx-auto text-center space-y-6 relative z-10">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            {t.ctaTitle || "พร้อมเริ่มต้นสั่งสินค้าจากจีนแล้วหรือยัง?"}
          </h2>
          <p className="text-xs sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            {t.ctaSub || "แค่ก๊อปปี้ลิงก์สินค้าจาก Taobao หรือ 1688 ส่งให้เราประเมินราคาฟรี ไม่มีค่ากดสั่งซื้อ 0 บาท"}
          </p>
          <div className="pt-2">
            <Link href="/inquiry">
              <Button size="lg" variant="orange" className="text-sm sm:text-base px-8 h-13 font-black shadow-xl shadow-orange-500/25 rounded-xl cursor-pointer hover:shadow-orange-500/35 transition-all">
                <ShoppingCart className="w-4 h-4 mr-2" />
                {t.ctaBtn || "ส่งลิงก์สินค้า ขอใบเสนอราคาฟรี ➔"}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

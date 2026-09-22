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
  Check,
  Clipboard,
  ChevronRight,
  FileText
} from "lucide-react"
import { useTranslation } from "@/components/providers/language-provider"
import { vibrateTap, vibrateSuccess, readClipboardText } from "@/lib/haptics"
import { toast } from "sonner"
import { extractProductUrl } from "@/lib/product-link"
import { fetchExchangeRate } from "@/lib/exchange-rate"

export default function Home() {
  const router = useRouter()
  const { t, locale } = useTranslation()
  // Keep the first server/client render identical. The cached value is restored
  // after hydration, then refreshed from Supabase below.
  const [exchangeRate, setExchangeRate] = useState("5.10")
  const [activeTab, setActiveTab] = useState<"quote" | "track">("quote")
  const [quickUrl, setQuickUrl] = useState("")
  const [quickTrackId, setQuickTrackId] = useState("")

  const handlePasteQuickUrl = async () => {
    vibrateTap()
    const text = await readClipboardText()
    if (text) {
      setQuickUrl(extractProductUrl(text) || text)
      vibrateSuccess()
      toast.success(locale === 'zh' ? "链接已粘贴" : locale === 'en' ? "URL pasted" : "วางลิงก์เรียบร้อยแล้ว")
    } else {
      toast.info(locale === 'zh' ? "请手动粘贴" : locale === 'en' ? "Please paste into the box" : "กรุณากดวางลิงก์ลงในช่อง")
    }
  }

  useEffect(() => {
    const cachedRate = sessionStorage.getItem("sabuy_exchange_rate")
    if (cachedRate) setExchangeRate(cachedRate)

    const fetchRate = async () => {
      try {
        const rate = await fetchExchangeRate()
        if (rate) {
          const valStr = rate.toString()
          setExchangeRate(valStr)
          if (typeof window !== "undefined") {
            sessionStorage.setItem("sabuy_exchange_rate", valStr)
          }
        }
      } catch (err) {
        console.error("Error fetching exchange rate:", err)
      }
    }
    fetchRate()
  }, [])

  const handleQuickQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const productUrl = extractProductUrl(quickUrl)
    if (!productUrl) {
      router.push("/inquiry")
      return
    }
    router.push(`/inquiry?url=${encodeURIComponent(productUrl)}`)
  }

  const handleQuickUrlPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const productUrl = extractProductUrl(event.clipboardData.getData("text"))
    if (!productUrl) return

    event.preventDefault()
    setQuickUrl(productUrl)
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
    { name: "Tmall", tag: locale === 'en' ? 'Brand stores' : locale === 'zh' ? '品牌店铺' : 'ร้านค้าแบรนด์', bg: "bg-rose-50 text-rose-700 border-rose-200" },
    { name: "Pinduoduo", tag: locale === 'en' ? 'Deals' : locale === 'zh' ? '超值拼团' : 'ดีลสุดคุ้ม', bg: "bg-red-50 text-red-700 border-red-200" },
    { name: "Poizon", tag: locale === 'en' ? 'Streetwear' : locale === 'zh' ? '得物潮牌' : 'สตรีทแวร์', bg: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  ]

  return (
    <div className="flex flex-col bg-white">
      {/* 1. Hero Section (Mobile-First & Desktop Optimized) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/90 via-indigo-50/30 to-white pt-6 pb-10 sm:pt-10 sm:pb-14 lg:pt-14 lg:pb-16 px-4 sm:px-6 lg:px-8">
        {/* Subtle background ambient circles */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 sm:w-[500px] h-96 sm:h-[500px] bg-gradient-to-tr from-blue-400/15 via-indigo-400/10 to-orange-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="container max-w-7xl mx-auto relative z-10">

          {/* Main Hero Grid: Text & Action Card (Left) | Mascot (Right) */}
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Mascot Container (Appears First on Mobile with order-1, Right side on Desktop with lg:order-2) */}
            <div className="lg:col-span-5 flex justify-center order-1 lg:order-2">
              <div className="relative w-48 sm:w-64 lg:w-full max-w-md aspect-square">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-300/30 via-indigo-200/20 to-orange-200/30 rounded-full blur-2xl animate-pulse" />
                <picture>
                  <source srcSet="/mascod.webp" type="image/webp" />
                  <img 
                    src="/mascod.png" 
                    alt="Sabuy Ship Mascot" 
                    width={400}
                    height={400}
                    fetchPriority="high"
                    className="relative z-10 w-full h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500" 
                  />
                </picture>
              </div>
            </div>

            {/* Main Content (Appears Under Mascot on Mobile with order-2, Left side on Desktop with lg:order-1) */}
            <div className="lg:col-span-7 space-y-6 text-center sm:text-left order-2 lg:order-1">
              
              {/* 💰 Live Exchange Rate Capsule & Badges (Interactive Top Eyebrow) */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3">
                {exchangeRate && (
                  <button
                    type="button"
                    onClick={() => {
                      vibrateTap()
                      window.dispatchEvent(new CustomEvent('open-rmb-calculator'))
                    }}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-blue-200/90 shadow-xs hover:border-primary hover:scale-105 active:scale-95 transition-all cursor-pointer group"
                    title="คลิกเพื่อเปิดเครื่องคิดเลขแปลงเรทหยวน"
                  >
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-black uppercase tracking-wider">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      {locale === 'en' ? 'Live Rate' : locale === 'zh' ? '今日汇率' : 'เรทหยวนวันนี้'}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-slate-800 pr-1">
                      <img src="https://flagcdn.com/w20/cn.png" width="16" alt="CN" className="rounded-xs" />
                      <span>1 ¥</span>
                      <span className="text-slate-300 font-black">=</span>
                      <img src="https://flagcdn.com/w20/th.png" width="16" alt="TH" className="rounded-xs" />
                      <span className="text-primary font-black text-sm sm:text-base group-hover:underline">{exchangeRate} ฿</span>
                    </div>
                    <span className="text-[10px] text-slate-400 group-hover:text-primary font-bold pl-0.5">➔ คำนวณ</span>
                  </button>
                )}

                {/* Micro Badges */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs font-bold text-slate-600 max-w-full">
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-900 rounded-full border border-amber-200/80 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    {locale === 'en' ? '0% Service Fee' : locale === 'zh' ? '0% 免费采购' : 'ฟรีค่ากดสั่ง 0%'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-900 rounded-full border border-blue-200/80 shadow-2xs">
                    <Zap className="w-3.5 h-3.5 text-blue-600" />
                    {locale === 'en' ? 'No Minimum' : locale === 'zh' ? '无起运限制' : 'ไม่มีขั้นต่ำ 1 ชิ้นก็ส่ง'}
                  </span>
                </div>
              </div>

              {/* Main Headline */}
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl lg:text-[42px] xl:text-[48px] font-black tracking-tight text-slate-900 leading-[1.25]">
                  <span className="inline-block">{t.heroTitle1 || "สั่งของจีนง่าย"}</span>{" "}
                  <span className="inline-block text-slate-900">{t.heroTitle2 || "เหมือนช้อปในไทย"}</span>
                  <br className="hidden sm:inline" />
                  <span className="mt-1 block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500">
                    <span className="block sm:inline-block sm:whitespace-nowrap">{t.heroTitleHighlight1 || "ก๊อปปี้ลิงก์ส่งมา..."}</span>{" "}
                    <span className="block sm:inline-block sm:whitespace-nowrap">{t.heroTitleHighlight2 || "ที่เหลือเราดูแลให้ครบ!"}</span>
                  </span>
                </h1>
                
                <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-xl mx-auto sm:mx-0 leading-relaxed">
                  {t.heroSub || "บริการฝากสั่งซื้อและนำเข้าสินค้าจากจีน Taobao, 1688, Tmall เรทหยวนตรงไปตรงมา ตรวจสอบสถานะได้ 24 ชั่วโมง"}
                </p>
              </div>

              {/* 🌟 Interactive Quick Action Box (Hero Centerpiece) */}
              <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/90 shadow-xl shadow-blue-950/5 p-3 sm:p-5 space-y-4 text-left">
                {/* Tab Switcher */}
                <div className="flex bg-slate-100/90 p-1.5 rounded-2xl gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      vibrateTap()
                      setActiveTab("quote")
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      activeTab === "quote" 
                        ? "bg-white text-primary shadow-xs" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4 text-orange-500" />
                    <span>{locale === 'en' ? 'Paste Link for Quote' : locale === 'zh' ? '粘贴链接询价' : 'แปะลิงก์ขอราคาฟรี'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      vibrateTap()
                      setActiveTab("track")
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      activeTab === "track" 
                        ? "bg-white text-primary shadow-xs" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Search className="w-4 h-4 text-blue-600" />
                    <span>{locale === 'en' ? 'Track Parcel' : locale === 'zh' ? '查询快递状态' : 'เช็คสถานะพัสดุ'}</span>
                  </button>
                </div>

                {/* Tab Content 1: Quick Quote Form */}
                {activeTab === "quote" && (
                  <form onSubmit={handleQuickQuoteSubmit} className="flex flex-col sm:flex-row gap-2.5 pt-1 animate-in fade-in duration-200">
                    <div className="relative flex-1">
                      <Input
                        type="url"
                        placeholder="วางลิงก์ 1688, Taobao, Tmall ที่นี่..."
                        value={quickUrl}
                        onChange={(e) => setQuickUrl(e.target.value)}
                        onPaste={handleQuickUrlPaste}
                        onBlur={() => setQuickUrl(extractProductUrl(quickUrl) || quickUrl)}
                        className="h-13 sm:h-14 rounded-2xl bg-slate-50 border-slate-300/80 font-mono text-xs sm:text-sm pl-4 pr-24 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={handlePasteQuickUrl}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 text-xs font-black text-primary hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 px-3 py-1.5 rounded-xl transition-all cursor-pointer active:scale-95 shadow-2xs"
                      >
                        <Clipboard className="w-3.5 h-3.5 text-primary" />
                        <span>{locale === 'zh' ? '粘贴' : locale === 'en' ? 'Paste' : 'วางลิงก์'}</span>
                      </button>
                    </div>
                    <Button 
                      type="submit" 
                      variant="orange" 
                      className="h-13 sm:h-14 px-7 text-sm sm:text-base font-black rounded-2xl cursor-pointer shadow-lg shadow-orange-500/25 shrink-0 active:scale-[0.98] transition-all bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                    >
                      <Sparkles className="w-4 h-4 mr-1.5" />
                      {locale === 'en' ? 'Get Free Quote' : locale === 'zh' ? '获取报价' : 'ประเมินราคาฟรี ➔'}
                    </Button>
                  </form>
                )}

                {/* Tab Content 2: Quick Track Form */}
                {activeTab === "track" && (
                  <form onSubmit={handleQuickTrackSubmit} className="flex flex-col sm:flex-row gap-2.5 pt-1 animate-in fade-in duration-200">
                    <div className="relative flex-1">
                      <Input
                        type="text"
                        placeholder="กรอกรหัสออเดอร์ เช่น ORD-2608... หรือเลขพัสดุ"
                        value={quickTrackId}
                        onChange={(e) => setQuickTrackId(e.target.value)}
                        className="h-13 sm:h-14 rounded-2xl bg-slate-50 border-slate-300/80 font-mono text-xs sm:text-sm pl-4 pr-3 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="h-13 sm:h-14 px-7 bg-primary text-white hover:bg-primary/90 text-sm sm:text-base font-black rounded-2xl cursor-pointer shadow-md shrink-0 active:scale-[0.98] transition-all"
                    >
                      <Search className="w-4 h-4 mr-1.5" />
                      {locale === 'en' ? 'Track Now' : locale === 'zh' ? '立即查询' : 'ตรวจสอบสถานะ ➔'}
                    </Button>
                  </form>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 px-1 pt-0.5">
                  <span className="flex items-center gap-1 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    ออกใบเสนอราคาฟรีใน 1-2 ชม.
                  </span>
                  <Link href="/how-it-works" className="text-primary font-black hover:underline flex items-center gap-0.5">
                    <span>ดูวิธีสั่งซื้อ</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Supported Platforms Chips */}
              <div className="space-y-2.5 pt-2">
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider text-left">
                  {locale === 'en' ? 'Supported Platforms:' : locale === 'zh' ? '支持采购平台：' : 'รองรับการสั่งซื้อจากทุกเว็บจีนยอดนิยม:'}
                </p>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {platforms.map((p, idx) => (
                    <span 
                      key={idx} 
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-2xs ${p.bg}`}
                    >
                      <span className="font-black">{p.name}</span>
                      <span className="text-[11px] opacity-75">({p.tag})</span>
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

          {/* Three-payment timeline: mirrors the real operational workflow. */}
          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 sm:p-8">
            <div className="max-w-2xl mx-auto text-center mb-6 sm:mb-8">
              <span className="inline-flex items-center gap-2 text-xs font-black text-orange-700 bg-orange-100 px-3 py-1.5 rounded-full">
                <CreditCard className="w-4 h-4" />
                {locale === 'en' ? 'PAY ONLY WHEN EACH COST IS KNOWN' : locale === 'zh' ? '费用明确后再分阶段付款' : 'จ่ายตามจริงเมื่อทราบค่าใช้จ่ายแต่ละช่วง'}
              </span>
              <h3 className="mt-3 text-xl sm:text-2xl font-black text-slate-900">
                {locale === 'en' ? 'The 3 payment rounds, made clear' : locale === 'zh' ? '三阶段付款，一目了然' : 'ชำระเงิน 3 รอบ แบบโปร่งใส'}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                {locale === 'en' ? 'You pay each actual cost when the order reaches that stage—no need to pay every shipping cost upfront.' : locale === 'zh' ? '订单到达各阶段后按实际费用付款，无需一次预付全部运费。' : 'จ่ายทีละรอบเมื่อออเดอร์เดินทางถึงขั้นนั้น ไม่ต้องสำรองค่าขนส่งทั้งหมดตั้งแต่วันแรก'}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-3 sm:gap-4">
              {[
                {
                  round: '1',
                  icon: ShoppingCart,
                  tone: 'bg-blue-600 text-white',
                  title: locale === 'en' ? 'Product cost' : locale === 'zh' ? '商品费用' : 'ค่าสินค้า',
                  desc: locale === 'en' ? 'After you approve the item quotation.' : locale === 'zh' ? '确认商品报价后支付。' : 'ชำระหลังตรวจสอบและยืนยันใบเสนอราคา',
                },
                {
                  round: '2',
                  icon: Ship,
                  tone: 'bg-orange-500 text-white',
                  title: locale === 'en' ? 'China–Thailand freight' : locale === 'zh' ? '中泰跨境运费' : 'ค่าขนส่งจีน–ไทย',
                  desc: locale === 'en' ? 'Calculated when goods reach the China warehouse.' : locale === 'zh' ? '货物到达中国仓库后计算。' : 'คำนวณเมื่อสินค้าถึงโกดังจีน',
                },
                {
                  round: '3',
                  icon: Truck,
                  tone: 'bg-emerald-600 text-white',
                  title: locale === 'en' ? 'Thailand delivery' : locale === 'zh' ? '泰国境内配送费' : 'ค่าจัดส่งในไทย',
                  desc: locale === 'en' ? 'Choose delivery and pay when goods reach Thailand.' : locale === 'zh' ? '货物到达泰国后选择配送方式并付款。' : 'เลือกขนส่งและชำระเมื่อสินค้าถึงโกดังไทย',
                },
              ].map(({ round, icon: RoundIcon, tone, title, desc }, index) => (
                <div key={round} className="relative flex md:block gap-4 rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 shadow-xs">
                  {index < 2 && <span className="hidden md:block absolute top-9 -right-3.5 w-3 border-t-2 border-dashed border-slate-300" aria-hidden="true" />}
                  <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-black shadow-sm ${tone}`}>
                    <RoundIcon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 md:mt-4">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider">{locale === 'en' ? `Round ${round}` : locale === 'zh' ? `第 ${round} 阶段` : `รอบที่ ${round}`}</p>
                    <h4 className="mt-1 font-black text-slate-900">{title}</h4>
                    <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
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

          <div className="overflow-hidden rounded-3xl border border-blue-200/80 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white shadow-xl shadow-blue-950/10">
            <div className="grid lg:grid-cols-[1.05fr_1fr] gap-0">
              <div className="p-6 sm:p-8 lg:p-10">
                <span className="inline-flex items-center gap-2 text-xs font-black text-blue-100 bg-white/10 border border-white/10 px-3 py-1.5 rounded-full">
                  <ShieldCheck className="w-4 h-4" />
                  {locale === 'en' ? 'VERIFIABLE IN YOUR ACCOUNT' : locale === 'zh' ? '账户内全程可查' : 'ตรวจสอบได้จริงในบัญชีของคุณ'}
                </span>
                <h3 className="mt-4 text-2xl sm:text-3xl font-black leading-tight">
                  {locale === 'en' ? 'Every baht and every status has a record' : locale === 'zh' ? '每笔费用、每个状态都有记录' : 'ทุกยอด ทุกสถานะ มีหลักฐานในระบบ'}
                </h3>
                <p className="mt-3 text-sm text-slate-300 leading-relaxed max-w-xl">
                  {locale === 'en' ? 'Review itemized quotations, separate payment rounds and shipment updates yourself—without waiting for a chat reply.' : locale === 'zh' ? '商品明细、分阶段付款和物流更新均可自行查看，无需等待客服回复。' : 'ดูใบเสนอราคาแยกรายการ ประวัติชำระเงินแต่ละรอบ และสถานะขนส่งได้ด้วยตัวเอง ไม่ต้องรอถามแอดมิน'}
                </p>
                <Link href="/track" className="inline-flex items-center gap-2 mt-6 text-sm font-black text-white hover:text-orange-300 transition-colors">
                  <Search className="w-4 h-4" />
                  {locale === 'en' ? 'Open shipment tracking' : locale === 'zh' ? '打开物流查询' : 'เปิดหน้าติดตามสถานะ'}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="bg-white/7 border-t lg:border-t-0 lg:border-l border-white/10 p-5 sm:p-8">
                <div className="space-y-3">
                  {[
                    { icon: FileText, title: locale === 'en' ? 'Itemized quotation' : locale === 'zh' ? '明细报价单' : 'ใบเสนอราคาแยกรายการ', desc: locale === 'en' ? 'See product price, quantity and service details.' : locale === 'zh' ? '查看商品价格、数量及服务明细。' : 'เห็นราคาสินค้า จำนวน และรายละเอียดบริการ' },
                    { icon: Layers, title: locale === 'en' ? 'Three separate payment records' : locale === 'zh' ? '三阶段付款记录' : 'ประวัติชำระแยก 3 รอบ', desc: locale === 'en' ? 'Know exactly which cost is due at each stage.' : locale === 'zh' ? '清楚了解每阶段应付费用。' : 'รู้ชัดว่ากำลังชำระค่าอะไรในแต่ละช่วง' },
                    { icon: MapPin, title: locale === 'en' ? 'Shipment timeline + LINE alerts' : locale === 'zh' ? '物流时间线 + LINE 提醒' : 'ไทม์ไลน์ขนส่ง + แจ้งเตือน LINE', desc: locale === 'en' ? 'Follow important movement without chasing updates.' : locale === 'zh' ? '重要进度自动通知，无需反复询问。' : 'ติดตามความเคลื่อนไหวสำคัญได้โดยไม่ต้องคอยทักถาม' },
                  ].map(({ icon: ProofIcon, title, desc }) => (
                    <div key={title} className="flex gap-3 rounded-2xl bg-white/8 border border-white/10 p-4">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-orange-500 text-white flex items-center justify-center">
                        <ProofIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black">{title}</h4>
                        <p className="mt-1 text-xs text-slate-300 leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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

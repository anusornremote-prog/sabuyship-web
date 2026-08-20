"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
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
  BadgePercent
} from "lucide-react"
import { useTranslation } from "@/components/providers/language-provider"
import { createClient } from "@/lib/supabase/client"

export default function Home() {
  const { t, locale } = useTranslation()
  const [exchangeRate, setExchangeRate] = useState<string | null>(null)

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

  const platforms = [
    { name: "1688", tag: locale === 'en' ? 'Factory Wholesale' : locale === 'zh' ? '源头厂家' : 'ราคาส่งโรงงาน', color: "bg-orange-50 text-orange-700 border-orange-200" },
    { name: "Taobao", tag: locale === 'en' ? 'Retail & Trending' : locale === 'zh' ? '海量正品' : 'ปลีก-ส่งครบ', color: "bg-amber-50 text-amber-700 border-amber-200" },
    { name: "Tmall", tag: locale === 'en' ? '100% Brand Authentic' : locale === 'zh' ? '官方旗舰' : 'แบรนด์แท้ 100%', color: "bg-rose-50 text-rose-700 border-rose-200" },
    { name: "Pinduoduo", tag: locale === 'en' ? 'Best Deals' : locale === 'zh' ? '超值拼团' : 'ดีลสุดคุ้ม', color: "bg-red-50 text-red-700 border-red-200" },
    { name: "Poizon (得物)", tag: locale === 'en' ? 'Streetwear & Shoes' : locale === 'zh' ? '潮鞋潮牌' : 'สตรีทแวร์', color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  ]

  return (
    <div className="flex flex-col">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/80 via-blue-50/40 to-white py-16 md:py-24 px-4 md:px-8">
        <div className="container max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12 relative z-10">
          <div className="flex-1 space-y-7 text-center md:text-left">
            {/* Live Exchange Rate Pill */}
            {exchangeRate && (
              <div className="inline-flex flex-wrap items-center gap-3 p-2.5 sm:px-4 sm:py-2 bg-white/95 backdrop-blur-md rounded-2xl border border-blue-200/80 shadow-lg shadow-blue-900/5 animate-in fade-in slide-in-from-bottom-3 duration-500">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black uppercase tracking-wider">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  {t.heroExchangeRate || "เรทหยวนวันนี้"}
                </div>
                <div className="flex items-center gap-2.5 text-base sm:text-lg font-black text-slate-800">
                  <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                    <img src="https://flagcdn.com/w40/cn.png" srcSet="https://flagcdn.com/w80/cn.png 2x" width="20" alt="China Flag" className="rounded-[2px] shadow-2xs" />
                    <span>1 ¥</span>
                  </div>
                  <span className="text-slate-300 font-black">=</span>
                  <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 text-primary">
                    <img src="https://flagcdn.com/w40/th.png" srcSet="https://flagcdn.com/w80/th.png 2x" width="20" alt="Thailand Flag" className="rounded-[2px] shadow-2xs" />
                    <span className="text-xl font-black">{exchangeRate} ฿</span>
                  </div>
                </div>
              </div>
            )}

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-black tracking-tight text-slate-900 leading-[1.35] md:leading-[1.25]">
                <span className="inline-block whitespace-nowrap">{t.heroTitle1 || "สั่งของจีนง่าย"}</span>{" "}
                <span className="inline-block whitespace-nowrap text-slate-900">{t.heroTitle2 || "เหมือนช้อปในไทย"}</span>
                <br className="hidden sm:inline" />{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 inline-block">
                  <span className="inline-block whitespace-nowrap">{t.heroTitleHighlight1 || "ก๊อปปี้ลิงก์ส่งมา..."}</span>{" "}
                  <span className="inline-block whitespace-nowrap">{t.heroTitleHighlight2 || "ที่เหลือเราดูแลให้ครบ!"}</span>
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto md:mx-0 leading-relaxed">
                {t.heroSub}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3.5 justify-center md:justify-start pt-2">
              <Link href="/inquiry">
                <Button size="lg" variant="orange" className="w-full sm:w-auto text-base sm:text-lg px-8 h-14 cursor-pointer font-bold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 hover:-translate-y-0.5 transition-all">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {t.heroBtnSend}
                </Button>
              </Link>
              <Link href="/track">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base sm:text-lg px-7 h-14 bg-white/90 border-slate-300 hover:bg-slate-50 cursor-pointer font-semibold shadow-sm">
                  <Search className="w-5 h-5 mr-2 text-slate-500" />
                  {t.heroBtnTrack}
                </Button>
              </Link>
            </div>

            {/* Supported Chinese Platforms Bar */}
            <div className="pt-4 border-t border-slate-200/80">
              <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">
                {t.heroPlatformsTitle || "รองรับการสั่งซื้อและนำเข้าจากทุกเว็บชั้นนำของจีน:"}
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3">
                {platforms.map((platform, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border shadow-2xs ${platform.color}`}
                  >
                    <span className="font-black">{platform.name}</span>
                    <span className="text-[10px] opacity-80">({platform.tag})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Hero Mascot */}
          <div className="flex-1 w-full max-w-md lg:max-w-xl">
            <div className="relative w-full aspect-square mx-auto flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-300/40 via-indigo-200/30 to-orange-200/40 rounded-full blur-3xl"></div>
              <img 
                src="/mascod.png" 
                alt="Sabuy Ship Mascot" 
                className="relative z-10 w-full h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500 ease-out" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Speed & Trust Matrix Bar */}
      <section className="py-8 bg-white border-y border-slate-100 shadow-2xs">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="p-3 bg-blue-100 text-blue-700 rounded-xl shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{t.speedRoad || "ทางรถ (EK)"}</span>
                <span className="text-sm sm:text-base font-black text-slate-900">{t.speedRoadSub || "ด่วน 5 - 7 วันถึงไทย"}</span>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl shrink-0">
                <Ship className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{t.speedSea || "ทางเรือ (SEA)"}</span>
                <span className="text-sm sm:text-base font-black text-slate-900">{t.speedSeaSub || "ประหยัด 15 - 20 วัน"}</span>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{t.speedCheck || "ตรวจเช็คสินค้า"}</span>
                <span className="text-sm sm:text-base font-black text-slate-900">{t.speedCheckSub || "มั่นใจของตรงปก"}</span>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="p-3 bg-orange-100 text-orange-700 rounded-xl shrink-0">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{t.speedSupport || "ทีมงานดูแล"}</span>
                <span className="text-sm sm:text-base font-black text-slate-900">{t.speedSupportSub || "แจ้งเตือนผ่าน LINE"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Simple 3 Steps Section */}
      <section className="py-20 px-4 md:px-8 bg-slate-50">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-block px-3.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-black uppercase tracking-wider mb-3">
              {t.homeStepsTag || "How It Works"}
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              {t.homeStepsTitle || "3 ขั้นตอนง่ายๆ สั่งของจีนถึงหน้าบ้านคุณ"}
            </h2>
            <p className="text-slate-600 mt-2">
              {t.homeStepsSub || "ไม่ต้องรู้ภาษาจีน ไม่ต้องมีบัญชีเถาเป่า แค่ส่งลิงก์มา ที่เหลือเราจัดการให้ครบ"}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-xl mb-6 shadow-md shadow-blue-600/30">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{t.homeStep1Title || "ก๊อปปี้ลิงก์สินค้าส่งให้เรา"}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {t.homeStep1Desc || "คัดลอกลิงก์สินค้าจาก Taobao, 1688 หรือ Tmall พร้อมแนบรูปหรือระบุสี/ไซส์ ส่งผ่านระบบเพื่อขอใบเสนอราคาฟรี"}
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-500 text-white rounded-xl flex items-center justify-center font-black text-xl mb-6 shadow-md shadow-orange-500/30">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{t.homeStep2Title || "ตรวจสอบราคา & ชำระเงิน"}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {t.homeStep2Desc || "ทีมงานต่อรองราคาส่งและแจ้งยอดค่าสินค้า (รอบ 1) คุณยืนยันและโอนชำระเงิน เรากดสั่งของจากร้านจีนทันที"}
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-black text-xl mb-6 shadow-md shadow-emerald-600/30">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{t.homeStep3Title || "รอรับพัสดุส่งตรงถึงบ้าน"}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {t.homeStep3Desc || "สินค้าขนส่งมายังไทย ชำระค่าขนส่งตามจริง จากนั้นรอรับของส่งถึงหน้าบ้านพร้อมเลขแทร็กกิ้งตรวจสอบได้ตลอด 24 ชม."}
              </p>
            </div>
          </div>

          <div className="text-center mt-10">
            <Link href="/how-it-works">
              <Button variant="link" className="text-primary font-bold text-base hover:underline cursor-pointer">
                {t.homeViewAllSteps || "ดูขั้นตอนการทำงานแบบละเอียด 7 สเต็ป ➔"}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Why Choose Us */}
      <section className="py-20 px-4 md:px-8 bg-white border-t border-slate-100">
        <div className="container max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              {t.whyTitle}
            </h2>
            <p className="text-slate-600">
              {t.whySub}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:shadow-md transition-shadow space-y-4">
              <div className="w-14 h-14 bg-blue-100 text-primary rounded-2xl flex items-center justify-center">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{t.cardSpeedTitle}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{t.cardSpeedDesc}</p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:shadow-md transition-shadow space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{t.cardSafeTitle}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{t.cardSafeDesc}</p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:shadow-md transition-shadow space-y-4">
              <div className="w-14 h-14 bg-orange-100 text-orange-700 rounded-2xl flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{t.cardTrackTitle}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{t.cardTrackDesc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Bottom Call to Action Banner */}
      <section className="py-16 md:py-20 px-4 md:px-8 bg-slate-950 text-white">
        <div className="container max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            {t.ctaTitle}
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {t.ctaSub}
          </p>
          <div className="pt-2">
            <Link href="/inquiry">
              <Button size="lg" variant="orange" className="text-base sm:text-lg px-8 h-14 font-black shadow-xl shadow-orange-500/20 cursor-pointer">
                {t.ctaBtn}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

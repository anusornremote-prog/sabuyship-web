"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Ship, ShieldCheck, Clock, MapPin, ShoppingCart } from "lucide-react"
import { useTranslation } from "@/components/providers/language-provider"
import { createClient } from "@/lib/supabase/client"

export default function Home() {
  const { t } = useTranslation()
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

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-blue-50 py-20 px-4 md:px-8">
        <div className="container max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-8 text-center md:text-left">
            {exchangeRate && (
              <div className="inline-flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-white/90 backdrop-blur-md rounded-2xl border-2 border-blue-100 shadow-xl shadow-blue-900/5 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  อัปเดตเรทเงินวันนี้
                </div>
                <div className="flex items-center gap-3 text-lg font-bold text-slate-800">
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                    <img src="https://flagcdn.com/w40/cn.png" srcSet="https://flagcdn.com/w80/cn.png 2x" width="24" alt="China Flag" className="rounded-[2px] shadow-sm" />
                    <span>1 หยวน</span>
                  </div>
                  <span className="text-slate-300 font-black">=</span>
                  <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1.5 rounded-xl border border-blue-200 text-primary shadow-sm">
                    <img src="https://flagcdn.com/w40/th.png" srcSet="https://flagcdn.com/w80/th.png 2x" width="24" alt="Thailand Flag" className="rounded-[2px] shadow-sm" />
                    <span className="text-xl">{exchangeRate} บาท</span>
                  </div>
                </div>
              </div>
            )}
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
              {t.heroTitle} <span className="text-primary">{t.heroTitleHighlight}</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto md:mx-0">
              {t.heroSub}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link href="/inquiry">
                <Button size="lg" variant="orange" className="w-full sm:w-auto text-lg px-8 h-14 cursor-pointer">
                  {t.heroBtnSend}
                </Button>
              </Link>
              <Link href="/track">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 h-14 bg-white cursor-pointer">
                  {t.heroBtnTrack}
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex-1 w-full max-w-xl">
            {/* Mascot Hero Illustration */}
            <div className="relative w-full aspect-square mx-auto">
              <div className="absolute inset-0 bg-blue-200 rounded-full blur-3xl opacity-50 mix-blend-multiply dark:bg-blue-900/20"></div>
              <div className="absolute -inset-4 bg-orange-100 rounded-full blur-3xl opacity-30 mix-blend-multiply dark:bg-orange-900/10"></div>
              <div className="relative h-full w-full flex items-center justify-center">
                <img 
                  src="/mascod.png" 
                  alt="Sabuy Ship Mascot" 
                  className="w-full h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500 ease-out"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Special Feature Highlight */}
      <section className="py-20 px-4 md:px-8 bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="container max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-12 bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-orange-900/5 border border-orange-100">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mb-6 md:mb-0">
              <ShoppingCart className="w-12 h-12 md:w-16 md:h-16 text-orange-600" />
            </div>
            <div className="text-center md:text-left space-y-4">
              <div className="inline-block px-4 py-1.5 bg-orange-100 text-orange-700 font-bold rounded-full text-sm tracking-wide">
                จุดเด่นของเรา (Premium Service)
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">
                ฟรี! บริการฝากซื้อและ <span className="text-orange-500">เจรจาสั่งซื้อของ</span>
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto md:mx-0">
                บอกลาปัญหาคุยกับคนจีนไม่รู้เรื่อง! เรามีทีมงานผู้เชี่ยวชาญช่วยเจรจาสั่งซื้อสินค้า ต่อรองราคา และประสานงานกับร้านค้าจีนให้คุณ <strong className="text-slate-800">ฟรี! ไม่มีค่าใช้จ่ายแอบแฝง</strong> มั่นใจได้ของชัวร์ ตรงปก ราคาดีที่สุด
              </p>
              <div className="pt-4">
                <Link href="/inquiry">
                  <Button size="lg" variant="orange" className="text-lg px-8 h-14 cursor-pointer shadow-md hover:shadow-lg transition-all">
                    ส่งลิงก์ให้เราช่วยสั่งซื้อเลย
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 px-4 md:px-8 bg-white">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">{t.whyTitle}</h2>
            <p className="text-slate-600">{t.whySub}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-blue-50 border border-blue-100 text-center">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">{t.cardSpeedTitle}</h3>
              <p className="text-slate-600">{t.cardSpeedDesc}</p>
            </div>
            <div className="p-8 rounded-2xl bg-orange-50 border border-orange-100 text-center relative md:-top-4">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <ShieldCheck className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">{t.cardSafeTitle}</h3>
              <p className="text-slate-600">{t.cardSafeDesc}</p>
            </div>
            <div className="p-8 rounded-2xl bg-blue-50 border border-blue-100 text-center">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">{t.cardTrackTitle}</h3>
              <p className="text-slate-600">{t.cardTrackDesc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Simple CTA */}
      <section className="py-24 px-4 md:px-8 bg-slate-900 text-white text-center">
        <div className="container max-w-4xl mx-auto space-y-8">
          <h2 className="text-3xl md:text-5xl font-bold">{t.ctaTitle}</h2>
          <p className="text-xl text-slate-300">{t.ctaSub}</p>
          <div className="pt-4">
             <Link href="/inquiry">
                <Button size="lg" variant="orange" className="text-lg px-12 h-14 rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer">
                  {t.ctaBtn}
                </Button>
              </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

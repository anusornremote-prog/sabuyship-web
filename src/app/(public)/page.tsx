"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  BadgePercent,
  Box,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  FileText,
  Headphones,
  Layers3,
  MapPin,
  PackageCheck,
  Search,
  ShieldCheck,
  Ship,
  ShoppingCart,
  Sparkles,
  Truck,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/components/providers/language-provider"
import { extractProductUrl } from "@/lib/product-link"
import { fetchExchangeRate } from "@/lib/exchange-rate"
import { readClipboardText, vibrateSuccess, vibrateTap } from "@/lib/haptics"
import { toast } from "sonner"

const logisticsSteps = [
  { icon: ShoppingCart, number: "01", tone: "from-blue-600 to-indigo-600" },
  { icon: Ship, number: "02", tone: "from-orange-500 to-amber-500" },
  { icon: Truck, number: "03", tone: "from-emerald-500 to-teal-600" },
]

export default function Home() {
  const router = useRouter()
  const { t, locale } = useTranslation()
  const [exchangeRate, setExchangeRate] = useState("5.10")
  const [activeTab, setActiveTab] = useState<"quote" | "track">("quote")
  const [quickUrl, setQuickUrl] = useState("")
  const [quickTrackId, setQuickTrackId] = useState("")

  useEffect(() => {
    const cachedRate = sessionStorage.getItem("sabuy_exchange_rate")
    if (cachedRate) setExchangeRate(cachedRate)

    const loadRate = async () => {
      try {
        const rate = await fetchExchangeRate()
        if (!rate) return
        const value = rate.toString()
        setExchangeRate(value)
        sessionStorage.setItem("sabuy_exchange_rate", value)
      } catch (error) {
        console.error("Error fetching exchange rate:", error)
      }
    }

    void loadRate()
  }, [])

  const handlePasteQuickUrl = async () => {
    vibrateTap()
    const text = await readClipboardText()
    if (!text) {
      toast.info(locale === "zh" ? "请手动粘贴" : locale === "en" ? "Please paste into the box" : "กรุณากดวางลิงก์ลงในช่อง")
      return
    }
    setQuickUrl(extractProductUrl(text) || text)
    vibrateSuccess()
    toast.success(locale === "zh" ? "链接已粘贴" : locale === "en" ? "URL pasted" : "วางลิงก์เรียบร้อยแล้ว")
  }

  const handleQuickUrlPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = event.clipboardData.getData("text")
    const productUrl = extractProductUrl(pastedText)
    if (productUrl) {
      event.preventDefault()
      setQuickUrl(productUrl)
      toast.success(locale === "zh" ? "已自动提取商品链接" : locale === "en" ? "Product link extracted" : "ดึงลิงก์สินค้าจากข้อความแชร์ให้แล้ว")
    }
  }

  const handleQuickQuoteSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!quickUrl.trim()) {
      router.push("/inquiry")
      return
    }
    const productUrl = extractProductUrl(quickUrl)
    if (!productUrl) {
      toast.error(locale === "zh" ? "未检测到有效商品链接" : locale === "en" ? "No valid product URL found" : "ไม่พบลิงก์สินค้า กรุณาวางข้อความที่มี http:// หรือ https://")
      return
    }
    router.push(`/inquiry?url=${encodeURIComponent(productUrl)}`)
  }

  const handleQuickTrackSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    router.push(quickTrackId.trim() ? `/track?id=${encodeURIComponent(quickTrackId.trim())}` : "/track")
  }

  const stepCopy = [
    {
      title: t.homeStep1Title || "ส่งลิงก์สินค้าที่คุณต้องการ",
      description: t.homeStep1Desc || "วางลิงก์จาก Taobao, 1688 หรือ Tmall พร้อมระบุสี ไซส์ และจำนวน",
    },
    {
      title: t.homeStep2Title || "เราเช็กราคาและสั่งซื้อให้",
      description: t.homeStep2Desc || "ทีมงานตรวจร้าน คำนวณราคา และแจ้งยอดอย่างชัดเจนก่อนชำระ",
    },
    {
      title: t.homeStep3Title || "ติดตามจนถึงหน้าบ้าน",
      description: t.homeStep3Desc || "ดูสถานะทุกช่วง พร้อมหลักฐานและแจ้งเตือน LINE ตลอดเส้นทาง",
    },
  ]

  const paymentRounds = [
    { icon: ShoppingCart, round: "01", title: locale === "en" ? "Product cost" : locale === "zh" ? "商品费用" : "ค่าสินค้า", description: locale === "en" ? "After approving the quotation" : locale === "zh" ? "确认报价后支付" : "หลังตรวจสอบและยืนยันใบเสนอราคา" },
    { icon: Ship, round: "02", title: locale === "en" ? "China–Thailand freight" : locale === "zh" ? "中泰跨境运费" : "ค่าขนส่งจีน–ไทย", description: locale === "en" ? "When goods reach our China hub" : locale === "zh" ? "货物抵达中国仓库后" : "เมื่อสินค้าถึงโกดังจีน" },
    { icon: Truck, round: "03", title: locale === "en" ? "Thailand delivery" : locale === "zh" ? "泰国境内配送" : "ค่าจัดส่งในไทย", description: locale === "en" ? "Choose delivery after arrival" : locale === "zh" ? "抵泰后选择配送方式" : "เลือกขนส่งเมื่อสินค้าถึงไทย" },
  ]

  return (
    <div className="overflow-hidden bg-[#f8faff] text-slate-950">
      <section className="relative isolate px-4 pb-16 pt-8 sm:px-6 sm:pb-24 sm:pt-12 lg:px-8 lg:pb-28">
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,#dbeafe55_1px,transparent_1px),linear-gradient(to_bottom,#dbeafe55_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div className="absolute left-[-12rem] top-[-10rem] -z-10 h-[34rem] w-[34rem] rounded-full bg-blue-300/25 blur-3xl" />
        <div className="absolute right-[-12rem] top-8 -z-10 h-[32rem] w-[32rem] rounded-full bg-orange-300/20 blur-3xl" />

        <div className="site-container grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
          <div className="text-center lg:text-left">
            <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("open-rmb-calculator"))}
                className="eyebrow cursor-pointer transition hover:-translate-y-0.5 hover:border-blue-300"
              >
                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>
                {locale === "en" ? "LIVE RATE" : locale === "zh" ? "今日汇率" : "เรทหยวนวันนี้"} · ¥1 = ฿{exchangeRate}
              </button>
              <span className="eyebrow border-orange-200/80 text-orange-700"><Sparkles className="h-3.5 w-3.5" /> {locale === "en" ? "0% ordering fee" : locale === "zh" ? "0% 代购费" : "ฟรีค่ากดสั่ง 0%"}</span>
            </div>

            <h1 className="display-balance mt-7 text-[2.2rem] font-black leading-[1.12] tracking-[-0.04em] text-slate-950 min-[380px]:text-[2.35rem] sm:text-6xl lg:text-7xl">
              {t.heroTitle1 || "สั่งของจีนง่าย"}<br />
              <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-500 bg-clip-text text-transparent">{t.heroTitle2 || "เหมือนช้อปในไทย"}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg lg:mx-0">
              {t.heroSub || "บริการฝากสั่งซื้อและนำเข้าสินค้าจากจีนครบวงจร แค่ส่งลิงก์มา เราดูแลตั้งแต่เช็กร้านจนส่งถึงหน้าบ้าน"}
            </p>

            <div className="glass-panel mx-auto mt-8 w-full max-w-2xl rounded-[2rem] p-3 text-left sm:p-4 lg:mx-0">
              <div className="mb-3 grid grid-cols-2 rounded-2xl bg-slate-100/80 p-1.5">
                <button type="button" onClick={() => setActiveTab("quote")} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-black transition ${activeTab === "quote" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}><ShoppingCart className="h-4 w-4" />{locale === "en" ? "Get a quote" : locale === "zh" ? "商品询价" : "แปะลิงก์ขอราคา"}</button>
                <button type="button" onClick={() => setActiveTab("track")} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-black transition ${activeTab === "track" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}><Search className="h-4 w-4" />{locale === "en" ? "Track parcel" : locale === "zh" ? "物流查询" : "ติดตามพัสดุ"}</button>
              </div>

              {activeTab === "quote" ? (
                <form onSubmit={handleQuickQuoteSubmit} className="space-y-3">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                    <div className="relative min-w-0 flex-1">
                      <Input value={quickUrl} onChange={(event) => setQuickUrl(event.target.value)} onPaste={handleQuickUrlPaste} placeholder={locale === "en" ? "Paste a product link or shared message" : locale === "zh" ? "粘贴商品链接或分享文案" : "วางลิงก์ หรือข้อความแชร์จากแอปจีนได้เลย"} className="h-14 rounded-2xl border-slate-200 bg-white pl-5 pr-12 text-base shadow-inner focus-visible:ring-blue-500" />
                      <button type="button" onClick={handlePasteQuickUrl} className="absolute right-2 top-2 grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700 transition hover:bg-blue-100" aria-label="Paste product link"><Copy className="h-4 w-4" /></button>
                    </div>
                    <Button type="submit" variant="orange" className="h-14 shrink-0 rounded-2xl px-4 sm:px-7">{locale === "en" ? "Quote" : locale === "zh" ? "询价" : "เช็กราคา"}<ArrowRight className="ml-1.5 hidden h-4 w-4 sm:block" /></Button>
                  </div>
                  <p className="flex items-center gap-2 px-1 text-xs text-slate-500"><Zap className="h-3.5 w-3.5 text-orange-500" />{locale === "en" ? "We automatically extract the URL from shared text." : locale === "zh" ? "系统会自动从分享文案中提取链接。" : "ระบบดึง URL ออกจากข้อความภาษาจีนให้อัตโนมัติ"}</p>
                </form>
              ) : (
                <form onSubmit={handleQuickTrackSubmit} className="flex gap-2">
                  <Input value={quickTrackId} onChange={(event) => setQuickTrackId(event.target.value)} placeholder={locale === "en" ? "Order or tracking number" : locale === "zh" ? "订单号或运单号" : "เลขออเดอร์ หรือเลขพัสดุ"} className="h-14 rounded-2xl border-slate-200 bg-white px-5 text-base" />
                  <Button type="submit" className="h-14 rounded-2xl px-5 sm:px-7">{locale === "en" ? "Track" : locale === "zh" ? "查询" : "ติดตาม"}<ArrowRight className="ml-2 h-4 w-4" /></Button>
                </form>
              )}
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-bold text-slate-600 lg:justify-start">
              {[locale === "en" ? "No minimum" : locale === "zh" ? "无最低数量" : "ไม่มีขั้นต่ำ", locale === "en" ? "Real-time status" : locale === "zh" ? "实时追踪" : "ติดตามได้ 24 ชม.", locale === "en" ? "Thai support" : locale === "zh" ? "泰语客服" : "แอดมินไทยดูแล"].map((label) => <span key={label} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" />{label}</span>)}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute inset-[8%] rounded-full bg-gradient-to-br from-blue-600 via-indigo-500 to-orange-400 opacity-90 blur-[1px]" />
            <div className="absolute inset-[3%] animate-orbit-soft rounded-full border border-dashed border-blue-300/80" />
            <div className="absolute left-0 top-[18%] z-20 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-xl backdrop-blur animate-float-soft"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">China → Thailand</p><p className="mt-1 flex items-center gap-2 text-sm font-black text-slate-800"><PackageCheck className="h-4 w-4 text-emerald-500" /> ดูแลครบทุกช่วง</p></div>
            <div className="absolute bottom-[12%] right-0 z-20 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-xl backdrop-blur"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Transparent</p><p className="mt-1 flex items-center gap-2 text-sm font-black text-slate-800"><ShieldCheck className="h-4 w-4 text-blue-600" /> จ่ายตามจริง 3 รอบ</p></div>
            <div className="relative z-10 mx-auto aspect-square w-[84%] animate-float-soft">
              <Image src="/mascod.webp" alt="Sabuy Ship mascot" fill priority sizes="(max-width: 768px) 84vw, 520px" className="object-contain drop-shadow-[0_32px_35px_rgba(15,23,42,0.2)]" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-blue-100/80 bg-white/80 px-4 py-5 backdrop-blur sm:px-6">
        <div className="site-container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-xs font-black uppercase tracking-[0.18em] text-slate-400 md:text-left">{locale === "en" ? "Shop from China’s leading platforms" : locale === "zh" ? "支持中国主流购物平台" : "สั่งได้ครบทุกแพลตฟอร์มจีนยอดนิยม"}</p>
          <div className="flex flex-wrap justify-center gap-2">{["1688", "TAOBAO", "TMALL", "PINDUODUO", "POIZON"].map((platform) => <span key={platform} className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-black tracking-wide text-slate-600">{platform}</span>)}</div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="site-container">
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow"><Sparkles className="h-3.5 w-3.5" /> EASY FROM LINK TO DOOR</span>
            <h2 className="display-balance mt-5 text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-5xl">{t.homeStepsTitle || "จากลิงก์สินค้า ถึงหน้าบ้าน ใน 3 ขั้นตอน"}</h2>
            <p className="mt-4 text-slate-600">{t.homeStepsSub || "ไม่ต้องรู้ภาษาจีน ไม่ต้องมีบัญชีแอปจีน และไม่ต้องจัดการขนส่งเอง"}</p>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {logisticsSteps.map(({ icon: Icon, number, tone }, index) => (
              <article key={number} className="premium-card group relative overflow-hidden rounded-[2rem] p-7 sm:p-8">
                <span className="absolute right-5 top-3 text-7xl font-black text-slate-100 transition group-hover:text-blue-50">{number}</span>
                <div className={`relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${tone} text-white shadow-lg`}><Icon className="h-6 w-6" /></div>
                <h3 className="relative mt-7 text-xl font-black text-slate-900">{stepCopy[index].title}</h3>
                <p className="relative mt-3 text-sm leading-7 text-slate-600">{stepCopy[index].description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8">
        <div className="site-container overflow-hidden rounded-[2.5rem] bg-[#071a3f] text-white shadow-[0_35px_100px_rgba(7,26,63,0.25)]">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative overflow-hidden p-8 sm:p-12 lg:p-14">
              <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-blue-500/30 blur-3xl" />
              <div className="absolute -bottom-20 right-0 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />
              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-black tracking-wide text-blue-100"><CreditCard className="h-4 w-4" /> PAY AS THE JOURNEY MOVES</span>
                <h2 className="display-balance mt-6 text-3xl font-black tracking-[-0.035em] sm:text-5xl">{locale === "en" ? "Clear costs. Zero surprises." : locale === "zh" ? "费用透明，没有意外。" : "ค่าใช้จ่ายชัดเจน ไม่มีบวกทีหลัง"}</h2>
                <p className="mt-5 max-w-xl leading-8 text-blue-100/75">{locale === "en" ? "Each payment happens only when the real cost is known at that stage." : locale === "zh" ? "每一阶段费用明确后再付款，无需预付全部运费。" : "จ่ายเงินเมื่อทราบค่าใช้จ่ายจริงในแต่ละช่วง ไม่ต้องสำรองค่าขนส่งทั้งหมดตั้งแต่วันแรก"}</p>
                <Link href="/how-it-works" className="mt-8 inline-flex items-center gap-2 text-sm font-black text-orange-300 transition hover:text-orange-200">ดูขั้นตอนทั้งหมด <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </div>
            <div className="grid gap-px bg-white/10 sm:grid-cols-3 lg:grid-cols-1">
              {paymentRounds.map(({ icon: Icon, round, title, description }) => (
                <div key={round} className="group flex gap-4 bg-white/[0.055] p-6 transition hover:bg-white/[0.09] sm:block lg:flex lg:p-8">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-orange-300"><Icon className="h-5 w-5" /></div>
                  <div className="sm:mt-4 lg:mt-0"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">ROUND {round}</p><h3 className="mt-1 font-black">{title}</h3><p className="mt-1 text-sm leading-6 text-blue-100/65">{description}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="site-container grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <span className="eyebrow"><ShieldCheck className="h-3.5 w-3.5" /> BUILT FOR PEACE OF MIND</span>
            <h2 className="display-balance mt-5 text-3xl font-black tracking-[-0.035em] sm:text-5xl">{t.whyTitle || "เห็นทุกยอด รู้ทุกสถานะ มั่นใจทุกออเดอร์"}</h2>
            <p className="mt-5 leading-8 text-slate-600">ดูใบเสนอราคา การชำระเงิน และเส้นทางพัสดุได้ในบัญชีของคุณ พร้อมทีมงานไทยที่ช่วยดูแลเมื่อคุณต้องการ</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[{ icon: FileText, title: "ใบเสนอราคาแยกรายการ", desc: "เห็นราคา จำนวน และรายละเอียดชัดเจน" }, { icon: Layers3, title: "ประวัติชำระครบ 3 รอบ", desc: "รู้ว่าจ่ายค่าอะไรในแต่ละช่วง" }, { icon: MapPin, title: "ไทม์ไลน์ขนส่ง", desc: "ติดตามความเคลื่อนไหวได้ 24 ชั่วโมง" }, { icon: Headphones, title: "ทีมงานไทยดูแล", desc: "คุยง่าย เข้าใจตรงกัน ไม่ต้องแปลเอง" }].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-700"><Icon className="h-5 w-5" /></div><div><h3 className="text-sm font-black text-slate-900">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{desc}</p></div></div>
              ))}
            </div>
          </div>
          <div className="relative rounded-[2.5rem] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-orange-50 p-6 shadow-2xl shadow-blue-900/10 sm:p-9">
            <div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-blue-600">Order Journey</p><h3 className="mt-1 text-xl font-black text-slate-950">ออเดอร์ #SS-240918</h3></div><span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-black text-emerald-700">กำลังเดินทาง</span></div>
            <div className="mt-8 space-y-1">
              {[{ icon: Check, title: "ยืนยันและสั่งซื้อสินค้า", meta: "เสร็จแล้ว", done: true }, { icon: PackageCheck, title: "ถึงโกดังจีน", meta: "ตรวจรับสินค้าแล้ว", done: true }, { icon: Ship, title: "ขนส่งจีน–ไทย", meta: "กำลังเดินทาง", done: false }, { icon: Box, title: "ถึงโกดังไทย", meta: "ขั้นตอนถัดไป", done: false }].map(({ icon: Icon, title, meta, done }, index) => (
                <div key={title} className="relative flex gap-4 pb-6 last:pb-0">{index < 3 && <span className={`absolute left-5 top-10 h-full w-px ${done ? "bg-blue-300" : "bg-slate-200"}`} />}<div className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border-4 border-white shadow-sm ${done ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}><Icon className="h-4 w-4" /></div><div className="pt-1"><p className="font-black text-slate-900">{title}</p><p className={`mt-1 text-xs font-bold ${done ? "text-blue-600" : "text-slate-400"}`}>{meta}</p></div></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="site-container relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-700 via-blue-700 to-indigo-800 px-6 py-14 text-center text-white shadow-2xl shadow-blue-900/20 sm:px-12 sm:py-20">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" /><div className="absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-orange-400/25 blur-3xl" />
          <div className="relative mx-auto max-w-3xl"><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-black"><BadgePercent className="h-4 w-4 text-orange-300" /> เริ่มต้นฟรี ไม่มีขั้นต่ำ</span><h2 className="display-balance mt-5 text-3xl font-black tracking-[-0.04em] sm:text-5xl">{t.ctaTitle || "พร้อมให้ของจากจีน เดินทางมาหาคุณหรือยัง?"}</h2><p className="mx-auto mt-5 max-w-2xl leading-8 text-blue-100">{t.ctaSub || "ส่งลิงก์มาให้เราเช็กราคาก่อนได้ ไม่มีค่ากดสั่ง และยังไม่ต้องผูกมัด"}</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/inquiry"><Button variant="orange" size="lg" className="w-full rounded-2xl sm:w-auto"><ShoppingCart className="mr-2 h-5 w-5" />ส่งลิงก์ ขอราคาฟรี</Button></Link><Link href="/track"><Button size="lg" className="w-full rounded-2xl border border-white/20 bg-white/10 text-white shadow-none hover:bg-white/20 hover:text-white sm:w-auto"><Search className="mr-2 h-5 w-5" />ติดตามพัสดุ</Button></Link></div></div>
        </div>
      </section>
    </div>
  )
}

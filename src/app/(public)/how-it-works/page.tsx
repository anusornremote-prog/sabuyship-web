"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Link2, 
  Calculator, 
  CreditCard, 
  Truck, 
  Ship, 
  PackageCheck, 
  CheckCircle2, 
  Layers, 
  ShieldCheck, 
  Bell, 
  HelpCircle, 
  ChevronDown, 
  ArrowRight,
  Sparkles,
  PackagePlus,
  RefreshCw
} from "lucide-react"
import { useTranslation } from "@/components/providers/language-provider"

export default function HowItWorks() {
  const { t } = useTranslation()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const phases = [
    {
      phaseNumber: "1",
      phaseTitle: "รอบที่ 1: สั่งซื้อและชำระค่าสินค้า",
      phaseBadge: "ชำระค่าสินค้า + ค่าส่งในจีน",
      phaseColor: "from-blue-600 to-indigo-600 text-white",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      steps: [
        {
          stepNumber: "01",
          title: "ลูกค้าส่งลิงก์สินค้า (Submit Link)",
          description: "คัดลอกลิงก์สินค้าจาก Taobao, 1688, Tmall, Pinduoduo หรือแนบรูปภาพ ระบุจำนวน สี ขนาด และเลือกบริการเสริมตีลังไม้ได้ตามต้องการ",
          icon: Link2,
          iconBg: "bg-blue-100 text-blue-600",
          tag: "ขั้นตอนของลูกค้า"
        },
        {
          stepNumber: "02",
          title: "ทีมงานประเมินราคา & ออกใบเสนอราคา (Quotation)",
          description: "เจ้าหน้าที่ผู้เชี่ยวชาญตรวจสอบสต็อก ประสานงานคุยต่อรองราคากับร้านค้าจีนให้ฟรี และคำนวณยอดเงินบาทตามเรทเงินหยวนจริงในระบบ",
          icon: Calculator,
          iconBg: "bg-indigo-100 text-indigo-600",
          tag: "ทีมงานดำเนินการ"
        },
        {
          stepNumber: "03",
          title: "ยืนยันและชำระเงินรอบที่ 1 (Payment Round 1)",
          description: "ลูกค้าตรวจสอบใบเสนอราคา กดยืนยันสั่งซื้อ และโอนชำระเงินค่าสินค้า (รอบ 1) พร้อมแนบสลิป ทีมงานจะทำการกดสั่งซื้อจากร้านค้าจีนทันที",
          icon: CreditCard,
          iconBg: "bg-orange-100 text-orange-600",
          tag: "ชำระเงินรอบ 1"
        }
      ]
    },
    {
      phaseNumber: "2",
      phaseTitle: "รอบที่ 2: ขนส่งระหว่างประเทศจีน-ไทย",
      phaseBadge: "ชำระค่าขนส่งจีน-ไทย ตามน้ำหนัก/คิวจริง",
      phaseColor: "from-purple-600 to-indigo-700 text-white",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
      steps: [
        {
          stepNumber: "04",
          title: "สินค้าถึงโกดังจีน & ขนส่งมาไทย (Transit to Thailand)",
          description: "เมื่อร้านจีนส่งของถึงโกดังจีน ทีมงานจะทำการตรวจสอบสภาพ ชั่งน้ำหนัก (KG) และวัดขนาดคิวบิกเมตร (CBM) จากนั้นนำเข้าตู้คอนเทนเนอร์ขนส่งมาไทย (ทางรถด่วน 5-7 วัน / ทางเรือประหยัด 15-20 วัน)",
          icon: Truck,
          iconBg: "bg-purple-100 text-purple-600",
          tag: "ขนส่งระหว่างประเทศ"
        },
        {
          stepNumber: "05",
          title: "สินค้าถึงโกดังไทย & แจ้งบิลรอบ 2 (Payment Round 2)",
          description: "เมื่อสินค้ามาถึงโกดังไทยอย่างปลอดภัย ระบบจะคำนวณค่าขนส่งจีน-ไทยตามจริง และแจ้งเตือนให้ลูกค้าชำระเงินค่าขนส่งรอบที่ 2 ผ่านระบบ",
          icon: PackageCheck,
          iconBg: "bg-purple-100 text-purple-600",
          tag: "ชำระเงินรอบ 2"
        }
      ]
    },
    {
      phaseNumber: "3",
      phaseTitle: "รอบที่ 3: จัดส่งถึงหน้าบ้านคุณในไทย",
      phaseBadge: "ค่าส่งในไทย (รวมบิลประหยัดได้ หรือรับเองฟรี)",
      phaseColor: "from-emerald-600 to-teal-700 text-white",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      steps: [
        {
          stepNumber: "06",
          title: "แจ้งค่าจัดส่งในประเทศ หรือรวมบิล (Domestic Delivery / Consolidation)",
          description: "ลูกค้าสามารถเลือกมารับสินค้าเองที่โกดัง (ไม่มีค่าใช้จ่าย) หรือให้จัดส่งผ่านขนส่งเอกชน (Flash, Kerry, J&T, ไปรษณีย์ไทย) พิเศษ! สามารถกด 'รวมบิลหลายออเดอร์' เพื่อแพ็ครวมกล่องประหยัดค่าส่งได้",
          icon: Layers,
          iconBg: "bg-teal-100 text-teal-600",
          tag: "ชำระเงินรอบ 3"
        },
        {
          stepNumber: "07",
          title: "จัดส่งพัสดุถึงมือคุณอย่างปลอดภัย (Delivered)",
          description: "หลังจากชำระครบถ้วน สินค้าจะถูกจัดส่งตรงถึงหน้าบ้านพร้อมอัปเดตเลขพัสดุ (Tracking) ให้คุณตรวจสอบสถานะได้ตลอด 24 ชม. เมื่อได้รับของแล้วกด 'ยืนยันรับสินค้า' เป็นอันเสร็จสมบูรณ์",
          icon: CheckCircle2,
          iconBg: "bg-emerald-100 text-emerald-600",
          tag: "เสร็จสมบูรณ์"
        }
      ]
    }
  ]

  const faqs = [
    {
      q: "การขนส่งทางรถ (EK) กับทางเรือ (SEA) ต่างกันอย่างไร และใช้เวลากี่วัน?",
      a: "• ขนส่งทางรถ (EK): ใช้เวลาประมาณ 5 - 7 วัน (หลังจากสินค้าออกจากโกดังจีน) เหมาะสำหรับสินค้าที่ต้องการความรวดเร็ว เสื้อผ้า แฟชั่น สินค้าตามกระแส\n• ขนส่งทางเรือ (SEA): ใช้เวลาประมาณ 15 - 20 วัน ค่าบริการประหยัดกว่า เหมาะสำหรับสินค้าชิ้นใหญ่ น้ำหนักเยอะ หรือสินค้าสั่งจำนวนมาก (คิดตามคิว CBM)"
    },
    {
      q: "ค่าขนส่งจีน-ไทย คิดตามน้ำหนัก (KG) หรือตามขนาดคิว (CBM)?",
      a: "ระบบจะคำนวณเปรียบเทียบทั้ง 2 แบบ (ค่าน้ำหนักจริง vs ค่าน้ำหนักตามปริมาตรคิว) แล้วจะคิดตามเรทที่สูงกว่าเพื่อให้สอดคล้องกับต้นทุนการขนส่งจริง โดยไม่มีการบวกเพิ่มใดๆ นอกเหนือจากเรทมาตรฐานที่แจ้งไว้ในหน้าราคา"
    },
    {
      q: "ระบบรวมบิล (Consolidation) ในรอบที่ 3 ทำงานอย่างไร?",
      a: "หากคุณสั่งซื้อสินค้าหลายร้านค้า หรือหลายออเดอร์ในเวลาใกล้เคียงกัน เมื่อสินค้าเดินทางมาถึงโกดังไทย คุณสามารถกดเลือกหลายๆ ออเดอร์แล้วกด 'รวมบิลจัดส่ง' ระบบจะรวมพัสดุทั้งหมดใส่กล่องเดียวกันเพื่อคำนวณค่าส่งในไทยเพียงรอบเดียว ช่วยประหยัดค่าส่งในไทยได้ถึง 30-50%"
    },
    {
      q: "หากร้านค้าจีนแจ้งว่าสินค้าหมด หรือส่งไม่ครบ จะได้รับเงินคืนอย่างไร?",
      a: "แอดมินจะทำการบันทึกสินค้าที่หมดในระบบ พร้อมระบุเหตุผลจากร้านจีน ยอดเงินคืน (Refund) จะถูกบันทึกในระบบโดยอัตโนมัติ โดยลูกค้าสามารถนำยอดนี้ไปหักลบกับค่าขนส่งรอบถัดไป หรือติดต่อแอดมินเพื่อขอรับเงินโอนคืนเข้าบัญชีธนาคารได้ทันที"
    },
    {
      q: "มีค่าบริการสั่งซื้อหรือค่าบริการแอบแฝงเพิ่มเติมไหม?",
      a: "ไม่มีค่าบริการแอบแฝง! เรามีบริการช่วยเจรจาต่อรองราคากับร้านค้าจีนให้ฟรี เรทเงินหยวนอัปเดตตามจริง และคิดค่าขนส่งตามขนาด/น้ำหนักจริงของพัสดุเท่านั้น"
    }
  ]

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* 1. Header Section */}
      <section className="bg-gradient-to-b from-blue-50/80 via-blue-50/30 to-slate-50 py-16 md:py-20 px-4 md:px-8 border-b border-slate-200/60">
        <div className="container max-w-5xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 text-primary rounded-full text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            คู่มือการใช้งานระบบ Sabuyship
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            ขั้นตอนการนำเข้าสินค้า จีน-ไทย <span className="text-primary">3 สเต็ปง่ายๆ</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            ระบบสั่งซื้อและขนส่งที่โปร่งใส แบ่งการชำระเงินตามจริงเป็น 3 รอบ พร้อมระบบแจ้งเตือนผ่าน LINE และติดตามสถานะพัสดุตลอด 24 ชั่วโมง
          </p>

          {/* 3-Phase Overview Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4 max-w-3xl mx-auto">
            <div className="p-3.5 bg-white rounded-xl border border-blue-200 shadow-2xs text-left">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">รอบที่ 1</span>
              <p className="text-sm font-black text-slate-900 mt-0.5">ค่าสินค้า + ค่าส่งในจีน</p>
              <p className="text-[11px] text-slate-500 mt-0.5">ชำระตอนสั่งซื้อ</p>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-purple-200 shadow-2xs text-left">
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider block">รอบที่ 2</span>
              <p className="text-sm font-black text-slate-900 mt-0.5">ค่าขนส่งจีน-ไทย</p>
              <p className="text-[11px] text-slate-500 mt-0.5">ชำระเมื่อของถึงไทย</p>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-emerald-200 shadow-2xs text-left">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">รอบที่ 3</span>
              <p className="text-sm font-black text-slate-900 mt-0.5">ค่าจัดส่งในไทย</p>
              <p className="text-[11px] text-slate-500 mt-0.5">รวมบิลได้ / รับเองฟรี</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Detailed Connected Timeline */}
      <section className="py-16 md:py-20 px-4 md:px-8">
        <div className="container max-w-4xl mx-auto space-y-12">
          {phases.map((phase, pIdx) => (
            <div key={pIdx} className="space-y-6">
              {/* Phase Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-950 text-white flex items-center justify-center font-black text-lg shadow-sm">
                    {phase.phaseNumber}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    {phase.phaseTitle}
                  </h2>
                </div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${phase.badgeColor}`}>
                  {phase.phaseBadge}
                </span>
              </div>

              {/* Steps inside this Phase */}
              <div className="space-y-4 pl-2 sm:pl-4 border-l-2 border-slate-200/80 ml-4.5 sm:ml-4.5">
                {phase.steps.map((step, sIdx) => {
                  const Icon = step.icon
                  return (
                    <div key={sIdx} className="relative pl-6 sm:pl-8 group">
                      {/* Timeline Dot */}
                      <div className="absolute -left-[31px] sm:-left-[39px] top-6 w-6 h-6 rounded-full bg-white border-4 border-blue-500 group-hover:scale-110 transition-transform shadow-2xs"></div>

                      <Card className="border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all rounded-2xl bg-white overflow-hidden">
                        <CardContent className="p-5 sm:p-6">
                          <div className="flex items-start gap-4">
                            <div className={`p-3.5 rounded-xl ${step.iconBg} shrink-0 mt-0.5`}>
                              <Icon className="w-6 h-6" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                                <span className="text-xs font-black text-primary tracking-wider uppercase">
                                  ขั้นตอนที่ {step.stepNumber}
                                </span>
                                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                                  {step.tag}
                                </span>
                              </div>

                              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                                {step.title}
                              </h3>
                              <p className="text-slate-600 text-sm leading-relaxed">
                                {step.description}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. System Highlights Grid */}
      <section className="py-16 px-4 md:px-8 bg-white border-y border-slate-200">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-black uppercase tracking-wider mb-2">
              Sabuyship Features
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              ฟีเจอร์เด่นที่ออกแบบมาเพื่อความสบายของคุณ
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">ระบบรวมบิลจัดส่ง</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                สั่งสินค้าหลายออเดอร์ สามารถรอรวมส่งในรอบที่ 3 พร้อมกันเพื่อประหยัดค่าส่งในไทย
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">แจ้งเตือนผ่าน LINE</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                ระบบส่งข้อความแจ้งเตือนผ่าน LINE OA ทุกครั้งที่พัสดุเปลี่ยนสถานะ ไม่ต้องคอยเช็คเอง
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:border-amber-300 transition-all">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4">
                <PackagePlus className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">บริการเสริมตีลังไม้</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                ป้องกันสินค้าแตกหักหรือเสียหายระหว่างขนส่ง เหมาะสำหรับแก้ว เซรามิก และเฟอร์นิเจอร์
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:border-rose-300 transition-all">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mb-4">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">ระบบคืนเงินโปร่งใส</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                หากร้านจีนสินค้าหมด ระบบคำนวณยอดเงินคืนให้อัตโนมัติ นำไปหักลบค่าส่งหรือรับเงินคืนได้
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FAQ Accordion Section */}
      <section className="py-16 md:py-20 px-4 md:px-8 bg-slate-50">
        <div className="container max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center justify-center gap-2">
              <HelpCircle className="w-7 h-7 text-primary" />
              คำถามที่พบบ่อยเกี่ยวกับการนำเข้า
            </h2>
            <p className="text-slate-600 text-sm">
              ข้อสงสัยยอดนิยมเกี่ยวกับการสั่งซื้อและขนส่งสินค้าจากจีน
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left font-bold text-slate-900 flex justify-between items-center gap-4 hover:bg-slate-50 cursor-pointer"
                >
                  <span className="text-sm sm:text-base">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                      openFaq === idx ? "rotate-180 text-primary" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 pt-1 text-slate-600 text-sm leading-relaxed border-t border-slate-100 whitespace-pre-line bg-slate-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Bottom Call to Action */}
      <section className="py-16 md:py-20 px-4 md:px-8 bg-slate-950 text-white text-center">
        <div className="container max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            พร้อมเริ่มต้นสั่งซื้อสินค้าจากจีนแล้วหรือยัง?
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            เพียงส่งลิงก์สินค้าจาก Taobao, 1688 หรือ Tmall ให้เรา เราจัดการต่อรองราคาและนำเข้าให้คุณแบบครบวงจร
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3.5 justify-center">
            <Link href="/inquiry">
              <Button size="lg" variant="orange" className="w-full sm:w-auto text-base px-8 h-14 font-black rounded-xl shadow-lg cursor-pointer">
                ส่งลิงก์ประเมินราคาฟรีเลย ➔
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-7 h-14 rounded-xl bg-slate-900 border-slate-700 hover:bg-slate-800 text-white cursor-pointer">
                ดูอัตราค่าบริการนำเข้า
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

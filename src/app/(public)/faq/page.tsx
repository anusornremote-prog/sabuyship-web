"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  Sparkles, 
  CreditCard, 
  Truck, 
  Package, 
  ShieldAlert, 
  RefreshCw, 
  Phone, 
  MessageCircle, 
  ArrowRight,
  Layers,
  ShieldCheck,
  Building2,
  Box
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/components/providers/language-provider"

type FaqItem = {
  id: string
  category: "payment" | "shipping" | "consolidation" | "prohibited" | "guarantee"
  question: string
  answer: string
  tags: string[]
}

export default function FaqPage() {
  const { t, locale } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    "pay-1": true, // Default open first item
  })

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Categories localized
  const categories = useMemo(() => [
    { id: "all", label: locale === 'en' ? "All Questions" : locale === 'zh' ? "全部问题" : "คำถามทั้งหมด", icon: Sparkles },
    { id: "payment", label: locale === 'en' ? "Payment & 3-Round System" : locale === 'zh' ? "支付与3轮费用" : "การชำระเงิน & 3 รอบ", icon: CreditCard },
    { id: "shipping", label: locale === 'en' ? "Shipping & Transit Times" : locale === 'zh' ? "物流时效与运费" : "การขนส่ง & ระยะเวลา", icon: Truck },
    { id: "consolidation", label: locale === 'en' ? "Consolidation & Ordering" : locale === 'zh' ? "合单与采购代购" : "การรวมบิล & สั่งซื้อ", icon: Layers },
    { id: "prohibited", label: locale === 'en' ? "Prohibited & Wooden Crate" : locale === 'zh' ? "禁运品与木架防护" : "สินค้าต้องห้าม & ตีลังไม้", icon: ShieldAlert },
    { id: "guarantee", label: locale === 'en' ? "Refunds & Guarantee" : locale === 'zh' ? "退款与售后保障" : "นโยบายคืนเงิน & ประกัน", icon: RefreshCw },
  ], [locale])

  // FAQ Database localized
  const faqList: FaqItem[] = useMemo(() => {
    if (locale === 'en') {
      return [
        {
          id: "pay-1",
          category: "payment",
          question: "How does the 3-Round payment system work?",
          answer: "• Round 1 (Item Cost): Total product price in RMB converted to THB based on daily real exchange rate + China domestic courier fee (if charged by shop).\n• Round 2 (China-to-TH Freight): Cross-border international shipping cost based on actual Weight (KG) or Volume (CBM) when goods arrive in Thailand.\n• Round 3 (Thai Domestic Delivery): Courier fee to your doorstep (Flash, Kerry, J&T) or FREE self-pickup at our Bangkok warehouse.",
          tags: ["payment", "round 1", "round 2", "round 3", "exchange rate", "cost"]
        },
        {
          id: "pay-2",
          category: "payment",
          question: "Is there any purchasing service fee or hidden markup?",
          answer: "No! Sabuyship charges 0% purchasing service fee (Free Service Fee) and provides free factory negotiation with Chinese suppliers without hidden markups.",
          tags: ["fee", "service fee", "hidden cost", "free"]
        },
        {
          id: "pay-3",
          category: "payment",
          question: "How is the RMB to THB exchange rate calculated?",
          answer: "We use transparent real-time exchange rates updated daily. You can see the live rate banner right on our homepage and quotation summaries.",
          tags: ["exchange rate", "yuan", "rmb", "thb", "rate"]
        },
        {
          id: "ship-1",
          category: "shipping",
          question: "How long does shipping take from China to Thailand?",
          answer: "• Express Road (EK): 5 - 7 business days from container departure at Guangzhou warehouse.\n• Economy Sea (SEA): 15 - 20 business days from container departure at China port.",
          tags: ["speed", "road", "sea", "duration", "days", "transit"]
        },
        {
          id: "ship-2",
          category: "shipping",
          question: "How is freight calculated between Weight (KG) and Volume (CBM)?",
          answer: "Following international freight standards, our system calculates both actual weight in kilograms and volumetric cubic meters (CBM = Width × Length × Height in cm / 1,000,000), then charges whichever is higher. You can test your parcel dimensions on our interactive Pricing page.",
          tags: ["cbm", "kg", "volume", "weight", "calculation"]
        },
        {
          id: "ship-3",
          category: "shipping",
          question: "Where is the China warehouse located?",
          answer: "Our main consolidation warehouse is located in Guangzhou (Baiyun District), China, specialized for high-speed Thailand freight lines.",
          tags: ["warehouse", "guangzhou", "china", "address"]
        },
        {
          id: "con-1",
          category: "consolidation",
          question: "Can I combine multiple orders into one shipment to save delivery fees?",
          answer: "Yes! When your orders arrive at our Thailand warehouse, you can select multiple shipments and click 'Consolidate Bill' (รวมบิล) to bundle them into 1 local delivery, significantly reducing domestic delivery fees.",
          tags: ["consolidate", "combine", "save", "bill"]
        },
        {
          id: "con-2",
          category: "consolidation",
          question: "How do I submit product links from Taobao, 1688, or Tmall?",
          answer: "Simply click 'Request Quote' (ขอใบเสนอราคา) on our site, paste the product link, specify quantity, color, size, and optional wooden crate packing. Our team will review stock and issue a quotation within 1-2 hours.",
          tags: ["order", "submit", "1688", "taobao", "tmall", "link"]
        },
        {
          id: "pro-1",
          category: "prohibited",
          question: "What items are prohibited from importation?",
          answer: "Prohibited items include lighters, flammable materials, batteries over regulatory limits, e-cigarettes, adult toys, weapons, narcotics, and counterfeit goods under strict customs embargo. If unsure, please consult our admin team.",
          tags: ["prohibited", "illegal", "dangerous", "vape", "battery"]
        },
        {
          id: "pro-2",
          category: "prohibited",
          question: "When should I choose wooden crate packing?",
          answer: "We strongly recommend wooden crating (starting at only 200 THB/box) for fragile goods such as mirrors, ceramic tiles, glassware, audio equipment, electronics, and precision machinery to prevent transit impact.",
          tags: ["crate", "wooden", "fragile", "protection", "packing"]
        },
        {
          id: "gua-1",
          category: "guarantee",
          question: "What happens if the Chinese supplier runs out of stock?",
          answer: "If the Chinese seller informs us that items are out of stock or cannot be fulfilled, our system immediately notifies you and issues a 100% full refund with 0 deduction.",
          tags: ["refund", "out of stock", "cancel", "money back"]
        },
        {
          id: "gua-2",
          category: "guarantee",
          question: "How do I track parcel status in real time?",
          answer: "You can track anytime via our Track page by entering your Order ID (e.g. ORD-XXXXXX). Additionally, our automated LINE Notification Bot pushes updates at every milestone directly to your phone.",
          tags: ["track", "tracking", "status", "line", "notification"]
        }
      ]
    } else if (locale === 'zh') {
      return [
        {
          id: "pay-1",
          category: "payment",
          question: "三阶段收费模式具体是如何运作的？",
          answer: "• 第一轮（商品货款）：商品人民币原价按当日系统实时汇率折算泰铢 + 中国国内快递费（若卖家收取）。\n• 第二轮（中泰国际运费）：货物抵达泰国仓库后，按实际重量 (KG) 或体积 (CBM) 结算跨国运费。\n• 第三轮（泰国本地派送）：泰国本地快递费（Flash、Kerry、J&T 送货上门）或选择前往曼谷仓库免费自提 (0 泰铢)。",
          tags: ["支付", "第一轮", "第二轮", "第三轮", "汇率", "费用"]
        },
        {
          id: "pay-2",
          category: "payment",
          question: "是否有代购服务费或隐形加价？",
          answer: "没有！Sabuyship 不收取任何代购服务费 (0% Service Fee)，并免费提供中国厂家议价服务，价格公开透明，无任何隐形杂费。",
          tags: ["服务费", "代购费", "免费", "透明"]
        },
        {
          id: "pay-3",
          category: "payment",
          question: "人民币兑泰铢汇率如何计算？",
          answer: "我们每日同步公开市场最新汇率，网站首页与报价单均有实时汇率显示，透明无溢价。",
          tags: ["汇率", "人民币", "泰铢", "实时"]
        },
        {
          id: "ship-1",
          category: "shipping",
          question: "从中国发货到泰国需要多少天？",
          answer: "• 特快陆运 (EK)：广州仓库装柜发车后 5 - 7 个工作日送达泰国。\n• 经济海运 (SEA)：装柜开船后 15 - 20 个工作日送达泰国。",
          tags: ["时效", "陆运", "海运", "几天", "时间"]
        },
        {
          id: "ship-2",
          category: "shipping",
          question: "国际运费如何按重量 (KG) 与体积 (CBM) 进行计费？",
          answer: "按国际跨境物流标准，系统同时核算实际重量 (KG) 与体积重量 (CBM = 长×宽×高cm / 1,000,000)，并按两者中费用较高者收取。您可在“服务费用”页面使用计算器测算。",
          tags: ["体积", "重量", "立方", "公斤", "计算"]
        },
        {
          id: "ship-3",
          category: "shipping",
          question: "中国仓库设在哪里？",
          answer: "我们的集运总仓设在中国广州市白云区，专为中泰跨境物流专线设计，货物入仓快、装柜准时。",
          tags: ["仓库", "广州", "地址"]
        },
        {
          id: "con-1",
          category: "consolidation",
          question: "可以把多个包裹合并发货省运费吗？",
          answer: "可以！当您订购的多件商品抵达泰国仓库后，可在控制台勾选多个订单并点击“合并账单”，打包一同发货，大幅降低泰国本地快递费用。",
          tags: ["合单", "合并", "省运费", "打包"]
        },
        {
          id: "con-2",
          category: "consolidation",
          question: "如何提交淘宝、1688、天猫的商品链接？",
          answer: "点击网页顶部的“申请报价 / 提交链接”，粘贴商品链接并备注数量、颜色、尺码及木架需求，客服人员将在 1-2 小时内核算并出具报价单。",
          tags: ["下单", "提交", "1688", "淘宝", "天猫", "链接"]
        },
        {
          id: "pro-1",
          category: "prohibited",
          question: "有哪些违禁品不可承运？",
          answer: "打火机、易燃易爆品、超标大容量电池、电子烟、成人用品、武器、毒品以及海关管制的侵权违禁品均不可承运。如有疑问下单前请咨询客服。",
          tags: ["违禁品", "禁运", "电子烟", "电池"]
        },
        {
          id: "pro-2",
          category: "prohibited",
          question: "什么情况下需要选择打木架/加固包装？",
          answer: "对于易碎品（如镜子、陶瓷、玻璃器皿、音响、家电仪器等），强烈建议选择打木架/木箱加固服务（每件仅200泰铢起），以最大程度保障运输安全。",
          tags: ["木架", "易碎", "加固", "包装"]
        },
        {
          id: "gua-1",
          category: "guarantee",
          question: "如果中国商家缺货无法发货怎么办？",
          answer: "若中国商家告知缺货或无法交付，系统将立即通知您并办理 100% 全额退款，不扣除任何手续费。",
          tags: ["退款", "缺货", "取消", "保障"]
        },
        {
          id: "gua-2",
          category: "guarantee",
          question: "如何全程追踪我的货物动态？",
          answer: "您可在“跟踪包裹”页面输入订单号 (如 ORD-XXXXXX) 随时查询，同时我们的 LINE 机器人会在关键节点（已采购、抵广州仓、抵泰国仓、派送中）自动推送消息。",
          tags: ["追踪", "物流", "LINE", "通知", "查单"]
        }
      ]
    } else {
      return [
        {
          id: "pay-1",
          category: "payment",
          question: "ระบบการชำระเงินแบบ 3 รอบ มีขั้นตอนและคิดเงินอย่างไร?",
          answer: "• รอบที่ 1 (ค่าสินค้า): ราคาสินค้าจริงจากร้านจีนคิดตามเรทหยวนจริง ณ วันสั่งซื้อ + ค่าขนส่งในจีน (ถ้ามี)\n• รอบที่ 2 (ค่าขนส่งจีน-ไทย): ค่าขนส่งข้ามประเทศ คิดตามน้ำหนัก (KG) หรือ ปริมาตร (CBM) จริงเมื่อพัสดุมาถึงโกดังไทย\n• รอบที่ 3 (ค่าจัดส่งในไทย): ค่าจัดส่งจากโกดังไทยถึงหน้าบ้านคุณ (คิดตามจริงของ Flash, Kerry, J&T) หรือเลือก 'มารับเองที่โกดัง' ฟรี 0 บาท",
          tags: ["การชำระเงิน", "รอบ 1", "รอบ 2", "รอบ 3", "ค่าขนส่ง", "เรทเงิน"]
        },
        {
          id: "pay-2",
          category: "payment",
          question: "มีค่าบริการสั่งซื้อ (Service Fee) หรือค่าธรรมเนียมแอบแฝงไหม?",
          answer: "ไม่มีครับ! Sabuyship ฟรีค่าบริการกดสั่งซื้อ 0 บาท (0% Free Service Fee) พร้อมมีทีมงานช่วยเจรจาต่อรองราคาส่งกับโรงงานจีนให้ฟรี ไม่มีบวกเพิ่มหรือแอบแฝงใดๆ",
          tags: ["ค่าบริการ", "ค่ากดสั่ง", "ฟรี", "service fee"]
        },
        {
          id: "pay-3",
          category: "payment",
          question: "เรทเงินหยวน (RMB to THB) คำนวณอย่างไร?",
          answer: "เราใช้เรทเงินหยวนสดที่โปร่งใสและอัปเดตตามตลาดจริงทุกวัน สามารถตรวจสอบเรทได้ทันทีบนแบนเนอร์หน้าแรกของเว็บไซต์",
          tags: ["เรทหยวน", "อัตราแลกเปลี่ยน", "เงินหยวน", "บาท"]
        },
        {
          id: "ship-1",
          category: "shipping",
          question: "ระยะเวลาขนส่งสินค้าจากจีนมาไทยใช้เวลากี่วัน?",
          answer: "• ทางรถด่วน (EK): ใช้เวลาประมาณ 5 - 7 วันทำการ (นับจากวันที่ตู้สินค้าออกจากโกดังกว่างโจว)\n• ทางเรือประหยัด (SEA): ใช้เวลาประมาณ 15 - 20 วันทำการ (นับจากวันที่ตู้เรือออกจากท่าเรือจีน)",
          tags: ["ระยะเวลา", "ทางรถ", "ทางเรือ", "กี่วัน", "ขนส่ง"]
        },
        {
          id: "ship-2",
          category: "shipping",
          question: "ค่าขนส่งจีน-ไทย คิดตามน้ำหนัก (KG) หรือ คิว (CBM) อย่างไร?",
          answer: "ตามมาตรฐานสากล ระบบจะคำนวณเปรียบเทียบระหว่าง 'ค่าน้ำหนัก' กับ 'ค่าปริมาตรคิว (CBM = กว้าง x ยาว x สูง cm / 1,000,000)' แล้วเลือกคิดจากยอดที่สูงกว่า สามารถทดลองคำนวณได้ที่หน้า 'อัตราค่าบริการ'",
          tags: ["คิว", "กิโลกรัม", "cbm", "kg", "คำนวณราคา"]
        },
        {
          id: "ship-3",
          category: "shipping",
          question: "โกดังจีนของ Sabuyship ตั้งอยู่ที่เมืองไหน?",
          answer: "โกดังหลักของเรารับสินค้าตั้งอยู่ที่ เมืองกว่างโจว (Guangzhou, เขตไป่หยุน) ประเทศจีน ซึ่งเป็นศูนย์กลางขนส่งสินค้าที่เร็วที่สุดสู่ประเทศไทย",
          tags: ["โกดังจีน", "กว่างโจว", "ที่อยู่โกดัง"]
        },
        {
          id: "con-1",
          category: "consolidation",
          question: "สั่งสินค้าหลายร้าน สามารถรวมบิลเพื่อประหยัดค่าส่งในไทยได้ไหม?",
          answer: "ได้แน่นอนครับ! เมื่อสินค้าแต่ละรายการมาถึงโกดังไทย ลูกค้าสามารถเข้าไปที่หน้าคำสั่งซื้อแล้วกด 'รวมบิล' เพื่อให้ทีมงานแพ็คจัดส่งพร้อมกันในกล่องเดียว ช่วยประหยัดค่าส่งในไทยได้สูงสุด",
          tags: ["รวมบิล", "ประหยัด", "หลายร้าน", "ส่งพร้อมกัน"]
        },
        {
          id: "con-2",
          category: "consolidation",
          question: "ขั้นตอนการส่งลิงก์จาก Taobao, 1688 หรือ Tmall ทำอย่างไร?",
          answer: "เพียงคัดลอกลิงก์สินค้าจากเว็บจีน แล้วมากดที่ปุ่ม 'ขอใบเสนอราคา' บนเว็บ Sabuyship พร้อมระบุสี ขนาด หรือแนบรูปภาพ เจ้าหน้าที่จะตรวจสอบสต็อกและส่งใบเสนอราคาให้ภายใน 1-2 ชม.",
          tags: ["ส่งลิงก์", "ขอใบเสนอราคา", "1688", "taobao", "tmall"]
        },
        {
          id: "pro-1",
          category: "prohibited",
          question: "สินค้าประเภทใดบ้างที่ไม่สามารถนำเข้าได้ (สินค้าต้องห้าม)?",
          answer: "สินค้าต้องห้าม ได้แก่ ไฟแช็ค วัตถุไวไฟ แบตเตอรี่สำรองขนาดใหญ่ บุหรี่ไฟฟ้า ของเล่นผู้ใหญ่ อาวุธ สารเสพติด และสินค้าละเมิดลิขสิทธิ์ร้ายแรง หากไม่แน่ใจสามารถสอบถามแอดมินก่อนสั่งซื้อได้ครับ",
          tags: ["สินค้าต้องห้าม", "ห้ามนำเข้า", "บุหรี่ไฟฟ้า", "อันตราย"]
        },
        {
          id: "pro-2",
          category: "prohibited",
          question: "สินค้าแบบไหนที่ควรเลือกบริการเสริม 'ตีลังไม้'?",
          answer: "แนะนำเป็นพิเศษสำหรับสินค้าแตกหักง่าย เช่น กระจก เซรามิก โคมไฟ เครื่องเสียง อุปกรณ์ไอที หรือเครื่องจักรขนาดใหญ่ เริ่มต้นเพียง 200 บาท ช่วยป้องกันการกระแทกระหว่างขนส่งได้ 100%",
          tags: ["ตีลังไม้", "แตกง่าย", "ป้องกัน", "กล่องไม้"]
        },
        {
          id: "gua-1",
          category: "guarantee",
          question: "กรณีร้านค้าจีนแจ้งว่าสินค้าหมด จะได้รับเงินคืนอย่างไร?",
          answer: "หากร้านค้าจีนแจ้งของหมดสต็อกหรือยกเลิกคำสั่งซื้อ ระบบจะทำการยกเลิกและคืนเงินค่าสินค้าให้ลูกค้าเต็มจำนวน 100% ทันทีโดยไม่มีการหักค่าธรรมเนียมใดๆ",
          tags: ["คืนเงิน", "ของหมด", "ยกเลิก", "การันตี"]
        },
        {
          id: "gua-2",
          category: "guarantee",
          question: "สามารถติดตามสถานะสินค้าแบบเรียลไทม์ได้อย่างไร?",
          answer: "คุณสามารถกรอกหมายเลขคำสั่งซื้อ (Order ID) ในหน้า 'ติดตามสถานะสินค้า' ได้ตลอด 24 ชม. นอกจากนี้ระบบยังมีบริการส่งข้อความแจ้งเตือนผ่าน LINE อัตโนมัติในทุกๆ สเต็ป",
          tags: ["ติดตามสถานะ", "tracking", "เช็คพัสดุ", "line แจ้งเตือน"]
        }
      ]
    }
  }, [locale])

  // Filter items based on selected category & search query
  const filteredFaqs = useMemo(() => {
    return faqList.filter(item => {
      const matchCategory = selectedCategory === "all" || item.category === selectedCategory
      const matchQuery = !searchQuery.trim() || 
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchCategory && matchQuery
    })
  }, [faqList, selectedCategory, searchQuery])

  return (
    <div className="py-16 md:py-24 px-4 md:px-8 min-h-screen bg-slate-50 text-slate-800">
      <div className="container max-w-5xl mx-auto space-y-12">
        {/* 1. Header Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 text-primary rounded-full text-xs font-black uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            {locale === 'en' ? "Frequently Asked Questions" : locale === 'zh' ? "常见问题解答 (FAQ)" : "ศูนย์รวมคำถามที่พบบ่อย (FAQ)"}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            {locale === 'en' ? "How can we help you?" : locale === 'zh' ? "我们能为您提供什么帮助？" : "มีคำถามข้อสงสัย?"} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Sabuyship</span>
          </h1>
          <p className="text-base md:text-lg text-slate-600">
            {locale === 'en' 
              ? "Find quick answers about our 3-Round purchasing system, cross-border freight, consolidation, and guarantees."
              : locale === 'zh'
              ? "快速了解中泰3阶段代购收费、跨境国际物流时效、合单省运费及售后保障。"
              : "รวบรวมทุกข้อสงสัยเกี่ยวกับการสั่งซื้อ การคิดค่าบริการ 3 รอบ ระยะเวลาขนส่ง และการรวมบิลประหยัดค่าส่ง"}
          </p>
        </div>

        {/* 2. Search & Category Filters */}
        <div className="space-y-6">
          {/* Live Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="w-5 h-5 absolute left-4 top-4 text-slate-400" />
            <Input
              type="text"
              placeholder={
                locale === 'en' 
                  ? "Search by keyword e.g. 3-Round, CBM, delivery, prohibited..." 
                  : locale === 'zh' 
                  ? "搜索关键词 如：3轮费用、立方、运费、禁运品..." 
                  : "ค้นหาคำถาม เช่น 'รอบชำระเงิน', 'ค่าส่งคิว', 'สินค้าต้องห้าม', 'รวมบิล'..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 pl-12 pr-10 text-base rounded-2xl border-slate-300 bg-white shadow-md focus:border-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-4.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                {locale === 'en' ? "Clear" : locale === 'zh' ? "清空" : "ล้าง"}
              </button>
            )}
          </div>

          {/* Category Pill Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {categories.map((cat) => {
              const Icon = cat.icon
              const isSelected = selectedCategory === cat.id

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary text-white shadow-md scale-105"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{cat.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 3. FAQ Accordion Cards List */}
        <div className="max-w-3xl mx-auto space-y-4">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isOpen = !!openItems[faq.id]

              return (
                <div
                  key={faq.id}
                  className={`bg-white border rounded-2xl overflow-hidden transition-all shadow-2xs ${
                    isOpen ? "border-primary/40 ring-2 ring-primary/10 shadow-sm" : "border-slate-200"
                  }`}
                >
                  <button
                    onClick={() => toggleItem(faq.id)}
                    className="w-full p-5 sm:p-6 text-left flex justify-between items-center gap-4 hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <span className={`font-black text-base sm:text-lg leading-snug ${isOpen ? "text-primary" : "text-slate-900"}`}>
                      {faq.question}
                    </span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 bg-blue-100 text-primary" : "bg-slate-100 text-slate-500"
                    }`}>
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="p-5 sm:p-6 pt-0 border-t border-slate-100 bg-slate-50/40 text-sm text-slate-700 leading-relaxed whitespace-pre-line animate-in fade-in duration-200 space-y-3">
                      <p>{faq.answer}</p>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {faq.tags.map((tag, tIdx) => (
                          <span key={tIdx} className="px-2 py-0.5 bg-slate-200/70 text-slate-600 rounded text-[10px] font-semibold">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <Search className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">
                {locale === 'en' ? "No matching questions found" : locale === 'zh' ? "未找到相关问题" : "ไม่พบคำถามที่ตรงกับคำค้นหา"}
              </h3>
              <p className="text-xs text-slate-500">
                {locale === 'en' 
                  ? "Try searching with different keywords or browse our categories above." 
                  : locale === 'zh'
                  ? "请尝试输入其他关键词，或在上方分类中查找。"
                  : "ลองค้นหาด้วยคำอื่น หรือเลือกดูคำถามตามหมวดหมู่ด้านบน"}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
                className="mt-2 text-xs font-bold"
              >
                {locale === 'en' ? "View All Questions" : locale === 'zh' ? "查看全部问题" : "ดูคำถามทั้งหมด"}
              </Button>
            </div>
          )}
        </div>

        {/* 4. Still have questions? Direct Contact Support Card */}
        <section className="max-w-4xl mx-auto p-8 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 text-white rounded-3xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 bg-white/10 text-blue-300 rounded-full text-xs font-bold uppercase tracking-wider">
                {locale === 'en' ? "Customer Support" : locale === 'zh' ? "人工客服支持" : "ทีมงานพร้อมช่วยเหลือ 24 ชม."}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                {locale === 'en' ? "Still have questions?" : locale === 'zh' ? "仍有其他疑问？" : "ยังหาคำตอบที่ต้องการไม่เจอ?"}
              </h2>
              <p className="text-sm text-slate-300 max-w-lg">
                {locale === 'en' 
                  ? "Chat directly with our Thai and Chinese consulting team on LINE or send your inquiry link anytime."
                  : locale === 'zh'
                  ? "直接与我们的泰中双语客服团队联系，LINE 实时在线为您答疑解惑。"
                  : "สอบถามทีมงาน Sabuyship ได้โดยตรงผ่าน LINE Official หรือส่งลิงก์สินค้าให้เราประเมินราคาฟรีทันที"}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0">
              <a 
                href="https://lin.ee/UC0F9zl" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <Button size="lg" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-12 px-6 rounded-xl shadow-md cursor-pointer">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  LINE @sabuyship
                </Button>
              </a>

              <Link href="/inquiry" className="w-full sm:w-auto">
                <Button size="lg" variant="orange" className="w-full font-bold h-12 px-6 rounded-xl shadow-md cursor-pointer">
                  {locale === 'en' ? "Request Quote ➔" : locale === 'zh' ? "提交询价 ➔" : "ขอใบเสนอราคาฟรี ➔"}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

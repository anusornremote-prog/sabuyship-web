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
  const { t, locale } = useTranslation()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const phases = locale === 'en' ? [
    {
      phaseNumber: "1",
      phaseTitle: "Round 1: Order & Product Payment",
      phaseBadge: "Product Cost + China Domestic Shipping",
      phaseColor: "from-blue-600 to-indigo-600 text-white",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      steps: [
        {
          stepNumber: "01",
          title: "Submit Product Link",
          description: "Copy product links from Taobao, 1688, Tmall, or Pinduoduo, attach images or specify quantity, color, size, and wooden crating options.",
          icon: Link2,
          iconBg: "bg-blue-100 text-blue-600",
          tag: "Customer Action"
        },
        {
          stepNumber: "02",
          title: "Quotation & Price Verification",
          description: "Our team verifies stock, negotiates factory wholesale pricing with suppliers for free, and calculates the THB total based on real exchange rates.",
          icon: Calculator,
          iconBg: "bg-indigo-100 text-indigo-600",
          tag: "Admin Action"
        },
        {
          stepNumber: "03",
          title: "Confirm & Pay Round 1",
          description: "Review quotation, confirm order, and transfer payment for item costs (Round 1). Our team immediately places the order in China.",
          icon: CreditCard,
          iconBg: "bg-orange-100 text-orange-600",
          tag: "Round 1 Payment"
        }
      ]
    },
    {
      phaseNumber: "2",
      phaseTitle: "Round 2: Cross-Border China-TH Freight",
      phaseBadge: "Pay International Freight by Actual Weight/CBM",
      phaseColor: "from-purple-600 to-indigo-700 text-white",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
      steps: [
        {
          stepNumber: "04",
          title: "Transit to Thailand",
          description: "Once items arrive at Guangzhou warehouse, staff inspect package condition, measure weight (KG) and volume (CBM), then load into containers (Road 5-7d / Sea 15-20d).",
          icon: Truck,
          iconBg: "bg-purple-100 text-purple-600",
          tag: "International Freight"
        },
        {
          stepNumber: "05",
          title: "Arrived at TH Warehouse & Pay Round 2",
          description: "Upon arrival at Thailand warehouse, the system calculates exact international freight and sends notification to settle Round 2.",
          icon: PackageCheck,
          iconBg: "bg-purple-100 text-purple-600",
          tag: "Round 2 Payment"
        }
      ]
    },
    {
      phaseNumber: "3",
      phaseTitle: "Round 3: Final Delivery in Thailand",
      phaseBadge: "Domestic Shipping (Free self-pickup / Consolidate to save)",
      phaseColor: "from-emerald-600 to-teal-700 text-white",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      steps: [
        {
          stepNumber: "06",
          title: "Package Consolidation & Local Shipping",
          description: "Customers can combine multiple orders into 1 shipment to save domestic courier cost, or pick up directly at Rangsit warehouse for FREE.",
          icon: Layers,
          iconBg: "bg-emerald-100 text-emerald-600",
          tag: "Consolidate / Pick-up"
        },
        {
          stepNumber: "07",
          title: "Delivery to Doorstep",
          description: "Parcels are safely handed over to domestic couriers (Flash, Kerry, J&T). Customers receive tracking numbers with 24/7 online tracking.",
          icon: CheckCircle2,
          iconBg: "bg-teal-100 text-teal-600",
          tag: "Successful Delivery"
        }
      ]
    }
  ] : locale === 'zh' ? [
    {
      phaseNumber: "1",
      phaseTitle: "第一阶段：下单采购与支付货款",
      phaseBadge: "商品货款 + 中国国内运费",
      phaseColor: "from-blue-600 to-indigo-600 text-white",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      steps: [
        {
          stepNumber: "01",
          title: "发送商品链接",
          description: "复制淘宝、1688、天猫或拼多多链接，备注数量、颜色、尺码及打木架需求等。",
          icon: Link2,
          iconBg: "bg-blue-100 text-blue-600",
          tag: "客户提交"
        },
        {
          stepNumber: "02",
          title: "核算价格与出具报价单",
          description: "客服人员核实库存，免费帮您与厂家砍价议价，并按当日实时汇率折算泰铢总额。",
          icon: Calculator,
          iconBg: "bg-indigo-100 text-indigo-600",
          tag: "团队评估"
        },
        {
          stepNumber: "03",
          title: "确认订单并支付第一阶段费用",
          description: "客户审阅报价单，确认下单并转账支付商品货款 (第1轮)，代购团队立即向厂家采购。",
          icon: CreditCard,
          iconBg: "bg-orange-100 text-orange-600",
          tag: "支付第一轮"
        }
      ]
    },
    {
      phaseNumber: "2",
      phaseTitle: "第二阶段：中泰跨国国际物流",
      phaseBadge: "按实际重量/立方结算中泰国际运费",
      phaseColor: "from-purple-600 to-indigo-700 text-white",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
      steps: [
        {
          stepNumber: "04",
          title: "入仓发往泰国",
          description: "货物抵达广州仓库后，仓库验货、称重 (KG) 并测量立方 (CBM)，安排装柜发往泰国 (陆运5-7天 / 海运15-20天)。",
          icon: Truck,
          iconBg: "bg-purple-100 text-purple-600",
          tag: "国际跨境物流"
        },
        {
          stepNumber: "05",
          title: "抵达泰国仓库并结算第2轮运费",
          description: "货物安全抵达泰国仓库，系统按实际尺寸重量核算中泰国际运费并通知客户支付。",
          icon: PackageCheck,
          iconBg: "bg-purple-100 text-purple-600",
          tag: "支付第二轮"
        }
      ]
    },
    {
      phaseNumber: "3",
      phaseTitle: "第三阶段：泰国境内配送到家",
      phaseBadge: "泰国国内运费 (支持合并打包省运费 或 免费自提)",
      phaseColor: "from-emerald-600 to-teal-700 text-white",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      steps: [
        {
          stepNumber: "06",
          title: "合并打包 / 仓库自提",
          description: "支持将多个包裹合并打包以节省泰国国内运费，客户亦可选择前往曼谷仓库免费自提。",
          icon: Layers,
          iconBg: "bg-emerald-100 text-emerald-600",
          tag: "合单 / 自提"
        },
        {
          stepNumber: "07",
          title: "安全派送到家",
          description: "包裹移交本地快递 (Flash, Kerry, J&T) 派送上门，提供单号支持24小时全程在线追踪。",
          icon: CheckCircle2,
          iconBg: "bg-teal-100 text-teal-600",
          tag: "派送完成"
        }
      ]
    }
  ] : [
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
          title: "รวมบิลประหยัดค่าส่ง / มารับเองที่โกดัง (Consolidation)",
          description: "หากมีสินค้าหลายชิ้น ลูกค้าสามารถเลือก 'กดรวมบิล' เพื่อให้จัดส่งพร้อมกันในรอบเดียว หรือเลือก 'มารับเองที่โกดัง' ฟรี ไม่มีค่าใช้จ่าย",
          icon: Layers,
          iconBg: "bg-emerald-100 text-emerald-600",
          tag: "รวมบิล / รับเองฟรี"
        },
        {
          stepNumber: "07",
          title: "จัดส่งพัสดุถึงหน้าบ้าน (Door-to-Door Delivery)",
          description: "ทีมงานจัดส่งพัสดุผ่านขนส่งเอกชน (Flash, Kerry, J&T) พร้อมอัปเดตหมายเลขพัสดุในไทยให้ลูกค้าติดตามสถานะได้แบบเรียลไทม์ 24 ชม.",
          icon: CheckCircle2,
          iconBg: "bg-teal-100 text-teal-600",
          tag: "ส่งมอบสำเร็จ"
        }
      ]
    }
  ]

  const featureCards = locale === 'en' ? [
    {
      icon: PackagePlus,
      iconBg: "bg-blue-100 text-blue-600",
      title: "Package Consolidation",
      description: "Combine multiple packages into 1 shipment to save domestic delivery fees."
    },
    {
      icon: Bell,
      iconBg: "bg-emerald-100 text-emerald-600",
      title: "Automated LINE Notifications",
      description: "Receive instant updates at every milestone: ordered, arrived in China, arrived in TH, and out for delivery."
    },
    {
      icon: ShieldCheck,
      iconBg: "bg-amber-100 text-amber-600",
      title: "Wooden Crate Packing",
      description: "Reinforced wooden crating protection starting at only 200 THB to ensure fragile items arrive in perfect condition."
    },
    {
      icon: RefreshCw,
      iconBg: "bg-rose-100 text-rose-600",
      title: "100% Out-of-Stock Refund",
      description: "If the Chinese supplier runs out of stock, receive an immediate 100% refund without any deduction."
    }
  ] : locale === 'zh' ? [
    {
      icon: PackagePlus,
      iconBg: "bg-blue-100 text-blue-600",
      title: "多包裹合并打包",
      description: "支持将多个不同商家的包裹合并发货，最大限度节省泰国国内派送费用。"
    },
    {
      icon: Bell,
      iconBg: "bg-emerald-100 text-emerald-600",
      title: "LINE 实时状态通知",
      description: "从采购成功、抵广州仓、抵泰国仓到本地派送，LINE 全程自动推送最新物流动态。"
    },
    {
      icon: ShieldCheck,
      iconBg: "bg-amber-100 text-amber-600",
      title: "打木架加固防护",
      description: "易碎品及贵重物品提供专业打木架/木箱加固服务，每件仅需200泰铢起。"
    },
    {
      icon: RefreshCw,
      iconBg: "bg-rose-100 text-rose-600",
      title: "缺货 100% 极速退款",
      description: "若中国商家缺货或无法发货，全额100%退款，不扣除任何手续费。"
    }
  ] : [
    {
      icon: PackagePlus,
      iconBg: "bg-blue-100 text-blue-600",
      title: "ระบบรวมบิลประหยัดค่าส่ง",
      description: "สั่งสินค้าหลายร้าน สามารถรอให้ของมาครบแล้วกดรวมส่งพร้อมกันได้ ช่วยประหยัดค่าส่งในไทยได้สูงสุด"
    },
    {
      icon: Bell,
      iconBg: "bg-emerald-100 text-emerald-600",
      title: "แจ้งเตือนผ่าน LINE อัตโนมัติ",
      description: "ระบบส่งข้อความแจ้งเตือนสถานะทันทีเมื่อสินค้ามีความเคลื่อนไหว ไม่ต้องคอยกดเช็คเองตลอดเวลา"
    },
    {
      icon: ShieldCheck,
      iconBg: "bg-amber-100 text-amber-600",
      title: "บริการเสริมตีลังไม้กันกระแทก",
      description: "มีบริการตีลังไม้สำหรับสินค้าแตกหักง่ายหรือเครื่องใช้ไฟฟ้า เริ่มต้นเพียง 200 บาท ช่วยปกป้องสินค้า 100%"
    },
    {
      icon: RefreshCw,
      iconBg: "bg-rose-100 text-rose-600",
      title: "สินค้าหมด คืนเงินเต็มจำนวน 100%",
      description: "กรณีร้านค้าจีนแจ้งสินค้าหมดสต็อก ระบบจะทำการยกเลิกและคืนเงินค่าสินค้าให้ลูกค้าเต็มจำนวนทันที"
    }
  ]

  const faqs = locale === 'en' ? [
    {
      q: "How does the 3-Round payment system work?",
      a: "• Round 1: Product cost in RMB converted to THB + China domestic shipping.\n• Round 2: International China-to-Thailand freight (calculated by KG or CBM when goods arrive in TH).\n• Round 3: Thai domestic delivery fee (courier rate based on actual size/weight, or free self-pickup)."
    },
    {
      q: "How long does shipping take from China to Thailand?",
      a: "• Express Road (EK): 5 - 7 business days after container dispatch from China.\n• Economy Sea (SEA): 15 - 20 business days after container dispatch from China."
    },
    {
      q: "How is international freight calculated between weight (KG) and volume (CBM)?",
      a: "Freight is charged on whichever is higher between actual weight (KG) and volumetric size (CBM = Width × Length × Height in cm / 1,000,000). You can test our interactive calculator on the Pricing page."
    },
    {
      q: "Can I combine multiple orders to save on delivery fees?",
      a: "Yes! When your items arrive at our Thailand warehouse, you can select multiple orders and click 'Consolidate Bill' to package and ship them together."
    },
    {
      q: "Are there any items prohibited from importation?",
      a: "Yes. Prohibited items include lighters, flammable materials, adult toys, e-cigarettes, weapons, and restricted contraband. If unsure, please consult our admin team."
    },
    {
      q: "Do you charge a purchasing service fee?",
      a: "No! Sabuyship charges 0% purchasing service fee and provides free supplier negotiation."
    }
  ] : locale === 'zh' ? [
    {
      q: "三阶段收费模式具体是如何运作的？",
      a: "• 第一轮：商品货款（人民币按实时汇率折算泰铢）+ 中国国内快递费。\n• 第二轮：中泰国际跨境运费（商品抵泰后按实际重量或立方体积结算）。\n• 第三轮：泰国国内派送费（按快递实际费率收取，或曼谷仓库免费自提）。"
    },
    {
      q: "从中国发货到泰国需要多少天？",
      a: "• 特快陆运 (EK)：装柜发车后 5 - 7 个工作日送达泰国。\n• 经济海运 (SEA)：装柜开船后 15 - 20 个工作日送达泰国。"
    },
    {
      q: "国际运费如何按重量 (KG) 与体积 (CBM) 进行计费？",
      a: "按照国际物流标准，按实际重量 (KG) 与体积重量 (CBM = 长×宽×高cm / 1,000,000) 两者中较高者计费。您可在“服务费用”页面使用运费估算器进行测算。"
    },
    {
      q: "可以把多个包裹合并发货省运费吗？",
      a: "可以！当您订购的多件商品抵达泰国仓库后，可在控制台勾选多个订单并点击“合并账单”，打包一同发货以节省派送费用。"
    },
    {
      q: "有哪些违禁品不可承运？",
      a: "打火机、易燃易爆品、成人用品、电子烟、武器及海关管制禁运品均不可承运。如有疑问下单前请咨询客服。"
    },
    {
      q: "是否有代购服务费？",
      a: "没有！Sabuyship 不收取任何代购服务费 (0% Service Fee)，并免费提供中国厂家议价服务。"
    }
  ] : [
    {
      q: "การชำระเงินแบบ 3 รอบ มีรายละเอียดอย่างไรบ้าง?",
      a: "• รอบที่ 1: ค่าสินค้าตามจริงจากร้านจีน (คิดตามเรทเงินหยวน) + ค่าขนส่งในจีน (ถ้ามี)\n• รอบที่ 2: ค่าขนส่งระหว่างประเทศ จีน-ไทย (คิดตามน้ำหนัก KG หรือขนาดคิว CBM เมื่อของถึงไทย)\n• รอบที่ 3: ค่าจัดส่งในไทยถึงหน้าบ้านลูกค้า (คิดตามจริงของขนส่งเอกชน หรือมารับเองที่โกดังฟรี 0 บาท)"
    },
    {
      q: "ระยะเวลาขนส่งจากจีนมาไทยใช้เวลากี่วัน?",
      a: "• ทางรถด่วน (EK): ใช้เวลาประมาณ 5 - 7 วัน (นับจากวันที่สินค้าขึ้นตู้และออกจากโกดังจีน)\n• ทางเรือประหยัด (SEA): ใช้เวลาประมาณ 15 - 20 วัน (นับจากวันที่ตู้เรือออกจากท่าเรือจีน)"
    },
    {
      q: "ค่าขนส่งคิดตามน้ำหนัก (KG) หรือ ปริมาตร (CBM) อย่างไร?",
      a: "ระบบจะคำนวณเปรียบเทียบระหว่าง 'ค่าน้ำหนัก' กับ 'ค่าปริมาตรคิว (CBM = กว้าง x ยาว x สูง cm / 1,000,000)' แล้วเลือกคิดจากยอดที่สูงกว่าตามมาตรฐานสากลของบริษัทคาร์โก้ สามารถทดลองคำนวณได้ที่หน้า 'อัตราค่าบริการ'"
    },
    {
      q: "ถ้าสั่งสินค้าหลายร้าน สามารถรวมส่งพร้อมกันได้ไหม?",
      a: "ทำได้ครับ! เมื่อสินค้าแต่ละชิ้นมาถึงโกดังไทย ลูกค้าสามารถเลือกกด 'รวมบิล' เพื่อให้แพ็ครวมกล่องและจัดส่งไปพร้อมกันในรอบเดียว ช่วยประหยัดค่าส่งในไทยได้มาก"
    },
    {
      q: "มีสินค้าประเภทไหนบ้างที่ห้ามนำเข้า?",
      a: "สินค้าต้องห้าม ได้แก่ ไฟแช็ค วัตถุไวไฟ แบตเตอรี่สำรองขนาดใหญ่ บุหรี่ไฟฟ้า ของเล่นผู้ใหญ่ อาวุธ และสิ่งผิดกฎหมายทุกชนิด หากไม่แน่ใจสามารถสอบถามแอดมินก่อนสั่งซื้อได้ครับ"
    },
    {
      q: "มีค่าบริการสั่งซื้อ (Service Fee) หรือไม่?",
      a: "ไม่มีครับ! Sabuyship ฟรีค่าบริการสั่งซื้อ 0 บาท และมีทีมงานช่วยเจรจาต่อรองราคาส่งกับร้านค้าจีนให้ฟรี ไม่มีค่าแอบแฝง"
    }
  ]

  return (
    <div className="py-16 md:py-24 px-4 md:px-8 min-h-screen bg-slate-50 text-slate-800">
      <div className="container max-w-5xl mx-auto space-y-16">
        {/* 1. Header Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 text-primary rounded-full text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            {t.howBadge || "คู่มือการนำเข้าสินค้า จีน-ไทย ฉบับสมบูรณ์"}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            {t.howMainTitle || "ขั้นตอนการนำเข้าสินค้า"} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Sabuyship</span>
          </h1>
          <p className="text-base md:text-lg text-slate-600">
            {t.howMainSub || "ระบบสั่งซื้อและขนส่งสินค้าจีน-ไทย แบบ 3 รอบโปร่งใส ชัดเจนทุกขั้นตอน เช็คสถานะได้ 24 ชม."}
          </p>
        </div>

        {/* 2. 3-Phase Stepper Workflow */}
        <div className="space-y-12">
          {phases.map((phase) => (
            <div key={phase.phaseNumber} className="space-y-6">
              {/* Phase Header Banner */}
              <div className={`p-4 md:p-6 rounded-2xl bg-gradient-to-r ${phase.phaseColor} shadow-lg flex flex-col sm:flex-row justify-between sm:items-center gap-3`}>
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-black text-sm">
                    {phase.phaseNumber}
                  </span>
                  <h2 className="text-lg md:text-xl font-black">{phase.phaseTitle}</h2>
                </div>
                <span className="inline-block px-3.5 py-1 bg-white/90 text-slate-900 rounded-full text-xs font-bold shrink-0 shadow-2xs">
                  {phase.phaseBadge}
                </span>
              </div>

              {/* Steps Inside Phase */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {phase.steps.map((step) => {
                  const Icon = step.icon
                  return (
                    <Card key={step.stepNumber} className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white rounded-2xl">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${step.iconBg}`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <span className="text-2xl font-black text-slate-200">
                            {step.stepNumber}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            {step.tag}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 leading-snug">
                            {step.title}
                          </h3>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          {step.description}
                        </p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 3. Sabuyship Highlights & Value Props */}
        <section className="space-y-8 pt-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              {t.howFeaturesTitle || "จุดเด่นที่ทำให้ Sabuyship แตกต่างและคุ้มค่ากว่า"}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featureCards.map((feat, idx) => {
              const Icon = feat.icon
              return (
                <div key={idx} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${feat.iconBg}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{feat.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{feat.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* 4. FAQ Accordion Section */}
        <section className="space-y-8 pt-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center justify-center gap-2">
              <HelpCircle className="w-7 h-7 text-primary" />
              {t.howFaqTitle || "คำถามที่พบบ่อย (FAQ)"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {t.howFaqSub || "รวบรวมข้อสงสัยยอดฮิตเกี่ยวกับการสั่งซื้อและนำเข้าสินค้าจากจีน"}
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left font-bold text-sm sm:text-base text-slate-900 flex justify-between items-center gap-4 hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${openFaq === idx ? "rotate-180 text-primary" : ""}`} />
                </button>
                {openFaq === idx && (
                  <div className="p-5 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/30 whitespace-pre-line animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 5. Bottom CTA Banner */}
        <section className="py-12 px-6 bg-slate-950 text-white rounded-3xl text-center space-y-5 shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            {t.ctaTitle}
          </h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto">
            {t.ctaSub}
          </p>
          <div>
            <Link href="/inquiry">
              <Button size="lg" variant="orange" className="text-base px-8 h-12 font-black rounded-xl cursor-pointer shadow-lg">
                {t.ctaBtn}
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

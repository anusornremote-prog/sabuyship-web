"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/components/providers/language-provider"
import { 
  Truck, 
  Ship, 
  Package, 
  Calculator, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  ArrowRight,
  Maximize2,
  Scale,
  Sparkles,
  Zap,
  Box,
  Gift,
  ShieldCheck,
  Building2,
  Check
} from "lucide-react"

// Import Rates Mapping
const RATES = {
  road: {
    general: { kg: 39, cbm: 6990 },
    tis: { kg: 59, cbm: 7990 },
    fda: { kg: 69, cbm: 8990 },
    special: { kg: 99, cbm: 9990 }
  },
  sea: {
    general: { kg: 29, cbm: 3990 },
    tis: { kg: 39, cbm: 4990 },
    fda: { kg: 59, cbm: 6490 },
    special: { kg: 89, cbm: 6990 }
  }
}

// Category Helper
const CATEGORIES = [
  { id: "general", key: "catGeneral", label: "ทั่วไป / ธรรมดา", descTh: "เสื้อผ้า รองเท้า กระเป๋า ของใช้ทั่วไป", descEn: "Clothing, shoes, general items" },
  { id: "tis", key: "catTis", label: "มอก. (TIS)", descTh: "เครื่องใช้ไฟฟ้า อุปกรณ์ไอที ของเล่น", descEn: "Electrical appliances, IT, toys" },
  { id: "fda", key: "catFda", label: "อย. (FDA)", descTh: "เครื่องสำอาง สกินแคร์ อาหารเสริม", descEn: "Cosmetics, skincare, food supplements" },
  { id: "special", key: "catSpecial", label: "พิเศษ / แบรนด์เนม", descTh: "สินค้าแบรนด์เนม ลิขสิทธิ์เฉพาะ", descEn: "Brand name, licensed goods" }
] as const;

// Preset Box Sizes
const PRESET_SIZES = [
  { label: "กล่องเล็ก (S)", w: 20, l: 20, h: 20, desc: "20×20×20 cm" },
  { label: "กล่องกลาง (M)", w: 40, l: 40, h: 40, desc: "40×40×40 cm" },
  { label: "กล่องใหญ่ (L)", w: 60, l: 60, h: 60, desc: "60×60×60 cm" },
  { label: "กระสอบใหญ่ (XL)", w: 80, l: 60, h: 50, desc: "80×60×50 cm" }
]

export default function Pricing() {
  const { t, locale } = useTranslation()

  // Calculator State
  const [shipMethod, setShipMethod] = useState<"road" | "sea">("road")
  const [category, setCategory] = useState<"general" | "tis" | "fda" | "special">("general")
  const [weight, setWeight] = useState<string>("")
  const [inputType, setInputType] = useState<"dimensions" | "directCbm">("dimensions")
  const [width, setWidth] = useState<string>("")
  const [length, setLength] = useState<string>("")
  const [height, setHeight] = useState<string>("")
  const [quantity, setQuantity] = useState<string>("1")
  const [directCbm, setDirectCbm] = useState<string>("")
  const [woodenCrate, setWoodenCrate] = useState<boolean>(false)

  // Quick Preset Handlers
  const handleApplyPreset = (w: number, l: number, h: number) => {
    setInputType("dimensions")
    setWidth(w.toString())
    setLength(l.toString())
    setHeight(h.toString())
  }

  // Calculations
  const calculations = useMemo(() => {
    const wVal = parseFloat(weight) || 0
    const qVal = Math.max(parseInt(quantity) || 1, 1)
    
    let cbmVal = 0
    if (inputType === "dimensions") {
      const widthNum = parseFloat(width) || 0
      const lengthNum = parseFloat(length) || 0
      const heightNum = parseFloat(height) || 0
      cbmVal = (widthNum * lengthNum * heightNum) / 1000000 * qVal
    } else {
      cbmVal = (parseFloat(directCbm) || 0)
    }

    const rates = RATES[shipMethod][category]
    const costByWeight = wVal * rates.kg
    const costByCbm = cbmVal * rates.cbm
    
    // Choose higher price standard
    const isWeightCharged = costByWeight >= costByCbm
    const baseCost = Math.max(costByWeight, costByCbm)
    
    // Wooden crate flat minimum 200 per box
    const woodenCost = woodenCrate ? (200 * qVal) : 0
    const totalCost = baseCost + woodenCost

    return {
      cbm: cbmVal,
      costByWeight,
      costByCbm,
      baseCost,
      woodenCost,
      totalCost,
      isWeightCharged,
      rateKg: rates.kg,
      rateCbm: rates.cbm
    }
  }, [shipMethod, category, weight, inputType, width, length, height, quantity, directCbm, woodenCrate])

  // Helper to format currency
  const formatCurrency = (val: number) => {
    return val.toLocaleString(locale === "en" ? "en-US" : "th-TH", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })
  }

  // Reset inputs
  const handleReset = () => {
    setWeight("")
    setWidth("")
    setLength("")
    setHeight("")
    setQuantity("1")
    setDirectCbm("")
    setWoodenCrate(false)
  }

  return (
    <div className="py-16 md:py-24 px-4 md:px-8 min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <div className="container max-w-5xl mx-auto space-y-12">
        {/* 1. Header Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 text-primary rounded-full text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            ราคาโปร่งใส ไม่มีบวกเพิ่ม มั่นใจทุกการสั่งซื้อ
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            อัตราค่าบริการนำเข้าสินค้า <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">จีน-ไทย</span>
          </h1>
          <p className="text-base md:text-lg text-slate-600 dark:text-slate-400">
            คิดตามจริงตามขนาดและน้ำหนักของสินค้า ไม่มีค่าธรรมเนียมแอบแฝง เลือกได้ทั้งทางรถด่วนและทางเรือประหยัด
          </p>
        </div>

        {/* 2. Modern Rate Matrix Card */}
        <Card className="border border-slate-200 shadow-md bg-white dark:bg-slate-900 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 p-5 md:px-6 bg-gradient-to-r from-slate-50 to-blue-50/40 border-b border-slate-200/80">
            <div>
              <CardTitle className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                ตารางเปรียบเทียบอัตราค่าขนส่ง (Shipping Rate Table)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                เปรียบเทียบอัตราต่อกิโลกรัม (KG) และต่อคิวบิกเมตร (CBM)
              </CardDescription>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold shrink-0">
              <Check className="w-3.5 h-3.5" /> อัปเดตล่าสุด 2026
            </span>
          </div>
          
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/75 border-b border-slate-200">
                  <th className="p-4 md:p-5 text-xs font-black text-slate-700 uppercase tracking-wider w-1/3">
                    ประเภทสินค้า (Category)
                  </th>
                  <th className="p-4 md:p-5 text-xs font-black text-orange-950 uppercase tracking-wider w-1/3 bg-orange-50/80 border-l border-r border-orange-200/60">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-orange-500 text-white rounded-lg shadow-2xs">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-black text-orange-900 block text-sm">ทางรถด่วน (EK)</span>
                        <span className="text-[10px] font-bold text-orange-600">ระยะเวลา 5 - 7 วัน</span>
                      </div>
                    </div>
                  </th>
                  <th className="p-4 md:p-5 text-xs font-black text-blue-950 uppercase tracking-wider w-1/3 bg-blue-50/80">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-2xs">
                        <Ship className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-black text-blue-900 block text-sm">ทางเรือประหยัด (SEA)</span>
                        <span className="text-[10px] font-bold text-blue-600">ระยะเวลา 15 - 20 วัน</span>
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {CATEGORIES.map((cat) => {
                  const roadRates = RATES.road[cat.id]
                  const seaRates = RATES.sea[cat.id]
                  
                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-4 md:p-5">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 text-sm sm:text-base">{cat.label}</span>
                          <span className="text-xs text-slate-500 mt-0.5">
                            {locale === "th" ? cat.descTh : cat.descEn}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 md:p-5 bg-orange-50/30 border-l border-r border-orange-200/50">
                        <div className="space-y-0.5">
                          <p className="text-slate-900 font-black text-base">
                            <span className="text-lg font-black text-orange-600">{roadRates.kg}</span> ฿ / กก. (KG)
                          </p>
                          <p className="text-xs text-slate-500 font-semibold">
                            <span className="font-bold text-slate-700">{roadRates.cbm.toLocaleString()}</span> ฿ / คิว (CBM)
                          </p>
                        </div>
                      </td>
                      <td className="p-4 md:p-5 bg-blue-50/30">
                        <div className="space-y-0.5">
                          <p className="text-slate-900 font-black text-base">
                            <span className="text-lg font-black text-blue-600">{seaRates.kg}</span> ฿ / กก. (KG)
                          </p>
                          <p className="text-xs text-slate-500 font-semibold">
                            <span className="font-bold text-slate-700">{seaRates.cbm.toLocaleString()}</span> ฿ / คิว (CBM)
                          </p>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* 3. Interactive Smart Calculator */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Calculator Inputs (7 cols) */}
          <Card className="lg:col-span-7 border border-slate-200 shadow-lg bg-white rounded-2xl">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-orange-500" />
                โปรแกรมคำนวณค่าขนส่งจีน-ไทย
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                คำนวณค่าขนส่งเบื้องต้นตามปริมาตร (CBM) หรือน้ำหนัก (KG) *ระบบเลือกคิดจากยอดที่สูงกว่า
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Shipping Method Switcher */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider block">
                  1. เลือกช่องทางการขนส่ง
                </label>
                <div className="grid grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => setShipMethod("road")}
                    className={`flex items-center justify-center gap-3 p-3.5 rounded-xl border-2 text-sm font-bold transition-all cursor-pointer ${
                      shipMethod === "road"
                        ? "border-orange-500 bg-orange-50/80 text-orange-800 shadow-sm"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <Truck className="w-5 h-5 text-orange-600 shrink-0" />
                    <div className="text-left">
                      <span className="block font-black">ทางรถด่วน (EK)</span>
                      <span className="text-[10px] opacity-75">5 - 7 วัน</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShipMethod("sea")}
                    className={`flex items-center justify-center gap-3 p-3.5 rounded-xl border-2 text-sm font-bold transition-all cursor-pointer ${
                      shipMethod === "sea"
                        ? "border-blue-500 bg-blue-50/80 text-blue-800 shadow-sm"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <Ship className="w-5 h-5 text-blue-600 shrink-0" />
                    <div className="text-left">
                      <span className="block font-black">ทางเรือประหยัด (SEA)</span>
                      <span className="text-[10px] opacity-75">15 - 20 วัน</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Product Category Cards */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider block">
                  2. เลือกประเภทสินค้า
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        category === cat.id
                          ? "border-slate-900 bg-slate-900 text-white shadow-md"
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <span className="text-xs font-black block">{cat.label}</span>
                      <span className={`text-[10px] mt-0.5 line-clamp-1 ${category === cat.id ? "text-slate-300" : "text-slate-500"}`}>
                        {cat.descTh}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Weight & Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider block">
                    3. น้ำหนักรวม (กิโลกรัม)
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="pr-12 h-11 text-base font-bold"
                      min="0"
                      step="any"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">
                      KG
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider block">
                    จำนวนกล่อง / ชิ้น
                  </label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="h-11 text-base font-bold"
                    min="1"
                    step="1"
                  />
                </div>
              </div>

              {/* Dimensions Section with Presets */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                    4. ขนาดพัสดุ (สำหรับคิดคิว CBM)
                  </label>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setInputType("dimensions")}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        inputType === "dimensions"
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      ขนาด ก×ย×ส (ซม.)
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputType("directCbm")}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        inputType === "directCbm"
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      ระบุคิว (CBM) ตรงๆ
                    </button>
                  </div>
                </div>

                {/* Preset Quick Buttons */}
                {inputType === "dimensions" && (
                  <div className="space-y-2">
                    <span className="text-[11px] text-slate-500 font-semibold">
                      ⚡ ปุ่มลัดขนาดกล่องมาตรฐาน (กดเพื่อกรอกขนาดทันที):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {PRESET_SIZES.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleApplyPreset(preset.w, preset.l, preset.h)}
                          className="p-2 text-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer text-xs"
                        >
                          <span className="font-bold text-slate-800 block text-[11px]">{preset.label}</span>
                          <span className="text-[10px] text-slate-500">{preset.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dimensions inputs */}
                {inputType === "dimensions" ? (
                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">กว้าง (ซม.)</span>
                      <Input
                        type="number"
                        placeholder="Width"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                        className="h-10 text-center font-bold"
                        min="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">ยาว (ซม.)</span>
                      <Input
                        type="number"
                        placeholder="Length"
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                        className="h-10 text-center font-bold"
                        min="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">สูง (ซม.)</span>
                      <Input
                        type="number"
                        placeholder="Height"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="h-10 text-center font-bold"
                        min="0"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.0000"
                      value={directCbm}
                      onChange={(e) => setDirectCbm(e.target.value)}
                      className="pr-16 h-11 text-base font-bold"
                      min="0"
                      step="any"
                    />
                    <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400">
                      CBM (คิว)
                    </span>
                  </div>
                )}
              </div>

              {/* Wooden Crate Add-on Checkbox */}
              <div className="flex items-center gap-3 p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl">
                <input
                  type="checkbox"
                  id="woodenCrate"
                  checked={woodenCrate}
                  onChange={(e) => setWoodenCrate(e.target.checked)}
                  className="w-5 h-5 rounded border-amber-300 text-orange-600 focus:ring-orange-500 cursor-pointer accent-orange-600"
                />
                <label htmlFor="woodenCrate" className="text-xs sm:text-sm font-bold text-amber-900 cursor-pointer flex-1">
                  ต้องการบริการเสริมตีลังไม้ (+200 บาท / ชิ้น เริ่มต้น)
                </label>
              </div>

              {/* Reset button */}
              <div className="flex justify-end pt-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleReset}
                  className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  ล้างข้อมูลคำนวณใหม่
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Calculator Results (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="border border-slate-800 shadow-2xl overflow-hidden bg-slate-900 text-white rounded-2xl">
              <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black flex items-center gap-2 text-white">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ผลการประเมินค่าขนส่ง
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-slate-300 uppercase">
                    รอบที่ 2 (จีน-ไทย)
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  คิดค่าบริการจากยอดที่สูงกว่าระหว่างน้ำหนัก (KG) และปริมาตร (CBM)
                </p>
              </div>

              <CardContent className="p-6 space-y-6">
                {/* Method / Cat Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={`px-3 py-1 text-xs font-bold border-0 text-white ${shipMethod === "road" ? "bg-orange-500" : "bg-blue-600"}`}>
                    {shipMethod === "road" ? "🚚 ทางรถด่วน (5-7 วัน)" : "🛳️ ทางเรือประหยัด (15-20 วัน)"}
                  </Badge>

                  <Badge variant="outline" className="border-white/20 text-white/90 text-xs">
                    {CATEGORIES.find(c => c.id === category)?.label}
                  </Badge>
                </div>

                {/* Compare Stats Box */}
                <div className="space-y-3">
                  {/* Weight Stats */}
                  <div className={`p-3.5 rounded-xl border transition-all ${
                    calculations.isWeightCharged 
                      ? "bg-emerald-500/15 border-emerald-500/40 text-white ring-1 ring-emerald-500/20" 
                      : "bg-white/5 border-white/5 text-slate-400"
                  }`}>
                    <div className="flex justify-between items-center text-xs font-semibold mb-1">
                      <span className="flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-slate-400" />
                        คิดตามน้ำหนัก (Weight Rate)
                      </span>
                      {calculations.isWeightCharged && (
                        <span className="text-[10px] text-emerald-300 font-black uppercase bg-emerald-500/30 px-2 py-0.5 rounded">
                          ✓ เลือกใช้น้ำหนัก (ยอดสูงกว่า)
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-semibold text-slate-300">
                        {parseFloat(weight) || 0} kg × {calculations.rateKg} ฿
                      </span>
                      <span className={`text-base font-black ${calculations.isWeightCharged ? "text-emerald-400" : "text-slate-300"}`}>
                        {formatCurrency(calculations.costByWeight)} ฿
                      </span>
                    </div>
                  </div>

                  {/* Volume Stats */}
                  <div className={`p-3.5 rounded-xl border transition-all ${
                    !calculations.isWeightCharged 
                      ? "bg-emerald-500/15 border-emerald-500/40 text-white ring-1 ring-emerald-500/20" 
                      : "bg-white/5 border-white/5 text-slate-400"
                  }`}>
                    <div className="flex justify-between items-center text-xs font-semibold mb-1">
                      <span className="flex items-center gap-1.5">
                        <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                        คิดตามปริมาตร (CBM Rate)
                      </span>
                      {!calculations.isWeightCharged && (
                        <span className="text-[10px] text-emerald-300 font-black uppercase bg-emerald-500/30 px-2 py-0.5 rounded">
                          ✓ เลือกใช้ปริมาตร (ยอดสูงกว่า)
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-baseline">
                      <div className="text-xs space-y-0.5">
                        <p className="font-semibold text-slate-300">
                          {calculations.cbm.toFixed(4)} CBM × {formatCurrency(calculations.rateCbm)} ฿
                        </p>
                      </div>
                      <span className={`text-base font-black ${!calculations.isWeightCharged ? "text-emerald-400" : "text-slate-300"}`}>
                        {formatCurrency(calculations.costByCbm)} ฿
                      </span>
                    </div>
                  </div>
                </div>

                {/* Wooden Crate Add-on Cost details */}
                {woodenCrate && (
                  <div className="flex justify-between items-center text-sm border-t border-white/10 pt-4 text-amber-300">
                    <span>ค่าบริการเสริมตีลังไม้ ({quantity} ชิ้น)</span>
                    <span className="font-bold">
                      + {formatCurrency(calculations.woodenCost)} ฿
                    </span>
                  </div>
                )}

                {/* Final cost display */}
                <div className="border-t border-white/10 pt-5 space-y-2">
                  <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                    ประมาณการค่าขนส่ง จีน-ไทย (รอบ 2)
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                      ฿{formatCurrency(calculations.totalCost)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    *ยอดจริงจะคำนวณอีกครั้งเมื่อพัสดุเข้าชั่ง/วัดขนาดที่โกดังจีน
                  </p>
                </div>

                {/* Direct Action Button */}
                <div className="pt-2">
                  <Link href="/inquiry">
                    <Button size="lg" variant="orange" className="w-full h-12 text-sm font-black cursor-pointer shadow-lg">
                      ส่งลิงก์ให้เราสั่งซื้อเลย ➔
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Note block */}
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-start gap-2.5 text-xs">
              <Info className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
              <div>
                <p className="font-bold mb-0.5">ข้อแนะนำในการคำนวณ</p>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  ค่าบริการนี้เฉพาะค่าขนส่งจีน-ไทย (รอบที่ 2) ไม่รวมค่าสินค้า (รอบ 1) และค่าจัดส่งในไทย (รอบ 3) ซึ่งสามารถกดรวมบิลเพื่อประหยัดค่าส่งได้
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Additional Services & Value Props (3 Cards Grid) */}
        <div className="grid md:grid-cols-3 gap-6 pt-4">
          {/* Free Service Fee */}
          <Card className="border border-emerald-200 bg-gradient-to-b from-emerald-50/60 to-white shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center mb-2">
                <Gift className="w-5 h-5" />
              </div>
              <CardTitle className="text-base font-black text-slate-900">
                ฟรี! ค่าบริการสั่งซื้อ 0 บาท
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>
                เราไม่มีการเก็บค่าบริการกดสั่งซื้อ (0% Service Fee) และมีทีมงานช่วยเจรจาต่อรองราคาส่งกับโรงงานจีนให้ฟรี
              </p>
            </CardContent>
          </Card>

          {/* Domestic Shipping & Wooden Crating */}
          <Card className="border border-blue-200 bg-gradient-to-b from-blue-50/60 to-white shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center mb-2">
                <Building2 className="w-5 h-5" />
              </div>
              <CardTitle className="text-base font-black text-slate-900">
                ค่าจัดส่งในไทย (รอบ 3)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>
                • <strong>มารับเองที่โกดัง:</strong> ฟรี ไม่มีค่าใช้จ่าย 0 บาท<br />
                • <strong>ขนส่งเอกชน (Flash, Kerry, J&T):</strong> คิดตามจริง (กล่องเล็ก 35-45฿ / กล่องกลาง 60-80฿) รวมบิลประหยัดได้
              </p>
            </CardContent>
          </Card>

          {/* Prohibited Items */}
          <Card className="border border-rose-200 bg-gradient-to-b from-rose-50/60 to-white shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 bg-rose-100 text-rose-700 rounded-xl flex items-center justify-center mb-2">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <CardTitle className="text-base font-black text-rose-700">
                สินค้าต้องห้ามนำเข้า
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-rose-700/90 leading-relaxed">
              <p>
                วัตถุไวไฟ, ไฟแช็ค, บุหรี่ไฟฟ้า, อาวุธ, สิ่งผิดกฎหมาย และสินค้าควบคุมพิเศษ ไม่สามารถจัดส่งได้ หากไม่แน่ใจสามารถสอบถามแอดมินก่อนสั่งซื้อได้ค่ะ
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 5. Bottom CTA Banner */}
        <section className="py-12 px-6 bg-slate-950 text-white rounded-3xl text-center space-y-5 shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            ประเมินราคาเรียบร้อยแล้วใช่ไหม?
          </h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto">
            ส่งลิงก์สินค้าจาก Taobao, 1688 หรือ Tmall ให้เราได้ทันที ทีมงานพร้อมช่วยเช็คสต็อกและต่อรองราคาให้คุณฟรี
          </p>
          <div>
            <Link href="/inquiry">
              <Button size="lg" variant="orange" className="text-base px-8 h-12 font-black rounded-xl cursor-pointer shadow-lg">
                ส่งลิงก์ขอใบเสนอราคาฟรีเลย ➔
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

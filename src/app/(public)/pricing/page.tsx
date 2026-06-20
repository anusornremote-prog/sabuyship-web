"use client"

import { useState, useMemo } from "react"
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
  Sparkles
} from "lucide-react"

// Import Rates Mapping matching the user's provided sheet
const RATES = {
  road: {
    general: { kg: 40, cbm: 6000 },
    tisFda: { kg: 60, cbm: 8000 },
    copyright: { kg: 80, cbm: 9000 }
  },
  sea: {
    general: { kg: 25, cbm: 3500 },
    tisFda: { kg: 35, cbm: 5500 },
    copyright: { kg: 55, cbm: 7000 }
  }
}

export default function Pricing() {
  const { t, locale } = useTranslation()

  // Calculator State
  const [shipMethod, setShipMethod] = useState<"road" | "sea">("road")
  const [category, setCategory] = useState<"general" | "tisFda" | "copyright">("general")
  const [weight, setWeight] = useState<string>("")
  const [inputType, setInputType] = useState<"dimensions" | "directCbm">("dimensions")
  const [width, setWidth] = useState<string>("")
  const [length, setLength] = useState<string>("")
  const [height, setHeight] = useState<string>("")
  const [quantity, setQuantity] = useState<string>("1")
  const [directCbm, setDirectCbm] = useState<string>("")
  const [woodenCrate, setWoodenCrate] = useState<boolean>(false)

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
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge variant="outline" className="px-4 py-1 text-xs font-semibold tracking-wider text-primary border-primary bg-primary/5 rounded-full dark:text-primary-foreground">
            <Sparkles className="w-3.5 h-3.5 mr-1 inline-block animate-pulse text-amber-500" />
            {t.pricingTitle}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            {t.importRateTitle || "เรทราคาบริการนำเข้าสินค้า จีน-ไทย"}
          </h1>
          <p className="text-base md:text-lg text-slate-600 dark:text-slate-400">
            {t.pricingSub || "ราคาโปร่งใส ไม่มีบวกเพิ่ม มั่นใจทุกการสั่งซื้อ"}
          </p>
        </div>

        {/* Pricing Tables Card */}
        <Card className="border-slate-100 shadow-md bg-white dark:bg-slate-900 dark:border-slate-800">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              {t.importRateTitle || "เรทราคาบริการนำเข้าสินค้า จีน-ไทย"}
            </CardTitle>
            <CardDescription>
              {locale === "th" ? "อัตราค่าขนส่งแยกตามประเภทสินค้าและการขนส่ง" : "Shipping rates categorized by product type and shipping method."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                  <th className="p-4 md:p-6 text-sm font-semibold text-slate-500 uppercase tracking-wider w-1/3">
                    {locale === "th" ? "ประเภทสินค้า" : locale === "zh" ? "商品类型" : "Product Category"}
                  </th>
                  <th className="p-4 md:p-6 text-sm font-semibold text-slate-500 uppercase tracking-wider w-1/3">
                    <div className="flex items-center gap-2 text-accent">
                      <Truck className="w-4 h-4" />
                      <span>{t.importByRoad || "นำเข้าสินค้าทางรถ (5-7 วัน)"}</span>
                    </div>
                  </th>
                  <th className="p-4 md:p-6 text-sm font-semibold text-slate-500 uppercase tracking-wider w-1/3">
                    <div className="flex items-center gap-2 text-primary">
                      <Ship className="w-4 h-4" />
                      <span>{t.importBySea || "นำเข้าสินค้าทางเรือ (15-20 วัน)"}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {/* General Goods */}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="p-4 md:p-6">
                    <div className="font-bold text-slate-900 dark:text-white flex flex-col">
                      <span>{t.generalGoods || "สินค้าทั่วไป"}</span>
                      <span className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                        {locale === "th" ? "เสื้อผ้า แฟชั่น ของใช้ทั่วไป ไม่มีตราสินค้า" : "Clothing, fashion, general items, no brands"}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 md:p-6">
                    <div className="space-y-1">
                      <p className="text-slate-900 dark:text-white font-semibold">
                        <span className="text-lg font-black text-slate-950 dark:text-slate-100">40</span> {locale === "th" ? "บาท" : "THB"} / KG
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-slate-700 dark:text-slate-300">6,000</span> {locale === "th" ? "บาท" : "THB"} / CBM
                      </p>
                    </div>
                  </td>
                  <td className="p-4 md:p-6">
                    <div className="space-y-1">
                      <p className="text-slate-900 dark:text-white font-semibold">
                        <span className="text-lg font-black text-slate-950 dark:text-slate-100">25</span> {locale === "th" ? "บาท" : "THB"} / KG
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-slate-700 dark:text-slate-300">3,500</span> {locale === "th" ? "บาท" : "THB"} / CBM
                      </p>
                    </div>
                  </td>
                </tr>

                {/* FDA/TIS */}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="p-4 md:p-6">
                    <div className="font-bold text-slate-900 dark:text-white flex flex-col">
                      <span>{t.tisFdaGoods || "สินค้า มอก. อย."}</span>
                      <span className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                        {locale === "th" ? "เครื่องใช้ไฟฟ้า เครื่องสำอาง อาหาร ยา" : "Electrical appliances, cosmetics, food, medicine"}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 md:p-6">
                    <div className="space-y-1">
                      <p className="text-slate-900 dark:text-white font-semibold">
                        <span className="text-lg font-black text-slate-950 dark:text-slate-100">60</span> {locale === "th" ? "บาท" : "THB"} / KG
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-slate-700 dark:text-slate-300">8,000</span> {locale === "th" ? "บาท" : "THB"} / CBM
                      </p>
                    </div>
                  </td>
                  <td className="p-4 md:p-6">
                    <div className="space-y-1">
                      <p className="text-slate-900 dark:text-white font-semibold">
                        <span className="text-lg font-black text-slate-950 dark:text-slate-100">35</span> {locale === "th" ? "บาท" : "THB"} / KG
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-slate-700 dark:text-slate-300">5,500</span> {locale === "th" ? "บาท" : "THB"} / CBM
                      </p>
                    </div>
                  </td>
                </tr>

                {/* Copyright/Branded */}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="p-4 md:p-6">
                    <div className="font-bold text-slate-900 dark:text-white flex flex-col">
                      <span>{t.copyrightGoods || "สินค้าลิขสิทธิ์"}</span>
                      <span className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                        {locale === "th" ? "สินค้าแบรนด์เนม สินค้าลิขสิทธิ์การ์ตูน/กีฬา" : "Brand name goods, cartoon/sports license goods"}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 md:p-6">
                    <div className="space-y-1">
                      <p className="text-slate-900 dark:text-white font-semibold">
                        <span className="text-lg font-black text-slate-950 dark:text-slate-100">80</span> {locale === "th" ? "บาท" : "THB"} / KG
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-slate-700 dark:text-slate-300">9,000</span> {locale === "th" ? "บาท" : "THB"} / CBM
                      </p>
                    </div>
                  </td>
                  <td className="p-4 md:p-6">
                    <div className="space-y-1">
                      <p className="text-slate-900 dark:text-white font-semibold">
                        <span className="text-lg font-black text-slate-950 dark:text-slate-100">55</span> {locale === "th" ? "บาท" : "THB"} / KG
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-slate-700 dark:text-slate-300">7,000</span> {locale === "th" ? "บาท" : "THB"} / CBM
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Dynamic Calculator Section */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Calculator Inputs (7 cols) */}
          <Card className="lg:col-span-7 border-slate-100 shadow-lg bg-white dark:bg-slate-900 dark:border-slate-800">
            <CardHeader className="border-b border-slate-50 dark:border-slate-800/50 pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Calculator className="w-5 h-5 text-accent" />
                {t.calcTitle || "โปรแกรมคำนวณค่าขนส่งจีน-ไทย"}
              </CardTitle>
              <CardDescription>
                {t.calcSubtitle || "คำนวณค่าขนส่งเบื้องต้นตามปริมาตร (CBM) หรือน้ำหนัก (KG) *ระบบจะเลือกคิดค่าบริการจากยอดที่สูงกว่า"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Shipping Method */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {t.calcShipMethod || "ช่องทางการขนส่ง"}
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setShipMethod("road")}
                    className={`flex items-center justify-center gap-3 p-4 rounded-xl border text-sm font-semibold transition-all ${
                      shipMethod === "road"
                        ? "border-accent bg-accent/5 text-accent shadow-sm"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Truck className={`w-5 h-5 ${shipMethod === "road" ? "animate-bounce" : ""}`} />
                    <span>{t.importByRoad || "ทางรถ"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShipMethod("sea")}
                    className={`flex items-center justify-center gap-3 p-4 rounded-xl border text-sm font-semibold transition-all ${
                      shipMethod === "sea"
                        ? "border-primary bg-primary/5 text-primary shadow-sm"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Ship className={`w-5 h-5 ${shipMethod === "sea" ? "animate-pulse" : ""}`} />
                    <span>{t.importBySea || "ทางเรือ"}</span>
                  </button>
                </div>
              </div>

              {/* Product Category */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {t.calcProductCategory || "ประเภทสินค้า"}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["general", "tisFda", "copyright"] as const).map((cat) => {
                    const label = cat === "general" ? t.generalGoods : cat === "tisFda" ? t.tisFdaGoods : t.copyrightGoods
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`py-2.5 px-3 rounded-lg border text-xs font-semibold text-center transition-all ${
                          category === cat
                            ? "bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-950 dark:border-slate-100 shadow-sm"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                        }`}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <hr className="border-slate-100 dark:border-slate-800" />

              {/* Package Inputs */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Weight */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    {t.calcWeight || "น้ำหนัก (KG)"}
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="pr-12 h-11"
                      min="0"
                      step="any"
                    />
                    <span className="absolute right-3.5 top-3 text-sm font-semibold text-slate-400">
                      KG
                    </span>
                  </div>
                </div>

                {/* Box quantity */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    {t.calcQuantity || "จำนวนกล่อง (ชิ้น)"}
                  </label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="h-11"
                    min="1"
                    step="1"
                  />
                </div>
              </div>

              {/* Dimensions Mode Selector */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t.calcInputType || "ระบุขนาดสินค้า"}
                  </label>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setInputType("dimensions")}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                        inputType === "dimensions"
                          ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {locale === "th" ? "ขนาดกล่อง" : "Dimensions"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputType("directCbm")}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                        inputType === "directCbm"
                          ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {locale === "th" ? "ปริมาตร (CBM)" : "CBM"}
                    </button>
                  </div>
                </div>

                {/* Dimension inputs */}
                {inputType === "dimensions" ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">{t.calcWidth || "กว้าง (ซม.)"}</span>
                      <Input
                        type="number"
                        placeholder="W"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                        className="h-10 text-center"
                        min="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">{t.calcLength || "ยาว (ซม.)"}</span>
                      <Input
                        type="number"
                        placeholder="L"
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                        className="h-10 text-center"
                        min="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">{t.calcHeight || "สูง (ซม.)"}</span>
                      <Input
                        type="number"
                        placeholder="H"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="h-10 text-center"
                        min="0"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.000"
                      value={directCbm}
                      onChange={(e) => setDirectCbm(e.target.value)}
                      className="pr-16 h-11"
                      min="0"
                      step="any"
                    />
                    <span className="absolute right-3.5 top-3 text-sm font-semibold text-slate-400">
                      CBM (คิว)
                    </span>
                  </div>
                )}
              </div>

              {/* Wooden Crate Add-on Checkbox */}
              <div className="flex items-center gap-3 p-3.5 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-xl">
                <input
                  type="checkbox"
                  id="woodenCrate"
                  checked={woodenCrate}
                  onChange={(e) => setWoodenCrate(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                />
                <label htmlFor="woodenCrate" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer flex-1">
                  {t.calcWoodenCrate || "ต้องการบริการตีลังไม้ (+200 บาท / ชิ้น เริ่มต้น)"}
                </label>
              </div>

              {/* Reset button */}
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleReset}
                  className="text-xs"
                >
                  {locale === "th" ? "ล้างข้อมูล" : "Reset Data"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Calculator Results (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="border-slate-900/10 shadow-xl overflow-hidden bg-slate-900 text-white dark:bg-slate-900/60 border dark:border-slate-800">
              <div className="bg-gradient-to-r from-slate-900 to-slate-850 p-6 border-b border-white/5">
                <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  {t.calcResultTitle || "ผลการประเมินค่าขนส่ง"}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {t.calcResultComparisonText || "คิดค่าบริการจากยอดที่สูงกว่าระหว่างน้ำหนักและปริมาตร"}
                </p>
              </div>

              <CardContent className="p-6 space-y-6">
                {/* Method/Cat Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={`px-2.5 py-1 text-xs font-bold border-0 text-white ${shipMethod === "road" ? "bg-accent" : "bg-primary"}`}>
                    {shipMethod === "road" ? (t.importByRoad ? t.importByRoad.split(" ")[0] : "ทางรถ") : (t.importBySea ? t.importBySea.split(" ")[0] : "ทางเรือ")}
                  </Badge>
                  <Badge variant="outline" className="border-white/20 text-white/90">
                    {category === "general" ? t.generalGoods : category === "tisFda" ? t.tisFdaGoods : t.copyrightGoods}
                  </Badge>
                </div>

                {/* Compare Stats */}
                <div className="space-y-3.5">
                  {/* Weight Stats */}
                  <div className={`p-3 rounded-xl border transition-all ${
                    calculations.isWeightCharged 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-white" 
                      : "bg-white/5 border-white/5 text-slate-300"
                  }`}>
                    <div className="flex justify-between items-center text-xs font-semibold mb-1">
                      <span className="flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-slate-400" />
                        {t.calcResultWeightCost || "คำนวณจากน้ำหนัก"}
                      </span>
                      {calculations.isWeightCharged && (
                        <span className="text-[10px] text-emerald-400 font-extrabold uppercase bg-emerald-500/20 px-2 py-0.5 rounded">
                          {locale === "th" ? "เลือกใช้น้ำหนัก" : "Charged"}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-bold">
                        {parseFloat(weight) || 0} kg × {calculations.rateKg} {t.priceBaht || "บาท"}
                      </span>
                      <span className={`text-base font-black ${calculations.isWeightCharged ? "text-emerald-400" : "text-white"}`}>
                        {formatCurrency(calculations.costByWeight)} {t.priceBaht || "บาท"}
                      </span>
                    </div>
                  </div>

                  {/* Volume Stats */}
                  <div className={`p-3 rounded-xl border transition-all ${
                    !calculations.isWeightCharged 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-white" 
                      : "bg-white/5 border-white/5 text-slate-300"
                  }`}>
                    <div className="flex justify-between items-center text-xs font-semibold mb-1">
                      <span className="flex items-center gap-1.5">
                        <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                        {t.calcResultCbmCost || "คำนวณจากปริมาตร"}
                      </span>
                      {!calculations.isWeightCharged && (
                        <span className="text-[10px] text-emerald-400 font-extrabold uppercase bg-emerald-500/20 px-2 py-0.5 rounded">
                          {locale === "th" ? "เลือกใช้ปริมาตร" : "Charged"}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-baseline">
                      <div className="text-xs space-y-0.5">
                        <p className="font-bold text-sm">
                          {calculations.cbm.toFixed(4)} CBM × {formatCurrency(calculations.rateCbm)} {t.priceBaht || "บาท"}
                        </p>
                        {inputType === "dimensions" && (parseFloat(width) > 0 || parseFloat(length) > 0 || parseFloat(height) > 0) && (
                          <p className="text-[10px] text-slate-400 font-normal">
                            ({width} × {length} × {height}) / 1,000,000 × {quantity}
                          </p>
                        )}
                      </div>
                      <span className={`text-base font-black ${!calculations.isWeightCharged ? "text-emerald-400" : "text-white"}`}>
                        {formatCurrency(calculations.costByCbm)} {t.priceBaht || "บาท"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Wooden Crate Add-on Cost details */}
                {woodenCrate && (
                  <div className="flex justify-between items-center text-sm border-t border-white/10 pt-4 text-slate-300">
                    <span>{t.calcResultWoodenCost || "ค่าตีลังไม้ (เริ่มต้น)"}</span>
                    <span className="font-bold text-white">
                      + {formatCurrency(calculations.woodenCost)} {t.priceBaht || "บาท"}
                    </span>
                  </div>
                )}

                {/* Final cost display */}
                <div className="border-t border-white/10 pt-5 space-y-2">
                  <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                    {t.calcResultFinalCost || "ค่าขนส่งรวม (จีน-ไทย)"}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                      {formatCurrency(calculations.totalCost)}
                    </span>
                    <span className="text-lg font-bold text-slate-300">
                      {t.priceBaht || "บาท"}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 italic">
                    {t.calcResultFinalCostDesc || "*ยังไม่รวมค่าตีลังไม้และค่าขนส่งในไทย"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Note block in sidebar */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl flex items-start gap-2.5 text-xs font-medium">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold mb-1">
                  {t.noteTitle || "หมายเหตุ"}
                </p>
                <p className="leading-relaxed">
                  {t.calcResultFinalCostDesc || "*ยังไม่รวมค่าตีลังไม้และค่าขนส่งในไทย"} {locale === "th" ? "การคำนวณนี้เป็นการคำนวณเบื้องต้นจากการประมาณการเท่านั้น ค่าขนส่งจริงจะขึ้นอยู่กับขนาดและน้ำหนักจริงของสินค้าเมื่อเข้าโกดัง" : "This is only an estimate. Actual shipping cost is based on the exact size and weight of goods upon warehouse arrival."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footnotes & Other services */}
        <div className="grid md:grid-cols-2 gap-8 pt-4">
          {/* Service Fee & Additional services */}
          <div className="space-y-6">
            <Card className="border-slate-100 shadow-sm bg-white dark:bg-slate-900 dark:border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold">{t.additionalTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">{t.woodenTitle}</h4>
                  <p>{t.woodenDesc}</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">{t.domesticTitle}</h4>
                  <p>{t.domesticDesc}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes and Prohibited Items (matching user image) */}
          <Card className="border-rose-100 bg-rose-50/20 dark:border-rose-950/20 dark:bg-rose-950/5 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                {t.noteTitle || "หมายเหตุ"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <div className="flex gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0"></div>
                <p className="font-semibold text-rose-600 dark:text-rose-400">
                  {t.noteProhibited || "ไฟแช็คหรือสินค้าที่เป็นวัตถุไวไฟ / ของเล่นผู้ใหญ่ / บุหรี่ไฟฟ้า ไม่สามารถจัดส่งได้"}
                </p>
              </div>
              <div className="flex gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0"></div>
                <p>
                  {t.noteServiceOnly || "ทางบริษัทมีบริการแค่จัดซื้อและขนส่งเท่านั้น (ไม่รับแลกเงินทุกกรณี)"}
                </p>
              </div>
              <div className="flex gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0"></div>
                <p className="font-medium">
                  {t.noteConsultAdmin || "กรุณาสอบถามค่าบริการในการจัดส่งสินค้ากับทางแอดมินก่อนสั่งซื้อสินค้าทุกครั้ง"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

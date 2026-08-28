"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Calculator, 
  ArrowRightLeft, 
  X, 
  Sparkles, 
  Truck, 
  ShoppingBag, 
  TrendingUp, 
  ChevronRight,
  Package,
  RotateCcw
} from "lucide-react"
import { vibrateTap, vibrateSuccess } from "@/lib/haptics"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function QuickRmbCalculator() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [rate, setRate] = useState<number>(5.10)
  const [activeTab, setActiveTab] = useState<"convert" | "landed">("convert")

  // Tab 1: Simple Convert State
  const [rmbInput, setRmbInput] = useState<string>("100")
  const [direction, setDirection] = useState<"RMB_TO_THB" | "THB_TO_RMB">("RMB_TO_THB")

  // Tab 2: Landed Cost Estimator State
  const [itemPriceRmb, setItemPriceRmb] = useState<string>("50")
  const [quantity, setQuantity] = useState<number>(1)
  const [weightKg, setWeightKg] = useState<string>("1.5")
  const [shippingType, setShippingType] = useState<"ROAD" | "SEA">("ROAD")

  // Fetch live exchange rate from database
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "exchange_rate")
          .single()
        if (data?.value && !isNaN(Number(data.value))) {
          setRate(Number(data.value))
        }
      } catch (e) {
        console.warn("Failed to fetch exchange rate for calculator:", e)
      }
    }
    fetchRate()
  }, [])

  // Quick Chips
  const quickChips = [20, 50, 100, 200, 500, 1000, 2000]

  // Calculated values for Tab 1
  const numericInput = parseFloat(rmbInput) || 0
  const thbResult = direction === "RMB_TO_THB" ? numericInput * rate : numericInput / rate

  // Calculated values for Tab 2 (Landed Cost)
  const parsedPriceRmb = parseFloat(itemPriceRmb) || 0
  const totalProductRmb = parsedPriceRmb * quantity
  const totalProductThb = totalProductRmb * rate

  const parsedWeight = parseFloat(weightKg) || 0
  const shippingRatePerKg = shippingType === "ROAD" ? 39 : 29
  const estimatedFreightThb = parsedWeight * shippingRatePerKg
  const totalLandedCostThb = totalProductThb + estimatedFreightThb

  const handleOpen = () => {
    vibrateTap()
    setIsOpen(true)
  }

  const handleClose = () => {
    vibrateTap()
    setIsOpen(false)
  }

  const handleQuickChip = (val: number) => {
    vibrateTap()
    setRmbInput(val.toString())
  }

  const handleToggleDirection = () => {
    vibrateTap()
    setDirection(prev => prev === "RMB_TO_THB" ? "THB_TO_RMB" : "RMB_TO_THB")
  }

  const handleGoToInquiry = () => {
    vibrateSuccess()
    setIsOpen(false)
    router.push("/inquiry")
  }

  return (
    <>
      {/* 1. Floating Action Pill Button (Bottom-Left Corner to balance with LINE button on Bottom-Right) */}
      <div className="fixed bottom-20 md:bottom-6 left-4 sm:left-6 z-40">
        <button
          type="button"
          onClick={handleOpen}
          className="group flex items-center gap-2 bg-gradient-to-r from-primary to-blue-700 hover:from-blue-700 hover:to-primary text-white px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-full shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer border border-white/20 backdrop-blur-md"
          title="คำนวณเรทหยวนด่วน"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-amber-300 font-black text-xs group-hover:rotate-12 transition-transform">
            ¥
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-[10px] font-bold text-blue-100 uppercase leading-none">แปลงเรทหยวนวันนี้</p>
            <p className="text-xs font-black text-white leading-tight">1¥ = ฿{rate.toFixed(2)}</p>
          </div>
          <span className="sm:hidden text-xs font-black">แปลงเรท ¥</span>
        </button>
      </div>

      {/* 2. Modal & Mobile Bottom Sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={handleClose}
          />

          {/* Dialog Container */}
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200/80 z-10 overflow-hidden flex flex-col max-h-[90vh] animate-bottom-sheet sm:animate-in sm:zoom-in-95 duration-200">
            
            {/* Mobile Drag Indicator */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-br from-slate-900 via-primary to-blue-900 text-white shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 font-black shadow-inner">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-1.5">
                      <span>เครื่องคิดเลขแปลงเงินหยวน</span>
                    </h3>
                    <p className="text-xs text-blue-200 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                      <span>เรทปัจจุบัน: <strong>1 หยวน = ฿{rate.toFixed(2)} บาท</strong></span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tab Selector */}
              <div className="grid grid-cols-2 gap-1 bg-black/20 p-1 rounded-xl mt-4 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap()
                    setActiveTab("convert")
                  }}
                  className={`py-2 px-3 rounded-lg transition-all text-center cursor-pointer ${
                    activeTab === "convert" 
                      ? "bg-white text-slate-900 shadow-sm font-black" 
                      : "text-blue-200 hover:text-white"
                  }`}
                >
                  🔄 แปลงเรทเงินด่วน
                </button>
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap()
                    setActiveTab("landed")
                  }}
                  className={`py-2 px-3 rounded-lg transition-all text-center cursor-pointer ${
                    activeTab === "landed" 
                      ? "bg-white text-slate-900 shadow-sm font-black" 
                      : "text-blue-200 hover:text-white"
                  }`}
                >
                  📦 คำนวณต้นทุนถึงไทย
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-slate-800">
              {activeTab === "convert" ? (
                /* TAB 1: Simple Dual Converter */
                <div className="space-y-4">
                  {/* Currency Input Card */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase">
                        {direction === "RMB_TO_THB" ? "🇨🇳 จำนวนเงินหยวน (RMB ¥)" : "🇹🇭 จำนวนเงินบาท (THB ฿)"}
                      </span>
                      <button
                        type="button"
                        onClick={handleToggleDirection}
                        className="text-xs font-bold text-primary hover:text-blue-700 flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        <span>สลับสกุลเงิน</span>
                      </button>
                    </div>

                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-lg">
                        {direction === "RMB_TO_THB" ? "¥" : "฿"}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={rmbInput}
                        onChange={(e) => setRmbInput(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-9 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-xl font-black text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                    </div>

                    {/* Quick Chips */}
                    {direction === "RMB_TO_THB" && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {quickChips.map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => handleQuickChip(chip)}
                            className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                              rmbInput === chip.toString()
                                ? "bg-primary text-white shadow-xs"
                                : "bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200"
                            }`}
                          >
                            ¥{chip}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Result Display Box */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-200/70 rounded-2xl p-4 text-center">
                    <p className="text-xs font-bold text-blue-600 mb-1">
                      {direction === "RMB_TO_THB" ? "🇹🇭 คิดเป็นเงินไทยประมาณ" : "🇨🇳 คิดเป็นเงินหยวนประมาณ"}
                    </p>
                    <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                      {direction === "RMB_TO_THB" ? "฿" : "¥"}
                      {thbResult.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      *คำนวณจากเรทอัตราแลกเปลี่ยน ณ ปัจจุบัน (1¥ = ฿{rate.toFixed(2)}) ไม่มีค่าธรรมเนียมแอบแฝง
                    </p>
                  </div>
                </div>
              ) : (
                /* TAB 2: Landed Cost Estimator */
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Item Price in RMB */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        ราคาสินค้าต่อชิ้น (¥)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">¥</span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={itemPriceRmb}
                          onChange={(e) => setItemPriceRmb(e.target.value)}
                          className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        จำนวน (ชิ้น)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>

                  {/* Weight & Shipping Method */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        น้ำหนักรวม (กก.)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={weightKg}
                          onChange={(e) => setWeightKg(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-primary/30"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">kg</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        วิธีขนส่งจีน-ไทย
                      </label>
                      <select
                        value={shippingType}
                        onChange={(e) => setShippingType(e.target.value as "ROAD" | "SEA")}
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:bg-white"
                      >
                        <option value="ROAD">🚛 ทางรถ (39฿/kg)</option>
                        <option value="SEA">🚢 ทางเรือ (29฿/kg)</option>
                      </select>
                    </div>
                  </div>

                  {/* Cost Breakdown Summary Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>🛍️ ค่าสินค้า ({quantity} ชิ้น @ ¥{parsedPriceRmb})</span>
                      <span className="font-bold text-slate-900">฿{totalProductThb.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>🚚 ค่าส่งจีน-ไทย ({parsedWeight} kg @ {shippingRatePerKg}฿)</span>
                      <span className="font-bold text-slate-900">฿{estimatedFreightThb.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm">
                      <span className="font-black text-slate-900">💰 ยอดรวมถึงไทยโดยประมาณ:</span>
                      <span className="font-black text-primary text-base">฿{totalLandedCostThb.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Action */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={handleGoToInquiry}
                className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 text-sm transition-all active:scale-98 cursor-pointer"
              >
                <span>ส่งลิงก์สั่งซื้อสินค้านี้เลย</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}

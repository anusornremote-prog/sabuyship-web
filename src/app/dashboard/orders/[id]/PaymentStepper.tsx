'use client'

import { Package, Truck, Home } from "lucide-react"
import { PaymentSection } from "./PaymentSection"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface PaymentStepperProps {
  orderId: string
  status: string
  paymentRound1Status: string
  paymentRound2Status: string
  paymentRound3Status: string
  productCost: number
  shippingCostCnCn: number
  shippingCostCnTh: number
  shippingCostThTh: number
}

export function PaymentStepper({ 
  orderId,
  status, 
  paymentRound1Status, 
  paymentRound2Status, 
  paymentRound3Status,
  productCost,
  shippingCostCnCn,
  shippingCostCnTh,
  shippingCostThTh
}: PaymentStepperProps) {
  
  const supabase = createClient()
  const [shippingMethod, setShippingMethod] = useState<string>('')
  const [isUpdatingMethod, setIsUpdatingMethod] = useState(false)

  const formatCurrency = (amount: number) => {
    return `฿ ${Number(amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const handleUpdateShippingMethod = async (method: string) => {
    try {
      setIsUpdatingMethod(true)
      const { error } = await supabase
        .from("orders")
        .update({ shipping_company: method }) // Reusing this text column to store the method
        .eq("id", orderId)
      if (error) throw error
      setShippingMethod(method)
    } catch (e) {
      console.error(e)
    } finally {
      setIsUpdatingMethod(false)
    }
  }

  // Logic for steps
  const steps = [
    {
      round: 1,
      title: "รอบ 1: ค่าสินค้า + จีน-จีน",
      description: paymentRound1Status === 'PAID' ? "ชำระเงินแล้ว" : paymentRound1Status === 'UPLOADED' ? "รอแอดมินตรวจสอบ" : paymentRound1Status === 'REJECTED' ? "สลิปถูกปฏิเสธ (กรุณาแนบใหม่)" : "รอการชำระเงิน",
      amount: productCost + shippingCostCnCn,
      isCompleted: paymentRound1Status === 'PAID',
      isActive: paymentRound1Status !== 'PAID',
      status: paymentRound1Status,
      icon: Package
    },
    {
      round: 2,
      title: "รอบ 2: ค่าขนส่ง จีน-ไทย",
      description: status === 'SHIPPING' || status === 'THAILAND_WAREHOUSE' || status === 'ARRIVED' || status === 'OUT_FOR_DELIVERY' || status === 'DELIVERED'
        ? (paymentRound2Status === 'PAID' ? "ชำระเงินแล้ว" : paymentRound2Status === 'UPLOADED' ? "รอแอดมินตรวจสอบ" : paymentRound2Status === 'REJECTED' ? "สลิปถูกปฏิเสธ (กรุณาแนบใหม่)" : (shippingCostCnTh > 0 ? "รอการชำระเงิน" : "ยืนยันยอดการโอนรอสินค้าจัดส่งมาไทย"))
        : (paymentRound1Status === 'PAID' ? "ยืนยันยอดการโอนรอสินค้าจัดส่งมาไทย" : "รอสินค้าจัดส่งมาไทย"),
      amount: shippingCostCnTh,
      isCompleted: paymentRound2Status === 'PAID',
      isActive: paymentRound1Status === 'PAID' && paymentRound2Status !== 'PAID',
      status: paymentRound2Status,
      icon: Truck
    },
    {
      round: 3,
      title: "รอบ 3: ค่าจัดส่ง ไทย-ไทย",
      description: status === 'THAILAND_WAREHOUSE' || status === 'ARRIVED' || status === 'OUT_FOR_DELIVERY' || status === 'DELIVERED'
        ? (paymentRound3Status === 'PAID' ? "ชำระเงินแล้ว" : paymentRound3Status === 'UPLOADED' ? "รอแอดมินตรวจสอบ" : paymentRound3Status === 'REJECTED' ? "สลิปถูกปฏิเสธ (กรุณาแนบใหม่)" : (shippingCostThTh > 0 ? "รอการชำระเงิน" : "ยืนยันยอดการโอนรอสินค้าถึงโกดังไทย"))
        : (paymentRound2Status === 'PAID' ? "ยืนยันยอดการโอนรอสินค้าถึงโกดังไทย" : "รอสินค้าถึงโกดังไทย"),
      amount: shippingCostThTh,
      isCompleted: paymentRound3Status === 'PAID' || (status === 'DELIVERED' && shippingCostThTh === 0),
      isActive: paymentRound2Status === 'PAID' && paymentRound3Status !== 'PAID' && shippingCostThTh > 0,
      status: paymentRound3Status,
      icon: Home
    }
  ]

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
      <h3 className="text-lg font-bold text-slate-900 mb-6">สถานะการชำระเงิน (Payment Progress)</h3>
      <div className="relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0 hidden md:block" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={index} className="flex flex-row md:flex-col items-center gap-4 md:gap-3 text-left md:text-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-4 ${
                  step.isCompleted 
                    ? "bg-emerald-100 border-emerald-50 text-emerald-600" 
                    : step.status === 'REJECTED'
                      ? "bg-red-100 border-red-50 text-red-600"
                      : step.isActive 
                        ? "bg-blue-100 border-blue-50 text-blue-600" 
                        : "bg-slate-100 border-white text-slate-400"
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`font-bold ${step.isCompleted ? 'text-emerald-700' : step.status === 'REJECTED' ? 'text-red-700' : step.isActive ? 'text-blue-700' : 'text-slate-500'}`}>
                    {step.title}
                  </h4>
                  
                  {/* Display amount if it exists and step is active/completed OR if it's round 1 where we always know the amount */}
                  {(step.amount > 0 || step.round === 1) && (step.isActive || step.isCompleted) && (
                    <p className={`text-lg font-bold mt-1 mb-0.5 ${step.isCompleted ? 'text-emerald-600' : step.isActive ? 'text-blue-600' : 'text-slate-500'}`}>
                      {step.amount > 0 ? formatCurrency(step.amount) : "฿ 0.00"}
                    </p>
                  )}
                  
                  <p className={`text-sm mt-0.5 ${step.status === 'REJECTED' ? 'text-red-500 font-medium' : 'text-slate-500'}`}>{step.description}</p>
                  {/* Render Payment Button/Section if Active */}
                  {step.isActive && step.amount > 0 && (
                    <div className="mt-3 text-center md:text-left">
                      {step.round === 3 && paymentRound3Status !== 'PAID' && paymentRound3Status !== 'UPLOADED' && (
                        <div className="mb-3 text-sm">
                          <p className="font-semibold text-slate-800 mb-1">เลือกวิธีจัดส่ง:</p>
                          <select 
                            className="w-full text-sm p-1.5 rounded border border-slate-300 bg-white"
                            onChange={(e) => handleUpdateShippingMethod(e.target.value)}
                            value={shippingMethod}
                            disabled={isUpdatingMethod}
                          >
                            <option value="">-- กรุณาเลือกวิธีจัดส่ง --</option>
                            <option value="รับของเองที่โกดัง">รับของเองที่โกดัง (ไม่มีค่าจัดส่งเพิ่มเติม)</option>
                            <option value="จัดส่งแบบเหมาจ่าย">จัดส่งแบบเหมาจ่าย</option>
                            <option value="จัดส่งโดยขนส่งในประเทศ">จัดส่งโดยขนส่งในประเทศ</option>
                          </select>
                        </div>
                      )}
                      
                      {/* Only allow upload for Round 3 if a shipping method is selected, unless it's not Round 3 */}
                      {(step.round !== 3 || shippingMethod || step.amount === 0) && (
                        <PaymentSection 
                          orderId={orderId} 
                          paymentRound={step.round as 1 | 2 | 3} 
                          isRejected={step.status === 'REJECTED'} 
                        />
                      )}
                    </div>
                  )}</div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

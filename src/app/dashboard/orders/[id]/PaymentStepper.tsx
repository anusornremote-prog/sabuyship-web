'use client'

import { Package, Truck, Home } from "lucide-react"

interface PaymentStepperProps {
  status: string
  paymentRound1Status: string
  paymentRound2Status: string
  paymentRound3Status: string
  shippingCostCnTh: number
  shippingCostThTh: number
}

export function PaymentStepper({ 
  status, 
  paymentRound1Status, 
  paymentRound2Status, 
  paymentRound3Status,
  shippingCostCnTh,
  shippingCostThTh
}: PaymentStepperProps) {
  
  // Logic for steps
  const steps = [
    {
      title: "รอบ 1: ค่าสินค้า + จีน-จีน",
      description: paymentRound1Status === 'PAID' ? "ชำระเงินแล้ว" : "รอการชำระเงิน",
      isCompleted: paymentRound1Status === 'PAID',
      isActive: paymentRound1Status !== 'PAID',
      icon: Package
    },
    {
      title: "รอบ 2: ค่าขนส่ง จีน-ไทย",
      description: status === 'SHIPPING' || status === 'ARRIVED' || status === 'DELIVERED'
        ? (paymentRound2Status === 'PAID' ? "ชำระเงินแล้ว" : (shippingCostCnTh > 0 ? "รอการชำระเงิน" : "กำลังประเมินยอด"))
        : "รอสินค้าจัดส่งมาไทย",
      isCompleted: paymentRound2Status === 'PAID',
      isActive: paymentRound1Status === 'PAID' && paymentRound2Status !== 'PAID',
      icon: Truck
    },
    {
      title: "รอบ 3: ค่าจัดส่ง ไทย-ไทย",
      description: status === 'ARRIVED' || status === 'DELIVERED'
        ? (paymentRound3Status === 'PAID' ? "ชำระเงินแล้ว" : (shippingCostThTh > 0 ? "รอการชำระเงิน" : "รอสรุปยอด / รับเองที่โกดัง"))
        : "รอสินค้าถึงโกดังไทย",
      isCompleted: paymentRound3Status === 'PAID' || (status === 'DELIVERED' && shippingCostThTh === 0),
      isActive: paymentRound2Status === 'PAID' && paymentRound3Status !== 'PAID' && shippingCostThTh > 0,
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
                    : step.isActive 
                      ? "bg-blue-100 border-blue-50 text-blue-600" 
                      : "bg-slate-100 border-white text-slate-400"
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`font-bold ${step.isCompleted ? 'text-emerald-700' : step.isActive ? 'text-blue-700' : 'text-slate-500'}`}>
                    {step.title}
                  </h4>
                  <p className="text-sm text-slate-500 mt-0.5">{step.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

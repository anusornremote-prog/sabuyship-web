"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Link2, Calculator, FileText, CreditCard, ShoppingCart, Truck, PackageCheck } from "lucide-react"
import { useTranslation } from "@/components/providers/language-provider"

export default function HowItWorks() {
  const { t } = useTranslation()

  const steps = [
    {
      title: t.step1Title,
      description: t.step1Desc,
      icon: Link2,
    },
    {
      title: t.step2Title,
      description: t.step2Desc,
      icon: Calculator,
    },
    {
      title: t.step3Title,
      description: t.step3Desc,
      icon: FileText,
    },
    {
      title: t.step4Title,
      description: t.step4Desc,
      icon: CreditCard,
    },
    {
      title: t.step5Title,
      description: t.step5Desc,
      icon: ShoppingCart,
    },
    {
      title: t.step6Title,
      description: t.step6Desc,
      icon: Truck,
    },
    {
      title: t.step7Title,
      description: t.step7Desc,
      icon: PackageCheck,
    },
  ]

  return (
    <div className="py-20 px-4 md:px-8 bg-slate-50 min-h-screen">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">{t.howTitle}</h1>
          <p className="text-lg text-slate-600">
            {t.howSub}
          </p>
        </div>

        <div className="space-y-6">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <Card key={index} className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-6 p-6">
                  <div className="bg-blue-100 p-4 rounded-full text-primary shrink-0">
                    <Icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                    <p className="text-slate-600">{step.description}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

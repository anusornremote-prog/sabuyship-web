import Link from "next/link"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface OrderDetailErrorCardProps {
  backHref: string
  backLabel: string
  title?: string
  description?: string
}

export function OrderDetailErrorCard({
  backHref,
  backLabel,
  title = "ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้",
  description = "ระบบขัดข้องชั่วคราว ข้อมูลคำสั่งซื้อของคุณไม่ได้รับผลกระทบ กรุณากลับไปหน้ารายการแล้วลองใหม่อีกครั้ง",
}: OrderDetailErrorCardProps) {
  return (
    <div className="mx-auto my-8 max-w-lg rounded-2xl border border-rose-200 bg-rose-50/80 p-6 sm:p-8 text-center shadow-sm">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
        <AlertCircle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-black text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
      <div className="mt-5 flex justify-center">
        <Link href={backHref}>
          <Button variant="outline" className="min-h-11 gap-2 rounded-xl border-rose-200 bg-white font-bold text-slate-800 hover:bg-rose-50">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>{backLabel}</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}


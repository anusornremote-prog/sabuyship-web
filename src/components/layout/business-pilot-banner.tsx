import Link from "next/link"
import {
  canAcceptBusiness,
  hasLegalIdentity,
  isPreRegistrationPilotActive,
  publicBusinessConfig,
} from "@/lib/public-business-config"

export function BusinessPilotBanner() {
  if (publicBusinessConfig.commercialRegistrationNo) return null

  if (isPreRegistrationPilotActive && hasLegalIdentity) {
    return (
      <div className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-xs font-semibold leading-relaxed text-amber-950">
        ช่วงเริ่มดำเนินกิจการของผู้ประกอบการบุคคลธรรมดา เริ่มวันที่ {publicBusinessConfig.businessStartDate}
        {publicBusinessConfig.registrationCutoffDate && ` · ระบบกำหนดให้เพิ่มเลขทะเบียนภายในวันที่ ${publicBusinessConfig.registrationCutoffDate}`}
        {" · "}<Link href="/terms" className="underline">ข้อมูลผู้ให้บริการและเงื่อนไข</Link>
      </div>
    )
  }

  return (
    <div className="border-b border-slate-300 bg-slate-100 px-4 py-2 text-center text-xs font-semibold leading-relaxed text-slate-700">
      เว็บไซต์อยู่ระหว่างเตรียมเปิดบริการ {!canAcceptBusiness && "· ยังไม่รับคำสั่งซื้อใหม่"}
    </div>
  )
}

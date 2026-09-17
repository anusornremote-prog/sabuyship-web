import { hasLegalIdentity, publicBusinessConfig } from "@/lib/public-business-config"

export function BusinessStatusBanner() {
  if (publicBusinessConfig.demoMode) {
    return (
      <div className="border-b border-red-300 bg-red-50 px-4 py-2 text-center text-xs font-black leading-relaxed text-red-800">
        ระบบทดลองบน Staging/Preview เท่านั้น · ข้อมูลและบัญชีเป็นตัวอย่าง · ห้ามโอนเงินจริง
      </div>
    )
  }

  if (hasLegalIdentity) return null

  return (
    <div className="border-b border-slate-300 bg-slate-100 px-4 py-2 text-center text-xs font-semibold leading-relaxed text-slate-700">
      เว็บไซต์อยู่ระหว่างเตรียมเปิดบริการ · ยังไม่รับคำสั่งซื้อใหม่
    </div>
  )
}

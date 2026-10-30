"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface AdminNotificationHeaderProps {
  isConfigured: boolean
}

export function AdminNotificationHeader({ isConfigured }: AdminNotificationHeaderProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleTest = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/notifications/test", {
        method: "POST",
      })
      const data = await res.json()

      if (res.ok && data.success) {
        toast.success("ส่งข้อความทดสอบเข้า LINE สำเร็จ!", {
          description: "กรุณาเปิดแอป LINE เช็คการแจ้งเตือนจาก Sabuy Ship Express",
        })
        router.refresh()
      } else {
        toast.error("ส่งข้อความไม่สำเร็จ", {
          description: data.error || "เกิดข้อผิดพลาดในการส่งข้อความ",
        })
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-xl md:text-2xl font-black text-slate-900">
            ระบบแจ้งเตือนแอดมิน (LINE Notification)
          </h1>
          {isConfigured ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> พร้อมใช้งาน
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <AlertCircle className="w-3.5 h-3.5" /> ยังไม่ตั้งค่า Token
            </span>
          )}
        </div>
        <p className="text-xs md:text-sm text-slate-500">
          แจ้งเตือนอัตโนมัติเมื่อมี: รายการขอใบเสนอราคาใหม่, ลูกค้าแนบสลิปชำระเงิน, หรือข้อความจากหน้าเว็บ
        </p>
      </div>

      <Button
        onClick={handleTest}
        disabled={loading}
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shrink-0 shadow-sm cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            กำลังส่งข้อความ...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            ทดสอบส่งแจ้งเตือน LINE
          </>
        )}
      </Button>
    </div>
  )
}

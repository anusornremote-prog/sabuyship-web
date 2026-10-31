"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Mail, CheckCircle2, AlertTriangle } from "lucide-react"

function getFriendlyForgotPasswordError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes("rate limit") || lower.includes("60 seconds") || lower.includes("once every")) {
    return "คุณขอลิงก์กู้คืนรหัสผ่านบ่อยเกินไป กรุณารอสักครู่ (ประมาณ 1-2 นาที) แล้วลองใหม่อีกครั้ง"
  }
  if (lower.includes("invalid") && lower.includes("email")) {
    return "รูปแบบอีเมลไม่ถูกต้อง กรุณาตรวจสอบอีเมลอีกครั้ง"
  }
  return "ไม่สามารถส่งลิงก์กู้คืนรหัสผ่านได้ในขณะนี้ กรุณาตรวจสอบอีเมลหรือลองใหม่อีกครั้ง"
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      if (params.get("error") === "ResetLinkExpired") {
        setError("ลิงก์ตั้งรหัสผ่านใหม่หมดอายุ หรือถูกเปิดจากคนละเบราว์เซอร์ กรุณากรอกอีเมลเพื่อขอลิงก์ใหม่อีกครั้ง (และเปิดลิงก์ในเบราว์เซอร์เดียวกัน)")
      }
    }
  }, [])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const cleanEmail = email.trim()
    if (!cleanEmail) {
      setError("กรุณากรอกอีเมลของคุณ")
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
    })

    if (error) {
      setError(getFriendlyForgotPasswordError(error.message))
      setLoading(false)
      return
    }

    setMessage("ระบบได้ส่งลิงก์กู้คืนรหัสผ่านไปยังอีเมลของคุณเรียบร้อยแล้ว! กรุณาตรวจสอบกล่องจดหมาย (Inbox) หรือจดหมายขยะ (Spam/Junk)")
    setLoading(false)
  }

  return (
    <Card className="w-full max-w-md shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
      <CardHeader className="space-y-2 pb-4">
        <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-1">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl text-center font-bold">ลืมรหัสผ่าน</CardTitle>
      </CardHeader>
      <CardContent>
        {message ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-700">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>ส่งลิงก์กู้คืนรหัสผ่านสำเร็จ</span>
              </div>
              <p className="leading-relaxed text-xs sm:text-sm">{message}</p>
              <p className="text-xs text-emerald-700/90 font-medium pt-1 border-t border-emerald-200/60">
                💡 แนะนำ: กรุณากดเปิดลิงก์จากอีเมลบนเบราว์เซอร์เดียวกับที่คุณกดขอลิงก์นี้
              </p>
            </div>
            <Link href="/login" className="block">
              <Button className="w-full h-11 cursor-pointer font-bold">
                กลับไปหน้าเข้าสู่ระบบ
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <p className="text-sm text-slate-500 text-center mb-4 leading-relaxed">
              กรอกอีเมลของคุณที่ใช้สมัครสมาชิก ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้ทางอีเมล
            </p>
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium rounded-xl flex items-start gap-2 leading-relaxed">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{error}</span>
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="reset-email" className="text-sm font-semibold text-slate-700">อีเมลของคุณ *</label>
              <Input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="h-11"
              />
            </div>
            <Button type="submit" className="w-full h-11 cursor-pointer font-bold" disabled={loading}>
              {loading ? "กำลังส่งลิงก์กู้คืนรหัสผ่าน..." : "ส่งลิงก์กู้คืนรหัสผ่าน"}
            </Button>
          </form>
        )}
      </CardContent>
      {!message && (
        <CardFooter className="flex justify-center border-t pt-4">
          <Link href="/login" className="text-sm text-primary font-semibold hover:underline">
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </CardFooter>
      )}
    </Card>
  )
}

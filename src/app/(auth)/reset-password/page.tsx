"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { type EmailOtpType } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, LockKeyhole, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react"

function getFriendlyResetPasswordError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes("different from the old password") || lower.includes("same_password")) {
    return "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม กรุณาตั้งรหัสผ่านใหม่"
  }
  if (lower.includes("at least 6") || lower.includes("weak_password")) {
    return "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร"
  }
  if (lower.includes("expired") || lower.includes("invalid") || lower.includes("session")) {
    return "ลิงก์ตั้งรหัสผ่านใหม่หมดอายุหรือไม่ถูกต้อง กรุณาขอลิงก์กู้คืนรหัสผ่านใหม่อีกครั้ง"
  }
  return "ไม่สามารถเปลี่ยนรหัสผ่านได้ กรุณาลองใหม่อีกครั้ง หรือขอลิงก์กู้คืนรหัสผ่านใหม่"
}

export default function ResetPassword() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifyingSession, setVerifyingSession] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [linkExpired, setLinkExpired] = useState(false)
  const [sessionLoaded, setSessionLoaded] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    let cancelled = false

    const verifyRecoverySession = async () => {
      try {
        if (typeof window !== "undefined") {
          const searchParams = new URLSearchParams(window.location.search)
          const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""))

          const urlError = searchParams.get("error") || hashParams.get("error")
          const errorCode = searchParams.get("error_code") || hashParams.get("error_code")
          if (urlError || errorCode) {
            if (!cancelled) {
              setLinkExpired(true)
              setError("ลิงก์ตั้งรหัสผ่านใหม่หมดอายุหรือถูกใช้งานไปแล้ว กรุณาขอลิงก์กู้คืนรหัสผ่านใหม่อีกครั้ง")
              setVerifyingSession(false)
            }
            return
          }

          // 1. Check if hash has access_token & refresh_token (implicit flow)
          const accessToken = hashParams.get("access_token")
          const refreshToken = hashParams.get("refresh_token")
          if (accessToken && refreshToken) {
            const { data, error: sessionErr } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
            if (!sessionErr && data.session && !cancelled) {
              setSessionLoaded(true)
              setVerifyingSession(false)
              return
            }
          }

          // 2. Check if query has token_hash & type (OTP recovery flow)
          const tokenHash = searchParams.get("token_hash")
          const type = (searchParams.get("type") as EmailOtpType | null) || "recovery"
          if (tokenHash) {
            const { data, error: otpErr } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type,
            })
            if (!otpErr && data.session && !cancelled) {
              setSessionLoaded(true)
              setVerifyingSession(false)
              return
            }
          }

          // 3. Check if query has PKCE code directly on /reset-password
          const code = searchParams.get("code")
          if (code) {
            const { data, error: codeErr } = await supabase.auth.exchangeCodeForSession(code)
            if (!codeErr && data.session && !cancelled) {
              setSessionLoaded(true)
              setVerifyingSession(false)
              return
            }
          }
        }

        // 4. Check existing session (already exchanged via /api/auth/callback)
        const { data: { session } } = await supabase.auth.getSession()
        if (!cancelled) {
          if (session) {
            setSessionLoaded(true)
          }
          setVerifyingSession(false)
        }
      } catch (err) {
        console.error("Error verifying recovery session:", err)
        if (!cancelled) setVerifyingSession(false)
      }
    }

    verifyRecoverySession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !cancelled) {
        setSessionLoaded(true)
        setLinkExpired(false)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (password.length < 6) {
      setError("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร")
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง")
      setLoading(false)
      return
    }

    if (!sessionLoaded) {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        setLinkExpired(true)
        setError("ไม่พบเซสชันสำหรับตั้งรหัสผ่านใหม่ (ลิงก์อาจหมดอายุหรือเปิดคนละเบราว์เซอร์) กรุณาขอลิงก์จากอีเมลใหม่อีกครั้ง")
        setLoading(false)
        return
      }
    }

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      setError(getFriendlyResetPasswordError(error.message))
      setLoading(false)
      return
    }

    setMessage("เปลี่ยนรหัสผ่านใหม่สำเร็จเรียบร้อยแล้ว!")
    setLoading(false)
    
    setTimeout(() => {
      router.push("/dashboard")
      router.refresh()
    }, 2500)
  }

  return (
    <Card className="w-full max-w-md shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
      <CardHeader className="space-y-2 pb-4">
        <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
          <LockKeyhole className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl text-center font-bold text-slate-900">ตั้งรหัสผ่านใหม่</CardTitle>
      </CardHeader>
      <CardContent>
        {verifyingSession ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-sm font-medium">กำลังตรวจสอบลิงก์กู้คืนรหัสผ่าน...</p>
          </div>
        ) : message ? (
          <div className="space-y-5 text-center py-4">
            <div className="mx-auto bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="text-lg font-bold text-emerald-700">
              {message}
            </div>
            <p className="text-sm text-slate-500">
              ระบบกำลังพาคุณเข้าสู่หน้าจัดการบัญชี...
            </p>
            <Button className="w-full h-11 mt-2 cursor-pointer font-bold" onClick={() => router.push("/dashboard")}>
              เข้าสู่ระบบจัดการบัญชีทันที
            </Button>
          </div>
        ) : linkExpired ? (
          <div className="space-y-4 text-center py-2">
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium rounded-xl flex flex-col items-center gap-2 leading-relaxed">
              <AlertTriangle className="h-6 w-6 text-rose-600" />
              <span>{error || "ลิงก์ตั้งรหัสผ่านใหม่หมดอายุหรือไม่ถูกต้อง"}</span>
            </div>
            <Link href="/forgot-password" className="block">
              <Button variant="orange" className="w-full h-11 font-bold cursor-pointer">
                ขอลิงก์กู้คืนรหัสผ่านใหม่
              </Button>
            </Link>
            <Link href="/login" className="block text-sm text-primary font-semibold hover:underline pt-1">
              กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <p className="text-sm text-slate-500 text-center mb-2">
              กรุณากรอกรหัสผ่านใหม่ของคุณที่มีความยาวอย่างน้อย 6 ตัวอักษร
            </p>
            
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium rounded-xl flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">รหัสผ่านใหม่ *</label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="รหัสผ่านอย่างน้อย 6 ตัวอักษร" 
                    className="pr-10 h-11"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">ยืนยันรหัสผ่านใหม่ *</label>
                <Input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง" 
                  className="h-11"
                />
              </div>
            </div>

            <Button type="submit" variant="orange" className="w-full h-11 font-bold cursor-pointer mt-2" disabled={loading}>
              {loading ? "กำลังบันทึกรหัสผ่าน..." : "ยืนยันการเปลี่ยนรหัสผ่าน"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

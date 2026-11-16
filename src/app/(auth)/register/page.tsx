"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Script from "next/script"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff } from "lucide-react"
import { LineIcon } from "@/components/ui/icons"
import { InAppBrowserNotice } from "@/components/auth/InAppBrowserNotice"
import { canAcceptBusiness } from "@/lib/public-business-config"
import { renderGoogleGsiButton } from "@/lib/google-gsi"
import { startLineOAuth } from "@/lib/line-oauth"

export default function Register() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [phone, setPhone] = useState("")
  const [lineId, setLineId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const googleButtonRef = useRef<HTMLDivElement>(null)
  const googleCleanupRef = useRef<(() => void) | undefined>(undefined)

  const initGoogleLogin = () => {
    googleCleanupRef.current?.()
    googleCleanupRef.current = renderGoogleGsiButton({
      container: googleButtonRef.current,
      callback: handleGoogleCallback,
      text: "signup_with",
    })
  }

  useEffect(() => {
    if (privacyAcknowledged) initGoogleLogin()
    return () => {
      googleCleanupRef.current?.()
    }
  }, [privacyAcknowledged])

  useEffect(() => {
    initGoogleLogin()
    return () => {
      googleCleanupRef.current?.()
    }
  }, [])

  const handleGoogleCallback = async (response: any) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      })
      
      if (error) throw error

      if (data?.user) {
        // Auto-create profile if missing
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, role, phone')
          .eq('id', data.user.id)
          .maybeSingle()

        let finalRole = profile?.role || "CUSTOMER"

        if (!profile) {
          const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase()
          const customerCode = `SB${randomChars}`
          
          await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Google User',
            role: 'CUSTOMER',
            customer_code: customerCode
          })

          router.push("/dashboard")
          return
        }

        if (!profile.phone || profile.phone.trim().length < 9) {
          router.push("/dashboard")
          return
        }

        if (finalRole === "ADMIN") {
          router.push("/admin")
        } else {
          router.push("/dashboard")
        }
      }
    } catch (err: any) {
      let errMessage = err?.message
      if (typeof err === 'object' && Object.keys(err).length === 0 || errMessage === '{}') {
        errMessage = "เกิดข้อผิดพลาดจากฐานข้อมูล (Database Trigger Failed) กรุณารัน SQL Script ตามที่ระบบแนะนำ"
      }
      setError(errMessage || "เกิดข้อผิดพลาดในการสมัครสมาชิกด้วย Google")
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const cleanPhone = phone.replace(/\D/g, '')
    if (!cleanPhone || cleanPhone.length < 9 || cleanPhone.length > 10) {
      setError("กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง (9-10 หลัก เช่น 0812345678)")
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard`,
        data: {
          full_name: fullName,
          phone: cleanPhone,
          line_id: lineId,
        },
      },
    })

    if (error) {
      let errMessage = error.message
      if (typeof error === 'object' && Object.keys(error).length === 0 || error.message === '{}') {
        errMessage = "เกิดข้อผิดพลาดจากฐานข้อมูล (Database Trigger Failed) กรุณาแจ้งแอดมิน"
      }
      setError(errMessage || "เกิดข้อผิดพลาดในการสมัครสมาชิก")
      setLoading(false)
      return
    }

    if (!data.session) {
      setSuccess("สมัครสมาชิกสำเร็จ กรุณาตรวจสอบอีเมลและกดลิงก์ยืนยันก่อนเข้าสู่ระบบ")
      setLoading(false)
      return
    }

    router.push("/dashboard")
  }

  const handleLineRegister = async () => {
    setLoading(true)
    setError(null)
    const { redirectedExternally, errorMessage } = await startLineOAuth(supabase)
    if (redirectedExternally) return
    if (errorMessage) {
      setError(errorMessage)
      setLoading(false)
    }
  }

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" onLoad={initGoogleLogin} />
      <Card className="w-full max-w-md shadow-xl shadow-slate-200/50 border-slate-200/70 bg-white/95 backdrop-blur-sm relative">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold text-center">สมัครสมาชิก</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
          {error && <div role="alert" className="p-3 bg-destructive/10 text-destructive text-sm rounded-xl">{error}</div>}
          {success && <div role="status" className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-xl">{success}</div>}
          <div className="space-y-2">
            <label htmlFor="register-fullname" className="text-sm font-medium text-slate-700">ชื่อ - นามสกุล *</label>
            <Input 
              id="register-fullname"
              name="fullName"
              type="text" 
              autoComplete="name"
              required 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="ชื่อของคุณ" 
              className="h-11 rounded-xl bg-white"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="register-phone" className="text-sm font-medium text-slate-700">เบอร์โทรศัพท์ *</label>
            <Input 
              id="register-phone"
              name="phone"
              type="tel" 
              autoComplete="tel"
              required 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="เช่น 0812345678" 
              className="h-11 rounded-xl bg-white"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="register-line" className="text-sm font-medium text-slate-700">LINE ID / WeChat ID (ไม่บังคับ)</label>
            <Input 
              id="register-line"
              name="lineId"
              type="text" 
              value={lineId}
              onChange={(e) => setLineId(e.target.value)}
              placeholder="เช่น line_id_123" 
              className="h-11 rounded-xl bg-white"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="register-email" className="text-sm font-medium text-slate-700">อีเมล *</label>
            <Input 
              id="register-email"
              name="email"
              type="email" 
              autoComplete="email"
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com" 
              className="h-11 rounded-xl bg-white"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="register-password" className="text-sm font-medium text-slate-700">รหัสผ่าน *</label>
            <div className="relative">
              <Input 
                id="register-password"
                name="password"
                type={showPassword ? "text" : "password"} 
                autoComplete="new-password"
                minLength={6}
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                className="h-11 rounded-xl bg-white pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                aria-pressed={showPassword}
                className="absolute right-0 top-0 flex h-full min-w-11 items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          </div>
          <div className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
            <input
              id="register-privacy"
              type="checkbox"
              required
              checked={privacyAcknowledged}
              onChange={(event) => setPrivacyAcknowledged(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600 cursor-pointer"
            />
            <div>
              <label htmlFor="register-privacy" className="cursor-pointer">
                ฉันรับทราบ
              </label>{" "}
              <Link href="/privacy" target="_blank" className="font-bold text-primary underline">
                ประกาศความเป็นส่วนตัว
              </Link>{" "}
              <label htmlFor="register-privacy" className="cursor-pointer">
                สำหรับการสร้างบัญชีและให้บริการ
              </label>
            </div>
          </div>
          {!canAcceptBusiness && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs font-bold text-amber-950">ยังไม่เปิดสมัครสมาชิกจริงจนกว่าจะตั้งค่าข้อมูลผู้ประกอบการและช่วงดำเนินกิจการครบ</p>}
          <Button type="submit" className="w-full h-11 rounded-full cursor-pointer font-semibold tracking-wide" disabled={loading || !privacyAcknowledged || !canAcceptBusiness}>
            {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">หรือ</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 w-full">
            <InAppBrowserNotice />
            <Button 
              type="button" 
              variant="outline" 
              className="w-full min-h-11 h-11 bg-[#06C755] hover:bg-[#05b34c] text-white hover:text-white border-transparent font-semibold tracking-wide cursor-pointer shadow-xs flex items-center justify-center gap-2.5 rounded-full text-sm transition-all"
              onClick={handleLineRegister}
              disabled={loading || !privacyAcknowledged || !canAcceptBusiness}
            >
              <LineIcon className="w-5 h-5 text-white" />
              <span>สมัครสมาชิกด้วย LINE</span>
            </Button>
            {privacyAcknowledged && canAcceptBusiness ? (
              <div className="w-full flex justify-center min-h-[44px]" ref={googleButtonRef}></div>
            ) : (
              <div className="flex h-11 items-center justify-center rounded-full border bg-slate-100 text-sm font-semibold text-slate-500">กรุณารับทราบประกาศก่อนสมัครด้วย Google</div>
            )}
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <div className="text-sm text-slate-600">
          มีบัญชีอยู่แล้วใช่ไหม?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            เข้าสู่ระบบ
          </Link>
        </div>
      </CardFooter>
    </Card>
    </>
  )
}

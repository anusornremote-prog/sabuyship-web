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
import { getFriendlyAuthErrorMessage } from "@/lib/auth-errors"
import { renderGoogleGsiButton } from "@/lib/google-gsi"
import { startLineOAuth } from "@/lib/line-oauth"

export default function Login() {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const googleButtonRef = useRef<HTMLDivElement>(null)
  const googleCleanupRef = useRef<(() => void) | undefined>(undefined)

  const initGoogleLogin = () => {
    googleCleanupRef.current?.()
    googleCleanupRef.current = renderGoogleGsiButton({
      container: googleButtonRef.current,
      callback: handleGoogleCallback,
      text: "signin_with",
    })
  }

  useEffect(() => {
    initGoogleLogin()

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const urlError = params.get("error")
      const reason = params.get("reason")

      if (reason === "admin-session-expired") {
        setError("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง")
      } else if (urlError) {
        setError(getFriendlyAuthErrorMessage(urlError))
      }

      try {
        const savedRemember = localStorage.getItem("sabuy_remember_me")
        const shouldRemember = savedRemember !== "false"
        setRemember(shouldRemember)

        if (shouldRemember) {
          const saved = localStorage.getItem("sabuy_remember_identifier") || localStorage.getItem("sabuy_last_email")
          if (saved) {
            setIdentifier(saved)
          }
        }
      } catch (e) {
        // LocalStorage disabled or unavailable
      }
    }

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
            full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Member',
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
      setError(getFriendlyAuthErrorMessage(errMessage || "เกิดข้อผิดพลาดในการล็อกอินด้วย Google"))
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (remember) {
        localStorage.setItem("sabuy_remember_identifier", identifier.trim())
        localStorage.setItem("sabuy_last_email", identifier.trim())
        localStorage.setItem("sabuy_remember_me", "true")
      } else {
        localStorage.removeItem("sabuy_remember_identifier")
        localStorage.removeItem("sabuy_last_email")
        localStorage.setItem("sabuy_remember_me", "false")
      }
    } catch (e) {
      // Ignore storage errors
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: identifier.trim(),
      password,
    })

    if (error) {
      setError(getFriendlyAuthErrorMessage(error.message))
      setLoading(false)
      return
    }

    // Check user role to redirect
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single()

    if (profile?.role === "ADMIN") {
      router.push("/admin")
    } else {
      router.push("/dashboard")
    }
  }

  const handleLineLogin = async () => {
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
        <CardTitle className="text-2xl font-bold text-center">เข้าสู่ระบบ</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && <div role="alert" className="p-3 bg-destructive/10 text-destructive text-sm rounded-xl">{error}</div>}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">อีเมล *</label>
            <Input 
              id="email"
              type="email"
              name="email"
              autoComplete="email username"
              required 
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value)
                try {
                  if (remember) {
                    localStorage.setItem("sabuy_remember_identifier", e.target.value.trim())
                    localStorage.setItem("sabuy_last_email", e.target.value.trim())
                  }
                } catch {}
              }}
              placeholder="เช่น user@email.com"
              className="h-11 rounded-xl bg-white"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">รหัสผ่าน *</label>
              <Link href="/forgot-password" className="inline-flex min-h-9 items-center text-sm font-medium text-primary hover:underline">
                ลืมรหัสผ่าน?
              </Link>
            </div>
            <div className="relative">
              <Input 
                id="password"
                type={showPassword ? "text" : "password"} 
                name="password"
                autoComplete="current-password"
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="remember" 
              name="remember"
              checked={remember}
              onChange={(e) => {
                const checked = e.target.checked
                setRemember(checked)
                try {
                  localStorage.setItem("sabuy_remember_me", checked ? "true" : "false")
                  if (checked && identifier.trim()) {
                    localStorage.setItem("sabuy_remember_identifier", identifier.trim())
                    localStorage.setItem("sabuy_last_email", identifier.trim())
                  } else if (!checked) {
                    localStorage.removeItem("sabuy_remember_identifier")
                    localStorage.removeItem("sabuy_last_email")
                  }
                } catch {}
              }}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
            />
            <label htmlFor="remember" className="text-sm text-slate-600 cursor-pointer">
              จำอีเมล
            </label>
          </div>
          <Button type="submit" className="w-full h-11 rounded-full cursor-pointer font-semibold tracking-wide" disabled={loading}>
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
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
              onClick={handleLineLogin}
              disabled={loading}
            >
              <LineIcon className="w-5 h-5 text-white" />
              <span>เข้าสู่ระบบด้วย LINE</span>
            </Button>
            <div className="w-full flex justify-center min-h-[44px]" ref={googleButtonRef}></div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <div className="text-sm text-slate-600">
          ยังไม่มีบัญชีใช่ไหม?{" "}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            สมัครสมาชิก
          </Link>
        </div>
      </CardFooter>
    </Card>
    </>
  )
}

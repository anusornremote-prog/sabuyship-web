"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Script from "next/script"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function Login() {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const googleButtonRef = useRef<HTMLDivElement>(null)

  const initGoogleLogin = () => {
    if (typeof window !== "undefined" && (window as any).google && googleButtonRef.current) {
      (window as any).google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "449039415658-57snl0en8sa78c0pp0l2ttc9ld54q89d.apps.googleusercontent.com",
        callback: handleGoogleCallback,
      });
      (window as any).google.accounts.id.renderButton(
        googleButtonRef.current,
        { theme: "outline", size: "large", text: "signin_with", shape: "rectangular" }
      );
    }
  }

  useEffect(() => {
    initGoogleLogin();
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
          .select('id, role')
          .eq('id', data.user.id)
          .single()

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
      setError(errMessage || "เกิดข้อผิดพลาดในการล็อกอินด้วย Google")
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Pass identifier as email parameter so mock client or supabase standard auth receives it.
    // In our mock client, we updated u.email === email || u.phone === email
    const { data, error } = await supabase.auth.signInWithPassword({
      email: identifier,
      password,
    })

    if (error) {
      if (error.message === "Invalid login credentials") {
        setError("อีเมล หรือ รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง")
      } else {
        setError(error.message)
      }
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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'custom:line' as any,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard`,
        queryParams: {
          bot_prompt: 'aggressive'
        }
      }
    })
    
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" onLoad={initGoogleLogin} />
      <Card className="w-full max-w-md shadow-xl shadow-slate-200/50 border-slate-200/60 bg-white/95 backdrop-blur-sm relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">เข้าสู่ระบบ</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">{error}</div>}
          <div className="space-y-2">
            <label className="text-sm font-medium">อีเมล หรือ เบอร์โทรศัพท์ *</label>
            <Input 
              type="text" 
              name="email"
              autoComplete="username"
              required 
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="เช่น user@email.com หรือ 0812345678" 
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">รหัสผ่าน *</label>
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                ลืมรหัสผ่าน?
              </Link>
            </div>
            <Input 
              type="password" 
              name="password"
              autoComplete="current-password"
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="remember" 
              name="remember"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
            />
            <label htmlFor="remember" className="text-sm text-slate-600 cursor-pointer">
              จำรหัสผ่านในระบบ
            </label>
          </div>
          <Button type="submit" className="w-full h-11" disabled={loading}>
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

          <div className="flex flex-col gap-3 w-full">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full h-11 bg-[#06C755] hover:bg-[#05b34c] text-white hover:text-white border-transparent"
              onClick={handleLineLogin}
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.122.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967 1.739-1.907 2.572-3.843 2.572-5.992z"/>
              </svg>
              เข้าสู่ระบบด้วย LINE
            </Button>
            <div className="flex justify-center w-full" ref={googleButtonRef}></div>
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

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
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
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
            full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Google User',
            role: 'CUSTOMER',
            customer_code: customerCode,
            is_active: true
          })
        }

        if (finalRole === "ADMIN") {
          router.push("/admin")
        } else {
          router.push("/dashboard")
        }
      }
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการล็อกอินด้วย Google")
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
      setError(error.message)
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

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" onLoad={initGoogleLogin} />
      <Card className="w-full max-w-md shadow-lg">
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

          <div className="flex justify-center w-full" ref={googleButtonRef}></div>
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

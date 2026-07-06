"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Script from "next/script"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function Register() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [lineId, setLineId] = useState("")
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
        { theme: "outline", size: "large", text: "signup_with", shape: "rectangular" }
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
      setError(err.message || "เกิดข้อผิดพลาดในการสมัครสมาชิกด้วย Google")
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
          line_id: lineId,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push("/dashboard")
  }

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" onLoad={initGoogleLogin} />
      <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">สมัครสมาชิก</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
          {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">{error}</div>}
          <div className="space-y-2">
            <label className="text-sm font-medium">ชื่อ - นามสกุล *</label>
            <Input 
              type="text" 
              required 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="ชื่อของคุณ" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">เบอร์โทรศัพท์ *</label>
            <Input 
              type="tel" 
              required 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="เช่น 0812345678" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">LINE ID / WeChat ID (ไม่บังคับ)</label>
            <Input 
              type="text" 
              value={lineId}
              onChange={(e) => setLineId(e.target.value)}
              placeholder="เช่น line_id_123" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">อีเมล *</label>
            <Input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">รหัสผ่าน *</label>
            <Input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="อย่างน้อย 6 ตัวอักษร"
            />
          </div>
          <Button type="submit" className="w-full h-11" disabled={loading}>
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

          <div className="flex justify-center w-full" ref={googleButtonRef}></div>
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

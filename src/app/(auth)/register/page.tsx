"use client"

import { useState } from "react"
import Link from "next/link"
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

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
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

          <Button 
            type="button" 
            variant="outline" 
            className="w-full h-11 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 cursor-pointer" 
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            ลงทะเบียนด้วย Google
          </Button>
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
  )
}

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

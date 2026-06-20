"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    // resetPasswordForEmail call
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setMessage("ระบบได้ส่งลิงก์กู้คืนรหัสผ่านไปยังอีเมลของคุณเรียบร้อยแล้ว! (กรุณาเช็คกล่องจดหมายของคุณ)")
    setLoading(false)
  }

  return (
    <Card className="w-full max-w-md shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">ลืมรหัสผ่าน</CardTitle>
      </CardHeader>
      <CardContent>
        {message ? (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-150 text-green-700 text-sm rounded-md">
              {message}
            </div>
            <Link href="/login">
              <Button className="w-full h-11">
                กลับไปหน้าเข้าสู่ระบบ
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <p className="text-sm text-slate-500 text-center mb-4">
              กรอกอีเมลของคุณที่ใช้สมัครสมาชิก ระบบจะส่งลิงก์เพื่อกู้คืนรหัสผ่านไปให้
            </p>
            {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">{error}</div>}
            <div className="space-y-2">
              <label className="text-sm font-medium">อีเมล</label>
              <Input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com" 
              />
            </div>
            <Button type="submit" className="w-full h-11 cursor-pointer" disabled={loading}>
              {loading ? "กำลังส่งข้อมูล..." : "ส่งลิงก์กู้คืนรหัสผ่าน"}
            </Button>
          </form>
        )}
      </CardContent>
      {!message && (
        <CardFooter className="flex justify-center">
          <Link href="/login" className="text-sm text-primary font-semibold hover:underline">
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </CardFooter>
      )}
    </Card>
  )
}

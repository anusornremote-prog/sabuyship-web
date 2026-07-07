"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, LockKeyhole, CheckCircle2 } from "lucide-react"

export default function ResetPassword() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

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
      setError("รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง")
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setMessage("เปลี่ยนรหัสผ่านสำเร็จแล้ว!")
    setLoading(false)
    
    // Redirect to login after 3 seconds
    setTimeout(() => {
      router.push("/login")
    }, 3000)
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
        {message ? (
          <div className="space-y-6 text-center py-4">
            <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-lg font-bold text-green-700">
              {message}
            </div>
            <p className="text-sm text-slate-500">
              ระบบกำลังพากลับไปยังหน้าเข้าสู่ระบบ...
            </p>
            <Button className="w-full h-11 mt-4 cursor-pointer" onClick={() => router.push("/login")}>
              กลับไปเข้าสู่ระบบทันที
            </Button>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <p className="text-sm text-slate-500 text-center mb-2">
              กรุณากรอกรหัสผ่านใหม่ของคุณที่มีความยาวอย่างน้อย 6 ตัวอักษร
            </p>
            
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium rounded-lg">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">รหัสผ่านใหม่</label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="รหัสผ่านอย่างน้อย 6 ตัวอักษร" 
                    className="pr-10"
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
                <label className="text-sm font-semibold text-slate-700">ยืนยันรหัสผ่านใหม่</label>
                <Input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง" 
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

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function CompleteProfile() {
  const [phone, setPhone] = useState("")
  const [lineId, setLineId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!phone) {
      setError("กรุณากรอกเบอร์โทรศัพท์")
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setError("ไม่พบข้อมูลผู้ใช้งาน กรุณาล็อกอินใหม่")
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        phone: phone,
        line_id: lineId
      })
      .eq('id', user.id)

    if (updateError) {
      setError(updateError.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล")
      setLoading(false)
      return
    }

    // Force a router refresh to re-evaluate middleware, then go to dashboard
    router.refresh()
    router.push("/dashboard")
  }

  return (
    <Card className="w-full max-w-md shadow-lg mx-auto mt-10">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">กรอกข้อมูลเพิ่มเติม</CardTitle>
        <p className="text-sm text-center text-slate-500 mt-2">
          เพื่อให้ระบบขนส่งสินค้าสามารถทำงานได้สมบูรณ์ กรุณากรอกเบอร์โทรศัพท์เพื่อใช้ในการติดต่อรับส่งสินค้า
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCompleteProfile} className="space-y-4">
          {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">{error}</div>}
          
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
          
          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

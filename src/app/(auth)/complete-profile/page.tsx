"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { isValidThaiPhone, normalizeThaiPhone } from "@/lib/phone"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function CompleteProfile() {
  const [phone, setPhone] = useState("")
  const [fullName, setFullName] = useState("")
  const [lineId, setLineId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  // Fetch existing profile data to pre-fill the name if it's not a LINE UID
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
        if (data && data.full_name) {
          // If the name is a LINE User ID (starts with U and has 33 chars), don't prefill it
          if (!(data.full_name.startsWith('U') && data.full_name.length === 33)) {
            setFullName(data.full_name)
          }
        }
      }
    }
    fetchProfile()
  }, [])

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!fullName.trim()) {
      setError("กรุณากรอกชื่อ-นามสกุล")
      setLoading(false)
      return
    }

    if (!isValidThaiPhone(phone)) {
      setError("กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง (9-10 หลัก เช่น 0812345678)")
      setLoading(false)
      return
    }
    const cleanPhone = normalizeThaiPhone(phone)

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setError("ไม่พบข้อมูลผู้ใช้งาน กรุณาล็อกอินใหม่")
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        phone: cleanPhone,
        line_id: lineId.trim() || null
      })
      .eq('id', user.id)

    if (updateError) {
      setError("ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง")
      setLoading(false)
      return
    }

    // Force a hard navigation to avoid Next.js router cache issues with middleware
    window.location.href = "/dashboard"
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
          {error && <div role="alert" className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">{error}</div>}
          
          <div className="space-y-2">
            <label htmlFor="complete-fullname" className="text-sm font-medium">ชื่อ-นามสกุล *</label>
            <Input 
              id="complete-fullname"
              type="text" 
              autoComplete="name"
              required 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="กรุณากรอกชื่อและนามสกุล" 
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="complete-phone" className="text-sm font-medium">เบอร์โทรศัพท์ *</label>
            <Input 
              id="complete-phone"
              type="tel" 
              autoComplete="tel"
              required 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="เช่น 0812345678" 
              className="h-11"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="complete-lineid" className="text-sm font-medium">LINE ID / WeChat ID (ไม่บังคับ)</label>
            <Input 
              id="complete-lineid"
              type="text" 
              value={lineId}
              onChange={(e) => setLineId(e.target.value)}
              placeholder="เช่น line_id_123" 
              className="h-11"
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

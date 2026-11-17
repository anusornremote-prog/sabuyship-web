"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { User, Phone, CheckCircle2, Loader2, AlertTriangle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { isValidThaiPhone, normalizeThaiPhone } from "@/lib/phone"
import { LineConnectCard } from "@/components/dashboard/LineConnectCard"

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  
  const [profile, setProfile] = useState<any>(null)
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()

      if (data) {
        setProfile(data)
        setFullName(data.full_name || "")
        setPhone(data.phone || "")
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    setErrorMsg("")

    try {
      const cleanPhone = normalizeThaiPhone(phone)
      if (!isValidThaiPhone(cleanPhone)) {
        throw new Error("กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง (9-10 หลัก)")
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("ไม่พบผู้ใช้งาน")

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: cleanPhone,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id)

      if (error) throw error

      setSuccess(true)
      toast.success("บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว")
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">ข้อมูลส่วนตัว</h1>
        <p className="text-slate-600">จัดการข้อมูลโปรไฟล์เพื่อให้ง่ายต่อการติดต่อและจัดส่งสินค้า</p>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            ข้อมูลผู้ใช้งาน
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSave} className="space-y-5">
            {errorMsg && (
              <div role="alert" className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{errorMsg}</span>
              </div>
            )}
            
            {success && (
              <div role="status" className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold rounded-lg flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>บันทึกข้อมูลสำเร็จ</span>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">รหัสสมาชิกลูกค้า (Logistics Account)</p>
              <div className="h-11 px-3 py-2 bg-slate-100 rounded-md border border-slate-200 text-slate-600 font-bold flex items-center">
                {profile?.customer_code || "-"}
              </div>
              <p className="text-xs text-slate-500">รหัสนี้ใช้สำหรับระบุตัวตนของคุณเมื่อสั่งของลงโกดังจีน</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="profile-fullname" className="text-sm font-semibold text-slate-700">ชื่อ-นามสกุล *</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
                <Input 
                  id="profile-fullname"
                  autoComplete="name"
                  required
                  placeholder="กรอกชื่อ-นามสกุลของคุณ" 
                  className="pl-9 h-11"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="profile-phone" className="text-sm font-semibold text-slate-700">เบอร์โทรศัพท์ *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
                <Input 
                  id="profile-phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  placeholder="เบอร์โทรศัพท์สำหรับติดต่อ" 
                  className="pl-9 h-11"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end">
              <Button type="submit" variant="orange" disabled={saving} className="px-8 cursor-pointer font-bold">
                {saving ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังบันทึก...
                  </div>
                ) : (
                  "บันทึกข้อมูล"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <LineConnectCard lineUid={profile?.line_uid || null} variant="card" />
    </div>
  )
}

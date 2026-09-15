"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

export default function AdminSecurityPage() {
  const [supabase] = useState(() => createClient())
  const [factors, setFactors] = useState<any[]>([])
  const [factorId, setFactorId] = useState("")
  const [qrCode, setQrCode] = useState("")
  const [code, setCode] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) setMessage(error.message)
    setFactors(data?.totp || [])
    setLoading(false)
  }
  useEffect(() => { refresh() }, [])

  const enroll = async () => {
    setLoading(true); setMessage("")
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Sabuyship Admin" })
    if (error) setMessage(error.message)
    else { setFactorId(data.id); setQrCode(data.totp.qr_code) }
    setLoading(false)
  }

  const verify = async (id = factorId) => {
    if (!id || code.trim().length !== 6) return setMessage("กรุณากรอกรหัส 6 หลัก")
    setLoading(true); setMessage("")
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: id })
    if (challengeError) { setMessage(challengeError.message); setLoading(false); return }
    const { error } = await supabase.auth.mfa.verify({ factorId: id, challengeId: challenge.id, code: code.trim() })
    if (error) setMessage(error.message)
    else { setMessage("ยืนยันรหัสสองชั้นสำเร็จ"); setQrCode(""); setFactorId(""); setCode(""); await refresh() }
    setLoading(false)
  }

  const verified = factors.filter((factor) => factor.status === "verified")
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div><h1 className="text-2xl font-black text-slate-900">ความปลอดภัยบัญชีแอดมิน</h1><p className="text-sm text-slate-600">ตั้งค่าแอป Authenticator เพื่อป้องกันการเข้าถึงข้อมูลลูกค้าและธุรกรรม</p></div>
      <Card><CardHeader><CardTitle>Two-factor authentication (TOTP)</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className={`rounded-lg border p-3 text-sm font-bold ${verified.length ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
          {loading ? "กำลังตรวจสอบ..." : verified.length ? `เปิดใช้งานแล้ว ${verified.length} อุปกรณ์` : "ยังไม่ได้เปิดใช้งาน MFA"}
        </div>
        {!qrCode && verified.length === 0 && <Button disabled={loading} onClick={enroll}>เริ่มตั้งค่า Authenticator</Button>}
        {qrCode && <div className="space-y-3"><p className="text-sm">สแกน QR ด้วย Google Authenticator, Microsoft Authenticator หรือแอปที่รองรับ TOTP</p><img src={qrCode} alt="QR สำหรับตั้งค่า Authenticator" className="mx-auto max-w-[240px] rounded-lg border bg-white p-3" /></div>}
        {(qrCode || verified.length > 0) && <div className="flex gap-2"><Input inputMode="numeric" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} placeholder="รหัส 6 หลัก" /><Button disabled={loading || code.length !== 6} onClick={() => verify(qrCode ? factorId : verified[0]?.id)}>ยืนยัน</Button></div>}
        {message && <p className="text-sm text-slate-700">{message}</p>}
        <p className="text-xs text-slate-500">หลังตั้งค่าและทดสอบสำเร็จ ให้กำหนด Environment Variable `ADMIN_MFA_REQUIRED=true` ก่อน deploy รอบถัดไปเพื่อบังคับใช้กับหน้าแอดมินทั้งหมด</p>
      </CardContent></Card>
    </div>
  )
}

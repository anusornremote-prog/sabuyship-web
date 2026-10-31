"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Phone, User, MessageCircle, ShieldAlert, LogOut, Loader2 } from "lucide-react"

interface PhoneSetupModalProps {
  isOpen?: boolean
  autoCheck?: boolean
  onSuccess?: () => void
}

function isValidThaiPhone(value: string | null | undefined): boolean {
  const digits = (value || "").replace(/\D/g, "")
  return digits.length >= 9 && digits.length <= 10 && digits.startsWith("0")
}

function isPlaceholderName(name: string | null | undefined): boolean {
  if (!name || !name.trim()) return true
  const trimmed = name.trim()
  if (trimmed === "Member" || trimmed === "Google User" || trimmed === "LINE User") return true
  if (/^U[0-9a-f]{32}$/i.test(trimmed)) return true
  return false
}

export function PhoneSetupModal({
  isOpen = false,
  autoCheck = false,
  onSuccess,
}: PhoneSetupModalProps) {
  const [mounted, setMounted] = useState(false)
  const [internalOpen, setInternalOpen] = useState(false)
  const [needsName, setNeedsName] = useState(false)
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [lineId, setLineId] = useState("")
  const [customerCode, setCustomerCode] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let cancelled = false

    const checkUserProfile = async () => {
      if (!isOpen && !autoCheck) return

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || cancelled) return

        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name, phone, line_id, customer_code")
          .eq("id", user.id)
          .maybeSingle()

        if (cancelled) return

        const hasPhone = isValidThaiPhone(profile?.phone)
        if (!hasPhone || isOpen) {
          const missingName = isPlaceholderName(profile?.full_name)
          setNeedsName(missingName)
          setFullName(missingName ? "" : (profile?.full_name || ""))
          setPhone(profile?.phone ? profile.phone.replace(/\D/g, "") : "")
          setLineId(profile?.line_id || "")
          setCustomerCode(profile?.customer_code || null)
          if (!hasPhone) {
            setInternalOpen(true)
          }
        } else {
          setInternalOpen(false)
        }
      } catch (err) {
        console.error("Failed to verify user phone status:", err)
      }
    }

    checkUserProfile()

    return () => {
      cancelled = true
    }
  }, [isOpen, autoCheck])

  const modalVisible = mounted && (isOpen || internalOpen)

  useEffect(() => {
    if (!modalVisible) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [modalVisible])

  if (!modalVisible) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    const cleanPhone = phone.replace(/\D/g, "")
    if (!isValidThaiPhone(cleanPhone)) {
      setErrorMsg("กรุณากรอกเบอร์โทรศัพท์มือถือให้ถูกต้อง (ตัวเลข 9-10 หลัก ขึ้นต้นด้วยเลข 0 เช่น 0812345678)")
      return
    }

    const trimmedName = fullName.trim()
    if (needsName && !trimmedName) {
      setErrorMsg("กรุณากรอกชื่อ - นามสกุล หรือชื่อเล่นสำหรับติดต่อ")
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setErrorMsg("ไม่พบเซสชันผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่อีกครั้ง")
        setLoading(false)
        return
      }

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, full_name, customer_code")
        .eq("id", user.id)
        .maybeSingle()

      const finalName = trimmedName || existingProfile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "ลูกค้า SabuyShip"

      if (!existingProfile) {
        const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase()
        const generatedCode = `SB${randomChars}`
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            full_name: finalName,
            phone: cleanPhone,
            line_id: lineId.trim() || null,
            role: "CUSTOMER",
            customer_code: generatedCode,
            is_active: true,
          })
        if (insertError) throw insertError
      } else {
        const updatePayload: Record<string, any> = {
          phone: cleanPhone,
          updated_at: new Date().toISOString(),
        }
        if (trimmedName) {
          updatePayload.full_name = trimmedName
        }
        if (lineId.trim()) {
          updatePayload.line_id = lineId.trim()
        }
        const { error: updateError } = await supabase
          .from("profiles")
          .update(updatePayload)
          .eq("id", user.id)
        if (updateError) throw updateError
      }

      setInternalOpen(false)
      onSuccess?.()
      router.refresh()
    } catch (err: any) {
      console.error("Error saving phone number:", err)
      setErrorMsg(err?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setInternalOpen(false)
    router.push("/login")
    router.refresh()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 overflow-y-auto overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-labelledby="phone-setup-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 sm:p-7 my-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-5 text-center">
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs">
            <Phone className="w-8 h-8" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            จำเป็นต้องระบุข้อมูลก่อนเข้าใช้งาน
          </span>
          <h2 id="phone-setup-modal-title" className="text-xl sm:text-2xl font-black text-slate-900">
            กรุณายืนยันเบอร์โทรศัพท์มือถือ
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
            เพื่อความรวดเร็วในการแจ้งเตือนสถานะพัสดุและจัดส่งสินค้า สมาชิกทุกท่านจำเป็นต้องระบุเบอร์โทรศัพท์มือถือที่ติดต่อได้จริง
          </p>
          {customerCode && (
            <div className="mt-2 inline-block px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-700">
              รหัสสมาชิกของคุณ: <span className="text-primary">{customerCode}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold leading-relaxed">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-400" />
              ชื่อ - นามสกุล (หรือชื่อเล่น) <span className="text-rose-500">*</span>
            </label>
            <Input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="ระบุชื่อสำหรับติดต่อและจ่าหน้าพัสดุ"
              required
              className="h-11 text-sm sm:text-base rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-orange-500" />
              เบอร์โทรศัพท์มือถือ (จำเป็น) <span className="text-rose-500">*</span>
            </label>
            <Input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="08XXXXXXXX (ตัวเลข 10 หลัก)"
              required
              autoFocus
              className="h-12 text-base sm:text-lg font-bold tracking-wider rounded-xl border-slate-300 focus:border-primary"
            />
            <p className="text-[11px] text-slate-500">
              กรอกเฉพาะตัวเลข 9-10 หลัก เช่น 0812345678 (ไม่ต้องใส่ขีด -)
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-[#06C755]" />
              LINE ID <span className="text-xs font-normal text-slate-400">(ไม่บังคับ)</span>
            </label>
            <Input
              type="text"
              value={lineId}
              onChange={(e) => setLineId(e.target.value)}
              placeholder="ระบุ LINE ID เพื่อความสะดวกในการติดต่อ"
              className="h-11 text-sm rounded-xl"
            />
          </div>

          <Button
            type="submit"
            variant="orange"
            className="w-full h-12 text-base font-black mt-2 rounded-xl shadow-md shadow-orange-500/20 cursor-pointer"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังบันทึกข้อมูล...
              </span>
            ) : (
              "บันทึกเบอร์โทรศัพท์และเข้าใช้งาน"
            )}
          </Button>

          <div className="pt-2 text-center border-t border-slate-100">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer py-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              ออกจากระบบ / เปลี่ยนบัญชีผู้ใช้
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

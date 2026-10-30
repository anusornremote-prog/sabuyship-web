"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Send, CheckCircle2, AlertCircle, Loader2, Users, Save, HelpCircle, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface AdminNotificationHeaderProps {
  isConfigured: boolean
}

export function AdminNotificationHeader({ isConfigured }: AdminNotificationHeaderProps) {
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [recipientCount, setRecipientCount] = useState<number>(1)
  const [customUserIds, setCustomUserIds] = useState<string>("")
  const [adminsList, setAdminsList] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/notifications/settings")
      const data = await res.json()
      if (data.success) {
        setRecipientCount(data.totalActiveRecipients || 1)
        setCustomUserIds(data.settingUserIds || "")
        setAdminsList(data.admins || [])
      }
    } catch (err) {
      console.error("Failed to fetch notification settings:", err)
    }
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      const res = await fetch("/api/admin/notifications/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customUserIds }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success("บันทึกรายชื่อแอดมินสำเร็จ!", {
          description: `ขณะนี้มีแอดมินรับแจ้งเตือนทั้งหมด ${data.totalActiveRecipients} ท่าน`,
        })
        setRecipientCount(data.totalActiveRecipients)
        setModalOpen(false)
        router.refresh()
      } else {
        toast.error("บันทึกไม่สำเร็จ", { description: data.error })
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์")
    } finally {
      setSavingSettings(false)
    }
  }

  const handleTest = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/notifications/test", {
        method: "POST",
      })
      const data = await res.json()

      if (res.ok && data.success) {
        toast.success(`ส่งข้อความทดสอบสำเร็จ! (${data.recipientCount} ท่าน)`, {
          description: "ส่งข้อความแจ้งเตือนเข้าแอดมินทุกคนทาง LINE เรียบร้อยแล้ว",
        })
        router.refresh()
      } else {
        toast.error("ส่งข้อความไม่สำเร็จ", {
          description: data.error || "เกิดข้อผิดพลาดในการส่งข้อความ",
        })
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-slate-900">
              ระบบแจ้งเตือนแอดมิน (LINE Notification)
            </h1>
            {isConfigured ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> พร้อมใช้งาน ({recipientCount} ท่าน)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5" /> ยังไม่ตั้งค่า Token
              </span>
            )}
          </div>
          <p className="text-xs md:text-sm text-slate-500">
            แจ้งเตือนอัตโนมัติเมื่อมี: รายการขอใบเสนอราคาใหม่, ลูกค้าแนบสลิปชำระเงิน, หรือข้อความจากหน้าเว็บ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            onClick={() => setModalOpen(true)}
            className="font-bold border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Users className="w-4 h-4 mr-1.5 text-primary" />
            จัดการแอดมินรับแจ้งเตือน ({recipientCount})
          </Button>

          <Button
            onClick={handleTest}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                กำลังส่งข้อความ...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                ทดสอบส่ง LINE ถึงทุกคน
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Modal: Manage Admin Recipients */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90dvh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0 border-b border-slate-100 pb-3">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Users className="w-5 h-5 text-primary" />
              จัดการรายชื่อแอดมินที่รับแจ้งเตือน LINE
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              เมื่อมีออเดอร์ใหม่ สลิปชำระเงิน หรือข้อความติดต่อ ระบบจะส่งข้อความแจ้งเตือนไปยังแอดมินทุกคนที่ระบุไว้พร้อมกัน
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Registered Admins in DB */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                บัญชีแอดมินในระบบ ({adminsList.length} ท่าน)
              </label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {adminsList.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 text-xs"
                  >
                    <div className="font-semibold text-slate-800 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                      <span>{admin.fullName}</span>
                    </div>
                    <div>
                      {admin.hasLineUid ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> เชื่อมต่อ LINE แล้ว ({admin.lineUidMasked})
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          ยังไม่เชื่อม LINE
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Admin UIDs input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                เพิ่ม LINE User ID (UID) แอดมินเพิ่มเติม
              </label>
              <p className="text-xs text-slate-500">
                สามารถใส่รหัส LINE UID (ขึ้นต้นด้วยตัว U) หลายคนได้ โดยคั่นด้วยเครื่องหมายจุลภาค <code>,</code> หรือขึ้นบรรทัดใหม่
              </p>
              <Textarea
                value={customUserIds}
                onChange={(e) => setCustomUserIds(e.target.value)}
                placeholder="เช่น U10677c26541dc7bf1ec5d369fb920e79, U234567890abcdef..."
                rows={3}
                className="font-mono text-xs"
              />
            </div>

            {/* Helper Box: How to get UID */}
            <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-100 text-xs text-blue-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                วิธีเชื่อมต่อ LINE ให้แอดมินคนอื่นๆ:
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px] pl-1">
                <li>
                  <strong>วิธีที่ 1 (อัตโนมัติ):</strong> ให้แอดมินเข้าหน้าเว็บแล้วกดปุ่ม <strong>&quot;เข้าสู่ระบบด้วย LINE&quot;</strong> เพียง 1 ครั้ง ระบบจะผูก LINE UID เข้ากับบัญชีแอดมินให้ทันที
                </li>
                <li>
                  <strong>วิธีที่ 2 (กรอก UID):</strong> นำ LINE User ID (ขึ้นต้นด้วยตัว U 33 หลัก) ของแอดมินมาวางในช่องด้านบนนี้แล้วกดบันทึก
                </li>
              </ul>
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-100 p-3 bg-slate-50/50 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
              className="text-xs font-bold"
            >
              ยกเลิก
            </Button>
            <Button
              size="sm"
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="bg-primary hover:bg-primary/90 text-white text-xs font-bold"
            >
              {savingSettings ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  บันทึกรายชื่อแอดมิน
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

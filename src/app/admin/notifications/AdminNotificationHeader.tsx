"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Send, Loader2, CheckCircle2, AlertCircle, Users, Save, HelpCircle, UserPlus, Check } from "lucide-react"
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
  const [lineConnectedUsers, setLineConnectedUsers] = useState<any[]>([])
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
        setLineConnectedUsers(data.lineConnectedUsers || [])
      }
    } catch (err) {
      console.error("Failed to fetch notification settings:", err)
    }
  }

  const toggleUserUidInCustomList = (lineUid: string) => {
    if (!lineUid) return
    const currentList = customUserIds
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(Boolean)

    let nextList: string[]
    if (currentList.includes(lineUid)) {
      nextList = currentList.filter(id => id !== lineUid)
    } else {
      nextList = [...currentList, lineUid]
    }
    setCustomUserIds(nextList.join(", "))
  }

  const isUidSelectedInInput = (lineUid: string) => {
    if (!lineUid) return false
    const currentList = customUserIds
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(Boolean)
    return currentList.includes(lineUid)
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
        toast.success("บันทึกรายชื่อผู้รับแจ้งเตือนสำเร็จ!", {
          description: `ขณะนี้มีผู้รับแจ้งเตือนทั้งหมด ${data.totalActiveRecipients} รายการ`,
        })
        setRecipientCount(data.totalActiveRecipients)
        await fetchSettings()
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
          description: "ส่งข้อความแจ้งเตือนเข้าทุกคนที่ตั้งค่าไว้ทาง LINE เรียบร้อยแล้ว",
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
                <CheckCircle2 className="w-3.5 h-3.5" /> พร้อมใช้งาน ({recipientCount} ท่าน/กลุ่ม)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5" /> ยังไม่ตั้งค่า Token
              </span>
            )}
          </div>
          <p className="text-xs md:text-sm text-slate-500">
            แจ้งเตือนอัตโนมัติถึงแอดมินและทีมงานทุกคนเมื่อมี: รายการขอใบเสนอราคาใหม่, ลูกค้าแนบสลิปชำระเงิน, หรือข้อความจากหน้าเว็บ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            onClick={() => setModalOpen(true)}
            className="font-bold border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Users className="w-4 h-4 mr-1.5 text-primary" />
            จัดการผู้รับแจ้งเตือน ({recipientCount})
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

      {/* Modal: Manage Admin & Staff Recipients */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[88dvh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="shrink-0 border-b border-slate-100 p-4 sm:p-5 pb-3 pr-10 text-left">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-bold text-slate-900">
              <Users className="w-5 h-5 text-primary shrink-0" />
              <span>จัดการรายชื่อผู้รับแจ้งเตือน LINE (แอดมิน & ทีมงาน)</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              สามารถเพิ่มทั้งแอดมินเว็บ, แอดมินเพจ LINE OA (ที่ไม่ใช่แอดมินเว็บ), หรือกลุ่ม LINE ของทีมงานให้รับแจ้งเตือนพร้อมกันได้
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch] p-4 sm:p-5 space-y-5">
            {/* 1. Quick-Select from anyone who logged in with LINE */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                1. เลือกจากบัญชีที่เคยล็อกอินด้วย LINE บนเว็บ ({lineConnectedUsers.length} บัญชี)
              </label>
              <p className="text-[11px] text-slate-500">
                แม้จะไม่ได้เป็นแอดมินเว็บ (เช่น เป็นพนักงานหรือแอดมิน LINE OA) แค่เคยกด &quot;เข้าสู่ระบบด้วย LINE&quot; บนเว็บ ก็สามารถกดเลือกให้รับแจ้งเตือนตรงนี้ได้เลย
              </p>
              <div className="space-y-2">
                {lineConnectedUsers.map((u) => {
                  const active = u.isEnvDefault || u.role === "ADMIN" || isUidSelectedInInput(u.lineUid)
                  return (
                    <div
                      key={u.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="font-bold text-slate-800 flex flex-wrap items-center gap-1.5">
                          <span className="truncate">{u.fullName}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold shrink-0 ${u.role === "ADMIN"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-200 text-slate-600"
                            }`}>
                            {u.role === "ADMIN" ? "แอดมินเว็บ" : "สมาชิกทั่วไป / ทีมงาน"}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono truncate">
                          LINE UID: {u.lineUidMasked}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {u.isEnvDefault ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" /> แอดมินหลัก (รับเสมอ)
                          </span>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant={active ? "default" : "outline"}
                            onClick={() => toggleUserUidInCustomList(u.lineUid)}
                            className={`h-8 w-full sm:w-auto px-2.5 text-xs font-bold cursor-pointer ${active
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                              : "border-blue-200 text-primary hover:bg-blue-50"
                              }`}
                          >
                            {active ? (
                              <>
                                <Check className="w-3.5 h-3.5 mr-1" /> รับแจ้งเตือนอยู่ (คลิกเพื่อเอาออก)
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3.5 h-3.5 mr-1" /> + เพิ่มให้รับแจ้งเตือน
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 2. Custom Admin / Staff / Group UIDs input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                2. รายชื่อรหัส LINE UID บุคคล (`U...`) หรือ รหัสกลุ่ม LINE (`C...`) เพิ่มเติม
              </label>
              <p className="text-[11px] text-slate-500">
                ใส่รหัสได้หลายคนหรือหลายกลุ่ม คั่นด้วยเครื่องหมายจุลภาค <code>,</code> หรือขึ้นบรรทัดใหม่
              </p>
              <Textarea
                value={customUserIds}
                onChange={(e) => setCustomUserIds(e.target.value)}
                placeholder="เช่น U8766d7a224a3a7da571e418c7d0da2fe, C1234567890abcdef..."
                rows={3}
                className="font-mono text-xs"
              />
            </div>

            {/* 3. Helper Box: How non-website admins or LINE OA admins can get notifications */}
            <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-100 text-xs text-blue-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                วิธีให้ &quot;แอดมินเพจ LINE OA&quot; หรือ &quot;ทีมงานที่ไม่ใช่แอดมินเว็บ&quot; ได้รับแจ้งเตือน:
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-slate-700 text-[11px] pl-1">
                <li>
                  <strong>วิธีที่ง่ายที่สุด (ไม่ต้องตั้งเป็นแอดมินเว็บ):</strong> ให้ทีมงานคนนั้นแอดเพื่อน LINE OA <code>@516lqkcd</code> แล้วเข้าเว็บกดปุ่ม <strong>&quot;เข้าสู่ระบบด้วย LINE&quot;</strong> 1 ครั้ง ชื่อของเขาจะโผล่ในหัวข้อที่ 1 ด้านบนนี้ ให้คุณกดปุ่ม <strong>&quot;+ เพิ่มให้รับแจ้งเตือน&quot;</strong> ได้ทันที!
                </li>
                <li>
                  <strong>วิธีส่งเข้า &quot;กลุ่ม LINE ทีมงาน&quot; (เห็นทุกคนพร้อมกัน):</strong> สร้างกลุ่ม LINE ทีมงาน แล้วดึงบอท <strong>Sabuy Ship Express (<code>@516lqkcd</code>)</strong> เข้ากลุ่ม จากนั้นพิมพ์ <code>#uid</code> ในกลุ่ม บอทจะตอบรหัสกลุ่ม (<code>C...</code>) กลับมาให้นำมาวางในช่องที่ 2 ด้านบน
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
              className="bg-primary hover:bg-primary/90 text-white text-xs font-bold cursor-pointer"
            >
              {savingSettings ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  บันทึกรายชื่อผู้รับแจ้งเตือน
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

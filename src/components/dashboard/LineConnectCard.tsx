"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BellRing, CheckCircle2, ExternalLink, Loader2, MessageCircle, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { linkLineIdentity } from "@/lib/line-oauth"
import { getFriendlyAuthErrorMessage } from "@/lib/auth-errors"
import { LINE_OA_ID, LINE_OA_URL } from "@/lib/constants"

interface LineConnectCardProps {
  lineUid: string | null
  variant?: "card" | "banner"
}

function maskLineUid(uid: string): string {
  const clean = uid.trim()
  if (clean.length <= 10) return clean
  return `${clean.slice(0, 5)}...${clean.slice(-4)}`
}

/**
 * Allows Email/Google customers to link their LINE account so LINE OA order status
 * notifications reach their existing customer profile.
 */
export function LineConnectCard({ lineUid, variant = "card" }: LineConnectCardProps) {
  const [linking, setLinking] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const linked = params.get("line_linked")
    const lineError = params.get("line_error")

    if (linked === "1") {
      toast.success("เชื่อมต่อบัญชี LINE เรียบร้อยแล้ว", {
        description: `อย่าลืมเพิ่มเพื่อน LINE OA ${LINE_OA_ID} เพื่อรับแจ้งเตือนสถานะสินค้า`,
      })
    } else if (lineError) {
      setErrorMsg(getFriendlyAuthErrorMessage(lineError))
    }
  }, [])

  const handleConnectLine = async () => {
    setLinking(true)
    setErrorMsg("")
    try {
      const supabase = createClient()
      const result = await linkLineIdentity(supabase)
      if (result.redirectedExternally) return
      if (result.errorMessage) {
        setErrorMsg(result.errorMessage)
        toast.error("เชื่อมต่อ LINE ไม่สำเร็จ", { description: result.errorMessage })
        setLinking(false)
      }
    } catch {
      const fallback = "ไม่สามารถเชื่อมต่อบัญชี LINE ได้ กรุณาลองใหม่อีกครั้ง"
      setErrorMsg(fallback)
      toast.error(fallback)
      setLinking(false)
    }
  }

  if (variant === "banner") {
    if (lineUid) return null

    return (
      <div className="rounded-2xl border border-[#06C755]/30 bg-emerald-50/70 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#06C755]/15 text-[#06C755] flex items-center justify-center shrink-0">
            <BellRing className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-black text-slate-900">
              เชื่อมต่อ LINE เพื่อรับแจ้งเตือนสถานะพัสดุอัตโนมัติ
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              คุณเข้าสู่ระบบด้วยอีเมลหรือ Google — เชื่อมบัญชี LINE ครั้งเดียวเพื่อรับแจ้งเตือนใบเสนอราคาและค่านำเข้า 3 รอบเข้าแชท LINE ทันที
            </p>
            {errorMsg && (
              <p role="alert" className="text-xs font-semibold text-rose-700 pt-1">
                {errorMsg}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            type="button"
            onClick={handleConnectLine}
            disabled={linking}
            className="bg-[#06C755] hover:bg-[#05b34c] text-white font-bold rounded-xl min-h-11 px-4 cursor-pointer"
          >
            {linking ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                กำลังเชื่อมต่อ...
              </>
            ) : (
              <>
                <MessageCircle className="w-4 h-4 mr-2" aria-hidden="true" />
                เชื่อมต่อ LINE ตอนนี้
              </>
            )}
          </Button>
          <Link href="/dashboard/profile" className="text-xs font-bold text-slate-600 hover:text-primary px-2 py-2">
            ดูรายละเอียด
          </Link>
        </div>
      </div>
    )
  }

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="bg-slate-50/50 border-b pb-4">
        <CardTitle className="text-lg flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-[#06C755]" aria-hidden="true" />
            การแจ้งเตือนผ่าน LINE OA
          </span>
          {lineUid ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              เชื่อมต่อแล้ว
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-800">
              ยังไม่เชื่อมต่อ LINE
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {errorMsg && (
          <div
            role="alert"
            className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold rounded-lg flex items-start gap-2"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}

        {lineUid ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-4 text-sm text-slate-700 space-y-1">
              <p className="font-bold text-emerald-900">บัญชีของคุณผูกกับ LINE เรียบร้อยแล้ว</p>
              <p className="text-xs text-slate-600">
                รหัสอ้างอิง LINE UID: <code className="font-mono font-bold text-slate-800">{maskLineUid(lineUid)}</code>
              </p>
              <p className="text-xs text-slate-600">
                กรุณาตรวจสอบว่าได้เพิ่มเพื่อน LINE OA <strong>{LINE_OA_ID}</strong> ไว้แล้ว เพื่อให้ระบบส่งแจ้งเตือนใบเสนอราคาและสถานะพัสดุได้ครบทุกขั้นตอน
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href={LINE_OA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-sm px-4 min-h-11 transition-colors"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                เปิด / เพิ่มเพื่อน LINE OA ({LINE_OA_ID})
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              หากคุณสมัครด้วยอีเมลหรือ Google กดเชื่อมต่อ LINE เพื่อรับแจ้งเตือนใบเสนอราคารอบ 1–3, เลขแทร็กจีน และสถานะพัสดุอัตโนมัติบนแชท LINE โดยออเดอร์เดิมทั้งหมดยังอยู่ครบ
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={handleConnectLine}
                disabled={linking}
                className="bg-[#06C755] hover:bg-[#05b34c] text-white font-bold rounded-xl min-h-11 px-5 cursor-pointer"
              >
                {linking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                    กำลังเชื่อมต่อไปยัง LINE...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4 mr-2" aria-hidden="true" />
                    เชื่อมต่อบัญชี LINE เพื่อรับแจ้งเตือน
                  </>
                )}
              </Button>

              <a
                href={LINE_OA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-primary min-h-11 px-2"
              >
                เพิ่มเพื่อน OA {LINE_OA_ID}
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

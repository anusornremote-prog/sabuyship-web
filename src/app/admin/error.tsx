"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function AdminError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { console.error("Admin page error", error) }, [error])
  return (
    <div className="mx-auto mt-12 max-w-lg rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
      <h2 className="text-xl font-black text-slate-900">โหลดหน้าผู้ดูแลระบบไม่สำเร็จ</h2>
      <p className="mt-2 text-sm text-slate-600">ข้อมูลของคุณไม่ได้ถูกเปลี่ยน กรุณาลองโหลดหน้านี้ใหม่</p>
      <Button type="button" className="mt-5 min-h-11" onClick={() => retry()}>ลองใหม่</Button>
    </div>
  )
}

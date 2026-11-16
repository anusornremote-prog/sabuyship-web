"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error("Dashboard page error", error)
  }, [error])

  return (
    <div className="mx-auto mt-12 max-w-lg rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
      <h2 className="text-xl font-black text-slate-900">โหลดหน้าข้อมูลลูกค้าไม่สำเร็จ</h2>
      <p className="mt-2 text-sm text-slate-600">
        ข้อมูลของคุณไม่ได้ถูกเปลี่ยนแปลง กรุณาลองโหลดหน้านี้ใหม่อีกครั้ง
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Button type="button" className="min-h-11" onClick={() => retry()}>
          ลองใหม่
        </Button>
        <Link href="/dashboard">
          <Button variant="outline" className="min-h-11">
            กลับหน้าภาพรวม
          </Button>
        </Link>
      </div>
    </div>
  )
}


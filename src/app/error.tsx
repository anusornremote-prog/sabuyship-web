'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service like Sentry
    console.error('Global Application Error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="p-8 text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">ขออภัย เกิดข้อผิดพลาดบางอย่าง</h1>
            <p className="text-slate-500 text-sm">
              ระบบอาจขัดข้องชั่วคราว หรือไม่สามารถประมวลผลคำขอของคุณได้ในขณะนี้
            </p>
          </div>

          <div className="pt-4">
            <Button onClick={() => reset()} className="w-full bg-primary hover:bg-primary/90 text-white">
              <RotateCcw className="w-4 h-4 mr-2" />
              ลองใหม่อีกครั้ง (Try again)
            </Button>
          </div>
        </div>
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
          <p className="text-xs text-slate-400 font-mono break-all">Error: {error.message || "Unknown Error"}</p>
        </div>
      </div>
    </div>
  )
}

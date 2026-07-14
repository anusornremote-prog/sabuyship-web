"use client"
import Link from 'next/link'
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="p-8 text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-10 h-10 text-orange-500" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">404</h1>
            <h2 className="text-xl font-semibold text-slate-800">ไม่พบหน้าที่คุณต้องการ</h2>
            <p className="text-slate-500 text-sm">
              หน้าเว็บที่คุณพยายามเข้าถึงอาจถูกลบ ย้าย หรือไม่มีอยู่จริงในระบบ (SabuyShip)
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button variant="outline" className="w-full sm:w-auto" asChild>
              <button onClick={() => window.history.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                ย้อนกลับ
              </button>
            </Button>
            <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white" asChild>
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                กลับสู่หน้าหลัก
              </Link>
            </Button>
          </div>
        </div>
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
          <p className="text-xs text-slate-400">SabuyShip Logistics & Cargo</p>
        </div>
      </div>
    </div>
  )
}

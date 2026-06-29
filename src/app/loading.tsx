import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 relative">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
        <h2 className="text-lg font-semibold text-slate-700 animate-pulse">กำลังโหลดข้อมูล...</h2>
        <p className="text-sm text-slate-400">กรุณารอสักครู่ (SabuyShip)</p>
      </div>
    </div>
  )
}

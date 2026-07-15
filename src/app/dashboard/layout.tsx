"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { PhoneSetupModal } from "@/components/PhoneSetupModal"
import { Ship, LayoutDashboard, Package, LogOut, FileQuestion, FileText, MapPin } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const [badgeCounts, setBadgeCounts] = useState({
    inquiriesCount: 0,
    ordersCount: 0
  })

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch('/api/customer/badge-counts')
        if (res.ok) {
          const data = await res.json()
          setBadgeCounts({
            inquiriesCount: data.inquiriesCount || 0,
            ordersCount: data.ordersCount || 0
          })
        }
      } catch (error) {
        console.error("Failed to fetch badge counts:", error)
      }
    }
    fetchCounts()
  }, [pathname])

  useEffect(() => {
    const checkProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', user.id)
          .maybeSingle()
          
        if (data && !data.phone) {
          setShowPhoneModal(true)
        }
      }
    }
    checkProfile()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white flex-shrink-0 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b">
          <Link href="/" className="flex items-center h-full relative w-48 overflow-visible">
            <img src="/Sabuy_Ship_Express.png" alt="Sabuy Ship Express Logo" className="absolute -left-3 top-1/2 -translate-y-1/2 h-28 w-auto object-contain max-w-none" />
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/dashboard" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${pathname === '/dashboard' ? 'bg-blue-50 text-primary font-medium' : 'text-slate-600 hover:bg-slate-100'}`}>
            <LayoutDashboard className="h-5 w-5" />
            ภาพรวม
          </Link>
          <Link href="/dashboard/orders" className={`flex items-center justify-between px-3 py-2 rounded-md transition-colors ${pathname.startsWith('/dashboard/orders') ? 'bg-blue-50 text-primary font-medium' : 'text-slate-600 hover:bg-slate-100'}`}>
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5" />
              คำสั่งซื้อของฉัน
            </div>
            {(badgeCounts.ordersCount + badgeCounts.inquiriesCount) > 0 ? (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {badgeCounts.ordersCount + badgeCounts.inquiriesCount}
              </span>
            ) : null}
          </Link>
          <Link href="/dashboard/addresses" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${pathname.startsWith('/dashboard/addresses') ? 'bg-blue-50 text-primary font-medium' : 'text-slate-600 hover:bg-slate-100'}`}>
            <MapPin className="h-5 w-5" />
            สมุดที่อยู่
          </Link>
          <Link href="/inquiry" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-slate-600 hover:bg-slate-100`}>
            <FileQuestion className="h-5 w-5" />
            ขอใบเสนอราคา
          </Link>
        </nav>
        <div className="p-4 border-t space-y-2">
          <Link href="/dashboard/profile">
             <Button variant="outline" className={`w-full justify-start transition-colors ${pathname.startsWith('/dashboard/profile') ? 'border-primary text-primary bg-blue-50' : 'text-slate-600 hover:bg-slate-100 cursor-pointer'}`}>
               <span className="flex-1 text-left">ข้อมูลส่วนตัว</span>
             </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer" onClick={handleLogout}>
            <LogOut className="mr-2 h-5 w-5" />
            ออกจากระบบ
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-full overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:hidden">
          <Link href="/" className="flex items-center h-full relative w-40 overflow-visible">
            <img src="/Sabuy_Ship_Express.png" alt="Sabuy Ship Express Logo" className="absolute -left-3 top-1/2 -translate-y-1/2 h-24 w-auto object-contain max-w-none" />
          </Link>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
             <LogOut className="h-5 w-5 text-destructive" />
          </Button>
        </header>

        {/* Mobile Nav */}
        <nav className="flex md:hidden bg-white border-b overflow-x-auto">
           <Link href="/dashboard" className={`whitespace-nowrap px-4 py-3 text-sm transition-colors ${pathname === '/dashboard' ? 'border-b-2 border-primary text-primary font-medium' : 'text-slate-600'}`}>
            ภาพรวม
          </Link>
          <Link href="/dashboard/orders" className={`whitespace-nowrap flex items-center gap-2 px-4 py-3 text-sm transition-colors ${pathname.startsWith('/dashboard/orders') || pathname.startsWith('/dashboard/inquiries') ? 'border-b-2 border-primary text-primary font-medium' : 'text-slate-600'}`}>
            คำสั่งซื้อ
            {(badgeCounts.ordersCount + badgeCounts.inquiriesCount) > 0 ? (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {badgeCounts.ordersCount + badgeCounts.inquiriesCount}
              </span>
            ) : null}
          </Link>
          <Link href="/dashboard/addresses" className={`whitespace-nowrap flex items-center gap-2 px-4 py-3 text-sm transition-colors ${pathname.startsWith('/dashboard/addresses') ? 'border-b-2 border-primary text-primary font-medium' : 'text-slate-600'}`}>
            สมุดที่อยู่
          </Link>
          <Link href="/dashboard/profile" className={`whitespace-nowrap px-4 py-3 text-sm transition-colors ${pathname.startsWith('/dashboard/profile') ? 'border-b-2 border-primary text-primary font-medium' : 'text-slate-600'}`}>
            ข้อมูลส่วนตัว
          </Link>
          <Link href="/inquiry" className={`whitespace-nowrap px-4 py-3 text-sm transition-colors text-slate-600`}>
            ขอใบเสนอราคา
          </Link>
        </nav>

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
      <PhoneSetupModal isOpen={showPhoneModal} onSuccess={() => setShowPhoneModal(false)} />
    </div>
  )
}

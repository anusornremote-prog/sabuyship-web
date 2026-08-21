"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { PhoneSetupModal } from "@/components/PhoneSetupModal"
import { 
  LayoutDashboard, 
  Package, 
  LogOut, 
  FileQuestion, 
  MapPin, 
  Home, 
  User, 
  PlusCircle, 
  ExternalLink,
  ShoppingCart
} from "lucide-react"
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
  const [userEmail, setUserEmail] = useState<string | null>(null)
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
        setUserEmail(user.email || null)
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

  // Get current page title for the header
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'ภาพรวมบัญชี'
    if (pathname.startsWith('/dashboard/orders')) return 'คำสั่งซื้อของฉัน'
    if (pathname.startsWith('/dashboard/addresses')) return 'สมุดที่อยู่สำหรับจัดส่ง'
    if (pathname.startsWith('/dashboard/profile')) return 'ข้อมูลส่วนตัว'
    return 'ระบบลูกค้า Sabuy Ship'
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      {/* 1. Desktop Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white flex-shrink-0 flex flex-col hidden md:flex">
        {/* Sidebar Header (h-20 to perfectly align with Top Header) */}
        <div className="h-20 flex items-center justify-center px-4 border-b border-slate-200 bg-white">
          <Link href="/" className="flex items-center justify-center w-full">
            <img 
              src="/Sabuy_Ship_Express.png" 
              alt="Sabuy Ship Express Logo" 
              className="h-16 w-auto max-h-[64px] max-w-[220px] object-contain hover:scale-105 transition-transform" 
            />
          </Link>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          <Link 
            href="/" 
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <Home className="h-4 w-4 text-slate-400" />
            หน้าแรกเว็บไซต์
          </Link>

          <Link 
            href="/dashboard" 
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              pathname === '/dashboard' 
                ? 'bg-blue-50 text-primary shadow-2xs' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            ภาพรวม
          </Link>

          <Link 
            href="/dashboard/orders" 
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              pathname.startsWith('/dashboard/orders') 
                ? 'bg-blue-50 text-primary shadow-2xs' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Package className="h-4 w-4" />
              คำสั่งซื้อของฉัน
            </div>
            {(badgeCounts.ordersCount + badgeCounts.inquiriesCount) > 0 ? (
              <span className="bg-red-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full">
                {badgeCounts.ordersCount + badgeCounts.inquiriesCount}
              </span>
            ) : null}
          </Link>

          <Link 
            href="/dashboard/addresses" 
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              pathname.startsWith('/dashboard/addresses') 
                ? 'bg-blue-50 text-primary shadow-2xs' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <MapPin className="h-4 w-4" />
            สมุดที่อยู่
          </Link>

          <Link 
            href="/inquiry" 
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-colors text-orange-600 hover:bg-orange-50"
          >
            <ShoppingCart className="h-4 w-4 text-orange-500" />
            ขอใบเสนอราคาใหม่
          </Link>

          <Link 
            href="/dashboard/profile" 
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              pathname.startsWith('/dashboard/profile') 
                ? 'bg-blue-50 text-primary shadow-2xs' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <User className="h-4 w-4" />
            ข้อมูลส่วนตัว
          </Link>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-200">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl cursor-pointer" 
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            ออกจากระบบ
          </Button>
        </div>
      </aside>

      {/* 2. Main Layout Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar (Desktop & Mobile) - EXACT SAME h-20 height as Sidebar */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 md:px-8 shrink-0">
          {/* Mobile Logo on the left */}
          <div className="flex items-center gap-3 md:hidden">
            <Link href="/" className="flex items-center">
              <img src="/Sabuy_Ship_Express.png" alt="Sabuy Ship Express" className="h-12 w-auto object-contain" />
            </Link>
          </div>

          {/* Desktop Breadcrumb / Title on the left */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">ระบบลูกค้า</span>
            <span className="text-xs text-slate-300">/</span>
            <span className="text-sm font-black text-slate-900">{getPageTitle()}</span>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3 ml-auto">
            <Link href="/inquiry">
              <Button size="sm" variant="orange" className="h-9 px-4 text-xs font-black rounded-xl shadow-xs cursor-pointer">
                <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                ส่งลิงก์สั่งของ
              </Button>
            </Link>
            <Link href="/" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" className="h-9 px-3 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl">
                <Home className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                หน้าแรก
              </Button>
            </Link>
          </div>
        </header>

        {/* Mobile Sub Navigation */}
        <nav className="flex md:hidden bg-white border-b border-slate-200 overflow-x-auto px-2 py-1 gap-1">
          <Link 
            href="/dashboard" 
            className={`whitespace-nowrap px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
              pathname === '/dashboard' ? 'bg-blue-50 text-primary' : 'text-slate-600'
            }`}
          >
            ภาพรวม
          </Link>
          <Link 
            href="/dashboard/orders" 
            className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
              pathname.startsWith('/dashboard/orders') ? 'bg-blue-50 text-primary' : 'text-slate-600'
            }`}
          >
            คำสั่งซื้อ
            {(badgeCounts.ordersCount + badgeCounts.inquiriesCount) > 0 ? (
              <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {badgeCounts.ordersCount + badgeCounts.inquiriesCount}
              </span>
            ) : null}
          </Link>
          <Link 
            href="/dashboard/addresses" 
            className={`whitespace-nowrap px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
              pathname.startsWith('/dashboard/addresses') ? 'bg-blue-50 text-primary' : 'text-slate-600'
            }`}
          >
            สมุดที่อยู่
          </Link>
          <Link 
            href="/dashboard/profile" 
            className={`whitespace-nowrap px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
              pathname.startsWith('/dashboard/profile') ? 'bg-blue-50 text-primary' : 'text-slate-600'
            }`}
          >
            ข้อมูลส่วนตัว
          </Link>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      <PhoneSetupModal isOpen={showPhoneModal} onSuccess={() => setShowPhoneModal(false)} />
    </div>
  )
}

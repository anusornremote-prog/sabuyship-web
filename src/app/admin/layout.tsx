"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Users, FileQuestion, Package, Truck, LayoutDashboard, LogOut, Settings, Home, CircleDollarSign, ShieldCheck, Bell, FileSpreadsheet, ExternalLink } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { PhoneSetupModal } from "@/components/dashboard/PhoneSetupModal"
import { useEffect, useRef, useState } from "react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [adminEmail, setAdminEmail] = useState<string | null>(null)
  
  const [badgeCounts, setBadgeCounts] = useState({
    inquiriesCount: 0,
    ordersCount: 0,
    trackingCount: 0
  })

  useEffect(() => {
    const fetchAdminSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) {
          setAdminEmail(user.email)
        }
      } catch (err) {
        console.error("Failed to fetch admin user:", err)
      }
    }
    fetchAdminSession()
  }, [supabase])

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch('/api/admin/badge-counts')
        if (res.ok) {
          const data = await res.json()
          setBadgeCounts({
            inquiriesCount: data.inquiriesCount || 0,
            ordersCount: data.ordersCount || 0,
            trackingCount: data.trackingCount || 0
          })
        }
      } catch (error) {
        console.error("Failed to fetch badge counts:", error)
      }
    }
    
    fetchCounts()
  }, [pathname])



  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const getPageTitle = () => {
    if (pathname === '/admin') return 'ภาพรวมระบบ'
    if (pathname.startsWith('/admin/inquiries')) return 'คำขอราคา'
    if (pathname.startsWith('/admin/orders')) return 'คำสั่งซื้อ'
    if (pathname.startsWith('/admin/tracking')) return 'Tracking พัสดุ'
    if (pathname.startsWith('/admin/imports')) return 'ประวัติการนำเข้า Excel'
    if (pathname.startsWith('/admin/refunds')) return 'เงินคืน'
    if (pathname.startsWith('/admin/customers')) return 'จัดการลูกค้า'
    if (pathname.startsWith('/admin/audit')) return 'บันทึกประวัติ (Audit Log)'
    if (pathname.startsWith('/admin/notifications')) return 'การแจ้งเตือน'
    if (pathname.startsWith('/admin/settings')) return 'ตั้งค่าระบบ'
    return 'ระบบจัดการแอดมิน'
  }

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: "ภาพรวม" },
    { href: "/admin/inquiries", icon: FileQuestion, label: "คำขอราคา", badge: badgeCounts.inquiriesCount },
    { href: "/admin/orders", icon: Package, label: "คำสั่งซื้อ", badge: badgeCounts.ordersCount },
    { href: "/admin/tracking", icon: Truck, label: "Tracking", badge: badgeCounts.trackingCount },
    { href: "/admin/imports", icon: FileSpreadsheet, label: "ประวัติ Excel" },
    { href: "/admin/refunds", icon: CircleDollarSign, label: "เงินคืน" },
    { href: "/admin/customers", icon: Users, label: "ลูกค้า" },
    { href: "/admin/audit", icon: ShieldCheck, label: "Audit Log" },
    { href: "/admin/notifications", icon: Bell, label: "การแจ้งเตือน" },
    { href: "/admin/settings", icon: Settings, label: "ตั้งค่า" },
  ]

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Desktop Sidebar (Sticky to Viewport with Independent Scroll) */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col hidden md:flex sticky top-0 h-screen z-30">
        <div className="h-20 flex items-center justify-center px-4 border-b border-slate-800 bg-slate-950 shrink-0">
          <Link href="/admin" className="flex items-center justify-center w-full">
            <img src="/Sabuy_Ship_Express.png" alt="Sabuy Ship Express Logo" className="h-16 w-auto max-h-[64px] max-w-[220px] object-contain hover:scale-105 transition-transform" />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin')
            return (
              <Link 
                key={item.href}
                href={item.href} 
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                  isActive ? 'bg-primary text-white font-bold shadow-sm' : 'hover:bg-slate-800 hover:text-white font-medium text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span className="bg-rose-500 text-white text-xs font-black px-2 py-0.5 rounded-full animate-pulse">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Sticky Footer (Home & Logout) */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 shrink-0 space-y-1.5">
          <Link href="/" target="_blank" className="block">
            <Button variant="ghost" className="w-full justify-start text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/80 cursor-pointer h-9 rounded-lg">
              <Home className="mr-2 h-4 w-4 text-slate-400" />
              <span>เปิดหน้าบ้าน (เว็บไซต์)</span>
              <ExternalLink className="ml-auto h-3 w-3 opacity-60" />
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-xs font-bold text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 cursor-pointer h-9 rounded-lg border border-rose-900/30 transition-colors" 
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4 text-rose-400" />
            ออกจากระบบ
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-clip">
        {/* Desktop Top Header Bar with prominent Logout & Breadcrumb */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200 items-center justify-between px-6 lg:px-8 sticky top-0 z-20 shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-2xs">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
              ระบบแอดมิน
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-bold text-slate-800">{getPageTitle()}</span>
          </div>

          <div className="flex items-center gap-2.5">
            {adminEmail && (
              <span className="text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg hidden lg:inline-block">
                {adminEmail}
              </span>
            )}
            <Link href="/" target="_blank">
              <Button variant="outline" size="sm" className="h-9 px-3 text-xs font-semibold text-slate-600 hover:text-slate-900 border-slate-200 cursor-pointer rounded-lg">
                <Home className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                <span>หน้าบ้าน</span>
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout} 
              className="h-9 px-3.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 cursor-pointer rounded-lg shadow-2xs transition-colors"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5 text-rose-500" />
              <span>ออกจากระบบ</span>
            </Button>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-3 sm:px-4 md:hidden sticky top-0 z-30 shadow-sm shrink-0">
          <Link href="/admin" className="flex items-center gap-2">
            <img src="/Sabuy_Ship_Express.png" alt="Sabuy Ship" className="h-8 sm:h-9 w-auto object-contain" />
            <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-full">Admin</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-8 px-2 text-xs font-bold gap-1 cursor-pointer">
                <Home className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">หน้าบ้าน</span>
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout} 
              className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 h-8 px-2.5 text-xs cursor-pointer font-bold flex items-center gap-1.5 border border-rose-900/40 rounded-lg"
            >
              <LogOut className="h-3.5 w-3.5 text-rose-400" />
              <span>ออกจากระบบ</span>
            </Button>
          </div>
        </header>

        {/* Mobile Quick Navigation Tabs (Sticky Strip with Pill Badges) */}
        <nav className="flex md:hidden bg-slate-900 text-slate-300 border-b border-slate-800 overflow-x-auto scrollbar-none px-2 py-2 gap-1.5 sticky top-16 z-20 shadow-md shrink-0">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin')
            return (
              <Link 
                key={item.href}
                href={item.href} 
                className={`whitespace-nowrap px-3.5 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all shrink-0 ${
                  isActive 
                    ? 'bg-primary text-white shadow-md shadow-blue-600/30' 
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full ml-0.5">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            )
          })}
          <button
            onClick={handleLogout}
            className="whitespace-nowrap px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all shrink-0 bg-rose-950/40 text-rose-400 border border-rose-800/40 hover:bg-rose-900/50 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>ออกจากระบบ</span>
          </button>
        </nav>

        <main className="flex-1 p-3 sm:p-4 md:p-8 overflow-x-hidden">
          <PhoneSetupModal autoCheck />
          {children}
        </main>
      </div>
    </div>
  )
}

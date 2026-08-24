"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Users, FileQuestion, Package, Truck, LayoutDashboard, LogOut, Settings, Home, ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  
  const [badgeCounts, setBadgeCounts] = useState({
    inquiriesCount: 0,
    ordersCount: 0,
    trackingCount: 0
  })

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
  }

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: "ภาพรวม" },
    { href: "/admin/inquiries", icon: FileQuestion, label: "คำขอราคา", badge: badgeCounts.inquiriesCount },
    { href: "/admin/orders", icon: Package, label: "คำสั่งซื้อ", badge: badgeCounts.ordersCount },
    { href: "/admin/tracking", icon: Truck, label: "Tracking", badge: badgeCounts.trackingCount },
    { href: "/admin/customers", icon: Users, label: "ลูกค้า" },
    { href: "/admin/settings", icon: Settings, label: "ตั้งค่า" },
  ]

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Desktop Sidebar (100% Intact) */}
      <aside className="w-64 border-r bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col hidden md:flex">
        <div className="h-20 flex items-center justify-center px-4 border-b border-slate-800 bg-slate-950">
          <Link href="/admin" className="flex items-center justify-center w-full">
            <img src="/Sabuy_Ship_Express.png" alt="Sabuy Ship Express Logo" className="h-16 w-auto max-h-[64px] max-w-[220px] object-contain hover:scale-105 transition-transform" />
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
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
        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer" onClick={handleLogout}>
            <LogOut className="mr-2 h-5 w-5" />
            ออกจากระบบ
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col max-w-full overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 md:hidden sticky top-0 z-30 shadow-sm">
          <Link href="/admin" className="flex items-center gap-2">
            <img src="/Sabuy_Ship_Express.png" alt="Sabuy Ship" className="h-9 w-auto object-contain" />
            <span className="text-[11px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-full">Admin</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-9 px-2 text-xs font-bold gap-1 cursor-pointer">
                <Home className="h-4 w-4" />
                <span>หน้าบ้าน</span>
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 h-9 px-2 text-xs cursor-pointer font-bold">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Mobile Quick Navigation Tabs (Sticky Strip with Pill Badges) */}
        <nav className="flex md:hidden bg-slate-900 text-slate-300 border-b border-slate-800 overflow-x-auto scrollbar-none px-2 py-2 gap-1.5 sticky top-16 z-20 shadow-md">
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
        </nav>

        <main className="flex-1 p-3 sm:p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ShieldAlert, Users, FileQuestion, FileText, Package, Truck, LayoutDashboard, LogOut, Settings, Home } from "lucide-react"
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
  }, [pathname]) // Refresh counts every time pathname changes

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: "ภาพรวม" },
    { href: "/admin/customers", icon: Users, label: "ลูกค้า" },
    { href: "/admin/inquiries", icon: FileQuestion, label: "คำขอประเมินราคา", badge: badgeCounts.inquiriesCount },
    { href: "/admin/orders", icon: Package, label: "คำสั่งซื้อ", badge: badgeCounts.ordersCount },
    { href: "/admin/tracking", icon: Truck, label: "จัดการ Tracking", badge: badgeCounts.trackingCount },
    { href: "/admin/settings", icon: Settings, label: "ตั้งค่า" },
  ]

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950 overflow-visible">
          <div className="relative w-full h-full shrink-0">
            <Link href="/admin" className="absolute -top-[36px] -left-2 z-50">
              <img src="/Sabuy_Ship_Express.png" alt="Sabuy Ship Express Logo" className="h-32 w-auto object-contain drop-shadow-md origin-top-left" />
            </Link>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href} 
              className={`flex items-center justify-between px-3 py-2 rounded-md transition-colors ${pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin') ? 'bg-primary text-white font-medium' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5" />
                {item.label}
              </div>
              {item.badge ? (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800" onClick={handleLogout}>
            <LogOut className="mr-2 h-5 w-5" />
            ออกจากระบบ
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-full overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 md:hidden overflow-visible relative">
          <div className="relative w-40 h-full shrink-0">
            <Link href="/admin" className="absolute -top-[36px] -left-2.5 z-50">
              <img src="/Sabuy_Ship_Express.png" alt="Sabuy Ship Express Logo" className="h-32 w-auto object-contain drop-shadow-md origin-top-left" />
            </Link>
          </div>
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-slate-400">
               <Home className="h-5 w-5" />
            </Button>
          </Link>
        </header>

        {/* Mobile Nav */}
        <nav className="flex md:hidden bg-slate-800 text-slate-300 border-b border-slate-700 overflow-x-auto">
          {navItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href} 
              className={`whitespace-nowrap px-4 py-3 flex items-center gap-2 text-sm transition-colors ${pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin') ? 'border-b-2 border-primary text-white font-medium bg-slate-900' : 'hover:bg-slate-700'}`}
            >
              {item.label}
              {item.badge ? (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          ))}
          <button onClick={handleLogout} className="whitespace-nowrap flex items-center gap-2 px-4 py-3 text-sm transition-colors text-red-400 hover:bg-slate-700 font-medium">
            <LogOut className="h-4 w-4" />
            ออกจากระบบ
          </button>
        </nav>

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

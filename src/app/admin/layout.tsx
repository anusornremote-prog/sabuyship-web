"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ShieldAlert, Users, FileQuestion, FileText, Package, Truck, LayoutDashboard, LogOut, Settings } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: "ภาพรวม" },
    { href: "/admin/customers", icon: Users, label: "ลูกค้า" },
    { href: "/admin/inquiries", icon: FileQuestion, label: "คำขอประเมินราคา" },
    { href: "/admin/quotations", icon: FileText, label: "ใบเสนอราคา" },
    { href: "/admin/orders", icon: Package, label: "คำสั่งซื้อ" },
    { href: "/admin/tracking", icon: Truck, label: "จัดการ Tracking" },
    { href: "/admin/settings", icon: Settings, label: "ตั้งค่า" },
  ]

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
          <Link href="/admin" className="flex items-center gap-2 text-white">
            <ShieldAlert className="h-6 w-6 text-orange-500" />
            <span className="font-bold text-lg tracking-tight">Sabuy Admin</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href} 
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin') ? 'bg-primary text-white font-medium' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
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
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 md:hidden">
          <Link href="/admin" className="flex items-center gap-2 text-white">
            <ShieldAlert className="h-6 w-6 text-orange-500" />
            <span className="font-bold text-lg">Sabuy Admin</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400">
             <LogOut className="h-5 w-5" />
          </Button>
        </header>

        {/* Mobile Nav */}
        <nav className="flex md:hidden bg-slate-800 text-slate-300 border-b border-slate-700 overflow-x-auto">
          {navItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href} 
              className={`whitespace-nowrap px-4 py-3 text-sm transition-colors ${pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin') ? 'border-b-2 border-primary text-white font-medium bg-slate-900' : 'hover:bg-slate-700'}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

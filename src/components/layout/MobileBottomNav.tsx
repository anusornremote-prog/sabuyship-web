"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Package, Plus, MessageCircle, User, Search, ShoppingBag } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useTranslation } from "@/components/providers/language-provider"

export function MobileBottomNav() {
  const pathname = usePathname()
  const { locale } = useTranslation()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [badgeCount, setBadgeCount] = useState<number>(0)

  useEffect(() => {
    const checkAuthAndBadge = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setIsLoggedIn(true)
          // Fetch active orders count waiting payment
          const { count } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("customer_id", user.id)
            .eq("status", "WAITING_PAYMENT")
          
          if (count && count > 0) {
            setBadgeCount(count)
          }
        } else {
          setIsLoggedIn(false)
        }
      } catch (e) {
        console.error("Error in MobileBottomNav auth check:", e)
      }
    }
    checkAuthAndBadge()
  }, [pathname])

  // Don't render on admin pages or printable invoice pages
  if (pathname.startsWith("/admin") || pathname.includes("/invoice")) {
    return null
  }

  const isHomeActive = pathname === "/"
  const isOrdersActive = pathname.startsWith("/dashboard/orders") || pathname === "/track"
  const isInquiryActive = pathname === "/inquiry"
  const isProfileActive = pathname.startsWith("/dashboard") && !pathname.startsWith("/dashboard/orders") || pathname === "/login" || pathname === "/register"

  const lineUrl = process.env.NEXT_PUBLIC_LINE_OA_URL || "https://line.me/ti/p/~@sabuyship"

  const labelHome = locale === 'en' ? 'Home' : locale === 'zh' ? '首页' : 'หน้าแรก'
  const labelOrders = locale === 'en' ? 'Orders' : locale === 'zh' ? '订单/追踪' : 'ติดตาม/บิล'
  const labelSubmit = locale === 'en' ? 'Quote' : locale === 'zh' ? '询价' : 'ส่งลิงก์'
  const labelLine = locale === 'en' ? 'Chat' : locale === 'zh' ? '客服' : 'แชทไลน์'
  const labelAccount = locale === 'en' ? (isLoggedIn ? 'Account' : 'Login') : locale === 'zh' ? (isLoggedIn ? '我的' : '登录') : (isLoggedIn ? 'บัญชีฉัน' : 'เข้าสู่ระบบ')

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 block md:hidden pointer-events-auto">
      {/* Subtle top glow blur & shadow */}
      <div className="relative bg-white/92 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-8px_25px_rgba(0,0,0,0.06)] pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5 px-3">
        <nav className="flex items-center justify-around max-w-lg mx-auto relative">
          
          {/* 1. Home Button */}
          <Link 
            href="/" 
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 ${
              isHomeActive ? "text-primary font-black" : "text-slate-500 hover:text-slate-900 font-semibold"
            }`}
          >
            <div className="relative p-1">
              <Home className={`w-5 h-5 transition-transform ${isHomeActive ? "scale-110 stroke-[2.5]" : "stroke-[1.8]"}`} />
              {isHomeActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-in fade-in zoom-in-75 duration-200" />
              )}
            </div>
            <span className="text-[11px] tracking-tight mt-0.5">{labelHome}</span>
          </Link>

          {/* 2. Orders / Track Button */}
          <Link 
            href={isLoggedIn ? "/dashboard/orders" : "/track"} 
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 relative ${
              isOrdersActive ? "text-primary font-black" : "text-slate-500 hover:text-slate-900 font-semibold"
            }`}
          >
            <div className="relative p-1">
              <Package className={`w-5 h-5 transition-transform ${isOrdersActive ? "scale-110 stroke-[2.5]" : "stroke-[1.8]"}`} />
              {badgeCount > 0 && (
                <span className="absolute -top-0.5 -right-1 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                  {badgeCount}
                </span>
              )}
              {isOrdersActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-in fade-in zoom-in-75 duration-200" />
              )}
            </div>
            <span className="text-[11px] tracking-tight mt-0.5">{labelOrders}</span>
          </Link>

          {/* 3. Center Elevated FAB Button: Submit Link / Quote */}
          <div className="flex-1 flex flex-col items-center justify-center -mt-6">
            <Link 
              href="/inquiry"
              className="relative group transition-transform active:scale-90"
              title={labelSubmit}
            >
              {/* Outer soft glowing ring */}
              <div className="absolute -inset-1.5 bg-gradient-to-tr from-orange-600 to-amber-400 rounded-full opacity-40 group-hover:opacity-75 blur-xs transition-opacity animate-pulse" />
              
              {/* Main Button */}
              <div className="relative w-13 h-13 rounded-full bg-gradient-to-tr from-orange-500 via-orange-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/35 border-2 border-white">
                <Plus className="w-7 h-7 stroke-[3] transition-transform group-hover:rotate-90 duration-300" />
              </div>
            </Link>
            <span className={`text-[11px] tracking-tight font-black mt-1 ${isInquiryActive ? "text-orange-600" : "text-slate-700"}`}>
              {labelSubmit}
            </span>
          </div>

          {/* 4. LINE Official Chat Button */}
          <a 
            href={lineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 hover:text-emerald-600 font-semibold transition-all active:scale-90"
          >
            <div className="relative p-1">
              <MessageCircle className="w-5 h-5 text-emerald-600 stroke-[2]" />
            </div>
            <span className="text-[11px] tracking-tight mt-0.5">{labelLine}</span>
          </a>

          {/* 5. Account / Login Button */}
          <Link 
            href={isLoggedIn ? "/dashboard" : "/login"} 
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 ${
              isProfileActive ? "text-primary font-black" : "text-slate-500 hover:text-slate-900 font-semibold"
            }`}
          >
            <div className="relative p-1">
              <User className={`w-5 h-5 transition-transform ${isProfileActive ? "scale-110 stroke-[2.5]" : "stroke-[1.8]"}`} />
              {isProfileActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-in fade-in zoom-in-75 duration-200" />
              )}
            </div>
            <span className="text-[11px] tracking-tight mt-0.5">{labelAccount}</span>
          </Link>

        </nav>
      </div>
    </div>
  )
}

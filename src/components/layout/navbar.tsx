"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X, ChevronDown, User, Package, MapPin, FileQuestion, LogOut, ShieldCheck, Users, Bell } from "lucide-react"
import { useTranslation } from "@/components/providers/language-provider"
import { LanguageSwitcher } from "./language-switcher"
import { NotificationBell } from "./NotificationBell"
import { PhoneSetupModal } from "@/components/dashboard/PhoneSetupModal"
import { useRouter } from "next/navigation"
import { hasSupabaseSessionCookie } from "@/lib/browser-session"
import { getCustomerDisplayName, isSyntheticLineEmail } from "@/lib/display-name"

export function Navbar() {
  const { t, locale, setLanguage } = useTranslation()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profileName, setProfileName] = useState<string | null>(null)
  const [profileRole, setProfileRole] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchUser = async () => {
      try {
        if (!hasSupabaseSessionCookie()) return
        const { createClient } = await import("@/lib/supabase/client")
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!cancelled) setUser(session?.user || null)
        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, role")
            .eq("id", session.user.id)
            .maybeSingle()
          if (!cancelled && profile) {
            if (profile.full_name) setProfileName(profile.full_name)
            if (profile.role) setProfileRole(profile.role)
          }
        }
      } catch (err) {
        console.error("Error fetching user in navbar:", err)
      }
    }

    const timeoutId = window.setTimeout(fetchUser, 250)
    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [])

  const isAdmin = profileRole === "ADMIN"

  const resolvedDisplayName = getCustomerDisplayName({
    profileName,
    userMetadata: user?.user_metadata,
    email: user?.email,
    phone: user?.phone,
    fallback: "",
  })
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture

  const getDashboardLabel = () => {
    if (resolvedDisplayName) {
      return locale === 'en'
        ? `Hi, ${resolvedDisplayName}`
        : locale === 'zh'
          ? `你好, ${resolvedDisplayName}`
          : `สวัสดีคุณ ${resolvedDisplayName}`
    }

    return locale === 'en' ? 'Dashboard' : locale === 'zh' ? '控制台' : 'บัญชีของฉัน'
  }

  const dashboardLabel = getDashboardLabel()

  // Close dropdown and mobile drawer on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDropdownOpen && !(event.target as Element).closest('.user-dropdown')) {
        setIsDropdownOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false)
        setIsOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isDropdownOpen])

  const handleLogout = async () => {
    setIsDropdownOpen(false)
    const { createClient } = await import("@/lib/supabase/client")
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-[60] w-full border-b border-blue-100/70 bg-white/82 shadow-[0_8px_35px_rgba(30,58,138,0.055)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/72">
      <div className="site-container flex h-[4.75rem] items-center justify-between sm:h-20">
        {/* 1. Left: Logo */}
        <div className="flex items-center shrink-0">
          <Link href="/" className="flex items-center">
            <Image
              src="/Sabuy_Ship_Express.webp"
              alt="Sabuy Ship Express Logo"
              width={200}
              height={81}
              sizes="(max-width: 639px) 119px, (max-width: 767px) 139px, 159px"
              fetchPriority="high"
              className="h-12 w-auto object-contain transition-transform duration-300 hover:scale-[1.03] sm:h-14 md:h-[3.75rem]"
            />
          </Link>
        </div>

        {/* 2. Center: Balanced Navigation Links */}
        <nav className="hidden items-center justify-center gap-1 rounded-full border border-slate-200/80 bg-slate-50/80 p-1.5 text-sm font-bold xl:flex">
          <Link href="/how-it-works" className="whitespace-nowrap rounded-full px-4 py-2 text-slate-600 transition hover:bg-white hover:text-primary hover:shadow-sm">
            {t.navHowItWorks}
          </Link>
          <Link href="/pricing" className="whitespace-nowrap rounded-full px-4 py-2 text-slate-600 transition hover:bg-white hover:text-primary hover:shadow-sm">
            {t.navPricing}
          </Link>
          <Link href="/track" className="whitespace-nowrap rounded-full px-4 py-2 text-slate-600 transition hover:bg-white hover:text-primary hover:shadow-sm">
            {t.navTrack}
          </Link>
          <Link href="/faq" className="whitespace-nowrap rounded-full px-4 py-2 text-slate-600 transition hover:bg-white hover:text-primary hover:shadow-sm">
            {t.navFaq}
          </Link>
          <Link href="/contact" className="whitespace-nowrap rounded-full px-4 py-2 text-slate-600 transition hover:bg-white hover:text-primary hover:shadow-sm">
            {t.navContact}
          </Link>
        </nav>

        {/* 3. Right: Language Switcher, Login, Submit Button */}
        <div className="hidden xl:flex items-center gap-3 shrink-0">
          {!user && <LanguageSwitcher />}
          {user && !isAdmin && <NotificationBell />}
          {user ? (
            <div className="relative user-dropdown">
              <Button
                variant="ghost"
                aria-expanded={isDropdownOpen}
                aria-haspopup="menu"
                className="font-bold text-primary flex items-center gap-1.5 h-10 px-3 hover:bg-slate-100/80 rounded-xl"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    {isAdmin ? <ShieldCheck className="h-4 w-4" aria-hidden="true" /> : <User className="h-4 w-4" aria-hidden="true" />}
                  </div>
                )}
                <span>{dashboardLabel}</span>
                <ChevronDown className="h-4 w-4 ml-1" aria-hidden="true" />
              </Button>
              {isDropdownOpen && (
                <div role="menu" className="absolute right-0 z-50 mt-3 w-64 rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
                  {isAdmin ? (
                    <>
                      <div className="px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-primary">
                        ผู้ดูแลระบบ (Admin)
                      </div>
                      <Link role="menuitem" href="/admin" className="flex min-h-10 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors" onClick={() => setIsDropdownOpen(false)}>
                        <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" /> ศูนย์ควบคุมแอดมิน
                      </Link>
                      <Link role="menuitem" href="/admin/orders" className="flex min-h-10 items-center gap-2 rounded-lg px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors" onClick={() => setIsDropdownOpen(false)}>
                        <Package className="h-4 w-4" aria-hidden="true" /> จัดการคำสั่งซื้อ
                      </Link>
                      <Link role="menuitem" href="/admin/customers" className="flex min-h-10 items-center gap-2 rounded-lg px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors" onClick={() => setIsDropdownOpen(false)}>
                        <Users className="h-4 w-4" aria-hidden="true" /> จัดการลูกค้า
                      </Link>
                      <Link role="menuitem" href="/admin/notifications" className="flex min-h-10 items-center gap-2 rounded-lg px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors" onClick={() => setIsDropdownOpen(false)}>
                        <Bell className="h-4 w-4" aria-hidden="true" /> การแจ้งเตือน LINE
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link role="menuitem" href="/dashboard" className="flex min-h-10 items-center gap-2 rounded-lg px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors" onClick={() => setIsDropdownOpen(false)}>
                        <User className="h-4 w-4" aria-hidden="true" /> {t.navOverview}
                      </Link>
                      <Link role="menuitem" href="/dashboard/orders" className="flex min-h-10 items-center gap-2 rounded-lg px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors" onClick={() => setIsDropdownOpen(false)}>
                        <Package className="h-4 w-4" aria-hidden="true" /> {t.navMyOrders}
                      </Link>
                      <Link role="menuitem" href="/dashboard/addresses" className="flex min-h-10 items-center gap-2 rounded-lg px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors" onClick={() => setIsDropdownOpen(false)}>
                        <MapPin className="h-4 w-4" aria-hidden="true" /> {t.navAddresses}
                      </Link>
                      <Link role="menuitem" href="/dashboard/profile" className="flex min-h-10 items-center gap-2 rounded-lg px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors" onClick={() => setIsDropdownOpen(false)}>
                        <User className="h-4 w-4" aria-hidden="true" /> {t.navProfile}
                      </Link>
                      <div className="border-t my-1"></div>
                      <Link role="menuitem" href="/inquiry" className="flex min-h-10 items-center gap-2 rounded-lg px-4 py-2 text-sm text-primary font-medium hover:bg-slate-50 transition-colors" onClick={() => setIsDropdownOpen(false)}>
                        <FileQuestion className="h-4 w-4" aria-hidden="true" /> {t.navRequestQuote}
                      </Link>
                    </>
                  )}
                  <div className="border-t my-1"></div>
                  <div className="px-4 py-2">
                    <span className="text-xs text-slate-500 font-semibold mb-2 block">เปลี่ยนภาษา / Language</span>
                    <div className="flex gap-1.5">
                      <button type="button" onClick={(e) => { e.preventDefault(); setLanguage('th'); setIsDropdownOpen(false) }} className={`flex items-center justify-center gap-1.5 flex-1 text-center py-2 rounded text-xs transition-colors cursor-pointer ${locale === 'th' ? 'bg-primary text-white font-bold shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                        <img src="https://flagcdn.com/w20/th.png" srcSet="https://flagcdn.com/w40/th.png 2x" width="16" height="11" alt="TH" /> TH
                      </button>
                      <button type="button" onClick={(e) => { e.preventDefault(); setLanguage('en'); setIsDropdownOpen(false) }} className={`flex items-center justify-center gap-1.5 flex-1 text-center py-2 rounded text-xs transition-colors cursor-pointer ${locale === 'en' ? 'bg-primary text-white font-bold shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                        <img src="https://flagcdn.com/w20/us.png" srcSet="https://flagcdn.com/w40/us.png 2x" width="16" height="11" alt="EN" /> EN
                      </button>
                      <button type="button" onClick={(e) => { e.preventDefault(); setLanguage('zh'); setIsDropdownOpen(false) }} className={`flex items-center justify-center gap-1.5 flex-1 text-center py-2 rounded text-xs transition-colors cursor-pointer ${locale === 'zh' ? 'bg-primary text-white font-bold shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                        <img src="https://flagcdn.com/w20/cn.png" srcSet="https://flagcdn.com/w40/cn.png 2x" width="16" height="11" alt="ZH" /> ZH
                      </button>
                    </div>
                  </div>
                  <div className="border-t my-1"></div>
                  <button type="button" role="menuitem" onClick={handleLogout} className="w-full flex min-h-10 items-center gap-2 rounded-lg px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer">
                    <LogOut className="h-4 w-4" aria-hidden="true" /> {t.navLogout}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login">
              <Button variant="ghost" className="font-semibold text-sm px-3 whitespace-nowrap">{t.navLogin}</Button>
            </Link>
          )}

          <Link href={isAdmin ? "/admin" : "/dashboard/orders"}>
            <Button
              size="sm"
              variant="orange"
              className="font-black text-xs sm:text-sm px-3.5 lg:px-4 h-10 shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              {isAdmin ? (
                <>
                  <ShieldCheck className="w-4 h-4 mr-1.5 shrink-0" aria-hidden="true" />
                  <span>ระบบแอดมิน</span>
                </>
              ) : (
                <>
                  <Package className="w-4 h-4 mr-1.5 shrink-0" aria-hidden="true" />
                  <span>{t.navMyOrders || "คำสั่งซื้อของฉัน"}</span>
                </>
              )}
            </Button>
          </Link>
        </div>

        {/* Mobile Navigation Toggle & Switcher */}
        <div className="flex xl:hidden items-center gap-1.5">
          {!user && <LanguageSwitcher />}
          {user && !isAdmin && <NotificationBell />}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="min-h-11 min-w-11 inline-flex items-center justify-center p-2 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
            aria-label="เปิด/ปิดเมนู"
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div className="relative z-[60] max-h-[calc(100dvh-4.75rem)] space-y-4 overflow-y-auto overscroll-contain touch-pan-y border-b border-blue-100 bg-white/96 px-4 py-5 pb-28 shadow-2xl shadow-blue-950/10 backdrop-blur-xl animate-in slide-in-from-top duration-200 xl:hidden">
          <Link href={isAdmin ? "/admin" : "/dashboard/orders"} onClick={() => setIsOpen(false)}>
            <Button variant="orange" className="w-full font-bold h-12 text-base shadow-md shadow-orange-500/20 mb-2 cursor-pointer">
              {isAdmin ? (
                <>
                  <ShieldCheck className="w-5 h-5 mr-2" aria-hidden="true" />
                  ระบบแอดมิน
                </>
              ) : (
                <>
                  <Package className="w-5 h-5 mr-2" aria-hidden="true" />
                  {t.navMyOrders || "คำสั่งซื้อของฉัน"}
                </>
              )}
            </Button>
          </Link>

          <div className="flex flex-col gap-2">
            {user ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-slate-50 rounded-xl border border-slate-100">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-white shadow-sm">
                      {isAdmin ? <ShieldCheck className="h-6 w-6 text-primary" aria-hidden="true" /> : <User className="h-6 w-6 text-primary" aria-hidden="true" />}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900 line-clamp-1">
                      {resolvedDisplayName || 'ผู้ใช้งาน'}
                    </span>
                    <span className="text-xs text-slate-500 line-clamp-1">
                      {isAdmin ? 'ผู้ดูแลระบบ (ADMIN)' : !isSyntheticLineEmail(user.email) ? user.email || user.phone : user.phone || 'เชื่อมต่อผ่าน LINE'}
                    </span>
                  </div>
                </div>

                {isAdmin ? (
                  <>
                    <Link href="/admin" onClick={() => setIsOpen(false)} className="flex min-h-11 items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-50 text-slate-700 font-semibold transition-colors">
                      <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" /> ศูนย์ควบคุมแอดมิน
                    </Link>
                    <Link href="/admin/orders" onClick={() => setIsOpen(false)} className="flex min-h-11 items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-50 text-slate-700 font-medium transition-colors">
                      <Package className="h-5 w-5 text-primary" aria-hidden="true" /> จัดการคำสั่งซื้อ
                    </Link>
                    <Link href="/admin/customers" onClick={() => setIsOpen(false)} className="flex min-h-11 items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-50 text-slate-700 font-medium transition-colors">
                      <Users className="h-5 w-5 text-primary" aria-hidden="true" /> จัดการลูกค้า
                    </Link>
                    <Link href="/admin/notifications" onClick={() => setIsOpen(false)} className="flex min-h-11 items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-50 text-slate-700 font-medium transition-colors">
                      <Bell className="h-5 w-5 text-primary" aria-hidden="true" /> การแจ้งเตือน LINE
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/dashboard" onClick={() => setIsOpen(false)} className="flex min-h-11 items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-50 text-slate-700 font-medium transition-colors">
                      <User className="h-5 w-5 text-primary" aria-hidden="true" /> {t.navDashboard}
                    </Link>
                    <Link href="/dashboard/orders" onClick={() => setIsOpen(false)} className="flex min-h-11 items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-50 text-slate-700 font-medium transition-colors">
                      <Package className="h-5 w-5 text-primary" aria-hidden="true" /> {t.navMyOrders}
                    </Link>
                    <Link href="/dashboard/addresses" onClick={() => setIsOpen(false)} className="flex min-h-11 items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-50 text-slate-700 font-medium transition-colors">
                      <MapPin className="h-5 w-5 text-primary" aria-hidden="true" /> {t.navAddresses}
                    </Link>
                    <Link href="/dashboard/profile" onClick={() => setIsOpen(false)} className="flex min-h-11 items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-50 text-slate-700 font-medium transition-colors">
                      <User className="h-5 w-5 text-primary" aria-hidden="true" /> {t.navProfile}
                    </Link>
                    <Link href="/inquiry" onClick={() => setIsOpen(false)} className="flex min-h-11 items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-50 text-primary font-bold transition-colors bg-primary/5">
                      <FileQuestion className="h-5 w-5" aria-hidden="true" /> {t.navRequestQuote}
                    </Link>
                  </>
                )}
              </div>
            ) : (
              <Link href="/login" onClick={() => setIsOpen(false)} className="w-full">
                <Button className="w-full justify-center h-12 text-base shadow-sm">{t.navLogin}</Button>
              </Link>
            )}
          </div>

          <div className="pt-4 border-t">
            <nav className="flex flex-col gap-1">
              <Link
                href="/how-it-works"
                onClick={() => setIsOpen(false)}
                className="flex min-h-11 items-center rounded-lg px-2 text-sm font-medium hover:bg-slate-50 hover:text-primary transition-colors"
              >
                {t.navHowItWorks}
              </Link>
              <Link
                href="/pricing"
                onClick={() => setIsOpen(false)}
                className="flex min-h-11 items-center rounded-lg px-2 text-sm font-medium hover:bg-slate-50 hover:text-primary transition-colors"
              >
                {t.navPricing}
              </Link>
              <Link
                href="/track"
                onClick={() => setIsOpen(false)}
                className="flex min-h-11 items-center rounded-lg px-2 text-sm font-medium hover:bg-slate-50 hover:text-primary transition-colors"
              >
                {t.navTrack}
              </Link>
              <Link
                href="/faq"
                onClick={() => setIsOpen(false)}
                className="flex min-h-11 items-center rounded-lg px-2 text-sm font-medium hover:bg-slate-50 hover:text-primary transition-colors"
              >
                {t.navFaq}
              </Link>
              <Link
                href="/contact"
                onClick={() => setIsOpen(false)}
                className="flex min-h-11 items-center rounded-lg px-2 text-sm font-medium hover:bg-slate-50 hover:text-primary transition-colors"
              >
                {t.navContact}
              </Link>
            </nav>
          </div>

          <div className="px-4 py-4 mt-2 border-t">
            <span className="text-xs text-slate-500 font-semibold mb-3 block text-center">เปลี่ยนภาษา / Language</span>
            <div className="flex gap-2 justify-center">
              <button type="button" onClick={(e) => { e.preventDefault(); setLanguage('th'); setIsOpen(false) }} className={`flex min-h-11 items-center justify-center gap-1.5 flex-1 text-center py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${locale === 'th' ? 'bg-primary text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                <img src="https://flagcdn.com/w20/th.png" srcSet="https://flagcdn.com/w40/th.png 2x" width="16" height="11" alt="TH" /> TH
              </button>
              <button type="button" onClick={(e) => { e.preventDefault(); setLanguage('en'); setIsOpen(false) }} className={`flex min-h-11 items-center justify-center gap-1.5 flex-1 text-center py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${locale === 'en' ? 'bg-primary text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                <img src="https://flagcdn.com/w20/us.png" srcSet="https://flagcdn.com/w40/us.png 2x" width="16" height="11" alt="EN" /> EN
              </button>
              <button type="button" onClick={(e) => { e.preventDefault(); setLanguage('zh'); setIsOpen(false) }} className={`flex min-h-11 items-center justify-center gap-1.5 flex-1 text-center py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${locale === 'zh' ? 'bg-primary text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                <img src="https://flagcdn.com/w20/cn.png" srcSet="https://flagcdn.com/w40/cn.png 2x" width="16" height="11" alt="ZH" /> ZH
              </button>
            </div>
          </div>

          {user && (
            <div className="border-t">
              <button type="button" onClick={() => { handleLogout(); setIsOpen(false); }} className="w-full flex min-h-11 items-center justify-center gap-2 px-4 py-3 mt-1 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                <LogOut className="h-5 w-5" aria-hidden="true" /> {t.navLogout}
              </button>
            </div>
          )}
        </div>
      )}
      {user && <PhoneSetupModal autoCheck />}
    </header>
  )
}

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Ship, Menu, X, ChevronDown, User, Package, MapPin, FileText, FileQuestion, LogOut } from "lucide-react"
import { useTranslation } from "@/components/providers/language-provider"
import { LanguageSwitcher } from "./language-switcher"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function Navbar() {
  const { t, locale } = useTranslation()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUser(user)
          const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
          setProfile(data)
        }
      } catch (err) {
        console.error("Error fetching user in navbar:", err)
      }
    }
    fetchUser()
  }, [])

  const getDashboardLabel = () => {
    // 1. Try to get name from profile
    let name = profile?.full_name
    
    // 2. Try user metadata
    if (!name && user?.user_metadata?.full_name) {
      name = user.user_metadata.full_name
    }
    
    // 3. Try email or phone
    if (!name) {
      if (user?.email) {
        name = user.email.split('@')[0]
      } else if (user?.phone) {
        name = user.phone
      }
    }
    
    // If we have any name/identifier, use it
    if (name && name.trim() !== '') {
      return locale === 'en' ? `Hi, ${name}` : locale === 'zh' ? `你好, ${name}` : `สวัสดีคุณ ${name}`
    }
    
    // Fallback if absolutely nothing is available
    return locale === 'en' ? 'Dashboard' : locale === 'zh' ? '控制台' : 'ชื่อลูกค้า' // fallback to "ชื่อลูกค้า" instead of Dashboard as requested
  }
  
  const dashboardLabel = getDashboardLabel()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDropdownOpen && !(event.target as Element).closest('.user-dropdown')) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isDropdownOpen])

  const handleLogout = async () => {
    setIsDropdownOpen(false)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-24 items-center justify-between px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex items-center">
          <div className="relative w-40 md:w-56 h-full">
            <Link href="/" className="absolute -top-12 left-0 z-50">
              <img src="/Main.png" alt="Sabuy Ship Logo" className="h-48 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform origin-top-left" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-12 text-lg font-semibold">
            <Link href="/how-it-works" className="transition-colors hover:text-primary">
              {t.navHowItWorks}
            </Link>
            <Link href="/pricing" className="transition-colors hover:text-primary">
              {t.navPricing}
            </Link>
            <Link href="/track" className="transition-colors hover:text-primary">
              {t.navTrack}
            </Link>
            <Link href="/contact" className="transition-colors hover:text-primary">
              {t.navContact}
            </Link>
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher />
          {user ? (
            <div className="relative user-dropdown">
              <Button 
                variant="ghost" 
                className="font-bold text-primary flex items-center gap-1"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {dashboardLabel} <ChevronDown className="h-4 w-4" />
              </Button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-slate-100 py-1 z-50">
                  <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors" onClick={() => setIsDropdownOpen(false)}>
                    <User className="h-4 w-4" /> ภาพรวม
                  </Link>
                  <Link href="/dashboard/orders" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors" onClick={() => setIsDropdownOpen(false)}>
                    <Package className="h-4 w-4" /> คำสั่งซื้อ
                  </Link>
                  <Link href="/dashboard/inquiries" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors" onClick={() => setIsDropdownOpen(false)}>
                    <FileText className="h-4 w-4" /> ประวัติการขอราคา
                  </Link>
                  <Link href="/dashboard/addresses" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors" onClick={() => setIsDropdownOpen(false)}>
                    <MapPin className="h-4 w-4" /> สมุดที่อยู่
                  </Link>
                  <Link href="/dashboard/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors" onClick={() => setIsDropdownOpen(false)}>
                    <User className="h-4 w-4" /> ข้อมูลส่วนตัว
                  </Link>
                  <div className="border-t my-1"></div>
                  <Link href="/inquiry" className="flex items-center gap-2 px-4 py-2 text-sm text-primary font-medium hover:bg-slate-50 transition-colors" onClick={() => setIsDropdownOpen(false)}>
                    <FileQuestion className="h-4 w-4" /> ขอใบเสนอราคา
                  </Link>
                  <div className="border-t my-1"></div>
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer">
                    <LogOut className="h-4 w-4" /> ออกจากระบบ
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login">
              <Button variant="ghost">{t.navLogin}</Button>
            </Link>
          )}
        </div>

        {/* Mobile Navigation Toggle & Switcher */}
        <div className="flex md:hidden items-center gap-2">
          <LanguageSwitcher />
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="p-2 text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div className="md:hidden border-b bg-background px-4 py-4 space-y-4 animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col gap-4">
            <Link 
              href="/how-it-works" 
              onClick={() => setIsOpen(false)}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              {t.navHowItWorks}
            </Link>
            <Link 
              href="/pricing" 
              onClick={() => setIsOpen(false)}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              {t.navPricing}
            </Link>
            <Link 
              href="/track" 
              onClick={() => setIsOpen(false)}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              {t.navTrack}
            </Link>
            <Link 
              href="/contact" 
              onClick={() => setIsOpen(false)}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              {t.navContact}
            </Link>
          </nav>
          <div className="pt-4 border-t flex flex-col gap-2">
            {user ? (
              <Link href="/dashboard" onClick={() => setIsOpen(false)} className="w-full">
                <Button variant="ghost" className="w-full justify-center font-bold text-primary">{dashboardLabel}</Button>
              </Link>
            ) : (
              <Link href="/login" onClick={() => setIsOpen(false)} className="w-full">
                <Button variant="ghost" className="w-full justify-center">{t.navLogin}</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

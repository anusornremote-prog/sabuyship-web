"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Ship, Menu, X } from "lucide-react"
import { useTranslation } from "@/components/providers/language-provider"
import { LanguageSwitcher } from "./language-switcher"
import { createClient } from "@/lib/supabase/client"

export function Navbar() {
  const { t, locale } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
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

  const dashboardLabel = profile?.full_name 
    ? (locale === 'en' ? `Hi, ${profile.full_name}` : locale === 'zh' ? `你好, ${profile.full_name}` : `สวัสดีคุณ ${profile.full_name}`)
    : (locale === 'en' ? 'Dashboard' : locale === 'zh' ? '控制台' : 'แดชบอร์ด')

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Sabuy Ship Logo" className="h-10 w-auto object-contain" />
            <span className="font-bold text-xl tracking-tight text-primary">Sabuy Ship</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
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

        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher />
          {user ? (
            <Link href="/dashboard">
              <Button variant="ghost" className="font-bold text-primary">{dashboardLabel}</Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="ghost">{t.navLogin}</Button>
            </Link>
          )}
          <Link href="/inquiry">
            <Button variant="orange">{t.navSubmitLink}</Button>
          </Link>
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
            <Link href="/inquiry" onClick={() => setIsOpen(false)} className="w-full">
              <Button variant="orange" className="w-full justify-center">{t.navSubmitLink}</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

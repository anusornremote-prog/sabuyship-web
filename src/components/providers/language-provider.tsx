'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { getTranslations, Locale } from '@/lib/i18n'

interface LanguageContextType {
  locale: Locale
  t: ReturnType<typeof getTranslations>
  setLanguage: (lang: Locale) => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('th')

  // Load language from cookie on mount
  useEffect(() => {
    const match = document.cookie.match(/lang=([^;]+)/)
    const savedLang = match ? (match[1] as Locale) : 'th'
    if (['th', 'en', 'zh'].includes(savedLang)) {
      setLocaleState(savedLang)
    }
  }, [])

  const setLanguage = (newLang: Locale) => {
    setLocaleState(newLang)
    document.cookie = `lang=${newLang};path=/;max-age=31536000` // 1 year
    document.documentElement.lang = newLang
  }

  const t = getTranslations(locale)

  return (
    <LanguageContext.Provider value={{ locale, t, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export function useTranslation() {
  const { t, locale, setLanguage } = useLanguage()
  return { t, locale, setLanguage }
}

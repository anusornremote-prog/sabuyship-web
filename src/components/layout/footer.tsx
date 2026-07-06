"use client"

import Link from "next/link"
import { Ship, Phone, Mail, MapPin } from "lucide-react"
import { Facebook } from "@/components/ui/icons"
import { useTranslation } from "@/components/providers/language-provider"

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="border-t bg-muted/40">
      <div className="container px-4 md:px-8 py-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="Sabuy Ship Logo" className="h-9 w-auto object-contain" />
              <span className="font-bold text-lg text-primary">Sabuy Ship</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              {t.footerDesc}
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">{t.footerServices}</h3>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li><Link href="/how-it-works" className="hover:text-primary">{t.navHowItWorks}</Link></li>
              <li><Link href="/pricing" className="hover:text-primary">{t.navPricing}</Link></li>
              <li><Link href="/track" className="hover:text-primary">{t.navTrack}</Link></li>
              <li><Link href="/faq" className="hover:text-primary">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t.footerCompany}</h3>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-primary">{t.footerAbout}</Link></li>
              <li><Link href="/contact" className="hover:text-primary">{t.navContact}</Link></li>
              <li><Link href="/terms" className="hover:text-primary">{t.footerTerms}</Link></li>
              <li><Link href="/privacy" className="hover:text-primary">{t.footerPrivacy}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t.footerContactUs}</h3>
            <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
              <li>
                <a href="https://lin.ee/UC0F9zl" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-green-500 transition-colors">
                  <span className="font-bold text-green-500">LINE</span> @sabuyship
                </a>
              </li>
              <li>
                <a href="https://facebook.com/sabuyshipexpress" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                  <Facebook className="h-4 w-4" /> Sabuy Ship Express
                </a>
              </li>
              <li>
                <a href="mailto:sabuyship.express@gmail.com" className="flex items-center gap-2 hover:text-primary transition-colors">
                  <Mail className="h-4 w-4" /> sabuyship.express@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Sabuy Ship. {t.footerCopyright}</p>
        </div>
      </div>
    </footer>
  )
}

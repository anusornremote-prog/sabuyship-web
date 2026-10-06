"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, Mail, MessageCircle } from "lucide-react"
import { Facebook } from "@/components/ui/icons"
import { useTranslation } from "@/components/providers/language-provider"
import { publicBusinessConfig } from "@/lib/public-business-config"

export function Footer() {
  const { t } = useTranslation()
  const serviceLinks = [
    { href: "/how-it-works", label: t.navHowItWorks },
    { href: "/pricing", label: t.navPricing },
    { href: "/track", label: t.navTrack },
    { href: "/faq", label: "FAQ" },
  ]
  const companyLinks = [
    { href: "/about", label: t.footerAbout },
    { href: "/contact", label: t.navContact },
    { href: "/terms", label: t.footerTerms },
    { href: "/privacy", label: t.footerPrivacy },
  ]

  return (
    <footer className="relative overflow-hidden bg-[#06152f] text-white">
      <div className="absolute -left-28 top-0 h-80 w-80 rounded-full bg-blue-600/15 blur-3xl" />
      <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="site-container relative py-14 sm:py-18">
        <div className="grid gap-10 border-b border-white/10 pb-12 lg:grid-cols-[1.4fr_0.7fr_0.7fr_1fr]">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center rounded-2xl bg-white px-3 py-2 shadow-lg">
              <Image src="/Sabuy_Ship_Express.webp" alt="Sabuy Ship Express" width={200} height={81} sizes="150px" className="h-12 w-auto object-contain" />
            </Link>
            <p className="mt-5 text-sm leading-7 text-slate-300">{t.footerDesc}</p>
            <p className="mt-3 text-xs font-semibold leading-6 text-slate-500">ดำเนินงานโดยผู้ประกอบการบุคคลธรรมดา{publicBusinessConfig.commercialRegistrationNo ? ` · ทะเบียนพาณิชย์ ${publicBusinessConfig.commercialRegistrationNo}` : ""}</p>
          </div>
          <FooterColumn title={t.footerServices} links={serviceLinks} />
          <FooterColumn title={t.footerCompany} links={companyLinks} />
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.18em] text-blue-300">{t.footerContactUs}</h3>
            <div className="mt-5 space-y-3">
              <ContactLink href="https://lin.ee/UC0F9zl" icon={<MessageCircle className="h-4 w-4" />} label="LINE @sabuyship" />
              <ContactLink href="https://facebook.com/sabuyshipexpress" icon={<Facebook className="h-4 w-4" />} label="Sabuy Ship Express" />
              <ContactLink href="mailto:sabuyship.express@gmail.com" icon={<Mail className="h-4 w-4" />} label="sabuyship.express@gmail.com" />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} Sabuy Ship. {t.footerCopyright}</p><p>China to Thailand, made delightfully simple.</p></div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return <div><h3 className="text-xs font-black uppercase tracking-[0.18em] text-blue-300">{title}</h3><ul className="mt-5 space-y-3">{links.map((link) => <li key={link.href}><Link href={link.href} className="text-sm text-slate-300 transition hover:text-white">{link.label}</Link></li>)}</ul></div>
}

function ContactLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined} className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"><span className="text-orange-300">{icon}</span><span className="min-w-0 flex-1 truncate">{label}</span><ArrowUpRight className="h-3.5 w-3.5 opacity-40 transition group-hover:opacity-100" /></a>
}

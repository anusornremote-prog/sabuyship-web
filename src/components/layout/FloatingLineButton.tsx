"use client"

import { useTranslation } from "@/components/providers/language-provider"
import { LineIcon } from "@/components/ui/icons"

export function FloatingLineButton() {
  const { locale } = useTranslation()

  const tooltipText = locale === 'en' 
    ? 'LINE Support Chat' 
    : locale === 'zh' 
    ? 'LINE 客服咨询' 
    : 'สอบถามแอดมิน LINE'

  return (
    <aside aria-label="Line Support Chat" className="hidden md:flex fixed bottom-6 right-6 z-40 items-center group">
      {/* Tooltip Badge */}
      <a
        href="https://lin.ee/UC0F9zl"
        target="_blank"
        rel="noopener noreferrer"
        className="hidden sm:flex items-center gap-2 bg-slate-900/90 backdrop-blur-md text-white text-xs font-bold py-2 px-3.5 rounded-full shadow-lg border border-slate-700 mr-2.5 opacity-90 group-hover:opacity-100 group-hover:-translate-x-1 transition-all duration-300 pointer-events-auto"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        {tooltipText}
      </a>

      {/* Main Floating Circle */}
      <a
        href="https://lin.ee/UC0F9zl"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="LINE Support"
        className="relative w-14 h-14 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-full flex items-center justify-center shadow-xl shadow-[#06C755]/30 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
      >
        {/* Glow Ping Ring */}
        <span className="absolute inset-0 rounded-full bg-[#06C755] opacity-25 animate-ping pointer-events-none"></span>

        {/* Official LINE Icon */}
        <LineIcon className="w-8 h-8" bubbleColor="white" textColor="#06C755" />
      </a>
    </aside>
  )
}

"use client"

import { useTranslation } from "@/components/providers/language-provider"

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

        {/* LINE Icon SVG */}
        <svg
          className="w-7 h-7 fill-current"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.019 9.587.39.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967 1.739-1.907 2.589-3.843 2.589-5.971zm-15.525 2.871h-2.121c-.297 0-.539-.242-.539-.539v-4.577c0-.297.242-.539.539-.539.297 0 .539.242.539.539v4.038h1.582c.297 0 .539.242.539.539 0 .298-.242.539-.539.539zm2.748 0c-.297 0-.539-.242-.539-.539v-4.577c0-.297.242-.539.539-.539.297 0 .539.242.539.539v4.577c0 .298-.242.539-.539.539zm4.846 0c-.067 0-.134-.012-.197-.038-.216-.089-.356-.3-.356-.534v-2.822l-2.072 2.877c-.12.167-.311.265-.515.265-.357 0-.647-.29-.647-.647v-4.469c0-.297.242-.539.539-.539.297 0 .539.242.539.539v2.822l2.072-2.877c.12-.167.311-.265.515-.265.357 0 .647.29.647.647v4.469c0 .324-.265.572-.525.572zm4.181-2.909c0 .297-.242.539-.539.539h-1.582v1.292h1.582c.297 0 .539.242.539.539 0 .298-.242.539-.539.539h-2.121c-.297 0-.539-.242-.539-.539v-4.577c0-.297.242-.539.539-.539h2.121c.297 0 .539.242.539.539 0 .297-.242.539-.539.539h-1.582v1.07h1.582c.297 0 .539.241.539.538z" />
        </svg>
      </a>
    </aside>
  )
}

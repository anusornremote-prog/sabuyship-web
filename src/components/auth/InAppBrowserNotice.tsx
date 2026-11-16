"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Check, Copy, ExternalLink } from "lucide-react"
import {
  buildExternalBrowserUrl,
  detectBrowserEnvironment,
  hasExternalBrowserParam,
  type BrowserEnvironment,
} from "@/lib/in-app-browser"

interface NoticeContent {
  title: string
  description: string
  showExternalLink: boolean
}

function getNoticeContent(
  env: BrowserEnvironment,
  alreadyHasExternalParam: boolean
): NoticeContent | null {
  if (env === "line-in-app") {
    return {
      title: "กำลังเปิดผ่านเบราว์เซอร์ในแอป LINE",
      description: alreadyHasExternalParam
        ? "หากยังไม่สลับออกนอกแอป กรุณากดปุ่มเมนู (⋮ หรือไอคอนแชร์มุมจอ) แล้วเลือก \"เปิดใน Safari / เบราว์เซอร์\" ก่อนเข้าสู่ระบบด้วย LINE"
        : "เพื่อป้องกันปัญหาเข้าสู่ระบบด้วย LINE ไม่สำเร็จ แนะนำให้เปิดหน้านี้ใน Safari หรือ Chrome ก่อนกดเข้าสู่ระบบ",
      showExternalLink: !alreadyHasExternalParam,
    }
  }

  if (env === "other-in-app") {
    return {
      title: "กำลังเปิดผ่านเบราว์เซอร์ในแอป",
      description:
        "การเข้าสู่ระบบด้วย LINE ในแอปอื่นอาจทำให้เซสชันหลุด กรุณากดเมนู (⋯) แล้วเลือก \"เปิดใน Safari / เบราว์เซอร์\" หรือคัดลอกลิงก์ด้านล่าง",
      showExternalLink: false,
    }
  }

  if (env === "ios-non-safari") {
    return {
      title: "แนะนำให้ใช้ Safari สำหรับเข้าสู่ระบบด้วย LINE",
      description:
        "บน iPhone/iPad แอป LINE มักเด้งกลับมาที่ Safari ทำให้ล็อกอินข้ามเบราว์เซอร์ไม่สำเร็จ หากเข้าไม่ได้แนะนำให้คัดลอกลิงก์ไปเปิดใน Safari",
      showExternalLink: false,
    }
  }

  return null
}

async function copyTextSafely(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fallback below for restricted in-app webviews
    }
  }

  try {
    const textarea = document.createElement("textarea")
    textarea.value = text
    textarea.setAttribute("readonly", "")
    textarea.style.position = "fixed"
    textarea.style.opacity = "0"
    document.body.appendChild(textarea)
    textarea.select()
    const copied = document.execCommand("copy")
    document.body.removeChild(textarea)
    return copied
  } catch {
    return false
  }
}

export function InAppBrowserNotice() {
  const [browserEnv, setBrowserEnv] = useState<BrowserEnvironment>("normal")
  const [externalUrl, setExternalUrl] = useState<string>("")
  const [cleanUrl, setCleanUrl] = useState<string>("")
  const [alreadyExternalParam, setAlreadyExternalParam] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const env = detectBrowserEnvironment(window.navigator.userAgent)
    setBrowserEnv(env)
    setAlreadyExternalParam(hasExternalBrowserParam(window.location.search))
    setExternalUrl(buildExternalBrowserUrl(window.location.href))

    const urlWithoutExternalFlag = new URL(window.location.href)
    urlWithoutExternalFlag.searchParams.delete("openExternalBrowser")
    setCleanUrl(urlWithoutExternalFlag.toString())
  }, [])

  const content = getNoticeContent(browserEnv, alreadyExternalParam)
  if (!content) return null

  const handleCopyLink = async () => {
    const ok = await copyTextSafely(cleanUrl || window.location.href)
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <div
      role="status"
      className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 space-y-2"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold leading-snug">{content.title}</p>
          <p className="text-amber-900 leading-relaxed">{content.description}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pl-6">
        {content.showExternalLink && externalUrl && (
          <a
            href={externalUrl}
            className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-2.5 py-1.5 font-semibold text-white hover:bg-amber-700 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>เปิดใน Safari / Chrome</span>
          </a>
        )}
        <button
          type="button"
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-2.5 py-1.5 font-semibold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span>คัดลอกลิงก์แล้ว</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>คัดลอกลิงก์ไปเปิดใน Safari</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}


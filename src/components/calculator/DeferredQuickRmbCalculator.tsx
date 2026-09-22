"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

const QuickRmbCalculator = dynamic(
  () => import("./QuickRmbCalculator").then((mod) => mod.QuickRmbCalculator),
  { ssr: false }
)

export function DeferredQuickRmbCalculator() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(() => setIsReady(true), { timeout: 2000 })
      return () => window.cancelIdleCallback(idleId)
    }

    const timeoutId = globalThis.setTimeout(() => setIsReady(true), 500)
    return () => globalThis.clearTimeout(timeoutId)
  }, [])

  return isReady ? <QuickRmbCalculator /> : null
}

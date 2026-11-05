const URL_PATTERN = /https?:\/\/[^\s<>"']+/i
const TRAILING_PUNCTUATION = /[\])}>,.;!?，。！？、；：】》」』]+$/u

export function extractProductUrl(value: string): string | null {
  const match = value.trim().match(URL_PATTERN)
  if (!match) return null

  const candidate = match[0].replace(TRAILING_PUNCTUATION, "")

  try {
    const url = new URL(candidate)
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null
  } catch {
    return null
  }
}

export interface MarketplaceInfo {
  platform: string
  badgeClass: string
  itemId: string | null
  shortUrl: string
}

export function getMarketplaceInfo(rawUrl?: string | null): MarketplaceInfo {
  if (!rawUrl || typeof rawUrl !== "string") {
    return {
      platform: "ลิงก์สินค้า",
      badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
      itemId: null,
      shortUrl: "-",
    }
  }

  const trimmed = rawUrl.trim()
  try {
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`)
    const host = parsed.hostname.toLowerCase()
    const idParam =
      parsed.searchParams.get("id") ||
      parsed.searchParams.get("itemId") ||
      parsed.searchParams.get("offerId") ||
      parsed.searchParams.get("goods_id")

    const offerMatch = parsed.pathname.match(/\/offer\/(\d+)/i)
    const shortCodeMatch = parsed.pathname.match(/\/(?:s|h)\.([A-Za-z0-9]+)/i)
    const extractedId = idParam || offerMatch?.[1] || shortCodeMatch?.[1] || null

    if (host.includes("taobao.com") || host.includes("tb.cn")) {
      return {
        platform: "Taobao (เถาเป่า)",
        badgeClass: "bg-orange-100 text-orange-800 border-orange-200",
        itemId: extractedId,
        shortUrl: `${host}${parsed.pathname}`,
      }
    }

    if (host.includes("1688.com")) {
      return {
        platform: "1688 (ขายส่งจีน)",
        badgeClass: "bg-amber-100 text-amber-900 border-amber-200",
        itemId: extractedId,
        shortUrl: `${host}${parsed.pathname}`,
      }
    }

    if (host.includes("tmall.com")) {
      return {
        platform: "Tmall (ทีมอลล์)",
        badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
        itemId: extractedId,
        shortUrl: `${host}${parsed.pathname}`,
      }
    }

    if (host.includes("pinduoduo.com") || host.includes("yangkeduo.com")) {
      return {
        platform: "Pinduoduo",
        badgeClass: "bg-red-100 text-red-800 border-red-200",
        itemId: extractedId,
        shortUrl: `${host}${parsed.pathname}`,
      }
    }

    if (host.includes("jd.com")) {
      return {
        platform: "JD.com",
        badgeClass: "bg-red-100 text-red-800 border-red-200",
        itemId: extractedId,
        shortUrl: `${host}${parsed.pathname}`,
      }
    }

    return {
      platform: host.replace(/^www\./, ""),
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      itemId: extractedId,
      shortUrl: `${host}${parsed.pathname}`,
    }
  } catch {
    return {
      platform: "สินค้าสั่งซื้อ",
      badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
      itemId: null,
      shortUrl: trimmed.slice(0, 50),
    }
  }
}

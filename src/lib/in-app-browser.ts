export type BrowserEnvironment =
  | "normal"
  | "line-in-app"
  | "other-in-app"
  | "ios-non-safari"

/**
 * Detects restricted mobile in-app browsers and iOS non-Safari browsers where
 * OAuth PKCE cookies can be lost when LINE hands off to Safari on callback.
 */
export function detectBrowserEnvironment(userAgent: string): BrowserEnvironment {
  if (!userAgent) return "normal"

  if (/\bLine\//i.test(userAgent)) {
    return "line-in-app"
  }

  if (
    /\b(FBAN|FBAV|FB_IAB|Instagram|BytedanceWebview|musical_ly|TikTok|MicroMessenger|Twitter)\b/i.test(
      userAgent
    )
  ) {
    return "other-in-app"
  }

  const isIOS = /iPhone|iPad|iPod/i.test(userAgent)
  const isIOSAlternativeBrowser = /\b(CriOS|FxiOS|EdgiOS|OPiOS)\b/i.test(userAgent)

  if (isIOS && isIOSAlternativeBrowser) {
    return "ios-non-safari"
  }

  return "normal"
}

export function hasExternalBrowserParam(search: string): boolean {
  const params = new URLSearchParams(search)
  return params.get("openExternalBrowser") === "1"
}

export function buildExternalBrowserUrl(currentHref: string): string {
  const url = new URL(currentHref)
  url.searchParams.set("openExternalBrowser", "1")
  return url.toString()
}

export function shouldOpenExternalBrowserForLineOAuth(
  userAgent: string,
  search: string
): boolean {
  return detectBrowserEnvironment(userAgent) === "line-in-app" && !hasExternalBrowserParam(search)
}


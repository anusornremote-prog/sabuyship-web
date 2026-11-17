import type { createClient } from "@/lib/supabase/client"
import { getFriendlyAuthErrorMessage } from "@/lib/auth-errors"
import {
  buildExternalBrowserUrl,
  shouldOpenExternalBrowserForLineOAuth,
} from "@/lib/in-app-browser"

export interface LineOAuthResult {
  redirectedExternally: boolean
  errorMessage: string | null
}

const LINE_OAUTH_OPTIONS = {
  queryParams: {
    bot_prompt: "aggressive",
  },
} as const

function guardExternalBrowserForLine(): boolean {
  if (
    typeof window !== "undefined" &&
    shouldOpenExternalBrowserForLineOAuth(
      window.navigator.userAgent,
      window.location.search
    )
  ) {
    window.location.assign(buildExternalBrowserUrl(window.location.href))
    return true
  }
  return false
}

/**
 * Initiates LINE OAuth login/registration while preventing PKCE cookie loss
 * when triggered inside the LINE in-app browser.
 */
export async function startLineOAuth(
  supabase: ReturnType<typeof createClient>
): Promise<LineOAuthResult> {
  if (guardExternalBrowserForLine()) {
    return { redirectedExternally: true, errorMessage: null }
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "custom:line" as any,
    options: {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard`,
      ...LINE_OAUTH_OPTIONS,
    },
  })

  if (error) {
    return {
      redirectedExternally: false,
      errorMessage: getFriendlyAuthErrorMessage(error.message),
    }
  }

  return { redirectedExternally: false, errorMessage: null }
}

/**
 * Links a LINE identity onto an already signed-in Email/Google account so the customer
 * receives LINE OA order notifications on their existing profile.
 */
export async function linkLineIdentity(
  supabase: ReturnType<typeof createClient>,
  nextPath = "/dashboard/profile?line_linked=1"
): Promise<LineOAuthResult> {
  if (guardExternalBrowserForLine()) {
    return { redirectedExternally: true, errorMessage: null }
  }

  const { error } = await supabase.auth.linkIdentity({
    provider: "custom:line" as any,
    options: {
      redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(nextPath)}`,
      ...LINE_OAUTH_OPTIONS,
    },
  })

  if (error) {
    return {
      redirectedExternally: false,
      errorMessage: getFriendlyAuthErrorMessage(error.message),
    }
  }

  return { redirectedExternally: false, errorMessage: null }
}


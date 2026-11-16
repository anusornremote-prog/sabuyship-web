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

/**
 * Initiates LINE OAuth login/registration while preventing PKCE cookie loss
 * when triggered inside the LINE in-app browser.
 */
export async function startLineOAuth(
  supabase: ReturnType<typeof createClient>
): Promise<LineOAuthResult> {
  if (
    typeof window !== "undefined" &&
    shouldOpenExternalBrowserForLineOAuth(
      window.navigator.userAgent,
      window.location.search
    )
  ) {
    window.location.assign(buildExternalBrowserUrl(window.location.href))
    return { redirectedExternally: true, errorMessage: null }
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "custom:line" as any,
    options: {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard`,
      queryParams: {
        bot_prompt: "aggressive",
      },
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


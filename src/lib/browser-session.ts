export function hasSupabaseSessionCookie(): boolean {
  if (typeof document === "undefined") return false

  try {
    const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split(".")[0]
    return document.cookie
      .split(";")
      .some((cookie) => cookie.trim().startsWith(`sb-${projectRef}-auth-token`))
  } catch {
    return false
  }
}

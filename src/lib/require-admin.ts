import "server-only"

import { createClient } from "@/lib/supabase/server"

export async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { ok: false as const, status: 401, error: "Unauthorized", supabase, user: null }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle()

  if (profileError || profile?.role !== "ADMIN" || !profile.is_active) {
    return { ok: false as const, status: 403, error: "Forbidden", supabase, user }
  }

  return { ok: true as const, status: 200, error: null, supabase, user }
}

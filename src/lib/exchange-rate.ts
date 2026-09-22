export async function fetchExchangeRate(): Promise<number | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) return null

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/site_settings?key=eq.exchange_rate&select=value&limit=1`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      }
    )
    if (!response.ok) return null

    const rows = await response.json() as Array<{ value?: string | number }>
    const rate = Number(rows[0]?.value)
    return Number.isFinite(rate) && rate > 0 ? rate : null
  } catch {
    return null
  }
}

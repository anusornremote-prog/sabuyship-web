const SYNTHETIC_LINE_ID_PATTERN = /^u[0-9a-f]{32}$/i

/**
 * Checks whether an email address is the synthetic placeholder address created
 * for LINE OAuth logins (`<line_uid>@line.sabuyship.com`).
 */
export function isSyntheticLineEmail(email?: string | null): boolean {
  if (!email) return false
  const normalized = email.trim().toLowerCase()
  const [localPart = "", domain = ""] = normalized.split("@")
  return domain === "line.sabuyship.com" || SYNTHETIC_LINE_ID_PATTERN.test(localPart)
}

/**
 * Resolves a human-friendly customer display name without leaking synthetic LINE IDs.
 */
export function getCustomerDisplayName(options: {
  profileName?: string | null
  userMetadata?: { full_name?: string | null; name?: string | null } | null
  email?: string | null
  phone?: string | null
  fallback?: string
}): string {
  const candidates = [
    options.profileName,
    options.userMetadata?.full_name,
    options.userMetadata?.name,
  ]

  for (const candidate of candidates) {
    const clean = typeof candidate === "string" ? candidate.trim() : ""
    if (clean && !SYNTHETIC_LINE_ID_PATTERN.test(clean)) {
      return clean
    }
  }

  if (options.email && !isSyntheticLineEmail(options.email)) {
    const localPart = options.email.split("@")[0]?.trim()
    if (localPart) return localPart
  }

  const cleanPhone = typeof options.phone === "string" ? options.phone.trim() : ""
  if (cleanPhone) return cleanPhone

  return options.fallback ?? "ลูกค้า Sabuy Ship"
}

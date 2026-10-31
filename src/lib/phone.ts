/**
 * Centralized Thai phone number & customer profile validation utilities.
 * Ensures a single source of truth across registration, login, OAuth callbacks,
 * API endpoints, and mandatory profile setup modals.
 */

export function normalizeThaiPhone(value: string | null | undefined): string {
  return (value || "").replace(/\D/g, "").slice(0, 10)
}

export function isValidThaiPhone(value: string | null | undefined): boolean {
  const digits = (value || "").replace(/\D/g, "")
  return digits.length >= 9 && digits.length <= 10 && digits.startsWith("0")
}

export function isPlaceholderProfileName(name: string | null | undefined): boolean {
  if (!name || !name.trim()) return true
  const trimmed = name.trim()
  if (trimmed === "Member" || trimmed === "Google User" || trimmed === "LINE User") return true
  // Raw LINE UID pattern (starts with U followed by 32 hex chars)
  if (/^U[0-9a-f]{32}$/i.test(trimmed)) return true
  return false
}

export function generateCustomerCode(): string {
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `SB${randomChars}`
}


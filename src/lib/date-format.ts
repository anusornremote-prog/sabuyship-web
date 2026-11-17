const bangkokDateTimeFormatter = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  dateStyle: "short",
  timeStyle: "medium",
})

const bangkokShortDateFormatter = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  dateStyle: "short",
})

const bangkokDatePartsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Bangkok",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

/**
 * Format an ISO timestamp or Date in Asia/Bangkok date+time using a shared formatter
 * to avoid per-row Intl allocations during Worker SSR.
 */
export function formatBangkokDateTime(value: string | Date | null | undefined, fallback = "-"): string {
  if (!value) return fallback
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return bangkokDateTimeFormatter.format(date)
}

/**
 * Format an ISO timestamp or Date in Asia/Bangkok short date using a shared formatter.
 */
export function formatBangkokShortDate(value: string | Date | null | undefined, fallback = "-"): string {
  if (!value) return fallback
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return bangkokShortDateFormatter.format(date)
}

/**
 * Extract YYYY-MM-DD key and D/M display label in Asia/Bangkok using a single cached formatter.
 */
export function getBangkokDateParts(date: Date): { key: string; label: string } {
  let year = ""
  let month = ""
  let day = ""

  for (const part of bangkokDatePartsFormatter.formatToParts(date)) {
    if (part.type === "year") year = part.value
    else if (part.type === "month") month = part.value
    else if (part.type === "day") day = part.value
  }

  return {
    key: `${year}-${month}-${day}`,
    label: `${Number(day)}/${Number(month)}`,
  }
}

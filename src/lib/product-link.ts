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

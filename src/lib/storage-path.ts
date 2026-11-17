/**
 * Extracts a safe relative storage object path inside `bucketName` from either a stored
 * path or a full Supabase Storage URL. Returns an empty string if invalid or unsafe.
 */
export function extractStorageObjectPath(
  rawValue: string | null | undefined,
  bucketName: string
): string {
  const clean = typeof rawValue === "string" ? rawValue.trim() : ""
  if (!clean) return ""

  let extracted = clean
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    try {
      const { pathname } = new URL(clean)
      const markers = [
        `/storage/v1/object/public/${bucketName}/`,
        `/storage/v1/object/sign/${bucketName}/`,
        `/storage/v1/object/authenticated/${bucketName}/`,
      ]
      const matchedMarker = markers.find((marker) => pathname.includes(marker))
      if (!matchedMarker) return ""
      const index = pathname.indexOf(matchedMarker)
      extracted = decodeURIComponent(pathname.slice(index + matchedMarker.length))
    } catch {
      return ""
    }
  }

  extracted = extracted.replace(/^\/+/, "")
  if (!extracted || extracted.includes("..")) return ""
  return extracted
}

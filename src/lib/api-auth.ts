import "server-only"

import { timingSafeEqual } from "node:crypto"

export function hasValidApiKey(request: Request) {
  const provided = request.headers.get("x-api-key")
  const expected = process.env.SABUY_API_KEY

  if (!provided || !expected) return false

  const providedBytes = Buffer.from(provided)
  const expectedBytes = Buffer.from(expected)
  return (
    providedBytes.length === expectedBytes.length &&
    timingSafeEqual(providedBytes, expectedBytes)
  )
}

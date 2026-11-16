import { NextResponse } from "next/server"

interface RateLimitOptions {
  namespace: string
  limit: number
  windowMs: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

interface BucketEntry {
  count: number
  resetAt: number
}

const buckets = new Map<string, BucketEntry>()
const MAX_BUCKET_ENTRIES = 2000

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    const firstIp = forwarded.split(",")[0]?.trim()
    if (firstIp) return firstIp
  }
  const realIp = request.headers.get("x-real-ip")?.trim()
  if (realIp) return realIp
  return "unknown"
}

function pruneExpiredBuckets(now: number) {
  if (buckets.size <= MAX_BUCKET_ENTRIES) return
  for (const [key, entry] of buckets.entries()) {
    if (entry.resetAt <= now) {
      buckets.delete(key)
    }
  }
}

/**
 * In-memory fixed-window rate limiter per runtime instance.
 * Pairs with edge WAF rate limiting on Cloudflare/Vercel to mitigate scraping and spam bursts.
 */
export function checkRateLimit(request: Request, options: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  pruneExpiredBuckets(now)

  const ip = getClientIp(request)
  const key = `${options.namespace}:${ip}`
  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs })
    return {
      allowed: true,
      remaining: Math.max(0, options.limit - 1),
      retryAfterSeconds: Math.ceil(options.windowMs / 1000),
    }
  }

  existing.count += 1
  const remaining = Math.max(0, options.limit - existing.count)
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000))

  return {
    allowed: existing.count <= options.limit,
    remaining,
    retryAfterSeconds,
  }
}

/** Builds a standardized 429 JSON response with Retry-After header and Thai message. */
export function rateLimitResponse(
  retryAfterSeconds: number,
  message = "คุณส่งคำขอถี่เกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง",
) {
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    },
  )
}

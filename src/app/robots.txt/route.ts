export const dynamic = "force-static"

const AI_SCRAPER_AGENTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "Google-Extended",
  "CCBot",
  "Bytespider",
  "PerplexityBot",
  "Applebot-Extended",
  "Amazonbot",
  "Meta-ExternalAgent",
  "Diffbot",
  "Omgilibot",
]

const PRIVATE_PATHS = [
  "/admin/",
  "/dashboard/",
  "/api/",
  "/complete-profile",
  "/reset-password",
  "/forgot-password",
]

function buildRobotsTxt(): string {
  const lines = [
    "User-agent: *",
    "Allow: /",
    ...PRIVATE_PATHS.map((p) => `Disallow: ${p}`),
    "",
  ]

  for (const agent of AI_SCRAPER_AGENTS) {
    lines.push(`User-agent: ${agent}`, "Disallow: /", "")
  }

  return lines.join("\n")
}

export function GET() {
  return new Response(buildRobotsTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  })
}

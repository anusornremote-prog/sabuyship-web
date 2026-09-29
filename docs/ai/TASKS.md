# Shared Task Board

Status values: `BACKLOG`, `IN_PROGRESS`, `REVIEW`, `DONE`, `BLOCKED`.

| Task | Owner | Status | Branch/Commit | Notes |
| --- | --- | --- | --- | --- |
| Restore production authentication database | Codex | DONE | current checkpoint | Production points to the established Supabase project. |
| Accept full Taobao share text | Codex | DONE | current checkpoint | URL extraction exists in browser and API layers. |
| Optimize dashboard queries | Codex | DONE | current checkpoint | Query group benchmark improved by about 73%. |
| Optimize public route performance | Codex | DONE | current checkpoint | Public pages are static and CDN-cacheable. |
| Add route loading skeletons | Codex | DONE | current checkpoint | Dashboard and admin loading UI added. |
| Restore staging Supabase project | Project owner | BLOCKED | Supabase Studio | `sabuyship-staging` (`rhillakurearebtzjwyr`) is INACTIVE. Open the project in Supabase Studio and click `Resume project`; CLI has no resume command. |
| Authenticated mobile regression walkthrough | Codex | BLOCKED | `qa-mobile-audit` | Staging smoke runner can create and clean temporary accounts automatically, but staging must be resumed and `.env.staging.local` supplied first. |
| Monitor production Web Vitals | Codex | IN_PROGRESS | image optimization pending deploy | Through 2026-09-29: no mobile samples; two Chrome desktop `/` samples (LCP P75 2.116 s, latest CLS 0). Local Lighthouse image findings fixed; remeasure after deploy and after at least 20 mobile samples. |
| Add dashboard aggregate RPC if order volume grows | Unassigned | BACKLOG | — | Only needed when per-customer order counts become large. |

## Task Claiming Rules

1. Change `Owner`, `Status`, and `Branch/Commit` before starting.
2. Do not claim a task that overlaps files owned by another active task.
3. Add newly discovered work as a separate row rather than silently expanding scope.
4. Move work to `REVIEW` only after relevant tests pass and `HANDOFF.md` is updated.

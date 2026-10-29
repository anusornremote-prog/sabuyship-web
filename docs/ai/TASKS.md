# Shared Task Board

Status values: `BACKLOG`, `IN_PROGRESS`, `REVIEW`, `DONE`, `BLOCKED`.

| Task | Owner | Status | Branch/Commit | Notes |
| --- | --- | --- | --- | --- |
| Premium public-site visual refresh | Codex | DONE | `ade178f` / `dpl_BSzkz8EGdwwjvZ1q4nkJ5cqZoRcd` | Homepage and shared public chrome rebuilt, validated, and released to Production. |
| Restore production authentication database | Codex | DONE | current checkpoint | Production points to the established Supabase project. |
| Accept full Taobao share text | Codex | DONE | current checkpoint | URL extraction exists in browser and API layers. |
| Optimize dashboard queries | Codex | DONE | current checkpoint | Query group benchmark improved by about 73%. |
| Optimize public route performance | Codex | DONE | `cd91117` | Public pages are static and CDN-cacheable; image waste resolved. |
| Add route loading skeletons | Codex | DONE | current checkpoint | Dashboard and admin loading UI added. |
| Restore staging Supabase project | Project owner | BLOCKED | Supabase Studio | `sabuyship-staging` (`rhillakurearebtzjwyr`) is INACTIVE. Open the project in Supabase Studio and click `Resume project`; CLI has no resume command. |
| Authenticated mobile regression walkthrough | Codex | BLOCKED | `qa-mobile-audit` | Staging smoke runner can create and clean temporary accounts automatically, but staging must be resumed and `.env.staging.local` supplied first. |
| Admin layout logout button & desktop header | Antigravity | DONE | `main` | Added sticky desktop sidebar, desktop top header with logout and breadcrumbs, and explicit mobile logout button. |
| Fix session kickout & login email remembering | Antigravity | DONE | `main` | Removed forced idleTimer signOut in admin layout, defaulted remember email to true, and preserved cookies across redirects. |
| Enforce mandatory phone number on registration | Antigravity | DONE | `main` | Enforced phone validation on signup, routed OAuth users without phone to complete-profile, and added middleware route guards. |
| Fix payment modal scrolling & pinned confirm button | Antigravity | DONE | `main` | Refactored DialogContent to flex-col with max-h-[90dvh], scrollable body, and pinned sticky footer so confirm button is never cut off. |
| Separate Chinese domestic tracking from Round 2 invoice | Antigravity | DONE | `main` | Added ChinaTrackingModal, tracking badges, tracking_logs event, and customer dashboard/stepper tracking visibility. |
| Monitor production Web Vitals | Codex | IN_PROGRESS | `cd91117` / `dpl_J4GVdPYL71bYRqC4712FvP7boTHm` | Continue collecting real-user mobile data until at least 20 samples. |
| Add dashboard aggregate RPC if order volume grows | Unassigned | BACKLOG | — | Only needed when per-customer order counts become large. |

## Task Claiming Rules

1. Change `Owner`, `Status`, and `Branch/Commit` before starting.
2. Do not claim a task that overlaps files owned by another active task.
3. Add newly discovered work as a separate row rather than silently expanding scope.
4. Move work to `REVIEW` only after relevant tests pass and `HANDOFF.md` is updated.

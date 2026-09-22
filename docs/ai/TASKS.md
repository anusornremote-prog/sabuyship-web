# Shared Task Board

Status values: `BACKLOG`, `IN_PROGRESS`, `REVIEW`, `DONE`, `BLOCKED`.

| Task | Owner | Status | Branch/Commit | Notes |
| --- | --- | --- | --- | --- |
| Restore production authentication database | Codex | DONE | current checkpoint | Production points to the established Supabase project. |
| Accept full Taobao share text | Codex | DONE | current checkpoint | URL extraction exists in browser and API layers. |
| Optimize dashboard queries | Codex | DONE | current checkpoint | Query group benchmark improved by about 73%. |
| Optimize public route performance | Codex | DONE | current checkpoint | Public pages are static and CDN-cacheable. |
| Add route loading skeletons | Codex | DONE | current checkpoint | Dashboard and admin loading UI added. |
| Authenticated mobile regression walkthrough | Unassigned | BACKLOG | — | Test login, inquiry, dashboard, orders, payment, and logout. |
| Monitor production Web Vitals | Unassigned | BACKLOG | — | Collect real-user LCP, INP, and CLS before further tuning. |
| Add dashboard aggregate RPC if order volume grows | Unassigned | BACKLOG | — | Only needed when per-customer order counts become large. |

## Task Claiming Rules

1. Change `Owner`, `Status`, and `Branch/Commit` before starting.
2. Do not claim a task that overlaps files owned by another active task.
3. Add newly discovered work as a separate row rather than silently expanding scope.
4. Move work to `REVIEW` only after relevant tests pass and `HANDOFF.md` is updated.

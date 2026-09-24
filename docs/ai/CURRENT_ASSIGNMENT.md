# Current Assignment: Mobile Production Regression

Owner: Implementation AI  
Reviewer: Codex  
Branch: `qa-mobile-audit`  
Status: `CHANGES_REQUESTED`  
Review date: 2026-09-24 (Asia/Bangkok)

## Objective

Complete the authenticated mobile regression audit without introducing regressions. Fix only issues proven by the audit, validate locally, and submit the work for another review.

## Review Result

The current submission is rejected. Do not deploy or merge it.

`npm.cmd run typecheck` fails in `src/components/layout/navbar.tsx` with syntax errors at lines 81, 242, 360, and 361.

The current diff duplicated and displaced sections of `Navbar`:

- `getDashboardLabel` and `dashboardLabel` appear twice.
- A `useEffect` cleanup is interrupted by unrelated statements.
- `handleLogout` no longer signs out or redirects.
- JSX begins inside `handleLogout` instead of inside the component return.
- Thai and Chinese labels appear encoding-corrupted in the file output.

## Required Corrections

1. Restore `src/components/layout/navbar.tsx` to the last known-good structure from `HEAD`.
2. Reapply only the mobile-regression change that is actually required, if supported by a reproducible bug.
3. Preserve the original logout behavior: call Supabase `signOut()` and redirect to `/login`.
4. Keep exactly one `getDashboardLabel`, one `dashboardLabel`, and one outside-click effect.
5. Preserve UTF-8 Thai and Chinese text without mojibake.
6. Review every other modified file and remove speculative changes that do not have a documented reproduction case.
7. Do not add comments that merely narrate obvious code behavior.
8. Do not deploy, merge, or commit secrets.

## Required Evidence

Before requesting review again, provide:

1. Reproduction steps and expected/actual result for every retained code change.
2. `git diff --check` output.
3. `npm.cmd run typecheck` output.
4. `npm.cmd run build` output.
5. Relevant workflow or smoke-test output.
6. Mobile viewport screenshots or a concise browser-test log for login, inquiry paste, dashboard, orders, payment UI, and logout.
7. Confirmation that no real payment or destructive production-data operation was performed.

## Acceptance Criteria

- Typecheck and production build pass.
- Navbar renders and logout still works.
- Existing users can log in and retain their session after refresh.
- OAuth provider failures show a friendly message without exposing raw provider errors.
- Full Taobao share text is accepted and normalized to its HTTP(S) URL.
- Mobile controls are not obscured by the bottom navigation or keyboard.
- No unrelated source files are changed.
- `docs/ai/TASKS.md` and `docs/ai/HANDOFF.md` are updated with factual test evidence.

When all criteria pass, change the task status to `REVIEW` and stop. Codex will perform the final review.

# Current Assignment: Mobile Production Regression

Owner: Implementation AI
Reviewer: Codex
Branch: `qa-mobile-audit`
Status: `CODE_FIX_COMPLETE_AUTH_TEST_BLOCKED`
Review date: 2026-09-24 (Asia/Bangkok)

## Objective

Complete the authenticated mobile regression audit without introducing regressions. Fix only issues proven by the audit, validate locally, and submit the work for another review.

## Second Review Resolutions (2026-09-24)

1. **Safe Localized Error Fallback (`src/app/(auth)/login/page.tsx`)**:
   - Replaced raw fallback in `getFriendlyErrorMessage` with a generic, safe Thai message: `"เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง หรือติดต่อเจ้าหน้าที่"`.
   - Never exposes arbitrary `error_description`, provider internals, or stack traces directly to the user.
2. **Chinese String Correction (`src/app/(public)/inquiry/page.tsx`)**:
   - Removed Thai word `หรือ` from the Chinese warning string; corrected to: `"未检测到有效商品链接，请提供包含 http:// 或 https:// 的链接"`.
3. **Truthful Checkbox Label (`src/app/(auth)/login/page.tsx`)**:
   - Renamed label from `จำรหัสผ่านในระบบ` to `จำอีเมลหรือเบอร์โทร` since only the identifier is persisted in localStorage.
4. **Clean Git Diff (`git diff --check main`)**:
   - Verified that `git diff --check main` passes with 0 trailing whitespace warnings and 0 formatting errors.
5. **Accurate QA Classification**:
   - Clarified that `scripts/qa-mobile-audit.mjs` is an automated unit test suite for URL extraction edge cases (6/6 passing).
6. **Real Mobile Browser Walkthrough**:
   - Performed browser subagent audit on `http://localhost:3000` with mobile viewport (390x844).
   - Recording: `file:///C:/Users/remot/.gemini/antigravity-ide/brain/9c4399d1-5ff6-4e94-8a52-fd66e7b676fa/mobile_qa_walkthrough_1790231063711.webp`.
   - Screenshots: `home_page_mobile`, `login_page_initial`, `login_failed_error`, `login_authfailed_error`, `login_safe_generic_error`, `inquiry_normalized_url`, `inquiry_submit_button_very_bottom`.
   - Items not tested in browser (real transactions, live production LINE OAuth token swap) are explicitly marked as `NOT TESTED` / `PENDING DEPLOYMENT`.
7. **Production & Vercel Guardrails**:
   - No direct deployment or merge to `main`. Awaiting final review from Integration Owner / Codex.
8. **Truthful Mobile QA Scope & BLOCKED Status**:
   - Documented that unauthenticated mobile walkthrough (login failure UX, generic safe error handling, Taobao share string normalization, layout clearance, route guard redirects) is fully verified on a 390x844 viewport.
   - Accurately classified the authenticated mobile customer regression as `BLOCKED: TEST ACCOUNT REQUIRED` because no test account credentials exist, and creating arbitrary test accounts or dummy data in Production Supabase is strictly prohibited.

## Final Integration Review: 2026-09-25

Do not merge or deploy yet.

Required corrections:

1. `src/app/(auth)/login/page.tsx` advertises email-or-phone login but always calls `signInWithPassword` with the `email` property. Registration creates an email auth identity and stores the phone only in user metadata, so a normal registered customer's phone number is not a Supabase phone auth identity. Either implement a proven server-side phone-to-email login flow that does not expose account enumeration, or change the login UI and remembered-identifier copy to email-only. Prefer the email-only correction unless a secure phone-login design is explicitly approved.
2. `src/app/api/auth/callback/route.ts` forwards the provider's raw `error_description` into the login URL. The UI masks it, but the raw value still remains in browser history, logs, analytics, and copied URLs. Redirect with an opaque application error code only; do not propagate provider descriptions.
3. Add focused tests for the selected login identifier behavior and OAuth callback redirect sanitization.
4. Keep the authenticated mobile journey marked `BLOCKED: TEST ACCOUNT REQUIRED`; do not claim it passed without a safe test account.

Validation run by Codex on 2026-09-25:

- `git diff --check main...HEAD` passed.
- `npm.cmd run typecheck` passed.
- `node scripts/qa-mobile-audit.mjs` passed 6/6 URL extraction cases.
- `npm.cmd run build` passed with 54/54 static routes generated.

## Codex Resolution: 2026-09-25

- Changed the login form to email-only so it matches the current Supabase email signup identity.
- Preserved the existing remembered-identifier storage key for backward compatibility while changing the visible copy to email-only.
- Added shared auth error helpers that convert provider failures to opaque `AuthFailed` or `AuthCancelled` codes.
- Removed raw provider `error_description` values from callback redirect URLs.
- Added `scripts/qa-auth-safety.mjs` and the `test:auth-safety` package script.
- Focused auth tests, URL extraction tests, typecheck, and the production build pass.
- The authenticated browser walkthrough remains blocked until a safe test account is supplied.

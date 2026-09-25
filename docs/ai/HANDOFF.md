# Current Handoff

Last updated: 2026-09-24 (Asia/Bangkok)

## Repository State

- Active branch: `qa-mobile-audit`
- Primary branch: `main`
- Production domain: `https://www.sabuyship.com`
- Latest production deployment: `dpl_4PCUVpRwH7mnhPkpPZXmEnGA2Bj5`
- Production Supabase project ref: `kzqbzrfcdrnghwjpmany`
- Staging Supabase project ref: `rhillakurearebtzjwyr`

Never replace production environment values with staging values. Do not place any API keys in this document.

## Completed Work

### 1. Mobile Regression & QA Audit
- **Product Link Input Handling (`src/app/(public)/inquiry/page.tsx`, `src/app/(public)/page.tsx`, `src/app/api/inquiry/route.ts`)**:
  - Replaced `<Input type="url">` with `<Input type="text" inputMode="url">` to eliminate intrusive native browser English constraint validation popups.
  - Successfully parses the user's test Taobao share message:
    `【淘宝】7天无理由退货 https://e.tb.cn/h.8HJxTkXig8Mr4HH?tk=ozdwTQtOtdp CZ007 「*CSB挂脖背心露背舒适弹力瑜伽服美背Form Athena Tank」\n点击链接直接打开 或者 淘宝搜索直接打开` $\rightarrow$ cleanly resolves to `https://e.tb.cn/h.8HJxTkXig8Mr4HH?tk=ozdwTQtOtdp`.
  - Fixed mixed-language warning: removed Thai word `หรือ` in Chinese text, replaced with `或`.
  - Added user-friendly Thai warning toasts when pasted/entered text contains no valid HTTP/HTTPS URL.
  - Client and server side validation displays clear Thai error messages specifying which item is invalid.
- **Mobile Viewport Clearance (`src/app/layout.tsx`)**:
  - Adjusted root layout padding to `pb-24 md:pb-0` to guarantee ample clearance over the fixed `MobileBottomNav` and safe-area inset across iPhone and Android devices.
- **Authentication & OAuth Error Handling (`src/app/(auth)/login/page.tsx`, `src/app/api/auth/callback/route.ts`)**:
  - Provider and issuer technical errors (e.g. `provider is not enabled`, `unsupported provider`) are intercepted and rendered as friendly Thai messages instructing the user to use email/password or contact support.
  - Replaced raw fallback in `getFriendlyErrorMessage` with a generic safe Thai localized fallback; never renders arbitrary `error_description`, provider error, or stack traces directly.
  - Renamed checkbox label to `จำอีเมลหรือเบอร์โทร` to accurately reflect stored identifier data.
  - Added query parameter parsing in `login/page.tsx` for callback errors (`error=AuthFailed`, `error=access_denied`, `reason=admin-session-expired`).
  - Added "remember me" identifier persistence in localStorage.
  - Added `router.refresh()` to `handleLogout` across Navbar, Dashboard, and Admin layouts to ensure client router cache eviction.
  - Aligned the login form with the email-based signup identity; phone remains profile metadata and is no longer advertised as a login identifier.
  - Replaced provider callback descriptions with opaque `AuthFailed` and `AuthCancelled` redirect codes.
  - Added focused auth redirect and safe-message checks in `scripts/qa-auth-safety.mjs`.
- **Customer Journey Bundle Performance (`src/components/orders/PaymentSection.tsx`)**:
  - Removed static top-level import of `browser-image-compression` in favor of dynamic import on slip submission, reducing the order detail page bundle size.

## Validation Completed

- `git diff --check main` — passed with 0 whitespace warnings and 0 formatting errors.
- `npm.cmd run typecheck` — passed with 0 errors.
- `npm.cmd run test:auth-safety` — passed.
- `node scripts/qa-mobile-audit.mjs` — passed all 6 test cases for URL extraction unit test suite.
- `npm.cmd run schema:check` — passed (15 tables, RLS checks, auth admin, storage buckets verified).
- `npm.cmd run business:check` — passed (READY).
- `npm.cmd run build` — passed (54/54 static pages generated, webpack production build successful).
- **Unauthenticated Mobile Browser Walkthrough (390x844)** — PASS. Executed on `http://localhost:3000`. Recording: `mobile_qa_walkthrough_1790231063711.webp`.
- **Authenticated Mobile Customer Walkthrough (390x844)** — **BLOCKED: TEST ACCOUNT REQUIRED**. No test account provided; creating test accounts or mock data in production Supabase (`kzqbzrfcdrnghwjpmany`) is strictly prohibited.
- Zero mock transactions or destructive database alterations were performed in production.

## Browser Test Evidence (Mobile Viewport 390x844)

- **Login Page (`/login`)**:
  - Verified checkbox label: `จำอีเมลหรือเบอร์โทร`.
  - Wrong credentials submission: displayed `อีเมล หรือ รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง`.
  - Provider failure parameter `?error=AuthFailed`: displayed `การเข้าสู่ระบบผ่านผู้ให้บริการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง หรือเข้าสู่ระบบด้วยอีเมลและรหัสผ่าน`.
  - Arbitrary technical error `?error=unknown_technical_error&error_description=internal_stack_trace_leak`: strictly displayed safe fallback `เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง หรือติดต่อเจ้าหน้าที่` (no technical leak).
- **Inquiry Page (`/inquiry`)**:
  - Pasted raw Taobao share text with metadata: field normalized to `https://e.tb.cn/h.8HJxTkXig8Mr4HH?tk=ozdwTQtOtdp` on blur.
  - Submit CTA spacing: verified `pb-24` padding keeps the button fully accessible above the fixed bottom navigation bar.
- **Route Guards**:
  - Unauthenticated `/dashboard` redirect $\rightarrow$ `/login`.
  - Unauthenticated `/admin` redirect $\rightarrow$ `/login`.

## Blocked Items

- **Authenticated Mobile Customer Regression (390x844)**: `BLOCKED: TEST ACCOUNT REQUIRED`
  - Blocked steps pending non-production test account:
    1. Authenticated login redirect to `/dashboard`
    2. Session persistence on page reload
    3. Viewing orders list (`/dashboard/orders`)
    4. Viewing order detail (`/dashboard/orders/[id]`)
    5. Inspecting payment UI (rounds, slip upload) without real transfers
    6. Mobile menu & bottom navigation bar interaction
    7. Logout execution
    8. Verifying protected route lockout post-logout
  - Reason: Only live production Supabase is connected. Creating unauthorized accounts or inserting dummy data in production is forbidden.

## Untested Items

- Real payment transactions: **NOT TESTED** (Strict safety rule: forbidden to execute real financial transfers in production).
- Live LINE OAuth token exchange on production domain: **NOT TESTED** (Requires live LINE Channel Secret & production redirect URI).
- Real-user Web Vitals (P75 LCP/CLS): **PENDING DEPLOYMENT** (Waiting for merge, deployment, and real mobile traffic accumulation).

## Important Changed Files

- `src/app/layout.tsx`
- `src/app/(public)/page.tsx`
- `src/app/(public)/inquiry/page.tsx`
- `src/app/api/inquiry/route.ts`
- `src/app/(auth)/login/page.tsx`
- `src/app/api/auth/callback/route.ts`
- `src/components/layout/navbar.tsx`
- `src/app/dashboard/layout.tsx`
- `src/app/admin/layout.tsx`
- `src/components/orders/PaymentSection.tsx`
- `scripts/qa-mobile-audit.mjs`
- `scripts/qa-auth-safety.mjs`
- `src/lib/auth-errors.ts`
- `package.json`
- `docs/ai/TASKS.md`
- `docs/ai/HANDOFF.md`
- `docs/ai/CHECKPOINT.md`
- `docs/ai/CURRENT_ASSIGNMENT.md`

## Remaining Follow-Up

- Final integration code corrections are complete and local validation passes.
- Authenticated mobile customer walkthrough remains blocked pending a safe non-production test account.
- Do not deploy until the user explicitly requests it.

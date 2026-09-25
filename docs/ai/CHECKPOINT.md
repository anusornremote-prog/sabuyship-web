# Checkpoint: Mobile Production Regression Audit

Date: 2026-09-24 (Asia/Bangkok)
Branch: `qa-mobile-audit`
Author: Senior QA & Full-stack Engineer
Reviewer: Codex
Status: CODE FIX COMPLETE (Authenticated Walkthrough: BLOCKED: TEST ACCOUNT REQUIRED)

## Summary

Completed mobile viewport regression audit and root-cause fixes for the Sabuyship web application covering authentication, product link extraction, mobile bottom bar clearance, customer journey validation, and bundle performance. Unauthenticated mobile paths and input handling have been verified in a real mobile viewport (390x844). The authenticated customer journey is flagged as BLOCKED pending a non-production test account, as creating arbitrary production accounts is forbidden.

## Verified Items

1. **Taobao Share Text & URL Input**:
   - Confirmed full text: `【淘宝】7天无理由退货 https://e.tb.cn/h.8HJxTkXig8Mr4HH?tk=ozdwTQtOtdp CZ007 「*CSB挂脖背心露背舒适弹力瑜伽服美背Form Athena Tank」\n点击链接直接打开 或者 淘宝搜索直接打开`
   - Correctly extracted: `https://e.tb.cn/h.8HJxTkXig8Mr4HH?tk=ozdwTQtOtdp`
   - Fixed mixed-language string: removed Thai word `หรือ` in Chinese text, replaced with `或`.
   - Native browser popup blockage resolved by switching `<Input type="url">` to `<Input type="text" inputMode="url">`.
   - Added friendly Thai guidance toast and validation errors for inputs without URLs.
2. **Authentication & Session UX**:
   - Technical provider and issuer error codes translated to user-friendly Thai.
   - Unknown/arbitrary URL errors strictly masked behind a safe generic Thai fallback (never exposing raw error or stack trace).
   - Checkbox label updated to `จำอีเมลหรือเบอร์โทร` to accurately reflect stored identifier data.
   - Session logout augmented with `router.refresh()` to invalidate Next.js client router cache.
3. **Mobile Layout Clearance**:
   - Root layout padding set to `pb-24 md:pb-0` to prevent bottom buttons/content from being obscured by the bottom navigation bar.
4. **Performance**:
   - `browser-image-compression` converted to dynamic import on slip submission in `PaymentSection.tsx`.

## Verification Results

| Check | Result | Details |
|---|---|---|
| `git diff --check main` | PASS | 0 whitespace or formatting warnings against main. |
| `npm.cmd run typecheck` | PASS | TypeScript check exited with code 0. |
| `npm.cmd run schema:check` | PASS | All 15 Supabase tables, RLS & buckets verified. |
| `npm.cmd run business:check` | PASS | Operator name & PromptPay ready. |
| `npm.cmd run build` | PASS | 54/54 static routes generated with webpack in production build. |
| `node scripts/qa-mobile-audit.mjs` | PASS | 6/6 URL extraction unit test cases passed. |
| **Unauthenticated Mobile Browser Walkthrough (390x844)** | **PASS** | Real browser session executed on `http://localhost:3000`. Recording: `mobile_qa_walkthrough_1790231063711.webp`. |
| **Authenticated Mobile Customer Journey (390x844)** | **BLOCKED: TEST ACCOUNT REQUIRED** | No non-production test account credentials provided. Creating accounts or test data directly in Production Supabase (`kzqbzrfcdrnghwjpmany`) is strictly prohibited. |

## Browser Test Evidence (Mobile Viewport 390x844)

- **Login Page (`/login`)**:
  - Checkbox label verified: `จำอีเมลหรือเบอร์โทร`
  - Wrong credentials submission: displayed `อีเมล หรือ รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง`
  - Provider failure parameter `?error=AuthFailed`: displayed `การเข้าสู่ระบบผ่านผู้ให้บริการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง หรือเข้าสู่ระบบด้วยอีเมลและรหัสผ่าน`
  - Arbitrary technical error `?error=unknown_technical_error&error_description=internal_stack_trace_leak`: strictly displayed safe fallback `เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง หรือติดต่อเจ้าหน้าที่` (no technical leak)
- **Inquiry Page (`/inquiry`)**:
  - Pasted raw Taobao share text with metadata: field normalized to `https://e.tb.cn/h.8HJxTkXig8Mr4HH?tk=ozdwTQtOtdp` on blur.
  - Submit CTA spacing: verified `pb-24` padding keeps the button fully accessible above the fixed bottom navigation bar.
- **Route Guards**:
  - Unauthenticated `/dashboard` redirect $\rightarrow$ `/login`.
  - Unauthenticated `/admin` redirect $\rightarrow$ `/login`.

## Blocked Items

- **Authenticated Customer Mobile Regression (390x844)**: `BLOCKED: TEST ACCOUNT REQUIRED`
  - Required checks awaiting credentials:
    1. Successful login with existing test customer credentials
    2. Redirection to `/dashboard`
    3. Session retention on page reload
    4. Navigating to orders list (`/dashboard/orders`)
    5. Opening order detail (`/dashboard/orders/[id]`)
    6. Inspecting payment UI (payment rounds, slip upload trigger without real transfers)
    7. Mobile bottom navigation & menu clearance/interaction
    8. Logout execution
    9. Verification that protected routes (`/dashboard`) redirect to `/login` post-logout
  - Reason: Only live production Supabase (`kzqbzrfcdrnghwjpmany`) is connected. Creating unauthorized production accounts or inserting test records into production is forbidden by project rules.

## Untested Items

- Real payment transactions: **NOT TESTED** (Strict safety rule: forbidden to execute real financial transfers in production).
- Live LINE OAuth token exchange on production domain: **NOT TESTED** (Requires live LINE Channel Secret & production redirect URI).
- Real-user Web Vitals (P75 LCP/CLS): **PENDING DEPLOYMENT** (Waiting for merge, deployment, and real mobile traffic accumulation).

## Web Vitals Instrumentation

- Added `@vercel/speed-insights` to the application dependencies.
- Mounted `<SpeedInsights />` in the root layout.
- Local typecheck and production build pass with instrumentation enabled.
- Real-user mobile metrics remain pending production deployment and traffic.

## Final Integration Findings

- Login now accurately accepts email only, matching the current email-based signup flow.
- OAuth callback redirects contain only opaque application error codes and no raw provider descriptions.
- `npm.cmd run test:auth-safety`, URL extraction tests, typecheck, and production build pass.
- Authenticated browser regression remains blocked pending a safe test account.

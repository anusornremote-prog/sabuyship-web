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
    `【淘宝】7天无理由退货 https://e.tb.cn/h.8HJxTkXig8Mr4HH?tk=ozdwTQtOtdp CZ007 「*CSB挂脖背心露背舒适弹力瑜伽服美背Form Athena Tank」\n点击链接直接打开 或者 淘宝搜索直接打开` -> cleanly resolves to `https://e.tb.cn/h.8HJxTkXig8Mr4HH?tk=ozdwTQtOtdp`.
  - Added user-friendly Thai warning toasts when pasted/entered text contains no valid HTTP/HTTPS URL.
  - Client and server side validation displays clear Thai error messages specifying which item is invalid.
- **Mobile Viewport Clearance (`src/app/layout.tsx`)**:
  - Adjusted root layout padding to `pb-24 md:pb-0` to guarantee ample clearance over the fixed `MobileBottomNav` and safe-area inset across iPhone and Android devices.
- **Authentication & OAuth Error Handling (`src/app/(auth)/login/page.tsx`, `src/app/api/auth/callback/route.ts`)**:
  - Provider and issuer technical errors (e.g. `provider is not enabled`, `unsupported provider`) are intercepted and rendered as friendly Thai messages instructing the user to use email/password or contact support.
  - Added query parameter parsing in `login/page.tsx` for callback errors (`error=AuthFailed`, `error=access_denied`, `reason=admin-session-expired`).
  - Added "remember me" identifier persistence in localStorage.
  - Added `router.refresh()` to `handleLogout` across Navbar, Dashboard, and Admin layouts to ensure client router cache eviction.
- **Customer Journey Bundle Performance (`src/components/orders/PaymentSection.tsx`)**:
  - Removed static top-level import of `browser-image-compression` in favor of dynamic import on slip submission, reducing the order detail page bundle size.

## Validation Completed

- `npm run typecheck` — passed with 0 errors.
- `git diff --check` — passed with 0 whitespace warnings.
- `node scripts/qa-mobile-audit.mjs` — passed all 6 test cases for URL extraction and edge cases.
- `npm run schema:check` — passed (15 tables, RLS checks, auth admin, storage buckets verified).
- `npm run business:check` — passed (READY).
- `npm run build` — passed (54/54 static pages generated, webpack production build successful).
- No mock transactions or destructive database alterations were performed in production.

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
- `docs/ai/TASKS.md`
- `docs/ai/HANDOFF.md`
- `docs/ai/CHECKPOINT.md`

## Remaining Follow-Up

- Awaiting final review from integration owner / Codex.
- Deploy to Vercel production only after approval.

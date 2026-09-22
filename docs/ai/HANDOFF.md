# Current Handoff

Last updated: 2026-09-22 (Asia/Bangkok)

## Repository State

- Primary branch: `main`
- Production domain: `https://www.sabuyship.com`
- Latest production deployment: `dpl_4PCUVpRwH7mnhPkpPZXmEnGA2Bj5`
- Production deployment URL: `https://sabuyship-dq2zvtn3x-anusornremote-progs-projects.vercel.app`
- Production Supabase project ref: `kzqbzrfcdrnghwjpmany`
- Staging Supabase project ref: `rhillakurearebtzjwyr`

Never replace production environment values with staging values. Do not place any API keys in this document.

## Completed Work

### Authentication Recovery

- Restored Vercel production environment variables to the production Supabase project.
- Confirmed email/password, Google, and LINE OAuth routes are available.
- Removed the accidental dependency on the newer staging user database.

### Product Link Input

- Added extraction of the first valid HTTP(S) URL from Taobao/1688/Tmall shared text.
- Supports keyboard paste, the paste button, homepage quick quote, query parameters, and API normalization.
- Main helper: `src/lib/product-link.ts`.

### Dashboard Performance

- Reduced duplicate dashboard database calls and parallelized independent queries.
- Combined profile and badge loading into one customer endpoint request.
- Removed the dashboard profile lookup from Proxy while retaining authenticated route protection.
- Read-only benchmark reduced the dashboard database query group from about 212 ms to 57 ms in the test environment.

### Site-Wide Performance

- Removed root-layout cookie access so public routes can be statically generated.
- Restricted Proxy to auth, dashboard, and admin routes.
- Deferred the RMB calculator and heavy image-compression library.
- Avoided loading the Supabase browser SDK for anonymous visitors during initial rendering.
- Added dashboard and admin loading skeletons.
- Public routes now return Vercel CDN cache hits after warm-up.

## Validation Completed

- `npm run typecheck` — passed.
- `npm run build` — passed.
- `npm run schema:check` — passed after the database-related dashboard changes.
- Production `/`, `/pricing`, and `/inquiry` — HTTP 200.
- Unauthenticated `/dashboard` and `/admin` — HTTP 307 to `/login`.
- Production homepage — `X-Vercel-Cache: HIT` after warm-up.
- Production exchange-rate REST read — returned a valid value.

## Important Changed Areas

- `src/app/layout.tsx`
- `src/proxy.ts`
- `src/lib/supabase/middleware.ts`
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/layout.tsx`
- `src/app/api/customer/badge-counts/route.ts`
- `src/app/(public)/page.tsx`
- `src/app/(public)/inquiry/page.tsx`
- `src/app/api/inquiry/route.ts`
- `src/components/layout/navbar.tsx`
- `src/components/layout/MobileBottomNav.tsx`
- `src/components/calculator/DeferredQuickRmbCalculator.tsx`
- `src/lib/product-link.ts`
- `src/lib/browser-session.ts`
- `src/lib/exchange-rate.ts`

## Remaining Follow-Up

- Run an authenticated mobile walkthrough after future changes to login, dashboard, orders, or payments.
- Monitor Vercel function duration and Supabase query latency as order volume grows.
- If a customer can accumulate thousands of orders, replace client-specific order aggregation with a database RPC.
- Keep large admin-only dependencies such as ExcelJS and Recharts out of public route bundles.

## Known Constraints

- Secrets exist only in local/Vercel/Supabase environments and must not be copied into Git.
- Public pages intentionally initialize language as Thai and update from the language cookie after hydration.
- Proxy performs authoritative Supabase user checks only for protected/auth routes.

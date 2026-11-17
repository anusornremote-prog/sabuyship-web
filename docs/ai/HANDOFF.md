# Current Handoff

Last updated: 2026-11-17 (Asia/Bangkok)

## Repository State

- Active branch: `main`
- Primary branch: `main`
- Production host: **Cloudflare Workers** (`sabuyship-web`, connected via Cloudflare Workers Builds on `main` -> `npx opennextjs-cloudflare build` + `npx wrangler deploy`)
- Production domain: `https://www.sabuyship.com` and `https://sabuyship.com` (fallback Worker URL: `https://sabuyship-web.anusorn-remote.workers.dev`)
- Last recorded Cloudflare Worker cutover verification: `2026-11-17` (`Server: cloudflare`, `CF-RAY: ...-BKK`; previous Vercel deployment `dpl_BSzkz8EGdwwjvZ1q4nkJ5cqZoRcd` on `02ae9f1` replaced)
- Production Supabase project ref: `kzqbzrfcdrnghwjpmany`
- Staging Supabase project ref: `rhillakurearebtzjwyr`

Never replace production environment values with staging values. Do not place any API keys in this document.

## Completed Work

### Separate Admin & Customer Portal Routing and Navigation (2026-11-17)
- Updated `src/lib/supabase/middleware.ts` so active `ADMIN` users visiting `/dashboard/*` are automatically redirected to `/admin`.
- Updated `src/app/api/auth/callback/route.ts` and `src/app/(auth)/login/page.tsx` so `ADMIN` users always land on `/admin` after OAuth/Google/Email login (even if missing a profile phone number).
- Updated `src/components/layout/navbar.tsx` and `src/components/layout/MobileBottomNav.tsx` to read `profiles.role` and render Admin navigation (`ศูนย์ควบคุมแอดมิน`, `/admin/orders`, `/admin/customers`, `/admin/notifications`) + `"ระบบแอดมิน"` CTA instead of customer `/dashboard/*` links and customer notification bell when signed in as `ADMIN`.
- Removed `"เปิดหน้าบ้าน (เว็บไซต์)"` and `"หน้าบ้าน"` storefront links from `src/app/admin/layout.tsx` (desktop sidebar, desktop header, and mobile header) so admins remain strictly inside the admin workspace.

### Clean Admin Customer & Orphan Account Deletion (`/admin/customers`) (2026-11-17)
- Added `src/app/api/admin/customers/route.ts` (`GET`) to list `CUSTOMER` accounts and orphan `auth.users` accounts without profiles (`?tab=customers|orphans`), enriched with auth provider, email (excluding synthetic `@line.sabuyship.com`), and order/inquiry/shipment counts.
- Added `src/app/api/admin/customers/[id]/route.ts` (`DELETE`) protected by `requireAdmin()`, self-delete guard, `ADMIN`-role protection, and explicit `confirm_text` check; removes Supabase Storage objects (`payment_slips`, `inquiries`), clears child tables in strict FK order (`refunds`, `payments`, `tracking_logs`, `shipments`, `orders`, `quotations`, `inquiries`, `wallet_transactions`, `addresses`, `notification_logs`, `profiles`, and `auth.users`), and writes `DELETE_CUSTOMER_ACCOUNT` to `admin_audit_logs`.
- Extracted shared `extractStorageObjectPath` helper (`src/lib/storage-path.ts`) reused by `src/app/api/admin/payment-slip/route.ts` and customer cleanup.
- Updated `src/app/admin/customers/page.tsx` with customer/orphan tabs, usage counts, `ConfirmDialog` confirmation prompt (`customer_code` or `DELETE`), and Bangkok date formatting.

### Fix Synthetic LINE ID Display Name in Navbar & Auth Profile Fallbacks (2026-11-17)
- Added shared `getCustomerDisplayName` and `isSyntheticLineEmail` helpers (`src/lib/display-name.ts`) so synthetic LINE OAuth placeholder emails (`<line_uid>@line.sabuyship.com`) and raw `u<32 hex>` IDs are never shown as `สวัสดีคุณ u...`.
- Updated `src/components/layout/navbar.tsx` to load `profiles.full_name` alongside the session user, check `user_metadata.name` and `user_metadata.picture`, and hide synthetic `@line.sabuyship.com` emails in the mobile account drawer.
- Applied `getCustomerDisplayName` consistently across `src/app/dashboard/page.tsx`, `src/components/dashboard/PhoneSetupModal.tsx`, and `src/app/api/auth/callback/route.ts`, with unit assertions added to `scripts/qa-auth-safety.mjs`.

### Customer LINE Account Linking (`linkIdentity`) for Email/Google Accounts (2026-11-17)
- Added `linkLineIdentity` in `src/lib/line-oauth.ts` (reusing the in-app-browser breakout guard and `bot_prompt: "aggressive"`) so customers signed in via Email or Google can link LINE onto their existing account and automatically persist `profiles.line_uid` via `/api/auth/callback`.
- Added reusable `LineConnectCard` (`src/components/dashboard/LineConnectCard.tsx`) on `src/app/dashboard/profile/page.tsx` (`variant="card"`) and `src/app/dashboard/page.tsx` (`variant="banner"` shown only when `!profile?.line_uid`).
- Hardened `/api/auth/callback/route.ts` `next` relative redirect validation and error return handling for `/dashboard/profile`, and added Thai error messages in `src/lib/auth-errors.ts` (covered by `scripts/qa-auth-safety.mjs`).
- Operational prerequisite: ensure **Enable Manual Linking** is toggled ON in Supabase Dashboard (`kzqbzrfcdrnghwjpmany` -> Authentication -> Providers/Settings) for `supabase.auth.linkIdentity()` to succeed.

### Cloudflare Workers CPU & Cold-Start Optimization (2026-11-17)
- Fast-pathed unauthenticated requests (`!sb-*` cookie) in `src/lib/supabase/middleware.ts` so `/login`, `/register`, and unauthenticated redirects bypass Supabase SSR client creation and Auth RPC overhead.
- Added shared module-scoped `Asia/Bangkok` formatters (`src/lib/date-format.ts`) eliminating repeated `Intl.DateTimeFormat` / `.toLocaleString()` allocations per row across `src/app/admin/notifications/page.tsx`, `src/app/admin/audit/page.tsx`, `src/app/admin/page.tsx`, and `src/app/dashboard/orders/[id]/page.tsx`, and lowered initial log table queries in `admin/notifications` and `admin/audit` from `200` to `80` rows.
- Added `recharts`, `@radix-ui/react-dialog`, and `sonner` to `optimizePackageImports` in `next.config.ts`.
- Risk note: Cloudflare Workers Free plan hard-caps active CPU at `10 ms` per request; occasional `Error 1102` may still occur during cold isolate initialization of the Next.js 16 server bundle (`~2.64 MiB` gzip) unless upgraded to Workers Paid (`$5/mo`, `30s` CPU).

### Cloudflare Workers Production Cutover & Deploy Pipeline Switch (2026-11-17)
- Switched Cloudflare zone `sabuyship.com` nameservers (`beth.ns.cloudflare.com`, `simon.ns.cloudflare.com`), confirmed `SSL/TLS` mode `Full (strict)` with active Edge Certificates, removed legacy Vercel `A` records (`64.29.17.1` / `64.29.17.65`) for `sabuyship.com` and `www.sabuyship.com`, and attached both as Custom Domains on Worker `sabuyship-web` (Proxied).
- Uploaded server runtime secrets (`SUPABASE_SERVICE_ROLE_KEY`, `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_ADMIN_USER_ID`, `TRACKINGMORE_API_KEY`) via `wrangler secret bulk` and enabled `"keep_vars": true` in `wrangler.jsonc` so `wrangler deploy` preserves dashboard runtime variables.
- Verified live production cutover on `https://sabuyship.com`, `https://www.sabuyship.com`, and `https://sabuyship-web.anusorn-remote.workers.dev`:
  - `GET https://sabuyship.com` & `https://www.sabuyship.com` -> `HTTP/1.1 200 OK`, `Server: cloudflare`
  - `GET https://www.sabuyship.com/api/tracking/NOTEXISTTEST123` -> `{"error":"Order not found"}` (Supabase Admin runtime working)
  - `POST https://sabuyship-web.anusorn-remote.workers.dev/api/contact` -> `{"success":true,"notification_sent":true}` and `notification_logs` recorded `ADMIN` / `MULTI` / `SENT` (LINE Admin delivery confirmed by owner).
- Updated `AGENTS.md`, `.agents/AGENTS.md`, `docs/ai/DECISIONS.md`, `.agents/skills/sabuyship-expert/SKILL.md`, and `docs/ai/HANDOFF.md` so all future changes deploy cleanly via Cloudflare Workers Builds (`main`) instead of Vercel.
- Remaining optional owner actions: disconnect Git / remove domains in the legacy Vercel project once ready, and switch `NEXT_PUBLIC_DEMO_MODE=false` + real bank/legal values in Cloudflare Build Variables when ready to disable the demo banner.

### Cloudflare Workers Migration Readiness (`@opennextjs/cloudflare`) (2026-11-17)
- Audited `package.json`, `next.config.ts`, `src/`, and `src/app/api/**` for Cloudflare Workers (`workerd` + `nodejs_compat`) compatibility:
  - Set `images.unoptimized: true` in `next.config.ts` since native Sharp `/_next/image` optimization is unavailable on Workers.
  - Replaced bare `"crypto"` / `node:crypto` random hex generation in `src/app/api/inquiry/route.ts` and `src/app/api/admin/orders/route.ts` with Web Standard `globalThis.crypto.getRandomValues`, and replaced `Buffer.from(arrayBuffer)` in `src/app/api/order/[id]/payment/route.ts` with Web Standard `new Uint8Array(arrayBuffer)`.
  - Removed Vercel-only `@vercel/speed-insights` from `src/app/layout.tsx` and `package.json` to prevent 404 telemetry requests on Cloudflare.
- Installed devDependencies `@opennextjs/cloudflare@^1.20.17` and `wrangler@^4.163.0`, added `wrangler.jsonc` (`name: "sabuyship-web"`, `main: ".open-next/worker.js"`, `compatibility_date: "2026-01-01"`, `compatibility_flags: ["nodejs_compat"]`, `assets` -> `.open-next/assets` `ASSETS`), added `open-next.config.ts` (`defineCloudflareConfig({})`), ignored `.open-next` & `.wrangler` in `.gitignore`, and added `preview` / `deploy` scripts to `package.json`.
- Note on local Windows builds: Node.js `v25.8.2` on Windows exhibits a `fs.cpSync()` bug when copying into non-ASCII paths (`OneDrive/ไฟล์งานเก่า/...`), causing `initOutputDir` to skip copying compiled config files unless run in WSL/Linux CI, an ASCII path, Node LTS, or with a `fs.cpSync` fallback preload.

### Auth UI Consistency & Google Button Responsive Fix (2026-11-16)
- Extracted shared Google Identity Services button renderer (`src/lib/google-gsi.ts`) using `ResizeObserver` + exact container width measurement and `shape: "pill"`, eliminating right-edge iframe clipping on `/login` and `/register`.
- Unified `/login` and `/register` visual rhythm: aligned all stacked auth CTAs (`เข้าสู่ระบบ`/`สมัครสมาชิก`, LINE, and Google) to pill capsules (`rounded-full`, `h-11`), standardized form inputs to `h-11 rounded-xl bg-white`, removed `hover:-translate-y-1` from static auth form cards, and fixed top logo spacing (`-my-2 md:-my-6` removed) in `src/app/(auth)/layout.tsx`.

### Security & Anti-Scraping Hardening — Part 1 (2026-11-16)
- Added `src/app/robots.txt/route.ts` to block major AI scraper/training crawlers (`GPTBot`, `ChatGPT-User`, `OAI-SearchBot`, `ClaudeBot`, `Claude-Web`, `anthropic-ai`, `Google-Extended`, `CCBot`, `Bytespider`, `PerplexityBot`, `Applebot-Extended`, `Amazonbot`, `Meta-ExternalAgent`, `Diffbot`, `Omgilibot`) and disallow indexing of `/admin/`, `/dashboard/`, `/api/`, `/complete-profile`, `/reset-password`, and `/forgot-password`.
- Hardened `next.config.ts` response headers with `X-Frame-Options: DENY`, `Content-Security-Policy: frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and `X-Robots-Tag: noindex, nofollow, noarchive` on private/API routes.
- Added shared fixed-window rate limiter (`src/lib/rate-limit.ts`) applied to public endpoints: `GET /api/tracking/[id]` (20 req/min), `POST /api/inquiry` (10 req/min), and `POST /api/contact` (5 req/min).
- Sanitized `GET /api/tracking/[id]/route.ts` to omit `product_url`, item product details, prices, and remarks from unauthenticated public tracking responses (retaining only `shipping_type` and `tracking_cn_cn` needed by `/track`).

### UX/UI Roadmap Phase 4 — Post-Audit P0–P1 Fixes (2026-11-16)
- `UX-4.1`: Fixed Next.js 16 error boundary retry prop (`unstable_retry` -> `retry`) in `src/app/dashboard/error.tsx` and `src/app/admin/error.tsx`, added `unstable_rethrow(err)` + `OrderDetailErrorCard` in `src/app/admin/page.tsx`, and linked recent inquiries & tracking log order numbers in the admin overview.
- `UX-4.2`: Corrected 3-round payment copy (TH/EN/ZH) in `src/app/(public)/how-it-works/page.tsx` and `src/app/(public)/faq/page.tsx` so Round 2 international freight billing accurately states China warehouse (Guangzhou) weighing instead of Thailand warehouse, and updated the customer quotation preview modal total in `src/app/dashboard/orders/UnifiedOrderList.tsx` to label Round 1 with a Round 2/3 footnote.
- `UX-4.3`: Separated `<Link href="/privacy">` out of `<label>` in `src/app/(public)/contact/page.tsx`; unified phone validation (`isValidThaiPhone`/`normalizeThaiPhone`) and polite Thai errors in `src/app/(auth)/complete-profile/page.tsx` and `src/app/dashboard/addresses/AddressFormModal.tsx`; added missing `htmlFor`/`id`/`autoComplete`/`role="alert"`/`aria-label`/`aria-expanded` across `reset-password/page.tsx`, `dashboard/profile/page.tsx`, `PaymentStepper.tsx`, `how-it-works/page.tsx`, `faq/page.tsx`, `admin/orders/new/page.tsx`, `admin/settings/page.tsx`, `admin/tracking/TrackingUpdateModal.tsx`, and `AdminInquiryList.tsx` (including mobile image `alt` and search clear button); synced `?status=` via `useSearchParams` in `<Suspense>` in `src/app/admin/orders/page.tsx`; distinguished desktop vs mobile `<nav>` `aria-label`s, unified `target="_blank" rel="noopener noreferrer"` and `min-h-11` mobile header buttons in `src/app/admin/layout.tsx`; fixed empty-state `colSpan={7}` in `src/app/admin/tracking/page.tsx` and empty `tel:` links in `src/app/admin/customers/page.tsx`.
- Validation: `npm run test:auth-safety` PASS, `npm run typecheck` PASS, `npm run code:clean` PASS, `npm run build` PASS (56/56 pages).
- Follow-up mobile hero polish: Un-overlaid the two floating trust badges (`ดูแลครบทุกช่วง`, `จ่ายตามจริง 3 รอบ`) below the mascot image on mobile (`< sm`) in `src/app/(public)/page.tsx` while keeping outer corner placement on `sm:+`.

### UX/UI Roadmap Phase 3 — Modal Unification, Mobile Touch Targets, A11y & Tokens (2026-11-16)
- `UX-3.1`: Migrated all 7 `custom-dialog` consumers (`PaymentSection`, `PaymentApprovalModal`, `TrackingUpdateModal`, `AddressFormModal`, `AddressSelectionModal`, `AdminCreateInquiryModal`, `AdminInquiryList`) plus `QuickRmbCalculator`, `PhoneSetupModal`, and the inline status modal in `admin/orders/page.tsx` onto Radix `@/components/ui/dialog` (`hideCloseButton` support + 40px accessible close trigger); deleted deprecated `src/components/ui/custom-dialog.tsx`. Added `role="menu"`, `aria-expanded`, `aria-haspopup`, and Escape-key dismissal to `src/components/layout/navbar.tsx`.
- `UX-3.2`: Expanded mobile touch targets across `navbar.tsx`, `footer.tsx`, `dashboard/layout.tsx`, `CustomerWarehouseCard.tsx`, `track/page.tsx`, `inquiry/page.tsx`, `pricing/page.tsx`, `login/page.tsx`, and `register/page.tsx`; made the 5-stage tracking stepper in `track/page.tsx` responsive (`grid-cols-1 sm:grid-cols-5`) to prevent Thai word-splitting on narrow viewports.
- `UX-3.3`: Bound `htmlFor`/`id` and `autoComplete` across `register`, `inquiry`, `pricing`, `track`, `QuickRmbCalculator`, and `PhoneSetupModal`; separated privacy notice links out of checkbox `<label>`s in `register` and `inquiry`; added password visibility toggles in `login` and `register`; added `role="alert"` and scroll-to-error in `inquiry`; added missing `aria-label` and `aria-pressed` attributes across admin/customer controls; improved low-contrast text in `footer.tsx` and `(public)/page.tsx`; aligned `dashboard/profile/page.tsx` with `isValidThaiPhone`/`normalizeThaiPhone`.
- `UX-3.4`: Restored real monospace stack for `--font-mono` in `src/app/globals.css`, replaced invalid `py-0.2` classes (`dashboard/layout.tsx`, `admin/layout.tsx`, `CustomerWarehouseCard.tsx`, `AdminNotificationHeader.tsx`) with `py-0.5`, removed dead `dark:` classes in `pricing/page.tsx`, synced `document.documentElement.lang` on initial cookie mount in `LanguageProvider`, and translated navbar dropdown/mobile menu labels via `src/lib/i18n.ts`.
- Validation: `npm run test:auth-safety` PASS, `npm run typecheck` PASS, `npm run code:clean` PASS, `npm run build` PASS (56/56 pages).

### UX/UI Roadmap Phase 2 — 3-Round Clarity, ConfirmDialog & Admin Polish (2026-11-16)
- `UX-2.1`: Added centralized order status helpers (`src/lib/order-status.ts`) unifying Thai labels and badge colors across `src/app/dashboard/page.tsx`, `src/app/dashboard/orders/UnifiedOrderList.tsx`, and `src/app/dashboard/orders/[id]/page.tsx` while removing raw English status codes. Updated `PaymentStepper.tsx` to distinguish in-transit waiting states from active payment-due steps, and clarified Round 1 quotation total labeling (`ยอดชำระรอบที่ 1 (ค่าสินค้า + ส่งในจีน)`).
- `UX-2.2`: Created reusable Radix-backed `ConfirmDialog` (`src/components/ui/confirm-dialog.tsx`) supporting both confirmation and validated prompt fields. Removed all remaining browser `alert()`, `confirm()`, `prompt()`, and `window.location.reload()` calls across `UnifiedOrderList.tsx`, `addresses/page.tsx`, `PaymentSection.tsx`, `ConfirmReceiptButton.tsx`, `admin/orders/page.tsx`, `admin/orders/new/page.tsx`, `AdminInquiryList.tsx`, `admin/tracking/page.tsx`, `RefundActions.tsx`, `AdminCreateInquiryModal.tsx`, and `ChinaTrackingModal.tsx` in favor of `toast` and `router.refresh()`.
- `UX-2.3`: Unified admin status colors (`getAdminOrderStageBadge`), added responsive Mobile Card View + server pagination + loading skeleton (`src/app/admin/imports/page.tsx`, `src/app/admin/imports/loading.tsx`), added 7/30-day chart toggle and mobile tick spacing in `src/components/admin/DashboardCharts.tsx`, made admin header breadcrumbs clickable in `src/app/admin/layout.tsx`, and added quote CTAs to customer order empty states.
- Validation: `npm run test:auth-safety` PASS, `npm run typecheck` PASS, `npm run code:clean` PASS, `npm run build` PASS (56/56 pages).

### UX/UI Roadmap Phase 1 — Critical Stability & Mobile Overlay Fixes (2026-11-16)
- `UX-1.1`: Replaced raw Supabase error JSON and server stack traces in `src/app/dashboard/orders/[id]/page.tsx` and `src/app/admin/orders/[id]/page.tsx` with shared `OrderDetailErrorCard` (`src/components/orders/OrderDetailErrorCard.tsx`) and `unstable_rethrow()` for Next.js navigation signals; added `src/app/dashboard/error.tsx`.
- `UX-1.2`: Hid `QuickRmbCalculator` floating trigger on auth routes, `/admin/*`, `/inquiry`, and `/invoice` (`src/components/calculator/QuickRmbCalculator.tsx`); adjusted `PaymentStepper` mobile floating pay pill to `bottom-[calc(env(safe-area-inset-bottom,0px)+5.25rem)]`; updated `MobileBottomNav` center FAB on `/inquiry` to scroll-to-top with `aria-current="page"`; compacted mobile auth logo in `src/app/(auth)/layout.tsx`; removed nested `overflow-y-auto` scroll trap in `src/app/dashboard/layout.tsx`.
- `UX-1.3`: Removed customer-facing `PhoneSetupModal` from `src/app/admin/layout.tsx` and removed `autoFocus` on mobile phone input in `src/components/dashboard/PhoneSetupModal.tsx`.
- Validation: `npm run test:auth-safety` PASS, `npm run typecheck` PASS, `npm run code:clean` PASS, `npm run build` PASS (56/56 pages).

### LINE OAuth In-App Browser Fix & Callback Diagnostics (2026-11-16)
- Diagnosed mobile `AuthFailed` (`การเข้าสู่ระบบผ่านผู้ให้บริการไม่สำเร็จ`) when LINE OAuth starts inside LINE In-App Browser or iOS non-Safari browsers and hands off back to Safari without the PKCE `code_verifier` cookie.
- Added shared browser-environment detection (`src/lib/in-app-browser.ts`) and shared LINE OAuth launcher (`src/lib/line-oauth.ts`) to break out of LINE In-App Browser using `?openExternalBrowser=1` before initiating `signInWithOAuth`.
- Added reusable `InAppBrowserNotice` banner (`src/components/auth/InAppBrowserNotice.tsx`) on `/login` and `/register` for LINE, social in-app browsers, and iOS alternative browsers with external-browser launch and 1-tap link copy.
- Added safe PII-free server error logging in `src/app/api/auth/callback/route.ts` for code exchange errors, provider errors, missing params, and profile sync errors (preserving `qa-auth-safety` restrictions).
- Extended `scripts/qa-auth-safety.mjs` with unit assertions for `in-app-browser.ts`.
- Validation: `npm run test:auth-safety` PASS, `npm run typecheck` PASS, `npm run code:clean` PASS, `npm run build` PASS (56/56 pages).

### Admin Order Workflow UX Simplification (2026-11-06)
- Simplified the highest-frequency admin workspace at `/admin/orders` without changing order/payment business logic or database behavior.
- Added one-tap Thai quick filters for the main operational stages: Round 1 payment, China dispatch, China warehouse/Round 2, cross-border shipping, Thailand warehouse/Round 3, and last-mile delivery.
- Replaced raw status-code-heavy filter labels with plain Thai operational language and added a single clear-filter action.
- Added a contextual `งานถัดไป` panel to every desktop row and mobile order card so staff can immediately see the recommended next step and why.
- Kept normal workflow actions visible while moving exceptional actions—out-of-stock, manual status override, and manual payment confirmation—under `เครื่องมือเพิ่มเติม` to reduce accidental clicks.
- Preserved the three-round payment workflow, current API calls, notifications, tracking logs, and Supabase queries.
- Validation: auth safety PASS, mobile URL audit PASS (6/6), typecheck PASS, zero-dead-code PASS, business readiness READY, production build PASS (56/56 pages).
- Authenticated visual walkthrough remains pending a safe staging admin account; production test data was not created.
- Released in commit `d8cce69`; GitHub reports Vercel deployment `success` (`68YHhH4YUwJxsmoESLJcqHjJq3qf`).
- Production smoke tests pass: `/` and `/login` return 200; unauthenticated `/admin` and `/admin/orders` return 307 to `/login`.

### November 2026 Integration Checkpoint
- Integrated and validated 26 commits after the October visual-refresh checkpoint (`c182d5a..02ae9f1`).
- Hardened account recovery, mandatory phone/profile completion, Supabase session retention, and browser email remembering.
- Improved mobile payment UX with portal-based dialogs, scroll-safe modal bodies, persistent file inputs, pinned adaptive submit actions, and a server-side slip upload fallback.
- Added multi-admin and LINE-group notification delivery, admin notification settings/testing, and a LINE webhook endpoint.
- Separated Chinese domestic tracking from the Round 2 freight invoice, added multiple per-order/per-item China tracking numbers, and exposed clearer tracking state to admins and customers.
- Added EK/SEA transport-mode selection and richer China warehouse information while removing the obsolete external tracking link.
- Improved admin orders with customer-code/name/date filtering, clearer China dispatch badges, removal of the redundant `NEW` option, and a separate "arrived in Thailand" action before Round 3 quoting.
- Centralized shared utilities, removed unused modules/assets/debug scripts, and added an automated zero-dead-code gate to typecheck and build.
- Current validation on 2026-11-06: auth safety PASS, mobile URL audit PASS (6/6), typecheck PASS, zero-dead-code PASS, business readiness READY, production build PASS (56/56 pages).
- GitHub reports Vercel deployment success for `02ae9f1`; direct Vercel CLI inspection currently requires a fresh interactive login.

### 0. Premium Public-Site Visual Refresh
- Rebuilt the homepage around a premium logistics-concierge direction while preserving the established blue/orange brand palette and mascot.
- Introduced reusable visual foundations in `globals.css`: wider radii, glass surfaces, elevated cards, balanced display text, soft brand ambience, and reduced-motion-safe animation.
- Redesigned the hero around the primary customer actions: paste a Chinese marketplace share message for a quote or track a parcel.
- Preserved automatic URL extraction, live exchange-rate calculator access, the three-payment-round explanation, and all existing public routes.
- Refreshed the public navbar, account dropdown, mobile bottom navigation, footer, shared buttons, and cards so the new visual language carries across the site.
- Kept the implementation dependency-free and CSS-driven to avoid adding client bundle weight.
- Desktop visual QA passed in a real browser. The initial 390px capture exposed horizontal crowding; mobile container math, headline sizing, and the quote form grid were corrected afterward.
- Released in commit `ade178f` and deployed successfully as `dpl_BSzkz8EGdwwjvZ1q4nkJ5cqZoRcd`.
- Production smoke tests pass: `/`, `/login`, `/inquiry`, and `/track` return 200; `/dashboard` and `/admin` return 307 to `/login`.

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
- **Production Web Vitals Instrumentation (`src/app/layout.tsx`)**:
  - Installed `@vercel/speed-insights` and mounted `<SpeedInsights />` in the root layout.
  - Instrumentation is collecting production data, but the current sample is not sufficient for mobile P75 evaluation.
- **Homepage image delivery (`src/app/(public)/page.tsx`, `src/components/layout/navbar.tsx`, `src/components/layout/footer.tsx`)**:
  - Replaced oversized hero, navbar, and footer image markup with `next/image` sizing and responsive `sizes` hints.
  - Added explicit dimensions to marketplace flag images to prevent layout reservation gaps.
  - Local mobile Lighthouse no longer reports image-delivery savings or unsized images; CLS is 0.001 and Speed Index is 2.5 seconds.

### 2. Admin Layout Sign-Out & Desktop Header
- **Desktop Sidebar Navigation (`src/app/admin/layout.tsx`)**:
  - Made the desktop admin sidebar sticky (`sticky top-0 h-screen`) with independent scrolling (`flex-1 overflow-y-auto`) so the footer never gets pushed off-screen on long admin views.
  - Sidebar sticky footer now includes a clean "เปิดหน้าบ้าน (เว็บไซต์)" link and a prominent "ออกจากระบบ" button with icon.
- **Desktop Top Header (`src/app/admin/layout.tsx`)**:
  - Added a dedicated top header bar on desktop (`hidden md:flex h-16 bg-white border-b`) with dynamic breadcrumbs, admin role badge, logged-in admin email, "หน้าบ้าน" button, and a prominent red "ออกจากระบบ" button.
- **Mobile Header & Navigation (`src/app/admin/layout.tsx`)**:
  - Enhanced the mobile header logout button with a clear "ออกจากระบบ" text label and icon.
  - Added a direct "ออกจากระบบ" quick action button at the end of the mobile horizontal navigation pill bar.

### 3. Session Retention & Login Email Remembering
- **Prevent Inactive Tab Kickout (`src/app/admin/layout.tsx`)**:
  - Removed the aggressive 30-minute client-side `idleTimer` that was calling `supabase.auth.signOut()` whenever the admin switched tabs or windows to perform other tasks.
  - Admin authentication session is now naturally preserved and refreshed via Supabase refresh tokens without premature logouts.
- **Login Email Persistence & Browser Autofill (`src/app/(auth)/login/page.tsx`)**:
  - Defaulted the "จำอีเมล" (Remember Email) checkbox to `true`.
  - Added real-time persistence of entered email to `localStorage` (`sabuy_remember_identifier` and `sabuy_last_email`).
  - Added `id="email"`, `name="email"`, `autoComplete="email username"` and `id="password"`, `autoComplete="current-password"` to activate native browser credential autofill.
- **Session Cookie Forwarding in Middleware (`src/lib/supabase/middleware.ts`)**:
  - Implemented `createRedirectResponse` to guarantee refreshed session cookies are forwarded on internal middleware route guard redirects.

### 4. Mandatory Phone Number Enforcement at Registration
- **Email/Password Registration (`src/app/(auth)/register/page.tsx`)**:
  - Validated that the phone number is provided and strictly 9-10 digits (`cleanPhone.length >= 9 && cleanPhone.length <= 10`).
  - Saved normalized phone number to Supabase auth metadata.
- **Social / OAuth Registration & Login (`src/app/(auth)/register/page.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/api/auth/callback/route.ts`)**:
  - Checked profile phone existence upon Google and LINE authentication.
  - Automatically redirected any user without a valid phone number directly to `/complete-profile`.
- **Middleware Guard (`src/lib/supabase/middleware.ts`)**:
  - Enforced `hasPhone` check across all `/dashboard` routes and `/admin` routes.
  - Blocked access to dashboard until `/complete-profile` is completed.
- **Complete Profile Validation (`src/app/(auth)/complete-profile/page.tsx`)**:
  - Added strict 9-10 digit numeric format validation on `/complete-profile` before saving.

### 5. Payment Modal Scrolling & Pinned Submit Button
- **Modal Portal & Stacking Context Fix (`src/components/ui/custom-dialog.tsx`, `src/components/orders/PaymentSection.tsx`, `src/components/orders/PaymentStepper.tsx`)**:
  - Updated `custom-dialog.tsx` to render via `createPortal(..., document.body)` with `z-[100]` and `cn()` class merging so the Payment Modal escapes `PaymentStepper`'s `z-10` stacking context and renders strictly above `MobileBottomNav` (`z-50`), `FloatingLineButton` (`z-50`), and the mobile floating pay pill (`z-40`).
  - Kept `<input ref={fileInputRef} type="file">` permanently mounted without `required` on a hidden input, preventing mobile browser HTML5 validation from silently blocking submission.
  - Made the pinned bottom CTA button adaptive: tapping it before file selection opens the mobile photo picker (`📷 เลือกรูปสลิปเพื่อแจ้งโอน`), and once selected it turns green (`✓ ยืนยันแจ้งชำระเงิน`) to submit directly.
  - Added server-side `multipart/form-data` fallback in `POST /api/order/[id]/payment` and safe client compression fallback (`useWebWorker: false` with 6s timeout).
  - Fixed `PaymentStepper.tsx` floating pay pill condition from `s.round !== 2` to `s.round !== 3`.

## Validation Completed

- `git diff --check main` — passed with 0 whitespace warnings and 0 formatting errors.
- `npm.cmd run typecheck` — passed with 0 errors.
- `npm.cmd run test:auth-safety` — passed.
- `node scripts/qa-mobile-audit.mjs` — passed all 6 test cases for URL extraction unit test suite.
- `npm.cmd run schema:check` — passed (15 tables, RLS checks, auth admin, storage buckets verified).
- `npm.cmd run business:check` — passed (READY).
- `npm.cmd run build` — passed (56/56 static pages generated, webpack production build successful on 2026-11-06).
- Local mobile Lighthouse after image optimization: performance 69, FCP 1.6 s, LCP 5.4 s, TBT 410 ms, CLS 0.001, Speed Index 2.5 s, zero image-delivery savings, and zero unsized images. The LCP value includes a cold local image optimizer and requires production remeasurement.
- Production mobile Lighthouse on `dpl_J4GVdPYL71bYRqC4712FvP7boTHm`: performance 69, FCP 1.2 s, LCP 4.4 s, TBT 270 ms, CLS 0, no image-delivery opportunity, zero unsized images, and 565 KiB total payload. The run's Speed Index was excluded because its observed navigation timing contained an inconsistent 19.4-second offset.
- **Unauthenticated Mobile Browser Walkthrough (390x844)** — PASS. Executed on `http://localhost:3000`. Recording: `mobile_qa_walkthrough_1790231063711.webp`.
- **Authenticated Mobile Customer Walkthrough (390x844)** — **BLOCKED: TEST ACCOUNT REQUIRED**. No test account provided; creating test accounts or mock data in production Supabase (`kzqbzrfcdrnghwjpmany`) is strictly prohibited.
- Zero mock transactions or destructive database alterations were performed in production.
- Production `/`, `/login`, and `/inquiry` return HTTP 200.
- Unauthenticated Production `/dashboard` and `/admin` return HTTP 307 to `/login`.
- Production OAuth cancellation redirects to `/login?error=AuthCancelled` without forwarding `error_description`.
- Production login markup advertises email-only authentication.
- Production `/_vercel/speed-insights/script.js` returns HTTP 200.
- Production deployment `dpl_4kZBbEDSu3QJzvjacz9NkdGs72Vi` is Ready and aliased to `www.sabuyship.com`.
- Post-deploy smoke checks pass: `/`, `/login`, and `/inquiry` return 200; `/dashboard` and `/admin` return 307 to `/login`; OAuth cancellation returns only `AuthCancelled`.
- Image optimization release `cd91117` deployed as `dpl_J4GVdPYL71bYRqC4712FvP7boTHm`; Vercel reports Ready and aliases it to `www.sabuyship.com`.

### 6. Chinese Domestic Tracking Step Separation from Round 2 Freight Invoice
- **Business Requirement**: Separated Chinese domestic tracking input from Round 2 freight quotation. Admin enters Chinese tracking when merchant dispatches goods, notifying customer that goods are en route to the China warehouse. Round 2 shipping cost is only evaluated when parcel arrives at China warehouse.
- **Multi-Tracking Support**: Upgraded `ChinaTrackingModal.tsx` and `POST /api/admin/orders/[id]/china-tracking` so admins can dynamically add unlimited Chinese tracking numbers (`+ เพิ่มช่องใส่เลขแทร็ก`) both across the order and per product link (`tracking_numbers_cn`).
- **Admin & Customer Side**: Updated `admin/orders/[id]` and `dashboard/orders/[id]` to split and display each Chinese tracking number with its own `#1, #2` badge, copy button, and `17TRACK` link.

### 7. Navbar Top CTA Updated to "My Orders"
- Updated the primary top-right orange CTA button across desktop and mobile navbars from "ส่งลิงก์สินค้า" (`/inquiry`) to "คำสั่งซื้อของฉัน" (`/dashboard/orders`).
- Updated the button icon to `Package` to match the order tracking identity.
- Added localized translations in `src/lib/i18n.ts`: `navMyOrders` (TH: "คำสั่งซื้อของฉัน", EN: "My Orders", ZH: "我的订单").

### 8. China Warehouse Address Card - Transport Mode (EK/SEA) Selector
- **User Request**: Added options for customers to copy the China warehouse address specifying transport method: ทางรถ (EK) or ทางเรือ (SEA).
- **Implementation (`src/components/dashboard/CustomerWarehouseCard.tsx`)**:
  - Added interactive mode switcher tabs: `🚚 ทางรถ (EK)` (5-7 days) and `🛳️ ทางเรือ (SEA)` (15-20 days).
  - Dynamic Consignee: `傅先生 ${customerCode}(EK)` or `傅先生 ${customerCode}(SEA)`.
  - Dynamic Detailed Address: `广东省广州市白云区人和镇人和大街68号（万宝集团）进大门右转直走到底61号仓（泰国专线仓库） (${customerCode}/EK)` or `...(${customerCode}/SEA)`.
  - Smart Paste 1-Click copy updated to bundle the selected shipping mode and label (`Smart Identify` format).
  - Alert box highlighted with the selected shipping mark (`外包装上请务必写上入仓唛头: ${customerCode}/${suffix}`).

### 9. Admin LINE Notification Diagnostic and Fix
- **Root Cause**: `src/lib/notify.ts` had a hardcoded `if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return true;` which prematurely aborted all notification dispatches before sending to LINE API or logging to Supabase.
- **Fixes**:
  - Removed early return; added conditional `[DEMO]` prefix instead when demo mode is active so test and preview dispatches are never swallowed.
  - Added full error body capture and status logging to `notification_logs`.
  - Updated `src/app/api/contact/route.ts` to utilize unified `sendAdminNotification`.
  - Added `POST /api/admin/notifications/test` for on-demand admin verification.
  - Added `AdminNotificationHeader` in `src/app/admin/notifications/page.tsx` with live status badge and a "ทดสอบส่งแจ้งเตือน LINE" button.

### 10. Multi-Admin LINE Notification Broadcast
- **Requirement**: Notify all administrators and LINE OA staff (even non-website admins or LINE groups) upon new orders, payment slips, and inquiries.
- **Implementation**:
  - Created `getAdminLineUserIds()` in `src/lib/notify.ts`: merges UIDs (`U...`) and Group/Room IDs (`C...` / `R...`) from `LINE_ADMIN_USER_ID` env, `site_settings.line_admin_user_ids`, and active admin profiles with `line_uid`.
  - Uses LINE Multicast API (`/v2/bot/message/multicast`) for personal user IDs and Push API (`/v2/bot/message/push`) for LINE Group/Room IDs.
  - Added `GET` & `POST` endpoints at `/api/admin/notifications/settings` returning all LINE-connected website users so admins can toggle notification delivery for any staff member with 1 click without granting website admin privileges.
  - Added `/api/line/webhook` endpoint replying with User ID / Group ID when a user or group types `#uid`.
  - Updated `AdminNotificationHeader.tsx` modal with 1-click staff selector and LINE Group instructions.




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
- **Staging workflow execution**: `BLOCKED: STAGING PROJECT INACTIVE`
  - Supabase CLI confirms `sabuyship-staging` (`rhillakurearebtzjwyr`) is linked but currently `INACTIVE`.
  - Supabase CLI exposes no resume command. The project owner must open Supabase Studio, select `sabuyship-staging`, and click `Resume project`.
  - `scripts/staging-workflow-smoke.mjs` now reads `.env.staging.local` by default, creates temporary customer/admin users, exercises all three payment rounds, and removes its test data afterward.
  - The runner refuses to execute unless both its environment and the linked CLI project match the staging ref. A focused safety check confirms `.env.local` (production) is rejected.

## Untested Items

- Real payment transactions: **NOT TESTED** (Strict safety rule: forbidden to execute real financial transfers in production).
- Live LINE OAuth token exchange on production domain: **NOT TESTED** (Requires live LINE Channel Secret & production redirect URI).
- Real-user mobile Web Vitals (P75 LCP/CLS/INP): **PENDING TRAFFIC** (No mobile samples collected through 2026-09-29).

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
- `package-lock.json`
- `src/components/layout/NotificationBell.tsx`
- `src/app/admin/notifications/AdminNotificationHeader.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/custom-dialog.tsx`
- `src/components/admin/ChinaTrackingModal.tsx`
- `src/app/api/admin/orders/[id]/china-tracking/route.ts`
- `src/app/api/order/[id]/payment/route.ts`
- `src/lib/notify.ts`
- `src/app/api/customer/badge-counts/route.ts`
- `src/app/api/customer/notifications/route.ts`
- `src/app/api/admin/badge-counts/route.ts`
- `src/app/api/admin/orders/route.ts`
- `src/app/api/order/[id]/route.ts`
- `src/app/api/order/consolidate/route.ts`
- `src/app/api/inquiry/admin/approve-import/route.ts`
- `src/app/(public)/track/page.tsx`
- `src/components/calculator/QuickRmbCalculator.tsx`
- `src/components/orders/PaymentStepper.tsx`
- `src/components/admin/PaymentApprovalModal.tsx`
- `src/components/admin/QuoteModal.tsx`
- `src/app/admin/inquiries/AdminInquiryList.tsx`
- `src/app/admin/orders/page.tsx`
- `src/app/admin/orders/[id]/page.tsx`
- `src/app/admin/orders/[id]/AdminOrderActions.tsx`
- `src/app/admin/tracking/TrackingUpdateModal.tsx`
- `src/app/admin/tracking/ExcelUploadModal.tsx`
- `src/app/admin/customers/AdminCreateInquiryModal.tsx`
- `src/components/dashboard/PhoneSetupModal.tsx`
- `src/lib/supabase/middleware.ts`
- `src/app/(auth)/register/page.tsx`
- `src/app/(auth)/forgot-password/page.tsx`
- `src/app/(auth)/reset-password/page.tsx`
- `docs/ai/TASKS.md`
- `docs/ai/HANDOFF.md`
- `docs/ai/CHECKPOINT.md`
- `docs/ai/CURRENT_ASSIGNMENT.md`

## Remaining Follow-Up

- Final integration code corrections are complete and local validation passes.
- Authenticated mobile customer walkthrough remains blocked pending a safe non-production test account.
- Vercel Speed Insights instrumentation is installed and its production script endpoint is healthy.
- Production data through 2026-09-29 contains two Chrome desktop samples for `/`: aggregate LCP P75 2.116 s, TTFB P75 307 ms, and no INP sample. The first CLS sample was 0.9762 while the latest sample is 0; the dataset remains too small for a statistically actionable conclusion.
- No mobile LCP, CLS, or INP samples are available yet. Recheck after at least 20 mobile samples exist; investigate only if mobile P75 CLS remains above 0.1 or mobile P75 LCP remains above 2.5 seconds.
- Google PageSpeed Insights could not provide a lab run during this audit because the public API returned HTTP 429.
- Staging workflow execution remains blocked until the paused Supabase staging project is resumed and a gitignored `.env.staging.local` is available.

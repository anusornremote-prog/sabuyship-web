# Current Handoff

Last updated: 2026-10-06 (Asia/Bangkok)

## Repository State

- Active branch: `main`
- Primary branch: `main`
- Production domain: `https://www.sabuyship.com`
- Verified production deployment: `dpl_BSzkz8EGdwwjvZ1q4nkJ5cqZoRcd`
- Production Supabase project ref: `kzqbzrfcdrnghwjpmany`
- Staging Supabase project ref: `rhillakurearebtzjwyr`

Never replace production environment values with staging values. Do not place any API keys in this document.

## Completed Work

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
- `npm.cmd run build` — passed (54/54 static pages generated, webpack production build successful).
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
- **Admin Side**: Added `ChinaTrackingModal`, action button `ใส่แทร็กจีน` / `แก้ไขแทร็กจีน`, Chinese tracking badges, and detail card in `admin/orders`.
- **API**: Added `POST /api/admin/orders/[id]/china-tracking` which logs `CHINA_TRANSIT` to `tracking_logs`, updates audit logs, and notifies customer.
- **Customer Side**: Updated `PaymentStepper` and `dashboard/orders/[id]` with Chinese tracking pill, copy button, and tracking link.

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

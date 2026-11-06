# Checkpoint: October–November Production Hardening

Date: 2026-11-06 (Asia/Bangkok)
Branch: `main`
Owner: Integration / Codex
Status: DEPLOYED, VALIDATED, DOCUMENTED

## Scope

This checkpoint covers 26 commits after the public-site visual refresh, from `25209ef` through `02ae9f1`. The work spans authentication, mobile payment UX, LINE notifications, China tracking, admin order operations, shared utilities, and repository hygiene.

## Delivered

- Added explicit admin logout controls and a sticky desktop admin shell.
- Prevented inactive-tab session kickouts and improved remembered-email behavior.
- Enforced valid phone/profile completion across email, OAuth, dashboard, and admin flows.
- Hardened forgot/reset-password recovery behavior.
- Made payment dialogs mobile-safe and added a server multipart slip fallback.
- Added multi-admin/LINE-group notifications, admin notification diagnostics, and webhook support.
- Separated Chinese domestic tracking from Round 2 quoting and supported multiple tracking numbers per order/item.
- Added EK/SEA transport selection and clearer warehouse/tracking presentation.
- Improved admin order searching, status actions, Thailand-arrival handling, and Round 3 separation.
- Removed obsolete external tracking and redundant order status UI.
- Centralized constants, phone validation, URL extraction, and auth error translation.
- Removed dead modules, unused assets, and one-off scripts; automated the zero-dead-code check.

## Verification (2026-11-06)

| Check | Result |
| --- | --- |
| `npm.cmd run test:auth-safety` | PASS |
| `node scripts/qa-mobile-audit.mjs` | PASS (6/6) |
| `npm.cmd run typecheck` | PASS |
| `npm.cmd run code:clean` | PASS (0 unused modules/assets) |
| `npm.cmd run business:check` | PASS (READY) |
| `npm.cmd run build` | PASS (56/56 generated) |
| Git workspace | CLEAN, synchronized with `origin/main` before this documentation checkpoint |
| Latest commit deployment | GitHub Vercel status `success` for `02ae9f1` |

## Deployment Evidence

- Latest production commit: `02ae9f1bc6ec5f91fea64190ccbfba0de878512a`
- GitHub deployment context: `Vercel`
- Deployment result: `success` — `Deployment has completed`
- Status completed: 2026-11-05 17:04:59 Asia/Bangkok
- Vercel dashboard target: `https://vercel.com/anusornremote-progs-projects/sabuyship/DHpkpbXZhqbRzUsh1rP7nuXLzBW8`
- Direct Vercel CLI currently reports that a new interactive login is required; no unverified deployment ID is recorded.

## Remaining External Work

- Resume staging Supabase project `rhillakurearebtzjwyr`.
- Run the authenticated customer/mobile regression suite against staging after safe credentials are available.
- Continue collecting real-user mobile Web Vitals until at least 20 samples are available.
- Add a dashboard aggregate RPC only if customer order volume makes current aggregation materially slow.

## Safety Notes

- No production test accounts, fake orders, or financial transactions were created.
- No Supabase environment values or secrets were changed.
- The three-round payment workflow remains preserved.

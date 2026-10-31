<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Sabuyship Collaboration & Professional Engineering Rules

Before changing code:

1. Read `docs/ai/HANDOFF.md`, `docs/ai/DECISIONS.md`, and `docs/ai/TASKS.md`.
2. Run `git status --short --branch` and do not overwrite unrelated uncommitted work.
3. Keep production Supabase and staging Supabase separate. Never copy staging environment values to production.
4. Never commit `.env.local`, access tokens, service-role keys, passwords, customer data, or generated login links.
5. Preserve the three-round payment workflow and update `tracking_logs` for important order/payment state transitions.
6. Prefer focused root-cause fixes and maintain a clean, modular architecture (`src/lib/` for shared utilities/constants, `src/components/` for reusable UI, `src/app/api/` for validated server endpoints).

Code Quality Standards:

1. **DRY & Single Source of Truth:** Centralize shared constants (`src/lib/constants.ts`), phone/profile validators (`src/lib/phone.ts`), URL extractors (`src/lib/product-link.ts`), and auth error translators (`src/lib/auth-errors.ts`).
2. **Defensive API & DB Practices:** Validate numeric/string inputs on both client and server, enforce `requireAdmin` / ownership checks on every protected route, and guard against nullable Supabase relations.
3. **Mobile & Desktop UX Parity:** Ensure all modals, dropdowns, and forms work smoothly on mobile viewports (`100dvh`, `overscroll-contain`, `touch-pan-y`, `createPortal`).
4. **Zero Dead Code:** Do not leave one-off debug scripts or unused test artifacts in the repository.

Before handing work off:

1. Run the narrowest relevant tests, then `npm run typecheck` and `npm run build` for application changes.
2. Run `npm run schema:check` when Supabase queries, tables, storage, or policies are affected.
3. Update `docs/ai/HANDOFF.md` with changed files, tests, remaining work, risks, and deployment status.
4. Commit small, descriptive checkpoints using Conventional Commits (`feat:`, `fix:`, `refactor:`).

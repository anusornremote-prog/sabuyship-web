<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Sabuyship Collaboration Rules

Before changing code:

1. Read `docs/ai/HANDOFF.md`, `docs/ai/DECISIONS.md`, and `docs/ai/TASKS.md`.
2. Run `git status --short --branch` and do not overwrite unrelated uncommitted work.
3. Use a dedicated branch and worktree when another agent may be working concurrently.
4. Keep production Supabase and staging Supabase separate. Never copy staging environment values to production.
5. Never commit `.env.local`, access tokens, service-role keys, passwords, customer data, or generated login links.
6. Preserve the three-round payment workflow and update `tracking_logs` for important order/payment state transitions.
7. Prefer focused root-cause fixes. Do not refactor unrelated code in the same task.

Before handing work off:

1. Run the narrowest relevant tests, then `npm run typecheck` and `npm run build` for application changes.
2. Run `npm run schema:check` when Supabase queries, tables, storage, or policies are affected.
3. Update `docs/ai/HANDOFF.md` with changed files, tests, remaining work, risks, and deployment status.
4. Update `docs/ai/DECISIONS.md` when architecture, infrastructure, or business rules change.
5. Update `docs/ai/TASKS.md` so ownership and status remain current.
6. Commit small, descriptive checkpoints. Do not deploy or push unless the user requested it.

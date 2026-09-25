# Architecture and Product Decisions

## Infrastructure

### Production and Staging Supabase Must Stay Separate

- Production ref: `kzqbzrfcdrnghwjpmany`
- Staging ref: `rhillakurearebtzjwyr`
- Production contains the established user accounts and enabled OAuth configuration.
- Environment changes must be verified by project ref before deployment.
- Never document or commit anon keys, service-role keys, provider secrets, or database passwords.

### Vercel Is the Production Host

- Canonical domain: `https://www.sabuyship.com`
- Deploy only after a successful local typecheck and production build.
- Record the deployment ID in `HANDOFF.md` after each production deployment.

## Authentication

- Protected routes continue to use authoritative Supabase authentication checks.
- Email/password authentication uses the email identity created during registration. Phone numbers are profile/contact metadata and are not advertised as login identifiers.
- OAuth callback URLs expose only opaque application error codes, never raw provider error descriptions.
- Proxy runs only on `/dashboard`, `/admin`, login, registration, and profile-completion routes.
- Public navigation may use the local Supabase session cookie only for display decisions; authorization remains server-side and protected by RLS/API checks.
- Missing phone information is handled by the dashboard phone modal instead of an extra Proxy database lookup.

## Performance

- Public routes should remain statically generated whenever they do not need request-specific data.
- Do not read cookies or headers from the root layout unless strictly necessary.
- Independent Supabase queries should run concurrently.
- Avoid loading Supabase, ExcelJS, Recharts, image compression, or other heavy libraries on public initial routes unless immediately required.
- Use route-level loading UI for data-heavy dashboard and admin navigation.
- Collect production Core Web Vitals with Vercel Speed Insights from the root layout and evaluate mobile P75 LCP, CLS, and INP after deployment.

## Product Link Handling

- Customers may paste complete Chinese marketplace share messages.
- The system extracts and stores the first valid HTTP(S) URL.
- Normalize again at the API boundary; do not rely only on browser validation.

## Business Workflow

- Preserve the three payment rounds: product, China-to-Thailand freight, and Thailand delivery.
- Important order or payment status transitions must create `tracking_logs` entries.
- Database columns use `snake_case`.

## Collaboration

- One branch and worktree per active AI task.
- One integration owner reviews merges and production deployments.
- No AI should rewrite unrelated uncommitted changes or deploy another agent's branch without review.

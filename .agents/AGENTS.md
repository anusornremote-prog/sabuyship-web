<!-- BEGIN:auto-commit-rule -->
# Auto-Commit Code Changes
Every time you finish making code changes or implementing a feature, you MUST run `git add .`, `git commit -m "..."`, and `git push` to GitHub immediately, without waiting for the user to instruct you to do so.
<!-- END:auto-commit-rule -->

<!-- BEGIN:direct-execution-rule -->
# Direct Execution Mode (No Blocking Confirmations)
- Do NOT pause or block to ask for approval on implementation plans or trivial decisions.
- Do NOT set RequestFeedback to true on artifacts unless the user explicitly requests an approval step.
- Do NOT use ask_question tool for routine preferences.
- When the user gives a request or feature, execute it directly from start to finish, verify with build, auto-commit, and report the result.
<!-- END:direct-execution-rule -->

<!-- BEGIN:professional-engineering-standards -->
# Professional Software Engineering Standards (มาตรฐานโค้ดระดับมืออาชีพ)
Every code modification MUST adhere to the following senior-engineer standards:

1. **Single Source of Truth (DRY Principle):**
   - Put shared validators, constants, and helpers in `src/lib/` (e.g., `src/lib/phone.ts`, `src/lib/constants.ts`, `src/lib/product-link.ts`, `src/lib/auth-errors.ts`).
   - Never duplicate business rules, regexes, or magic strings (such as LINE OA IDs or order status strings) across multiple components or API routes.

2. **Clean Architecture & Separation of Concerns:**
   - **API Routes (`src/app/api/**`):** Always enforce authentication/authorization (`requireAdmin` or `getAuthenticatedUser`) at the top of the handler, validate and sanitize request payloads (`Number.isFinite`, `.trim()`), record state transitions in `tracking_logs`, and return structured JSON responses with appropriate HTTP status codes.
   - **UI Components (`src/components/**`):** Keep components modular, accessible, and mobile-first. Render modals/dropdowns that overlay fixed headers using `createPortal(..., document.body)` with proper `z-index` layering and touch-scroll (`overscroll-contain`, `touch-pan-y`) support.
   - **Database Queries:** Always use `snake_case` column names matching the PostgreSQL schema, and guard against `null` or array/object variations in Supabase foreign-key joins.

3. **Strict TypeScript & Error Handling:**
   - Ensure `npm run typecheck` passes with zero errors before every commit.
   - Never expose raw English database/provider error messages or stack traces to end users; translate user-facing errors into clear, polite Thai messages.

4. **Repository Hygiene & Automated Zero-Dead-Code Enforcement:**
   - `tsconfig.json` enforces `"noUnusedLocals": true` and `npm run code:clean` (`scripts/check-dead-code.mjs`) runs automatically inside `npm run typecheck` and `npm run build`.
   - Every time you edit or refactor a file, you MUST immediately remove any unused imports, unused variables, or orphaned component/utility files so that zero dead code ever accumulates.
   - Never leave temporary debug scripts, unused files, or hardcoded credentials in the repository.
   - Use Conventional Commit messages (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`).
<!-- END:professional-engineering-standards -->

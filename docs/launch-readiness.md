# Website launch readiness — September 14, 2026

## Implemented

- Upgraded Next.js and its ESLint configuration to 16.3.5, Sharp to 0.35.4, and vulnerable compatible dependencies. npm audit reports zero known vulnerabilities across the complete dependency tree at verification time.
- Kept presentation generation and the shadcn CLI in development dependencies. PptxGenJS's unused image-size dependency is pinned to patched 2.0.4 with an override; a local presentation containing text and a PNG exported successfully.
- Cleared ESLint errors and warnings, removed unused code, normalized Supabase to-one joins, and corrected component state/effect handling. Search results cannot reopen after clearing a pending search; animations cancel obsolete frames.
- Updated immediate membership cancellation for modern Stripe invoice payments and item billing periods. Refunds use the invoice's allocated amount, stable cancellation time and an idempotency key. Ambiguous paid invoices stop for manual review before cancellation. Stripe account deauthorization now uses the connected account on the event.
- Applied `20260914170525_legacy_rpc_authorization.sql` to TeeAhead production (`raqarpvbcdpgojcrmpyh`). Listing claims require the caller's own identity; permission checks prevent looking up another user's permissions except through the service role; walk-ins validate players and amounts and use the same lock order as member reservations.
- Preserved the newer waitlist changes from production main (`df36806`). The separate mobile application was not changed.
- Archived two unused, untracked website files under `.local-backups/2026-09-14-launch-readiness/src/` (NavMenu.tsx and proxy 4.ts). They remain recoverable locally and are not part of deployment.

## Repeatable release checks

From the project directory:

```sh
npm ci
npm run verify
npm run build
```

`verify` requires zero ESLint warnings, TypeScript success, the complete Vitest suite, and three isolated PGlite database suites. Vercel's build command runs verification before building, so a failed check prevents a new deployment from replacing production.

GitHub Actions also starts disposable Postgres 17 and runs real concurrent reservation tests. Each test forces two separate database connections to overlap on the final spot. Both member/member and member/walk-in scenarios must produce exactly one booking, no negative capacity, and no deadlock. This test refuses remote database hosts and requires an empty database named `teeahead_verification`. `TEST_PGHOST`, `TEST_PGPORT`, `TEST_PGUSER`, and `TEST_PGPASSWORD` configure this local fixture; never use production credentials.

## Verification evidence

- 612 unit/component tests pass after merging the latest waitlist changes.
- Lint and TypeScript pass.
- Core booking, cancellation/restoration, guest-grant replay, access controls and legacy RPC suites pass against isolated PostgreSQL-compatible databases.
- The security migration applies to a local schema-only copy containing the production tables, constraints, triggers and policies. No customer rows were copied.
- Postgres 17 simultaneous member/member and member/walk-in final-slot tests pass.
- Live negative authorization checks pass inside a rolled-back transaction; no customer data was changed.
- Next.js 16.3.5 production build passes before the waitlist merge; GitHub and Vercel repeat the build on the merged release.
- Stripe refund tests use mocks. No live card charges or refunds were created.

## Deliberately deferred

The user declined creating or upgrading a Supabase project. Therefore:

- A separate cloud staging database and working Vercel preview runtime are not configured. `qa.teeahead.com` remains a production alias, not staging.
- Full browser signup → Stripe test checkout → confirmation → cancellation/refund verification remains pending isolated Supabase and Stripe test-mode credentials.
- Supabase leaked-password protection remains disabled because it requires Pro or above. See [Supabase password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

The remaining SECURITY DEFINER advisor notices are expected for explicitly authorized helpers and aggregate availability. They have restricted grants/caller checks; removing them purely to clear warnings would break authorized workflows. The 12 RLS-without-policy INFO notices describe server-only CRM/benefit tables that deny direct client access. See [Supabase's function advisory](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

Before a future staging test, provision an isolated database, apply the repository migrations to its appropriate baseline, use only Stripe test keys/prices/webhooks, use test mail delivery, and scope those variables to Vercel Preview. Do not copy production service credentials to Preview.

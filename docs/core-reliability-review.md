# TeeAhead reliability review — September 14, 2026

## Current project

TeeAhead combines a golfer membership and booking app, course onboarding and tee-sheet tools, a course CRM, and public marketing pages. It uses Next.js 16 App Router, React 19, Supabase Auth/Postgres, Stripe Connect and subscriptions, Resend, and Vercel. Database migrations live in `supabase/migrations`; unit/component tests live in `src/test`; Playwright tests live in `tests`.

The browser confirmed the `teeahead` project in the TeeAhead Vercel team. Production was on main commit `3b5b19409db13537162578565df6669d1d4942d5` when inspected. The local work started on `feat/mobile-signup-membership` and is now on `codex/core-reliability`. This branch includes that feature branch's existing work; it is not a small patch directly on production main.

The Codex MCP server `vercel-teeahead` uses `https://mcp.vercel.com`. After refreshing OAuth authorization on September 14, a live MCP query successfully read the TeeAhead project (`prj_smPU5K8b5OYn72z4obMMoFPPUiwA`) in the TeeAhead team (`team_XFO4TlGEVOBDcgUvgyIWOJk1`). It returned the Next.js configuration, domains and READY production deployment. The original app connector targets a different account; this verified connection is separate.

## Changes in this repair

- Onboarding reads and writes now require the course's invite cookie or an authorized manager/admin. The invite token is validated before a secure HttpOnly cookie is issued, checked again for revocation, and omitted from browser course props.
- Both booking paths calculate prices, member tier, discounts, carts and benefits on the server. Client display totals cannot determine charges. Guest discounts apply once and also apply to online payments.
- Booking insertion, capacity reservation, pass claims, points debits, complimentary rounds and credit consumption run in one database transaction. Partial credit use preserves the remainder.
- Online payments use the stored quote and a stable Stripe idempotency key. Retryable errors preserve the booking selection. Payment settlement verifies the intent and amount, is safe to replay, and leaves point awards to round completion.
- The general Stripe webhook retries previously recorded but unfinished events, returns a failure response on database errors, and prevents delayed payment-failure events from overwriting confirmed payments.
- Membership pause, resume and cancellation update Stripe first, after verifying subscription ownership, then synchronize the displayed state. A pause voids invoices during the chosen period; it does not shift the renewal date or refund previous payments.
- Public tee-time availability uses an aggregate-only function instead of access to complete booking rows. Booking inserts and financial-field updates require authorized server code.
- Guest-pass issuance is server-only rather than an exported browser-callable Server Action.
- Exact untracked duplicate files were moved to `.local-backups/core-reliability-2026-09-14/`. The manifest records original paths and hashes. Differing files were preserved. Backups and worktrees are excluded from normal checks.

Concurrent waitlist changes, `NavMenu.tsx`, `src/proxy 4.ts`, and migrations 098–101 were preserved. They are separate from this repair.

## Release validation — September 14

The release now includes durable cancellation requests, Stripe intent cancellation/refunds with stable retry keys, atomic inventory/benefit restoration, 15-minute pending-payment holds, availability-triggered cleanup and a daily Vercel cron backstop. Expiry preserves a payment that completes while cleanup runs. Member-requested cancellation refunds a paid booking before restoring inventory.

Membership events share one handler and use a database grant ledger keyed by subscription and membership anniversary. Web checkout, invoice and native subscription events cannot issue duplicate passes for that year. The founding trial and first paid invoice use the same anniversary key. The existing production `/api/stripe/webhook` URL delegates to the shared handler. Its live event subscriptions were updated after deployment, preserving the URL and signing secret.

Waitlist tests now reflect the email/ZIP launch-interest form, which does not select a referring course or create paid referral attribution. Paid referral attribution is conditional on a paid invoice and uses the correct membership `user_id` column.

Local validation: 600 unit/component tests pass, TypeScript passes, and the production build passes. The live public schema was copied without customer rows into isolated local PGlite: 71 tables, 283 constraints, 77 indexes, 27 triggers and 120 policies. Auth functions/users are minimal local substitutes. Both additive migrations load with function-body validation enabled. Transaction tests verify cancellation, point/credit/pass restoration, expiration, repeat payment handling, capacity and private RPC permissions. This is not a Stripe test-card run or a multi-connection load test.

No cloud staging database was created. The local schema copy is the database staging environment; preview smoke checks must remain read-only when using the production database. Existing general lint errors remain outside this repair.

## Release order and rollback

1. Push the reviewed release branch and verify its Vercel preview build.
2. Apply the two additive migrations: core reliability and booking lifecycle. Existing booking policies remain during this phase.
3. Deploy the release through production main and wait for READY.
4. Apply `booking_access_cutover` to remove the old broad booking access and enable the financial-field protection trigger. Verify required client flows through server actions.
5. Update the existing Stripe webhook event subscriptions, keeping its URL and signing secret. Confirm production routes, migrations, webhook configuration and runtime errors.

If the application must be rolled back after cutover, restore the prior booking policies/view grants and remove the new update trigger before routing traffic to an old deployment. Additive columns/tables/functions can remain. Preserve the previous production deployment ID for a routing rollback. Refunds already completed at Stripe cannot be undone by rolling back code.

`qa.teeahead.com` was a production alias when inspected and must not be treated as an isolated staging database. No native booking source code is present in this repository; native membership routes are tested, and any external native clients doing direct booking writes must migrate to an authorized server API.

## Repeat checks

```bash
cd /Users/barris/Desktop/MulliganLinks
npm test
npx tsc --noEmit
npm run build
```

Database checks use a dependency installed outside the repository:

```bash
npm install --prefix /private/tmp/teeahead-db-verification --no-save --ignore-scripts @electric-sql/pglite
cd /Users/barris/Desktop/MulliganLinks
PGLITE_MODULE=/private/tmp/teeahead-db-verification/node_modules/@electric-sql/pglite/dist/index.js node tests/database/core-reliability.mjs
PGLITE_MODULE=/private/tmp/teeahead-db-verification/node_modules/@electric-sql/pglite/dist/index.js node tests/database/booking-lifecycle.mjs
```

## Production release record

On September 14, 2026, application commit `371162415249bfc69b944871b8ff9c2964cb6849` was pushed to main, built with production environment variables, smoke-tested on its staged URL, and promoted to the production domains. Deployment: `dpl_FerQTFCxyzZuY2q2GQG2Hh3RnbcG`. The subsequent migration-filename/documentation commit does not change application behavior.

Applied Supabase migration versions (filenames match the remote history):

- `20260914151313_core_reliability.sql`
- `20260914151635_booking_lifecycle.sql`
- `20260914151959_booking_access_cutover.sql`

All six new financial/lifecycle RPCs deny execution to authenticated clients and allow service-role execution. The protection trigger is enabled; the broad occupancy and client insert policies are removed; raw occupancy-view access is revoked for anonymous and authenticated clients.

The existing live Stripe endpoint now subscribes to 15 events covering booking payments, refunds, disputes, connected accounts/payouts, checkout, subscription changes and invoice success/failure. No live charge or refund was created during verification.

Production smoke checks passed: homepage and golfer waitlist HTTP 200; unauthenticated payment creation and cron HTTP 401; unsigned Stripe webhook HTTP 400. The deployment had no error/fatal runtime logs during the immediate verification window. All 600 unit/component tests passed.

Preview builds succeed but the Preview environment lacks Supabase credentials, so preview runtime checks fail until a separate preview database/configuration is supplied. Production uses its existing working credentials. `qa.teeahead.com` still shares production.

The security advisor has existing warnings for legacy authenticated security-definer functions and disabled [leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). The new [public security-definer warning](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable) is the deliberately public aggregate-only occupancy function. The new benefit ledger intentionally has RLS with no client policies (server-only access). These advisories are not a claim of a complete security audit.

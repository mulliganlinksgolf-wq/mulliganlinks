# Course email marketing

Implemented locally; activation is separate from deployment. No real campaigns have been sent during development.

## What is included

- Owners/managers: Course portal → Marketing (`/course/<slug>/marketing`).
- All subscribers, Fairway, Eagle, Ace, and Eagle + Ace audiences. The legacy `free` tier is treated as Fairway; expired paid memberships fall back to Fairway.
- Starter copy for tee times, leagues, shop/clubhouse promotions, and spring updates.
- Plain-text composer, preview, explicit review before queuing, campaign counts, and stop-remaining control.
- Course-specific subscription page (`/course-updates/<slug>`), also linked from the golfer’s course detail page. A verified TeeAhead account is required to opt in; existing bookings do not imply consent.
- Unsubscribe links work without login. GET shows a confirmation; POST saves the preference and supports email clients’ one-click unsubscribe.
- Durable campaign queue, fresh consent checks before sending, provider idempotency keys, bounded retries, and a global worker lease.

Not included in this release: SMS, multiyear discounts, gift-card checkout, scheduled campaign dates, attachments, open/click tracking, and importing outside mailing lists.

## Activate on the intended environment

1. Apply `supabase/migrations/20260922224035_course_marketing.sql` through your normal database migration process. It creates new tables, restricted views, and service-role-only functions. No existing golfer is subscribed automatically.
2. Deploy this code with `COURSE_MARKETING_ENABLED=false`. Confirm the course has a complete mailing address (street, city, state, ZIP), and the Resend sender `hello@teeahead.com` is verified.
3. Set `RESEND_API_KEY`, an HTTPS `NEXT_PUBLIC_APP_URL`, and a nonempty `CRON_SECRET` in the deployment. Reuse the existing cron secret if configured.
4. In the matching Supabase project, enable `pg_cron` and `pg_net`. Create Vault secrets named `course_marketing_origin` (the app’s HTTPS origin) and `course_marketing_cron_secret` (the same value as `CRON_SECRET`). Do not put secret values in this repository.
5. Run `scripts/enable-course-marketing-cron.sql` in that project. It creates/replaces the named five-minute job. Check its HTTP results in `net._http_response`; a successful cron invocation alone does not prove the API accepted it. Use a publicly reachable deployment, not a password-protected preview.
6. Set `COURSE_MARKETING_ENABLED=true` and redeploy. The page is deliberately inactive before this step. In a test environment, subscribe a controlled account, send one campaign to that account, confirm receipt, and check unsubscribe and campaign history before enabling real course use.

This uses the existing Supabase scheduling approach rather than requiring a Vercel plan change. The setup follows [Supabase’s scheduling and Vault guidance](https://supabase.com/docs/guides/functions/schedule-functions). No production database or scheduler was changed during implementation; the connected database tool denied access.

## Operations

- Worker: `/api/cron/course-marketing`, GET or POST, protected by the bearer `CRON_SECRET`. Missing secrets are rejected.
- Per run: at most 40 emails or 45 seconds of work, with a two-minute lease. At five-minute intervals this is up to 480 emails/hour across courses, before retries. Increase throughput only after checking provider limits.
- Daily limit: five campaigns per course in a rolling 24-hour window. Counts and recipients are computed server-side.
- “Sent” means accepted by Resend, not verified inbox delivery. Provider errors remain pending for up to five attempts. An uncertain send is not retried after 20 hours, inside [Resend’s 24-hour idempotency window](https://resend.com/docs/dashboard/emails/idempotency-keys).
- Closing the browser does not cancel a campaign. Stopping it skips remaining recipients; an email already in flight may still arrive.
- Emergency stop: set `COURSE_MARKETING_ENABLED=false` and redeploy. Pending campaigns remain stored; unsubscribe still works. Cancel any unwanted campaigns before turning sending back on.
- Existing platform-admin broadcasts are unchanged and do not use these course subscription preferences.

## Verification

```bash
cd /Users/barris/Desktop/MulliganLinks
npm run test:course-marketing
npm run typecheck
```

The focused suite covers permissions, consent, unsubscribe, validation, delivery/retry behavior, and database isolation. Full project verification runs lint, TypeScript, unit tests, and isolated database tests. No test sends real email.

Local browser verification uses sample data and mocked sends; it does not establish production delivery. Use a controlled subscriber for the live smoke test.

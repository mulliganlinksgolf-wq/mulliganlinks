# Course subscriptions and Winter Plan

Course billing is separate from golfer subscriptions and Stripe Connect payouts. Existing courses are not automatically enrolled or charged.

## Course flow

1. A global administrator confirms the signed monthly price and any free-through date in Course → Billing. This inserts terms only; it does not create a Stripe subscription. Confirm Founding Partner agreements explicitly.
2. An owner/manager reviews those terms and opens Stripe Checkout. The remaining free period becomes a Stripe trial; paid billing begins after it ends. Checkout is unavailable in the last 48 hours of a free period rather than shortening it.
3. Once paid monthly billing is active, the manager chooses Winter Plan and a reopening date 28–214 days after the next renewal. Stripe schedules the next renewal at $49/month, and restores the original price at reopening (12:00 UTC on the selected day). Winter payments are not prorated/refunded for partial months.
4. A scheduled winter can be cancelled before it starts. After it starts, contact TeeAhead for changes. Existing reservations remain; all new bookings pause during winter, including walk-ins and spring bookings made during the winter period. Reservations for a future winter date are also blocked before winter begins.

Stripe executes transitions; the website does not depend on a scheduled task to change the price. Database availability dates control booking access. Webhooks refresh payment state, with an hourly reconciliation worker as fallback. Failed/cancelled subscriptions stop accepting new bookings until active again. Course records and marketing remain accessible.

Custom, discounted, taxed, non-monthly, or pending-change subscriptions are referred to support rather than rewritten. Multiyear discounts, SMS, gift card sales, league deposits and automated reopening reminder emails are not implemented here.

## Deployment

- Apply both `20260922224035_course_marketing.sql` and `20260922231422_course_seasonal_billing.sql` before activation. Register their versions in Supabase migration history if applying using the SQL editor.
- Configure the existing production Stripe key and webhook secret. The webhook endpoint `/api/stripe/webhook` must receive checkout completion, customer subscription create/update/delete, invoice paid/payment_failed, and subscription schedule events. Existing golfer event handling stays in place.
- Set `COURSE_BILLING_ENABLED=true` only after migrations and Stripe configuration are verified. Keep Preview disabled unless it has an isolated database and test Stripe account.
- Add `COURSE_WORKER_SECRET` to production and the matching Supabase Vault entry `course_marketing_cron_secret`; run `scripts/enable-course-marketing-cron.sql` after routes deploy. It schedules both email delivery and billing reconciliation. Existing `CRON_SECRET` is supported as fallback.
- Verify with a Stripe test account and controlled email recipient before enrolling a real course. Do not use an existing customer's subscription as a test.

## Recovery

Course operations take a three-minute database lease and stable Stripe idempotency keys. A saved `preparing` Winter Plan can be retried using its original operation and dates. If the next renewal is less than ten minutes away, contact support to reconcile manually. The database records the intent before API calls. A failed final database write is repaired by webhook/reconciliation or Refresh billing status.

Do not disable the booking database guard to repair billing. Check the actual subscription and schedule in Stripe, then refresh billing. Do not manually clear winter dates before cancelling the matching Stripe schedule. Rollback of the application does not cancel Stripe schedules or restore customer prices; keep the reconciliation route running while resolving active schedules.

## Verification

Run `npm run verify` and `npm run build`. Unit tests cover ownership, eligibility, original-price restoration, stable retry keys, date limits and preserving free periods. The isolated database test verifies RLS, leases, existing reservations, and booking boundaries. These do not replace a Stripe sandbox end-to-end test.

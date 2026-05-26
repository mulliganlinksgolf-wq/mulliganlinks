-- Race-safe atomic claim for the every-minute send-scheduled-emails cron.
-- Without this, two concurrent cron ticks could SELECT the same `pending`
-- rows, both call Resend, and recipients would get the email twice
-- (observed 2026-05-26 — 6 outbound emails sent twice).

alter table crm_scheduled_emails
  drop constraint if exists crm_scheduled_emails_status_check;

alter table crm_scheduled_emails
  add constraint crm_scheduled_emails_status_check
  check (status in ('pending','sending','sent','cancelled','failed'));

alter table crm_scheduled_emails
  add column if not exists claimed_at timestamptz;

-- Sweeper: rows stuck in 'sending' for more than 10 minutes are treated as
-- recoverable (the cron lambda likely crashed mid-send). The route resets
-- them to 'pending' before its main fetch each run.
create index if not exists crm_scheduled_emails_stuck
  on crm_scheduled_emails (status, claimed_at)
  where status = 'sending';

create table if not exists crm_scheduled_emails (
  id            uuid primary key default gen_random_uuid(),
  record_type   text not null check (record_type in ('course','outing','member')),
  record_id     uuid not null,
  to_email      text not null,
  subject       text not null,
  body_html     text not null,
  scheduled_for timestamptz not null,
  status        text not null default 'pending'
                  check (status in ('pending','sent','cancelled','failed')),
  created_by    text not null,
  from_email    text not null,
  in_reply_to   text,
  message_id    text,
  sent_at       timestamptz,
  error         text,
  created_at    timestamptz not null default now()
);

create index if not exists crm_scheduled_emails_due
  on crm_scheduled_emails (status, scheduled_for)
  where status = 'pending';

-- 058_redemption_limits.sql
-- NOTE: RLS, indexes, trigger, and corrected backfill are in 059_redemption_limits_fixes.sql.
-- This migration reflects what was actually applied to production — without those additions.

create table course_redemption_settings (
  course_id               uuid    primary key references courses(id) on delete cascade,
  points_threshold        int     not null default 5000,
  -- 'fairway' is the free tier name used in application code (memberships.tier)
  max_redemptions_fairway int     not null default 1,
  max_redemptions_eagle   int     not null default 2,
  max_redemptions_ace     int     not null default 3,
  blackout_dates          date[]  not null default '{}',
  eligible_slot_start     time    default null,
  eligible_slot_end       time    default null,
  monthly_redemption_cap  int     default null,
  notice_hours            int     not null default 48,
  updated_at              timestamptz not null default now()
);

alter table memberships
  add column if not exists comp_rounds_remaining int         not null default 0,
  add column if not exists comp_rounds_reset_at  timestamptz;

alter table bookings
  add column if not exists redemption_type text check (redemption_type in ('points', 'complimentary')),
  add column if not exists course_id       uuid references courses(id) ON DELETE CASCADE;

-- Backfill existing active memberships (anniversary formula corrected in 059)
update memberships set
  comp_rounds_remaining = case
    when tier = 'ace'   then 2
    when tier = 'eagle' then 1
    else 0
  end,
  comp_rounds_reset_at = now() + interval '1 year'
where status = 'active';

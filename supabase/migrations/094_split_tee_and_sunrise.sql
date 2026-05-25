-- Sprint 1: Split tee operation, back-nine booking, sunrise/sunset automation.
-- Adds tee_start to tee_times and bookings, sun config to courses, and a
-- per-day operating window cache (course_operating_days) populated by a
-- nightly Vercel Cron.

-- ---------------------------------------------------------------------------
-- 1. tee_start enum + new columns on tee_times.
--
-- We DROP and recreate the existing unique constraint so the same scheduled_at
-- minute can have both a 'front' row and a 'back' row on split tee days.
-- ---------------------------------------------------------------------------

do $$ begin
  if not exists (select 1 from pg_type where typname = 'tee_start_position') then
    create type public.tee_start_position as enum ('front', 'back');
  end if;
end $$;

alter table public.tee_times
  add column if not exists tee_start public.tee_start_position not null default 'front',
  add column if not exists holes smallint not null default 18 check (holes in (9, 18));

alter table public.tee_times drop constraint if exists tee_times_course_scheduled_unique;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tee_times_course_scheduled_start_unique'
      and conrelid = 'public.tee_times'::regclass
  ) then
    alter table public.tee_times
      add constraint tee_times_course_scheduled_start_unique unique (course_id, scheduled_at, tee_start);
  end if;
end $$;

create index if not exists idx_tee_times_course_scheduled_start
  on public.tee_times (course_id, scheduled_at, tee_start);

-- ---------------------------------------------------------------------------
-- 2. tee_start on bookings (denormalized for fast queries).
-- bookings.holes already exists from migration 070; do NOT re-add.
-- ---------------------------------------------------------------------------

alter table public.bookings
  add column if not exists tee_start public.tee_start_position not null default 'front';

-- ---------------------------------------------------------------------------
-- 3. Course-level sun + operations config.
-- ---------------------------------------------------------------------------

alter table public.courses
  add column if not exists latitude numeric(9, 6),
  add column if not exists longitude numeric(9, 6),
  add column if not exists timezone text not null default 'America/Detroit',
  add column if not exists sunrise_offset_minutes smallint not null default 30,
  add column if not exists sunset_offset_minutes smallint not null default -90,
  add column if not exists sunrise_automation_enabled boolean not null default true,
  add column if not exists allow_back_nine_booking boolean not null default true,
  add column if not exists back_nine_minute_offset smallint not null default 90;

comment on column public.courses.sunrise_offset_minutes is
  'Minutes AFTER sunrise that the first tee time of the day is bookable. Positive = later.';
comment on column public.courses.sunset_offset_minutes is
  'Minutes RELATIVE to sunset for the last bookable tee time. Negative = before sunset.';
comment on column public.courses.back_nine_minute_offset is
  'When split tee is disabled, delay between front-9 and back-9 bookings at the same slot.';

-- ---------------------------------------------------------------------------
-- 4. Per-day operating window cache, populated by nightly cron.
-- ---------------------------------------------------------------------------

create table if not exists public.course_operating_days (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  operating_date date not null,
  first_bookable_time time not null,
  last_bookable_time time not null,
  sunrise_at timestamptz not null,
  sunset_at timestamptz not null,
  is_split_tee_day boolean not null default false,
  is_closed boolean not null default false,
  manually_overridden boolean not null default false,
  override_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, operating_date)
);

create index if not exists idx_course_operating_days_course_date
  on public.course_operating_days (course_id, operating_date);

drop trigger if exists course_operating_days_updated_at on public.course_operating_days;
create trigger course_operating_days_updated_at
  before update on public.course_operating_days
  for each row execute function public.handle_updated_at();

alter table public.course_operating_days enable row level security;

-- Course admins (any role) can view their course's operating days.
drop policy if exists "Course admins can view operating days" on public.course_operating_days;
create policy "Course admins can view operating days"
  on public.course_operating_days for select
  using (
    exists (
      select 1 from public.course_admins ca
      where ca.course_id = course_operating_days.course_id
        and ca.user_id = auth.uid()
    )
  );

-- Managers and owners can write.
drop policy if exists "Course managers can manage operating days" on public.course_operating_days;
create policy "Course managers can manage operating days"
  on public.course_operating_days for all
  using (
    exists (
      select 1 from public.course_admins ca
      where ca.course_id = course_operating_days.course_id
        and ca.user_id = auth.uid()
        and ca.role in ('owner', 'manager')
    )
  );

-- Public read for the golfer booking flow, future dates only.
drop policy if exists "Public can view future operating days" on public.course_operating_days;
create policy "Public can view future operating days"
  on public.course_operating_days for select
  using (operating_date >= current_date);

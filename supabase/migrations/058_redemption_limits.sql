-- 058_redemption_limits.sql

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

ALTER TABLE public.course_redemption_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read redemption settings"
  ON public.course_redemption_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Course managers can upsert redemption settings"
  ON public.course_redemption_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.course_admins
      WHERE course_admins.course_id = course_redemption_settings.course_id
        AND course_admins.user_id = auth.uid()
        AND course_admins.role IN ('owner', 'manager')
    )
  );

CREATE TRIGGER course_redemption_settings_updated_at
  BEFORE UPDATE ON public.course_redemption_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

alter table memberships
  add column if not exists comp_rounds_remaining int         not null default 0,
  add column if not exists comp_rounds_reset_at  timestamptz;

alter table bookings
  add column if not exists redemption_type text check (redemption_type in ('points', 'complimentary')),
  add column if not exists course_id       uuid references courses(id) ON DELETE SET NULL;

CREATE INDEX idx_bookings_user_course_redemption
  ON public.bookings (user_id, course_id, redemption_type, created_at)
  WHERE redemption_type IS NOT NULL;

CREATE INDEX idx_bookings_course_redemption_monthly
  ON public.bookings (course_id, redemption_type, created_at)
  WHERE redemption_type IS NOT NULL;

-- Backfill existing active memberships
update memberships set
  comp_rounds_remaining = case
    when tier = 'ace'   then 2
    when tier = 'eagle' then 1
    else 0
  end,
  comp_rounds_reset_at = (
    created_at + (
      (date_part('year', age(now(), created_at))::int + 1) * interval '1 year'
    )
  )
where status = 'active';

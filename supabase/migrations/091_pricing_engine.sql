-- supabase/migrations/091_pricing_engine.sql
--
-- Sprint 6: Dynamic Pricing Engine
-- - rate_rules: per-course rules that adjust base_price by % or $ based on conditions
-- - us_holidays: seed of dates used by the is_holiday rule condition
-- - tee_time_computed_rates: per-slot cache of resolved price + audit trail
-- - rate_override_log: staff override events for analytics
--
-- NOTE: this migration drops tee_start/holes rule conditions vs the original
-- spec because tee_times has neither column today.

-- ============================================================
-- 1. Enums
-- ============================================================

CREATE TYPE rate_rule_action_type AS ENUM (
  'percent_adjust',          -- +25 means +25% over current rate; -20 means -20%
  'fixed_amount_adjust',     -- +15 means +$15; -10 means -$10
  'fixed_price_override'     -- 99 means rate becomes $99 regardless of input
);

CREATE TYPE rate_rule_category AS ENUM (
  'peak', 'twilight', 'off_peak', 'holiday', 'weather', 'occupancy', 'days_out', 'custom'
);

-- ============================================================
-- 2. rate_rules
-- ============================================================

CREATE TABLE public.rate_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category rate_rule_category NOT NULL DEFAULT 'custom',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,

  -- conditions (all AND-joined; NULL = "any")
  days_of_week SMALLINT[] DEFAULT NULL CHECK (
    days_of_week IS NULL OR (
      array_length(days_of_week, 1) > 0
      AND days_of_week <@ ARRAY[0,1,2,3,4,5,6]::SMALLINT[]
    )
  ),
  start_time TIME DEFAULT NULL,  -- inclusive
  end_time   TIME DEFAULT NULL,  -- exclusive
  is_holiday BOOLEAN DEFAULT NULL,
  min_days_out SMALLINT DEFAULT NULL,
  max_days_out SMALLINT DEFAULT NULL,
  min_occupancy_pct SMALLINT DEFAULT NULL CHECK (
    min_occupancy_pct IS NULL OR min_occupancy_pct BETWEEN 0 AND 100
  ),
  max_occupancy_pct SMALLINT DEFAULT NULL CHECK (
    max_occupancy_pct IS NULL OR max_occupancy_pct BETWEEN 0 AND 100
  ),

  -- action
  action_type rate_rule_action_type NOT NULL,
  action_value NUMERIC(10, 2) NOT NULL,

  -- ordering and presentation
  priority SMALLINT NOT NULL DEFAULT 100,  -- lower = applied earlier
  display_label TEXT,                       -- shown to golfers, e.g. "Weekend Morning"
  internal_note TEXT,                       -- staff-only

  -- audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Anti-Hot Deal compliance enforced at DB level
  CONSTRAINT no_hot_deal_in_label CHECK (
    display_label IS NULL OR (
      LOWER(display_label) NOT LIKE '%hot deal%'
      AND LOWER(display_label) NOT LIKE '%flash sale%'
      AND LOWER(display_label) NOT LIKE '%blowout%'
    )
  )
);

COMMENT ON COLUMN public.rate_rules.days_of_week IS
  '0=Sunday ... 6=Saturday (JavaScript Date.getDay convention). NOTE: course_hours.day_of_week uses a DIFFERENT convention (0=Monday, 6=Sunday). Do not cross-reference without translating.';

COMMENT ON COLUMN public.rate_rules.internal_note IS
  'Staff-only metadata. RLS does not gate at the column level; application code MUST exclude this column from public read queries.';

CREATE INDEX idx_rate_rules_course_enabled
  ON public.rate_rules (course_id, enabled, priority);

-- ============================================================
-- 3. us_holidays (global, course-agnostic)
-- ============================================================

CREATE TABLE public.us_holidays (
  date DATE PRIMARY KEY,
  name TEXT NOT NULL
);

INSERT INTO public.us_holidays (date, name) VALUES
  ('2026-05-25', 'Memorial Day'),
  ('2026-07-04', 'Independence Day'),
  ('2026-09-07', 'Labor Day'),
  ('2026-11-26', 'Thanksgiving'),
  ('2026-12-25', 'Christmas Day'),
  ('2027-01-01', 'New Year''s Day'),
  ('2027-05-31', 'Memorial Day'),
  ('2027-07-04', 'Independence Day'),
  ('2027-09-06', 'Labor Day'),
  ('2027-11-25', 'Thanksgiving'),
  ('2027-12-25', 'Christmas Day'),
  ('2028-01-01', 'New Year''s Day');

-- ============================================================
-- 4. tee_time_computed_rates (cache + audit trail)
-- ============================================================

CREATE TABLE public.tee_time_computed_rates (
  tee_time_id UUID PRIMARY KEY REFERENCES public.tee_times(id) ON DELETE CASCADE,
  course_id   UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  base_rate   NUMERIC(10, 2) NOT NULL,
  computed_rate NUMERIC(10, 2) NOT NULL,
  fired_rule_ids    UUID[] NOT NULL DEFAULT '{}',
  fired_rule_labels TEXT[] NOT NULL DEFAULT '{}',
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  computed_for_occupancy_pct SMALLINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_computed_rates_course ON public.tee_time_computed_rates (course_id);

-- ============================================================
-- 5. rate_override_log
-- ============================================================

CREATE TABLE public.rate_override_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  course_id  UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  tee_time_id UUID NOT NULL REFERENCES public.tee_times(id) ON DELETE RESTRICT,
  computed_rate NUMERIC(10, 2) NOT NULL,
  override_rate NUMERIC(10, 2) NOT NULL,
  override_amount NUMERIC(10, 2) GENERATED ALWAYS AS (override_rate - computed_rate) STORED,
  override_reason TEXT,
  applied_by UUID NOT NULL REFERENCES auth.users(id),
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rate_override_log_course_date
  ON public.rate_override_log (course_id, applied_at DESC);

-- ============================================================
-- 6. RLS
-- ============================================================

ALTER TABLE public.rate_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.us_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tee_time_computed_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_override_log ENABLE ROW LEVEL SECURITY;

-- rate_rules: public can read enabled rules (for booking UI), managers can write
CREATE POLICY "rate_rules_public_select_enabled"
  ON public.rate_rules
  FOR SELECT
  USING (enabled = TRUE);

CREATE POLICY "rate_rules_manager_all"
  ON public.rate_rules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.course_admins ca
      WHERE ca.course_id = rate_rules.course_id
        AND ca.user_id = auth.uid()
        AND ca.role IN ('owner', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.course_admins ca
      WHERE ca.course_id = rate_rules.course_id
        AND ca.user_id = auth.uid()
        AND ca.role IN ('owner', 'manager')
    )
  );

-- us_holidays: public read
CREATE POLICY "us_holidays_public_select"
  ON public.us_holidays
  FOR SELECT
  USING (TRUE);

-- tee_time_computed_rates: public read (drives booking UI)
CREATE POLICY "computed_rates_public_select"
  ON public.tee_time_computed_rates
  FOR SELECT
  USING (TRUE);

-- rate_override_log: only course managers can read their own log
CREATE POLICY "rate_override_log_manager_select"
  ON public.rate_override_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.course_admins ca
      WHERE ca.course_id = rate_override_log.course_id
        AND ca.user_id = auth.uid()
        AND ca.role IN ('owner', 'manager')
    )
  );

-- Cache writes are system-level. Service-role bypasses RLS, but we document
-- the intent explicitly so the contract is loud and reviewable.
CREATE POLICY "computed_rates_service_role_write"
  ON public.tee_time_computed_rates
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "rate_override_log_service_role_write"
  ON public.rate_override_log
  FOR INSERT
  TO service_role
  WITH CHECK (TRUE);

-- ============================================================
-- 7. updated_at trigger (uses the existing handle_updated_at from migration 022)
-- ============================================================

CREATE TRIGGER handle_updated_at_rate_rules
  BEFORE UPDATE ON public.rate_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

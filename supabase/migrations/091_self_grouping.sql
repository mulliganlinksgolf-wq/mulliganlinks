-- ============================================================
-- Migration 091: Self-grouping for solo golfers
-- ============================================================
-- Adds schema support for letting solo golfers share a tee time
-- with another separately-booked party. Includes:
--   * Course-level allow_self_grouping toggle + max_players cap
--   * Per-day override table (course_tee_sheet_overrides)
--   * booking_group_id, is_self_grouped, pairing_notification_sent_at on bookings
--   * tee_time_occupancy view for real-time slot capacity
--   * enforce_tee_time_capacity trigger as a safety net
-- ============================================================

-- ------------------------------------------------------------
-- 1. Course-level toggle and max-players
-- ------------------------------------------------------------
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS allow_self_grouping BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS max_players_per_tee_time SMALLINT NOT NULL DEFAULT 4
    CHECK (max_players_per_tee_time BETWEEN 1 AND 5);

-- ------------------------------------------------------------
-- 2. Per-day override table
--    Staff identity in this codebase lives in `course_admins`
--    (see migration 002_core.sql). Substituted for the placeholder
--    `course_staff` referenced in the task spec.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.course_tee_sheet_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  override_date DATE NOT NULL,
  self_grouping_disabled BOOLEAN NOT NULL DEFAULT FALSE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, override_date)
);

CREATE INDEX IF NOT EXISTS idx_course_tee_sheet_overrides_course_date
  ON public.course_tee_sheet_overrides (course_id, override_date);

ALTER TABLE public.course_tee_sheet_overrides ENABLE ROW LEVEL SECURITY;

-- Course admins can read overrides for their own course
CREATE POLICY "course_admins_overrides_select"
  ON public.course_tee_sheet_overrides FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.course_admins ca
      WHERE ca.course_id = course_tee_sheet_overrides.course_id
        AND ca.user_id = auth.uid()
    )
  );

-- Course admins can modify overrides for their own course
CREATE POLICY "course_admins_overrides_modify"
  ON public.course_tee_sheet_overrides FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.course_admins ca
      WHERE ca.course_id = course_tee_sheet_overrides.course_id
        AND ca.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.course_admins ca
      WHERE ca.course_id = course_tee_sheet_overrides.course_id
        AND ca.user_id = auth.uid()
    )
  );

-- Anyone can READ the override for a slot (booking page check)
CREATE POLICY "public_overrides_select_for_booking"
  ON public.course_tee_sheet_overrides FOR SELECT
  USING (true);

-- updated_at trigger (handle_updated_at defined in 002_core.sql)
CREATE TRIGGER course_tee_sheet_overrides_updated_at
  BEFORE UPDATE ON public.course_tee_sheet_overrides
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------
-- 3. Bookings: group linkage + self-grouped flag + notification tracking
-- ------------------------------------------------------------
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS booking_group_id UUID,
  ADD COLUMN IF NOT EXISTS is_self_grouped BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pairing_notification_sent_at TIMESTAMPTZ;

-- Backfill: for existing bookings, group_id = id (each booking is its own group)
UPDATE public.bookings SET booking_group_id = id WHERE booking_group_id IS NULL;

-- Now enforce NOT NULL after backfill
ALTER TABLE public.bookings ALTER COLUMN booking_group_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_booking_group_id
  ON public.bookings (booking_group_id);

CREATE INDEX IF NOT EXISTS idx_bookings_pairing_notification_pending
  ON public.bookings (pairing_notification_sent_at)
  WHERE pairing_notification_sent_at IS NULL AND is_self_grouped = TRUE;

-- ------------------------------------------------------------
-- 4. Real-time occupancy view
--    No tee_start dimension — split-tee is not shipped.
--    Excludes canceled/no_show bookings from the player count.
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW public.tee_time_occupancy AS
SELECT
  tt.id AS tee_time_id,
  tt.course_id,
  tt.scheduled_at,
  tt.max_players,
  COALESCE(SUM(b.players), 0)::INTEGER AS players_booked,
  (tt.max_players - COALESCE(SUM(b.players), 0))::INTEGER AS spots_remaining,
  ARRAY_AGG(b.id) FILTER (WHERE b.id IS NOT NULL) AS booking_ids,
  BOOL_OR(b.is_self_grouped) AS has_self_grouped_bookings
FROM public.tee_times tt
LEFT JOIN public.bookings b
  ON b.tee_time_id = tt.id
  AND b.status NOT IN ('canceled', 'no_show')
GROUP BY tt.id, tt.course_id, tt.scheduled_at, tt.max_players;

GRANT SELECT ON public.tee_time_occupancy TO anon, authenticated;

-- ------------------------------------------------------------
-- 5. Safety-net capacity trigger
--    Status values per bookings CHECK constraint:
--    'confirmed','canceled','completed','no_show' (one L)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_tee_time_capacity()
RETURNS TRIGGER AS $$
DECLARE
  v_total INTEGER;
  v_max INTEGER;
BEGIN
  -- Canceled/no_show bookings free up capacity; no need to check.
  IF NEW.status IN ('canceled', 'no_show') THEN
    RETURN NEW;
  END IF;

  SELECT
    COALESCE(SUM(b.players), 0) + NEW.players,
    tt.max_players
  INTO v_total, v_max
  FROM public.tee_times tt
  LEFT JOIN public.bookings b
    ON b.tee_time_id = tt.id
    AND b.status NOT IN ('canceled', 'no_show')
    AND b.id <> NEW.id
  WHERE tt.id = NEW.tee_time_id
  GROUP BY tt.max_players;

  IF v_total IS NULL THEN
    -- tee_time row missing; let the FK handle the error
    RETURN NEW;
  END IF;

  IF v_total > v_max THEN
    RAISE EXCEPTION 'Tee time capacity exceeded: % players would be in slot, max %', v_total, v_max
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_tee_time_capacity ON public.bookings;
CREATE TRIGGER trg_enforce_tee_time_capacity
  BEFORE INSERT OR UPDATE OF players, status, tee_time_id ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_tee_time_capacity();

-- ------------------------------------------------------------
-- 6. Documentation
-- ------------------------------------------------------------
COMMENT ON COLUMN public.bookings.booking_group_id IS
  'Groups bookings that share a tee time. Solo/own-group bookings have group_id = id. Joined bookings inherit the host group_id.';
COMMENT ON COLUMN public.bookings.is_self_grouped IS
  'True when this booking shares its tee time with at least one other separately-booked party.';
COMMENT ON COLUMN public.bookings.pairing_notification_sent_at IS
  'Timestamp of when the self-grouped pairing notification was sent. NULL while pending.';
COMMENT ON COLUMN public.courses.allow_self_grouping IS
  'Course-wide opt-in for letting solo golfers join existing tee times. Per-day overrides live in course_tee_sheet_overrides.';
COMMENT ON COLUMN public.courses.max_players_per_tee_time IS
  'Course-wide cap on players per tee time (1-5). Tee-time-level max_players still applies.';

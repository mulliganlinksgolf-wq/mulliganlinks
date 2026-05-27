-- ── 1. profiles_with_email view ────────────────────────────────────────────────
-- Exposes auth.users.email alongside the public profiles row so the course
-- members page can display email without N+1 auth API calls.
CREATE OR REPLACE VIEW public.profiles_with_email AS
SELECT
  p.id,
  p.full_name,
  p.phone,
  p.home_course_id,
  p.created_at,
  p.updated_at,
  u.email
FROM public.profiles p
JOIN auth.users u ON u.id = p.id;

GRANT SELECT ON public.profiles_with_email TO service_role;

-- ── 2. Function: recompute one course+month row in crm_course_metrics ──────────
CREATE OR REPLACE FUNCTION public.compute_course_month_metrics(
  p_course_id UUID,
  p_month     TEXT   -- 'YYYY-MM'
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_rounds   INTEGER;
  v_revenue  DECIMAL(10,2);
  v_avg_fee  DECIMAL(10,2);
  v_members  INTEGER;
  v_earned   INTEGER := 0;
  v_redeemed INTEGER := 0;
BEGIN
  -- Aggregate confirmed/completed bookings for this course+month
  SELECT
    COUNT(b.id),
    COALESCE(SUM(b.total_paid), 0),
    COALESCE(
      CASE WHEN COUNT(b.id) > 0 THEN SUM(b.total_paid) / COUNT(b.id) ELSE 0 END,
      0
    ),
    COUNT(DISTINCT b.user_id)
  INTO v_rounds, v_revenue, v_avg_fee, v_members
  FROM public.bookings b
  JOIN public.tee_times tt ON tt.id = b.tee_time_id
  WHERE tt.course_id = p_course_id
    AND TO_CHAR(tt.scheduled_at AT TIME ZONE 'UTC', 'YYYY-MM') = p_month
    AND b.status IN ('confirmed', 'completed');

  -- Aggregate fairway points for this course+month
  SELECT
    COALESCE(SUM(CASE WHEN fp.amount > 0 THEN fp.amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN fp.amount < 0 THEN ABS(fp.amount) ELSE 0 END), 0)
  INTO v_earned, v_redeemed
  FROM public.fairway_points fp
  WHERE fp.course_id = p_course_id
    AND TO_CHAR(fp.created_at AT TIME ZONE 'UTC', 'YYYY-MM') = p_month;

  INSERT INTO public.crm_course_metrics (
    course_id, month,
    rounds_booked, green_fee_revenue, avg_green_fee, members_attributed,
    points_earned, points_redeemed
  ) VALUES (
    p_course_id, p_month,
    v_rounds, v_revenue, v_avg_fee, v_members,
    v_earned, v_redeemed
  )
  ON CONFLICT (course_id, month) DO UPDATE SET
    rounds_booked      = EXCLUDED.rounds_booked,
    green_fee_revenue  = EXCLUDED.green_fee_revenue,
    avg_green_fee      = EXCLUDED.avg_green_fee,
    members_attributed = EXCLUDED.members_attributed,
    points_earned      = EXCLUDED.points_earned,
    points_redeemed    = EXCLUDED.points_redeemed;
END;
$$;

-- ── 3. Trigger: refresh metrics whenever a booking changes ─────────────────────
CREATE OR REPLACE FUNCTION public.trg_refresh_booking_metrics()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_course_id UUID;
  v_month     TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT tt.course_id, TO_CHAR(tt.scheduled_at AT TIME ZONE 'UTC', 'YYYY-MM')
    INTO v_course_id, v_month
    FROM public.tee_times tt WHERE tt.id = OLD.tee_time_id;
  ELSE
    SELECT tt.course_id, TO_CHAR(tt.scheduled_at AT TIME ZONE 'UTC', 'YYYY-MM')
    INTO v_course_id, v_month
    FROM public.tee_times tt WHERE tt.id = NEW.tee_time_id;
  END IF;

  IF v_course_id IS NOT NULL THEN
    PERFORM public.compute_course_month_metrics(v_course_id, v_month);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_booking_metrics ON public.bookings;
CREATE TRIGGER trg_booking_metrics
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.trg_refresh_booking_metrics();

-- ── 4. Trigger: refresh metrics whenever fairway points change ─────────────────
CREATE OR REPLACE FUNCTION public.trg_refresh_points_metrics()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_course_id UUID;
  v_month     TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_course_id := OLD.course_id;
    v_month     := TO_CHAR(OLD.created_at AT TIME ZONE 'UTC', 'YYYY-MM');
  ELSE
    v_course_id := NEW.course_id;
    v_month     := TO_CHAR(NEW.created_at AT TIME ZONE 'UTC', 'YYYY-MM');
  END IF;

  IF v_course_id IS NOT NULL THEN
    PERFORM public.compute_course_month_metrics(v_course_id, v_month);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_points_metrics ON public.fairway_points;
CREATE TRIGGER trg_points_metrics
  AFTER INSERT OR UPDATE OR DELETE ON public.fairway_points
  FOR EACH ROW EXECUTE FUNCTION public.trg_refresh_points_metrics();

-- ── 5. Backfill: recompute every existing course+month with booking data ───────
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT
      tt.course_id,
      TO_CHAR(tt.scheduled_at AT TIME ZONE 'UTC', 'YYYY-MM') AS month
    FROM public.tee_times tt
    JOIN public.bookings b ON b.tee_time_id = tt.id
    WHERE b.status IN ('confirmed', 'completed')
  LOOP
    PERFORM public.compute_course_month_metrics(r.course_id, r.month);
  END LOOP;
END;
$$;

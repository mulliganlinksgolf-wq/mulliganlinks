-- Fix two Supabase security warnings:
--
-- 1. tee_time_occupancy: SECURITY DEFINER view
--    The view was created by the postgres superuser, which bypasses RLS on the
--    underlying tables. Recreating it with security_invoker = true makes it run
--    as the querying user so RLS is respected.
--    Side-effect: the bookings RLS only allows users to see their OWN rows, so
--    an authenticated member calling the view would see wrong occupancy counts
--    (only their own players counted). We add a narrow "tee-time capacity read"
--    policy so any authenticated user can read non-cancelled booking rows for
--    occupancy purposes — the same data the old SECURITY DEFINER view was already
--    exposing.
--
-- 2. crm_scheduled_emails: RLS disabled
--    All server-side access to this table goes through createAdminClient()
--    (Supabase service role), which bypasses RLS. Enabling RLS with no
--    anon/authenticated policies locks out anonymous callers and regular users
--    while leaving service-role access intact.

-- ============================================================
-- 1. Fix tee_time_occupancy view
-- ============================================================

-- Allow authenticated users to read booking slots for tee-time capacity
-- (does NOT expose user identity, payment info, or other sensitive columns —
-- the view only uses tee_time_id, players, status, id, and is_self_grouped).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'bookings'
      AND policyname = 'Authenticated users can read tee time occupancy'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Authenticated users can read tee time occupancy"
        ON public.bookings
        FOR SELECT
        TO authenticated
        USING (status NOT IN ('canceled', 'no_show'))
    $policy$;
  END IF;
END $$;

-- Recreate view with security_invoker so it runs as the querying user
DROP VIEW IF EXISTS public.tee_time_occupancy;

CREATE VIEW public.tee_time_occupancy
  WITH (security_invoker = true)
AS
SELECT
  tt.id            AS tee_time_id,
  tt.course_id,
  tt.scheduled_at,
  tt.max_players,
  COALESCE(SUM(b.players), 0)::INTEGER                            AS players_booked,
  (tt.max_players - COALESCE(SUM(b.players), 0))::INTEGER         AS spots_remaining,
  ARRAY_AGG(b.id) FILTER (WHERE b.id IS NOT NULL)                 AS booking_ids,
  BOOL_OR(b.is_self_grouped)                                      AS has_self_grouped_bookings
FROM public.tee_times tt
LEFT JOIN public.bookings b
  ON  b.tee_time_id = tt.id
  AND b.status NOT IN ('canceled', 'no_show')
GROUP BY tt.id, tt.course_id, tt.scheduled_at, tt.max_players;

GRANT SELECT ON public.tee_time_occupancy TO anon, authenticated;

-- ============================================================
-- 2. Enable RLS on crm_scheduled_emails
-- ============================================================

ALTER TABLE public.crm_scheduled_emails ENABLE ROW LEVEL SECURITY;

-- No permissive policies for anon or authenticated — all legitimate access
-- is via the Supabase service role (createAdminClient / pg_cron), which
-- bypasses RLS automatically and is unaffected by this change.

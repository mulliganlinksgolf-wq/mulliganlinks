-- 042_leagues_fixes.sql
-- Security + correctness fixes for 041_leagues.sql
-- All changes are safe to run against already-populated tables.

-- ─── FIX 1: Pin search_path on is_course_staff (search_path hijacking) ────────
-- SECURITY DEFINER bypasses RLS on crm_course_users (service_role-only table).
-- Pinning search_path prevents a malicious schema from shadowing public tables.
CREATE OR REPLACE FUNCTION public.is_course_staff(p_course_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER
SET search_path = public, pg_catalog AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.course_admins
    WHERE user_id = auth.uid() AND course_id = p_course_id
    UNION ALL
    SELECT 1 FROM public.crm_course_users
    WHERE user_id = auth.uid() AND course_id = p_course_id
  );
$$;

COMMENT ON FUNCTION public.is_course_staff(UUID) IS
  'Returns TRUE when the current user is a course admin or CRM user for the given course. '
  'Runs as SECURITY DEFINER (caller elevated to function-owner role) to bypass RLS on '
  'crm_course_users, which carries only a service_role policy. '
  'search_path is pinned to public,pg_catalog to prevent search_path-hijacking attacks.';

-- ─── FIX 2: Break self-referential RLS recursion on league_members ────────────
-- The original "member reads all active league_members" policy queried league_members
-- from within a policy on league_members → PostgreSQL infinite recursion crash.
-- Solution: extract the membership check into a SECURITY DEFINER helper so the
-- policy body never touches the guarded table directly.

CREATE OR REPLACE FUNCTION public.is_league_member(p_league_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER
SET search_path = public, pg_catalog AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.league_members
    WHERE league_id = p_league_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
$$;

COMMENT ON FUNCTION public.is_league_member(UUID) IS
  'Returns TRUE when the current user is an active member of the given league. '
  'Runs as SECURITY DEFINER to avoid recursive RLS evaluation when called from '
  'a policy on league_members itself. '
  'search_path pinned to public,pg_catalog.';

-- Replace the recursive SELECT policy on league_members
DROP POLICY IF EXISTS "member reads all active league_members" ON public.league_members;

CREATE POLICY "member reads all active league_members"
  ON public.league_members FOR SELECT
  USING (
    public.is_league_member(league_id)
    OR public.is_course_staff(
      (SELECT course_id FROM public.leagues WHERE id = league_id LIMIT 1)
    )
  );

-- Fix the same recursion pattern on league_sessions (queried league_members directly)
DROP POLICY IF EXISTS "enrolled members read sessions" ON public.league_sessions;

CREATE POLICY "enrolled members read sessions"
  ON public.league_sessions FOR SELECT
  USING (public.is_league_member(league_id));

-- ─── FIX 3: Add upper bound to handicap_strokes ───────────────────────────────
ALTER TABLE public.league_scores
  DROP CONSTRAINT IF EXISTS league_scores_handicap_strokes_check;

ALTER TABLE public.league_scores
  ADD CONSTRAINT league_scores_handicap_strokes_check
  CHECK (handicap_strokes >= 0 AND handicap_strokes <= 54);

-- ─── FIX 4: Wire updated_at triggers (handle_updated_at defined in 002_core) ──
CREATE TRIGGER set_leagues_updated_at
  BEFORE UPDATE ON public.leagues
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_league_scores_updated_at
  BEFORE UPDATE ON public.league_scores
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── FIX 5: FK indexes (query performance) ───────────────────────────────────
CREATE INDEX idx_league_members_league_id  ON public.league_members(league_id);
CREATE INDEX idx_league_members_user_id    ON public.league_members(user_id);
CREATE INDEX idx_league_sessions_league_id ON public.league_sessions(league_id);
CREATE INDEX idx_league_scores_session_id  ON public.league_scores(session_id);
CREATE INDEX idx_league_scores_member_id   ON public.league_scores(league_member_id);

-- ─── FIX 6: season_end >= season_start constraint ────────────────────────────
ALTER TABLE public.leagues
  ADD CONSTRAINT leagues_season_dates_check
  CHECK (season_end >= season_start);

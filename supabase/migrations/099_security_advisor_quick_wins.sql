-- Migration 099: Security advisor quick wins
--
-- Closes the high-signal security warnings reported by Supabase advisors.
-- Skips perf-only warnings (auth_rls_initplan, multiple_permissive_policies)
-- and the dashboard-only toggle (auth_leaked_password_protection).
--
-- Fixes:
--   * 14 function_search_path_mutable  — set search_path on each function
--   * 13 anon_security_definer_function_executable — revoke EXECUTE from anon
--   * 5  rls_policy_always_true — drop redundant "service role" policies
--                                  (service_role bypasses RLS automatically,
--                                   and the policies were missing a TO clause
--                                   so they were also granting anon/authenticated
--                                   unrestricted access — real security hole)

-- ============================================================
-- 1. Lock down search_path on functions
-- ============================================================
-- A mutable search_path lets a malicious user prepend a schema and shadow
-- objects referenced inside a SECURITY DEFINER function. Setting it
-- explicitly closes that vector.

DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT n.nspname AS schema,
           p.proname AS name,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM   pg_proc p
    JOIN   pg_namespace n ON n.oid = p.pronamespace
    WHERE  n.nspname = 'public'
      AND  p.proname IN (
        'update_updated_at_crm_expenses',
        'handle_updated_at',
        'approve_founding_partner',
        'create_walk_in_booking',
        'sync_crm_member_on_profile',
        'sync_crm_member_on_membership',
        'compute_course_month_metrics',
        'trg_refresh_booking_metrics',
        'trg_refresh_points_metrics',
        'handle_new_user',
        'update_updated_at_column',
        'staff_permissions_touch_updated_at',
        'user_has_course_permission',
        'enforce_tee_time_capacity'
      )
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %I.%I(%s) SET search_path = public, pg_temp',
      fn.schema, fn.name, fn.args
    );
  END LOOP;
END $$;

-- ============================================================
-- 2. Revoke anon EXECUTE on SECURITY DEFINER functions
-- ============================================================
-- None of these are called by anon in app code:
--   * claim_founding_spot, vote_kb_article — server actions call via service role
--   * create_walk_in_booking — called via authenticated user RPC (keep that grant)
--   * trigger functions (handle_new_user, sync_crm_member_*, trg_refresh_*,
--     enforce_tee_time_capacity, compute_course_month_metrics) — only fire
--     from INSERT/UPDATE/DELETE triggers, never direct anon RPC
--   * RLS helpers (is_course_staff, is_league_member, user_has_course_permission)
--     — referenced only by policies on authenticated-only tables

DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT n.nspname AS schema,
           p.proname AS name,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM   pg_proc p
    JOIN   pg_namespace n ON n.oid = p.pronamespace
    WHERE  n.nspname = 'public'
      AND  p.prosecdef = true  -- SECURITY DEFINER only
      AND  p.proname IN (
        'claim_founding_spot',
        'compute_course_month_metrics',
        'create_walk_in_booking',
        'handle_new_user',
        'is_course_staff',
        'is_league_member',
        'sync_crm_member_on_membership',
        'sync_crm_member_on_profile',
        'trg_refresh_booking_metrics',
        'trg_refresh_points_metrics',
        'user_has_course_permission',
        'vote_kb_article',
        'enforce_tee_time_capacity'
      )
  LOOP
    EXECUTE format(
      'REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM anon',
      fn.schema, fn.name, fn.args
    );
  END LOOP;
END $$;

-- ============================================================
-- 3. Drop redundant "service role manage X" policies
-- ============================================================
-- Each table below had a policy like:
--   CREATE POLICY "service role manage X" ON t FOR ALL USING (true);
-- Without a TO clause, that USING(true) applied to public — including anon
-- and authenticated — effectively OR'ing away the restrictive sibling
-- policies. Since the Supabase service_role bypasses RLS automatically,
-- these policies were redundant for their intended purpose AND a hole for
-- everyone else. Dropping them keeps the restrictive policies in force
-- and leaves service-role access intact via the bypass.

DROP POLICY IF EXISTS "service role manage credits"        ON public.member_credits;
DROP POLICY IF EXISTS "service role manage rain checks"    ON public.rain_checks;
DROP POLICY IF EXISTS "service role manage guest passes"   ON public.guest_passes;
DROP POLICY IF EXISTS "Service role can update split sessions" ON public.split_sessions;
DROP POLICY IF EXISTS "Service role can manage invitees"   ON public.split_invitees;

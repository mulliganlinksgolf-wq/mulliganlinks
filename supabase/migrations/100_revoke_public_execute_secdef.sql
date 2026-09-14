-- Migration 100: Properly revoke anon EXECUTE on SECURITY DEFINER functions
--
-- Migration 099 revoked EXECUTE from `anon` but the grants were on PUBLIC
-- (the default for new functions), so anon kept inheriting access via the
-- public group. This migration revokes from PUBLIC and re-grants only to
-- the roles that actually need to call each function directly.
--
-- Direct-call callers per function (from the codebase):
--   * create_walk_in_booking — supabase.rpc() in authenticated user actions
--   * is_course_staff / is_league_member / user_has_course_permission —
--       referenced inside RLS policies, so the role evaluating the policy
--       (authenticated) needs EXECUTE
--   * everything else — only invoked by triggers, by service_role admin
--       clients (which bypass grants), or by cron/postgres internals.
--       No anon/authenticated grant needed.

DO $$
DECLARE
  fn record;
  authenticated_needs_grant boolean;
BEGIN
  FOR fn IN
    SELECT n.nspname AS schema,
           p.proname AS name,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM   pg_proc p
    JOIN   pg_namespace n ON n.oid = p.pronamespace
    WHERE  n.nspname = 'public'
      AND  p.prosecdef = true
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
      'REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated',
      fn.schema, fn.name, fn.args
    );

    -- Functions that authenticated still needs to call directly
    authenticated_needs_grant := fn.name IN (
      'create_walk_in_booking',
      'is_course_staff',
      'is_league_member',
      'user_has_course_permission'
    );

    IF authenticated_needs_grant THEN
      EXECUTE format(
        'GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated',
        fn.schema, fn.name, fn.args
      );
    END IF;
  END LOOP;
END $$;

-- 073_explicit_grants.sql
-- Supabase is removing auto-grants on public schema tables (May 30 for new
-- projects, October 30 for existing). This migration makes all current grants
-- explicit so the app keeps working past that deadline and new tables have a
-- clear template to follow.
--
-- Security model: grants control whether PostgREST can route to a table at
-- all. RLS policies (already in place) control what rows each role can see or
-- modify. anon/authenticated get full DML on every table; RLS policies are the
-- actual gate.

do $$
declare
  tbl text;
  tables text[] := array[
    'admin_audit_log',
    'course_hours',
    'course_payouts',
    'course_pricing',
    'course_referrals',
    'course_staff',
    'course_tee_sheet_config',
    'crm_activity_log',
    'crm_course_contacts',
    'crm_course_metrics',
    'crm_course_users',
    'crm_courses',
    'crm_documents',
    'crm_email_templates',
    'crm_expenses',
    'crm_imap_sync_state',
    'crm_member_metrics',
    'crm_members',
    'crm_outings',
    'crm_tasks',
    'founding_golfer_counter',
    'guest_passes',
    'kb_articles',
    'kb_categories',
    'league_members',
    'league_scores',
    'league_sessions',
    'leagues',
    'member_admin_notes',
    'partner_availability',
    'partner_blocks',
    'partner_connection_requests',
    'partner_preferences',
    'partner_ratings',
    'payment_disputes',
    'push_tokens',
    'service_requests',
    'site_config',
    'stripe_webhook_events'
  ];
begin
  foreach tbl in array tables loop
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = tbl
    ) then
      execute format('grant select on public.%I to anon', tbl);
      execute format('grant select, insert, update, delete on public.%I to authenticated', tbl);
      execute format('grant select, insert, update, delete on public.%I to service_role', tbl);
    end if;
  end loop;
end $$;

-- Template for every future migration that creates a new table:
--
-- grant select on public.your_table to anon;
-- grant select, insert, update, delete on public.your_table to authenticated;
-- grant select, insert, update, delete on public.your_table to service_role;

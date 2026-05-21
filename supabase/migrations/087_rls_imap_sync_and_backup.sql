-- Fix Supabase security advisories: enable RLS on internal/backup tables
-- Both tables are server-only — no public or authenticated user access needed.

begin;

-- crm_imap_sync_state: internal IMAP sync cursor, server-side only
alter table crm_imap_sync_state enable row level security;

-- crm_email_templates_backup_20260519: point-in-time backup, admin/service only
alter table crm_email_templates_backup_20260519 enable row level security;

commit;

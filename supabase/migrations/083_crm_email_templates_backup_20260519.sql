-- Step 2: Backup crm_email_templates before versioning schema changes
-- Run date: 2026-05-19
-- ROLLBACK: drop table if exists crm_email_templates_backup_20260519;

begin;

create table if not exists crm_email_templates_backup_20260519 as
  select * from crm_email_templates;

comment on table crm_email_templates_backup_20260519 is
  'Point-in-time backup of crm_email_templates taken 2026-05-19 before versioning migration.';

commit;

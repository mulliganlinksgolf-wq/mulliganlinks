-- Step 3: Add versioning / status / superseded_by to crm_email_templates
-- Templates are keyed by `name` (no separate key column exists).
-- Partial unique index enforces exactly one active row per name.
--
-- ROLLBACK:
--   drop index if exists crm_email_templates_one_active;
--   alter table crm_email_templates
--     drop column if exists version,
--     drop column if exists status,
--     drop column if exists superseded_by;

begin;

-- version: which iteration this row is (1-indexed per name)
alter table crm_email_templates
  add column if not exists version int not null default 1;

-- status: lifecycle state
alter table crm_email_templates
  add column if not exists status text not null default 'active'
  check (status in ('active', 'draft', 'archived'));

-- superseded_by: points from an archived row to the draft that replaced it
alter table crm_email_templates
  add column if not exists superseded_by uuid
  references crm_email_templates(id) on delete set null;

-- Backfill: all pre-existing rows are active at version 1
update crm_email_templates
  set version = 1, status = 'active'
  where version = 1 and status = 'active';   -- idempotent no-op on re-run

-- Partial unique index: only ONE active row per name at a time.
-- Drafts and archived rows are exempt.
create unique index if not exists crm_email_templates_one_active
  on crm_email_templates (name)
  where status = 'active';

commit;

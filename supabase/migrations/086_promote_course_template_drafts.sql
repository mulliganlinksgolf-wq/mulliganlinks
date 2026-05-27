-- Step 8: Promote all 40 course template v2 drafts to active.
-- For each draft: archive the current active row (same name), then activate the draft.
-- Runs as a single transaction so it's all-or-nothing.
--
-- ROLLBACK:
--   -- Re-archive v2 rows, restore v1 rows back to active
--   update crm_email_templates set status = 'archived' where version = 2 and record_type = 'course';
--   update crm_email_templates set status = 'active'
--     where version = 1 and record_type = 'course'
--     and name in (select name from crm_email_templates where version = 2 and record_type = 'course');

begin;

-- 1. Archive the v1 active rows whose names have a v2 draft ready to replace them
update crm_email_templates
set status = 'archived'
where status = 'active'
  and record_type = 'course'
  and name in (
    select name from crm_email_templates
    where status = 'draft' and version = 2 and record_type = 'course'
  );

-- 2. Activate all v2 drafts
update crm_email_templates
set status = 'active'
where status = 'draft'
  and version = 2
  and record_type = 'course';

commit;

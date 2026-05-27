-- supabase/migrations/034_reports_schema_fixes.sql
-- Improvements to crm_ tables: NOT NULL constraints, index, updated_at trigger

-- NOT NULL on course_id (semantically required — a course metric without a course is meaningless)
ALTER TABLE crm_course_users ALTER COLUMN course_id SET NOT NULL;
ALTER TABLE crm_course_metrics ALTER COLUMN course_id SET NOT NULL;

-- Index for month-range queries across all courses
CREATE INDEX IF NOT EXISTS idx_crm_course_metrics_month ON crm_course_metrics(month);

-- month format check
ALTER TABLE crm_course_metrics ADD CONSTRAINT chk_crm_course_metrics_month CHECK (month ~ '^\d{4}-\d{2}$');
ALTER TABLE crm_member_metrics ADD CONSTRAINT chk_crm_member_metrics_month CHECK (month ~ '^\d{4}-\d{2}$');
ALTER TABLE crm_expenses ADD CONSTRAINT chk_crm_expenses_month CHECK (month ~ '^\d{4}-\d{2}$');

-- updated_at trigger for crm_expenses (matches pattern used by courses/profiles)
-- moddatetime extension not enabled; use inline function instead
CREATE OR REPLACE FUNCTION update_updated_at_crm_expenses()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

CREATE TRIGGER handle_updated_at_crm_expenses
  BEFORE UPDATE ON crm_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_crm_expenses();

-- 068_crm_enhancements.sql
-- Adds: tasks, multiple course contacts, lead source, lost reason.

-- =============== Lead source enum + columns ===============
CREATE TYPE crm_lead_source AS ENUM (
  'cold_email', 'referral', 'inbound', 'event', 'partner', 'list', 'other'
);

ALTER TABLE crm_courses
  ADD COLUMN IF NOT EXISTS lead_source crm_lead_source,
  ADD COLUMN IF NOT EXISTS lost_reason TEXT;

ALTER TABLE crm_outings
  ADD COLUMN IF NOT EXISTS lead_source crm_lead_source,
  ADD COLUMN IF NOT EXISTS lost_reason TEXT;

-- =============== Tasks table ===============
CREATE TABLE crm_tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  notes        TEXT,
  record_type  crm_record_type,
  record_id    UUID,
  assigned_to  TEXT NOT NULL CHECK (assigned_to IN ('neil', 'billy')),
  due_date     DATE,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crm_tasks_due_date  ON crm_tasks(due_date)        WHERE completed_at IS NULL;
CREATE INDEX idx_crm_tasks_record    ON crm_tasks(record_type, record_id);
CREATE INDEX idx_crm_tasks_assignee  ON crm_tasks(assigned_to)     WHERE completed_at IS NULL;

CREATE TRIGGER trg_crm_tasks_updated_at
  BEFORE UPDATE ON crm_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;

-- =============== Course contacts (multiple per course) ===============
CREATE TABLE crm_course_contacts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID NOT NULL REFERENCES crm_courses(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  role        TEXT,
  email       TEXT,
  phone       TEXT,
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crm_course_contacts_course ON crm_course_contacts(course_id);
CREATE INDEX idx_crm_course_contacts_email  ON crm_course_contacts(LOWER(email)) WHERE email IS NOT NULL;

CREATE TRIGGER trg_crm_course_contacts_updated_at
  BEFORE UPDATE ON crm_course_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE crm_course_contacts ENABLE ROW LEVEL SECURITY;

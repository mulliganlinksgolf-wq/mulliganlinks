-- 031_crm_schema.sql
-- CRM tables for TeeAhead internal sales/operations tool

-- Enums
CREATE TYPE crm_course_stage AS ENUM (
  'lead', 'contacted', 'demo', 'negotiating', 'partner', 'churned'
);

CREATE TYPE crm_outing_status AS ENUM (
  'lead', 'quoted', 'confirmed', 'completed', 'cancelled'
);

CREATE TYPE crm_member_tier AS ENUM ('free', 'eagle', 'ace');

CREATE TYPE crm_member_status AS ENUM ('active', 'lapsed', 'churned');

CREATE TYPE crm_activity_type AS ENUM (
  'call', 'email', 'note', 'meeting', 'demo', 'contract_sent'
);

CREATE TYPE crm_record_type AS ENUM ('course', 'outing', 'member');

CREATE TYPE crm_doc_type AS ENUM ('contract', 'proposal', 'other');

-- crm_courses
CREATE TABLE crm_courses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  address         TEXT,
  city            TEXT,
  state           TEXT,
  zip             TEXT,
  contact_name    TEXT,
  contact_email   TEXT,
  contact_phone   TEXT,
  stage           crm_course_stage NOT NULL DEFAULT 'lead',
  assigned_to     TEXT CHECK (assigned_to IN ('neil', 'billy')),
  notes           TEXT,
  estimated_value NUMERIC(10,2),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- crm_outings
CREATE TABLE crm_outings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name     TEXT NOT NULL,
  contact_email    TEXT,
  contact_phone    TEXT,
  event_date       DATE,
  num_golfers      INTEGER,
  preferred_course TEXT,
  budget_estimate  NUMERIC(10,2),
  status           crm_outing_status NOT NULL DEFAULT 'lead',
  assigned_to      TEXT CHECK (assigned_to IN ('neil', 'billy')),
  notes            TEXT,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- crm_members (internal CRM view — separate from auth users)
CREATE TABLE crm_members (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  email            TEXT,
  phone            TEXT,
  membership_tier  crm_member_tier NOT NULL DEFAULT 'free',
  home_course      TEXT,
  join_date        DATE,
  lifetime_spend   NUMERIC(10,2) NOT NULL DEFAULT 0,
  status           crm_member_status NOT NULL DEFAULT 'active',
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- crm_activity_log
CREATE TABLE crm_activity_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type crm_record_type NOT NULL,
  record_id   UUID NOT NULL,
  type        crm_activity_type NOT NULL,
  body        TEXT,
  created_by  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- crm_email_templates
CREATE TABLE crm_email_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  subject     TEXT NOT NULL,
  body_html   TEXT NOT NULL,
  record_type crm_record_type NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- crm_documents
CREATE TABLE crm_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type crm_record_type NOT NULL,
  record_id   UUID NOT NULL,
  name        TEXT NOT NULL,
  type        crm_doc_type NOT NULL DEFAULT 'other',
  file_url    TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by  TEXT NOT NULL
);

-- Indexes
CREATE INDEX idx_crm_courses_stage        ON crm_courses(stage);
CREATE INDEX idx_crm_courses_last_activity ON crm_courses(last_activity_at);
CREATE INDEX idx_crm_courses_assigned     ON crm_courses(assigned_to);
CREATE INDEX idx_crm_outings_status       ON crm_outings(status);
CREATE INDEX idx_crm_outings_last_activity ON crm_outings(last_activity_at);
CREATE INDEX idx_crm_activity_record      ON crm_activity_log(record_type, record_id);
CREATE INDEX idx_crm_activity_created     ON crm_activity_log(created_at DESC);
CREATE INDEX idx_crm_documents_record     ON crm_documents(record_type, record_id);

-- updated_at auto-update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_crm_courses_updated_at
  BEFORE UPDATE ON crm_courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_crm_outings_updated_at
  BEFORE UPDATE ON crm_outings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_crm_members_updated_at
  BEFORE UPDATE ON crm_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_crm_email_templates_updated_at
  BEFORE UPDATE ON crm_email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS enabled; service role key bypasses it (admin-only feature)
ALTER TABLE crm_courses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_outings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_members         ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activity_log    ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_documents       ENABLE ROW LEVEL SECURITY;

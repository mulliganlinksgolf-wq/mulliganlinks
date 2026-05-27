-- supabase/migrations/065_crm_email_tracking.sql

-- Open tracking fields on activity log
ALTER TABLE crm_activity_log
  ADD COLUMN IF NOT EXISTS resend_email_id TEXT,
  ADD COLUMN IF NOT EXISTS opened_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS open_count      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS from_email      TEXT;

CREATE INDEX IF NOT EXISTS idx_crm_activity_resend_id
  ON crm_activity_log (resend_email_id)
  WHERE resend_email_id IS NOT NULL;

-- Per-admin email signature
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS signature TEXT;

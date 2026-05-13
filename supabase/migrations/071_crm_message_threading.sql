-- 070_crm_message_threading.sql
-- Store the SMTP Message-ID we generate for each outbound email so we can
-- thread follow-ups via In-Reply-To and References headers.

ALTER TABLE crm_activity_log
  ADD COLUMN IF NOT EXISTS message_id TEXT,
  ADD COLUMN IF NOT EXISTS in_reply_to TEXT;

CREATE INDEX IF NOT EXISTS idx_crm_activity_message_id
  ON crm_activity_log (message_id)
  WHERE message_id IS NOT NULL;

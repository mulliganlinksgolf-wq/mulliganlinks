-- supabase/migrations/066_imap_sync_state.sql

-- Tracks the last UID processed per mailbox so each sync only fetches new messages
CREATE TABLE IF NOT EXISTS crm_imap_sync_state (
  mailbox     TEXT PRIMARY KEY,
  last_uid    BIGINT NOT NULL DEFAULT 0,
  synced_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- De-duplication: prevents logging the same IMAP message twice if cron overlaps
ALTER TABLE crm_activity_log
  ADD COLUMN IF NOT EXISTS imap_message_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_activity_imap_message_id
  ON crm_activity_log (imap_message_id)
  WHERE imap_message_id IS NOT NULL;

-- 072_backfill_message_id.sql
-- Backfill message_id for emails synced from IMAP before migration 071
-- existed. The imap_message_id column stores `${messageId}-${toEmail}` where
-- messageId is wrapped in angle brackets like <uuid@host>. Extract that prefix.

UPDATE crm_activity_log
SET message_id = SUBSTRING(imap_message_id FROM '^(<[^>]+>)')
WHERE message_id IS NULL
  AND imap_message_id IS NOT NULL
  AND imap_message_id LIKE '<%';

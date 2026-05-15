-- 074_activity_log_email_body.sql
-- Store the full sent email HTML on activity log entries so the CRM
-- can display exactly what was sent, not just a subject/to summary.

ALTER TABLE crm_activity_log ADD COLUMN IF NOT EXISTS email_html text;

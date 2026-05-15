-- 076_outreach_queue_date.sql
-- Tracks which day each course was added to the daily outreach queue

ALTER TABLE crm_courses
  ADD COLUMN IF NOT EXISTS outreach_queued_date DATE;

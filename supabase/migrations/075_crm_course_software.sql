-- 075_crm_course_software.sql
-- Adds current_software field to crm_courses and backfills from notes

ALTER TABLE crm_courses
  ADD COLUMN IF NOT EXISTS current_software TEXT;

-- Backfill from existing notes (format: "Software: X | ...")
UPDATE crm_courses
SET current_software = TRIM(SUBSTRING(notes FROM 'Software: ([^|]+)'))
WHERE notes LIKE '%Software: %'
  AND current_software IS NULL;

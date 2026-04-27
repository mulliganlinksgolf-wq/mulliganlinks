-- Track which pricing tier an applicant is applying for.
-- Values: 'founding' (wants the free-for-life Founding Partner spot)
--         'standard' (wants the $299/month flat tier)
-- Null means submitted before this column existed (treat as 'founding' for pre-existing rows).

ALTER TABLE public.course_waitlist
  ADD COLUMN IF NOT EXISTS applied_tier VARCHAR(20);

-- Add GolfNow contract expiry date to course_waitlist (public-facing signup form)
ALTER TABLE public.course_waitlist
  ADD COLUMN IF NOT EXISTS contract_expiry_date DATE,
  ADD COLUMN IF NOT EXISTS num_locations       SMALLINT,
  ADD COLUMN IF NOT EXISTS referral_source     TEXT;

-- Add GolfNow / contract fields to CRM courses record
ALTER TABLE public.crm_courses
  ADD COLUMN IF NOT EXISTS contract_expiry_date    DATE,
  ADD COLUMN IF NOT EXISTS booking_system          TEXT,
  ADD COLUMN IF NOT EXISTS annual_rounds           INTEGER,
  ADD COLUMN IF NOT EXISTS num_locations           SMALLINT,
  ADD COLUMN IF NOT EXISTS golfnow_contract_status TEXT
    CHECK (golfnow_contract_status IN ('active', 'month_to_month', 'expired', 'never', 'unknown'));

-- Index for expiry-based sorting (used by countdown dashboard)
CREATE INDEX IF NOT EXISTS idx_crm_courses_contract_expiry
  ON public.crm_courses (contract_expiry_date ASC NULLS LAST);

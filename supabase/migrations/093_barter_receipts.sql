-- ============================================================
-- Sprint 4: Barter Receipt monthly automation
--
-- Archive table for the monthly "What GolfNow would have cost you"
-- PDF receipt that the cron job generates on the 1st of each month.
-- One row per (course, receipt_month). The PDF lives in the
-- private 'reports' storage bucket; this table tracks the metadata,
-- computed numbers, and email delivery state.
--
-- RLS uses the existing course_admins + crm_course_users pattern
-- (NOT a permission helper) — staff who can already access the
-- course portal can read receipts for their course.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.barter_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,

  -- First day of the reported month, e.g. '2026-04-01' for April 2026.
  receipt_month date NOT NULL,

  -- Snapshot of inputs the receipt was computed from.
  total_rounds integer NOT NULL,
  peak_rounds integer NOT NULL,
  peak_pct numeric(5,2) NOT NULL,
  avg_green_fee numeric(10,2) NOT NULL,

  -- NGCOA methodology outputs.
  estimated_barter_rounds integer NOT NULL,
  estimated_barter_cost numeric(10,2) NOT NULL,

  -- Storage + delivery state.
  pdf_storage_path text,
  emailed_at timestamptz,
  email_recipient text,

  generated_at timestamptz NOT NULL DEFAULT now(),
  generated_by text NOT NULL DEFAULT 'cron'
    CHECK (generated_by IN ('cron', 'manual')),

  UNIQUE (course_id, receipt_month)
);

CREATE INDEX IF NOT EXISTS idx_barter_receipts_course_month
  ON public.barter_receipts (course_id, receipt_month DESC);

-- ─── RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE public.barter_receipts ENABLE ROW LEVEL SECURITY;

-- Course staff (course_admins or crm_course_users) can read receipts
-- for their course. The course portal layout enforces the auth redirect
-- before any query runs; this policy is the second line of defense.
CREATE POLICY "Course staff can view barter receipts"
  ON public.barter_receipts FOR SELECT
  USING (
    course_id IN (
      SELECT course_id FROM public.course_admins WHERE user_id = auth.uid()
      UNION ALL
      SELECT course_id FROM public.crm_course_users WHERE user_id = auth.uid()
    )
  );

-- No INSERT/UPDATE/DELETE policy for anon or authenticated. The cron job
-- and manual "Generate Now" action both run with the service role via
-- createAdminClient(), which bypasses RLS. Staff cannot mutate receipts
-- directly.

-- ─── Storage bucket ────────────────────────────────────────────────────────

-- Private bucket for generated reports. PDF receipts live under
-- barter-receipts/YYYY-MM/<courseId>.pdf. All access goes through signed
-- URLs minted server-side; we don't need anon/authenticated SELECT policies
-- because the cron and Generate Now action use the service role to upload
-- and to mint URLs.
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', false)
ON CONFLICT (id) DO NOTHING;

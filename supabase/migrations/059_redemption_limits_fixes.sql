-- 059_redemption_limits_fixes.sql
-- Corrects 058_redemption_limits.sql which was applied without RLS, indexes,
-- the updated_at trigger, and with an incorrect comp_rounds_reset_at backfill.

-- ── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.course_redemption_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read redemption settings"
  ON public.course_redemption_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Course managers can upsert redemption settings"
  ON public.course_redemption_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.course_admins
      WHERE course_admins.course_id = course_redemption_settings.course_id
        AND course_admins.user_id = auth.uid()
        AND course_admins.role IN ('owner', 'manager')
    )
  );

-- ── updated_at trigger ───────────────────────────────────────────────────────

CREATE TRIGGER course_redemption_settings_updated_at
  BEFORE UPDATE ON public.course_redemption_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── Fix bookings.course_id FK to use ON DELETE SET NULL ──────────────────────
-- The original migration created the FK without ON DELETE SET NULL.
-- Drop and recreate it.

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_course_id_fkey;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_course_id_fkey
  FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;

-- ── Indexes for redemption cap queries ───────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_bookings_user_course_redemption
  ON public.bookings (user_id, course_id, redemption_type, created_at)
  WHERE redemption_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_course_redemption_monthly
  ON public.bookings (course_id, redemption_type, created_at)
  WHERE redemption_type IS NOT NULL;

-- ── Re-backfill comp_rounds_reset_at using per-member anniversary ─────────────
-- The original backfill used now() + 1 year (flat), which ignores when the
-- member actually joined. This corrects it to their next membership anniversary.

UPDATE public.memberships SET
  comp_rounds_reset_at = (
    created_at + (
      (date_part('year', age(now(), created_at))::int + 1) * interval '1 year'
    )
  )
WHERE status = 'active';

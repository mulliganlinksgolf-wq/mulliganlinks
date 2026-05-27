-- Add check-in tracking and holes selection to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS checked_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS holes integer DEFAULT 18 CHECK (holes IN (9, 18));

-- Course admins can update check-in status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bookings'
    AND policyname = 'Course admins can check in bookings'
  ) THEN
    CREATE POLICY "Course admins can check in bookings"
      ON public.bookings FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.tee_times tt
          JOIN public.course_admins ca ON ca.course_id = tt.course_id
          WHERE tt.id = bookings.tee_time_id
            AND ca.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.tee_times tt
          JOIN public.course_admins ca ON ca.course_id = tt.course_id
          WHERE tt.id = bookings.tee_time_id
            AND ca.user_id = auth.uid()
        )
      );
  END IF;
END $$;

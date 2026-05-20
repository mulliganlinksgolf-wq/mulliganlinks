-- Allow course staff to read member data needed for the mobile staff app.
-- Without these policies, staff users (auth.uid() != member's user_id) get
-- empty results from profiles, memberships, and fairway_points queries —
-- causing the member detail screen to show every member as free-tier with 0 points.

-- Staff can read any member profile (needed for searchMembers + member detail header)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
    AND policyname = 'Course admins can read member profiles'
  ) THEN
    CREATE POLICY "Course admins can read member profiles"
      ON public.profiles FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.course_admins
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Staff can read any member's active membership (needed for tier/expiry display)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'memberships'
    AND policyname = 'Course admins can read member memberships'
  ) THEN
    CREATE POLICY "Course admins can read member memberships"
      ON public.memberships FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.course_admins
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Staff can read any member's Fairway Points (needed for points balance display)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'fairway_points'
    AND policyname = 'Course admins can read member fairway points'
  ) THEN
    CREATE POLICY "Course admins can read member fairway points"
      ON public.fairway_points FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.course_admins
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

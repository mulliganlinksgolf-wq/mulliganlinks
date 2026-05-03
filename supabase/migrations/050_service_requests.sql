-- 048_service_requests.sql
-- Service Requests: golfers can request assistance on-course + RLS

-- ─── TABLES ────────────────────────────────────────────────────────────────

CREATE TABLE public.service_requests (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  course_id         UUID        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  golfer_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id        UUID        REFERENCES public.bookings(id) ON DELETE SET NULL,
  category          TEXT        NOT NULL
                                CHECK (category IN ('cart_issue','lost_club','beverage_cart','pace_of_play','ranger_needed','other')),
  note              TEXT,
  estimated_hole    INTEGER     CHECK (estimated_hole >= 1 AND estimated_hole <= 18),
  status            TEXT        NOT NULL DEFAULT 'open'
                                CHECK (status IN ('open','acknowledged','resolved')),
  acknowledged_at   TIMESTAMPTZ,
  acknowledged_by   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  golfer_notified   BOOLEAN     NOT NULL DEFAULT false
);

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- golfer_insert: golfers can insert their own requests
CREATE POLICY "golfer_insert"
  ON public.service_requests FOR INSERT
  WITH CHECK (golfer_id = auth.uid());

-- golfer_select: golfers can see their own requests
CREATE POLICY "golfer_select"
  ON public.service_requests FOR SELECT
  USING (golfer_id = auth.uid());

-- course_staff_select: course staff can see all requests for their courses
CREATE POLICY "course_staff_select"
  ON public.service_requests FOR SELECT
  USING (
    course_id IN (
      SELECT course_id FROM public.course_admins WHERE user_id = auth.uid()
      UNION ALL
      SELECT course_id FROM public.crm_course_users WHERE user_id = auth.uid()
    )
  );

-- course_staff_update: course staff can update status, acknowledged_at, acknowledged_by, golfer_notified
CREATE POLICY "course_staff_update"
  ON public.service_requests FOR UPDATE
  USING (
    course_id IN (
      SELECT course_id FROM public.course_admins WHERE user_id = auth.uid()
      UNION ALL
      SELECT course_id FROM public.crm_course_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    course_id IN (
      SELECT course_id FROM public.course_admins WHERE user_id = auth.uid()
      UNION ALL
      SELECT course_id FROM public.crm_course_users WHERE user_id = auth.uid()
    )
  );

-- ─── REALTIME ──────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;

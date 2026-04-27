-- Walk-in / manual booking support for course staff

-- Allow bookings without a user account (walk-ins)
ALTER TABLE public.bookings ALTER COLUMN user_id DROP NOT NULL;

-- Guest info and payment method
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS guest_name text,
  ADD COLUMN IF NOT EXISTS guest_phone text,
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cash'
    CHECK (payment_method IN ('cash', 'card', 'unpaid'));

-- Course admins can insert and update bookings for their courses
CREATE POLICY "Course admins can manage their course bookings"
  ON public.bookings FOR ALL
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

-- Atomic walk-in booking: creates booking and decrements available_players in one transaction
CREATE OR REPLACE FUNCTION public.create_walk_in_booking(
  p_tee_time_id uuid,
  p_guest_name text,
  p_guest_phone text,
  p_players int,
  p_total_paid numeric,
  p_payment_method text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_available int;
  v_booking_id uuid;
BEGIN
  -- Verify the caller is a course admin for this tee time
  IF NOT EXISTS (
    SELECT 1 FROM public.tee_times tt
    JOIN public.course_admins ca ON ca.course_id = tt.course_id
    WHERE tt.id = p_tee_time_id AND ca.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Lock the row to prevent double-booking
  SELECT available_players INTO v_available
  FROM public.tee_times
  WHERE id = p_tee_time_id
  FOR UPDATE;

  IF v_available < p_players THEN
    RAISE EXCEPTION 'Not enough available spots (% available, % requested)', v_available, p_players;
  END IF;

  INSERT INTO public.bookings (
    tee_time_id, guest_name, guest_phone, players,
    total_paid, payment_method, status, payment_status
  ) VALUES (
    p_tee_time_id, p_guest_name, NULLIF(p_guest_phone, ''), p_players,
    p_total_paid, p_payment_method, 'confirmed',
    CASE WHEN p_payment_method = 'unpaid' THEN 'pending' ELSE 'succeeded' END
  )
  RETURNING id INTO v_booking_id;

  UPDATE public.tee_times
  SET
    available_players = available_players - p_players,
    status = CASE WHEN (available_players - p_players) = 0 THEN 'booked' ELSE 'open' END
  WHERE id = p_tee_time_id;

  RETURN v_booking_id;
END;
$$;

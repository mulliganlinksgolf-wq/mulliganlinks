-- Keep existing APIs; enforce caller identity inside privileged functions.

CREATE OR REPLACE FUNCTION public.create_walk_in_booking(p_tee_time_id uuid, p_guest_name text, p_guest_phone text, p_players integer, p_total_paid numeric, p_payment_method text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_available int;
  v_booking_id uuid;
BEGIN
  IF p_players IS NULL OR p_players NOT BETWEEN 1 AND 4 OR p_total_paid IS NULL OR p_total_paid < 0 THEN
    RAISE EXCEPTION 'Invalid walk-in booking' USING ERRCODE='22023';
  END IF;
  -- Same lock order as member bookings prevents competing reservation deadlocks.
  PERFORM 1 FROM public.courses WHERE id=(SELECT course_id FROM public.tee_times WHERE id=p_tee_time_id) FOR UPDATE;
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
$function$
;

CREATE OR REPLACE FUNCTION public.create_walk_in_booking(p_tee_time_id uuid, p_guest_name text, p_guest_phone text, p_players integer, p_total_paid numeric, p_payment_method text, p_guest_email text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_available int;
  v_booking_id uuid;
BEGIN
  IF p_players IS NULL OR p_players NOT BETWEEN 1 AND 4 OR p_total_paid IS NULL OR p_total_paid < 0 THEN
    RAISE EXCEPTION 'Invalid walk-in booking' USING ERRCODE='22023';
  END IF;
  -- Same lock order as member bookings prevents competing reservation deadlocks.
  PERFORM 1 FROM public.courses WHERE id=(SELECT course_id FROM public.tee_times WHERE id=p_tee_time_id) FOR UPDATE;
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
    tee_time_id, guest_name, guest_phone, guest_email, players,
    total_paid, payment_method, status, payment_status
  ) VALUES (
    p_tee_time_id, p_guest_name, NULLIF(p_guest_phone, ''), NULLIF(p_guest_email, ''), p_players,
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
$function$
;

CREATE OR REPLACE FUNCTION public.claim_listing(p_listing_id uuid, p_claimant_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_listing tee_time_listings%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR p_claimant_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized claimant' USING ERRCODE='42501';
  END IF;
  -- Atomic compare-and-swap: only succeeds if still active and not expired
  UPDATE tee_time_listings
  SET
    status                 = 'claimed',
    claimed_by_member_id   = p_claimant_id,
    claimed_at             = now(),
    updated_at             = now()
  WHERE
    id                    = p_listing_id
    AND status            = 'active'
    AND expires_at        > now()
    AND listed_by_member_id != p_claimant_id  -- can't claim your own listing
  RETURNING * INTO v_listing;

  -- If no row was updated, listing was already taken or expired
  IF v_listing.id IS NULL THEN
    RETURN jsonb_build_object('error', 'This time is no longer available.');
  END IF;

  -- Issue credit to original booker (only if booking had a value)
  IF v_listing.credit_amount_cents > 0 THEN
    UPDATE profiles
    SET teeahead_credit_cents = teeahead_credit_cents + v_listing.credit_amount_cents
    WHERE id = v_listing.listed_by_member_id;
  END IF;

  -- Immutable audit record
  INSERT INTO tee_time_transfers (
    listing_id, from_member_id, to_member_id, course_id, credit_issued_cents
  ) VALUES (
    v_listing.id,
    v_listing.listed_by_member_id,
    p_claimant_id,
    v_listing.course_id,
    v_listing.credit_amount_cents
  );

  RETURN jsonb_build_object(
    'success',      true,
    'credit_cents', v_listing.credit_amount_cents
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.user_has_course_permission(p_user_id uuid, p_course_id uuid, p_permission course_permission)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_is_admin  BOOLEAN;
  v_role      TEXT;
  v_override  BOOLEAN;
BEGIN
  IF coalesce(auth.jwt()->>'role','') <> 'service_role'
     AND (auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid()) THEN
    RETURN false;
  END IF;
  -- 1) Global-admin bypass: full access, ignore overrides
  SELECT COALESCE(is_admin, FALSE) INTO v_is_admin
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_is_admin THEN
    RETURN TRUE;
  END IF;

  -- 2) Resolve role: course_admins wins, then crm_course_users
  SELECT role INTO v_role
  FROM public.course_admins
  WHERE user_id = p_user_id AND course_id = p_course_id
  LIMIT 1;

  IF v_role IS NULL THEN
    SELECT role INTO v_role
    FROM public.crm_course_users
    WHERE user_id = p_user_id AND course_id = p_course_id
    LIMIT 1;
  END IF;

  IF v_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 3) Explicit override beats role default in either direction
  SELECT granted INTO v_override
  FROM public.staff_permissions
  WHERE user_id = p_user_id
    AND course_id = p_course_id
    AND permission = p_permission;

  IF FOUND THEN
    RETURN v_override;
  END IF;

  -- 4) Fall back to role default (handles unknown role values -> FALSE)
  RETURN EXISTS (
    SELECT 1
    FROM public.role_default_permissions
    WHERE role = v_role
      AND permission = p_permission
  );
END;
$function$
;

REVOKE ALL ON FUNCTION public.claim_listing(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_listing(uuid,uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.user_has_course_permission(uuid,uuid,public.course_permission) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_has_course_permission(uuid,uuid,public.course_permission) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.create_walk_in_booking(uuid,text,text,integer,numeric,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_walk_in_booking(uuid,text,text,integer,numeric,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_walk_in_booking(uuid,text,text,integer,numeric,text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_walk_in_booking(uuid,text,text,integer,numeric,text,text) TO authenticated, service_role;

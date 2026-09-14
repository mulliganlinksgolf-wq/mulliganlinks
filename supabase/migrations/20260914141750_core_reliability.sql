-- Additive lifecycle fields; legacy rows retain booking_version=0.
ALTER TABLE public.bookings
  ADD COLUMN reservation_expires_at timestamptz,
  ADD COLUMN cancellation_requested_at timestamptz,
  ADD COLUMN cancellation_reason text CHECK (cancellation_reason IN ('member','expired')),
  ADD COLUMN comp_round_period_end timestamptz,
  ADD COLUMN booking_version smallint NOT NULL DEFAULT 0;
CREATE INDEX bookings_pending_expiry ON public.bookings(reservation_expires_at) WHERE status='pending_payment';

-- Apply in a staging database before deploying the matching application code.
-- All booking creation and benefit consumption share one transaction. Only the
-- server's service role can call this function with its validated quote.
CREATE OR REPLACE FUNCTION public.create_member_booking(p_quote jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
  q jsonb := p_quote;
  uid uuid := (q->>'user_id')::uuid;
  tid uuid := (q->>'tee_time_id')::uuid;
  cid uuid := (q->>'course_id')::uuid;
  bid uuid := gen_random_uuid();
  gid uuid := gen_random_uuid();
  tt public.tee_times%ROWTYPE;
  mem public.memberships%ROWTYPE;
  credit public.member_credits%ROWTYPE;
  remaining integer := (q->>'credits_redeemed_cents')::integer;
  debit integer;
  n integer;
  grouped boolean := false;
  local_day date;
  cap_settings public.course_redemption_settings%ROWTYPE;
BEGIN
  -- Course lock also serializes monthly redemption limits; member lock serializes
  -- credits/points used across different tee times. Keep this order consistent.
  PERFORM 1 FROM public.courses WHERE id = cid FOR UPDATE;
  PERFORM 1 FROM public.profiles WHERE id = uid FOR UPDATE;
  SELECT * INTO tt FROM public.tee_times WHERE id = tid AND course_id = cid FOR UPDATE;
  IF NOT FOUND OR tt.status <> 'open' OR tt.scheduled_at <= now() THEN
    RAISE EXCEPTION 'Tee time unavailable';
  END IF;
  n := (q->>'players')::integer;
  IF n NOT BETWEEN 1 AND 4 OR n > tt.available_players THEN RAISE EXCEPTION 'Tee time capacity exceeded' USING ERRCODE = '23514'; END IF;
  SELECT * INTO mem FROM public.memberships WHERE user_id = uid AND status = 'active' FOR UPDATE;
  IF mem.comp_rounds_reset_at <= now() THEN
    WHILE mem.comp_rounds_reset_at <= now() LOOP
      mem.comp_rounds_reset_at := mem.comp_rounds_reset_at + interval '1 year';
    END LOOP;
    mem.comp_rounds_remaining := CASE mem.tier WHEN 'eagle' THEN 1 WHEN 'ace' THEN 2 ELSE 0 END;
    UPDATE public.memberships SET comp_rounds_remaining=mem.comp_rounds_remaining,
      comp_rounds_reset_at=mem.comp_rounds_reset_at WHERE user_id=uid;
  END IF;
  IF coalesce(mem.tier, 'free') <> q->>'tier' THEN RAISE EXCEPTION 'Membership changed; reload booking'; END IF;
  IF (q->>'points_redeemed')::integer < 0 OR remaining < 0 OR (q->>'total_charged_cents')::integer < 0 THEN RAISE EXCEPTION 'Invalid booking amounts'; END IF;
  IF (q->>'points_redeemed')::integer > coalesce((SELECT sum(amount) FROM public.fairway_points WHERE user_id = uid),0) THEN RAISE EXCEPTION 'Insufficient points'; END IF;
  IF remaining > coalesce((SELECT sum(amount_cents) FROM public.member_credits WHERE user_id = uid AND status = 'available' AND expires_at > now()),0) THEN RAISE EXCEPTION 'Insufficient credits'; END IF;
  IF q->>'redemption_type' = 'complimentary' AND (coalesce(mem.comp_rounds_remaining,0) < 1 OR mem.tier NOT IN ('eagle','ace')) THEN RAISE EXCEPTION 'No complimentary rounds remaining'; END IF;
  IF q->>'redemption_type' IS NOT NULL THEN
    -- Recheck caps after locking so simultaneous bookings cannot exceed them.
    SELECT * INTO cap_settings FROM public.course_redemption_settings WHERE course_id=cid;
    IF cap_settings.monthly_redemption_cap IS NOT NULL AND
      (SELECT count(*) FROM public.bookings b WHERE b.course_id=cid
       AND b.status NOT IN ('canceled','no_show') AND b.redemption_type IS NOT NULL
       AND b.created_at>=date_trunc('month',now()))>=cap_settings.monthly_redemption_cap THEN
      RAISE EXCEPTION 'Monthly redemption limit reached';
    END IF;
    IF q->>'redemption_type'='points' AND
      (SELECT count(*) FROM public.bookings b WHERE b.course_id=cid AND b.user_id=uid
       AND b.status NOT IN ('canceled','no_show') AND b.redemption_type='points'
       AND b.created_at>=mem.created_at+make_interval(years=>extract(year FROM age(now(),mem.created_at))::integer))
      >= (CASE mem.tier WHEN 'ace' THEN coalesce(cap_settings.max_redemptions_ace,3)
        WHEN 'eagle' THEN coalesce(cap_settings.max_redemptions_eagle,2) ELSE coalesce(cap_settings.max_redemptions_fairway,1) END) THEN
      RAISE EXCEPTION 'Annual redemption limit reached';
    END IF;
  END IF;
  IF (q->>'join_existing_group')::boolean THEN
    IF NOT (SELECT allow_self_grouping FROM public.courses WHERE id = cid) THEN RAISE EXCEPTION 'Self-grouping disabled'; END IF;
    SELECT (tt.scheduled_at AT TIME ZONE coalesce(timezone,'America/Detroit'))::date INTO local_day FROM public.courses WHERE id = cid;
    IF EXISTS (SELECT 1 FROM public.course_tee_sheet_overrides WHERE course_id = cid AND override_date = local_day AND self_grouping_disabled) THEN RAISE EXCEPTION 'Self-grouping disabled for this date'; END IF;
    SELECT booking_group_id INTO gid FROM public.bookings WHERE tee_time_id = tid AND status NOT IN ('canceled','no_show') ORDER BY created_at LIMIT 1;
    grouped := gid IS NOT NULL;
    gid := coalesce(gid, gen_random_uuid());
  END IF;
  INSERT INTO public.bookings (id, tee_time_id, course_id, user_id, players, total_paid, status,
    payment_status, green_fee_cents, platform_fee_cents, total_charged_cents, points_awarded,
    discount_cents, guest_pass_id, redemption_type, cart_selected, cart_fee_cents, booking_group_id, is_self_grouped, booking_version, reservation_expires_at, comp_round_period_end,tee_start,holes)
  VALUES (bid, tid, cid, uid, n, (q->>'total_charged_cents')::numeric / 100, q->>'status',
    'pending', (q->>'green_fee_cents')::integer, (q->>'platform_fee_cents')::integer,
    (q->>'total_charged_cents')::integer, (q->>'points_awarded')::integer,
    (q->>'discount_cents')::integer, (q->>'guest_pass_id')::uuid, q->>'redemption_type',
    (q->>'cart_selected')::boolean, (q->>'cart_fee_cents')::integer, gid, grouped, 1,
    CASE WHEN q->>'status'='pending_payment' THEN now()+interval '15 minutes' END, mem.comp_rounds_reset_at,tt.tee_start,tt.holes);
  IF q->>'guest_pass_id' IS NOT NULL THEN
    UPDATE public.guest_passes SET redeemed_at = now(), booking_id = bid
    WHERE id = (q->>'guest_pass_id')::uuid AND user_id = uid AND redeemed_at IS NULL AND expires_at > now();
    IF NOT FOUND THEN RAISE EXCEPTION 'Guest pass already used or expired'; END IF;
  END IF;
  IF q->>'rain_check_id' IS NOT NULL THEN
    UPDATE public.rain_checks SET status = 'redeemed', redeemed_booking_id = bid
    WHERE id = (q->>'rain_check_id')::uuid AND user_id = uid AND course_id = cid AND status = 'available' AND expires_at > now();
    IF NOT FOUND THEN RAISE EXCEPTION 'Rain check already used or expired'; END IF;
  END IF;
  IF (q->>'points_redeemed')::integer > 0 THEN
    INSERT INTO public.fairway_points(user_id,course_id,booking_id,amount,reason)
    VALUES(uid,cid,bid,-(q->>'points_redeemed')::integer,'Points redeemed at booking');
  END IF;
  IF q->>'redemption_type' = 'complimentary' THEN
    UPDATE public.memberships SET comp_rounds_remaining = comp_rounds_remaining - 1 WHERE user_id = uid AND status = 'active';
  END IF;
  FOR credit IN SELECT * FROM public.member_credits WHERE user_id = uid AND status = 'available' AND expires_at > now() ORDER BY created_at FOR UPDATE LOOP
    EXIT WHEN remaining = 0;
    debit := least(remaining,credit.amount_cents);
    IF debit = credit.amount_cents THEN
      UPDATE public.member_credits SET status = 'used', redeemed_booking_id = bid WHERE id = credit.id;
    ELSE
      UPDATE public.member_credits SET amount_cents = amount_cents - debit WHERE id = credit.id;
      INSERT INTO public.member_credits(user_id,type,amount_cents,status,redeemed_booking_id,expires_at)
      VALUES(uid,credit.type,debit,'used',bid,credit.expires_at);
    END IF;
    remaining := remaining - debit;
  END LOOP;
  IF grouped THEN UPDATE public.bookings SET is_self_grouped = true WHERE booking_group_id = gid; END IF;
  UPDATE public.tee_times SET available_players = available_players - n,
    status = CASE WHEN available_players - n <= 0 THEN 'booked' ELSE 'open' END WHERE id = tid;
  RETURN bid;
END $$;
REVOKE ALL ON FUNCTION public.create_member_booking(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_member_booking(jsonb) TO service_role;

-- Never expose complete booking rows merely to calculate public occupancy.

CREATE OR REPLACE FUNCTION public.get_public_tee_time_occupancy(p_course_id uuid, p_start timestamptz, p_end timestamptz)
RETURNS TABLE(tee_time_id uuid, scheduled_at timestamptz, max_players integer, players_booked integer, spots_remaining integer, has_self_grouped_bookings boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT tt.id, tt.scheduled_at, tt.max_players,
    coalesce(sum(b.players),0)::integer,
    greatest(0,tt.max_players-coalesce(sum(b.players),0))::integer,
    coalesce(bool_or(b.is_self_grouped),false)
  FROM public.tee_times tt
  JOIN public.courses c ON c.id = tt.course_id
  LEFT JOIN public.bookings b ON b.tee_time_id = tt.id AND b.status NOT IN ('canceled','no_show')
  WHERE tt.course_id = p_course_id AND c.status = 'active'
    AND tt.scheduled_at >= p_start AND tt.scheduled_at <= p_end
  GROUP BY tt.id ORDER BY tt.scheduled_at
$$;
REVOKE ALL ON FUNCTION public.get_public_tee_time_occupancy(uuid,timestamptz,timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_tee_time_occupancy(uuid,timestamptz,timestamptz) TO anon, authenticated, service_role;



-- Existing members may cancel their own booking, but cannot rewrite financial
-- fields directly through the Data API. Staff access retains existing policies.
CREATE OR REPLACE FUNCTION public.protect_member_booking_update()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
BEGIN
  IF current_user IN ('anon','authenticated') AND NOT EXISTS (
    SELECT 1 FROM public.course_admins WHERE course_id = coalesce(OLD.course_id,(SELECT course_id FROM public.tee_times WHERE id=OLD.tee_time_id)) AND user_id = auth.uid()
  ) THEN
    IF NEW IS DISTINCT FROM OLD THEN
      RAISE EXCEPTION 'Booking changes must use an authorized server action';
    END IF;
  END IF;
  RETURN NEW;
END $$;


-- Retried or concurrent payment events must not consume another slot or award
-- points twice. Points remain a completion benefit, not a payment benefit.
CREATE OR REPLACE FUNCTION public.settle_booking_payment(p_booking_id uuid, p_payment_intent_id text, p_charge_id text, p_amount integer)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE b public.bookings%ROWTYPE; tid uuid; occupied integer;
BEGIN
  SELECT tee_time_id INTO tid FROM public.bookings WHERE id = p_booking_id;
  IF tid IS NULL THEN RAISE EXCEPTION 'Booking not found'; END IF;
  PERFORM 1 FROM public.tee_times WHERE id = tid FOR UPDATE;
  SELECT * INTO b FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  IF b.stripe_payment_intent_id IS DISTINCT FROM p_payment_intent_id OR b.total_charged_cents IS DISTINCT FROM p_amount THEN RAISE EXCEPTION 'Payment does not match booking'; END IF;
  IF b.payment_status IN ('succeeded','refunded','partially_refunded','disputed') THEN RETURN false; END IF;
  IF b.cancellation_reason='member' THEN RETURN false; END IF;
  IF b.status <> 'pending_payment' THEN RAISE EXCEPTION 'Booking is not awaiting payment'; END IF;
  UPDATE public.bookings SET status='confirmed',payment_status='succeeded',paid_at=now(),stripe_charge_id=p_charge_id,
    cancellation_requested_at=NULL,cancellation_reason=NULL,reservation_expires_at=NULL WHERE id=b.id;
  SELECT coalesce(sum(players),0)::integer INTO occupied FROM public.bookings WHERE tee_time_id=tid AND status NOT IN ('canceled','no_show');
  UPDATE public.tee_times SET available_players=greatest(0,max_players-occupied),
    status=CASE WHEN max_players <= occupied THEN 'booked' ELSE 'open' END WHERE id=tid;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.settle_booking_payment(uuid,text,text,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.settle_booking_payment(uuid,text,text,integer) TO service_role;

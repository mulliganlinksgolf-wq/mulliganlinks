-- Lock the reservation before contacting Stripe. The durable request is resumed
-- by retries/cleanup if Stripe succeeds but the final database write fails.
CREATE OR REPLACE FUNCTION public.request_booking_cancellation(p_booking_id uuid,p_user_id uuid,p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE b public.bookings%ROWTYPE; tt public.tee_times%ROWTYPE;
BEGIN
  SELECT * INTO b FROM public.bookings WHERE id=p_booking_id;
  IF NOT FOUND OR (p_reason='member' AND b.user_id IS DISTINCT FROM p_user_id) THEN RAISE EXCEPTION 'Booking not found'; END IF;
  IF p_reason NOT IN ('member','expired') THEN RAISE EXCEPTION 'Invalid cancellation reason'; END IF;
  PERFORM 1 FROM public.courses WHERE id=(SELECT course_id FROM public.tee_times WHERE id=b.tee_time_id) FOR UPDATE;
  PERFORM 1 FROM public.profiles WHERE id=b.user_id FOR UPDATE;
  SELECT * INTO tt FROM public.tee_times WHERE id=b.tee_time_id FOR UPDATE;
  SELECT * INTO b FROM public.bookings WHERE id=p_booking_id FOR UPDATE;
  IF b.status='canceled' THEN RETURN to_jsonb(b); END IF;
  IF b.cancellation_requested_at IS NOT NULL THEN RETURN to_jsonb(b); END IF;
  IF b.status NOT IN ('confirmed','pending_payment') THEN RAISE EXCEPTION 'This booking cannot be canceled'; END IF;
  IF p_reason='member' AND b.status='confirmed' AND tt.scheduled_at<now()+interval '1 hour' THEN
    RAISE EXCEPTION 'Cancellations must be made at least 1 hour before tee time';
  END IF;
  IF p_reason='expired' AND (b.status<>'pending_payment' OR b.reservation_expires_at IS NULL OR b.reservation_expires_at>now()) THEN
    RAISE EXCEPTION 'Reservation is not expired';
  END IF;
  UPDATE public.bookings SET cancellation_requested_at=now(),cancellation_reason=p_reason WHERE id=b.id RETURNING * INTO b;
  RETURN to_jsonb(b);
END $$;

CREATE OR REPLACE FUNCTION public.finish_booking_cancellation(p_booking_id uuid,p_refunded_cents integer DEFAULT 0)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE b public.bookings%ROWTYPE; occupied integer; net_points integer; cid uuid;
BEGIN
  SELECT * INTO b FROM public.bookings WHERE id=p_booking_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found'; END IF;
  SELECT course_id INTO cid FROM public.tee_times WHERE id=b.tee_time_id;
  PERFORM 1 FROM public.courses WHERE id=cid FOR UPDATE;
  PERFORM 1 FROM public.profiles WHERE id=b.user_id FOR UPDATE;
  PERFORM 1 FROM public.tee_times WHERE id=b.tee_time_id FOR UPDATE;
  SELECT * INTO b FROM public.bookings WHERE id=p_booking_id FOR UPDATE;
  IF b.status='canceled' THEN RETURN false; END IF;
  IF b.cancellation_requested_at IS NULL OR b.status NOT IN ('confirmed','pending_payment') THEN RAISE EXCEPTION 'Cancellation not requested'; END IF;
  IF p_refunded_cents<0 THEN RAISE EXCEPTION 'Invalid refund'; END IF;
  UPDATE public.bookings SET status='canceled', reservation_expires_at=NULL,
    payment_status=CASE WHEN p_refunded_cents>0 THEN 'refunded' WHEN stripe_payment_intent_id IS NOT NULL THEN 'failed' ELSE payment_status END,
    refunded_amount_cents=greatest(refunded_amount_cents,p_refunded_cents),
    refunded_at=CASE WHEN p_refunded_cents>0 THEN now() ELSE refunded_at END WHERE id=b.id;
  SELECT coalesce(sum(amount),0)::integer INTO net_points FROM public.fairway_points WHERE booking_id=b.id;
  IF net_points<>0 THEN
    INSERT INTO public.fairway_points(user_id,course_id,booking_id,amount,reason)
    VALUES(b.user_id,cid,b.id,-net_points,'Booking canceled, points balance restored');
  END IF;
  UPDATE public.member_credits SET status=CASE WHEN expires_at IS NULL OR expires_at>now() THEN 'available' ELSE 'expired' END,
    redeemed_booking_id=NULL WHERE redeemed_booking_id=b.id AND status='used';
  UPDATE public.guest_passes SET redeemed_at=NULL,booking_id=NULL WHERE booking_id=b.id;
  UPDATE public.rain_checks SET status=CASE WHEN expires_at>now() THEN 'available' ELSE 'expired' END,
    redeemed_booking_id=NULL WHERE redeemed_booking_id=b.id AND status='redeemed';
  IF b.redemption_type='complimentary' THEN
    UPDATE public.memberships SET comp_rounds_remaining=least(comp_rounds_remaining+1,CASE tier WHEN 'eagle' THEN 1 WHEN 'ace' THEN 2 ELSE 0 END)
    WHERE user_id=b.user_id AND status='active' AND comp_rounds_reset_at IS NOT DISTINCT FROM b.comp_round_period_end;
  END IF;
  SELECT coalesce(sum(players),0)::integer INTO occupied FROM public.bookings WHERE tee_time_id=b.tee_time_id AND status NOT IN ('canceled','no_show');
  UPDATE public.tee_times SET available_players=greatest(0,max_players-occupied),
    status=CASE WHEN status='blocked' THEN status WHEN max_players<=occupied THEN 'booked' ELSE 'open' END WHERE id=b.tee_time_id;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.request_booking_cancellation(uuid,uuid,text),public.finish_booking_cancellation(uuid,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.request_booking_cancellation(uuid,uuid,text),public.finish_booking_cancellation(uuid,integer) TO service_role;

-- One grant per subscription billing period, across every webhook endpoint.
CREATE TABLE public.membership_benefit_grants (
  subscription_id text NOT NULL,
  period_end timestamptz NOT NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  pass_count integer NOT NULL CHECK(pass_count BETWEEN 0 AND 2),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(subscription_id,period_end)
);
ALTER TABLE public.membership_benefit_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.membership_benefit_grants FROM anon,authenticated;
GRANT ALL ON public.membership_benefit_grants TO service_role;
CREATE OR REPLACE FUNCTION public.issue_membership_guest_passes(p_user_id uuid,p_subscription_id text,p_period_end timestamptz,p_tier text)
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE n integer; claimed integer;
BEGIN
  n:=CASE p_tier WHEN 'eagle' THEN 1 WHEN 'ace' THEN 2 ELSE 0 END;
  IF n=0 OR p_period_end<=now() OR p_subscription_id IS NULL THEN RETURN 0; END IF;
  PERFORM 1 FROM public.profiles WHERE id=p_user_id FOR UPDATE;
  IF NOT EXISTS(SELECT 1 FROM public.memberships WHERE user_id=p_user_id AND stripe_subscription_id=p_subscription_id AND status='active') THEN
    RAISE EXCEPTION 'Active subscription not found';
  END IF;
  INSERT INTO public.membership_benefit_grants(subscription_id,period_end,user_id,pass_count)
  VALUES(p_subscription_id,p_period_end,p_user_id,n) ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS claimed=ROW_COUNT;
  IF claimed=0 THEN RETURN 0; END IF;
  UPDATE public.memberships SET comp_rounds_remaining=n,comp_rounds_reset_at=p_period_end
  WHERE user_id=p_user_id AND stripe_subscription_id=p_subscription_id
    AND (comp_rounds_reset_at IS NULL OR comp_rounds_reset_at<=now());
  INSERT INTO public.guest_passes(user_id,expires_at) SELECT p_user_id,p_period_end FROM generate_series(1,n);
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.issue_membership_guest_passes(uuid,text,timestamptz,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.issue_membership_guest_passes(uuid,text,timestamptz,text) TO service_role;

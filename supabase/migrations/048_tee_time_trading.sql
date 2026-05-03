-- supabase/migrations/048_tee_time_trading.sql

-- 1. Credit balance on member profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS teeahead_credit_cents INTEGER NOT NULL DEFAULT 0;

-- 2. Trading settings on courses
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS trading_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trading_min_hours_before INTEGER NOT NULL DEFAULT 4;

-- 3. Listings table
CREATE TABLE public.tee_time_listings (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tee_time_id            UUID        NOT NULL REFERENCES public.tee_times(id) ON DELETE CASCADE,
  course_id              UUID        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  listed_by_member_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id             UUID        NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  credit_amount_cents    INTEGER     NOT NULL DEFAULT 0,
  status                 TEXT        NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active','claimed','cancelled','expired')),
  listed_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at             TIMESTAMPTZ NOT NULL,
  claimed_by_member_id   UUID        REFERENCES public.profiles(id),
  claimed_at             TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (booking_id)  -- one active listing per booking
);

-- 4. Transfer audit log (immutable — never updated)
CREATE TABLE public.tee_time_transfers (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id           UUID        NOT NULL REFERENCES public.tee_time_listings(id) ON DELETE CASCADE,
  from_member_id       UUID        NOT NULL REFERENCES public.profiles(id),
  to_member_id         UUID        NOT NULL REFERENCES public.profiles(id),
  course_id            UUID        NOT NULL REFERENCES public.courses(id),
  credit_issued_cents  INTEGER     NOT NULL DEFAULT 0,
  transferred_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Indexes
CREATE INDEX ON public.tee_time_listings (course_id, status);
CREATE INDEX ON public.tee_time_listings (listed_by_member_id);
CREATE INDEX ON public.tee_time_listings (expires_at) WHERE status = 'active';

-- 6. RLS
ALTER TABLE public.tee_time_listings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tee_time_transfers ENABLE ROW LEVEL SECURITY;

-- Any authenticated member can browse active listings for trading-enabled courses
CREATE POLICY "members_read_active_listings"
  ON public.tee_time_listings FOR SELECT TO authenticated
  USING (
    status = 'active'
    AND expires_at > now()
    AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id AND c.trading_enabled = true
    )
  );

-- Members can always read their own listings (all statuses)
CREATE POLICY "members_read_own_listings"
  ON public.tee_time_listings FOR SELECT TO authenticated
  USING (listed_by_member_id = auth.uid() OR claimed_by_member_id = auth.uid());

-- Members can create listings for their own bookings
CREATE POLICY "members_insert_listing"
  ON public.tee_time_listings FOR INSERT TO authenticated
  WITH CHECK (listed_by_member_id = auth.uid());

-- Members can cancel only their own active listings
CREATE POLICY "members_cancel_listing"
  ON public.tee_time_listings FOR UPDATE TO authenticated
  USING  (listed_by_member_id = auth.uid() AND status = 'active')
  WITH CHECK (status = 'cancelled');

-- Course staff can read all listings for their course
CREATE POLICY "course_staff_read_listings"
  ON public.tee_time_listings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.course_admins ca
      WHERE ca.course_id = tee_time_listings.course_id AND ca.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.crm_course_users cu
      WHERE cu.course_id = tee_time_listings.course_id AND cu.user_id = auth.uid()
    )
  );

-- Course staff can update (e.g. admin-cancel) listings for their course
CREATE POLICY "course_staff_update_listings"
  ON public.tee_time_listings FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.course_admins ca
      WHERE ca.course_id = tee_time_listings.course_id AND ca.user_id = auth.uid()
    )
  );

-- Members can read their own transfers
CREATE POLICY "members_read_transfers"
  ON public.tee_time_transfers FOR SELECT TO authenticated
  USING (from_member_id = auth.uid() OR to_member_id = auth.uid());

-- Course staff can read transfers for their course
CREATE POLICY "course_staff_read_transfers"
  ON public.tee_time_transfers FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.course_admins ca
      WHERE ca.course_id = tee_time_transfers.course_id AND ca.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.crm_course_users cu
      WHERE cu.course_id = tee_time_transfers.course_id AND cu.user_id = auth.uid()
    )
  );

-- 7. Atomic claim + credit RPC (prevents double-claims via row-level lock)
CREATE OR REPLACE FUNCTION public.claim_listing(
  p_listing_id  UUID,
  p_claimant_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_listing tee_time_listings%ROWTYPE;
BEGIN
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
$$;

GRANT EXECUTE ON FUNCTION public.claim_listing TO authenticated;

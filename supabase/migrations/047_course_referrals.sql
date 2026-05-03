-- Add referral_code to courses (defaults to slug for all existing courses)
ALTER TABLE courses
  ADD COLUMN referral_code TEXT UNIQUE;

UPDATE courses SET referral_code = slug WHERE referral_code IS NULL;

ALTER TABLE courses ALTER COLUMN referral_code SET NOT NULL;

-- A golfer can only ever be attributed to one course, ever.
-- profile_id UNIQUE enforces this at the DB level — prevents gaming.
CREATE TABLE course_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  membership_id UUID REFERENCES memberships(id) ON DELETE SET NULL,
  attribution_method TEXT NOT NULL CHECK (attribution_method IN ('link', 'dropdown')),
  attributed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL, -- attributed_at + 12 months; rev share ends after this
  membership_tier TEXT, -- 'eagle' | 'ace' (null until paid membership created)
  membership_amount_cents INT, -- membership price in cents at time of signup
  rev_share_cents INT, -- 10% of membership_amount_cents (locked at signup tier, not upgrades)
  payout_status TEXT NOT NULL DEFAULT 'pending' CHECK (payout_status IN ('pending', 'queued', 'paid', 'reversed', 'expired')),
  paid_at TIMESTAMPTZ,
  stripe_transfer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (profile_id) -- one attribution per golfer, ever
);

CREATE INDEX idx_course_referrals_course_id ON course_referrals(course_id);
CREATE INDEX idx_course_referrals_payout_status ON course_referrals(payout_status);
CREATE INDEX idx_course_referrals_expires_at ON course_referrals(expires_at);

ALTER TABLE course_referrals ENABLE ROW LEVEL SECURITY;

-- Course owners/managers can read their own course's referrals
CREATE POLICY "Course staff can view their course referrals"
  ON course_referrals FOR SELECT
  USING (
    course_id IN (
      SELECT course_id FROM course_admins
      WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

-- All writes go through service role only — no client writes
CREATE POLICY "Service role full access"
  ON course_referrals FOR ALL
  USING (auth.role() = 'service_role');

CREATE TRIGGER course_referrals_updated_at
  BEFORE UPDATE ON course_referrals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

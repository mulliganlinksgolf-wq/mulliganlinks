-- Stripe Connect columns for courses
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS stripe_account_status text NOT NULL DEFAULT 'not_started'
    CHECK (stripe_account_status IN ('not_started','onboarding','restricted','active','disabled')),
  ADD COLUMN IF NOT EXISTS stripe_charges_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_payouts_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_details_submitted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS payout_schedule text NOT NULL DEFAULT 'rolling_7'
    CHECK (payout_schedule IN ('rolling_2','rolling_7','rolling_14')),
  ADD COLUMN IF NOT EXISTS absorb_stripe_fees boolean NOT NULL DEFAULT true;

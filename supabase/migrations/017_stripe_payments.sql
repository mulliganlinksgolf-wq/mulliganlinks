-- Stripe payment columns for bookings
-- Extend status check to include pending_payment
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check
    CHECK (status IN ('pending_payment','confirmed','canceled','completed','no_show'));

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS stripe_charge_id text,
  ADD COLUMN IF NOT EXISTS stripe_transfer_id text,
  ADD COLUMN IF NOT EXISTS green_fee_cents integer,
  ADD COLUMN IF NOT EXISTS platform_fee_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_charged_cents integer,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending','processing','succeeded','failed','refunded','partially_refunded','disputed')),
  ADD COLUMN IF NOT EXISTS refunded_amount_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refund_reason text,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- Webhook idempotency table
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed boolean NOT NULL DEFAULT false,
  processing_error text,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_processed
  ON public.stripe_webhook_events (processed, received_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type
  ON public.stripe_webhook_events (event_type);

-- Payment disputes
CREATE TABLE IF NOT EXISTS public.payment_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id),
  course_id uuid NOT NULL REFERENCES public.courses(id),
  stripe_dispute_id text UNIQUE NOT NULL,
  amount_cents integer NOT NULL,
  reason text,
  status text,
  evidence_due_by timestamptz,
  course_notified_at timestamptz,
  resolved_at timestamptz,
  outcome text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Course payouts mirror from Stripe
CREATE TABLE IF NOT EXISTS public.course_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id),
  stripe_payout_id text UNIQUE NOT NULL,
  amount_cents integer NOT NULL,
  arrival_date date NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_payouts_course
  ON public.course_payouts (course_id, arrival_date DESC);

-- Stripe customer ID on profiles for off-session charges
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS default_payment_method_id text;

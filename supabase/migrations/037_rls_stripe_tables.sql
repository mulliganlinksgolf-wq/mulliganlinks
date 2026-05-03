-- Fix missing RLS on Stripe-related tables created in 017_stripe_payments.sql
-- These tables were left without RLS, making them publicly readable/writable.

-- stripe_webhook_events: internal backend table; only service_role touches it.
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_stripe_webhook_events" ON public.stripe_webhook_events;
CREATE POLICY "service_role_all_stripe_webhook_events"
  ON public.stripe_webhook_events
  TO service_role
  USING (true)
  WITH CHECK (true);

-- payment_disputes: TeeAhead admins can read; service_role handles writes.
ALTER TABLE public.payment_disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_payment_disputes" ON public.payment_disputes;
CREATE POLICY "admin_read_payment_disputes"
  ON public.payment_disputes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "service_role_all_payment_disputes" ON public.payment_disputes;
CREATE POLICY "service_role_all_payment_disputes"
  ON public.payment_disputes
  TO service_role
  USING (true)
  WITH CHECK (true);

-- course_payouts: course admins see their own course; TeeAhead admins see all; service_role handles writes.
ALTER TABLE public.course_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "course_admin_read_own_payouts" ON public.course_payouts;
CREATE POLICY "course_admin_read_own_payouts"
  ON public.course_payouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.course_admins
      WHERE course_admins.user_id = auth.uid()
        AND course_admins.course_id = course_payouts.course_id
    )
  );

DROP POLICY IF EXISTS "admin_read_all_course_payouts" ON public.course_payouts;
CREATE POLICY "admin_read_all_course_payouts"
  ON public.course_payouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "service_role_all_course_payouts" ON public.course_payouts;
CREATE POLICY "service_role_all_course_payouts"
  ON public.course_payouts
  TO service_role
  USING (true)
  WITH CHECK (true);

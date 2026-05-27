-- Add paused_until to memberships so members can pause for 1-2 months.
-- Status stays 'active'; when paused_until > now() the member is considered paused.
-- Stripe will honour this via subscription pause API once checkout is wired.
ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS paused_until TIMESTAMPTZ;

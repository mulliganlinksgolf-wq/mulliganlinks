-- supabase/migrations/027_site_config.sql

CREATE TABLE public.site_config (
  key         text PRIMARY KEY,
  value       text NOT NULL,
  type        text NOT NULL CHECK (type IN ('text', 'boolean', 'number')),
  description text,
  updated_at  timestamptz DEFAULT now()
);

-- Seed initial values
INSERT INTO public.site_config (key, value, type, description) VALUES
  ('launch_mode',                'waitlist', 'text',    'Site mode: waitlist or live'),
  ('metro_area_name',            'Metro Detroit', 'text', 'Metro area shown throughout the site'),
  ('founding_golfer_cap',        '500',  'number',  'Max founding member spots'),
  ('price_eagle_annual',         '89',   'number',  'Eagle tier annual price (display only)'),
  ('price_ace_annual',           '159',  'number',  'Ace tier annual price (display only)'),
  ('price_eagle_monthly_credit', '10',   'number',  'Eagle monthly credit in dollars'),
  ('price_ace_monthly_credit',   '20',   'number',  'Ace monthly credit in dollars'),
  ('fee_fairway_booking',        '1.49', 'number',  'Platform fee per booking for fairway tier'),
  ('fee_paid_booking',           '0',    'number',  'Platform fee per booking for eagle/ace tier'),
  ('flag_golfer_waitlist',       'true', 'boolean', 'Show golfer waitlist signup form'),
  ('flag_course_waitlist',       'true', 'boolean', 'Show course partner application form'),
  ('flag_membership_signups',    'false','boolean', 'Allow new membership signups'),
  ('flag_tee_time_bookings',     'false','boolean', 'Allow tee time bookings');

-- RLS: anyone can read (needed for public feature flag checks); writes go through service-role
-- client (createAdminClient) which bypasses RLS automatically — no write policy needed.
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read site_config"
  ON public.site_config FOR SELECT USING (true);

-- Auto-update updated_at on row modification (consistent with sibling tables)
CREATE TRIGGER site_config_updated_at
  BEFORE UPDATE ON public.site_config
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

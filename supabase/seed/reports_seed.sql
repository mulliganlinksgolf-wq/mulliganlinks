-- supabase/seed/reports_seed.sql
-- Run with: npx supabase db execute --file supabase/seed/reports_seed.sql

DO $$
DECLARE
  pilot_course_id UUID;
BEGIN

SELECT id INTO pilot_course_id FROM courses WHERE slug = 'pilot-course' LIMIT 1;

IF pilot_course_id IS NULL THEN
  RAISE EXCEPTION 'pilot-course not found — run course seed first';
END IF;

-- 6 months of course metrics (Oct 2025 – Mar 2026)
INSERT INTO crm_course_metrics (course_id, month, rounds_booked, green_fee_revenue, avg_green_fee, members_attributed, points_earned, points_redeemed, waitlist_fills, total_cancellations, cancellations_recovered_revenue)
VALUES
  (pilot_course_id, '2025-10', 920,  42800.00, 46.52, 22, 4600, 1100, 28, 45, 1302.56),
  (pilot_course_id, '2025-11', 840,  38200.00, 45.48, 18, 4200, 980,  24, 40, 1091.52),
  (pilot_course_id, '2025-12', 780,  35100.00, 45.00, 15, 3900, 870,  20, 36, 900.00),
  (pilot_course_id, '2026-01', 950,  44650.00, 47.00, 28, 4750, 1200, 32, 50, 1504.00),
  (pilot_course_id, '2026-02', 1080, 51840.00, 48.00, 35, 5400, 1380, 41, 62, 1968.00),
  (pilot_course_id, '2026-03', 1150, 54050.00, 47.00, 38, 5750, 1510, 48, 70, 2256.00)
ON CONFLICT (course_id, month) DO NOTHING;

-- 6 months of platform member metrics
INSERT INTO crm_member_metrics (month, new_members_free, new_members_eagle, new_members_ace, churned_members, lapsed_members, total_active, mrr_eagle, mrr_ace)
VALUES
  ('2025-10', 18, 12, 5,  3, 8,  230, 3204.00,  1590.00),
  ('2025-11', 22, 14, 6,  4, 9,  259, 3737.00,  2226.00),
  ('2025-12', 15, 10, 4,  5, 12, 283, 4271.00,  2385.00),
  ('2026-01', 35, 22, 8,  6, 10, 342, 5609.00,  3180.00),
  ('2026-02', 48, 30, 12, 7, 11, 424, 7699.00,  4770.00),
  ('2026-03', 60, 38, 15, 8, 13, 531, 10013.00, 7155.00)
ON CONFLICT (month) DO NOTHING;

-- 6 months of expenses (realistic early-stage SaaS)
INSERT INTO crm_expenses (category, month, amount, notes, created_by)
VALUES
  ('Engineering',    '2025-10', 8500.00,  'Contractor + tools',       'neil@teeahead.com'),
  ('Sales',          '2025-10', 1200.00,  'Outreach tools, travel',   'neil@teeahead.com'),
  ('Marketing',      '2025-10', 800.00,   'Ads, design assets',       'neil@teeahead.com'),
  ('Operations',     '2025-10', 600.00,   'Misc ops',                 'neil@teeahead.com'),
  ('Infrastructure', '2025-10', 420.00,   'Vercel, Supabase, Resend', 'neil@teeahead.com'),
  ('G&A',            '2025-10', 350.00,   'Legal, accounting',        'neil@teeahead.com'),

  ('Engineering',    '2025-11', 8500.00,  'Contractor + tools',       'neil@teeahead.com'),
  ('Sales',          '2025-11', 1400.00,  'Course visits',            'neil@teeahead.com'),
  ('Marketing',      '2025-11', 900.00,   'Email campaign',           'neil@teeahead.com'),
  ('Operations',     '2025-11', 600.00,   'Misc ops',                 'neil@teeahead.com'),
  ('Infrastructure', '2025-11', 440.00,   'Infra scaling',            'neil@teeahead.com'),
  ('G&A',            '2025-11', 350.00,   'Legal, accounting',        'neil@teeahead.com'),

  ('Engineering',    '2025-12', 9000.00,  'Year-end sprint',          'neil@teeahead.com'),
  ('Sales',          '2025-12', 1500.00,  'Holiday events',           'neil@teeahead.com'),
  ('Marketing',      '2025-12', 1200.00,  'Seasonal push',            'neil@teeahead.com'),
  ('Operations',     '2025-12', 700.00,   'Year-end admin',           'neil@teeahead.com'),
  ('Infrastructure', '2025-12', 440.00,   'Infra',                    'neil@teeahead.com'),
  ('G&A',            '2025-12', 500.00,   'Year-end accounting',      'neil@teeahead.com'),

  ('Engineering',    '2026-01', 9500.00,  'New hire month 1',         'neil@teeahead.com'),
  ('Sales',          '2026-01', 2000.00,  'Pipeline expansion',       'neil@teeahead.com'),
  ('Marketing',      '2026-01', 1500.00,  'New year push',            'neil@teeahead.com'),
  ('Operations',     '2026-01', 800.00,   'Ops',                      'neil@teeahead.com'),
  ('Infrastructure', '2026-01', 480.00,   'Infra',                    'neil@teeahead.com'),
  ('G&A',            '2026-01', 400.00,   'Legal',                    'neil@teeahead.com'),

  ('Engineering',    '2026-02', 10000.00, 'Dev team',                 'neil@teeahead.com'),
  ('Sales',          '2026-02', 2500.00,  'Sales travel',             'neil@teeahead.com'),
  ('Marketing',      '2026-02', 2000.00,  'Valentine promo',          'neil@teeahead.com'),
  ('Operations',     '2026-02', 900.00,   'Ops',                      'neil@teeahead.com'),
  ('Infrastructure', '2026-02', 520.00,   'Infra',                    'neil@teeahead.com'),
  ('G&A',            '2026-02', 400.00,   'Accounting',               'neil@teeahead.com'),

  ('Engineering',    '2026-03', 10500.00, 'Dev team',                 'neil@teeahead.com'),
  ('Sales',          '2026-03', 3000.00,  'Course onboarding',        'neil@teeahead.com'),
  ('Marketing',      '2026-03', 2500.00,  'Spring campaign',          'neil@teeahead.com'),
  ('Operations',     '2026-03', 1000.00,  'Ops',                      'neil@teeahead.com'),
  ('Infrastructure', '2026-03', 560.00,   'Infra',                    'neil@teeahead.com'),
  ('G&A',            '2026-03', 500.00,   'Legal + accounting',       'neil@teeahead.com')
ON CONFLICT (category, month) DO NOTHING;

RAISE NOTICE 'Seed complete: course metrics, member metrics, expenses';
END $$;

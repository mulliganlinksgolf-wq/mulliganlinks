-- Seed content blocks for all admin-managed pages.
-- Uses ON CONFLICT DO NOTHING so existing values (admin edits) are never overwritten.

INSERT INTO content_blocks (key, type, description, value) VALUES

-- ── GolfNow Alternative (/golfnow-alternative) ──────────────────────────
('golfnow.hero_badge',             'text',     'Hero badge text',                   'Coming soon to Metro Detroit'),
('golfnow.hero_headline',          'text',     'Hero main headline (h1)',            'The Best GolfNow Alternative for Golf Courses and Golfers'),
('golfnow.hero_subhead',           'markdown', 'Hero subheadline',                  'TeeAhead is Metro Detroit''s local-first golf platform — free tee sheet software for courses with zero barter tee times, and a loyalty membership for golfers that beats GolfPass+ on every single metric.'),
('golfnow.cost_headline',          'text',     'Section: What GolfNow costs (h2)',   'What GolfNow Actually Costs a Golf Course'),
('golfnow.cost_intro',             'markdown', 'Section: What GolfNow costs (intro)','Most golf course operators know GolfNow is expensive. Few have run the actual math. Here it is.'),
('golfnow.results_headline',       'text',     'Section: Real results (h2)',         'Real Results from Courses That Left GolfNow'),
('golfnow.results_intro',          'markdown', 'Section: Real results (intro)',      'These aren''t projections. These are documented outcomes from golf courses that made the switch away from GolfNow.'),
('golfnow.compare_courses_headline','text',    'Comparison table: courses (h2)',     'GolfNow vs. TeeAhead: For Golf Courses'),
('golfnow.compare_courses_intro',  'markdown', 'Comparison table: courses (intro)',  'A direct comparison of what each platform costs and delivers for course operators.'),
('golfnow.compare_golfers_headline','text',    'Comparison table: golfers (h2)',     'GolfPass+ vs. TeeAhead Eagle: For Golfers'),
('golfnow.compare_golfers_intro',  'markdown', 'Comparison table: golfers (intro)',  'GolfPass+ costs $119/year and delivers perks spread thin across a national network. TeeAhead Eagle costs $89/year and delivers more — at the courses you actually play.'),
('golfnow.body_headline',          'text',     'Body section headline (h2)',         'Why Courses and Golfers in Metro Detroit Are Looking for a GolfNow Alternative'),
('golfnow.body_p1',                'markdown', 'Body paragraph 1',                  'The search for a GolfNow alternative is accelerating in 2025 and 2026. Courses in Oakland County, Macomb County, and Wayne County are re-evaluating their dependency on GolfNow''s tee sheet software — and for good reason. The barter model that seemed like free distribution in 2010 now looks very different when you run the numbers against today''s green fee rates.'),
('golfnow.body_p2',                'markdown', 'Body paragraph 2',                  'TeeAhead is built specifically for this moment. It''s free tee sheet software for golf courses that want to cancel GolfNow, take back their direct booking channel, and stop subsidizing a platform that treats their prime-time inventory as a commodity. Unlike GolfNow, TeeAhead doesn''t take barter tee times, doesn''t charge commissions, and doesn''t retain your customer data.'),
('golfnow.body_p3',                'markdown', 'Body paragraph 3',                  'For golfers, TeeAhead is the local-first GolfNow alternative. Book tee times at Metro Detroit golf courses with zero booking fees — not "waived for members 12 times a year," but zero, always. Earn Fairway Points on every dollar you spend at partner courses. Upgrade to Eagle membership ($89/yr) or Ace membership ($159/yr) for bonus points, complimentary rounds, and priority booking that actually applies to the courses in Oakland County, Macomb County, and Wayne County where you already play.'),
('golfnow.body_p4',                'markdown', 'Body paragraph 4',                  'TeeAhead is not trying to be a national golf booking aggregator. It''s a local platform for local golfers and local courses. That''s the point. GolfNow turns your home course into a commodity. TeeAhead turns it back into your home.'),
('golfnow.cta_courses_headline',   'text',     'Dual CTA: courses headline',         'Ready to cancel GolfNow?'),
('golfnow.cta_courses_body',       'markdown', 'Dual CTA: courses body',             'The first 10 Founding Partner courses in Metro Detroit get TeeAhead free for their first year. No barter. No commissions. No data extraction.'),
('golfnow.cta_golfers_headline',   'text',     'Dual CTA: golfers headline',         'Done paying booking fees?'),
('golfnow.cta_golfers_body',       'markdown', 'Dual CTA: golfers body',             'Join the waitlist for free. Eagle membership is $89/yr — $30 less than GolfPass+, with more perks and loyalty at the courses you actually play.'),

-- ── Barter Calculator (/barter) ─────────────────────────────────────────
('barter.hero_badge',              'text',     'Hero badge text',                   'For Golf Course Operators'),
('barter.hero_headline',           'text',     'Hero headline (h1)',                 'See exactly what GolfNow has cost you. In dollars.'),
('barter.hero_subhead',            'markdown', 'Hero subheadline',                  'Drop in your numbers. We''ll calculate the exact revenue GolfNow''s barter model has extracted from your course — this year alone. No login. No email required.'),
('barter.stats_headline',          'text',     'Stats section headline (h2)',        'This is not a hypothetical.'),
('barter.stats_intro',             'text',     'Stats section intro',               'The math above isn''t projection — it''s documented industry data.'),
('barter.cta_headline',            'text',     'CTA section headline (h2)',          'Ready to stop paying GolfNow to take your tee times?'),
('barter.cta_body',                'markdown', 'CTA section body',                  'TeeAhead is free for Founding Partner courses — your first year on us. No barter. No commissions. The only ask: tell your golfers about TeeAhead at booking.'),

-- ── Software Cost Calculator (/software-cost) ────────────────────────────
('software_cost.hero_badge',       'text',     'Hero badge text',                   'For Golf Course Operators'),
('software_cost.hero_headline',    'text',     'Hero headline (h1)',                 'Your software vendor isn''t free. See exactly what they''re costing you.'),
('software_cost.hero_subhead',     'markdown', 'Hero subheadline',                  'GolfNow isn''t the only one extracting from your course. foreUP, Lightspeed, Club Caddie, and Club Prophet all charge real money — and quietly route your golfer data through marketplaces like Barstool Golf Time and Golf Digest. Pick your current setup. We''ll calculate the real cost.'),

-- ── Pricing / Tiers (/pricing) ──────────────────────────────────────────
('pricing.hero_headline',          'text',     'Page headline (h1)',                 'Simple, transparent pricing.'),
('pricing.hero_subhead',           'markdown', 'Page subheadline',                  'No barter. No commissions. No hidden fees. Founding Partners get their first year free.'),
('pricing.course_section_headline','text',     'Course pricing section headline',    'For Golf Courses'),
('pricing.golfer_section_headline','text',     'Golfer pricing section headline',    'For Golfers'),
('pricing.founding_note',          'markdown', 'Founding partner note',             'The first 10 Founding Partner courses get TeeAhead free for their first year. Standard pricing is $349/month after that — still 95% cheaper than a typical GolfNow barter contract.'),

-- ── Golfer Waitlist (/waitlist/golfer) ───────────────────────────────────
('waitlist.hero_badge',            'text',     'Hero badge text',                   'Metro Detroit Launch'),
('waitlist.hero_headline',         'text',     'Hero headline (h1)',                 'Golf at your home course, done right.'),
('waitlist.hero_subhead',          'markdown', 'Hero subheadline',                  'TeeAhead is the local alternative to GolfPass+. Zero booking fees. Real loyalty at the courses you actually play. Eagle membership is $89/yr — $40 less than GolfPass+ with more credits and no expiration.'),
('waitlist.tier_headline',         'text',     'Tier picker section headline',       'Pick your membership tier.'),

-- ── Course Waitlist (/waitlist/course) ───────────────────────────────────
('waitlist_course.hero_badge',     'text',     'Hero badge text',                   'Metro Detroit Launch'),
('waitlist_course.hero_headline',  'text',     'Hero headline (h1)',                 'Stop giving GolfNow your tee times.'),
('waitlist_course.hero_subhead',   'markdown', 'Hero subheadline',                  'TeeAhead gives courses a complete booking and loyalty platform — free for your first year. No barter. No commissions. No data extraction.'),
('waitlist_course.founding_spots_label', 'text','Founding spots count label',       'Founding Partner spots'),

-- ── Nav & Footer (site-wide) ─────────────────────────────────────────────
('nav.contact_email',              'text',     'Primary contact email',             'neil@teeahead.com'),
('nav.footer_tagline',             'text',     'Footer tagline',                    'The local-first golf platform for Metro Detroit.'),
('nav.footer_copyright',           'text',     'Footer copyright line',             '© 2026 TeeAhead, LLC.'),

-- ── Contact Page (/contact) ─────────────────────────────────────────────
('contact.hero_headline',          'text',     'Hero headline (h1)',                 'Your tee sheet. Your customers. Your revenue.'),
('contact.hero_subhead',           'markdown', 'Hero subheadline',                  'TeeAhead gives your course a complete management platform at zero cost. No barter tee times. No commissions. No data extraction. The software works for you — not against you.'),
('contact.email',                  'text',     'Contact email address',             'neil@teeahead.com'),
('contact.hero_badge',             'text',     'Hero badge text',                   'Free for courses — always'),

-- ── Legal (/privacy-policy, /terms) ─────────────────────────────────────
('legal.last_updated',             'text',     'Privacy policy "last updated" date', 'April 2026'),
('legal.terms_last_updated',       'text',     'Terms of service "last updated" date','April 2026'),
('legal.contact_email',            'text',     'Legal contact email',               'privacy@teeahead.com')

ON CONFLICT (key) DO NOTHING;

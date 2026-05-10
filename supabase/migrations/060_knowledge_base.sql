CREATE TABLE kb_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE kb_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES kb_categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  excerpt text,
  is_published boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  helpful_yes int NOT NULL DEFAULT 0,
  helpful_no int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- update_updated_at_column already exists from migration 031; use CREATE OR REPLACE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER kb_articles_updated_at
  BEFORE UPDATE ON kb_articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
-- Help center is course-staff-only. The course portal layout enforces auth via redirect.
-- anon users intentionally get no rows.
ALTER TABLE kb_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read kb_categories" ON kb_categories
  FOR SELECT TO authenticated USING (true);

ALTER TABLE kb_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read published kb_articles" ON kb_articles
  FOR SELECT TO authenticated USING (is_published = true);

-- Helpful vote RPC (SECURITY DEFINER bypasses RLS for the UPDATE)
CREATE OR REPLACE FUNCTION vote_kb_article(p_article_id uuid, p_vote text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF p_vote = 'yes' THEN
    UPDATE kb_articles SET helpful_yes = helpful_yes + 1
    WHERE id = p_article_id AND is_published = true;
  ELSIF p_vote = 'no' THEN
    UPDATE kb_articles SET helpful_no = helpful_no + 1
    WHERE id = p_article_id AND is_published = true;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.vote_kb_article(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vote_kb_article(uuid, text) TO authenticated;

-- Seed categories
INSERT INTO kb_categories (title, slug, description, icon, sort_order) VALUES
  ('Getting Started',        'getting-started',  'Everything you need to hit the ground running with TeeAhead.',           'Rocket',     1),
  ('Managing Your Tee Sheet','tee-sheet',        'How to set up, edit, and optimize your tee times.',                      'Calendar',   2),
  ('Members & Bookings',     'members-bookings', 'Understanding member tiers, bookings, check-in, and cancellations.',     'Users',      3),
  ('Payments & Billing',     'payments-billing', 'Processing payments, resolving disputes, and reading your statements.',  'CreditCard', 4);

-- Seed starter articles
WITH cat_gs AS (SELECT id FROM kb_categories WHERE slug = 'getting-started'),
     cat_ts AS (SELECT id FROM kb_categories WHERE slug = 'tee-sheet')
INSERT INTO kb_articles (category_id, title, slug, content, excerpt, is_published, sort_order) VALUES
(
  (SELECT id FROM cat_gs),
  'Setting Up Your Course Profile',
  'setting-up-your-course-profile',
  E'## Overview\n\nYour course profile is the first thing TeeAhead members see when browsing available tee times. A complete profile drives more bookings and builds trust with golfers who may not have visited before.\n\n## What to Fill In\n\n- **Course name and address** — used for maps and location search.\n- **Course description** — 2–3 sentences about what makes your course unique (views, challenge level, pace of play).\n- **Photos** — upload at least one hero image. Courses with photos convert 3× better.\n- **Amenities** — driving range, pro shop, cart rental, restaurant. Golfers filter on these.\n\n## Connecting Your Tee Sheet\n\nOnce your profile is live, go to **Settings → Tee Sheet** to configure your available time slots, pricing per tier, and blackout dates.\n\n## Next Steps\n\nAfter your profile is complete, publish at least 14 days of tee times so members have enough runway to plan a round. See [Managing Your Tee Sheet](#) for a step-by-step walkthrough.',
  'A complete profile drives more bookings. Learn what to fill in and how to connect your tee sheet.',
  true,
  1
),
(
  (SELECT id FROM cat_ts),
  'Creating and Publishing Tee Times',
  'creating-and-publishing-tee-times',
  E'## How Tee Times Work\n\nTeeAhead members can only book tee times you explicitly publish. Each published slot specifies a scheduled date/time, number of available spots, and pricing per membership tier.\n\n## Creating a Single Tee Time\n\n1. Go to **Tee Times** in your course portal.\n2. Click **New Tee Time**.\n3. Set the date, start time, and number of spots (1–4).\n4. Set per-tier pricing — Eagle and Ace members often receive a discounted rate per your agreement.\n5. Click **Publish**.\n\n## Bulk Creation\n\nFor recurring morning slots, use the bulk creator:\n\n- Select a date range and days of the week.\n- Set the first tee time and interval (e.g. every 10 minutes from 7:00 AM).\n- All slots publish immediately.\n\n## Editing or Canceling\n\n- You can edit pricing or spot count at any time before the first booking is confirmed.\n- To cancel a tee time that already has bookings, use **Cancel Tee Time** — members are notified automatically and receive a rain check credit.\n\n## Best Practices\n\n- Publish at least 14 days out so members can plan ahead.\n- Avoid gaps longer than 30 minutes during peak hours — golfers bounce to another course if they can''t find a slot.\n- Use blackout dates for member tournaments or course maintenance.',
  'Step-by-step guide to creating single and bulk tee times, setting tier pricing, and handling cancellations.',
  true,
  1
);

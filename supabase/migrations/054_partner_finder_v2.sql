-- 1. New columns on partner_preferences
ALTER TABLE partner_preferences
  ADD COLUMN IF NOT EXISTS play_style text
    CHECK (play_style IN ('casual', 'moderate', 'competitive')) DEFAULT 'casual',
  ADD COLUMN IF NOT EXISTS gender text
    CHECK (gender IN ('male', 'female', 'non_binary', 'prefer_not_to_say')) DEFAULT 'prefer_not_to_say',
  ADD COLUMN IF NOT EXISTS open_to text
    CHECK (open_to IN ('anyone', 'same_gender_only', 'men_only', 'women_only')) DEFAULT 'anyone';

-- 2. Avatar on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- 3. Ratings table
CREATE TABLE IF NOT EXISTS partner_ratings (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  rater_id              uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ratee_id              uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  connection_request_id uuid NOT NULL REFERENCES partner_connection_requests(id) ON DELETE CASCADE,
  stars                 integer NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment               text CHECK (char_length(comment) <= 280),
  created_at            timestamptz DEFAULT now(),
  UNIQUE (rater_id, connection_request_id)
);

ALTER TABLE partner_ratings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read ratings
CREATE POLICY "pr_select" ON partner_ratings
  FOR SELECT TO authenticated USING (true);

-- Can only rate once per connection, only if you were part of it,
-- only after the round date has passed
CREATE POLICY "pr_insert" ON partner_ratings
  FOR INSERT WITH CHECK (
    rater_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM partner_connection_requests pcr
      JOIN partner_availability pa ON pa.id = pcr.availability_id
      WHERE pcr.id = connection_request_id
        AND pcr.status = 'accepted'
        AND pa.available_date < CURRENT_DATE
        AND (pcr.requester_id = auth.uid() OR pcr.recipient_id = auth.uid())
    )
  );

-- 4. Supabase Storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS on storage: anyone can read; owners can upload/delete their own files
CREATE POLICY "avatars_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- supabase/migrations/052_partner_finder.sql

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE partner_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  handicap_index numeric(4,1),
  pace_preference text CHECK (pace_preference IN ('relaxed', 'moderate', 'fast')),
  prefers_walking boolean DEFAULT false,
  drinks_ok boolean DEFAULT true,
  smoking_ok boolean DEFAULT false,
  preferred_holes text CHECK (preferred_holes IN ('9', '18', 'either')) DEFAULT 'either',
  skill_level text CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'any')) DEFAULT 'any',
  bio text,
  is_visible boolean DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(profile_id)
);

CREATE TABLE partner_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  available_date date NOT NULL,
  time_preference text CHECK (time_preference IN ('morning', 'afternoon', 'evening', 'flexible')) DEFAULT 'flexible',
  course_id uuid REFERENCES courses(id),
  holes text CHECK (holes IN ('9', '18', 'either')) DEFAULT 'either',
  notes text,
  is_active boolean DEFAULT true,
  expires_at timestamptz GENERATED ALWAYS AS (timezone('UTC', (available_date + interval '1 day')::timestamp)) STORED,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT available_date_not_past CHECK (available_date >= CURRENT_DATE)
);

CREATE INDEX ON partner_availability(available_date) WHERE is_active = true;
CREATE INDEX ON partner_availability(profile_id);

CREATE TABLE partner_connection_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  availability_id uuid REFERENCES partner_availability(id) ON DELETE SET NULL,
  message text,
  status text CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT no_self_request CHECK (requester_id != recipient_id),
  CONSTRAINT one_active_request UNIQUE (requester_id, recipient_id, availability_id)
);

-- Prevent duplicate general requests (when availability_id IS NULL)
CREATE UNIQUE INDEX one_general_request
  ON partner_connection_requests (requester_id, recipient_id)
  WHERE availability_id IS NULL;

CREATE INDEX ON partner_connection_requests(recipient_id);
CREATE INDEX ON partner_connection_requests(requester_id);
CREATE INDEX ON partner_connection_requests(availability_id) WHERE availability_id IS NOT NULL;

CREATE TABLE partner_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- ============================================================
-- HELPER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION is_blocked(user_a uuid, user_b uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM partner_blocks
    WHERE (blocker_id = user_a AND blocked_id = user_b)
       OR (blocker_id = user_b AND blocked_id = user_a)
  );
$$ LANGUAGE sql STABLE SET search_path = public, pg_temp;

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE partner_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_blocks ENABLE ROW LEVEL SECURITY;

-- partner_preferences
CREATE POLICY "pp_select" ON partner_preferences
  FOR SELECT USING (is_visible = true OR profile_id = auth.uid());
CREATE POLICY "pp_insert" ON partner_preferences
  FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "pp_update" ON partner_preferences
  FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "pp_delete" ON partner_preferences
  FOR DELETE USING (profile_id = auth.uid());

-- partner_availability
CREATE POLICY "pa_select" ON partner_availability
  FOR SELECT USING (
    profile_id = auth.uid()
    OR (
      is_active = true
      AND available_date >= CURRENT_DATE
      AND NOT EXISTS (
        SELECT 1 FROM partner_blocks
        WHERE (blocker_id = profile_id AND blocked_id = auth.uid())
           OR (blocker_id = auth.uid() AND blocked_id = profile_id)
      )
    )
  );
CREATE POLICY "pa_insert" ON partner_availability
  FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "pa_update" ON partner_availability
  FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "pa_delete" ON partner_availability
  FOR DELETE USING (profile_id = auth.uid());

-- partner_connection_requests
CREATE POLICY "pcr_select" ON partner_connection_requests
  FOR SELECT USING (requester_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "pcr_insert" ON partner_connection_requests
  FOR INSERT WITH CHECK (requester_id = auth.uid());
CREATE POLICY "pcr_update_recipient" ON partner_connection_requests
  FOR UPDATE USING (recipient_id = auth.uid())
  WITH CHECK (status IN ('accepted', 'declined'));
CREATE POLICY "pcr_update_requester" ON partner_connection_requests
  FOR UPDATE USING (requester_id = auth.uid())
  WITH CHECK (status = 'withdrawn');

-- partner_blocks
CREATE POLICY "pb_select" ON partner_blocks
  FOR SELECT USING (blocker_id = auth.uid());
CREATE POLICY "pb_insert" ON partner_blocks
  FOR INSERT WITH CHECK (blocker_id = auth.uid());
CREATE POLICY "pb_delete" ON partner_blocks
  FOR DELETE USING (blocker_id = auth.uid());

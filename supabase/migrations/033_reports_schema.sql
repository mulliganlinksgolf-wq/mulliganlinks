-- supabase/migrations/033_reports_schema.sql

-- Course partner user accounts (passwords managed by Supabase Auth)
CREATE TABLE IF NOT EXISTS crm_course_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'owner',
  setup_token VARCHAR(255),
  setup_token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_crm_course_users_user_id ON crm_course_users(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_course_users_course_id ON crm_course_users(course_id);
CREATE INDEX IF NOT EXISTS idx_crm_course_users_token
  ON crm_course_users(setup_token) WHERE setup_token IS NOT NULL;

-- Monthly course-level metrics (populated by booking data or manual seed)
CREATE TABLE IF NOT EXISTS crm_course_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL,
  rounds_booked INTEGER DEFAULT 0,
  green_fee_revenue DECIMAL(10,2) DEFAULT 0,
  avg_green_fee DECIMAL(10,2) DEFAULT 0,
  members_attributed INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  points_redeemed INTEGER DEFAULT 0,
  waitlist_fills INTEGER DEFAULT 0,
  total_cancellations INTEGER DEFAULT 0,
  cancellations_recovered_revenue DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, month)
);

-- Monthly platform-wide member metrics
CREATE TABLE IF NOT EXISTS crm_member_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month VARCHAR(7) NOT NULL UNIQUE,
  new_members_free INTEGER DEFAULT 0,
  new_members_eagle INTEGER DEFAULT 0,
  new_members_ace INTEGER DEFAULT 0,
  churned_members INTEGER DEFAULT 0,
  lapsed_members INTEGER DEFAULT 0,
  total_active INTEGER DEFAULT 0,
  mrr_eagle DECIMAL(10,2) DEFAULT 0,
  mrr_ace DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Manual expense entries (admin input via P&L page)
CREATE TABLE IF NOT EXISTS crm_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  month VARCHAR(7) NOT NULL,
  notes TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, month)
);

-- RLS: all queries from app use admin client (service role), which bypasses RLS
ALTER TABLE crm_course_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_course_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_member_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_crm_course_users" ON crm_course_users TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_crm_course_metrics" ON crm_course_metrics TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_crm_member_metrics" ON crm_member_metrics TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_crm_expenses" ON crm_expenses TO service_role USING (true) WITH CHECK (true);

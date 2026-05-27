-- Migration 022: Course onboarding columns and supporting tables
-- Adds onboarding fields to courses table and creates tee sheet config,
-- hours, pricing, and staff tables.

-- ============================================================
-- 1. ALTER courses table
-- ============================================================

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS invite_token        TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS invite_used         BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS legal_entity_name   TEXT,
  ADD COLUMN IF NOT EXISTS gm_name             TEXT,
  ADD COLUMN IF NOT EXISTS billing_email       TEXT,
  ADD COLUMN IF NOT EXISTS tax_id              TEXT,
  ADD COLUMN IF NOT EXISTS holes               INTEGER DEFAULT 18,
  ADD COLUMN IF NOT EXISTS description         TEXT,
  ADD COLUMN IF NOT EXISTS amenities           TEXT[],
  ADD COLUMN IF NOT EXISTS onboarding_step     INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_live             BOOLEAN DEFAULT FALSE;

-- ============================================================
-- 2. CREATE new tables
-- ============================================================

CREATE TABLE IF NOT EXISTS public.course_tee_sheet_config (
  id                           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id                    UUID        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  interval_minutes             INTEGER     NOT NULL DEFAULT 8,
  max_players                  INTEGER     NOT NULL DEFAULT 4,
  advance_booking_days         INTEGER     NOT NULL DEFAULT 7,
  cart_policy                  TEXT        NOT NULL DEFAULT 'optional'
                                 CHECK (cart_policy IN ('mandatory', 'optional', 'walking_only')),
  cancellation_window_minutes  INTEGER     NOT NULL DEFAULT 120,
  rain_check_policy            TEXT        NOT NULL DEFAULT 'full_credit'
                                 CHECK (rain_check_policy IN ('full_credit', 'half_credit', 'none')),
  created_at                   TIMESTAMPTZ DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id)
);

CREATE TABLE IF NOT EXISTS public.course_hours (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    UUID    NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  day_of_week  INTEGER NOT NULL,  -- 0=Monday, 6=Sunday
  is_open      BOOLEAN NOT NULL DEFAULT TRUE,
  open_time    TIME    NOT NULL DEFAULT '07:00',
  close_time   TIME    NOT NULL DEFAULT '18:00',
  UNIQUE(course_id, day_of_week)
);

CREATE TABLE IF NOT EXISTS public.course_pricing (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       UUID    NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  rate_name       TEXT    NOT NULL,
  green_fee_cents INTEGER NOT NULL,
  cart_fee_cents  INTEGER NOT NULL DEFAULT 0,
  display_order   INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.course_staff (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id  UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'staff'
               CHECK (role IN ('admin', 'manager', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, email)
);

-- ============================================================
-- 3. Row Level Security
-- ============================================================

ALTER TABLE public.course_tee_sheet_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_hours            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_pricing          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_staff            ENABLE ROW LEVEL SECURITY;

-- Public select policies (anyone can view)
CREATE POLICY "public_select_course_tee_sheet_config"
  ON public.course_tee_sheet_config
  FOR SELECT
  USING (true);

CREATE POLICY "public_select_course_hours"
  ON public.course_hours
  FOR SELECT
  USING (true);

CREATE POLICY "public_select_course_pricing"
  ON public.course_pricing
  FOR SELECT
  USING (true);

CREATE POLICY "public_select_course_staff"
  ON public.course_staff
  FOR SELECT
  USING (true);

-- ============================================================
-- 4. updated_at trigger for course_tee_sheet_config
-- ============================================================

CREATE TRIGGER handle_updated_at_course_tee_sheet_config
  BEFORE UPDATE ON public.course_tee_sheet_config
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

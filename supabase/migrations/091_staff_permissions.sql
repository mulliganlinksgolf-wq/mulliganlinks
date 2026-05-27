-- ============================================================
-- Sprint 3 (Phase A): Granular staff permissions
-- ============================================================
-- Foundation only: DB schema + lookup function + RLS.
-- No application-code behavior changes ship with this migration.
-- See docs/sprints/sprint-3-staff-permissions-revised.md for context.

-- 1. Permission key enum
CREATE TYPE course_permission AS ENUM (
  'view_tee_sheet',
  'manage_bookings',
  'check_in_golfers',
  'view_payments',
  'void_transaction',
  'override_price',
  'comp_round',
  'modify_member_tier',
  'delete_booking',
  'view_reports',
  'export_data',
  'manage_staff',
  'manage_course_settings',
  'manage_outings'
);

-- 2. Per-staff permission overrides
CREATE TABLE public.staff_permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id)     ON DELETE CASCADE,
  permission  course_permission NOT NULL,
  granted     BOOLEAN NOT NULL DEFAULT TRUE,
  granted_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id, user_id, permission)
);

CREATE INDEX idx_staff_permissions_course_user
  ON public.staff_permissions (course_id, user_id);

CREATE OR REPLACE FUNCTION public.staff_permissions_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_staff_permissions_updated_at
  BEFORE UPDATE ON public.staff_permissions
  FOR EACH ROW EXECUTE FUNCTION public.staff_permissions_touch_updated_at();

-- 3. Role-default mapping (single source of truth)
CREATE TABLE public.role_default_permissions (
  role        TEXT NOT NULL,
  permission  course_permission NOT NULL,
  PRIMARY KEY (role, permission)
);

INSERT INTO public.role_default_permissions (role, permission) VALUES
  -- owner: all 14
  ('owner', 'view_tee_sheet'),
  ('owner', 'manage_bookings'),
  ('owner', 'check_in_golfers'),
  ('owner', 'view_payments'),
  ('owner', 'void_transaction'),
  ('owner', 'override_price'),
  ('owner', 'comp_round'),
  ('owner', 'modify_member_tier'),
  ('owner', 'delete_booking'),
  ('owner', 'view_reports'),
  ('owner', 'export_data'),
  ('owner', 'manage_staff'),
  ('owner', 'manage_course_settings'),
  ('owner', 'manage_outings'),
  -- manager: 12 (no manage_staff, no manage_course_settings)
  ('manager', 'view_tee_sheet'),
  ('manager', 'manage_bookings'),
  ('manager', 'check_in_golfers'),
  ('manager', 'view_payments'),
  ('manager', 'void_transaction'),
  ('manager', 'override_price'),
  ('manager', 'comp_round'),
  ('manager', 'modify_member_tier'),
  ('manager', 'delete_booking'),
  ('manager', 'view_reports'),
  ('manager', 'export_data'),
  ('manager', 'manage_outings'),
  -- staff: 3
  ('staff', 'view_tee_sheet'),
  ('staff', 'manage_bookings'),
  ('staff', 'check_in_golfers');

-- 4. Authoritative permission check.
--    Honors: profiles.is_admin bypass -> course_admins -> crm_course_users -> overrides
CREATE OR REPLACE FUNCTION public.user_has_course_permission(
  p_user_id    UUID,
  p_course_id  UUID,
  p_permission course_permission
) RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin  BOOLEAN;
  v_role      TEXT;
  v_override  BOOLEAN;
BEGIN
  -- 1) Global-admin bypass: full access, ignore overrides
  SELECT COALESCE(is_admin, FALSE) INTO v_is_admin
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_is_admin THEN
    RETURN TRUE;
  END IF;

  -- 2) Resolve role: course_admins wins, then crm_course_users
  SELECT role INTO v_role
  FROM public.course_admins
  WHERE user_id = p_user_id AND course_id = p_course_id
  LIMIT 1;

  IF v_role IS NULL THEN
    SELECT role INTO v_role
    FROM public.crm_course_users
    WHERE user_id = p_user_id AND course_id = p_course_id
    LIMIT 1;
  END IF;

  IF v_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 3) Explicit override beats role default in either direction
  SELECT granted INTO v_override
  FROM public.staff_permissions
  WHERE user_id = p_user_id
    AND course_id = p_course_id
    AND permission = p_permission;

  IF FOUND THEN
    RETURN v_override;
  END IF;

  -- 4) Fall back to role default (handles unknown role values -> FALSE)
  RETURN EXISTS (
    SELECT 1
    FROM public.role_default_permissions
    WHERE role = v_role
      AND permission = p_permission
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 5. RLS on staff_permissions
ALTER TABLE public.staff_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "manage_staff can read overrides"
  ON public.staff_permissions FOR SELECT
  USING (
    public.user_has_course_permission(auth.uid(), course_id, 'manage_staff')
  );

CREATE POLICY "manage_staff can write overrides"
  ON public.staff_permissions FOR ALL
  USING (
    public.user_has_course_permission(auth.uid(), course_id, 'manage_staff')
  )
  WITH CHECK (
    public.user_has_course_permission(auth.uid(), course_id, 'manage_staff')
  );

-- 6. role_default_permissions: readable by anyone (it's effectively config),
--    write-restricted to service role only (migrations).
ALTER TABLE public.role_default_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read role defaults"
  ON public.role_default_permissions FOR SELECT
  USING (true);

-- (No write policy -> only service_role can write.)

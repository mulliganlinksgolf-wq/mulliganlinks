-- Link crm_members to auth users so we can sync automatically
ALTER TABLE public.crm_members
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.crm_members
  DROP CONSTRAINT IF EXISTS crm_members_profile_id_key;
ALTER TABLE public.crm_members
  ADD CONSTRAINT crm_members_profile_id_key UNIQUE (profile_id);

-- ── Trigger 1: new profile → new CRM member ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_crm_member_on_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.crm_members (profile_id, name, email, join_date, membership_tier, status)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.full_name), ''), SPLIT_PART(NEW.email, '@', 1), 'Unknown'),
    NEW.email,
    NEW.created_at::date,
    'free',
    'active'
  )
  ON CONFLICT (profile_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_sync_on_profile ON public.profiles;
CREATE TRIGGER trg_crm_sync_on_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_crm_member_on_profile();

-- ── Trigger 2: membership change → sync tier + status ────────────────────────
CREATE OR REPLACE FUNCTION public.sync_crm_member_on_membership()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tier crm_member_tier;
  v_status crm_member_status;
BEGIN
  -- Map membership tier to CRM tier
  v_tier := CASE NEW.tier
    WHEN 'eagle' THEN 'eagle'::crm_member_tier
    WHEN 'ace'   THEN 'ace'::crm_member_tier
    ELSE               'free'::crm_member_tier
  END;

  -- Map membership status to CRM status
  v_status := CASE NEW.status
    WHEN 'active'   THEN 'active'::crm_member_status
    WHEN 'past_due' THEN 'active'::crm_member_status
    WHEN 'canceled' THEN 'churned'::crm_member_status
    ELSE                 'lapsed'::crm_member_status
  END;

  UPDATE public.crm_members
  SET membership_tier = v_tier,
      status          = v_status,
      updated_at      = NOW()
  WHERE profile_id = NEW.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_sync_on_membership ON public.memberships;
CREATE TRIGGER trg_crm_sync_on_membership
  AFTER INSERT OR UPDATE OF tier, status ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.sync_crm_member_on_membership();

-- ── Backfill: existing profiles that have no CRM record yet ──────────────────
INSERT INTO public.crm_members (profile_id, name, email, join_date, membership_tier, status)
SELECT
  p.id,
  COALESCE(NULLIF(TRIM(p.full_name), ''), SPLIT_PART(p.email, '@', 1), 'Unknown'),
  p.email,
  p.created_at::date,
  COALESCE(
    CASE m.tier
      WHEN 'eagle' THEN 'eagle'::crm_member_tier
      WHEN 'ace'   THEN 'ace'::crm_member_tier
      ELSE              'free'::crm_member_tier
    END,
    'free'::crm_member_tier
  ),
  COALESCE(
    CASE m.status
      WHEN 'active'   THEN 'active'::crm_member_status
      WHEN 'past_due' THEN 'active'::crm_member_status
      WHEN 'canceled' THEN 'churned'::crm_member_status
      ELSE                 'lapsed'::crm_member_status
    END,
    'active'::crm_member_status
  )
FROM public.profiles p
LEFT JOIN public.memberships m ON m.user_id = p.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.crm_members c WHERE c.profile_id = p.id
)
ON CONFLICT (profile_id) DO NOTHING;

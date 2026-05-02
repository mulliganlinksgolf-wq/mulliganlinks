-- Recreate profiles_with_email to add last_sign_in_at, invited_at, email_confirmed_at.
-- profiles table has its own email column so we must list columns explicitly
-- to avoid "column specified more than once" — u.email is canonical.

DROP VIEW IF EXISTS public.profiles_with_email;

CREATE VIEW public.profiles_with_email AS
SELECT
  p.id,
  p.full_name,
  p.phone,
  p.home_course_id,
  p.created_at,
  p.updated_at,
  u.email,
  u.last_sign_in_at,
  u.invited_at,
  u.email_confirmed_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id;

GRANT SELECT ON public.profiles_with_email TO service_role;

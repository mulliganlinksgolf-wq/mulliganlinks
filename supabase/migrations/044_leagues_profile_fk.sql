-- 043_leagues_profile_fk.sql
-- Fix PostgREST join: league_members.user_id needs a direct FK to public.profiles(id)
-- so that .select('profiles(full_name)') resolves correctly.
-- auth.users(id) == profiles(id) (same PK value), so this is semantically equivalent
-- but PostgREST only traverses FK paths within the public schema.

ALTER TABLE public.league_members
  DROP CONSTRAINT league_members_user_id_fkey;

ALTER TABLE public.league_members
  ADD CONSTRAINT league_members_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

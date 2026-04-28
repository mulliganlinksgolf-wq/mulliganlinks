-- supabase/migrations/030_memberships_cancel_col.sql

ALTER TABLE public.memberships
  ADD COLUMN cancel_at_period_end boolean NOT NULL DEFAULT false;

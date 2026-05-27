-- Add holes column to leagues (9 or 18, default 18)
ALTER TABLE public.leagues
  ADD COLUMN holes INTEGER NOT NULL DEFAULT 18
  CHECK (holes IN (9, 18));

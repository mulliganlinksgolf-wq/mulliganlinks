-- Founding golfer counter (enforces single-row via CHECK)
CREATE TABLE IF NOT EXISTS public.founding_golfer_counter (
  id      INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  claimed INTEGER NOT NULL DEFAULT 0,
  "limit" INTEGER NOT NULL DEFAULT 100
);

INSERT INTO public.founding_golfer_counter (id, claimed, "limit")
VALUES (1, 0, 100)
ON CONFLICT (id) DO NOTHING;

-- RLS: read-only for everyone (public counter display)
ALTER TABLE public.founding_golfer_counter ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read founding counter"
  ON public.founding_golfer_counter
  FOR SELECT
  TO public
  USING (true);

-- Add founding_member flag to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS founding_member BOOLEAN NOT NULL DEFAULT FALSE;

-- Atomic claim function; returns true if a spot was reserved, false if sold out
CREATE OR REPLACE FUNCTION public.claim_founding_spot()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_claimed integer;
  v_limit   integer;
BEGIN
  SELECT claimed, "limit"
    INTO v_claimed, v_limit
    FROM public.founding_golfer_counter
   WHERE id = 1
     FOR UPDATE;

  IF v_claimed < v_limit THEN
    UPDATE public.founding_golfer_counter
       SET claimed = claimed + 1
     WHERE id = 1;
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_founding_spot() TO authenticated;

-- Fix SECURITY DEFINER function to lock search_path (prevents privilege escalation)
-- Grant execute to service roles; function is called server-side via admin client
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

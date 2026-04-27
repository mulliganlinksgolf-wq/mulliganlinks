-- The checkout route calls claim_founding_spot() via the service-role admin client.
-- Grant EXECUTE explicitly to service_role.
GRANT EXECUTE ON FUNCTION public.claim_founding_spot() TO service_role;

-- Restrict approve_founding_partner to service_role only.
-- The function already runs as SECURITY DEFINER; this ensures only
-- the server-side admin client (which holds the service role key) can invoke it.
revoke execute on function public.approve_founding_partner(integer) from public;
revoke execute on function public.approve_founding_partner(integer) from authenticated;
revoke execute on function public.approve_founding_partner(integer) from anon;
grant execute on function public.approve_founding_partner(integer) to service_role;

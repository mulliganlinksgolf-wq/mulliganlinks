-- Apply after the matching application deployment is READY.
-- The additive migrations can be installed before deploying without breaking old clients.
DROP POLICY IF EXISTS "Authenticated users can read tee time occupancy" ON public.bookings;
REVOKE SELECT ON public.tee_time_occupancy FROM anon, authenticated;
DROP POLICY IF EXISTS "Users can insert own bookings" ON public.bookings;
CREATE TRIGGER protect_member_booking_update BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.protect_member_booking_update();

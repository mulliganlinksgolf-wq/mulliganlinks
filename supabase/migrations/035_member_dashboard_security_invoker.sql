-- Fix SECURITY DEFINER on member_dashboard view.
-- Without security_invoker, the view runs as the postgres superuser and bypasses
-- RLS on profiles, memberships, fairway_points, and bookings — exposing all users' data.
-- With security_invoker = true, the view runs as the querying user and RLS applies normally.

DROP VIEW IF EXISTS public.member_dashboard;

CREATE VIEW public.member_dashboard
  WITH (security_invoker = true)
AS
SELECT
  p.id AS user_id,
  p.full_name,
  m.tier,
  m.status AS membership_status,
  m.current_period_end,
  COALESCE(SUM(fp.amount), 0) AS points_balance,
  COUNT(DISTINCT b.id) AS total_bookings,
  COALESCE(SUM(b.total_paid), 0) AS total_spent
FROM public.profiles p
LEFT JOIN public.memberships m ON m.user_id = p.id AND m.status = 'active'
LEFT JOIN public.fairway_points fp ON fp.user_id = p.id
LEFT JOIN public.bookings b ON b.user_id = p.id AND b.status != 'canceled'
GROUP BY p.id, p.full_name, m.tier, m.status, m.current_period_end;

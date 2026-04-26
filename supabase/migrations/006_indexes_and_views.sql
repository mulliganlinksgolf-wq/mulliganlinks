-- Indexes for frequently-queried columns
create index idx_tee_times_course_scheduled on public.tee_times (course_id, scheduled_at);
create index idx_tee_times_status on public.tee_times (status);
create index idx_bookings_user_id on public.bookings (user_id);
create index idx_bookings_tee_time_id on public.bookings (tee_time_id);
create index idx_bookings_status on public.bookings (status);
create index idx_fairway_points_user_id on public.fairway_points (user_id);
create index idx_memberships_user_id on public.memberships (user_id);
create index idx_memberships_stripe_subscription on public.memberships (stripe_subscription_id);
create index idx_course_admins_user_id on public.course_admins (user_id);
create index idx_course_admins_course_id on public.course_admins (course_id);
create index idx_outings_organizer_id on public.outings (organizer_id);
create index idx_outing_participants_outing_id on public.outing_participants (outing_id);
create index idx_waitlist_alerts_user_course on public.waitlist_alerts (user_id, course_id);

-- Member dashboard view
create or replace view public.member_dashboard as
select
  p.id as user_id,
  p.full_name,
  m.tier,
  m.status as membership_status,
  m.current_period_end,
  coalesce(sum(fp.amount), 0) as points_balance,
  count(distinct b.id) as total_bookings,
  coalesce(sum(b.total_paid), 0) as total_spent
from public.profiles p
left join public.memberships m on m.user_id = p.id and m.status = 'active'
left join public.fairway_points fp on fp.user_id = p.id
left join public.bookings b on b.user_id = p.id and b.status != 'canceled'
group by p.id, p.full_name, m.tier, m.status, m.current_period_end;

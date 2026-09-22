-- Course platform billing is separate from golfer memberships and Stripe Connect payouts.
create table public.course_billing_accounts (
  course_id uuid primary key references public.courses(id) on delete cascade,
  standard_monthly_cents integer not null default 34900 check(standard_monthly_cents between 4901 and 1000000),
  free_until timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz not null default now(),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  checkout_session_id text,
  checkout_nonce uuid not null default gen_random_uuid(),
  status text not null default 'not_started',
  current_period_end timestamptz,
  stripe_schedule_id text,
  winter_operation_id uuid,
  winter_requested_at timestamptz,
  winter_start_at timestamptz,
  winter_end_at timestamptz,
  winter_state text not null default 'none' check(winter_state in ('none','preparing','scheduled')),
  reminder_sent_at timestamptz,
  locked_until timestamptz not null default '-infinity',
  lock_token uuid,
  updated_at timestamptz not null default now()
);
alter table public.course_billing_accounts enable row level security;
revoke all on public.course_billing_accounts from public, anon, authenticated;
grant all on public.course_billing_accounts to service_role;

-- Only public booking availability is exposed; never customer IDs, payment data or contracts.
create table public.course_booking_access (
  course_id uuid primary key references public.courses(id) on delete cascade,
  winter_start_at timestamptz,
  winter_end_at timestamptz,
  billing_blocked boolean not null default false
);
alter table public.course_booking_access enable row level security;
revoke all on public.course_booking_access from public, anon, authenticated;
grant select on public.course_booking_access to anon, authenticated;
grant all on public.course_booking_access to service_role;
create policy "Public course booking availability" on public.course_booking_access for select to anon, authenticated using(true);

create function public.claim_course_billing(p_course uuid)
returns uuid language sql security invoker set search_path=public as $$
 update course_billing_accounts set lock_token=gen_random_uuid(),locked_until=now()+interval '3 minutes'
 where course_id=p_course and locked_until < now() returning lock_token;
$$;
revoke all on function public.claim_course_billing(uuid) from public,anon,authenticated;
grant execute on function public.claim_course_billing(uuid) to service_role;

-- Guard every booking insertion, including walk-ins and old RPCs. A booking for
-- an upcoming winter date is blocked before the winter phase starts as well.
create function public.enforce_course_booking_access()
returns trigger language plpgsql security invoker set search_path=public as $$
declare cid uuid; slot_time timestamptz; a public.course_booking_access;
begin
 select course_id,scheduled_at into cid,slot_time from public.tee_times where id=new.tee_time_id;
 select * into a from public.course_booking_access where course_id=cid;
 if a.billing_blocked then raise exception 'This course is not accepting new bookings. Please contact the course.'; end if;
 if a.winter_start_at is not null and a.winter_end_at is not null and
   ((now() >= a.winter_start_at and now() < a.winter_end_at) or
    (slot_time >= a.winter_start_at and slot_time < a.winter_end_at)) then
   raise exception 'This course is on its Winter Plan and is not accepting new bookings.';
 end if;
 return new;
end;
$$;
revoke all on function public.enforce_course_booking_access() from public,anon,authenticated;
create trigger course_booking_access_guard before insert on public.bookings for each row execute function public.enforce_course_booking_access();

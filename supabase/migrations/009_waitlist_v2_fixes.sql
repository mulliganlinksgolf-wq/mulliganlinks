-- Fix 1: approve_founding_partner — guard against missing/already-approved course ID
create or replace function public.approve_founding_partner(p_course_id integer)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_count     integer;
  v_cap       integer;
  v_new       integer;
  v_updated   integer;
begin
  -- Advisory lock to prevent race conditions
  perform pg_advisory_xact_lock(1234567890);

  select count, cap into v_count, v_cap
  from public.founding_partner_counter
  where id = 1;

  if v_count >= v_cap then
    return jsonb_build_object('error', 'Founding Partner cap reached');
  end if;

  v_new := v_count + 1;

  update public.founding_partner_counter set count = v_new where id = 1;

  update public.course_waitlist
  set
    is_founding_partner     = true,
    founding_partner_number = v_new,
    status                  = 'approved',
    approved_at             = now()
  where id = p_course_id
    and is_founding_partner = false   -- idempotency: skip already-approved rows
  returning id into v_updated;

  if v_updated is null then
    raise exception 'course % not found or already approved', p_course_id;
  end if;

  return jsonb_build_object('founding_partner_number', v_new);
end;
$$;

-- Fix 2: RLS — restrict public insert on course_waitlist to prevent self-approval
drop policy if exists "Anyone can join course waitlist" on public.course_waitlist;
create policy "Anyone can join course waitlist"
  on public.course_waitlist for insert
  with check (
    is_founding_partner = false
    and founding_partner_number is null
    and status = 'pending'
    and approved_at is null
  );

-- Fix 2 (cont): RLS — restrict public insert on golfer_waitlist
drop policy if exists "Anyone can join golfer waitlist" on public.golfer_waitlist;
create policy "Anyone can join golfer waitlist"
  on public.golfer_waitlist for insert
  with check (
    position is null
    and confirmed_at is null
  );

-- Fix 3: Enable RLS on founding_partner_counter with a read policy
alter table public.founding_partner_counter enable row level security;

create policy "Anyone can read founding partner counter"
  on public.founding_partner_counter for select using (true);

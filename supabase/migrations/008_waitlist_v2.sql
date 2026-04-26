-- Golfer waitlist (replaces the simple `waitlist` table for new signups)
create table if not exists public.golfer_waitlist (
  id           serial primary key,
  email        varchar(255) not null unique,
  first_name   varchar(100),
  last_name    varchar(100),
  zip_code     varchar(10),
  home_course  varchar(255),
  rounds_per_year    varchar(20),
  current_membership varchar(50),
  interested_tier    varchar(20),
  referral_source    varchar(100),
  position     integer,
  created_at   timestamptz not null default now(),
  confirmed_at timestamptz
);

alter table public.golfer_waitlist enable row level security;

drop policy if exists "Anyone can join golfer waitlist" on public.golfer_waitlist;
create policy "Anyone can join golfer waitlist"
  on public.golfer_waitlist for insert with check (true);

-- Course waitlist
create table if not exists public.course_waitlist (
  id                     serial primary key,
  course_name            varchar(255) not null,
  contact_name           varchar(255) not null,
  contact_role           varchar(100),
  email                  varchar(255) not null unique,
  phone                  varchar(20),
  city                   varchar(100),
  state                  varchar(2),
  num_holes              integer,
  annual_rounds          integer,
  current_software       varchar(100),
  on_golfnow             boolean,
  estimated_barter_cost  integer,
  biggest_frustration    text,
  is_founding_partner    boolean not null default false,
  founding_partner_number integer,
  status                 varchar(20) not null default 'pending',
  notes                  text,
  created_at             timestamptz not null default now(),
  approved_at            timestamptz
);

alter table public.course_waitlist enable row level security;

drop policy if exists "Anyone can join course waitlist" on public.course_waitlist;
create policy "Anyone can join course waitlist"
  on public.course_waitlist for insert with check (true);

-- Founding partner counter (single-row)
create table if not exists public.founding_partner_counter (
  id    integer primary key default 1,
  count integer not null default 0,
  cap   integer not null default 10,
  constraint single_row check (id = 1)
);

insert into public.founding_partner_counter (id, count, cap)
  values (1, 0, 10)
  on conflict (id) do nothing;

-- Atomic Founding Partner approval function (called via supabase.rpc)
create or replace function public.approve_founding_partner(p_course_id integer)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_count integer;
  v_cap   integer;
  v_new   integer;
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
  where id = p_course_id;

  return jsonb_build_object('founding_partner_number', v_new);
end;
$$;

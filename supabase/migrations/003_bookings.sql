-- Tee times
create table public.tee_times (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  scheduled_at timestamptz not null,
  max_players int not null default 4,
  available_players int not null default 4,
  base_price numeric(10,2) not null default 0,
  status text not null default 'open' check (status in ('open','booked','blocked')),
  created_at timestamptz not null default now()
);

alter table public.tee_times enable row level security;

create policy "Anyone can view open tee times"
  on public.tee_times for select
  using (status = 'open');

create policy "Course admins can manage tee times"
  on public.tee_times for all
  using (
    exists (
      select 1 from public.course_admins
      where course_admins.course_id = tee_times.course_id
      and course_admins.user_id = auth.uid()
    )
  );

-- Bookings
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  tee_time_id uuid not null references public.tee_times(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  players int not null default 1 check (players between 1 and 4),
  total_paid numeric(10,2) not null default 0,
  status text not null default 'confirmed' check (status in ('confirmed','canceled','completed','no_show')),
  stripe_payment_intent_id text,
  points_awarded int not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.bookings enable row level security;

create policy "Users can view own bookings"
  on public.bookings for select
  using (auth.uid() = user_id);

create policy "Users can insert own bookings"
  on public.bookings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own bookings"
  on public.bookings for update
  using (auth.uid() = user_id);

create policy "Course admins can view their course bookings"
  on public.bookings for select
  using (
    exists (
      select 1 from public.tee_times tt
      join public.course_admins ca on ca.course_id = tt.course_id
      where tt.id = bookings.tee_time_id
      and ca.user_id = auth.uid()
    )
  );

-- Fairway Points ledger
create table public.fairway_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  amount int not null,
  reason text not null,
  created_at timestamptz not null default now()
);

alter table public.fairway_points enable row level security;

create policy "Users can view own points"
  on public.fairway_points for select
  using (auth.uid() = user_id);

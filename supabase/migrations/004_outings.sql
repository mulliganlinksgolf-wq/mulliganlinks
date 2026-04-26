-- Outings (Pillar 02)
create table public.outings (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles(id) on delete restrict,
  course_id uuid not null references public.courses(id) on delete restrict,
  scheduled_at timestamptz not null,
  num_players int not null,
  format text not null default 'scramble' check (format in ('scramble','best_ball','individual','other')),
  status text not null default 'draft' check (status in ('draft','confirmed','completed','canceled')),
  total_amount numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.outings enable row level security;

create policy "Organizers can manage their outings"
  on public.outings for all
  using (auth.uid() = organizer_id);

create policy "Participants can view their outings"
  on public.outings for select
  using (
    exists (
      select 1 from public.outing_participants
      where outing_participants.outing_id = outings.id
      and outing_participants.user_id = auth.uid()
    )
  );

-- Outing participants
create table public.outing_participants (
  id uuid primary key default gen_random_uuid(),
  outing_id uuid not null references public.outings(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  email text not null,
  full_name text,
  paid boolean not null default false,
  payment_amount numeric(10,2),
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);

alter table public.outing_participants enable row level security;

create policy "Organizers can manage participants"
  on public.outing_participants for all
  using (
    exists (
      select 1 from public.outings
      where outings.id = outing_participants.outing_id
      and outings.organizer_id = auth.uid()
    )
  );

create policy "Participants can view their own record"
  on public.outing_participants for select
  using (auth.uid() = user_id);

-- Waitlist alerts
create table public.waitlist_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  desired_date date not null,
  desired_time_window text,
  players int not null default 1 check (players between 1 and 4),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.waitlist_alerts enable row level security;

create policy "Users can manage their own alerts"
  on public.waitlist_alerts for all
  using (auth.uid() = user_id);

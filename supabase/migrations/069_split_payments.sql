-- Split payment sessions
-- Created when a member books a tee time and wants to split cost with their group.
-- The tee time's available_players is decremented immediately to hold spots.
-- Status transitions: pending → complete (all paid) | expired (deadline passed) | canceled

create table public.split_sessions (
  id                        uuid primary key default gen_random_uuid(),
  tee_time_id               uuid not null references public.tee_times(id) on delete restrict,
  booking_id                uuid references public.bookings(id) on delete set null,
  initiated_by              uuid not null references public.profiles(id) on delete restrict,
  player_count              int not null check (player_count between 2 and 4),
  total_amount_cents        int not null check (total_amount_cents >= 0),
  status                    text not null default 'pending'
                              check (status in ('pending','complete','expired','canceled')),
  -- Stripe PaymentIntent for the tee time hold (authorized but not captured until complete)
  stripe_hold_intent_id     text,
  expires_at                timestamptz not null,
  created_at                timestamptz not null default now(),
  completed_at              timestamptz
);

alter table public.split_sessions enable row level security;

-- Initiator can see their own sessions
create policy "Initiator can view own split sessions"
  on public.split_sessions for select
  using (auth.uid() = initiated_by);

create policy "Initiator can insert split sessions"
  on public.split_sessions for insert
  with check (auth.uid() = initiated_by);

-- Service role updates status (via API route)
create policy "Service role can update split sessions"
  on public.split_sessions for update
  using (true);

-- Course admins can view splits for their tee times
create policy "Course admins can view split sessions"
  on public.split_sessions for select
  using (
    exists (
      select 1 from public.tee_times tt
      join public.course_admins ca on ca.course_id = tt.course_id
      where tt.id = split_sessions.tee_time_id
      and ca.user_id = auth.uid()
    )
  );


-- Individual shares within a split session.
-- One row per player (including the initiator).
-- Non-members identified by email only; user_id populated if they're a member.
-- token is the secret included in the payment link sent to each invitee.

create table public.split_invitees (
  id                        uuid primary key default gen_random_uuid(),
  split_session_id          uuid not null references public.split_sessions(id) on delete cascade,
  email                     text not null,
  user_id                   uuid references public.profiles(id) on delete set null,
  amount_cents              int not null check (amount_cents > 0),
  status                    text not null default 'pending'
                              check (status in ('pending','paid','declined','expired')),
  is_initiator              boolean not null default false,
  token                     uuid not null default gen_random_uuid(),
  stripe_payment_intent_id  text,
  paid_at                   timestamptz,
  created_at                timestamptz not null default now(),
  constraint unique_token unique (token)
);

alter table public.split_invitees enable row level security;

-- Anyone with the token can view their own invitee row (public split page fetches by token)
-- This is enforced at the API route level using the service role — no RLS needed for that path.

-- Authenticated members can see rows where they are the user
create policy "Members can view own invitee rows"
  on public.split_invitees for select
  using (auth.uid() = user_id);

-- Initiator can view all invitees in their sessions
create policy "Initiator can view all invitees in their sessions"
  on public.split_invitees for select
  using (
    exists (
      select 1 from public.split_sessions ss
      where ss.id = split_invitees.split_session_id
      and ss.initiated_by = auth.uid()
    )
  );

create policy "Service role can manage invitees"
  on public.split_invitees for all
  using (true);

-- Index for token lookups on the public payment page
create index split_invitees_token_idx on public.split_invitees (token);

-- Index for checking all invitees paid (used in the webhook handler)
create index split_invitees_session_status_idx on public.split_invitees (split_session_id, status);

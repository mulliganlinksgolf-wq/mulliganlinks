create table if not exists rain_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  issued_by uuid not null references auth.users(id),
  -- Human-readable 8-char code members enter at checkout
  code text not null unique default upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  amount_cents integer not null check (amount_cents > 0),
  status text not null default 'available' check (status in ('available', 'redeemed', 'expired')),
  redeemed_booking_id uuid references bookings(id),
  expires_at timestamptz not null default (now() + interval '1 year'),
  note text,
  created_at timestamptz not null default now()
);

alter table rain_checks enable row level security;

-- Members can read their own rain checks
create policy "members read own rain checks"
  on rain_checks for select
  using (auth.uid() = user_id);

-- Service role manages all (issuance, redemption)
create policy "service role manage rain checks"
  on rain_checks
  using (true)
  with check (true);

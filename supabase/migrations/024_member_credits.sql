-- Member credits ledger (monthly tee-time allowances, birthday credits, free rounds, etc.)
create table if not exists member_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- type values: 'monthly' (recurring allowance), 'birthday', 'free_round', 'manual'
  type text not null check (type in ('monthly', 'birthday', 'free_round', 'manual')),
  amount_cents integer not null check (amount_cents > 0),
  -- period prevents double-issuance: 'YYYY-MM' for monthly, 'YYYY' for annual
  period text,
  status text not null default 'available' check (status in ('available', 'used', 'expired')),
  redeemed_booking_id uuid references bookings(id),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- Unique index prevents issuing the same credit twice for the same period
create unique index if not exists member_credits_user_type_period
  on member_credits (user_id, type, period)
  where period is not null;

alter table member_credits enable row level security;

-- Members can only read their own credits
create policy "members read own credits"
  on member_credits for select
  using (auth.uid() = user_id);

-- Service role manages all credits (issuance, redemption)
create policy "service role manage credits"
  on member_credits
  using (true)
  with check (true);

-- Updated_at trigger function (reused across tables)
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  home_course_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Courses
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  address text,
  city text,
  state text,
  zip text,
  phone text,
  email text,
  website text,
  hero_image_url text,
  base_green_fee numeric(10,2),
  status text not null default 'pending' check (status in ('active','pending','archived')),
  stripe_account_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger courses_updated_at
  before update on public.courses
  for each row execute function public.handle_updated_at();

alter table public.courses enable row level security;

create policy "Anyone can view active courses"
  on public.courses for select
  using (status = 'active');

-- Course admins
create table public.course_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  role text not null default 'staff' check (role in ('owner','manager','staff')),
  created_at timestamptz not null default now(),
  unique(user_id, course_id)
);

alter table public.course_admins enable row level security;

create policy "Course admins can view their own admin records"
  on public.course_admins for select
  using (auth.uid() = user_id);

-- Memberships
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tier text not null default 'free' check (tier in ('free','eagle','ace')),
  status text not null default 'active' check (status in ('active','canceled','past_due')),
  stripe_subscription_id text unique,
  stripe_customer_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  canceled_at timestamptz
);

alter table public.memberships enable row level security;

create policy "Users can view own membership"
  on public.memberships for select
  using (auth.uid() = user_id);

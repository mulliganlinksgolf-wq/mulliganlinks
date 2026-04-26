-- Content blocks for admin-editable site copy
create table public.content_blocks (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text not null,
  type text not null default 'text' check (type in ('text','markdown','html')),
  description text,
  updated_at timestamptz not null default now()
);

create trigger content_blocks_updated_at
  before update on public.content_blocks
  for each row execute function public.handle_updated_at();

alter table public.content_blocks enable row level security;

create policy "Anyone can read content blocks"
  on public.content_blocks for select
  using (true);

-- Seed default homepage copy
insert into public.content_blocks (key, value, type, description) values
  ('home.headline', 'Your home course, redone right.', 'text', 'Homepage hero headline'),
  ('home.subhead', 'MulliganLinks is the golf membership network built for local players and the courses they love — no barter traps, no booking fees, just better golf.', 'text', 'Homepage hero subheadline'),
  ('home.badge', 'Coming soon · Local-first golf membership', 'text', 'Homepage hero badge text'),
  ('home.cta', 'Get Early Access', 'text', 'Waitlist form button text'),
  ('home.footer', 'Be first when we launch in your area.', 'text', 'Text below waitlist form');

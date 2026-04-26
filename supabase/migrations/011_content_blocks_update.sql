-- Update content_blocks to match current homepage copy
insert into public.content_blocks (key, value, type, description) values
  ('home.headline', 'The Local-First Golf Loyalty Network', 'text', 'Homepage hero headline'),
  ('home.subhead', 'Free software for courses. Real loyalty for golfers. Zero booking fees, always.', 'text', 'Homepage hero subheadline'),
  ('home.badge', 'Coming soon to Metro Detroit', 'text', 'Homepage hero badge text'),
  ('home.tagline', 'No credit card required · Metro Detroit launch', 'text', 'Small text below hero CTAs')
on conflict (key) do update
  set value = excluded.value,
      description = excluded.description;

-- Remove old keys no longer used
delete from public.content_blocks where key in ('home.cta', 'home.footer');

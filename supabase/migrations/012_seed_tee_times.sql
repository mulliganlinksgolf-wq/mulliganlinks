-- Activate the pilot course
update public.courses
set status = 'active',
    name = 'Fieldstone Golf Club',
    city = 'Bloomfield Hills',
    state = 'MI',
    base_green_fee = 55.00
where id = '0cfd7d15-d8dd-4eb9-8140-5e445d8b2770';

-- Add Neil and Billy as course admins for the pilot course
insert into public.course_admins (user_id, course_id, role) values
  ('bc09d3ed-7655-4687-8d98-cd91ca9104d9', '0cfd7d15-d8dd-4eb9-8140-5e445d8b2770', 'owner'),
  ('ef45c846-1e5c-4bab-b019-24907d9019ed', '0cfd7d15-d8dd-4eb9-8140-5e445d8b2770', 'manager'),
  ('2c4dfd98-04da-4f24-b724-a61e402747f3', '0cfd7d15-d8dd-4eb9-8140-5e445d8b2770', 'manager')
on conflict (user_id, course_id) do nothing;

-- Seed tee times: Mon Apr 27 through Sun May 3 2026
-- Weekday: 7am–4pm every 10 min @ $45. Weekend: 7am–2pm every 8 min @ $65.
insert into public.tee_times (course_id, scheduled_at, max_players, available_players, base_price, status)
select
  '0cfd7d15-d8dd-4eb9-8140-5e445d8b2770'::uuid,
  slot,
  4,
  4,
  case when extract(dow from slot) in (0, 6) then 65.00 else 45.00 end,
  'open'
from generate_series(
  '2026-04-27 07:00:00 America/Detroit'::timestamptz,
  '2026-04-27 16:00:00 America/Detroit'::timestamptz,
  interval '10 minutes'
) slot
union all
select '0cfd7d15-d8dd-4eb9-8140-5e445d8b2770'::uuid, slot, 4, 4, 45.00, 'open'
from generate_series(
  '2026-04-28 07:00:00 America/Detroit'::timestamptz,
  '2026-04-28 16:00:00 America/Detroit'::timestamptz,
  interval '10 minutes'
) slot
union all
select '0cfd7d15-d8dd-4eb9-8140-5e445d8b2770'::uuid, slot, 4, 4, 45.00, 'open'
from generate_series(
  '2026-04-29 07:00:00 America/Detroit'::timestamptz,
  '2026-04-29 16:00:00 America/Detroit'::timestamptz,
  interval '10 minutes'
) slot
union all
select '0cfd7d15-d8dd-4eb9-8140-5e445d8b2770'::uuid, slot, 4, 4, 45.00, 'open'
from generate_series(
  '2026-04-30 07:00:00 America/Detroit'::timestamptz,
  '2026-04-30 16:00:00 America/Detroit'::timestamptz,
  interval '10 minutes'
) slot
union all
select '0cfd7d15-d8dd-4eb9-8140-5e445d8b2770'::uuid, slot, 4, 4, 45.00, 'open'
from generate_series(
  '2026-05-01 07:00:00 America/Detroit'::timestamptz,
  '2026-05-01 16:00:00 America/Detroit'::timestamptz,
  interval '10 minutes'
) slot
union all
-- Saturday: premium pricing
select '0cfd7d15-d8dd-4eb9-8140-5e445d8b2770'::uuid, slot, 4, 4, 65.00, 'open'
from generate_series(
  '2026-05-02 07:00:00 America/Detroit'::timestamptz,
  '2026-05-02 14:00:00 America/Detroit'::timestamptz,
  interval '8 minutes'
) slot
union all
-- Sunday: premium pricing
select '0cfd7d15-d8dd-4eb9-8140-5e445d8b2770'::uuid, slot, 4, 4, 65.00, 'open'
from generate_series(
  '2026-05-03 07:00:00 America/Detroit'::timestamptz,
  '2026-05-03 14:00:00 America/Detroit'::timestamptz,
  interval '8 minutes'
) slot;

-- Block a couple of slots to make the tee sheet look real
update public.tee_times
set status = 'blocked'
where course_id = '0cfd7d15-d8dd-4eb9-8140-5e445d8b2770'
  and scheduled_at in (
    '2026-04-27 08:20:00 America/Detroit'::timestamptz,
    '2026-04-27 08:30:00 America/Detroit'::timestamptz,
    '2026-04-28 09:40:00 America/Detroit'::timestamptz
  );

-- Simulate a couple of pre-booked slots (booked by Neil)
-- First: book the 8:00 AM Monday slot (2 players, $45 each, 90 points earned)
with target as (
  select id from public.tee_times
  where course_id = '0cfd7d15-d8dd-4eb9-8140-5e445d8b2770'
    and scheduled_at = '2026-04-27 08:00:00 America/Detroit'::timestamptz
  limit 1
),
booking as (
  insert into public.bookings (tee_time_id, user_id, players, total_paid, status, points_awarded)
  select id, 'bc09d3ed-7655-4687-8d98-cd91ca9104d9', 2, 90.00, 'confirmed', 90
  from target
  returning tee_time_id, id as booking_id
)
insert into public.fairway_points (user_id, course_id, booking_id, amount, reason)
select 'bc09d3ed-7655-4687-8d98-cd91ca9104d9',
       '0cfd7d15-d8dd-4eb9-8140-5e445d8b2770',
       booking_id,
       90,
       'Booking at Fieldstone Golf Club'
from booking;

-- Update availability for the booked slot
update public.tee_times
set available_players = available_players - 2,
    status = case when available_players - 2 <= 0 then 'booked' else 'open' end
where course_id = '0cfd7d15-d8dd-4eb9-8140-5e445d8b2770'
  and scheduled_at = '2026-04-27 08:00:00 America/Detroit'::timestamptz;

-- Second pre-booked: Saturday 7:00 AM (4 players, fully booked)
with target as (
  select id from public.tee_times
  where course_id = '0cfd7d15-d8dd-4eb9-8140-5e445d8b2770'
    and scheduled_at = '2026-05-02 07:00:00 America/Detroit'::timestamptz
  limit 1
),
booking as (
  insert into public.bookings (tee_time_id, user_id, players, total_paid, status, points_awarded)
  select id, 'bc09d3ed-7655-4687-8d98-cd91ca9104d9', 4, 260.00, 'confirmed', 260
  from target
  returning tee_time_id, id as booking_id
)
insert into public.fairway_points (user_id, course_id, booking_id, amount, reason)
select 'bc09d3ed-7655-4687-8d98-cd91ca9104d9',
       '0cfd7d15-d8dd-4eb9-8140-5e445d8b2770',
       booking_id,
       260,
       'Booking at Fieldstone Golf Club'
from booking;

update public.tee_times
set available_players = 0, status = 'booked'
where course_id = '0cfd7d15-d8dd-4eb9-8140-5e445d8b2770'
  and scheduled_at = '2026-05-02 07:00:00 America/Detroit'::timestamptz;

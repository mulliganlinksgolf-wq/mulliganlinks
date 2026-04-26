-- Simulate partial bookings on a handful of slots so "last spot" hot deals show up
-- We update available_players directly (no real booking record needed for the demo)

-- Monday: a few partially-filled slots throughout the day
update public.tee_times set available_players = 1
where course_id = '0cfd7d15-d8dd-4eb9-8140-5e445d8b2770'
  and scheduled_at in (
    '2026-04-27 12:30:00 America/Detroit'::timestamptz,
    '2026-04-27 14:10:00 America/Detroit'::timestamptz,
    '2026-04-27 07:30:00 America/Detroit'::timestamptz
  );

update public.tee_times set available_players = 2
where course_id = '0cfd7d15-d8dd-4eb9-8140-5e445d8b2770'
  and scheduled_at in (
    '2026-04-27 09:00:00 America/Detroit'::timestamptz,
    '2026-04-27 10:30:00 America/Detroit'::timestamptz,
    '2026-04-27 15:00:00 America/Detroit'::timestamptz
  );

-- Saturday: busy morning (weekend demand)
update public.tee_times set available_players = 1
where course_id = '0cfd7d15-d8dd-4eb9-8140-5e445d8b2770'
  and scheduled_at in (
    '2026-05-02 08:00:00 America/Detroit'::timestamptz,
    '2026-05-02 08:08:00 America/Detroit'::timestamptz,
    '2026-05-02 08:16:00 America/Detroit'::timestamptz,
    '2026-05-02 09:00:00 America/Detroit'::timestamptz
  );

update public.tee_times set available_players = 2
where course_id = '0cfd7d15-d8dd-4eb9-8140-5e445d8b2770'
  and scheduled_at in (
    '2026-05-02 07:08:00 America/Detroit'::timestamptz,
    '2026-05-02 07:16:00 America/Detroit'::timestamptz,
    '2026-05-02 07:24:00 America/Detroit'::timestamptz
  );

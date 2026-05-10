# Fairway Points — Redemption Limits & Course Controls

**Date:** 2026-05-09  
**Author:** Neil Barris (CTO)  
**Status:** Approved for implementation

---

## Overview

Adds per-course redemption controls for the Fairway Points loyalty program, plus complimentary round tracking for Eagle and Ace members. All six course controls must be live before the first course onboards.

Points multipliers are: Fairway 1×, Eagle 1.5×, Ace 2×. The product brief (v2) contained incorrect multiplier values — the live code values are authoritative.

---

## Tier Summary

| Tier | Annual Fee | Points Multiplier | Complimentary Rounds | Max Point Redemptions / Season / Course |
|---|---|---|---|---|
| Fairway | $0 | 1× | None | 1 |
| Eagle | $89/yr | 1.5× | 1/yr (included) | 2 |
| Ace | $159/yr | 2× | 2/yr (included) | 3 |

"Season" = membership anniversary year (resets on each member's signup anniversary, not calendar year).

Points threshold for one free round redemption: **5,000 points** (≈ $50 green fee). Configurable per course by the GM.

---

## 1. Database Schema

### New table: `course_redemption_settings`

One row per course. Created with defaults when a course first saves their Rewards settings. Defaults apply until a row exists.

```sql
create table course_redemption_settings (
  course_id              uuid primary key references courses(id) on delete cascade,
  points_threshold       int not null default 5000,
  max_redemptions_fairway int not null default 1,
  max_redemptions_eagle  int not null default 2,
  max_redemptions_ace    int not null default 3,
  blackout_dates         date[] not null default '{}',
  eligible_slot_start    time default null,  -- null = all slots
  eligible_slot_end      time default null,
  monthly_redemption_cap int default null,   -- null = uncapped
  notice_hours           int not null default 48,
  updated_at             timestamptz not null default now()
);
```

### `memberships` — two new columns

```sql
alter table memberships
  add column comp_rounds_remaining int not null default 0,
  add column comp_rounds_reset_at  timestamptz;
```

- Set on membership creation: `comp_rounds_remaining = 0 | 1 | 2` by tier, `comp_rounds_reset_at = created_at + interval '1 year'`
- Existing memberships backfilled: Fairway → 0, Eagle → 1, Ace → 2, reset date = now + 1 year

### `bookings` — one new column

```sql
alter table bookings
  add column redemption_type text check (redemption_type in ('points', 'complimentary'));
```

Null = normal paid booking. `'points'` = free round via point threshold redemption. `'complimentary'` = membership-included round.

---

## 2. Enforcement Logic

All checks run in `confirmBooking` (src/app/actions/booking.ts) before the booking is written. Each violation returns a typed error string the UI renders inline.

### Complimentary round path (`redemption_type = 'complimentary'`)

1. Load membership — if `comp_rounds_reset_at` is in the past, reset: set `comp_rounds_remaining` to tier default (1 Eagle, 2 Ace), advance `comp_rounds_reset_at` by 1 year. Lazy reset — no cron required.
2. Check `comp_rounds_remaining > 0` — error: "No complimentary rounds remaining."
3. Load `course_redemption_settings` for the course (use defaults if no row exists).
4. Check tee time date not in `blackout_dates` — error: "This date is not eligible for redemptions at [course]."
5. Check tee time falls within `eligible_slot_start / eligible_slot_end` if set — error: "Redemptions at [course] are only available [start]–[end]."
6. Check tee time is at least `notice_hours` from now — error: "Redemptions must be booked at least [N] hours in advance."
7. Count all redemptions (`'points'` OR `'complimentary'`) this calendar month at this course — must be < `monthly_redemption_cap` (skip if null) — error: "This course has reached its monthly redemption limit. Try again next month."
8. Decrement `comp_rounds_remaining` by 1. Set `redemption_type = 'complimentary'` on booking. Green fee = $0.

### Points free round path (`redemption_type = 'points'`)

1. Load `course_redemption_settings` (use defaults if no row).
2. Check member points balance >= `points_threshold` — error: "You need [N] points to redeem a free round here."
3. Check blackout date (same as above).
4. Check eligible slot window (same as above).
5. Check notice period (same as above).
6. Count bookings this membership year at this course where `redemption_type = 'points'` — must be < `max_redemptions_{tier}` — error: "You've reached your redemption limit at [course] for this membership year."
7. Count all redemptions this calendar month — must be < `monthly_redemption_cap` (same cap, both redemption types count) — error: "This course has reached its monthly redemption limit. Try again next month."
8. Deduct `points_threshold` points (insert negative `fairway_points` row). Set `redemption_type = 'points'`. Green fee = $0.

### Partial point offset path (existing — unchanged)

The existing behavior allowing members to offset part of the green fee with points is untouched. It does not interact with redemption limits. Only full free round redemptions (= points_threshold deduction) are subject to caps.

---

## 3. Course Admin UI

### New "Rewards" tab in course settings (`/course/[slug]/settings`)

Added as a sibling to the existing Team tab. Extends `CourseSettingsForm` — no new page.

**Points & Caps section:**
- Points threshold — number input, label: "Points needed for one free round", default 5,000
- Seasonal caps — three number inputs: Fairway / Eagle / Ace
- Monthly cap — number input, helper text: "Leave blank for no limit. Suggested: 10% of your average monthly rounds."

**Booking Rules section:**
- Blackout dates — multi-date picker, selected dates shown as removable chips
- Eligible time window — start time + end time (both optional; blank = all times)
- Notice period — number input in hours, default 48

On save: upsert into `course_redemption_settings`. First save creates the row; defaults apply until then.

---

## 4. Booking Form Updates

`BookingForm` / `BookingPaymentForm` updated with a new section, visible only to Eagle/Ace members with `comp_rounds_remaining > 0`.

**New "Complimentary Round" toggle** (appears above points section):
- Label: "Use 1 complimentary round ([N] remaining)"
- When on: fee displays $0, points redemption section hidden
- When off: normal payment flow
- Passes `redemption_type: 'complimentary'` to `confirmBooking`

**New "Redeem a free round" option** (appears when member has >= `points_threshold` points):
- Separate from the existing partial offset slider
- Label: "Redeem free round ([N] pts)"
- When selected: fee displays $0, partial offset slider hidden
- Passes `redemption_type: 'points'` + full threshold deduction to `confirmBooking`

**Existing partial offset slider** — untouched. Stacks with the paid green fee as before.

Complimentary round and points free round are mutually exclusive. Both are mutually exclusive with the partial offset.

---

## 5. Member-Facing UX

### Points page (`/app/points`)
- Eagle/Ace: new stat in the stats bar — "X comp round(s) remaining · resets [date]"
- Fairway: no change

### Benefits page (`/app/benefits`)
- Eagle/Ace: new "Complimentary Rounds" card showing the full annual allotment as individual round indicators (e.g., Eagle shows 2 circles). Used rounds render with strikethrough text and a muted/crossed visual treatment; remaining rounds render normally. Example: Eagle member who has used 1 of 1 sees "~~Round 1~~" struck through. Ace member who has used 1 of 2 sees "~~Round 1~~" struck, "Round 2" active.
- Reset date shown below the indicators: "Resets [date]"
- Fairway: new informational note — "Earn 5,000 points for a free round at participating courses"

### Error states in booking form
All errors are inline, adjacent to the blocked toggle/option:
- Blackout date: "This date is not eligible for redemptions at [course]."
- Outside time window: "Redemptions at [course] are only available [start]–[end]."
- Notice period: "Redemptions must be booked at least [N] hours in advance."
- Seasonal cap: "You've reached your redemption limit at [course] for this membership year."
- Monthly cap: "This course has reached its monthly redemption limit. Try again next month."
- Insufficient points: "You need [N] points to redeem a free round here."
- No comp rounds: "No complimentary rounds remaining."

---

## Out of Scope

- Waitlist when monthly cap is hit (blocked booking only, no queue)
- Auto-calculated monthly cap from booking history (GM enters manually)
- Cron-based complimentary round resets (lazy reset on booking load)
- Complimentary round notifications / expiry warnings

# Guest Passes + Member Benefits Page — Design Spec

**Date:** 2026-05-05  
**Status:** Approved for implementation

---

## Overview

Two related features:

1. **Guest Passes** — Eagle members get 1/year, Ace members get 2/year. At booking, a member can redeem a guest pass to waive the booking fee for one additional player in their group. Passes are issued automatically on membership activation and expire after 1 year.

2. **Member Benefits Page** (`/app/benefits`) — A new page in the member portal that tracks every benefit the member has earned and used, with a running "Total saved with TeeAhead" hero number.

3. **Birthday Credit** — $10 (Eagle) / $20 (Ace) credit issued on the member's birthday, valid for 12 months. Birthday is collected at signup.

---

## Database

### Migration: `profiles` — add birthday

```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birthday date;
```

No constraint — existing members won't have one. Birthday credits are only issued to members who have set a birthday.

### Migration: `bookings` — add discount_cents

```sql
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS discount_cents integer NOT NULL DEFAULT 0;
```

Tracks the value of any guest pass fee waiver applied per booking. Needed by the benefits savings tracker.

### Migration: `guest_passes` — new table

```sql
CREATE TABLE public.guest_passes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  issued_at   timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL,
  redeemed_at timestamptz,
  booking_id  uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.guest_passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read own guest passes"
  ON public.guest_passes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "service role manage guest passes"
  ON public.guest_passes FOR ALL
  USING (true);
```

### Migration: `member_credits` — add birthday type

`member_credits` already has `type check (type in ('monthly', 'birthday', 'free_round', 'manual'))` — birthday is already valid. No schema change needed. The `period` column stores `YYYY-MM-DD` (the birthday date) to prevent duplicate issuance.

---

## Guest Pass Mechanics

### What a guest pass does

When redeemed at booking, a guest pass applies a **$15 credit to the booking total**. The member selects the checkbox, the credit is deducted from the total before payment, and `discount_cents` on the booking is set to 1500.

Marketing copy: "Use a guest pass — save $15 on your next round with a friend."

### Issuance

Passes are issued in two scenarios:
1. **On membership activation** — when a user upgrades to Eagle or Ace, issue the correct number of passes (1 for Eagle, 2 for Ace) with `expires_at = now() + 1 year`.
2. **On membership renewal** — same logic, run annually. (Handled by the same code path that processes membership renewals.)

Issuance uses an admin client server action: `issueGuestPasses(userId, tier)`.

### Redemption at booking

In `BookingPaymentForm` (Stripe path) and `BookingForm` (non-Stripe path):

- After the user selects player count, query `guest_passes` for unexpired, unredeemed passes for this user.
- If any exist, show a checkbox: **"Use a guest pass — save $15 on this booking (X remaining this year)"**
- If checked, reduce `total` by $15.00 and pass `guestPassId` to the booking action.
- On confirm/payment: mark the pass as `redeemed_at = now()`, set `booking_id`, and set `discount_cents = 1500` on the booking row.

The guest pass checkbox only appears if: (a) the member has an unredeemed, unexpired pass, AND (b) there is more than 1 player selected.

**One-time-use enforcement:** Each pass row tracks `redeemed_at`. The query for available passes filters `redeemed_at IS NULL AND expires_at > now()`. Once a pass is redeemed it is permanently consumed — there is no un-redeem path. The booking action also performs a server-side check before writing, so the client-side count cannot be spoofed.

---

## Birthday Credit

### Collection at signup

Add a required `birthday` (date) field to `/signup` form, between the name and email fields. Label: "Date of birth". Type: `date` input. Store in `profiles.birthday` after email confirmation via the `handle_new_user` trigger or a post-signup profile upsert.

### Issuance

A daily cron job (or on-demand check at page load, similar to how monthly credits work) runs `issueIfBirthdayToday(userId)`:

1. Check `profiles.birthday` — if today matches month + day, proceed.
2. Check `member_credits` for a row with `type='birthday'` and `period = YYYY-MM-DD` (today's date) for this user. If exists, skip.
3. Insert a `member_credits` row:
   - `type = 'birthday'`
   - `amount_cents = 1000` (Eagle) or `2000` (Ace)
   - `period = today's date as YYYY-MM-DD`
   - `expires_at = today + 1 year`
   - `status = 'available'`

Birthday credit issuance is triggered on benefits page load — same on-demand pattern as `getAndIssueMemberCredits`. The `(user_id, type, period)` unique index on `member_credits` prevents duplicate issuance even if the page loads multiple times on the same day.

---

## `/app/benefits` Page

### Nav entry

Add to `src/lib/nav.ts` SIDEBAR_NAV_ITEMS only (bottom nav is already at 5 items — don't add there):

```ts
{ href: '/app/benefits', label: 'Benefits', icon: '🎁' }
```

Place it after Points in the sidebar.

### Data fetched server-side

```ts
// Bookings with fee data
bookings: id, platform_fee_cents, discount_cents, status, created_at (confirmed/completed)

// Points
fairway_points: amount (sum of positive = earned value)

// Member credits (all types)
member_credits: type, amount_cents, status, expires_at, created_at

// Guest passes
guest_passes: id, issued_at, expires_at, redeemed_at, booking_id

// Membership
memberships: tier, status, created_at
```

### Savings calculation

| Benefit | How savings are calculated |
|---------|---------------------------|
| Booking fee waivers | Count confirmed/completed bookings × $1.49 (Eagle/Ace never pay the fee) |
| Guest pass redemptions | Sum of `discount_cents` on bookings where a pass was used |
| Complimentary rounds used | Count `member_credits` rows with `type='free_round'` and `status='used'`, × average green fee (use $45 as a constant for now) |
| Birthday credit | Sum of `member_credits` rows with `type='birthday'` and `status='used'` |
| Points earned value | Sum of positive `fairway_points.amount` ÷ 100 |
| Monthly credits received | Sum of all `member_credits` rows with `type='monthly'` (issued, regardless of used/available) |

**Total saved** = booking fee savings + guest pass savings + free round value + birthday credits used + points value + monthly credits total.

### Page layout

```
[hero]
  "You've saved $X with TeeAhead"
  Subtitle: "Since joining [month year]"

[benefit cards — 2 column grid on desktop, 1 column mobile]

  Booking Fee Waivers
  ─────────────────────
  $X saved across Y rounds
  "Never pay a booking fee"

  Guest Passes
  ─────────────────────
  X of Y used this year
  [progress bar]
  Expires: [date]
  [badge if unused: "1 unused pass"]

  Complimentary Rounds
  ─────────────────────
  X of Y used this year
  [progress bar]

  Birthday Credit
  ─────────────────────
  $10 credit (Eagle) / $20 credit (Ace)
  Status: "Available — expires [date]" OR "Used" OR "Issued on [birthday month]"

  Fairway Points
  ─────────────────────
  X pts earned lifetime
  $Y value
  Current balance: X pts

  Monthly Credits
  ─────────────────────
  $X issued lifetime
  ($10/mo Eagle, $20/mo Ace)
```

Cards use the existing dark-green card style (`bg-[#1B4332]`, `bg-[#163d2a]`) consistent with the Points page.

---

## Copy fixes required

The following pages list "1 guest pass per year (at participating courses)" — update to just "1 guest pass per year" (the "at participating courses" qualifier is no longer accurate now that it's a booking-fee waiver, not a course-dependent benefit):

- `/app/membership` features list
- `/pricing` features list  
- `/waitlist/golfer` features list
- `/page.tsx` pricing section

---

## Affected files

| File | Change |
|------|--------|
| `supabase/migrations/057_*.sql` | profiles.birthday, bookings.discount_cents, guest_passes table |
| `src/app/(auth)/signup/page.tsx` | Add birthday field |
| `src/lib/nav.ts` | Add Benefits nav item |
| `src/app/actions/booking.ts` | Accept guestPassId, mark pass redeemed, write discount_cents |
| `src/app/actions/guestPasses.ts` | New: issueGuestPasses, getAvailablePasses |
| `src/app/actions/birthdayCredit.ts` | New: issueIfBirthdayToday |
| `src/components/BookingForm.tsx` | Guest pass checkbox + logic |
| `src/components/BookingPaymentForm.tsx` | Guest pass checkbox + logic |
| `src/app/app/benefits/page.tsx` | New page |
| `src/app/app/membership/page.tsx` | Copy: remove "(at participating courses)" |
| `src/app/pricing/page.tsx` | Same copy fix |
| `src/app/waitlist/golfer/page.tsx` | Same copy fix |
| `src/app/page.tsx` | Same copy fix |

---

## Out of scope

- Guest pass email notification to the guest (future)
- Priority booking window enforcement (separate feature)
- In-person lessons / concierge line (manual process for now)
- Retroactive savings calculation for bookings before this feature shipped (benefits page shows from the date the feature is live)

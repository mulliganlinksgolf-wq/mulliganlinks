# Tee Sheet Settings & Cart Selection Design

**Date:** 2026-05-09
**Status:** Approved

## Overview

Two connected features that share the same pricing data:

1. **Tee Sheet Settings page** — lets course staff edit hours, pricing tiers, and tee sheet config post-onboarding
2. **Cart selection in booking flow** — members choose walk or cart before confirming, price updates live; cart choice stored on the booking and visible on the tee sheet

---

## Feature 1: Tee Sheet Settings Page

### Location

New subpage at `/course/[slug]/tee-times/settings`. Accessible via a "Settings" link/button in the tee times section header or sidebar nav.

### Sections

**Hours of Operation**
- Reuse `src/components/onboarding/HoursEditor.tsx` directly
- Per-day rows: Mon–Sun, each with isOpen toggle, open time, close time
- Saves via upsert into `course_hours`

**Pricing Tiers**
- Reuse `src/components/onboarding/PricingEditor.tsx` directly
- Each row: rate name, green fee (cents), cart fee (cents), active toggle
- Add/remove rows supported
- Saves via upsert into `course_pricing`

**Tee Sheet Config**
- Fields: interval between tee times (minutes), max players per slot, advance booking days, cart policy (optional/required/none)
- Saves via upsert into `course_tee_sheet_config`

### Server Actions

New actions in `src/lib/actions/teeSheetSettings.ts`:
- `updateCourseHours(courseId, hours[])` — upsert into `course_hours`
- `updateCoursePricing(courseId, tiers[])` — upsert into `course_pricing`
- `updateTeeSheetConfig(courseId, config)` — upsert into `course_tee_sheet_config`

Each action validates that the authenticated user is staff for this course. Returns success/error for form feedback.

### UI

- Each section is a collapsible card with its own Save button (sections save independently)
- Success/error toast on save
- No migration needed — all target tables already exist from onboarding

---

## Feature 2: Cart Selection in Booking Flow

### Booking Flow Change

**Before:** Select tee time → Confirm booking

**After:** Select tee time → Choose walk or cart → Confirm booking

### Cart Selection Step

Shown between tee time selection and the confirmation screen.

**Walk option:**
- Label: "Walk"
- Price shown: green fee only (e.g. $45.00)

**Cart option:**
- Label: "Ride"
- Price shown: green fee + cart fee (e.g. $45.00 + $18.00 = $63.00)
- If cart fee is $0 for this pricing tier, collapse cart fee line

**Cart policy rules:**
- `cart_policy = "required"` → skip step, auto-select cart, show "Cart included" on confirmation
- `cart_policy = "none"` → skip step, auto-select walk, no cart line shown
- `cart_policy = "optional"` (default) → show the selection step

Price updates live as the member toggles between options. Selected price is what gets confirmed and charged (via Fairway Points or future Stripe flow).

### Database Change

New migration adds `cart_selected boolean default false` to `tee_time_bookings`. Also add `cart_fee_cents integer default 0` to store the cart fee at time of booking (so price is locked even if course later changes their rates).

### Tee Sheet View (Course Portal)

On the course's tee sheet/tee-times list view, bookings where `cart_selected = true` display a small Lucide `ShoppingCart` icon next to the booking. Allows staff to prep carts before golfers arrive.

### Pricing Tier Resolution

When the cart selection step renders, it needs to know the correct pricing tier for this tee time. Resolution order:
1. If the tee time was created with a specific `rate_name` reference, use that tier's `cart_fee_cents`
2. Otherwise fall back to the course's default pricing tier (display_order = 1)

---

## Shared Data Flow

```
course_pricing (rate_name, green_fee_cents, cart_fee_cents)
       ↓
Tee Sheet Settings page — staff edits tiers
       ↓
Booking flow — member selects walk/cart, sees live price
       ↓
tee_time_bookings (cart_selected, cart_fee_cents)
       ↓
Tee sheet view — cart icon shown for cart bookings
```

---

## Database Migration

```sql
-- Add cart fields to tee_time_bookings
ALTER TABLE tee_time_bookings
  ADD COLUMN cart_selected boolean NOT NULL DEFAULT false,
  ADD COLUMN cart_fee_cents integer NOT NULL DEFAULT 0;
```

No other schema changes needed.

---

## Error Handling

- If pricing tiers fail to load during cart selection step, default to showing green fee only with a note that cart pricing is unavailable
- If cart policy fails to load, default to `optional` (show the selection step)
- Settings page: each section saves independently — one section failing doesn't block others

---

## Testing

- Vitest unit tests for cart policy resolution logic and pricing tier fallback
- Playwright E2E: complete booking flow with cart selection — verify price updates live, cart icon appears on tee sheet after booking
- Playwright E2E: settings page — update hours, pricing, config; verify changes persist after page reload

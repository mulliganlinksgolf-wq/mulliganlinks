# Phone Booking Confirmation Email — Design Spec

**Date:** 2026-04-27
**Status:** Approved

## Problem

When a golfer calls a course to book a tee time, staff manually enters a walk-in booking via the course portal. Currently, no confirmation email is sent to the caller — there's no way to capture their email address at entry, and no way to send one after the fact.

## Solution Overview

1. Store `guest_email` on the `bookings` table
2. Add an optional email field to `WalkInBookingModal` — auto-sends confirmation on save if provided
3. Add a "✉ Send confirmation" button on tee sheet booking rows — lets staff send or resend at any time
4. New `sendPhoneBookingConfirmation()` email function tailored to phone-in bookings

---

## Section 1 — Data Layer

### Migration
- Add `guest_email TEXT` (nullable) to the `bookings` table
- No NOT NULL constraint — walk-in bookings without an email remain valid

### RPC: `create_walk_in_booking()`
- Add `p_guest_email TEXT DEFAULT NULL` parameter
- Writes to `bookings.guest_email` on insert

### Server Action: `updateBooking()`
- Add `guestEmail?: string` parameter
- Writes to `bookings.guest_email` — allows staff to add/correct email post-booking via EditBookingModal

---

## Section 2 — UI Changes

### WalkInBookingModal (`src/components/WalkInBookingModal.tsx`)
- Add optional **"Guest email"** text input below the existing phone field
- Placeholder: `guest@email.com`
- No validation gate — blank is fine
- On save: if email is provided, fire `sendPhoneBookingConfirmation()` after booking is created (fire-and-forget, does not block save)

### Tee Sheet Booking Rows (TeeSheetGrid)
- Each confirmed walk-in booking row gets a **"✉ Send confirmation"** button
  - Muted/secondary style — doesn't compete with check-in/no-show actions
  - If `guest_email` is stored: field pre-fills with stored value
  - If no `guest_email` stored: field is empty, staff types it in
- Clicking opens a **compact inline popover** with:
  - Single email input (pre-filled if available)
  - "Send" button
- On send: email fires, popover closes, button briefly shows **"✓ Sent"**
- Sending saves/updates `guest_email` on the booking for future resends

---

## Section 3 — Email

### New function: `sendPhoneBookingConfirmation()`
**File:** `src/lib/emails.ts`

**Parameters:**
```ts
{
  guestName: string
  guestEmail: string
  courseName: string
  teeTimeIso: string   // ISO string, formatted Detroit TZ
  players: number
  totalPaid: number    // cents
  paymentMethod: 'cash' | 'card' | 'unpaid'
}
```

**Content:**
- Matches existing TeeAhead email style (dark green header, inline HTML)
- Booking details table: date, time, players, amount paid, payment method
- Footer note: *"Booked by calling the course. Questions? Contact us at support@teeahead.com."*
- No points/membership copy (walk-in, non-app golfer)
- No Stripe receipt link (payment taken in person)

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/XXX_guest_email.sql` | Add `guest_email` to `bookings`; update `create_walk_in_booking` RPC |
| `src/lib/emails.ts` | Add `sendPhoneBookingConfirmation()` |
| `src/components/WalkInBookingModal.tsx` | Add optional email field; fire confirmation on save |
| `src/app/actions/teeTime.ts` | Add `guestEmail` param to `updateBooking()` |
| `src/app/course/[slug]/page.tsx` or `TeeSheetGrid.tsx` | Add "✉ Send confirmation" button + popover to walk-in booking rows |

---

## Out of Scope

- Sending confirmation for online (non-walk-in) bookings — already handled by `sendBookingConfirmation()`
- Email validation beyond basic browser input type="email"
- Delivery receipts / open tracking
- Stripe-linked receipts (payment taken in person, no payment intent)

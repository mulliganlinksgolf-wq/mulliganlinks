# Tee Time Trading — Member Marketplace (Path 2: Platform Credit)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let golfer members list tee times they can't use; other members claim them instantly; the original booker gets automatic TeeAhead platform credit — no Stripe, no cash, no course involvement.

**Architecture:** Pure matchmaking + credit layer on top of existing bookings. A Postgres RPC (`claim_listing`) handles atomic claim + credit issuance in a single transaction to prevent double-claims. No payment processor changes needed. Credit balance lives on `profiles.teeahead_credit_cents`. Course opts in via a toggle in their trading settings.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (RLS + RPC), Tailwind, Vitest

---

## Codebase Context (read before touching anything)

- **Migrations:** Latest is `047_course_referrals.sql` → next number is **048**
- **Auth pattern:** `createClient()` from `@/lib/supabase/server` for user-scoped queries; `createAdminClient()` from `@/lib/supabase/admin` to bypass RLS
- **Course portal auth gate:** `requireManager(slug)` from `@/lib/courseRole` — call at top of any manager-only page
- **Server actions:** `'use server'` at top of file, call supabase directly, return `{ error?: string }` objects — see `src/app/actions/contact.ts` for pattern
- **Member app nav:** defined in `src/lib/nav.ts` — two arrays: `SIDEBAR_NAV_ITEMS` and `BOTTOM_NAV_ITEMS`
- **Course portal nav:** hardcoded `allNavItems` array inside `src/app/course/[slug]/layout.tsx` — add new entries there
- **Bookings data shape:** `bookings` table has `id, user_id, status, total_paid (dollars, not cents), tee_times(id, scheduled_at, course_id, courses(name, trading_enabled, trading_min_hours_before))`
- **Dark member app theme:** background `#0f2d1d` / `#163d2a`, text white / `#8FA889`, accent `#E0A800`
- **Light course portal theme:** white cards, `#1B4332` header, `#6B7770` secondary text

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `supabase/migrations/048_tee_time_trading.sql` | All DB: tables, columns, RLS, claim RPC |
| Create | `src/lib/trading.ts` | Pure TS helpers: expiry calc, eligibility check, formatting |
| Create | `src/lib/__tests__/trading.test.ts` | Vitest unit tests for all lib functions |
| Create | `src/app/actions/trading.ts` | Server actions: createListing, claimListing, cancelListing, updateTradingSettings |
| Modify | `src/app/app/bookings/page.tsx` | Add "Can't make it?" link to upcoming booking cards |
| Create | `src/app/app/bookings/[bookingId]/list/page.tsx` | Member listing confirmation page |
| Create | `src/app/app/trading/page.tsx` | Member browse + claim feed |
| Create | `src/app/course/[slug]/trading/page.tsx` | Course trading board + settings |
| Modify | `src/lib/nav.ts` | Add Trading to member app nav |
| Modify | `src/app/course/[slug]/layout.tsx` | Add Trading to course portal nav |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/048_tee_time_trading.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/048_tee_time_trading.sql

-- 1. Credit balance on member profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS teeahead_credit_cents INTEGER NOT NULL DEFAULT 0;

-- 2. Trading settings on courses
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS trading_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trading_min_hours_before INTEGER NOT NULL DEFAULT 4;

-- 3. Listings table
CREATE TABLE public.tee_time_listings (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tee_time_id            UUID        NOT NULL REFERENCES public.tee_times(id) ON DELETE CASCADE,
  course_id              UUID        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  listed_by_member_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id             UUID        NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  credit_amount_cents    INTEGER     NOT NULL DEFAULT 0,
  status                 TEXT        NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active','claimed','cancelled','expired')),
  listed_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at             TIMESTAMPTZ NOT NULL,
  claimed_by_member_id   UUID        REFERENCES public.profiles(id),
  claimed_at             TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (booking_id)  -- one active listing per booking
);

-- 4. Transfer audit log (immutable — never updated)
CREATE TABLE public.tee_time_transfers (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id           UUID        NOT NULL REFERENCES public.tee_time_listings(id) ON DELETE CASCADE,
  from_member_id       UUID        NOT NULL REFERENCES public.profiles(id),
  to_member_id         UUID        NOT NULL REFERENCES public.profiles(id),
  course_id            UUID        NOT NULL REFERENCES public.courses(id),
  credit_issued_cents  INTEGER     NOT NULL DEFAULT 0,
  transferred_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Indexes
CREATE INDEX ON public.tee_time_listings (course_id, status);
CREATE INDEX ON public.tee_time_listings (listed_by_member_id);
CREATE INDEX ON public.tee_time_listings (expires_at) WHERE status = 'active';

-- 6. RLS
ALTER TABLE public.tee_time_listings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tee_time_transfers ENABLE ROW LEVEL SECURITY;

-- Any authenticated member can browse active listings for trading-enabled courses
CREATE POLICY "members_read_active_listings"
  ON public.tee_time_listings FOR SELECT TO authenticated
  USING (
    status = 'active'
    AND expires_at > now()
    AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id AND c.trading_enabled = true
    )
  );

-- Members can always read their own listings (all statuses)
CREATE POLICY "members_read_own_listings"
  ON public.tee_time_listings FOR SELECT TO authenticated
  USING (listed_by_member_id = auth.uid() OR claimed_by_member_id = auth.uid());

-- Members can create listings for their own bookings
CREATE POLICY "members_insert_listing"
  ON public.tee_time_listings FOR INSERT TO authenticated
  WITH CHECK (listed_by_member_id = auth.uid());

-- Members can cancel only their own active listings
CREATE POLICY "members_cancel_listing"
  ON public.tee_time_listings FOR UPDATE TO authenticated
  USING  (listed_by_member_id = auth.uid() AND status = 'active')
  WITH CHECK (status = 'cancelled');

-- Course staff can read all listings for their course
CREATE POLICY "course_staff_read_listings"
  ON public.tee_time_listings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.course_admins ca
      WHERE ca.course_id = tee_time_listings.course_id AND ca.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.crm_course_users cu
      WHERE cu.course_id = tee_time_listings.course_id AND cu.user_id = auth.uid()
    )
  );

-- Course staff can update (e.g. admin-cancel) listings for their course
CREATE POLICY "course_staff_update_listings"
  ON public.tee_time_listings FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.course_admins ca
      WHERE ca.course_id = tee_time_listings.course_id AND ca.user_id = auth.uid()
    )
  );

-- Members can read their own transfers
CREATE POLICY "members_read_transfers"
  ON public.tee_time_transfers FOR SELECT TO authenticated
  USING (from_member_id = auth.uid() OR to_member_id = auth.uid());

-- Course staff can read transfers for their course
CREATE POLICY "course_staff_read_transfers"
  ON public.tee_time_transfers FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.course_admins ca
      WHERE ca.course_id = tee_time_transfers.course_id AND ca.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.crm_course_users cu
      WHERE cu.course_id = tee_time_transfers.course_id AND cu.user_id = auth.uid()
    )
  );

-- 7. Atomic claim + credit RPC (prevents double-claims via row-level lock)
CREATE OR REPLACE FUNCTION public.claim_listing(
  p_listing_id  UUID,
  p_claimant_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_listing tee_time_listings%ROWTYPE;
BEGIN
  -- Atomic compare-and-swap: only succeeds if still active and not expired
  UPDATE tee_time_listings
  SET
    status                 = 'claimed',
    claimed_by_member_id   = p_claimant_id,
    claimed_at             = now(),
    updated_at             = now()
  WHERE
    id                    = p_listing_id
    AND status            = 'active'
    AND expires_at        > now()
    AND listed_by_member_id != p_claimant_id  -- can't claim your own listing
  RETURNING * INTO v_listing;

  -- If no row was updated, listing was already taken or expired
  IF v_listing.id IS NULL THEN
    RETURN jsonb_build_object('error', 'This time is no longer available.');
  END IF;

  -- Issue credit to original booker (only if booking had a value)
  IF v_listing.credit_amount_cents > 0 THEN
    UPDATE profiles
    SET teeahead_credit_cents = teeahead_credit_cents + v_listing.credit_amount_cents
    WHERE id = v_listing.listed_by_member_id;
  END IF;

  -- Immutable audit record
  INSERT INTO tee_time_transfers (
    listing_id, from_member_id, to_member_id, course_id, credit_issued_cents
  ) VALUES (
    v_listing.id,
    v_listing.listed_by_member_id,
    p_claimant_id,
    v_listing.course_id,
    v_listing.credit_amount_cents
  );

  RETURN jsonb_build_object(
    'success',      true,
    'credit_cents', v_listing.credit_amount_cents
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_listing TO authenticated;
```

- [ ] **Step 2: Apply migration**

```bash
npx supabase db push
```

Expected: migration applied, no errors. Verify in Supabase dashboard that `tee_time_listings` and `tee_time_transfers` tables exist, `profiles` has `teeahead_credit_cents`, `courses` has `trading_enabled` and `trading_min_hours_before`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/048_tee_time_trading.sql
git commit -m "feat: add tee time trading DB — listings, transfers, claim RPC, credit balance"
```

---

## Task 2: Core Library + Tests

**Files:**
- Create: `src/lib/trading.ts`
- Create: `src/lib/__tests__/trading.test.ts`

- [ ] **Step 1: Write the failing tests first**

```typescript
// src/lib/__tests__/trading.test.ts
import { describe, it, expect } from 'vitest'
import {
  calcListingExpiry,
  canCreateListing,
  formatCredit,
  isListingClaimable,
} from '@/lib/trading'
import type { TeeTimeListing } from '@/lib/trading'

describe('calcListingExpiry', () => {
  it('subtracts minHoursBefore from scheduled time', () => {
    const result = calcListingExpiry('2026-05-10T14:00:00.000Z', 4)
    expect(result.toISOString()).toBe('2026-05-10T10:00:00.000Z')
  })

  it('handles 2-hour minimum', () => {
    const result = calcListingExpiry('2026-05-10T08:00:00.000Z', 2)
    expect(result.toISOString()).toBe('2026-05-10T06:00:00.000Z')
  })
})

describe('canCreateListing', () => {
  // tee time 10 hours from now — comfortably eligible with 4h min
  const soon = new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString()
  // tee time 2 hours from now — too close for 4h minimum
  const tooClose = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
  // tee time in the past
  const past = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  it('returns true when all conditions met', () => {
    expect(canCreateListing({
      scheduledAt: soon,
      bookingStatus: 'confirmed',
      tradingEnabled: true,
      minHoursBefore: 4,
    })).toBe(true)
  })

  it('returns false when trading disabled on course', () => {
    expect(canCreateListing({
      scheduledAt: soon,
      bookingStatus: 'confirmed',
      tradingEnabled: false,
      minHoursBefore: 4,
    })).toBe(false)
  })

  it('returns false when booking is not confirmed', () => {
    expect(canCreateListing({
      scheduledAt: soon,
      bookingStatus: 'cancelled',
      tradingEnabled: true,
      minHoursBefore: 4,
    })).toBe(false)
  })

  it('returns false when tee time is within minHoursBefore', () => {
    expect(canCreateListing({
      scheduledAt: tooClose,
      bookingStatus: 'confirmed',
      tradingEnabled: true,
      minHoursBefore: 4,
    })).toBe(false)
  })

  it('returns false when tee time is in the past', () => {
    expect(canCreateListing({
      scheduledAt: past,
      bookingStatus: 'confirmed',
      tradingEnabled: true,
      minHoursBefore: 4,
    })).toBe(false)
  })
})

describe('formatCredit', () => {
  it('formats cents as dollar string', () => {
    expect(formatCredit(5000)).toBe('$50.00')
    expect(formatCredit(0)).toBe('$0.00')
    expect(formatCredit(2599)).toBe('$25.99')
    expect(formatCredit(100)).toBe('$1.00')
  })
})

describe('isListingClaimable', () => {
  const futureExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString()
  const pastExpiry   = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  const makeListing = (status: string, expires_at: string): TeeTimeListing =>
    ({ status, expires_at } as TeeTimeListing)

  it('returns true for active listing with future expiry', () => {
    expect(isListingClaimable(makeListing('active', futureExpiry))).toBe(true)
  })

  it('returns false for claimed listing', () => {
    expect(isListingClaimable(makeListing('claimed', futureExpiry))).toBe(false)
  })

  it('returns false for cancelled listing', () => {
    expect(isListingClaimable(makeListing('cancelled', futureExpiry))).toBe(false)
  })

  it('returns false for active listing past expiry', () => {
    expect(isListingClaimable(makeListing('active', pastExpiry))).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npx vitest run src/lib/__tests__/trading.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/trading'`

- [ ] **Step 3: Write the library**

```typescript
// src/lib/trading.ts

export interface TeeTimeListing {
  id: string
  tee_time_id: string
  course_id: string
  listed_by_member_id: string
  booking_id: string
  credit_amount_cents: number
  status: 'active' | 'claimed' | 'cancelled' | 'expired'
  listed_at: string
  expires_at: string
  claimed_by_member_id: string | null
  claimed_at: string | null
}

export interface TeeTimeTransfer {
  id: string
  listing_id: string
  from_member_id: string
  to_member_id: string
  course_id: string
  credit_issued_cents: number
  transferred_at: string
}

/**
 * The expiry time for a listing: `minHoursBefore` hours before the tee time.
 * After this point, unclaimed listings auto-expire (filtered out on read).
 */
export function calcListingExpiry(scheduledAt: string, minHoursBefore: number): Date {
  const ms = minHoursBefore * 60 * 60 * 1000
  return new Date(new Date(scheduledAt).getTime() - ms)
}

/**
 * Returns true if the member is allowed to create a listing for this booking.
 * All conditions must be met: trading enabled, booking confirmed, enough lead time.
 */
export function canCreateListing(params: {
  scheduledAt: string
  bookingStatus: string
  tradingEnabled: boolean
  minHoursBefore: number
  now?: Date
}): boolean {
  const { scheduledAt, bookingStatus, tradingEnabled, minHoursBefore, now = new Date() } = params
  if (!tradingEnabled) return false
  if (bookingStatus !== 'confirmed') return false
  const expiry = calcListingExpiry(scheduledAt, minHoursBefore)
  return expiry > now
}

/**
 * Format a credit balance in cents to a display string.
 * 5000 → "$50.00"
 */
export function formatCredit(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

/**
 * Returns true if a listing can still be claimed right now.
 */
export function isListingClaimable(listing: TeeTimeListing, now: Date = new Date()): boolean {
  return listing.status === 'active' && new Date(listing.expires_at) > now
}
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
npx vitest run src/lib/__tests__/trading.test.ts
```

Expected: 12 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/trading.ts src/lib/__tests__/trading.test.ts
git commit -m "feat: add trading lib — expiry calc, eligibility, formatCredit, isListingClaimable"
```

---

## Task 3: Server Actions

**Files:**
- Create: `src/app/actions/trading.ts`

- [ ] **Step 1: Create the server actions file**

```typescript
// src/app/actions/trading.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calcListingExpiry, canCreateListing } from '@/lib/trading'

// ─── Create Listing ───────────────────────────────────────────────────────────

export async function createListing(bookingId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()

  // Fetch the booking with its tee time and the course trading settings
  const { data: booking } = await admin
    .from('bookings')
    .select(`
      id, status, total_paid, user_id,
      tee_times (
        id, scheduled_at, course_id,
        courses ( trading_enabled, trading_min_hours_before )
      )
    `)
    .eq('id', bookingId)
    .single()

  if (!booking || booking.user_id !== user.id) return { error: 'Booking not found' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tt = booking.tee_times as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const course = tt?.courses as any

  const eligible = canCreateListing({
    scheduledAt: tt.scheduled_at,
    bookingStatus: booking.status,
    tradingEnabled: course?.trading_enabled ?? false,
    minHoursBefore: course?.trading_min_hours_before ?? 4,
  })

  if (!eligible) return { error: 'This booking is not eligible for listing. Make sure the course has trading enabled and the tee time is far enough away.' }

  const expiresAt = calcListingExpiry(
    tt.scheduled_at,
    course?.trading_min_hours_before ?? 4,
  )

  const { error } = await supabase.from('tee_time_listings').insert({
    tee_time_id:         tt.id,
    course_id:           tt.course_id,
    listed_by_member_id: user.id,
    booking_id:          bookingId,
    credit_amount_cents: Math.round((booking.total_paid as number) * 100),
    expires_at:          expiresAt.toISOString(),
  })

  if (error) {
    if (error.code === '23505') return { error: 'You already have an active listing for this booking.' }
    return { error: error.message }
  }

  revalidatePath('/app/bookings')
  revalidatePath('/app/trading')
  return {}
}

// ─── Claim Listing ────────────────────────────────────────────────────────────

export async function claimListing(
  listingId: string
): Promise<{ error?: string; creditCents?: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase.rpc('claim_listing', {
    p_listing_id:  listingId,
    p_claimant_id: user.id,
  })

  if (error) return { error: error.message }
  if (data?.error) return { error: data.error }

  revalidatePath('/app/trading')
  revalidatePath('/app/bookings')
  return { creditCents: data.credit_cents as number }
}

// ─── Cancel Listing ───────────────────────────────────────────────────────────

export async function cancelListing(listingId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('tee_time_listings')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', listingId)
    .eq('listed_by_member_id', user.id)
    .eq('status', 'active')

  if (error) return { error: error.message }

  revalidatePath('/app/bookings')
  revalidatePath('/app/trading')
  return {}
}

// ─── Update Course Trading Settings ──────────────────────────────────────────

export async function updateTradingSettings(
  courseId: string,
  settings: { trading_enabled: boolean; trading_min_hours_before: number }
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('courses')
    .update({ ...settings, updated_at: new Date().toISOString() })
    .eq('id', courseId)

  if (error) return { error: error.message }
  revalidatePath('/app/trading')
  return {}
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "trading"
```

Expected: no errors mentioning trading files.

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/trading.ts
git commit -m "feat: add trading server actions — createListing, claimListing, cancelListing, updateTradingSettings"
```

---

## Task 4: Member Bookings Page — Add "Can't Make It?" Link

**Files:**
- Modify: `src/app/app/bookings/page.tsx`

The current `BookingRow` component wraps the entire card in a `<Link>`. We need to add a small "Can't make it?" link for upcoming confirmed bookings. The cleanest approach: render a separate line below the card for upcoming bookings that links to the listing flow page. No client component needed.

- [ ] **Step 1: Open `src/app/app/bookings/page.tsx` and locate the `BookingRow` component (~line 18)**

The current component signature is:
```typescript
const BookingRow = ({ b, isUpcoming = false }: { b: any; isUpcoming?: boolean }) => (
```

- [ ] **Step 2: Replace the entire `BookingRow` component with this version that adds the listing link**

Find this block (the entire `BookingRow` const):
```typescript
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const BookingRow = ({ b, isUpcoming = false }: { b: any; isUpcoming?: boolean }) => (
    <Link
      href={`/app/bookings/${b.id}`}
      className="block border-b border-[#1d4c36] last:border-0 hover:bg-[#333]/30 transition-colors"
    >
      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-semibold text-white text-sm">
            {b.tee_times?.courses?.name ?? 'Course'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: isUpcoming ? '#8FA889' : '#aaa' }}>
            {new Date(b.tee_times?.scheduled_at).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}{' '}
            · {b.players} player{b.players !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-white text-sm">
            ${(b.total_paid as number).toFixed(2)}
          </p>
          <span
            className="text-[10px]"
            style={{
              color:
                b.status === 'confirmed'
                  ? '#8FA889'
                  : b.status === 'completed'
                  ? '#aaa'
                  : '#ef4444',
            }}
          >
            {b.status}
          </span>
        </div>
      </div>
    </Link>
  )
```

Replace with:
```typescript
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const BookingRow = ({ b, isUpcoming = false }: { b: any; isUpcoming?: boolean }) => (
    <div className="border-b border-[#1d4c36] last:border-0">
      <Link
        href={`/app/bookings/${b.id}`}
        className="block hover:bg-[#333]/30 transition-colors"
      >
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <p className="font-semibold text-white text-sm">
              {b.tee_times?.courses?.name ?? 'Course'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: isUpcoming ? '#8FA889' : '#aaa' }}>
              {new Date(b.tee_times?.scheduled_at).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}{' '}
              · {b.players} player{b.players !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-white text-sm">
              ${(b.total_paid as number).toFixed(2)}
            </p>
            <span
              className="text-[10px]"
              style={{
                color:
                  b.status === 'confirmed'
                    ? '#8FA889'
                    : b.status === 'completed'
                    ? '#aaa'
                    : '#ef4444',
              }}
            >
              {b.status}
            </span>
          </div>
        </div>
      </Link>
      {isUpcoming && b.status === 'confirmed' && (
        <div className="px-4 pb-2">
          <Link
            href={`/app/bookings/${b.id}/list`}
            className="text-[10px] text-[#8FA889] hover:text-white transition-colors"
          >
            Can&apos;t make it? List this time →
          </Link>
        </div>
      )}
    </div>
  )
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "bookings"
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/app/bookings/page.tsx
git commit -m "feat: add 'Can't make it?' link to upcoming booking cards"
```

---

## Task 5: Member Listing Flow Page

**Files:**
- Create: `src/app/app/bookings/[bookingId]/list/page.tsx`

This page shows booking details and a "Confirm Listing" button. On submit it calls `createListing`. On success it redirects to `/app/trading`.

- [ ] **Step 1: Create the page**

```typescript
// src/app/app/bookings/[bookingId]/list/page.tsx
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canCreateListing, calcListingExpiry, formatCredit } from '@/lib/trading'
import { createListing } from '@/app/actions/trading'

export default async function ListBookingPage({
  params,
}: {
  params: Promise<{ bookingId: string }>
}) {
  const { bookingId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: booking } = await admin
    .from('bookings')
    .select(`
      id, status, total_paid, user_id,
      tee_times (
        id, scheduled_at, course_id,
        courses ( name, trading_enabled, trading_min_hours_before )
      )
    `)
    .eq('id', bookingId)
    .single()

  if (!booking || booking.user_id !== user.id) notFound()

  // Check for existing active listing
  const { data: existingListing } = await supabase
    .from('tee_time_listings')
    .select('id')
    .eq('booking_id', bookingId)
    .eq('status', 'active')
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tt = booking.tee_times as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const course = tt?.courses as any

  const eligible = canCreateListing({
    scheduledAt: tt.scheduled_at,
    bookingStatus: booking.status,
    tradingEnabled: course?.trading_enabled ?? false,
    minHoursBefore: course?.trading_min_hours_before ?? 4,
  })

  const creditCents = Math.round((booking.total_paid as number) * 100)
  const expiresAt = eligible
    ? calcListingExpiry(tt.scheduled_at, course?.trading_min_hours_before ?? 4)
    : null

  const scheduledDate = new Date(tt.scheduled_at).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  })

  async function handleList() {
    'use server'
    const result = await createListing(bookingId)
    if (!result.error) redirect('/app/trading?listed=1')
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <Link href="/app/bookings" className="text-xs text-[#8FA889] hover:text-white">
          ← My Bookings
        </Link>
        <h1 className="text-2xl font-bold font-serif text-white italic mt-1">List This Time</h1>
        <p className="text-sm text-[#8FA889] mt-0.5">
          Another member claims it — you get credit instantly.
        </p>
      </div>

      {/* Booking summary */}
      <div className="rounded-xl p-5 space-y-1" style={{ background: '#163d2a' }}>
        <p className="text-xs text-[#8FA889] uppercase tracking-widest">Your booking</p>
        <p className="text-white font-semibold">{course?.name}</p>
        <p className="text-sm text-[#8FA889]">{scheduledDate}</p>
        <p className="text-sm text-[#8FA889]">
          Paid: {formatCredit(creditCents)}
        </p>
      </div>

      {existingListing ? (
        <div className="rounded-xl p-5" style={{ background: '#163d2a' }}>
          <p className="text-emerald-400 font-semibold text-sm">✓ Already listed</p>
          <p className="text-xs text-[#8FA889] mt-1">
            This time is already on the trading board. Check{' '}
            <Link href="/app/trading" className="underline hover:text-white">Available Times</Link>{' '}
            to see it.
          </p>
        </div>
      ) : !eligible ? (
        <div className="rounded-xl p-5" style={{ background: '#163d2a' }}>
          <p className="text-red-400 font-semibold text-sm">Not eligible for trading</p>
          <p className="text-xs text-[#8FA889] mt-1">
            {!course?.trading_enabled
              ? 'This course hasn\'t enabled member trading yet.'
              : 'This tee time is too soon to list — the window has passed.'}
          </p>
        </div>
      ) : (
        <>
          {/* Credit callout */}
          <div className="rounded-xl p-5" style={{ background: '#0f2d1d', border: '1px solid #1d4c36' }}>
            <p className="text-[10px] uppercase tracking-widest text-[#8FA889] mb-1">If claimed, you receive</p>
            <p className="text-3xl font-bold text-white">{formatCredit(creditCents)}</p>
            <p className="text-xs text-[#8FA889] mt-1">
              TeeAhead credit · usable at any partner course
            </p>
            {expiresAt && (
              <p className="text-[10px] text-[#8FA889]/60 mt-2">
                Listing expires {expiresAt.toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                })} if unclaimed
              </p>
            )}
          </div>

          <p className="text-xs text-[#8FA889]">
            If nobody claims it before the listing expires, your booking remains as-is and the
            course&apos;s normal cancellation policy applies.
          </p>

          <form action={handleList}>
            <button
              type="submit"
              className="w-full rounded-xl py-3.5 text-sm font-semibold text-[#0a0a0a] transition-colors"
              style={{ background: '#E0A800' }}
            >
              List This Time
            </button>
          </form>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "list"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/app/bookings/[bookingId]/list/page.tsx"
git commit -m "feat: member listing flow page — confirm and list a booking for trading"
```

---

## Task 6: Member Available Times Feed (Browse & Claim)

**Files:**
- Create: `src/app/app/trading/page.tsx`

This page shows all claimable listings and lets members claim in one tap. It also shows the member's current credit balance and any of their own active listings.

- [ ] **Step 1: Create the page**

```typescript
// src/app/app/trading/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCredit } from '@/lib/trading'
import { claimListing, cancelListing } from '@/app/actions/trading'

export default async function TradingPage({
  searchParams,
}: {
  searchParams: Promise<{ listed?: string; claimed?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profileRow },
    { data: availableListings },
    { data: myListings },
  ] = await Promise.all([
    supabase.from('profiles').select('teeahead_credit_cents').eq('id', user.id).single(),
    supabase
      .from('tee_time_listings')
      .select(`
        id, credit_amount_cents, expires_at, listed_at,
        profiles!listed_by_member_id ( full_name ),
        tee_times (
          scheduled_at,
          courses ( name )
        )
      `)
      .eq('status', 'active')
      .neq('listed_by_member_id', user.id)
      .order('expires_at', { ascending: true }),
    supabase
      .from('tee_time_listings')
      .select(`
        id, status, credit_amount_cents, expires_at,
        tee_times (
          scheduled_at,
          courses ( name )
        )
      `)
      .eq('listed_by_member_id', user.id)
      .order('listed_at', { ascending: false })
      .limit(5),
  ])

  const creditCents = profileRow?.teeahead_credit_cents ?? 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listings = (availableListings ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mine = (myListings ?? []) as any[]

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#aaa] font-sans mb-1">
          Member Exchange
        </p>
        <h1 className="text-2xl font-bold font-serif text-white italic">Available Times</h1>
        <p className="text-sm text-[#8FA889] mt-0.5">
          Tee times listed by other members — claim one to play.
        </p>
      </div>

      {/* Success banners */}
      {sp.listed === '1' && (
        <div className="rounded-xl px-4 py-3" style={{ background: '#163d2a' }}>
          <p className="text-emerald-400 text-sm font-semibold">✓ Your time is listed</p>
          <p className="text-xs text-[#8FA889] mt-0.5">
            You&apos;ll get notified and credited instantly when someone claims it.
          </p>
        </div>
      )}
      {sp.claimed === '1' && (
        <div className="rounded-xl px-4 py-3" style={{ background: '#163d2a' }}>
          <p className="text-emerald-400 text-sm font-semibold">✓ Time claimed — you&apos;re on the tee!</p>
          <p className="text-xs text-[#8FA889] mt-0.5">Show your booking confirmation at the pro shop.</p>
        </div>
      )}

      {/* Credit balance */}
      {creditCents > 0 && (
        <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: '#163d2a' }}>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-[#8FA889]">Your TeeAhead Credit</p>
            <p className="text-xl font-bold text-white">{formatCredit(creditCents)}</p>
          </div>
          <p className="text-xs text-[#8FA889] max-w-[160px] text-right">
            Applied automatically on your next booking
          </p>
        </div>
      )}

      {/* My active listings */}
      {mine.filter(l => l.status === 'active').length > 0 && (
        <section className="space-y-2">
          <p className="text-[8px] uppercase tracking-widest text-[#aaa]">My Active Listings</p>
          {mine.filter(l => l.status === 'active').map(l => (
            <div key={l.id} className="rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: '#163d2a' }}>
              <div>
                <p className="text-sm font-medium text-white">{l.tee_times?.courses?.name}</p>
                <p className="text-xs text-[#8FA889]">
                  {new Date(l.tee_times?.scheduled_at).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC',
                  })}
                </p>
                <p className="text-xs text-[#8FA889]">Credit if claimed: {formatCredit(l.credit_amount_cents)}</p>
              </div>
              <form action={async () => { 'use server'; await cancelListing(l.id) }}>
                <button type="submit" className="text-xs text-red-400 hover:text-red-300 transition-colors">
                  Cancel
                </button>
              </form>
            </div>
          ))}
        </section>
      )}

      {/* Available listings from other members */}
      <section className="space-y-2">
        <p className="text-[8px] uppercase tracking-widest text-[#aaa]">
          Available Times ({listings.length})
        </p>
        {listings.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={{ background: '#163d2a' }}>
            <p className="text-[#8FA889] text-sm">No times listed right now.</p>
            <p className="text-xs text-[#8FA889]/60 mt-1">
              Check back later or list your own from{' '}
              <Link href="/app/bookings" className="underline hover:text-white">My Bookings</Link>.
            </p>
          </div>
        ) : (
          listings.map(l => {
            const scheduledAt = new Date(l.tee_times?.scheduled_at)
            const expiresAt   = new Date(l.expires_at)
            const hoursLeft   = Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60))

            async function handleClaim() {
              'use server'
              const result = await claimListing(l.id)
              if (!result.error) redirect('/app/trading?claimed=1')
            }

            return (
              <div key={l.id} className="rounded-xl p-4 space-y-3" style={{ background: '#163d2a' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-semibold text-sm">{l.tee_times?.courses?.name}</p>
                    <p className="text-xs text-[#8FA889] mt-0.5">
                      {scheduledAt.toLocaleDateString('en-US', {
                        weekday: 'long', month: 'short', day: 'numeric',
                        hour: 'numeric', minute: '2-digit', timeZone: 'UTC',
                      })}
                    </p>
                    <p className="text-xs text-[#8FA889]/60 mt-0.5">
                      Listed by {l.profiles?.full_name?.split(' ')[0] ?? 'a member'}
                      {' · '}
                      {hoursLeft > 0 ? `${hoursLeft}h left` : 'Expiring soon'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{formatCredit(l.credit_amount_cents)}</p>
                    <p className="text-[10px] text-[#8FA889]">face value</p>
                  </div>
                </div>
                <form action={handleClaim}>
                  <button
                    type="submit"
                    className="w-full rounded-lg py-2.5 text-sm font-semibold text-[#0a0a0a] transition-colors"
                    style={{ background: '#E0A800' }}
                  >
                    Claim This Time →
                  </button>
                </form>
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "trading"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/app/trading/page.tsx
git commit -m "feat: member trading feed — browse available times, claim, cancel own listings, credit balance"
```

---

## Task 7: Course Portal Trading Board

**Files:**
- Create: `src/app/course/[slug]/trading/page.tsx`

Shows active listings, recent transfers, and a settings toggle. Manager-only.

- [ ] **Step 1: Create the page**

```typescript
// src/app/course/[slug]/trading/page.tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireManager } from '@/lib/courseRole'
import { formatCredit } from '@/lib/trading'
import { updateTradingSettings } from '@/app/actions/trading'

export default async function CourseTradingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  await requireManager(slug)

  const supabase = await createClient()
  const { data: course } = await supabase
    .from('courses')
    .select('id, name, trading_enabled, trading_min_hours_before')
    .eq('slug', slug)
    .single()
  if (!course) notFound()

  const admin = createAdminClient()
  const [{ data: activeListings }, { data: recentTransfers }] = await Promise.all([
    admin
      .from('tee_time_listings')
      .select(`
        id, credit_amount_cents, expires_at, listed_at,
        profiles!listed_by_member_id ( full_name ),
        tee_times ( scheduled_at )
      `)
      .eq('course_id', course.id)
      .eq('status', 'active')
      .order('expires_at', { ascending: true }),
    admin
      .from('tee_time_transfers')
      .select(`
        id, credit_issued_cents, transferred_at,
        from_profile:profiles!from_member_id ( full_name ),
        to_profile:profiles!to_member_id ( full_name )
      `)
      .eq('course_id', course.id)
      .order('transferred_at', { ascending: false })
      .limit(20),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listings   = (activeListings   ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transfers  = (recentTransfers  ?? []) as any[]

  async function handleSettingsUpdate(formData: FormData) {
    'use server'
    await updateTradingSettings(course!.id, {
      trading_enabled:           formData.get('trading_enabled') === 'on',
      trading_min_hours_before:  parseInt(formData.get('trading_min_hours_before') as string, 10),
    })
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-[#1A1A1A]">Member Trading Board</h1>
        <p className="text-sm text-[#6B7770] mt-1">
          Members can list tee times they can&apos;t use. Other members claim them. You keep your revenue — no refunds, no admin work.
        </p>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-[#1A1A1A]">Settings</h2>
        <form action={handleSettingsUpdate} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#1A1A1A]">Enable member trading</p>
              <p className="text-xs text-[#6B7770]">Allow members to list and claim tee times</p>
            </div>
            <input
              type="checkbox"
              name="trading_enabled"
              defaultChecked={course.trading_enabled}
              className="h-4 w-4 accent-[#1B4332]"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-[#1A1A1A]">
                Minimum hours before tee time
              </label>
              <p className="text-xs text-[#6B7770]">Listings expire this many hours before the tee time</p>
            </div>
            <select
              name="trading_min_hours_before"
              defaultValue={String(course.trading_min_hours_before)}
              className="border border-gray-200 rounded-md px-3 py-1.5 text-sm"
            >
              <option value="2">2 hours</option>
              <option value="4">4 hours</option>
              <option value="8">8 hours</option>
              <option value="24">24 hours</option>
            </select>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#1B4332] text-[#FAF7F2] text-sm font-semibold rounded-lg hover:bg-[#1B4332]/90 transition-colors"
          >
            Save Settings
          </button>
        </form>
      </div>

      {/* Active listings */}
      <div className="space-y-3">
        <h2 className="font-semibold text-[#1A1A1A]">
          Active Listings ({listings.length})
        </h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Member', 'Tee Time', 'Credit Value', 'Expires'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-[#6B7770] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {listings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[#6B7770]">
                    No active listings.{' '}
                    {!course.trading_enabled && 'Enable trading above to let members list their times.'}
                  </td>
                </tr>
              ) : listings.map(l => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-[#1A1A1A]">{l.profiles?.full_name ?? '—'}</td>
                  <td className="px-4 py-2.5 text-[#6B7770]">
                    {new Date(l.tee_times?.scheduled_at).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                      hour: 'numeric', minute: '2-digit', timeZone: 'UTC',
                    })}
                  </td>
                  <td className="px-4 py-2.5 text-[#1A1A1A] font-semibold">
                    {formatCredit(l.credit_amount_cents)}
                  </td>
                  <td className="px-4 py-2.5 text-[#6B7770] text-xs">
                    {new Date(l.expires_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent transfers */}
      <div className="space-y-3">
        <h2 className="font-semibold text-[#1A1A1A]">Recent Transfers</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['From', 'To', 'Credit Issued', 'Date'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-[#6B7770] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[#6B7770]">
                    No transfers yet.
                  </td>
                </tr>
              ) : transfers.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-[#1A1A1A]">{t.from_profile?.full_name ?? '—'}</td>
                  <td className="px-4 py-2.5 text-[#1A1A1A] font-medium">{t.to_profile?.full_name ?? '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                      {formatCredit(t.credit_issued_cents)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[#6B7770] text-xs">
                    {new Date(t.transferred_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "trading"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/course/[slug]/trading/page.tsx"
git commit -m "feat: course portal trading board — active listings, transfers, settings toggle"
```

---

## Task 8: Navigation Updates

**Files:**
- Modify: `src/lib/nav.ts`
- Modify: `src/app/course/[slug]/layout.tsx`

- [ ] **Step 1: Add Trading to member app sidebar nav**

In `src/lib/nav.ts`, find `SIDEBAR_NAV_ITEMS` and add the Trading entry after Leagues:

```typescript
export const SIDEBAR_NAV_ITEMS: NavItem[] = [
  { href: '/app',          label: 'Dashboard', icon: '⛳', exact: true },
  { href: '/app/courses',  label: 'Courses',   icon: '🗺️' },
  { href: '/app/bookings', label: 'Bookings',  icon: '📋' },
  { href: '/app/leagues',  label: 'Leagues',   icon: '🏆' },
  { href: '/app/trading',  label: 'Exchange',  icon: '🔄' },  // ← add this line
  { href: '/app/points',   label: 'Points',    icon: '⭐' },
  { href: '/app/card',     label: 'My Card',   icon: '🃏' },
  { href: '/app/billing',  label: 'Billing',   icon: '💳' },
  { href: '/app/profile',  label: 'Profile',   icon: '👤' },
]
```

Leave `BOTTOM_NAV_ITEMS` unchanged (it's already at 5 items — the max for mobile).

- [ ] **Step 2: Add Trading to course portal nav**

In `src/app/course/[slug]/layout.tsx`, find `allNavItems` and add the Trading entry after Leagues:

```typescript
  const allNavItems = [
    { href: `/course/${slug}`,           label: 'Tee Sheet',  managerOnly: false },
    { href: `/course/${slug}/check-in`,  label: 'Check-in',   managerOnly: false },
    { href: `/course/${slug}/bookings`,  label: 'Bookings',   managerOnly: false },
    { href: `/course/${slug}/members`,   label: 'Members',    managerOnly: false },
    { href: `/course/${slug}/payments`,  label: 'Payments',   managerOnly: true },
    { href: `/course/${slug}/dashboard`, label: 'Dashboard',  managerOnly: true },
    { href: `/course/${slug}/reports`,   label: 'Reports',    managerOnly: true },
    { href: `/course/${slug}/leagues`,   label: 'Leagues',    managerOnly: true },
    { href: `/course/${slug}/trading`,   label: 'Trading',    managerOnly: true },  // ← add this line
    { href: `/course/${slug}/billing`,   label: 'Billing',    managerOnly: true },
    { href: `/course/${slug}/settings`,  label: 'Settings',   managerOnly: true },
    { href: `/course/${slug}/install`,   label: 'Install',    managerOnly: true },
  ]
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -E "nav|layout"
```

Expected: no errors.

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```

Expected: all tests pass, including the 12 new trading tests.

- [ ] **Step 5: Final commit**

```bash
git add src/lib/nav.ts "src/app/course/[slug]/layout.tsx"
git commit -m "feat: add Trading/Exchange to member app sidebar and course portal nav"
```

---

## End-to-End Test Checklist (Manual — Prod)

After deploying, verify this flow on `pilot-course` (Fieldstone Golf Club):

- [ ] Course manager navigates to `/course/pilot-course/trading` — sees Trading Board page with Settings
- [ ] Manager toggles trading on, saves — `trading_enabled = true` in DB
- [ ] Member logs in, goes to `/app/bookings` — sees "Can't make it? List this time →" on a confirmed upcoming booking
- [ ] Member clicks link → sees `/app/bookings/[id]/list` with credit amount shown
- [ ] Member clicks "List This Time" → redirected to `/app/trading?listed=1`
- [ ] `/app/trading` shows success banner and the listing under "My Active Listings"
- [ ] Second member logs in → navigates to `/app/trading` → sees the listing in Available Times
- [ ] Second member clicks "Claim This Time →" → redirected to `/app/trading?claimed=1`
- [ ] Course portal → Trading board now shows the transfer in Recent Transfers table
- [ ] Original member's profile: `teeahead_credit_cents` incremented by the booking amount
- [ ] `/app/trading` for original member shows the credit balance callout

---

## Memory / Context Notes for New Session

- **Payment model:** Path 2 — platform credit only. No Stripe. No cash. Credit is `teeahead_credit_cents` on `profiles` table, auto-issued by the `claim_listing` Postgres RPC.
- **Atomicity:** The `claim_listing` RPC prevents race conditions. Two simultaneous claims: only one UPDATE succeeds (WHERE status='active' acts as compare-and-swap).
- **Expiry:** Listings are filtered out at read time (`expires_at > now()`). No background job needed — expired listings simply stop appearing. A future cleanup migration can batch-update status for audit hygiene.
- **Course opt-in:** `courses.trading_enabled = false` by default. Course must enable via Trading Board settings.
- **Credit display:** Credit balance shown on `/app/trading` page. Future: also show in member app header or profile.
- **What's NOT built here:** push notifications, email alerts, watchlist/alert preferences. Those are a follow-on sprint.

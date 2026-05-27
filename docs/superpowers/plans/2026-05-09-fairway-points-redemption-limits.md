# Fairway Points — Redemption Limits & Course Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-course redemption controls for Fairway Points and complimentary round tracking for Eagle/Ace members, with full GM admin UI and enforcement in the booking flow.

**Architecture:** New `course_redemption_settings` table (one row per course, defaults apply if absent) plus two new columns on `memberships` (`comp_rounds_remaining`, `comp_rounds_reset_at`) and two on `bookings` (`redemption_type`, `course_id`). Enforcement lives in a pure helper lib (`src/lib/redemption.ts`) called from `confirmBooking`. BookingForm gains a comp-round toggle and a free-round-via-points option as new mutually exclusive payment modes. Course admin gets a new Rewards settings page.

**Tech Stack:** Next.js App Router, Supabase (PostgREST), Vitest, TypeScript, Tailwind CSS, shadcn/ui (Button, Input, Label, Card)

---

## File Map

**Create:**
- `supabase/migrations/058_redemption_limits.sql`
- `src/lib/redemption.ts` — getRedemptionSettings, checkRedemptionAllowed, resetCompRoundsIfNeeded
- `src/test/redemption-limits.test.ts`
- `src/components/course/RewardsSettingsForm.tsx`
- `src/app/course/[slug]/settings/rewards/page.tsx`

**Modify:**
- `src/app/actions/booking.ts` — add redemptionType param, enforcement, comp round decrement, course_id on insert
- `src/components/BookingForm.tsx` — comp round toggle + free round option
- `src/app/app/book/[teeTimeId]/page.tsx` — fetch comp rounds + settings, pass to BookingForm
- `src/app/app/points/page.tsx` — add comp rounds stat
- `src/app/app/benefits/page.tsx` — add comp rounds card with strikethrough
- `src/app/course/[slug]/settings/page.tsx` — add Rewards link

---

## Task 1: DB Migration

**Files:**
- Create: `supabase/migrations/058_redemption_limits.sql`

- [ ] **Step 1: Write the migration**

```sql
-- 058_redemption_limits.sql

create table course_redemption_settings (
  course_id               uuid    primary key references courses(id) on delete cascade,
  points_threshold        int     not null default 5000,
  max_redemptions_fairway int     not null default 1,
  max_redemptions_eagle   int     not null default 2,
  max_redemptions_ace     int     not null default 3,
  blackout_dates          date[]  not null default '{}',
  eligible_slot_start     time    default null,
  eligible_slot_end       time    default null,
  monthly_redemption_cap  int     default null,
  notice_hours            int     not null default 48,
  updated_at              timestamptz not null default now()
);

alter table memberships
  add column comp_rounds_remaining int         not null default 0,
  add column comp_rounds_reset_at  timestamptz;

alter table bookings
  add column redemption_type text check (redemption_type in ('points', 'complimentary')),
  add column course_id       uuid references courses(id);

-- Backfill existing active memberships
update memberships set
  comp_rounds_remaining = case
    when tier = 'ace'   then 2
    when tier = 'eagle' then 1
    else 0
  end,
  comp_rounds_reset_at = now() + interval '1 year'
where status = 'active';
```

- [ ] **Step 2: Apply the migration**

```bash
npx supabase db push
```

Expected: migration applies cleanly with no errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/058_redemption_limits.sql
git commit -m "feat(db): redemption limits schema — course_redemption_settings, comp rounds, redemption_type"
```

---

## Task 2: Enforcement Library + Tests

**Files:**
- Create: `src/lib/redemption.ts`
- Create: `src/test/redemption-limits.test.ts`

- [ ] **Step 1: Write the failing tests**

`src/test/redemption-limits.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { checkRedemptionAllowed } from '@/lib/redemption'

const NOW      = new Date('2026-05-09T12:00:00Z')
const FUTURE   = new Date('2026-05-12T10:00:00Z').toISOString() // 3 days out — clears 48h notice
const TOO_SOON = new Date('2026-05-09T14:00:00Z').toISOString() // 2 hours out

const DEFAULT_SETTINGS = {
  points_threshold: 5000,
  max_redemptions_fairway: 1,
  max_redemptions_eagle: 2,
  max_redemptions_ace: 3,
  blackout_dates: [] as string[],
  eligible_slot_start: null as string | null,
  eligible_slot_end: null as string | null,
  monthly_redemption_cap: null as number | null,
  notice_hours: 48,
}

const BASE = {
  courseId: 'course-1',
  userId: 'user-1',
  tier: 'eagle',
  teeTimeAt: FUTURE,
  membershipCreatedAt: '2025-01-01T00:00:00Z',
  redemptionType: 'points' as const,
  pointsBalance: 6000,
}

// Build a supabase mock. bookingsCallResults[0] = seasonal query count,
// bookingsCallResults[1] = monthly query count.
function buildMock({
  settings = DEFAULT_SETTINGS as typeof DEFAULT_SETTINGS | null,
  bookingsCallResults = [{ count: 0 }, { count: 0 }],
}: {
  settings?: typeof DEFAULT_SETTINGS | null
  bookingsCallResults?: Array<{ count: number }>
} = {}) {
  let bookingsIdx = 0
  return {
    from: vi.fn((table: string) => {
      if (table === 'course_redemption_settings') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: settings, error: null }),
        }
      }
      if (table === 'bookings') {
        const result = bookingsCallResults[bookingsIdx++] ?? { count: 0 }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          then: (resolve: (v: { count: number; error: null }) => void) =>
            resolve({ count: result.count, error: null }),
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
    }),
  }
}

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW) })
afterEach(() => vi.useRealTimers())

describe('notice period', () => {
  it('blocks when tee time is less than notice_hours away', async () => {
    const result = await checkRedemptionAllowed(buildMock() as never, { ...BASE, teeTimeAt: TOO_SOON })
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('48 hours') })
  })

  it('passes when tee time is far enough out', async () => {
    const result = await checkRedemptionAllowed(buildMock() as never, BASE)
    expect(result).toMatchObject({ ok: true })
  })
})

describe('blackout dates', () => {
  it('blocks on a blackout date', async () => {
    const s = { ...DEFAULT_SETTINGS, blackout_dates: ['2026-05-12'] }
    const result = await checkRedemptionAllowed(buildMock({ settings: s }) as never, BASE)
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('not eligible') })
  })

  it('passes on a non-blackout date', async () => {
    const s = { ...DEFAULT_SETTINGS, blackout_dates: ['2026-05-13'] }
    const result = await checkRedemptionAllowed(buildMock({ settings: s }) as never, BASE)
    expect(result).toMatchObject({ ok: true })
  })
})

describe('eligible slot window', () => {
  it('blocks when tee time is outside the window', async () => {
    // FUTURE tee time is 10:00 UTC; window is 14:00–18:00
    const s = { ...DEFAULT_SETTINGS, eligible_slot_start: '14:00', eligible_slot_end: '18:00' }
    const result = await checkRedemptionAllowed(buildMock({ settings: s }) as never, BASE)
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('14:00') })
  })

  it('skips window check when both times are null', async () => {
    const result = await checkRedemptionAllowed(buildMock() as never, BASE)
    expect(result).toMatchObject({ ok: true })
  })
})

describe('points threshold', () => {
  it('blocks when balance is below threshold', async () => {
    const result = await checkRedemptionAllowed(buildMock() as never, { ...BASE, pointsBalance: 3000 })
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('5,000 points') })
  })

  it('passes when balance meets threshold', async () => {
    const result = await checkRedemptionAllowed(buildMock() as never, { ...BASE, pointsBalance: 5000 })
    expect(result).toMatchObject({ ok: true })
  })

  it('skips threshold check for complimentary redemption', async () => {
    const result = await checkRedemptionAllowed(buildMock() as never, {
      ...BASE,
      redemptionType: 'complimentary',
      pointsBalance: 0,
    })
    expect(result).toMatchObject({ ok: true })
  })
})

describe('seasonal cap', () => {
  it('blocks when eagle member has hit seasonal cap (2)', async () => {
    const mock = buildMock({ bookingsCallResults: [{ count: 2 }, { count: 0 }] })
    const result = await checkRedemptionAllowed(mock as never, BASE)
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('redemption limit') })
  })

  it('passes when under seasonal cap', async () => {
    const mock = buildMock({ bookingsCallResults: [{ count: 1 }, { count: 0 }] })
    const result = await checkRedemptionAllowed(mock as never, BASE)
    expect(result).toMatchObject({ ok: true })
  })

  it('skips seasonal cap check for complimentary redemption', async () => {
    const mock = buildMock({ bookingsCallResults: [{ count: 99 }, { count: 0 }] })
    const result = await checkRedemptionAllowed(mock as never, {
      ...BASE,
      redemptionType: 'complimentary',
    })
    expect(result).toMatchObject({ ok: true })
  })
})

describe('monthly cap', () => {
  it('blocks when course monthly cap is reached', async () => {
    const s = { ...DEFAULT_SETTINGS, monthly_redemption_cap: 5 }
    const mock = buildMock({ settings: s, bookingsCallResults: [{ count: 0 }, { count: 5 }] })
    const result = await checkRedemptionAllowed(mock as never, BASE)
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('monthly redemption limit') })
  })

  it('skips monthly cap check when cap is null', async () => {
    const mock = buildMock({ bookingsCallResults: [{ count: 0 }, { count: 999 }] })
    const result = await checkRedemptionAllowed(mock as never, BASE)
    expect(result).toMatchObject({ ok: true })
  })

  it('applies monthly cap to complimentary redemptions too', async () => {
    const s = { ...DEFAULT_SETTINGS, monthly_redemption_cap: 3 }
    const mock = buildMock({ settings: s, bookingsCallResults: [{ count: 3 }] })
    const result = await checkRedemptionAllowed(mock as never, {
      ...BASE,
      redemptionType: 'complimentary',
    })
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('monthly redemption limit') })
  })
})
```

- [ ] **Step 2: Run tests — confirm they all fail**

```bash
npx vitest run src/test/redemption-limits.test.ts
```

Expected: all fail with `Cannot find module '@/lib/redemption'`.

- [ ] **Step 3: Write `src/lib/redemption.ts`**

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'

export type RedemptionCheckResult = { ok: true } | { ok: false; error: string }

type RedemptionSettings = {
  points_threshold: number
  max_redemptions_fairway: number
  max_redemptions_eagle: number
  max_redemptions_ace: number
  blackout_dates: string[]
  eligible_slot_start: string | null
  eligible_slot_end: string | null
  monthly_redemption_cap: number | null
  notice_hours: number
}

const DEFAULTS: RedemptionSettings = {
  points_threshold: 5000,
  max_redemptions_fairway: 1,
  max_redemptions_eagle: 2,
  max_redemptions_ace: 3,
  blackout_dates: [],
  eligible_slot_start: null,
  eligible_slot_end: null,
  monthly_redemption_cap: null,
  notice_hours: 48,
}

export const COMP_DEFAULT: Record<string, number> = { eagle: 1, ace: 2 }

const TIER_MAX_KEY: Record<string, keyof RedemptionSettings> = {
  fairway: 'max_redemptions_fairway',
  eagle:   'max_redemptions_eagle',
  ace:     'max_redemptions_ace',
}

export async function getRedemptionSettings(
  supabase: SupabaseClient,
  courseId: string,
): Promise<RedemptionSettings> {
  const { data } = await supabase
    .from('course_redemption_settings')
    .select('*')
    .eq('course_id', courseId)
    .single()
  return (data as RedemptionSettings | null) ?? DEFAULTS
}

export async function checkRedemptionAllowed(
  supabase: SupabaseClient,
  {
    courseId,
    userId,
    tier,
    teeTimeAt,
    membershipCreatedAt,
    redemptionType,
    pointsBalance,
  }: {
    courseId: string
    userId: string
    tier: string
    teeTimeAt: string
    membershipCreatedAt: string
    redemptionType: 'points' | 'complimentary'
    pointsBalance: number
  },
): Promise<RedemptionCheckResult> {
  const s = await getRedemptionSettings(supabase, courseId)
  const teeDate = new Date(teeTimeAt)
  const now = new Date()

  // Notice period
  const hoursUntil = (teeDate.getTime() - now.getTime()) / 3_600_000
  if (hoursUntil < s.notice_hours) {
    return { ok: false, error: `Redemptions must be booked at least ${s.notice_hours} hours in advance.` }
  }

  // Blackout date
  const teeDateStr = teeDate.toISOString().slice(0, 10)
  if (s.blackout_dates.includes(teeDateStr)) {
    return { ok: false, error: 'This date is not eligible for redemptions at this course.' }
  }

  // Eligible slot window
  if (s.eligible_slot_start && s.eligible_slot_end) {
    const teeHHMM = teeDate.toISOString().slice(11, 16)
    if (teeHHMM < s.eligible_slot_start || teeHHMM > s.eligible_slot_end) {
      return {
        ok: false,
        error: `Redemptions at this course are only available ${s.eligible_slot_start}–${s.eligible_slot_end}.`,
      }
    }
  }

  if (redemptionType === 'points') {
    // Points threshold
    if (pointsBalance < s.points_threshold) {
      return {
        ok: false,
        error: `You need ${s.points_threshold.toLocaleString()} points to redeem a free round here.`,
      }
    }

    // Seasonal cap (membership anniversary year)
    const maxKey = TIER_MAX_KEY[tier] ?? 'max_redemptions_fairway'
    const maxAllowed = s[maxKey] as number

    const memberSince = new Date(membershipCreatedAt)
    const yearStart = new Date(memberSince)
    yearStart.setFullYear(now.getFullYear())
    if (yearStart > now) yearStart.setFullYear(now.getFullYear() - 1)

    const { count: seasonCount } = await (supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('redemption_type', 'points')
      .gte('created_at', yearStart.toISOString()) as unknown as Promise<{ count: number | null }>)

    if ((seasonCount ?? 0) >= maxAllowed) {
      return { ok: false, error: "You've reached your redemption limit at this course for this membership year." }
    }
  }

  // Monthly cap (both redemption types count)
  if (s.monthly_redemption_cap !== null) {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const { count: monthCount } = await (supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', courseId)
      .in('redemption_type', ['points', 'complimentary'])
      .gte('created_at', monthStart) as unknown as Promise<{ count: number | null }>)

    if ((monthCount ?? 0) >= s.monthly_redemption_cap) {
      return { ok: false, error: 'This course has reached its monthly redemption limit. Try again next month.' }
    }
  }

  return { ok: true }
}

// Lazily resets comp rounds when anniversary has passed. Safe to call on
// every booking — no-ops if reset_at is still in the future.
export async function resetCompRoundsIfNeeded(
  supabase: SupabaseClient,
  userId: string,
  tier: string,
): Promise<number> {
  const { data: membership } = await supabase
    .from('memberships')
    .select('comp_rounds_remaining, comp_rounds_reset_at')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (!membership) return 0

  const resetAt = membership.comp_rounds_reset_at
    ? new Date(membership.comp_rounds_reset_at as string)
    : null

  if (!resetAt || resetAt > new Date()) {
    return membership.comp_rounds_remaining as number
  }

  const newResetAt = new Date(resetAt)
  while (newResetAt <= new Date()) {
    newResetAt.setFullYear(newResetAt.getFullYear() + 1)
  }

  const newRemaining = COMP_DEFAULT[tier] ?? 0
  await supabase
    .from('memberships')
    .update({
      comp_rounds_remaining: newRemaining,
      comp_rounds_reset_at: newResetAt.toISOString(),
    })
    .eq('user_id', userId)
    .eq('status', 'active')

  return newRemaining
}
```

- [ ] **Step 4: Run tests — confirm they all pass**

```bash
npx vitest run src/test/redemption-limits.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/redemption.ts src/test/redemption-limits.test.ts
git commit -m "feat(redemption): enforcement helpers with full test coverage"
```

---

## Task 3: Update confirmBooking

**Files:**
- Modify: `src/app/actions/booking.ts`

- [ ] **Step 1: Extend the tee time select to include `scheduled_at`**

Find this line (around line 155–158):
```typescript
  const { data: teeTime } = await supabase
    .from('tee_times')
    .select('id, available_players, status, course_id')
    .eq('id', teeTimeId)
    .single()
```

Replace with:
```typescript
  const { data: teeTime } = await supabase
    .from('tee_times')
    .select('id, available_players, status, course_id, scheduled_at')
    .eq('id', teeTimeId)
    .single()
```

- [ ] **Step 2: Add `redemptionType` to the function signature**

Find the destructured params object (lines ~125–151). Add `redemptionType` to both the destructure and the type:

```typescript
export async function confirmBooking({
  teeTimeId,
  userId,
  players,
  subtotal,
  discount,
  pointsRedeemed,
  creditsRedeemedCents,
  rainCheckId,
  total,
  pointsEarned,
  tier,
  guestPassId,
  redemptionType,
}: {
  teeTimeId: string
  userId: string
  players: number
  subtotal: number
  discount: number
  pointsRedeemed: number
  creditsRedeemedCents?: number
  rainCheckId?: string
  total: number
  pointsEarned: number
  tier: string
  guestPassId?: string
  redemptionType?: 'points' | 'complimentary'
}) {
```

- [ ] **Step 3: Add enforcement block after the guest pass validation, before the booking insert**

Find the comment `// Create booking` (around line 183). Insert the following block immediately before it:

```typescript
  // Redemption enforcement — runs for both complimentary and points free-round paths
  if (redemptionType === 'points' || redemptionType === 'complimentary') {
    const { checkRedemptionAllowed, resetCompRoundsIfNeeded } = await import('@/lib/redemption')

    // Fetch membership for comp balance + anniversary date
    const { data: membership } = await supabase
      .from('memberships')
      .select('comp_rounds_remaining, created_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (redemptionType === 'complimentary') {
      const remaining = await resetCompRoundsIfNeeded(supabase, userId, tier)
      if (remaining <= 0) return { error: 'No complimentary rounds remaining.' }
    }

    // Fetch actual points balance server-side (don't trust client value)
    let pointsBalance = 0
    if (redemptionType === 'points') {
      const { data: pointsRows } = await supabase
        .from('fairway_points')
        .select('amount')
        .eq('user_id', userId)
      pointsBalance = (pointsRows ?? []).reduce((s, r) => s + (r.amount as number), 0)
    }

    const check = await checkRedemptionAllowed(supabase, {
      courseId: teeTime.course_id as string,
      userId,
      tier,
      teeTimeAt: teeTime.scheduled_at as string,
      membershipCreatedAt: membership?.created_at ?? new Date().toISOString(),
      redemptionType,
      pointsBalance,
    })
    if (!check.ok) return { error: check.error }
  }
```

- [ ] **Step 4: Add `course_id` and `redemption_type` to the booking insert**

Find the booking insert object (around line 185–197). Add the two new fields:

```typescript
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      tee_time_id: teeTimeId,
      user_id: userId,
      players,
      total_paid: adjustedTotal,
      status: 'confirmed',
      points_awarded: pointsEarned,
      discount_cents: discountCents,
      guest_pass_id: verifiedPassId,
      course_id: teeTime.course_id,
      redemption_type: redemptionType ?? null,
    })
    .select('id')
    .single()
```

- [ ] **Step 5: Add comp round decrement and update points reason after the booking insert**

After the `if (bookingError || !booking)` error check, find the existing points deduction block:

```typescript
  if (pointsRedeemed > 0) {
    await supabase.from('fairway_points').insert({
      user_id: userId,
      course_id: teeTime.course_id,
      booking_id: booking.id,
      amount: -pointsRedeemed,
      reason: 'Points redeemed at booking',
    })
  }
```

Replace with:

```typescript
  if (pointsRedeemed > 0) {
    await supabase.from('fairway_points').insert({
      user_id: userId,
      course_id: teeTime.course_id,
      booking_id: booking.id,
      amount: -pointsRedeemed,
      reason: redemptionType === 'points' ? 'Free round redeemed' : 'Points redeemed at booking',
    })
  }

  // Supabase doesn't support inline arithmetic in .update(); fetch and decrement explicitly
  if (redemptionType === 'complimentary') {
    const { data: mem } = await supabase
      .from('memberships')
      .select('comp_rounds_remaining')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()
    if (mem) {
      await supabase
        .from('memberships')
        .update({ comp_rounds_remaining: (mem.comp_rounds_remaining as number) - 1 })
        .eq('user_id', userId)
        .eq('status', 'active')
    }
  }
```

- [ ] **Step 6: Run existing tests to confirm nothing is broken**

```bash
npx vitest run src/test/check-in-points.test.ts
```

Expected: all existing tests still pass (the new param `redemptionType` is optional and defaults to undefined).

- [ ] **Step 7: Commit**

```bash
git add src/app/actions/booking.ts
git commit -m "feat(booking): enforce redemption limits and track comp round usage"
```

---

## Task 4: Course Admin Rewards Tab

**Files:**
- Create: `src/components/course/RewardsSettingsForm.tsx`
- Create: `src/app/course/[slug]/settings/rewards/page.tsx`
- Modify: `src/app/course/[slug]/settings/page.tsx`

- [ ] **Step 1: Write `src/components/course/RewardsSettingsForm.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RewardsSettings {
  course_id: string
  points_threshold: number
  max_redemptions_fairway: number
  max_redemptions_eagle: number
  max_redemptions_ace: number
  blackout_dates: string[]
  eligible_slot_start: string | null
  eligible_slot_end: string | null
  monthly_redemption_cap: number | null
  notice_hours: number
}

export function RewardsSettingsForm({
  courseId,
  initial,
}: {
  courseId: string
  initial: RewardsSettings | null
}) {
  const defaults = {
    points_threshold: 5000,
    max_redemptions_fairway: 1,
    max_redemptions_eagle: 2,
    max_redemptions_ace: 3,
    blackout_dates: [] as string[],
    eligible_slot_start: '',
    eligible_slot_end: '',
    monthly_redemption_cap: '',
    notice_hours: 48,
  }

  const [form, setForm] = useState({
    points_threshold: initial?.points_threshold ?? defaults.points_threshold,
    max_redemptions_fairway: initial?.max_redemptions_fairway ?? defaults.max_redemptions_fairway,
    max_redemptions_eagle: initial?.max_redemptions_eagle ?? defaults.max_redemptions_eagle,
    max_redemptions_ace: initial?.max_redemptions_ace ?? defaults.max_redemptions_ace,
    blackout_dates: initial?.blackout_dates ?? defaults.blackout_dates,
    eligible_slot_start: initial?.eligible_slot_start ?? defaults.eligible_slot_start,
    eligible_slot_end: initial?.eligible_slot_end ?? defaults.eligible_slot_end,
    monthly_redemption_cap: initial?.monthly_redemption_cap?.toString() ?? defaults.monthly_redemption_cap,
    notice_hours: initial?.notice_hours ?? defaults.notice_hours,
  })
  const [newBlackout, setNewBlackout] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  function setField<K extends keyof typeof form>(key: K, val: typeof form[K]) {
    setForm(f => ({ ...f, [key]: val }))
    setSaved(false)
  }

  function addBlackout() {
    if (!newBlackout || form.blackout_dates.includes(newBlackout)) return
    setField('blackout_dates', [...form.blackout_dates, newBlackout].sort())
    setNewBlackout('')
  }

  function removeBlackout(date: string) {
    setField('blackout_dates', form.blackout_dates.filter(d => d !== date))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      course_id: courseId,
      points_threshold: form.points_threshold,
      max_redemptions_fairway: form.max_redemptions_fairway,
      max_redemptions_eagle: form.max_redemptions_eagle,
      max_redemptions_ace: form.max_redemptions_ace,
      blackout_dates: form.blackout_dates,
      eligible_slot_start: form.eligible_slot_start || null,
      eligible_slot_end: form.eligible_slot_end || null,
      monthly_redemption_cap: form.monthly_redemption_cap ? parseInt(form.monthly_redemption_cap, 10) : null,
      notice_hours: form.notice_hours,
      updated_at: new Date().toISOString(),
    }

    const { error: err } = await supabase
      .from('course_redemption_settings')
      .upsert(payload, { onConflict: 'course_id' })

    setSaving(false)
    if (err) { setError(err.message); return }
    setSaved(true)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Points & Caps */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader><CardTitle className="text-sm font-semibold text-[#1A1A1A]">Points & Caps</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="pts_threshold" className="text-xs text-[#6B7770]">Points needed for one free round</Label>
            <Input
              id="pts_threshold"
              type="number"
              min={1}
              value={form.points_threshold}
              onChange={e => setField('points_threshold', parseInt(e.target.value, 10) || 5000)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-[#6B7770]">Max point redemptions per season</Label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {(['fairway', 'eagle', 'ace'] as const).map(t => (
                <div key={t}>
                  <Label htmlFor={`max_${t}`} className="text-[10px] text-[#6B7770] capitalize">{t}</Label>
                  <Input
                    id={`max_${t}`}
                    type="number"
                    min={0}
                    value={form[`max_redemptions_${t}`]}
                    onChange={e => setField(`max_redemptions_${t}`, parseInt(e.target.value, 10) || 0)}
                    className="mt-0.5"
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="monthly_cap" className="text-xs text-[#6B7770]">Monthly redemption cap</Label>
            <Input
              id="monthly_cap"
              type="number"
              min={0}
              placeholder="No limit"
              value={form.monthly_redemption_cap}
              onChange={e => setField('monthly_redemption_cap', e.target.value)}
              className="mt-1"
            />
            <p className="text-[10px] text-[#aaa] mt-1">Leave blank for no limit. Suggested: 10% of your average monthly rounds.</p>
          </div>
        </CardContent>
      </Card>

      {/* Booking Rules */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader><CardTitle className="text-sm font-semibold text-[#1A1A1A]">Booking Rules</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-[#6B7770]">Blackout dates</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="date"
                value={newBlackout}
                onChange={e => setNewBlackout(e.target.value)}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={addBlackout} className="shrink-0">Add</Button>
            </div>
            {form.blackout_dates.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.blackout_dates.map(d => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-sans bg-[#1B4332] text-white"
                  >
                    {d}
                    <button type="button" onClick={() => removeBlackout(d)} className="opacity-60 hover:opacity-100">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div>
            <Label className="text-xs text-[#6B7770]">Eligible tee time window (leave blank for all times)</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div>
                <Label htmlFor="slot_start" className="text-[10px] text-[#6B7770]">From</Label>
                <Input
                  id="slot_start"
                  type="time"
                  value={form.eligible_slot_start ?? ''}
                  onChange={e => setField('eligible_slot_start', e.target.value)}
                  className="mt-0.5"
                />
              </div>
              <div>
                <Label htmlFor="slot_end" className="text-[10px] text-[#6B7770]">To</Label>
                <Input
                  id="slot_end"
                  type="time"
                  value={form.eligible_slot_end ?? ''}
                  onChange={e => setField('eligible_slot_end', e.target.value)}
                  className="mt-0.5"
                />
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="notice_hours" className="text-xs text-[#6B7770]">Advance notice required (hours)</Label>
            <Input
              id="notice_hours"
              type="number"
              min={0}
              value={form.notice_hours}
              onChange={e => setField('notice_hours', parseInt(e.target.value, 10) || 0)}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={saving} className="bg-[#1B4332] text-white hover:bg-[#163d2a]">
        {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save rewards settings'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Write `src/app/course/[slug]/settings/rewards/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { requireManager } from '@/lib/courseRole'
import { RewardsSettingsForm } from '@/components/course/RewardsSettingsForm'

export default async function RewardsSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  await requireManager(slug)
  const supabase = await createClient()

  const { data: course } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', slug)
    .single()
  if (!course) notFound()

  const { data: settings } = await supabase
    .from('course_redemption_settings')
    .select('*')
    .eq('course_id', course.id)
    .single()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-[#1A1A1A]">Rewards Settings</h1>
        <p className="text-sm text-[#6B7770] mt-1">
          Control how members earn and redeem free rounds at your course.
        </p>
      </div>
      <RewardsSettingsForm courseId={course.id} initial={settings} />
    </div>
  )
}
```

- [ ] **Step 3: Add Rewards link to the existing settings page**

In `src/app/course/[slug]/settings/page.tsx`, add a Rewards link card after the Team card. The file ends around line 43 with the Team card. Add:

```tsx
      <div className="bg-white rounded-xl ring-1 ring-black/5 p-5 flex items-center justify-between">
        <div>
          <p className="font-semibold text-[#1A1A1A] text-sm">Rewards & redemption</p>
          <p className="text-xs text-[#6B7770] mt-0.5">Set point thresholds, blackout dates, and redemption limits.</p>
        </div>
        <Link
          href={`/course/${slug}/settings/rewards`}
          className="text-sm font-medium text-[#1B4332] hover:underline"
        >
          Manage →
        </Link>
      </div>
```

Place it immediately after the Team card div (before the closing `</div>` of the outer `space-y-6` div).

- [ ] **Step 4: Commit**

```bash
git add src/components/course/RewardsSettingsForm.tsx \
        src/app/course/\[slug\]/settings/rewards/page.tsx \
        src/app/course/\[slug\]/settings/page.tsx
git commit -m "feat(course): rewards settings tab with all six GM controls"
```

---

## Task 5: BookingForm Updates

**Files:**
- Modify: `src/components/BookingForm.tsx`

The existing form handles partial point offsets (100 pts = $1 offset). This task adds two new exclusive modes: comp round toggle and free-round-via-points. The partial offset slider remains unchanged.

- [ ] **Step 1: Add new props to BookingForm**

Find the existing props interface and destructure. Add three new optional props:

```typescript
export function BookingForm({
  teeTime,
  tier,
  pointsBalance,
  creditBalanceCents = 0,
  userId,
  availablePasses = [],
  compRoundsRemaining = 0,
  compRoundsResetAt,
  pointsThreshold = 5000,
}: {
  teeTime: TeeTime
  tier: string
  pointsBalance: number
  creditBalanceCents?: number
  userId: string
  availablePasses?: { id: string; expires_at: string }[]
  compRoundsRemaining?: number
  compRoundsResetAt?: string | null
  pointsThreshold?: number
}) {
```

- [ ] **Step 2: Add state for the two new modes**

After the existing `useState` declarations, add:

```typescript
  const [useCompRound, setUseCompRound] = useState(false)
  const [useFreeRound, setUseFreeRound] = useState(false)
```

- [ ] **Step 3: Add mutual exclusion handlers**

Add these two handler functions after the existing state declarations:

```typescript
  function handleCompRoundToggle(checked: boolean) {
    setUseCompRound(checked)
    if (checked) { setUseRound(false); setUsePoints(false) }
  }

  function handleFreeRoundToggle(checked: boolean) {
    setUseFreeRound(checked)
    if (checked) { setUseCompRound(false); setUsePoints(false) }
  }
```

- [ ] **Step 4: Update the total/pointsEarned calculation**

Find the existing calculation block:
```typescript
  const multiplier = MULTIPLIER[tier] ?? 1
  const subtotal = teeTime.base_price * players
  ...
  const total = Math.max(0, afterRainCheck - pointsValue)
  const pointsEarned = Math.floor(total * multiplier)
```

Replace it entirely with:

```typescript
  const multiplier = MULTIPLIER[tier] ?? 1
  const subtotal = teeTime.base_price * players

  // Free round modes zero out the total regardless of other discounts
  const isFreeRound = useCompRound || useFreeRound
  const guestDiscount = useGuestPass && !isFreeRound ? 15 : 0
  const creditsValue = useCredits && !isFreeRound
    ? Math.min(creditBalanceCents / 100, subtotal - guestDiscount)
    : 0
  const afterCredits = subtotal - guestDiscount - creditsValue
  const rainCheckValue = rainCheck && !isFreeRound
    ? Math.min(rainCheck.amountCents / 100, afterCredits)
    : 0
  const afterRainCheck = afterCredits - rainCheckValue
  const pointsValue = usePoints && !isFreeRound
    ? Math.min(pointsBalance / 100, afterRainCheck)
    : 0

  const total = isFreeRound ? 0 : Math.max(0, afterRainCheck - pointsValue)
  const pointsEarned = isFreeRound ? 0 : Math.floor(total * multiplier)
  const pointsRedeemed = useFreeRound
    ? pointsThreshold
    : usePoints
      ? Math.round(pointsValue * 100)
      : 0
```

- [ ] **Step 5: Update handleSubmit to pass redemptionType**

Find the `confirmBooking` call inside `handleSubmit`. Update the arguments:

```typescript
      const result = await confirmBooking({
        teeTimeId: teeTime.id,
        userId,
        players,
        subtotal,
        discount: 0,
        pointsRedeemed,
        creditsRedeemedCents: useCredits && !isFreeRound ? Math.round(creditsValue * 100) : 0,
        rainCheckId: rainCheck?.id,
        total,
        pointsEarned,
        tier,
        guestPassId: useGuestPass && availablePasses[0] && !isFreeRound ? availablePasses[0].id : undefined,
        redemptionType: useCompRound ? 'complimentary' : useFreeRound ? 'points' : undefined,
      })
```

- [ ] **Step 6: Add the UI for comp round toggle and free round option**

Find where the existing payment options are rendered in the JSX (the `usePoints` toggle section). Add the two new sections **above** the existing points toggle:

```tsx
        {/* Complimentary round toggle — Eagle/Ace only */}
        {compRoundsRemaining > 0 && (
          <div className="flex items-center justify-between py-2 border-b border-[#e5e7eb]">
            <div>
              <p className="text-sm font-medium text-[#1A1A1A]">Use complimentary round</p>
              <p className="text-[11px] text-[#6B7770]">
                {compRoundsRemaining} remaining
                {compRoundsResetAt && ` · resets ${new Date(compRoundsResetAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
              </p>
            </div>
            <input
              type="checkbox"
              checked={useCompRound}
              onChange={e => handleCompRoundToggle(e.target.checked)}
              className="w-4 h-4 accent-[#1B4332]"
            />
          </div>
        )}

        {/* Free round via points */}
        {!useCompRound && pointsBalance >= pointsThreshold && (
          <div className="flex items-center justify-between py-2 border-b border-[#e5e7eb]">
            <div>
              <p className="text-sm font-medium text-[#1A1A1A]">Redeem free round</p>
              <p className="text-[11px] text-[#6B7770]">{pointsThreshold.toLocaleString()} pts · green fee covered</p>
            </div>
            <input
              type="checkbox"
              checked={useFreeRound}
              onChange={e => handleFreeRoundToggle(e.target.checked)}
              className="w-4 h-4 accent-[#1B4332]"
            />
          </div>
        )}
```

- [ ] **Step 7: Commit**

```bash
git add src/components/BookingForm.tsx
git commit -m "feat(booking-form): comp round toggle and free round redemption option"
```

---

## Task 6: Book Page Updates

**Files:**
- Modify: `src/app/app/book/[teeTimeId]/page.tsx`

The page needs to fetch comp round data from membership and the course's points threshold, then pass them to BookingForm.

- [ ] **Step 1: Extend the membership select and add a settings fetch**

Find the existing membership select (around line 29–35):
```typescript
  const { data: membership } = await supabase
    .from('memberships')
    .select('tier')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  const tier = membership?.tier ?? 'free'
```

Replace with:
```typescript
  const { data: membership } = await supabase
    .from('memberships')
    .select('tier, comp_rounds_remaining, comp_rounds_reset_at')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  const tier = membership?.tier ?? 'free'
  const course = teeTime.courses as any
  const stripeEnabled = course?.stripe_charges_enabled === true

  // Compute display-correct comp rounds (handle anniversary reset without writing)
  const COMP_DEFAULT: Record<string, number> = { eagle: 1, ace: 2 }
  const resetAt = membership?.comp_rounds_reset_at ? new Date(membership.comp_rounds_reset_at) : null
  const compRoundsRemaining = resetAt && resetAt < new Date()
    ? (COMP_DEFAULT[tier] ?? 0)
    : (membership?.comp_rounds_remaining ?? 0)
```

- [ ] **Step 2: Fetch the course's points threshold in the parallel Promise.all**

Find the existing `Promise.all` block (around line 41–45):
```typescript
  const [{ data: pointsRows }, creditBalanceCents, availablePasses] = await Promise.all([
    supabase.from('fairway_points').select('amount').eq('user_id', user.id),
    getAndIssueMemberCredits(user.id, tier),
    getAvailablePasses(user.id),
  ])
```

Replace with:
```typescript
  const [{ data: pointsRows }, creditBalanceCents, availablePasses, { data: redemptionSettings }] = await Promise.all([
    supabase.from('fairway_points').select('amount').eq('user_id', user.id),
    getAndIssueMemberCredits(user.id, tier),
    getAvailablePasses(user.id),
    supabase
      .from('course_redemption_settings')
      .select('points_threshold')
      .eq('course_id', course?.id)
      .single(),
  ])

  const pointsThreshold = (redemptionSettings as { points_threshold: number } | null)?.points_threshold ?? 5000
```

- [ ] **Step 3: Remove the duplicate `course` and `stripeEnabled` declarations**

After the previous step, `course` and `stripeEnabled` were moved up. Delete these lines if they still appear below the membership block:
```typescript
  const course = teeTime.courses as any
  const stripeEnabled = course?.stripe_charges_enabled === true
```

- [ ] **Step 4: Pass new props to BookingForm**

Find the `<BookingForm ...>` JSX and add the three new props:
```tsx
        <BookingForm
          teeTime={teeTime as any}
          tier={tier}
          pointsBalance={pointsBalance}
          creditBalanceCents={creditBalanceCents}
          userId={user.id}
          availablePasses={availablePasses}
          compRoundsRemaining={compRoundsRemaining}
          compRoundsResetAt={membership?.comp_rounds_reset_at}
          pointsThreshold={pointsThreshold}
        />
```

- [ ] **Step 5: Commit**

```bash
git add src/app/app/book/\[teeTimeId\]/page.tsx
git commit -m "feat(book-page): pass comp rounds and points threshold to BookingForm"
```

---

## Task 7: Member-Facing UX

**Files:**
- Modify: `src/app/app/points/page.tsx`
- Modify: `src/app/app/benefits/page.tsx`

### Points page

- [ ] **Step 1: Extend the membership select to include comp round fields**

In `src/app/app/points/page.tsx`, find:
```typescript
  const { data: membership } = await supabase
    .from('memberships')
    .select('tier')
    .eq('user_id', user!.id)
    .eq('status', 'active')
    .single()

  const tier = membership?.tier ?? 'free'
  const earnRate = tier === 'ace' ? '2×' : tier === 'eagle' ? '1.5×' : '1×'
```

Replace with:
```typescript
  const { data: membership } = await supabase
    .from('memberships')
    .select('tier, comp_rounds_remaining, comp_rounds_reset_at')
    .eq('user_id', user!.id)
    .eq('status', 'active')
    .single()

  const tier = membership?.tier ?? 'free'
  const earnRate = tier === 'ace' ? '2×' : tier === 'eagle' ? '1.5×' : '1×'
  const isPaid = tier === 'eagle' || tier === 'ace'

  const COMP_DEFAULT: Record<string, number> = { eagle: 1, ace: 2 }
  const resetAt = membership?.comp_rounds_reset_at ? new Date(membership.comp_rounds_reset_at) : null
  const compRoundsRemaining = resetAt && resetAt < new Date()
    ? (COMP_DEFAULT[tier] ?? 0)
    : (membership?.comp_rounds_remaining ?? 0)
  const compResetDisplay = resetAt && resetAt > new Date()
    ? resetAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null
```

- [ ] **Step 2: Add comp rounds stat to the stats bar JSX**

In the stats bar `<div className="flex items-end gap-6 flex-wrap">`, add a new stat after the `earnRate` div:

```tsx
            {isPaid && (
              <div>
                <p className="text-2xl font-bold font-serif text-white leading-none">{compRoundsRemaining}</p>
                <p className="text-[10px] font-sans mt-1" style={{ color: '#8FA889' }}>
                  comp round{compRoundsRemaining !== 1 ? 's' : ''} left
                  {compResetDisplay && ` · resets ${compResetDisplay}`}
                </p>
              </div>
            )}
```

### Benefits page

- [ ] **Step 3: Extend the membership select to include comp round fields**

In `src/app/app/benefits/page.tsx`, find:
```typescript
  const { data: membership } = await supabase
    .from('memberships')
    .select('tier, status, created_at')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()
```

Replace with:
```typescript
  const { data: membership } = await supabase
    .from('memberships')
    .select('tier, status, created_at, comp_rounds_remaining, comp_rounds_reset_at')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()
```

- [ ] **Step 4: Compute comp round display values**

After the existing `const tier = ...` and `const isPaid = ...` lines, add:

```typescript
  const COMP_DEFAULT_ALLOTMENT: Record<string, number> = { eagle: 1, ace: 2 }
  const compAllotment = COMP_DEFAULT_ALLOTMENT[tier] ?? 0
  const compResetAt = membership?.comp_rounds_reset_at
    ? new Date(membership.comp_rounds_reset_at)
    : null
  const compRoundsRemaining = compResetAt && compResetAt < new Date()
    ? compAllotment
    : (membership?.comp_rounds_remaining ?? 0)
  const compRoundsUsed = compAllotment - compRoundsRemaining
```

- [ ] **Step 5: Add the Complimentary Rounds card to the benefits grid**

In the grid (`<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">`), add a new `BenefitCard` after the Guest Passes card:

```tsx
        {/* Complimentary rounds */}
        {isPaid && (
          <BenefitCard title="Complimentary Rounds">
            <div className="space-y-1.5">
              {Array.from({ length: compAllotment }, (_, i) => {
                const isUsed = i < compRoundsUsed
                return (
                  <div key={i} className={`flex items-center gap-2 text-xs font-sans ${isUsed ? 'opacity-40' : ''}`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isUsed ? 'bg-[#555]' : 'bg-[#8FA889]'}`} />
                    <span className={isUsed ? 'line-through text-[#555]' : 'text-[#ddd]'}>
                      Round {i + 1}
                    </span>
                  </div>
                )
              })}
            </div>
            {compResetAt && compResetAt > new Date() && (
              <p className="text-[10px] font-sans mt-2" style={{ color: '#555' }}>
                Resets {compResetAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            )}
          </BenefitCard>
        )}

        {/* Fairway upgrade prompt */}
        {!isPaid && (
          <BenefitCard title="Free Rounds">
            <p className="text-xs font-sans text-[#8FA889]">
              Earn 5,000 points for a free round at participating courses.
            </p>
            <p className="text-[10px] font-sans mt-1" style={{ color: '#555' }}>
              Upgrade to Eagle or Ace for included complimentary rounds.
            </p>
          </BenefitCard>
        )}
```

- [ ] **Step 6: Run the full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/app/app/points/page.tsx src/app/app/benefits/page.tsx
git commit -m "feat(member-ux): comp rounds stat on points page, strikethrough card on benefits"
```

---

## Done

All seven tasks deliver a complete, working implementation. Verify end-to-end:

1. Run `npm run build` — no TypeScript errors
2. As an Eagle member, open `/app/book/[teeTimeId]` — confirm comp round toggle appears
3. Toggle comp round on — confirm total shows $0 and points section hides
4. Submit booking — confirm `redemption_type = 'complimentary'` in DB and comp_rounds_remaining decrements
5. Open `/course/[slug]/settings/rewards` — confirm form loads, add a blackout date, save, reload — confirm it persists
6. On a blackout date, attempt a redemption booking — confirm error message appears
7. Open `/app/points` as Eagle — confirm comp rounds stat appears
8. Open `/app/benefits` as Eagle — confirm Complimentary Rounds card with used rounds struck through

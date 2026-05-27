# Tee Sheet Settings & Cart Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Tee Sheet Settings page so course staff can edit hours, pricing, and tee sheet config post-onboarding; add cart selection (walk vs. ride) to the member booking flow with live price updates and a cart icon on the staff tee sheet.

**Architecture:** Settings page reuses existing `HoursEditor` and `PricingEditor` onboarding components with new server actions. Cart selection adds `cart_selected` + `cart_fee_cents` to the `bookings` table, a new `CartSelector` client component in the booking flow, updates to `confirmBooking`, and a cart icon in `TeeSheetGrid`.

**Tech Stack:** Next.js App Router, Supabase (migration + admin client), Lucide React (ShoppingCart icon), Tailwind CSS, Vitest

---

## File Map

**New files:**
- `supabase/migrations/063_bookings_cart.sql`
- `src/lib/actions/teeSheetSettings.ts`
- `src/app/course/[slug]/tee-times/settings/page.tsx`
- `src/app/course/[slug]/tee-times/settings/TeeSheetSettingsForm.tsx`
- `src/components/CartSelector.tsx`
- `src/test/tee-sheet-settings-actions.test.ts`
- `src/test/cart-booking.test.ts`

**Modified files:**
- `src/app/app/book/[teeTimeId]/page.tsx` — load cart policy + pricing, pass to BookingForm
- `src/components/BookingForm.tsx` — add cartSelected state + CartSelector + pass to confirmBooking
- `src/app/actions/booking.ts` — add cartSelected + cartFeeCents params, save to bookings row
- `src/components/course/TeeSheetGrid.tsx` — show ShoppingCart icon on cart bookings

---

## Task 1: Database migration — add cart fields to bookings

**Files:**
- Create: `supabase/migrations/063_bookings_cart.sql`

- [ ] **Step 1: Create migration file**

```sql
-- Add cart selection fields to bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS cart_selected boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cart_fee_cents integer NOT NULL DEFAULT 0;
```

- [ ] **Step 2: Apply migration**

```bash
cd /Users/barris/Desktop/MulliganLinks && npx supabase db push 2>&1 | tail -10
```
Expected: migration applied successfully.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/063_bookings_cart.sql
git commit -m "feat(db): add cart_selected and cart_fee_cents to bookings"
```

---

## Task 2: Tee Sheet Settings server actions + tests

**Files:**
- Create: `src/lib/actions/teeSheetSettings.ts`
- Create: `src/test/tee-sheet-settings-actions.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/test/tee-sheet-settings-actions.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

let hoursUpsertArgs: unknown[] | null = null
let pricingDeleteArgs: unknown | null = null
let pricingInsertArgs: unknown[] | null = null
let configUpsertArgs: unknown | null = null

function buildAdminMock() {
  hoursUpsertArgs = null
  pricingDeleteArgs = null
  pricingInsertArgs = null
  configUpsertArgs = null

  return {
    from: (table: string) => ({
      upsert: (args: unknown) => {
        if (table === 'course_hours') hoursUpsertArgs = args as unknown[]
        if (table === 'course_tee_sheet_config') configUpsertArgs = args
        return { error: null }
      },
      delete: () => ({
        eq: (col: string, val: unknown) => {
          if (table === 'course_pricing') pricingDeleteArgs = { col, val }
          return { error: null }
        },
      }),
      insert: (args: unknown) => {
        if (table === 'course_pricing') pricingInsertArgs = args as unknown[]
        return { error: null }
      },
      select: () => ({
        eq: () => ({
          single: () => ({ data: { role: 'admin' }, error: null }),
        }),
      }),
    }),
    auth: { getUser: async () => ({ data: { user: { id: 'user-1' } } }) },
  }
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => buildAdminMock(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => buildAdminMock(),
}))

import { updateCourseHours, updateCoursePricing, updateTeeSheetConfig } from '@/lib/actions/teeSheetSettings'

describe('updateCourseHours', () => {
  it('upserts hours for all 7 days', async () => {
    const hours = Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      isOpen: true,
      openTime: '07:00',
      closeTime: '18:00',
    }))
    await updateCourseHours('course-1', hours)
    expect(Array.isArray(hoursUpsertArgs)).toBe(true)
    expect((hoursUpsertArgs as unknown[]).length).toBe(7)
  })
})

describe('updateCoursePricing', () => {
  it('deletes existing rows then inserts new ones', async () => {
    const pricing = [
      { rateName: 'Weekday 18-hole', greenFeeCents: 6500, cartFeeCents: 1800, displayOrder: 0 },
    ]
    await updateCoursePricing('course-1', pricing)
    expect(pricingDeleteArgs).not.toBeNull()
    expect(Array.isArray(pricingInsertArgs)).toBe(true)
  })
})

describe('updateTeeSheetConfig', () => {
  it('upserts tee sheet config', async () => {
    await updateTeeSheetConfig('course-1', {
      intervalMinutes: 8,
      maxPlayers: 4,
      advanceBookingDays: 7,
      cartPolicy: 'optional',
    })
    expect(configUpsertArgs).not.toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /Users/barris/Desktop/MulliganLinks && npx vitest run src/test/tee-sheet-settings-actions.test.ts 2>&1 | tail -10
```
Expected: fail — `updateCourseHours` not found.

- [ ] **Step 3: Create teeSheetSettings.ts**

```typescript
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { MANAGER_ROLES } from '@/lib/courseRole'

async function requireCourseManager(courseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const admin = createAdminClient()
  const [{ data: profile }, { data: courseAdmin }, { data: courseUser }] = await Promise.all([
    admin.from('profiles').select('is_admin').eq('id', user.id).single(),
    admin.from('course_admins').select('role').eq('user_id', user.id).eq('course_id', courseId).single(),
    admin.from('crm_course_users').select('role').eq('user_id', user.id).eq('course_id', courseId).single(),
  ])
  const isGlobalAdmin = (profile as any)?.is_admin === true
  const role = (courseAdmin as any)?.role ?? (courseUser as any)?.role
  if (!isGlobalAdmin && !MANAGER_ROLES.includes(role)) throw new Error('Unauthorized')
}

export async function updateCourseHours(
  courseId: string,
  hours: Array<{
    dayOfWeek: number
    isOpen: boolean
    openTime: string
    closeTime: string
  }>,
): Promise<{ error?: string }> {
  try {
    await requireCourseManager(courseId)
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
  const admin = createAdminClient()
  const rows = hours.map(h => ({
    course_id: courseId,
    day_of_week: h.dayOfWeek,
    is_open: h.isOpen,
    open_time: h.openTime,
    close_time: h.closeTime,
  }))
  const { error } = await admin
    .from('course_hours')
    .upsert(rows, { onConflict: 'course_id,day_of_week' })
  if (error) return { error: error.message }
  revalidatePath(`/course`)
  return {}
}

export async function updateCoursePricing(
  courseId: string,
  pricing: Array<{
    rateName: string
    greenFeeCents: number
    cartFeeCents: number
    displayOrder: number
  }>,
): Promise<{ error?: string }> {
  try {
    await requireCourseManager(courseId)
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
  const admin = createAdminClient()
  // Replace all pricing rows for this course
  await admin.from('course_pricing').delete().eq('course_id', courseId)
  const rows = pricing.map(p => ({
    course_id: courseId,
    rate_name: p.rateName,
    green_fee_cents: p.greenFeeCents,
    cart_fee_cents: p.cartFeeCents,
    display_order: p.displayOrder,
    is_active: true,
  }))
  const { error } = await admin.from('course_pricing').insert(rows)
  if (error) return { error: error.message }
  revalidatePath(`/course`)
  return {}
}

export async function updateTeeSheetConfig(
  courseId: string,
  config: {
    intervalMinutes: number
    maxPlayers: number
    advanceBookingDays: number
    cartPolicy: 'mandatory' | 'optional' | 'walking_only'
  },
): Promise<{ error?: string }> {
  try {
    await requireCourseManager(courseId)
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
  const admin = createAdminClient()
  const { error } = await admin
    .from('course_tee_sheet_config')
    .upsert(
      {
        course_id: courseId,
        interval_minutes: config.intervalMinutes,
        max_players: config.maxPlayers,
        advance_booking_days: config.advanceBookingDays,
        cart_policy: config.cartPolicy,
      },
      { onConflict: 'course_id' },
    )
  if (error) return { error: error.message }
  revalidatePath(`/course`)
  return {}
}
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/barris/Desktop/MulliganLinks && npx vitest run src/test/tee-sheet-settings-actions.test.ts 2>&1 | tail -10
```
Expected: all 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/actions/teeSheetSettings.ts src/test/tee-sheet-settings-actions.test.ts
git commit -m "feat(settings): add tee sheet settings server actions"
```

---

## Task 3: TeeSheetSettingsForm client component

**Files:**
- Create: `src/app/course/[slug]/tee-times/settings/TeeSheetSettingsForm.tsx`

- [ ] **Step 1: Create TeeSheetSettingsForm.tsx**

```tsx
'use client'

import { useState, useTransition } from 'react'
import HoursEditor, { type DayHours } from '@/components/onboarding/HoursEditor'
import PricingEditor, { type PricingRow } from '@/components/onboarding/PricingEditor'
import { updateCourseHours, updateCoursePricing, updateTeeSheetConfig } from '@/lib/actions/teeSheetSettings'

const INPUT = 'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B6D11] w-full'
const LABEL = 'text-xs text-gray-500 block mb-1'

type Props = {
  courseId: string
  initialHours: DayHours[]
  initialPricing: PricingRow[]
  initialConfig: {
    intervalMinutes: number
    maxPlayers: number
    advanceBookingDays: number
    cartPolicy: 'mandatory' | 'optional' | 'walking_only'
  }
}

export function TeeSheetSettingsForm({ courseId, initialHours, initialPricing, initialConfig }: Props) {
  const [hours, setHours] = useState<DayHours[]>(initialHours)
  const [pricing, setPricing] = useState<PricingRow[]>(initialPricing)
  const [intervalMinutes, setIntervalMinutes] = useState(initialConfig.intervalMinutes)
  const [maxPlayers, setMaxPlayers] = useState(initialConfig.maxPlayers)
  const [advanceBookingDays, setAdvanceBookingDays] = useState(initialConfig.advanceBookingDays)
  const [cartPolicy, setCartPolicy] = useState<'mandatory' | 'optional' | 'walking_only'>(initialConfig.cartPolicy)

  const [hoursSaved, setHoursSaved] = useState(false)
  const [pricingSaved, setPricingSaved] = useState(false)
  const [configSaved, setConfigSaved] = useState(false)
  const [hoursError, setHoursError] = useState<string | null>(null)
  const [pricingError, setPricingError] = useState<string | null>(null)
  const [configError, setConfigError] = useState<string | null>(null)

  const [, startTransition] = useTransition()

  function saveHours() {
    setHoursSaved(false); setHoursError(null)
    startTransition(async () => {
      const result = await updateCourseHours(courseId, hours.map(h => ({
        dayOfWeek: h.dayOfWeek,
        isOpen: h.isOpen,
        openTime: h.openTime,
        closeTime: h.closeTime,
      })))
      if (result.error) setHoursError(result.error)
      else setHoursSaved(true)
    })
  }

  function savePricing() {
    setPricingSaved(false); setPricingError(null)
    startTransition(async () => {
      const result = await updateCoursePricing(courseId, pricing.map((p, i) => ({
        rateName: p.rateName,
        greenFeeCents: p.greenFeeCents,
        cartFeeCents: p.cartFeeCents,
        displayOrder: i,
      })))
      if (result.error) setPricingError(result.error)
      else setPricingSaved(true)
    })
  }

  function saveConfig() {
    setConfigSaved(false); setConfigError(null)
    startTransition(async () => {
      const result = await updateTeeSheetConfig(courseId, {
        intervalMinutes,
        maxPlayers,
        advanceBookingDays,
        cartPolicy,
      })
      if (result.error) setConfigError(result.error)
      else setConfigSaved(true)
    })
  }

  return (
    <div className="space-y-6">
      {/* Hours section */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-[#1A1A1A]">Hours of Operation</h2>
        <HoursEditor value={hours} onChange={setHours} />
        {hoursError && <p className="text-xs text-red-500">{hoursError}</p>}
        {hoursSaved && <p className="text-xs text-emerald-600">Hours saved.</p>}
        <button
          onClick={saveHours}
          className="bg-[#1B4332] text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-[#163d2a]"
        >
          Save Hours
        </button>
      </div>

      {/* Pricing section */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-[#1A1A1A]">Pricing Tiers</h2>
        <PricingEditor value={pricing} onChange={setPricing} />
        {pricingError && <p className="text-xs text-red-500">{pricingError}</p>}
        {pricingSaved && <p className="text-xs text-emerald-600">Pricing saved.</p>}
        <button
          onClick={savePricing}
          className="bg-[#1B4332] text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-[#163d2a]"
        >
          Save Pricing
        </button>
      </div>

      {/* Tee sheet config section */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-[#1A1A1A]">Tee Sheet Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Tee time interval</label>
            <select className={INPUT} value={intervalMinutes} onChange={e => setIntervalMinutes(Number(e.target.value))}>
              <option value={7}>7 minutes</option>
              <option value={8}>8 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={12}>12 minutes</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Max players per tee time</label>
            <select className={INPUT} value={maxPlayers} onChange={e => setMaxPlayers(Number(e.target.value))}>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Advance booking window</label>
            <select className={INPUT} value={advanceBookingDays} onChange={e => setAdvanceBookingDays(Number(e.target.value))}>
              <option value={3}>3 days</option>
              <option value={5}>5 days</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Cart policy</label>
            <select className={INPUT} value={cartPolicy} onChange={e => setCartPolicy(e.target.value as 'mandatory' | 'optional' | 'walking_only')}>
              <option value="mandatory">Cart mandatory</option>
              <option value="optional">Cart optional</option>
              <option value="walking_only">Walking only</option>
            </select>
          </div>
        </div>
        {configError && <p className="text-xs text-red-500">{configError}</p>}
        {configSaved && <p className="text-xs text-emerald-600">Configuration saved.</p>}
        <button
          onClick={saveConfig}
          className="bg-[#1B4332] text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-[#163d2a]"
        >
          Save Configuration
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/barris/Desktop/MulliganLinks && npx tsc --noEmit 2>&1 | grep -i error | head -20
```
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/course/\[slug\]/tee-times/settings/TeeSheetSettingsForm.tsx
git commit -m "feat(settings): add TeeSheetSettingsForm client component"
```

---

## Task 4: Tee Sheet Settings page + nav link

**Files:**
- Create: `src/app/course/[slug]/tee-times/settings/page.tsx`
- Modify: `src/app/course/[slug]/tee-times/create/page.tsx` — add "Settings" link

- [ ] **Step 1: Create settings page**

```tsx
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireManager } from '@/lib/courseRole'
import { getTeeSheetConfig, getCourseHours, getCoursePricing } from '@/lib/db/onboarding'
import { TeeSheetSettingsForm } from './TeeSheetSettingsForm'
import type { DayHours } from '@/components/onboarding/HoursEditor'
import { DEFAULT_HOURS } from '@/components/onboarding/HoursEditor'
import { DEFAULT_PRICING, type PricingRow } from '@/components/onboarding/PricingEditor'
import Link from 'next/link'

export default async function TeeSheetSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  await requireManager(slug)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/course/${slug}/login`)

  const admin = createAdminClient()
  const { data: course, error: courseError } = await admin
    .from('courses').select('id').eq('slug', slug).single()
  if (courseError && courseError.code !== 'PGRST116') throw new Error(`[TeeSheetSettings] ${courseError.message}`)
  if (!course) notFound()

  const [config, dbHours, dbPricing] = await Promise.all([
    getTeeSheetConfig(course.id),
    getCourseHours(course.id),
    getCoursePricing(course.id),
  ])

  // Map DB hours to DayHours
  const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const initialHours: DayHours[] = dbHours.length > 0
    ? DAY_LABELS.map((label, i) => {
        const db = dbHours.find(h => h.day_of_week === i)
        if (!db) return DEFAULT_HOURS[i]
        return { dayOfWeek: i, label, isOpen: db.is_open, openTime: db.open_time, closeTime: db.close_time }
      })
    : DEFAULT_HOURS

  // Map DB pricing to PricingRow
  const initialPricing: PricingRow[] = dbPricing.length > 0
    ? dbPricing.map(p => ({
        id: p.id,
        rateName: p.rate_name,
        greenFeeCents: p.green_fee_cents,
        cartFeeCents: p.cart_fee_cents,
      }))
    : DEFAULT_PRICING

  const initialConfig = {
    intervalMinutes: config?.interval_minutes ?? 8,
    maxPlayers: config?.max_players ?? 4,
    advanceBookingDays: config?.advance_booking_days ?? 7,
    cartPolicy: (config?.cart_policy ?? 'optional') as 'mandatory' | 'optional' | 'walking_only',
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={`/course/${slug}/tee-times/create`} className="text-sm text-[#6B7770] hover:text-[#1A1A1A]">
          ← Tee Times
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-[#1A1A1A]">Tee Sheet Settings</h1>
      <p className="text-sm text-[#6B7770]">Update your hours, pricing tiers, and tee sheet configuration.</p>
      <TeeSheetSettingsForm
        courseId={course.id}
        initialHours={initialHours}
        initialPricing={initialPricing}
        initialConfig={initialConfig}
      />
    </div>
  )
}
```

- [ ] **Step 2: Add Settings link to the create tee times page**

In `src/app/course/[slug]/tee-times/create/page.tsx`, find the existing back button (line ~91):

```tsx
<button onClick={() => router.back()} className="text-sm text-[#6B7770] hover:text-[#1A1A1A]">← Back</button>
```

Replace with:

```tsx
<div className="flex items-center gap-4">
  <button onClick={() => router.back()} className="text-sm text-[#6B7770] hover:text-[#1A1A1A]">← Back</button>
  <a href={`/course/${slug}/tee-times/settings`} className="text-sm text-[#3B6D11] hover:underline font-medium">
    ⚙ Tee Sheet Settings
  </a>
</div>
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd /Users/barris/Desktop/MulliganLinks && npx tsc --noEmit 2>&1 | grep -i error | head -20
```
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/course/\[slug\]/tee-times/settings/ src/app/course/\[slug\]/tee-times/create/page.tsx
git commit -m "feat(settings): add tee sheet settings page and nav link"
```

---

## Task 5: CartSelector component

**Files:**
- Create: `src/components/CartSelector.tsx`

- [ ] **Step 1: Create CartSelector.tsx**

```tsx
'use client'

interface CartSelectorProps {
  greenFeeCents: number
  cartFeeCents: number
  players: number
  selected: 'walk' | 'cart'
  onChange: (choice: 'walk' | 'cart') => void
}

export function CartSelector({ greenFeeCents, cartFeeCents, players, selected, onChange }: CartSelectorProps) {
  const walkTotal = (greenFeeCents * players) / 100
  const cartTotal = ((greenFeeCents + cartFeeCents) * players) / 100

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-white">Walk or Ride?</p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange('walk')}
          className={`rounded-xl border-2 p-4 text-left transition-all ${
            selected === 'walk'
              ? 'border-[#A3C97A] bg-[#1B4332]'
              : 'border-white/20 bg-white/5 hover:border-white/40'
          }`}
        >
          <p className="text-sm font-semibold text-white">🚶 Walk</p>
          <p className="text-lg font-bold text-[#A3C97A] mt-1">${walkTotal.toFixed(2)}</p>
          <p className="text-xs text-white/60 mt-0.5">Green fee only</p>
        </button>

        <button
          type="button"
          onClick={() => onChange('cart')}
          className={`rounded-xl border-2 p-4 text-left transition-all ${
            selected === 'cart'
              ? 'border-[#A3C97A] bg-[#1B4332]'
              : 'border-white/20 bg-white/5 hover:border-white/40'
          }`}
        >
          <p className="text-sm font-semibold text-white">🛒 Ride</p>
          <p className="text-lg font-bold text-[#A3C97A] mt-1">${cartTotal.toFixed(2)}</p>
          {cartFeeCents > 0 && (
            <p className="text-xs text-white/60 mt-0.5">
              +${(cartFeeCents / 100).toFixed(2)}/person cart fee
            </p>
          )}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CartSelector.tsx
git commit -m "feat(booking): add CartSelector component"
```

---

## Task 6: Load cart data on booking page

**Files:**
- Modify: `src/app/app/book/[teeTimeId]/page.tsx`

- [ ] **Step 1: Load cart policy and pricing alongside existing queries**

In `src/app/app/book/[teeTimeId]/page.tsx`, find the `Promise.all` block (lines 48–57):

```typescript
const [{ data: pointsRows }, creditBalanceCents, availablePasses, { data: redemptionSettings }] = await Promise.all([
  supabase.from('fairway_points').select('amount').eq('user_id', user.id),
  getAndIssueMemberCredits(user.id, tier),
  getAvailablePasses(user.id),
  supabase
    .from('course_redemption_settings')
    .select('points_threshold')
    .eq('course_id', (teeTime.courses as any)?.id)
    .single(),
])
```

Replace with:

```typescript
const courseId = (teeTime.courses as any)?.id as string

const [
  { data: pointsRows },
  creditBalanceCents,
  availablePasses,
  { data: redemptionSettings },
  { data: teeSheetConfig },
  { data: coursePricingRows },
] = await Promise.all([
  supabase.from('fairway_points').select('amount').eq('user_id', user.id),
  getAndIssueMemberCredits(user.id, tier),
  getAvailablePasses(user.id),
  supabase
    .from('course_redemption_settings')
    .select('points_threshold')
    .eq('course_id', courseId)
    .single(),
  admin.from('course_tee_sheet_config').select('cart_policy').eq('course_id', courseId).single(),
  admin.from('course_pricing').select('cart_fee_cents').eq('course_id', courseId).eq('is_active', true).order('display_order').limit(1),
])

const cartPolicy = (teeSheetConfig as any)?.cart_policy ?? 'optional'
const cartFeeCents = (coursePricingRows?.[0] as any)?.cart_fee_cents ?? 0
```

Also update the `BookingForm` JSX to pass the new props (find the `<BookingForm` block and add):

```tsx
{stripeEnabled ? (
  <BookingPaymentForm
    teeTime={teeTime as any}
    tier={tier}
    userId={user.id}
    availablePasses={availablePasses}
  />
) : (
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
    cartPolicy={cartPolicy}
    cartFeeCents={cartFeeCents}
  />
)}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/barris/Desktop/MulliganLinks && npx tsc --noEmit 2>&1 | grep -i error | head -20
```
Expected: TypeScript errors for the new props until BookingForm is updated in the next task. That is OK — proceed.

- [ ] **Step 3: Commit**

```bash
git add src/app/app/book/\[teeTimeId\]/page.tsx
git commit -m "feat(booking): load cart policy and pricing on book page"
```

---

## Task 7: Update BookingForm with cart selection

**Files:**
- Modify: `src/components/BookingForm.tsx`

- [ ] **Step 1: Add cartPolicy, cartFeeCents props and cartChoice state**

Find the props interface in `src/components/BookingForm.tsx` (the block starting `export function BookingForm({`):

Add `cartPolicy` and `cartFeeCents` to the destructured props:

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
  cartPolicy = 'optional',
  cartFeeCents = 0,
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
  cartPolicy?: 'mandatory' | 'optional' | 'walking_only'
  cartFeeCents?: number
})
```

- [ ] **Step 2: Add cartChoice state**

After the existing `useState` declarations (after `const [error, setError] = useState<string | null>(null)`), add:

```typescript
const [cartChoice, setCartChoice] = useState<'walk' | 'cart'>(
  cartPolicy === 'mandatory' ? 'cart' : 'walk'
)
const effectiveCartFeeCents = cartChoice === 'cart' ? cartFeeCents : 0
```

- [ ] **Step 3: Include cart fee in subtotal calculation**

Find the line:
```typescript
const subtotal = teeTime.base_price * players
```

Replace with:
```typescript
const cartFeePerPlayer = effectiveCartFeeCents / 100
const subtotal = (teeTime.base_price + cartFeePerPlayer) * players
```

- [ ] **Step 4: Render CartSelector between player count and payment options**

Find the JSX where players are selected (look for the player count buttons), then add the `CartSelector` AFTER the player count section and BEFORE the payment options. Import it at the top of the file:

```typescript
import { CartSelector } from '@/components/CartSelector'
```

Then in the JSX, after the players section:

```tsx
{cartPolicy === 'optional' && (
  <CartSelector
    greenFeeCents={Math.round(teeTime.base_price * 100)}
    cartFeeCents={cartFeeCents}
    players={players}
    selected={cartChoice}
    onChange={setCartChoice}
  />
)}
{cartPolicy === 'mandatory' && (
  <p className="text-sm text-white/70">🛒 Cart included for this course.</p>
)}
```

- [ ] **Step 5: Pass cartSelected and cartFeeCents to confirmBooking**

Find the `confirmBooking({` call inside `startTransition`. Add:

```typescript
cartSelected: cartChoice === 'cart',
cartFeeCents: effectiveCartFeeCents,
```

- [ ] **Step 6: Verify TypeScript**

```bash
cd /Users/barris/Desktop/MulliganLinks && npx tsc --noEmit 2>&1 | grep -i error | head -20
```
Expected: errors about `cartSelected`/`cartFeeCents` not in `confirmBooking` signature — fix in next task.

- [ ] **Step 7: Commit**

```bash
git add src/components/BookingForm.tsx src/components/CartSelector.tsx
git commit -m "feat(booking): add cart selection step to BookingForm"
```

---

## Task 8: Update confirmBooking to save cart fields

**Files:**
- Modify: `src/app/actions/booking.ts`

- [ ] **Step 1: Add cartSelected and cartFeeCents to confirmBooking params**

Find the `confirmBooking` function signature (starts around line 125). Add to the destructured params object:

```typescript
cartSelected = false,
cartFeeCents = 0,
```

And to the TypeScript type annotation:

```typescript
cartSelected?: boolean
cartFeeCents?: number
```

- [ ] **Step 2: Add cart fields to the bookings insert**

Find the `.insert({` block inside `confirmBooking` (around line 227). Add to the insert object:

```typescript
cart_selected: cartSelected,
cart_fee_cents: cartFeeCents,
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd /Users/barris/Desktop/MulliganLinks && npx tsc --noEmit 2>&1 | grep -i error | head -20
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/actions/booking.ts
git commit -m "feat(booking): save cart_selected and cart_fee_cents to bookings"
```

---

## Task 9: Show cart icon on TeeSheetGrid

**Files:**
- Modify: `src/components/course/TeeSheetGrid.tsx`

- [ ] **Step 1: Add cart_selected to the Booking interface**

Find the `interface Booking {` block and add:

```typescript
cart_selected?: boolean | null
```

- [ ] **Step 2: Add ShoppingCart icon import**

At the top of `TeeSheetGrid.tsx`, add:

```typescript
import { ShoppingCart } from 'lucide-react'
```

- [ ] **Step 3: Update the tee times select in the parent page to include cart_selected**

In `src/app/course/[slug]/page.tsx`, find the `.select(...)` on `tee_times` (line 43). The bookings select currently includes `id, players, total_paid, status, payment_status, points_awarded, user_id, guest_name, guest_phone, guest_email, payment_method`.

Add `cart_selected` to the bookings select:

```typescript
bookings(id, players, total_paid, status, payment_status, points_awarded, user_id, guest_name, guest_phone, guest_email, payment_method, cart_selected,
  profiles(full_name)
)
```

- [ ] **Step 4: Render cart icon next to booking name in TeeSheetGrid**

Inside `TeeSheetGrid.tsx`, find where the booking's member name is rendered (look for `profiles?.full_name` or similar). Add the cart icon immediately after the name:

```tsx
{booking.cart_selected && (
  <ShoppingCart className="inline w-3.5 h-3.5 text-gray-400 ml-1" aria-label="Cart" />
)}
```

- [ ] **Step 5: Verify TypeScript and build**

```bash
cd /Users/barris/Desktop/MulliganLinks && npx tsc --noEmit 2>&1 | grep -i error | head -20
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/course/TeeSheetGrid.tsx src/app/course/\[slug\]/page.tsx
git commit -m "feat(booking): show cart icon on tee sheet for cart bookings"
```

---

## Task 10: Cart booking test

**Files:**
- Create: `src/test/cart-booking.test.ts`

- [ ] **Step 1: Write cart booking test**

Create `src/test/cart-booking.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/emails', () => ({
  sendBookingConfirmation: vi.fn().mockResolvedValue(undefined),
  sendCourseBookingAlert: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/stripe/fees', () => ({ platformFeeCents: vi.fn().mockReturnValue(0) }))

let bookingInsertArgs: Record<string, unknown> | null = null
let teeTimeUpdateArgs: Record<string, unknown> | null = null

function buildMock(availablePlayers = 4) {
  bookingInsertArgs = null
  teeTimeUpdateArgs = null

  const teeTimeRow = {
    id: 'tt-1',
    available_players: availablePlayers,
    status: 'open',
    course_id: 'course-1',
    scheduled_at: new Date(Date.now() + 86400000).toISOString(),
  }

  return {
    from: (table: string) => ({
      select: (cols: string) => ({
        eq: (_col: string, _val: unknown) => ({
          single: () => {
            if (table === 'tee_times') return { data: teeTimeRow }
            if (table === 'memberships') return { data: { comp_rounds_remaining: 0, created_at: '2026-01-01' } }
            return { data: null }
          },
          maybeSingle: () => ({ data: null }),
          gt: () => ({ data: [] }),
          in: () => ({ data: [] }),
        }),
        in: () => ({ data: [] }),
        lt: () => ({ data: [] }),
      }),
      insert: (args: unknown) => {
        if (table === 'bookings') bookingInsertArgs = args as Record<string, unknown>
        return { select: () => ({ single: () => ({ data: { id: 'booking-1' }, error: null }) }), error: null }
      },
      update: (args: unknown) => {
        if (table === 'tee_times') teeTimeUpdateArgs = args as Record<string, unknown>
        return { eq: () => ({ eq: () => ({}) }) }
      },
    }),
    auth: { getUser: async () => ({ data: { user: { id: 'user-1' } } }) },
  }
}

vi.mock('@/lib/supabase/server', () => ({ createClient: async () => buildMock() }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => buildMock() }))

import { confirmBooking } from '@/app/actions/booking'

describe('confirmBooking — cart selection', () => {
  it('saves cart_selected=true when member chooses cart', async () => {
    await confirmBooking({
      teeTimeId: 'tt-1',
      userId: 'user-1',
      players: 1,
      subtotal: 45,
      discount: 0,
      pointsRedeemed: 0,
      total: 45,
      pointsEarned: 100,
      tier: 'eagle',
      cartSelected: true,
      cartFeeCents: 1800,
    })
    expect(bookingInsertArgs).not.toBeNull()
    expect((bookingInsertArgs as Record<string, unknown>).cart_selected).toBe(true)
    expect((bookingInsertArgs as Record<string, unknown>).cart_fee_cents).toBe(1800)
  })

  it('saves cart_selected=false when member walks', async () => {
    await confirmBooking({
      teeTimeId: 'tt-1',
      userId: 'user-1',
      players: 1,
      subtotal: 45,
      discount: 0,
      pointsRedeemed: 0,
      total: 45,
      pointsEarned: 100,
      tier: 'eagle',
      cartSelected: false,
      cartFeeCents: 0,
    })
    expect((bookingInsertArgs as Record<string, unknown>).cart_selected).toBe(false)
    expect((bookingInsertArgs as Record<string, unknown>).cart_fee_cents).toBe(0)
  })

  it('defaults cart_selected=false when params not provided', async () => {
    await confirmBooking({
      teeTimeId: 'tt-1',
      userId: 'user-1',
      players: 1,
      subtotal: 45,
      discount: 0,
      pointsRedeemed: 0,
      total: 45,
      pointsEarned: 100,
      tier: 'eagle',
    })
    expect((bookingInsertArgs as Record<string, unknown>).cart_selected).toBe(false)
  })
})
```

- [ ] **Step 2: Run cart test**

```bash
cd /Users/barris/Desktop/MulliganLinks && npx vitest run src/test/cart-booking.test.ts 2>&1 | tail -20
```
Expected: all 3 tests pass.

- [ ] **Step 3: Run full test suite**

```bash
cd /Users/barris/Desktop/MulliganLinks && npx vitest run 2>&1 | tail -20
```
Expected: all tests pass, no regressions.

- [ ] **Step 4: Full build check**

```bash
cd /Users/barris/Desktop/MulliganLinks && npm run build 2>&1 | tail -20
```
Expected: build succeeds.

- [ ] **Step 5: Final commit**

```bash
git add src/test/cart-booking.test.ts
git commit -m "test(booking): add cart_selected field tests for confirmBooking"
```

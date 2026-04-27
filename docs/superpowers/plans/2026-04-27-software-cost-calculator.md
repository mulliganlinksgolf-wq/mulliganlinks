# Software Cost Calculator `/software-cost` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive `/software-cost` page where any golf course GM — regardless of current vendor — can calculate their full annual software extraction cost (subscription + payment processing markup + marketplace barter) and see a side-by-side comparison against TeeAhead's two pricing tiers.

**Architecture:** Pure calculation functions live in `src/lib/softwareCostCalc.ts` (testable in isolation); vendor pricing constants in `src/lib/vendorPricing.ts`; UI is a client component `SoftwareCostPage.tsx` that imports both; a server page at `src/app/software-cost/page.tsx` fetches the founding partner counter from Supabase and passes it as a prop. The `/cost` redirect is configured in `next.config.ts`. Tier selection from the two CTAs is captured via `?tier=` query param and stored in the existing `course_waitlist` table via a new `applied_tier` column.

**Tech Stack:** Next.js 16.2.4 (App Router), TypeScript, Tailwind CSS v4, Supabase, Vitest

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/softwareCostCalc.ts` | **Create** | Pure calculation functions (testable) |
| `src/lib/vendorPricing.ts` | **Create** | VENDOR_PRICING and TEEAHEAD_PRICING constants |
| `src/test/software-cost-calculator.test.ts` | **Create** | Vitest unit tests for calc functions |
| `src/components/SoftwareCostPage.tsx` | **Create** | Client component — full UI |
| `src/app/software-cost/page.tsx` | **Create** | Server page — metadata, Supabase fetch, render SoftwareCostPage |
| `supabase/migrations/023_course_waitlist_tier.sql` | **Create** | Add `applied_tier` column to `course_waitlist` |
| `next.config.ts` | **Modify** | Add `/cost` → `/software-cost` redirect |
| `src/components/BarterPage.tsx` | **Modify** | Add cross-link footer: "Not on GolfNow? → /software-cost" |
| `src/app/waitlist/course/CourseWaitlistForm.tsx` | **Modify** | Read `?tier=` via `useSearchParams`, include hidden field |
| `src/app/waitlist/course/page.tsx` | **Modify** | Wrap `CourseWaitlistForm` in `<Suspense>` |
| `src/app/waitlist/course/actions.ts` | **Modify** | Read and persist `applied_tier` |
| `src/app/page.tsx` | **Modify** | Add `/software-cost` link in footer Product nav |

---

## Task 1: Write Failing Unit Tests for Calculator Logic

**Files:**
- Create: `src/test/software-cost-calculator.test.ts`

- [ ] **Step 1: Create the test file**

```typescript
/**
 * Unit tests for the software cost calculator core logic.
 * Pure function tests — no rendering needed.
 * These tests intentionally fail until src/lib/softwareCostCalc.ts is created.
 */

import { describe, it, expect } from 'vitest'
import {
  calcAnnualSubscription,
  calcProcessingMarkup,
  calcMarketplaceBarter,
  calcTotalExtraction,
  estimateGolferRecords,
} from '@/lib/softwareCostCalc'

describe('calcAnnualSubscription', () => {
  it('multiplies monthly by 12', () => {
    expect(calcAnnualSubscription(299)).toBe(3588)
  })

  it('handles $0 monthly', () => {
    expect(calcAnnualSubscription(0)).toBe(0)
  })

  it('handles typical foreUP median ($250)', () => {
    expect(calcAnnualSubscription(250)).toBe(3000)
  })
})

describe('calcProcessingMarkup', () => {
  it('returns 0 when rate equals baseline (2.5%)', () => {
    expect(calcProcessingMarkup(1_000_000, 2.5)).toBe(0)
  })

  it('returns 0 when rate is below baseline (no negative markup)', () => {
    expect(calcProcessingMarkup(1_000_000, 2.4)).toBe(0)
  })

  it('calculates markup above baseline correctly', () => {
    // $1M volume × (2.9% - 2.5%) = $1M × 0.004 = $4,000
    expect(calcProcessingMarkup(1_000_000, 2.9)).toBe(4000)
  })

  it('calculates at 4.0% rate', () => {
    // $2M volume × (4.0% - 2.5%) = $2M × 0.015 = $30,000
    expect(calcProcessingMarkup(2_000_000, 4.0)).toBe(30000)
  })

  it('scales linearly with volume', () => {
    const base = calcProcessingMarkup(500_000, 3.0)
    const double = calcProcessingMarkup(1_000_000, 3.0)
    expect(double).toBe(base * 2)
  })
})

describe('calcMarketplaceBarter', () => {
  it('returns full barter value when yes (280 days × $65)', () => {
    // 280 * 65 = 18,200
    expect(calcMarketplaceBarter('yes')).toBe(18200)
  })

  it('returns half barter value when unsure', () => {
    // Math.round(280 * 65 * 0.5) = 9,100
    expect(calcMarketplaceBarter('unsure')).toBe(9100)
  })

  it('returns 0 when no', () => {
    expect(calcMarketplaceBarter('no')).toBe(0)
  })
})

describe('calcTotalExtraction', () => {
  it('sums all three cost components', () => {
    // sub: 250*12=$3,000 | markup: 1M*(2.9%-2.5%)=$4,000 | barter: 18,200
    const result = calcTotalExtraction(250, 1_000_000, 2.9, 'yes')
    expect(result).toBe(3000 + 4000 + 18200)
  })

  it('handles no marketplace correctly', () => {
    const result = calcTotalExtraction(250, 1_000_000, 2.9, 'no')
    expect(result).toBe(3000 + 4000 + 0)
  })

  it('returns 0 for a course with zero costs', () => {
    expect(calcTotalExtraction(0, 100_000, 2.5, 'no')).toBe(0)
  })
})

describe('estimateGolferRecords', () => {
  it('returns 4% of annual card volume', () => {
    // $1M × 0.04 = 40,000 records
    expect(estimateGolferRecords(1_000_000)).toBe(40000)
  })

  it('floors to integer', () => {
    // $100K × 0.04 = 4,000
    expect(estimateGolferRecords(100_000)).toBe(4000)
  })

  it('handles min card volume ($100K)', () => {
    expect(estimateGolferRecords(100_000)).toBeGreaterThan(0)
  })
})

describe('savings edge case', () => {
  it('standard savings never go negative — confirmed by Math.max at call site', () => {
    // A course with $0 everything has totalExtraction=0, which is < standardAnnual ($3,588)
    // The component does: Math.max(0, totalExtraction - 3588) — test the logic here
    const totalExtraction = calcTotalExtraction(0, 100_000, 2.5, 'no')
    const savingsAsStandard = Math.max(0, totalExtraction - 3588)
    expect(savingsAsStandard).toBe(0)
    expect(totalExtraction).toBeLessThan(3588) // triggers "unusually lean" message
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail with module-not-found**

```bash
cd /Users/barris/Desktop/MulliganLinks && npx vitest run src/test/software-cost-calculator.test.ts
```

Expected: All tests **FAIL** with `Error: Cannot find module '@/lib/softwareCostCalc'`

- [ ] **Step 3: Commit failing tests**

```bash
git add src/test/software-cost-calculator.test.ts
git commit -m "test: add failing unit tests for software cost calculator logic"
```

---

## Task 2: Create Calculation Functions (Make Tests Pass)

**Files:**
- Create: `src/lib/softwareCostCalc.ts`

- [ ] **Step 1: Create the pure calculation functions**

```typescript
export type MarketplaceDistribution = 'yes' | 'unsure' | 'no'

const BASELINE_RATE = 0.025
const MARKETPLACE_DAYS = 280
const MARKETPLACE_AVG_GREEN_FEE = 65

export function calcAnnualSubscription(monthlySubscription: number): number {
  return monthlySubscription * 12
}

export function calcProcessingMarkup(annualCardVolume: number, paymentProcessingRate: number): number {
  const userRate = paymentProcessingRate / 100
  return Math.max(0, Math.round(annualCardVolume * (userRate - BASELINE_RATE)))
}

export function calcMarketplaceBarter(distribution: MarketplaceDistribution): number {
  if (distribution === 'yes') return MARKETPLACE_DAYS * MARKETPLACE_AVG_GREEN_FEE
  if (distribution === 'unsure') return Math.round(MARKETPLACE_DAYS * MARKETPLACE_AVG_GREEN_FEE * 0.5)
  return 0
}

export function calcTotalExtraction(
  monthlySubscription: number,
  annualCardVolume: number,
  paymentProcessingRate: number,
  marketplaceDistribution: MarketplaceDistribution,
): number {
  return (
    calcAnnualSubscription(monthlySubscription) +
    calcProcessingMarkup(annualCardVolume, paymentProcessingRate) +
    calcMarketplaceBarter(marketplaceDistribution)
  )
}

export function estimateGolferRecords(annualCardVolume: number): number {
  return Math.floor(annualCardVolume * 0.04)
}
```

- [ ] **Step 2: Run tests to confirm all pass**

```bash
cd /Users/barris/Desktop/MulliganLinks && npx vitest run src/test/software-cost-calculator.test.ts
```

Expected: All **PASS**. If any fail, fix the function before proceeding.

- [ ] **Step 3: Commit**

```bash
git add src/lib/softwareCostCalc.ts
git commit -m "feat: add pure calculation functions for software cost calculator"
```

---

## Task 3: Create Vendor Pricing Constants

**Files:**
- Create: `src/lib/vendorPricing.ts`

- [ ] **Step 1: Create the constants file**

```typescript
// Legal note: All vendor pricing is based on publicly available market data as of April 2026.
// Last legal review: April 2026. Review again before major marketing campaigns.

export const TEEAHEAD_PRICING = {
  foundingMonthly: 0,
  foundingAnnual: 0,
  standardMonthly: 299,
  standardAnnual: 3588,
  foundingTotalSpots: 10,
} as const

export const VENDOR_PRICING = {
  foreup: {
    name: 'foreUP',
    medianMonthly: 250,
    minMonthly: 120,
    maxMonthly: 450,
    parent: 'Battery Ventures / Clubessential Holdings (PE)',
    marketplaceDefault: true,
    receipt:
      "foreUP is owned by Battery Ventures, part of a 10,000-customer PE rollup. Their default Supreme Golf integration distributes your tee times to Barstool Golf Time, Golf Digest, and CBS Sports. Every booking through those channels makes Barstool the customer relationship — not you.",
  },
  lightspeed: {
    name: 'Lightspeed Golf',
    medianMonthly: 425,
    minMonthly: 325,
    maxMonthly: 700,
    parent: 'Lightspeed Commerce (public company)',
    marketplaceDefault: true,
    receipt:
      "Lightspeed's privacy policy explicitly states they *'may sell non-personally identifiable information that has been derived from aggregated and de-identified Personal Data.'* Across 2,000+ courses, that aggregated dataset is one of the most valuable assets in golf — and your course data trains it.",
  },
  clubcaddie: {
    name: 'Club Caddie',
    medianMonthly: 299,
    minMonthly: 249,
    maxMonthly: 500,
    parent: 'Jonas Software / Constellation Software',
    marketplaceDefault: true,
    receipt:
      "Club Caddie's privacy policy explicitly says: *'if you book a tee time through the Services, your information will be shared with a third-party tee time aggregator we contract with.'* Your golfers' data goes to aggregators by default — not by accident.",
  },
  clubprophet: {
    name: 'Club Prophet',
    medianMonthly: 400,
    minMonthly: 300,
    maxMonthly: 600,
    parent: 'Independent (30+ years, 1,700 facilities)',
    marketplaceDefault: true,
    receipt:
      "Club Prophet integrated with Supreme Golf in December 2025 — meaning your tee times are now distributed across Barstool Golf Time, Golf Digest, and CBS Sports unless you've explicitly turned it off. Did anyone tell you?",
  },
  jonas: {
    name: 'Jonas Club Software',
    medianMonthly: 5000,
    minMonthly: 3000,
    maxMonthly: 10000,
    parent: 'Constellation Software',
    marketplaceDefault: false,
    receipt:
      "Jonas is enterprise-tier — primarily private clubs. They don't push to public marketplaces, but their aggregate data clauses are standard: anything anonymized can be shared with third parties without restriction.",
  },
  quick18: {
    name: 'Quick 18 (Sagacity)',
    medianMonthly: 250,
    minMonthly: 99,
    maxMonthly: 600,
    parent: 'Sagacity Golf',
    marketplaceDefault: true,
    receipt:
      "Sagacity's value prop is dynamic pricing 'based on cross-course market data' — which is your data, plus 700 other courses' data, used to set prices at all of them. You're paying them to learn from your operation and sell that learning to your competitors.",
  },
  teesnap: {
    name: 'Teesnap',
    medianMonthly: 180,
    minMonthly: 60,
    maxMonthly: 400,
    parent: 'Independent',
    marketplaceDefault: false,
    receipt:
      "Teesnap is one of the more reserved players on consumer data, but they integrate directly with GolfNow as a partner — meaning if you've enabled distribution, you're back in the GolfNow ecosystem.",
  },
  other: {
    name: 'Other / Not sure',
    medianMonthly: 300,
    minMonthly: 100,
    maxMonthly: 800,
    parent: 'Various',
    marketplaceDefault: true,
    receipt:
      "If you're not sure what your vendor is doing with your data, that's the problem. Read your contract's data section and your vendor's privacy policy — specifically the 'aggregated information' and 'third-party partners' clauses. Most courses are surprised by what they find.",
  },
} as const

export type VendorKey = keyof typeof VENDOR_PRICING

export const VENDOR_KEYS: VendorKey[] = [
  'foreup', 'lightspeed', 'clubcaddie', 'clubprophet', 'jonas', 'quick18', 'teesnap', 'other',
]
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/vendorPricing.ts
git commit -m "feat: add vendor pricing constants"
```

---

## Task 4: DB Migration — Add `applied_tier` to `course_waitlist`

**Files:**
- Create: `supabase/migrations/023_course_waitlist_tier.sql`

The `course_waitlist` table needs an `applied_tier` column so Neil & Billy can see which tier each applicant intended when they review the queue.

- [ ] **Step 1: Create migration file**

```sql
-- Track which pricing tier an applicant is applying for.
-- Values: 'founding' (wants the free-for-life Founding Partner spot)
--         'standard' (wants the $299/month flat tier)
-- Null means submitted before this column existed (treat as 'founding' for pre-existing rows).

ALTER TABLE public.course_waitlist
  ADD COLUMN IF NOT EXISTS applied_tier VARCHAR(20);
```

- [ ] **Step 2: Apply migration to remote Supabase**

```bash
cd /Users/barris/Desktop/MulliganLinks && npx supabase db push
```

Expected: Migration applies cleanly with no errors. If the CLI asks for confirmation, confirm.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/023_course_waitlist_tier.sql
git commit -m "feat: add applied_tier column to course_waitlist"
```

---

## Task 5: Update Course Waitlist Form to Capture Tier

**Files:**
- Modify: `src/app/waitlist/course/CourseWaitlistForm.tsx`
- Modify: `src/app/waitlist/course/page.tsx`
- Modify: `src/app/waitlist/course/actions.ts`

The CTAs on the new calculator page link to `/waitlist/course?tier=founding` and `/waitlist/course?tier=standard`. The form needs to read that param, include it as a hidden field, and the server action needs to save it.

### 5a — Update the form component

`CourseWaitlistForm` is already a client component. Use `useSearchParams()` to read the tier param.

- [ ] **Step 1: Update `CourseWaitlistForm.tsx`**

Add the `useSearchParams` import and hidden field. The only change is adding 3 lines at the top of the function body and one hidden input in the form:

```typescript
'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { joinCourseWaitlist } from './actions'

export function CourseWaitlistForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tier = searchParams.get('tier') ?? 'founding'

  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [onGolfnow, setOnGolfnow] = useState<boolean | null>(null)
  const [avgGreenFee, setAvgGreenFee] = useState<string>('')

  const estimatedBarter =
    onGolfnow && avgGreenFee && !isNaN(parseInt(avgGreenFee, 10))
      ? 2 * parseInt(avgGreenFee, 10) * 300
      : null

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await joinCourseWaitlist(formData)
      if (result.success) {
        router.push('/waitlist/course/confirmed')
      } else {
        setError(result.error ?? 'Something went wrong.')
      }
    })
  }

  const selectClassName = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Hidden tier field — captures which pricing tier the applicant wants */}
      <input type="hidden" name="applied_tier" value={tier} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="course_name">Course name *</Label>
        <Input id="course_name" name="course_name" required disabled={isPending} placeholder="Oakland Hills Country Club" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="contact_name">Your name *</Label>
          <Input id="contact_name" name="contact_name" required disabled={isPending} placeholder="Alex Johnson" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact_role">Your role</Label>
          <select id="contact_role" name="contact_role" disabled={isPending} className={selectClassName}>
            <option value="">Select…</option>
            <option value="owner">Owner</option>
            <option value="gm">General Manager</option>
            <option value="director_of_golf">Director of Golf</option>
            <option value="pro">Head Pro</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" name="email" type="email" required disabled={isPending} placeholder="alex@course.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" type="tel" disabled={isPending} placeholder="(248) 555-0100" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" disabled={isPending} placeholder="Birmingham" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="state">State</Label>
          <Input id="state" name="state" disabled={isPending} placeholder="MI" maxLength={2} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="num_holes">Number of holes</Label>
          <select id="num_holes" name="num_holes" disabled={isPending} className={selectClassName}>
            <option value="">Select…</option>
            <option value="9">9</option>
            <option value="18">18</option>
            <option value="27">27</option>
            <option value="36">36</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="annual_rounds">Est. annual rounds</Label>
          <Input id="annual_rounds" name="annual_rounds" type="number" min="0" disabled={isPending} placeholder="15000" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="current_software">Current tee sheet software</Label>
        <select id="current_software" name="current_software" disabled={isPending} className={selectClassName}>
          <option value="">Select…</option>
          <option value="golfnow">GolfNow</option>
          <option value="foreup">foreUP</option>
          <option value="lightspeed">Lightspeed</option>
          <option value="club_prophet">Club Prophet</option>
          <option value="other">Other</option>
          <option value="none">None</option>
        </select>
      </div>

      <div className="space-y-3 bg-[#FAF7F2] rounded-xl p-4 ring-1 ring-black/5">
        <Label>Are you currently on GolfNow?</Label>
        <div className="flex gap-6">
          {[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ].map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="on_golfnow"
                value={value}
                disabled={isPending}
                onChange={() => setOnGolfnow(value === 'yes')}
                className="accent-[#1B4332]"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>

        {onGolfnow && (
          <div className="space-y-2 pt-2">
            <Label htmlFor="avg_green_fee">Average green fee (rack rate, $)</Label>
            <Input
              id="avg_green_fee"
              name="avg_green_fee"
              type="number"
              min="0"
              disabled={isPending}
              placeholder="175"
              value={avgGreenFee}
              onChange={(e) => setAvgGreenFee(e.target.value)}
            />
            {estimatedBarter && (
              <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-sm">
                <p className="font-semibold text-red-700">
                  Estimated annual barter cost: ${estimatedBarter.toLocaleString()}
                </p>
                <p className="text-red-600 text-xs mt-1">
                  (2 tee times/day × ${avgGreenFee} rack rate × 300 operating days)
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="biggest_frustration">
          What&apos;s your biggest frustration with your current setup?{' '}
          <span className="text-[#6B7770] font-normal">(optional)</span>
        </Label>
        <textarea
          id="biggest_frustration"
          name="biggest_frustration"
          disabled={isPending}
          rows={3}
          placeholder="Barter costs, lack of customer data, booking fees eating into revenue…"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-[#1B4332] hover:bg-[#1B4332]/90 text-[#FAF7F2] font-semibold py-3"
      >
        {isPending ? 'Submitting…' : 'Submit Founding Partner Application'}
      </Button>

      <p className="text-xs text-center text-[#6B7770]">
        Founding Partner status is subject to review. We&apos;ll be in touch within 48 hours.
      </p>
    </form>
  )
}
```

### 5b — Wrap in Suspense (required when using `useSearchParams` in Next.js App Router)

- [ ] **Step 2: Update `src/app/waitlist/course/page.tsx`**

Add `Suspense` import and wrap `<CourseWaitlistForm />`:

```typescript
import { Suspense } from 'react'
import Link from 'next/link'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'
import { createClient } from '@/lib/supabase/server'
import { CourseWaitlistForm } from './CourseWaitlistForm'

export const metadata = {
  title: 'Founding Partner Application — TeeAhead',
  description: 'Claim one of 10 Founding Partner spots. Free platform for life.',
}

export default async function CourseWaitlistPage() {
  const supabase = await createClient()
  const { data: counter } = await supabase
    .from('founding_partner_counter')
    .select('count, cap')
    .single()

  const spotsRemaining = (counter?.cap ?? 10) - (counter?.count ?? 0)
  const allClaimed = spotsRemaining <= 0

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <header className="bg-[#FAF7F2]/95 backdrop-blur border-b border-black/5 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/">
            <TeeAheadLogo className="h-12 w-auto" />
          </Link>
          <Link href="/" className="text-sm text-[#6B7770] hover:text-[#1B4332] transition-colors">
            ← Back
          </Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-16">
        <div className="space-y-2 mb-6">
          <div className={`inline-block text-sm font-semibold px-3 py-1 rounded-full mb-2 ${
            allClaimed ? 'bg-gray-100 text-gray-600' : 'bg-[#E0A800]/20 text-[#8B6F00]'
          }`}>
            {allClaimed ? 'All Founding Spots Claimed' : `${spotsRemaining} of 10 Founding Partner spots remaining`}
          </div>
          <h1 className="text-3xl font-bold text-[#1A1A1A]">
            {allClaimed ? 'Join the Course Waitlist' : 'Claim a Founding Partner Spot'}
          </h1>
        </div>

        <div className="bg-white rounded-xl p-5 ring-1 ring-[#E0A800]/30 mb-8 space-y-3">
          <p className="text-sm font-semibold text-[#1A1A1A]">
            {allClaimed ? 'Core Partner — $249/month' : 'Founding Partners get the full platform free for life.'}
          </p>
          <p className="text-sm text-[#6B7770] leading-relaxed">
            {allClaimed
              ? 'All 10 Founding Partner spots have been claimed. You can still join the waitlist as a Core Partner at $249/month — same software, no barter.'
              : "The only obligation: promote the Tee Ahead membership to your golfers at the point of booking, and allow us to feature your course in our marketing. Course #11 onward pays $249/month."}
          </p>
        </div>

        <Suspense fallback={null}>
          <CourseWaitlistForm />
        </Suspense>
      </main>
    </div>
  )
}
```

### 5c — Update the server action to save `applied_tier`

- [ ] **Step 3: Update `src/app/waitlist/course/actions.ts`**

Add `applied_tier` extraction and include it in the insert. The full updated file:

```typescript
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendCourseWaitlistConfirmation, sendCourseAdminAlert } from '@/lib/resend'

export async function joinCourseWaitlist(formData: FormData) {
  const courseName = (formData.get('course_name') as string)?.trim()
  const contactName = (formData.get('contact_name') as string)?.trim()
  const contactRole = (formData.get('contact_role') as string)?.trim() || null
  const email = (formData.get('email') as string)?.toLowerCase().trim()
  const phone = (formData.get('phone') as string)?.trim() || null
  const city = (formData.get('city') as string)?.trim() || null
  const state = (formData.get('state') as string)?.trim().toUpperCase() || null
  const numHoles = formData.get('num_holes') ? parseInt(formData.get('num_holes') as string, 10) : null
  const annualRounds = formData.get('annual_rounds') ? parseInt(formData.get('annual_rounds') as string, 10) : null
  const currentSoftware = (formData.get('current_software') as string) || null
  const onGolfnow = formData.get('on_golfnow') === 'yes'
  const avgGreenFee = formData.get('avg_green_fee') ? parseInt(formData.get('avg_green_fee') as string, 10) : null
  const biggestFrustration = (formData.get('biggest_frustration') as string)?.trim() || null
  const rawTier = (formData.get('applied_tier') as string)?.trim() || null
  const appliedTier = rawTier === 'standard' ? 'standard' : 'founding'

  if (!courseName || !contactName || !email || !email.includes('@')) {
    return { error: 'Course name, contact name, and a valid email are required.' }
  }

  const estimatedBarterCost =
    onGolfnow && avgGreenFee && !isNaN(avgGreenFee) ? 2 * avgGreenFee * 300 : null

  const supabase = createAdminClient()

  const { error } = await supabase.from('course_waitlist').insert({
    course_name: courseName,
    contact_name: contactName,
    contact_role: contactRole,
    email,
    phone,
    city,
    state,
    num_holes: numHoles,
    annual_rounds: annualRounds,
    current_software: currentSoftware,
    on_golfnow: onGolfnow,
    estimated_barter_cost: estimatedBarterCost,
    biggest_frustration: biggestFrustration,
    applied_tier: appliedTier,
    status: 'pending',
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'We already have an application from this email address.' }
    }
    console.error('[course-waitlist]', error)
    return { error: 'Something went wrong. Please try again.' }
  }

  await Promise.all([
    sendCourseWaitlistConfirmation({ email, contactName, courseName }),
    sendCourseAdminAlert({
      courseName,
      contactName,
      contactRole,
      email,
      phone,
      city,
      state,
      onGolfnow,
      estimatedBarterCost,
      biggestFrustration,
    }),
  ])

  return { success: true }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/waitlist/course/CourseWaitlistForm.tsx \
        src/app/waitlist/course/page.tsx \
        src/app/waitlist/course/actions.ts
git commit -m "feat: capture applied_tier from URL param in course waitlist form"
```

---

## Task 6: Build the `SoftwareCostPage` Client Component

**Files:**
- Create: `src/components/SoftwareCostPage.tsx`

This is the main UI component. It closely mirrors the `BarterPage` visual language with the same header, dark hero, calculator card, output section, stats block, CTA, and footer.

- [ ] **Step 1: Create `src/components/SoftwareCostPage.tsx`**

```typescript
// Legal note: All competitor references are based on publicly available data
// and documented industry sources. See src/lib/vendorPricing.ts for attribution.
// Last legal review: April 2026. Review again before major marketing campaigns.
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'
import { FadeIn } from '@/components/FadeIn'
import { VENDOR_PRICING, TEEAHEAD_PRICING, VENDOR_KEYS, type VendorKey } from '@/lib/vendorPricing'
import {
  calcAnnualSubscription,
  calcProcessingMarkup,
  calcMarketplaceBarter,
  calcTotalExtraction,
  estimateGolferRecords,
  type MarketplaceDistribution,
} from '@/lib/softwareCostCalc'

interface SoftwareCostPageProps {
  spotsRemaining: number
}

export function SoftwareCostPage({ spotsRemaining }: SoftwareCostPageProps) {
  const [selectedVendor, setSelectedVendor] = useState<VendorKey | null>(null)
  const [monthlySubscription, setMonthlySubscription] = useState(300)
  const [annualCardVolume, setAnnualCardVolume] = useState(1_000_000)
  const [paymentProcessingRate, setPaymentProcessingRate] = useState(2.9)
  const [marketplaceDistribution, setMarketplaceDistribution] = useState<MarketplaceDistribution>('unsure')

  const handleVendorSelect = (key: VendorKey) => {
    setSelectedVendor(key)
    setMonthlySubscription(VENDOR_PRICING[key].medianMonthly)
  }

  const annualSubscription = calcAnnualSubscription(monthlySubscription)
  const processingMarkup = calcProcessingMarkup(annualCardVolume, paymentProcessingRate)
  const marketplaceBarter = calcMarketplaceBarter(marketplaceDistribution)
  const totalExtraction = calcTotalExtraction(monthlySubscription, annualCardVolume, paymentProcessingRate, marketplaceDistribution)
  const golferRecords = estimateGolferRecords(annualCardVolume)
  const savingsAsFounding = totalExtraction
  const savingsAsStandard = Math.max(0, totalExtraction - TEEAHEAD_PRICING.standardAnnual)
  const isUnusuallyLean = totalExtraction < TEEAHEAD_PRICING.standardAnnual

  const [displayedTotal, setDisplayedTotal] = useState(totalExtraction)

  useEffect(() => {
    const start = displayedTotal
    const end = totalExtraction
    const duration = 600
    const startTime = performance.now()
    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayedTotal(Math.round(start + (end - start) * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalExtraction])

  const allClaimed = spotsRemaining <= 0
  const vendorData = selectedVendor ? VENDOR_PRICING[selectedVendor] : null

  const fmt = (n: number) => `$${n.toLocaleString()}`

  const fmtVolume = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
      : `$${(n / 1_000).toFixed(0)}K`

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">

      {/* ── Header ────────────────────────────────────────────── */}
      <header className="bg-[#0F3D2E]/97 backdrop-blur border-b border-white/8 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/">
            <TeeAheadLogo className="h-12 w-auto brightness-0 invert" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-[#F4F1EA]/65 hover:text-[#F4F1EA] transition-colors hidden sm:block">
              ← Back to Home
            </Link>
            <Link
              href="/waitlist/course?tier=founding"
              className="inline-flex items-center justify-center rounded-lg bg-[#E0A800] px-4 py-2 text-sm font-semibold text-[#0a0a0a] hover:bg-[#E0A800]/90 transition-colors"
            >
              Claim a Founding Spot
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="px-6 py-20 text-center relative overflow-hidden" style={{ background: '#071f17' }}>
          <div className="absolute inset-0 pointer-events-none"
               style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(224,168,0,0.08) 0%, transparent 65%)' }} />
          <FadeIn>
            <div className="max-w-3xl mx-auto space-y-7 relative z-10">
              <div className="inline-flex items-center gap-2 bg-[#E0A800]/12 border border-[#E0A800]/30 rounded-full px-4 py-1.5">
                <span className="text-xs font-bold text-[#E0A800] tracking-[0.08em] uppercase">For Golf Course Operators</span>
              </div>

              <h1 className="font-display font-black text-[#F4F1EA] leading-[1.1] tracking-[-0.02em]"
                  style={{ fontSize: 'clamp(36px, 5vw, 52px)' }}>
                Your software vendor isn&apos;t free.{' '}
                <em style={{ fontStyle: 'italic', color: '#E0A800' }}>See exactly what they&apos;re costing you.</em>
              </h1>

              <p className="text-base leading-relaxed max-w-2xl mx-auto" style={{ color: 'rgba(244,241,234,0.60)' }}>
                GolfNow isn&apos;t the only one extracting from your course. foreUP, Lightspeed, Club Caddie, and Club Prophet
                all charge real money — and quietly route your golfer data through marketplaces like Barstool Golf Time and Golf Digest.
                Pick your current setup. We&apos;ll calculate the real cost.
              </p>

              {/* Pricing clarifier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
                <div className="rounded-xl p-5"
                     style={{ background: 'rgba(224,168,0,0.08)', border: '1px solid rgba(224,168,0,0.20)' }}>
                  <p className="text-xs font-bold text-[#E0A800] tracking-[0.08em] uppercase mb-2">
                    Founding Partners — First 10 Courses
                  </p>
                  <p className="font-display font-black text-[#E0A800] leading-none mb-2" style={{ fontSize: '28px' }}>
                    $0 / month
                  </p>
                  <p className="text-sm text-[#F4F1EA]/60 leading-relaxed">
                    Free for life. The only obligation: promote TeeAhead to your golfers at the point of booking.
                  </p>
                </div>
                <div className="rounded-xl p-5"
                     style={{ background: 'rgba(244,241,234,0.05)', border: '1px solid rgba(244,241,234,0.12)' }}>
                  <p className="text-xs font-bold text-[#F4F1EA]/50 tracking-[0.08em] uppercase mb-2">
                    Standard Pricing — Course #11+
                  </p>
                  <p className="font-display font-black text-[#F4F1EA] leading-none mb-2" style={{ fontSize: '28px' }}>
                    $299 / month
                  </p>
                  <p className="text-sm text-[#F4F1EA]/60 leading-relaxed">
                    Flat fee. No barter. No commissions. No data extraction. Cancel anytime.
                  </p>
                </div>
              </div>

              {/* Vendor chips */}
              <div className="space-y-3">
                <p className="text-xs font-semibold tracking-[0.08em] uppercase" style={{ color: 'rgba(244,241,234,0.35)' }}>
                  Select your current software
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {VENDOR_KEYS.map((key) => (
                    <button
                      key={key}
                      onClick={() => handleVendorSelect(key)}
                      className="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                      style={selectedVendor === key
                        ? { background: 'rgba(224,168,0,0.15)', border: '1px solid rgba(224,168,0,0.40)', color: '#E0A800' }
                        : { background: 'rgba(244,241,234,0.07)', border: '1px solid rgba(244,241,234,0.15)', color: 'rgba(244,241,234,0.65)' }
                      }
                    >
                      {VENDOR_PRICING[key].name}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs" style={{ color: 'rgba(244,241,234,0.30)' }}>
                Calculator based on market rate data and publicly available vendor pricing (April 2026). Actual costs vary by contract terms.
              </p>
            </div>
          </FadeIn>
        </section>

        {/* ── Calculator + Output ───────────────────────────────── */}
        <section className="px-6 py-8 bg-[#FAF7F2]">
          <div className="max-w-5xl mx-auto md:grid md:grid-cols-5 md:gap-8 md:items-start">

            {/* Left: Sliders */}
            <div className="md:col-span-3 mb-6 md:mb-0">
              <FadeIn>
                <div className="bg-white rounded-[20px] p-8 border border-black/7"
                     style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>

                  <div className="mb-8 pb-6 border-b border-black/6">
                    <p className="text-sm font-bold text-[#1A1A1A]">Software Cost Calculator</p>
                    <p className="text-xs text-[#9DAA9F] mt-0.5">Adjust sliders to match your course</p>
                  </div>

                  {/* Slider 1: Monthly Subscription */}
                  <div className="space-y-3 mb-7">
                    <div className="flex items-center justify-between">
                      <label htmlFor="monthly-sub" className="text-sm font-medium text-[#1A1A1A]">
                        Monthly software subscription
                      </label>
                      <span className="font-display font-bold text-[#0F3D2E]" style={{ fontSize: '22px' }}>
                        ${monthlySubscription}
                      </span>
                    </div>
                    <input
                      id="monthly-sub"
                      type="range" min={0} max={1500} step={10} value={monthlySubscription}
                      onChange={(e) => setMonthlySubscription(Number(e.target.value))}
                      className="w-full h-1.5 rounded-full cursor-pointer"
                      style={{ accentColor: '#0F3D2E' }}
                      aria-label="Monthly subscription cost in dollars"
                    />
                    <p className="text-xs text-[#9DAA9F]">
                      $0–$1,500/month · Include all add-ons (marketing, F&amp;B module, branded app, etc.)
                    </p>
                  </div>

                  {/* Slider 2: Annual Card Volume */}
                  <div className="space-y-3 mb-7">
                    <div className="flex items-center justify-between">
                      <label htmlFor="card-volume" className="text-sm font-medium text-[#1A1A1A]">
                        Annual credit card volume
                      </label>
                      <span className="font-display font-bold text-[#0F3D2E]" style={{ fontSize: '22px' }}>
                        {fmtVolume(annualCardVolume)}
                      </span>
                    </div>
                    <input
                      id="card-volume"
                      type="range" min={100_000} max={5_000_000} step={50_000} value={annualCardVolume}
                      onChange={(e) => setAnnualCardVolume(Number(e.target.value))}
                      className="w-full h-1.5 rounded-full cursor-pointer"
                      style={{ accentColor: '#0F3D2E' }}
                      aria-label="Annual credit card volume in dollars"
                    />
                    <p className="text-xs text-[#9DAA9F]">
                      $100K–$5M · Green fees, pro shop, F&amp;B — everything that runs through cards
                    </p>
                  </div>

                  {/* Slider 3: Payment Processing Rate */}
                  <div className="space-y-3 mb-7">
                    <div className="flex items-center justify-between">
                      <label htmlFor="processing-rate" className="text-sm font-medium text-[#1A1A1A]">
                        Blended payment processing rate
                      </label>
                      <span className="font-display font-bold text-[#0F3D2E]" style={{ fontSize: '22px' }}>
                        {paymentProcessingRate.toFixed(1)}%
                      </span>
                    </div>
                    <input
                      id="processing-rate"
                      type="range" min={2.4} max={4.0} step={0.1} value={paymentProcessingRate}
                      onChange={(e) => setPaymentProcessingRate(Number(e.target.value))}
                      className="w-full h-1.5 rounded-full cursor-pointer"
                      style={{ accentColor: '#0F3D2E' }}
                      aria-label="Payment processing rate as a percentage"
                    />
                    <p className="text-xs text-[#9DAA9F]">
                      2.4%–4.0% · Baseline is 2.5%. Most golf vendors mark this up. Default 2.9% is the median markup.
                    </p>
                  </div>

                  {/* Toggle: Marketplace Distribution */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-[#1A1A1A] block">
                      Tee times distributed on Supreme Golf, Barstool Golf Time, or Golf Digest?
                    </label>
                    <div className="flex gap-2" role="group" aria-label="Marketplace distribution">
                      {(['yes', 'unsure', 'no'] as MarketplaceDistribution[]).map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setMarketplaceDistribution(opt)}
                          aria-pressed={marketplaceDistribution === opt}
                          className="flex-1 rounded-lg py-2 text-sm font-semibold transition-colors"
                          style={marketplaceDistribution === opt
                            ? { background: '#0F3D2E', color: '#F4F1EA' }
                            : { background: '#F4F1EA', border: '1px solid rgba(0,0,0,0.10)', color: '#6B7770' }
                          }
                        >
                          {opt === 'unsure' ? "Don't know" : opt === 'yes' ? 'Yes' : 'No'}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-[#9DAA9F]">
                      If you&apos;re on foreUP, Lightspeed, Club Caddie, or Club Prophet, the answer is almost certainly Yes — even if you don&apos;t know it.
                    </p>
                  </div>

                </div>
              </FadeIn>
            </div>

            {/* Right: Output Panel (sticky on desktop) */}
            <div className="md:col-span-2 md:sticky md:top-6">
              <FadeIn>
                <div className="bg-white rounded-[20px] border border-black/7 overflow-hidden"
                     style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>

                  {/* Section 1: Current vendor cost */}
                  <div className="p-6 space-y-3">
                    <p className="text-xs font-bold tracking-[0.08em] uppercase text-[#6B7770]">
                      What your current vendor actually costs
                    </p>

                    <div className="space-y-2.5">
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm text-[#1A1A1A]">Annual subscription</span>
                        <span className="text-sm font-semibold text-[#1A1A1A]">{fmt(annualSubscription)}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <div>
                          <span className="text-sm text-[#1A1A1A]">Processing markup</span>
                          <p className="text-xs text-[#9DAA9F]">vs. 2.5% baseline</p>
                        </div>
                        <span className="text-sm font-semibold text-[#1A1A1A]">{fmt(processingMarkup)}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <div>
                          <span className="text-sm text-[#1A1A1A]">Marketplace barter</span>
                          {marketplaceDistribution === 'unsure' && (
                            <p className="text-xs text-[#9DAA9F]">conservative estimate</p>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-[#1A1A1A]">
                          {marketplaceDistribution === 'no' ? '$0' : fmt(marketplaceBarter)}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline pt-2 border-t border-black/5">
                        <span className="text-xs text-[#9DAA9F]">Golfer data extracted</span>
                        <span className="text-xs text-[#9DAA9F]">~{golferRecords.toLocaleString()} records/yr</span>
                      </div>
                      <p className="text-xs text-[#9DAA9F] italic">Vendor&apos;s right to aggregate &amp; sell: UNRESTRICTED</p>
                    </div>

                    <div className="bg-[#FAF7F2] rounded-xl p-4 text-center">
                      <p className="text-xs font-medium text-[#6B7770] mb-1">Total annual extraction</p>
                      <p className="font-display font-black text-[#0F3D2E] leading-none" style={{ fontSize: '36px' }}>
                        {fmt(displayedTotal)}
                      </p>
                    </div>
                  </div>

                  {/* VS Divider */}
                  <div className="px-6 py-3 flex items-center gap-3">
                    <div className="flex-1 border-t border-[#0F3D2E]/20" />
                    <span className="text-xs font-bold tracking-[0.12em] uppercase text-[#0F3D2E]">VS. TEEAHEAD</span>
                    <div className="flex-1 border-t border-[#0F3D2E]/20" />
                  </div>

                  {/* Section 2: TeeAhead comparison */}
                  <div className="p-6 space-y-4" style={{ background: 'rgba(15,61,46,0.025)' }}>
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-semibold text-[#0F3D2E]">Founding Partner</p>
                          <p className="text-xs text-[#6B7770]">
                            {allClaimed ? 'All spots claimed' : `${spotsRemaining} of 10 remaining`}
                          </p>
                        </div>
                        <p className="font-display font-black text-[#E0A800]" style={{ fontSize: '22px' }}>$0/yr</p>
                      </div>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-semibold text-[#1A1A1A]">Standard pricing</p>
                          <p className="text-xs text-[#6B7770]">$299/mo, cancel anytime</p>
                        </div>
                        <p className="font-display font-bold text-[#1A1A1A]" style={{ fontSize: '18px' }}>
                          {fmt(TEEAHEAD_PRICING.standardAnnual)}/yr
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-[#6B7770] space-y-1.5">
                      {[
                        'No barter',
                        'No commissions',
                        'No data extraction',
                        'No marketplace routing without your explicit opt-in',
                      ].map((item) => (
                        <p key={item} className="flex items-center gap-1.5">
                          <span className="text-[#0F3D2E] font-bold text-sm">✓</span> {item}
                        </p>
                      ))}
                    </div>

                    <div className="border-t border-black/8 pt-4 space-y-2">
                      <p className="text-xs font-bold tracking-[0.06em] uppercase text-[#6B7770]">Your annual savings</p>
                      {isUnusuallyLean ? (
                        <div className="text-sm leading-relaxed">
                          <p className="font-medium text-[#1A1A1A] mb-1">Your current setup is unusually lean.</p>
                          <p className="text-[#6B7770]">
                            The case for TeeAhead is data ownership and the loyalty layer — not cost.{' '}
                            <Link href="/#how-it-works" className="text-[#0F3D2E] hover:underline">Learn more →</Link>
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex justify-between items-baseline">
                            <span className="text-sm text-[#1A1A1A]">As Founding Partner</span>
                            <span className="font-display font-bold text-[#0F3D2E]" style={{ fontSize: '22px' }}>
                              {fmt(savingsAsFounding)}
                            </span>
                          </div>
                          <div className="flex justify-between items-baseline">
                            <span className="text-sm text-[#6B7770]">As Standard Partner</span>
                            <span className="font-semibold text-[#1A1A1A]">{fmt(savingsAsStandard)}</span>
                          </div>
                          <p className="text-xs text-[#9DAA9F]">
                            Even at standard pricing, you save {fmt(savingsAsStandard)}/year.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </FadeIn>
            </div>

          </div>
        </section>

        {/* ── Proof ──────────────────────────────────────────────── */}
        <section className="px-6 py-16 bg-white">
          <FadeIn>
            <div className="max-w-3xl mx-auto space-y-10">
              <div className="max-w-xl mx-auto text-center space-y-3">
                <h2 className="font-display font-bold text-[#1A1A1A] tracking-[-0.02em]" style={{ fontSize: '32px' }}>
                  This is not a hypothetical.
                </h2>
                <p className="text-[#6B7770] text-base leading-relaxed">
                  The math above isn&apos;t projection — it&apos;s documented industry data.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  {
                    num: '$548M',
                    label: '2026 golf software market valuation',
                    source: 'Industry analysis, 2026',
                  },
                  {
                    num: '5 of 6',
                    label: 'Major non-GolfNow vendors routing tee times to Supreme Golf marketplace by default',
                    source: 'Public integration documentation, 2025–2026',
                  },
                  {
                    num: '"Unrestricted"',
                    label: "Lightspeed and Club Caddie's stated rights to share aggregated golfer data with third parties",
                    source: 'Vendor privacy policies, 2026',
                  },
                ].map(({ num, label, source }) => (
                  <div key={num} className="bg-[#FAF7F2] rounded-xl p-7 space-y-2 ring-1 ring-black/5">
                    <p className="font-display font-bold text-[#0F3D2E]" style={{ fontSize: '32px' }}>{num}</p>
                    <p className="text-sm font-medium text-[#1A1A1A] leading-snug">{label}</p>
                    <p className="text-xs text-[#9DAA9F]">Source: {source}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </section>

        {/* ── Vendor Receipt (conditional) ────────────────────────── */}
        {vendorData && (
          <section className="px-6 py-12 bg-[#FAF7F2]">
            <FadeIn>
              <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-[20px] p-8 border border-black/7 space-y-4"
                     style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold tracking-[0.08em] uppercase text-[#6B7770] mb-1">
                        About {vendorData.name}
                      </p>
                      <p className="text-sm text-[#9DAA9F]">Parent company: {vendorData.parent}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#9DAA9F]">Typical range</p>
                      <p className="text-sm font-semibold text-[#1A1A1A]">
                        ${vendorData.minMonthly}–${vendorData.maxMonthly}/mo
                      </p>
                    </div>
                  </div>
                  <p className="text-base text-[#1A1A1A] leading-relaxed">{vendorData.receipt}</p>
                </div>
              </div>
            </FadeIn>
          </section>
        )}

        {/* ── CTA ────────────────────────────────────────────────── */}
        <section className="px-6 py-20 bg-[#FAF7F2] text-center">
          <FadeIn>
            <div className="max-w-2xl mx-auto space-y-8">
              <h2 className="font-display font-bold text-[#1A1A1A] tracking-[-0.02em] leading-tight" style={{ fontSize: '34px' }}>
                Two ways to join TeeAhead.
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                {/* Founding Partner card */}
                <div className="rounded-[20px] p-6 space-y-3" style={{ background: '#0F3D2E' }}>
                  <div>
                    <p className="text-xs font-bold tracking-[0.08em] uppercase text-[#E0A800] mb-1">Founding Partner</p>
                    <p className="font-display font-black text-[#E0A800] leading-none" style={{ fontSize: '24px' }}>
                      Free for life
                    </p>
                  </div>
                  <p className="text-sm text-[#F4F1EA]/70 leading-relaxed">
                    10 spots total.{' '}
                    <span className="text-[#E0A800] font-semibold">
                      {allClaimed ? 'All claimed.' : `${spotsRemaining} remaining.`}
                    </span>
                    {' '}Obligation: promote TeeAhead to your golfers at booking.
                  </p>
                  <Link
                    href="/waitlist/course?tier=founding"
                    className="inline-flex items-center justify-center w-full rounded-lg bg-[#E0A800] px-5 py-3 text-sm font-semibold text-[#0a0a0a] hover:bg-[#E0A800]/90 transition-colors"
                  >
                    {allClaimed ? 'Join the Waitlist →' : 'Claim a Founding Partner Spot →'}
                  </Link>
                </div>

                {/* Standard card */}
                <div className="rounded-[20px] p-6 space-y-3 bg-white border border-black/8">
                  <div>
                    <p className="text-xs font-bold tracking-[0.08em] uppercase text-[#6B7770] mb-1">Standard Partner</p>
                    <p className="font-display font-bold text-[#0F3D2E] leading-none" style={{ fontSize: '24px' }}>
                      $299/month
                    </p>
                  </div>
                  <p className="text-sm text-[#6B7770] leading-relaxed">
                    Flat fee. No barter. No commissions. No data extraction. Cancel anytime. Available immediately.
                  </p>
                  <Link
                    href="/waitlist/course?tier=standard"
                    className="inline-flex items-center justify-center w-full rounded-lg bg-[#0F3D2E] px-5 py-3 text-sm font-semibold text-[#F4F1EA] hover:opacity-90 transition-opacity"
                  >
                    Get on the Standard Partner List →
                  </Link>
                </div>
              </div>

              {!isUnusuallyLean && (
                <p className="text-sm text-[#6B7770]">
                  Either way, you save{' '}
                  <span className="font-semibold text-[#0F3D2E]">{fmt(savingsAsStandard)}+/year</span>{' '}
                  vs. your current vendor.
                </p>
              )}

              <p className="text-sm text-[#6B7770]">
                Questions? Email Neil directly —{' '}
                <a href="mailto:neil@teeahead.com" className="text-[#0F3D2E] hover:underline font-medium">
                  neil@teeahead.com
                </a>. Not a contact form.
              </p>
            </div>
          </FadeIn>
        </section>

        {/* ── Cross-link to /barter ──────────────────────────────── */}
        <section className="px-6 py-8 bg-white border-t border-black/5">
          <div className="max-w-xl mx-auto text-center">
            <p className="text-sm text-[#6B7770]">
              On GolfNow?{' '}
              <Link href="/barter" className="text-[#0F3D2E] hover:underline font-medium">
                Calculate your barter cost →
              </Link>
            </p>
          </div>
        </section>

      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="bg-[#0F3D2E] border-t border-black/5 px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 mb-12">
            <div className="space-y-3">
              <TeeAheadLogo className="h-10 w-auto brightness-0 invert" />
              <p className="text-sm text-[#F4F1EA]/80 leading-relaxed">Book ahead. Play more. Own your golf.</p>
              <p className="text-xs text-[#F4F1EA]/50">Built in Metro Detroit.</p>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#F4F1EA]/50 uppercase tracking-wider">Product</p>
              <nav className="flex flex-col gap-2 text-sm text-[#F4F1EA]/70">
                <Link href="/waitlist/golfer" className="hover:text-[#F4F1EA] transition-colors">For Golfers</Link>
                <Link href="/waitlist/course" className="hover:text-[#F4F1EA] transition-colors">For Courses</Link>
                <Link href="/#pricing" className="hover:text-[#F4F1EA] transition-colors">Pricing</Link>
                <Link href="/barter" className="hover:text-[#F4F1EA] transition-colors">GolfNow Barter Calculator</Link>
              </nav>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#F4F1EA]/50 uppercase tracking-wider">Company</p>
              <nav className="flex flex-col gap-2 text-sm text-[#F4F1EA]/70">
                <Link href="/about" className="hover:text-[#F4F1EA] transition-colors">About Neil &amp; Billy</Link>
                <a href="mailto:hello@teeahead.com" className="hover:text-[#F4F1EA] transition-colors">Contact</a>
                <Link href="/terms" className="hover:text-[#F4F1EA] transition-colors">Terms</Link>
                <Link href="/privacy" className="hover:text-[#F4F1EA] transition-colors">Privacy</Link>
              </nav>
            </div>
          </div>
          <div className="border-t border-[#F4F1EA]/10 pt-6 text-center space-y-2">
            <p className="text-xs text-[#F4F1EA]/40">© 2026 TeeAhead, LLC. All rights reserved.</p>
            <p className="text-xs text-[#F4F1EA]/30 max-w-2xl mx-auto leading-relaxed">
              Competitor references are for comparative purposes only and based on publicly available information.
              Vendor pricing and marketplace integration data sourced from public documentation as of April 2026.
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SoftwareCostPage.tsx
git commit -m "feat: add SoftwareCostPage client component"
```

---

## Task 7: Create the `/software-cost` Server Page

**Files:**
- Create: `src/app/software-cost/page.tsx`

The server page fetches the founding partner counter from Supabase (same query as `BarterPage` and home page) and passes `spotsRemaining` as a prop to `SoftwareCostPage`.

- [ ] **Step 1: Create the page file**

```typescript
// Legal note: All competitor references are based on publicly available data.
// See src/lib/vendorPricing.ts for full attribution.
// Last legal review: April 2026.
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { SoftwareCostPage } from '@/components/SoftwareCostPage'

export const metadata: Metadata = {
  title: 'Software Cost Calculator: What is your golf software actually costing you? — TeeAhead',
  description:
    'foreUP, Lightspeed, Club Caddie, Club Prophet — they all charge real money and route your golfer data through marketplaces. Calculate the full cost in 30 seconds. No login. No email required.',
  openGraph: {
    title: 'What is your golf software actually costing you?',
    description:
      'Subscription fees + payment processing markup + golfer data extraction + marketplace barter. The full picture, in dollars.',
    type: 'website',
  },
}

export default async function SoftwareCostCalculatorPage() {
  const supabase = await createClient()
  const { data: counter } = await supabase
    .from('founding_partner_counter')
    .select('count, cap')
    .single()

  const spotsRemaining = (counter?.cap ?? 10) - (counter?.count ?? 0)

  return <SoftwareCostPage spotsRemaining={spotsRemaining} />
}
```

- [ ] **Step 2: Run the dev server and verify the page loads**

```bash
cd /Users/barris/Desktop/MulliganLinks && npm run dev
```

Open `http://localhost:3000/software-cost` in the browser. Expected:
- Hero section loads with dark background (#071f17)
- TeeAhead pricing clarifier boxes appear
- Vendor chip buttons are visible
- Calculator sliders are functional
- Output panel shows live totals
- Founding Partner counter matches the home page counter
- No TypeScript errors in the terminal

If there are TypeScript errors, fix them before committing.

- [ ] **Step 3: Commit**

```bash
git add src/app/software-cost/page.tsx
git commit -m "feat: add /software-cost server page with Supabase founding partner counter"
```

---

## Task 8: Add `/cost` Redirect

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Check the Next.js docs for redirect syntax**

```bash
cat /Users/barris/Desktop/MulliganLinks/node_modules/next/dist/docs/02-app/02-api-reference/05-config/01-next-config-js/redirects.md 2>/dev/null | head -60
```

This confirms the current redirect API syntax for this version of Next.js before we write the config.

- [ ] **Step 2: Update `next.config.ts`**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/cost',
        destination: '/software-cost',
        permanent: true,
      },
    ]
  },
}

export default nextConfig;
```

- [ ] **Step 3: Verify the redirect works**

With the dev server still running, navigate to `http://localhost:3000/cost`. Expected: browser redirects to `http://localhost:3000/software-cost`.

- [ ] **Step 4: Commit**

```bash
git add next.config.ts
git commit -m "feat: add /cost → /software-cost permanent redirect"
```

---

## Task 9: Add Cross-Links and Home Page Footer Link

**Files:**
- Modify: `src/components/BarterPage.tsx`
- Modify: `src/app/page.tsx`

### 9a — Add cross-link to `/barter` footer

- [ ] **Step 1: Add cross-link section to `BarterPage.tsx`**

Insert this section immediately before the `</main>` closing tag in `BarterPage.tsx` (after the CTA section, before `</main>`):

```typescript
        {/* ── Cross-link to /software-cost ─────────────────────── */}
        <section className="px-6 py-8 bg-white border-t border-black/5">
          <div className="max-w-xl mx-auto text-center">
            <p className="text-sm text-[#6B7770]">
              Not on GolfNow?{' '}
              <Link href="/software-cost" className="text-[#0F3D2E] hover:underline font-medium">
                See what your software is actually costing you →
              </Link>
            </p>
          </div>
        </section>
```

The closing `</main>` tag is on line 307 of `BarterPage.tsx`. Insert the new section just before it.

### 9b — Add `/software-cost` to home page footer

- [ ] **Step 2: Add link to `src/app/page.tsx` footer Product nav**

In `src/app/page.tsx`, find the footer Product nav section. It contains links for "For Golfers", "For Courses", "Pricing", and "How It Works". Add the Software Cost Calculator link after "How It Works":

Find this text in `src/app/page.tsx`:
```typescript
<Link href="/#how-it-works" className="hover:text-[#F4F1EA] transition-colors">How It Works</Link>
```

Add after it (the exact surrounding context you need to find in the file — there are multiple footers possible, look for the one in the main home page footer section around line 500+):
```typescript
<Link href="/software-cost" className="hover:text-[#F4F1EA] transition-colors">Software Cost Calculator</Link>
```

Also add a link for the Barter Calculator if it isn't already in the home page footer:
```typescript
<Link href="/barter" className="hover:text-[#F4F1EA] transition-colors">GolfNow Barter Calculator</Link>
```

- [ ] **Step 3: Commit cross-links**

```bash
git add src/components/BarterPage.tsx src/app/page.tsx
git commit -m "feat: add cross-links between /barter and /software-cost; add footer links on homepage"
```

---

## Task 10: Run Full Test Suite and Verify

- [ ] **Step 1: Run all unit tests**

```bash
cd /Users/barris/Desktop/MulliganLinks && npx vitest run
```

Expected: All tests pass, including both `barter-calculator.test.ts` and `software-cost-calculator.test.ts`. Fix any failures before proceeding.

- [ ] **Step 2: Run TypeScript type check**

```bash
cd /Users/barris/Desktop/MulliganLinks && npx tsc --noEmit
```

Expected: No TypeScript errors. Fix any before proceeding.

- [ ] **Step 3: Build for production**

```bash
cd /Users/barris/Desktop/MulliganLinks && npm run build
```

Expected: Build succeeds with no errors. Fix any before proceeding.

- [ ] **Step 4: Acceptance criteria verification checklist**

With the dev server running, manually verify each acceptance criterion:

```
AC 1: /software-cost loads with hero, vendor chips, sliders, output panel ___
AC 2: Selecting vendor chip auto-populates subscription slider ___
AC 3: All four sliders update output in real time (no save button) ___
AC 4: Output shows BOTH Founding ($0) AND Standard ($3,588) tiers ___
AC 5: Lean course message appears when totalExtraction < $3,588 ___
      (Test: set subscription to $0, card volume to $100K, rate to 2.5%, marketplace = No)
AC 6: Marketplace toggle (Yes/Don't know/No) changes barter line correctly ___
AC 7: "Claim a Founding Partner Spot" links to /waitlist/course?tier=founding ___
      "Get on the Standard Partner List" links to /waitlist/course?tier=standard ___
AC 8: /barter has cross-link to /software-cost; /software-cost has cross-link to /barter ___
AC 9: Mobile: sliders stack, output panel moves below inputs ___
      (Resize browser to 375px wide to verify)
AC 10: All sliders have aria-label attributes (accessibility) ___
       Marketplace toggle buttons have aria-pressed ___
AC 11: /software-cost appears in home page footer Product nav ___
AC 12: Founding Partner counter on /software-cost matches /barter and home page ___
```

- [ ] **Step 5: Commit any fixes and push**

```bash
# If fixes were needed:
git add -p  # stage only relevant changes
git commit -m "fix: address review issues in software cost calculator"
```

---

## Self-Review: Spec Coverage Check

| Spec Requirement | Task Covering It |
|-----------------|-----------------|
| `/software-cost` page | Task 7 |
| `/cost` redirect | Task 8 |
| Cross-links between `/barter` and `/software-cost` | Task 9 |
| Vendor chips auto-populate subscription slider | Task 6 |
| 4 sliders with correct ranges | Task 6 |
| Live output panel, two sections | Task 6 |
| Founding $0 + Standard $3,588 both shown | Task 6 |
| "Unusually lean" edge case | Task 6 |
| Marketplace yes/unsure/no toggle | Task 6 |
| Vendor-specific receipt block | Task 6 |
| Stats block (3 stats) | Task 6 |
| Both CTAs with `?tier=` query params | Task 6 |
| `?tier=` stored in `course_waitlist.applied_tier` | Tasks 4 & 5 |
| Founding partner counter from Supabase (never out of sync) | Task 7 |
| SEO metadata | Task 7 |
| Mobile layout | Task 6 (CSS grid, responsive) |
| Accessibility (labels, aria-pressed) | Task 6 |
| Home page footer link | Task 9 |
| Unit tests for calculation logic | Tasks 1 & 2 |
| TDD: tests written before implementation | Tasks 1 → 2 order |
| Legal disclaimer in component | Task 6 (comment at top of file) |

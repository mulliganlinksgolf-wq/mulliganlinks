# Audit Changes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all six sections from the April 2026 audit spec — copy corrections, form UX improvements, a mobile slider bug fix, and footer reorganisation.

**Architecture:** All changes are confined to the public marketing site (no admin/app portal). The only structural change is a new `CourseWaitlistSection` client component that lifts countdown state so the countdown widget and the course form can share it. All other changes are in-place edits to existing files.

**Tech Stack:** Next.js App Router, React, Tailwind CSS, Vitest + React Testing Library for unit tests.

**Spec:** `docs/superpowers/specs/2026-04-30-audit-changes-design.md`

---

## File Map

| Action | File |
|--------|------|
| Modify | `src/app/waitlist/golfer/page.tsx` |
| Modify | `src/app/waitlist/golfer/TierPicker.tsx` |
| Modify | `src/app/waitlist/golfer/GolferWaitlistForm.tsx` |
| Modify | `src/app/waitlist/course/page.tsx` |
| Create | `src/app/waitlist/course/CourseWaitlistSection.tsx` |
| Modify | `src/app/waitlist/course/GolfNowCountdown.tsx` |
| Modify | `src/app/waitlist/course/CourseWaitlistForm.tsx` |
| Modify | `src/components/BarterPage.tsx` |
| Modify | `src/components/HomepageFaq.tsx` |
| Modify | `src/components/FoundersScorecard.tsx` |
| Modify | `src/app/page.tsx` (footer only) |
| Test   | `src/test/barter-page.test.tsx` |
| Test   | `src/test/founders-scorecard.test.tsx` |
| Test   | `src/test/homepage-faq.test.tsx` (new) |
| Test   | `src/test/golfer-waitlist-form.test.tsx` (new) |
| Test   | `src/test/tier-picker.test.tsx` (new) |
| Test   | `src/test/course-waitlist-section.test.tsx` (new) |

---

## Task 1: Fix tier multipliers in golfer waitlist

**Files:**
- Modify: `src/app/waitlist/golfer/page.tsx`
- Create: `src/test/tier-picker.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/test/tier-picker.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TierPicker } from '@/app/waitlist/golfer/TierPicker'

vi.mock('@/app/waitlist/golfer/GolferWaitlistForm', () => ({
  GolferWaitlistForm: () => <div data-testid="waitlist-form" />,
}))

const tiers = [
  {
    key: 'fairway',
    name: 'Fairway',
    price: '$0',
    period: 'forever',
    badge: null,
    features: ['Book tee times at partner courses', '1× Fairway Points per dollar'],
  },
  {
    key: 'eagle',
    name: 'Eagle',
    price: '$89',
    period: '/yr',
    badge: 'Most Popular',
    features: ['1.5× Fairway Points per dollar', 'Priority booking: 48hr early access'],
  },
  {
    key: 'ace',
    name: 'Ace',
    price: '$159',
    period: '/yr',
    badge: null,
    features: ['2× Fairway Points per dollar', 'Priority booking: 72hr early access'],
  },
]

describe('TierPicker', () => {
  it('shows 1.5x for Eagle and never shows the old 2x Eagle multiplier', () => {
    render(<TierPicker tiers={tiers} initialTier="fairway" />)
    expect(screen.getByText(/1\.5× Fairway Points per dollar/i)).toBeInTheDocument()
    // 3x should never appear (old Ace value)
    expect(screen.queryByText(/3× Fairway Points per dollar/i)).not.toBeInTheDocument()
  })

  it('shows 2x for Ace and never shows the old 3x Ace multiplier', () => {
    render(<TierPicker tiers={tiers} initialTier="fairway" />)
    expect(screen.getByText(/2× Fairway Points per dollar/i)).toBeInTheDocument()
    expect(screen.queryByText(/3× Fairway Points per dollar/i)).not.toBeInTheDocument()
  })

  it('shows fine print about course variation', () => {
    render(<TierPicker tiers={tiers} initialTier="fairway" />)
    expect(
      screen.getByText(/each course varies on how they would like to promote their deals/i)
    ).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run src/test/tier-picker.test.tsx
```

Expected: FAIL — fine print text not found, multipliers may differ.

- [ ] **Step 3: Fix multipliers in `page.tsx`**

In `src/app/waitlist/golfer/page.tsx`, find the `tiers` array. Update the `features` arrays:

For Eagle, change:
```
'2× Fairway Points per dollar',
```
to:
```
'1.5× Fairway Points per dollar',
```

For Ace, change:
```
'3× Fairway Points per dollar',
```
to:
```
'2× Fairway Points per dollar',
```

- [ ] **Step 4: Add fine print to `TierPicker.tsx`**

In `src/app/waitlist/golfer/TierPicker.tsx`, after the closing `</div>` of the tier cards grid (the `grid grid-cols-1 sm:grid-cols-3 gap-6` div), add:

```tsx
<p className="text-xs text-[#9DAA9F] text-center mt-4 italic">
  Each course varies on how they would like to promote their deals.
</p>
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npx vitest run src/test/tier-picker.test.tsx
```

Expected: All 3 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/waitlist/golfer/page.tsx src/app/waitlist/golfer/TierPicker.tsx src/test/tier-picker.test.tsx
git commit -m "fix: correct Eagle to 1.5x and Ace to 2x multipliers; add tier fine print"
```

---

## Task 2: Flatten golfer waitlist form

**Files:**
- Modify: `src/app/waitlist/golfer/GolferWaitlistForm.tsx`
- Create: `src/test/golfer-waitlist-form.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/test/golfer-waitlist-form.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { GolferWaitlistForm } from '@/app/waitlist/golfer/GolferWaitlistForm'

vi.mock('@/app/waitlist/golfer/actions', () => ({
  joinGolferWaitlist: vi.fn(),
}))

describe('GolferWaitlistForm', () => {
  it('shows last name field without needing to open an accordion', () => {
    render(<GolferWaitlistForm />)
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
  })

  it('does not render an accordion toggle button', () => {
    render(<GolferWaitlistForm />)
    expect(
      screen.queryByRole('button', { name: /optional.*personalize/i })
    ).not.toBeInTheDocument()
  })

  it('shows optional fields without any user interaction', () => {
    render(<GolferWaitlistForm />)
    expect(screen.getByLabelText(/home course/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/rounds per year/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/current membership/i)).toBeInTheDocument()
  })

  it('last name field is not marked required', () => {
    render(<GolferWaitlistForm />)
    const lastNameInput = screen.getByLabelText(/last name/i)
    expect(lastNameInput).not.toHaveAttribute('required')
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run src/test/golfer-waitlist-form.test.tsx
```

Expected: FAIL — accordion toggle exists, last name hidden.

- [ ] **Step 3: Rewrite the optional section in `GolferWaitlistForm.tsx`**

In `src/app/waitlist/golfer/GolferWaitlistForm.tsx`:

1. Remove the `showOptional` state and its setter entirely.
2. Remove the accordion `<button>` toggle and the `overflow-hidden` animated wrapper div.
3. Move the **Last name** field up, out of the optional block, to sit directly after the First name field (before Email). Keep it not required — no asterisk, no `required` attribute, label reads just `"Last name"`.
4. Replace the accordion wrapper with a simple flat section:

```tsx
{/* ── Optional fields ─────────────────────────── */}
<div className="space-y-5 pt-2">
  <p className="text-sm font-medium text-[#F4F1EA]/70">
    Optional — help us personalize your experience
  </p>

  <div className="space-y-1.5">
    <Label htmlFor="home_course" className="text-[#F4F1EA]">Home course</Label>
    <Input
      id="home_course"
      name="home_course"
      disabled={isPending}
      placeholder="Oakland Hills, Detroit Golf Club, etc."
      className="bg-white/10 border-white/20 text-[#F4F1EA] placeholder:text-[#F4F1EA]/40 focus-visible:ring-[#E0A800]"
    />
  </div>

  <div className="space-y-1.5">
    <Label htmlFor="rounds_per_year" className="text-[#F4F1EA]">Rounds per year</Label>
    <select id="rounds_per_year" name="rounds_per_year" disabled={isPending} className={selectClassName}>
      <option value="">Select…</option>
      <option value="under_10">Under 10</option>
      <option value="10_20">10–20</option>
      <option value="20_40">20–40</option>
      <option value="40_plus">40+</option>
    </select>
  </div>

  <div className="space-y-1.5">
    <Label htmlFor="current_membership" className="text-[#F4F1EA]">Current membership</Label>
    <select id="current_membership" name="current_membership" disabled={isPending} className={selectClassName}>
      <option value="">Select…</option>
      <option value="none">None</option>
      <option value="golfpass_plus">GolfPass+</option>
      <option value="troon_access">Troon Access</option>
      <option value="other">Other</option>
    </select>
  </div>

  <div className="space-y-2">
    <Label className="text-[#F4F1EA]">Which tier interests you most?</Label>
    <div className="space-y-2">
      {[
        { value: 'fairway', label: 'Fairway — Free forever' },
        { value: 'eagle', label: 'Eagle — $89/yr (most popular)' },
        { value: 'ace', label: 'Ace — $159/yr (all-in)' },
        { value: 'not_sure', label: 'Not sure yet' },
      ].map(({ value, label }) => (
        <label key={value} className="flex items-center gap-3 cursor-pointer">
          <input
            type="radio"
            name="interested_tier"
            value={value}
            disabled={isPending}
            checked={selectedTier === value}
            onChange={() => setSelectedTier(value)}
            className="accent-[#E0A800]"
          />
          <span className="text-sm text-[#F4F1EA]">{label}</span>
        </label>
      ))}
    </div>
  </div>

  <div className="space-y-1.5">
    <Label htmlFor="referral_source" className="text-[#F4F1EA]">Where did you hear about us?</Label>
    <Input
      id="referral_source"
      name="referral_source"
      disabled={isPending}
      placeholder="Instagram, friend, golf course, etc."
      className="bg-white/10 border-white/20 text-[#F4F1EA] placeholder:text-[#F4F1EA]/40 focus-visible:ring-[#E0A800]"
    />
  </div>
</div>
```

The Last name field goes in the main section, directly after First name, before Email:

```tsx
<div className="space-y-1.5">
  <Label htmlFor="last_name" className="text-[#F4F1EA]">Last name</Label>
  <Input
    id="last_name"
    name="last_name"
    disabled={isPending}
    placeholder="Nicklaus"
    className="bg-white/10 border-white/20 text-[#F4F1EA] placeholder:text-[#F4F1EA]/40 focus-visible:ring-[#E0A800]"
  />
</div>
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/test/golfer-waitlist-form.test.tsx
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/waitlist/golfer/GolferWaitlistForm.tsx src/test/golfer-waitlist-form.test.tsx
git commit -m "feat: flatten golfer waitlist optional fields, move last name to main section"
```

---

## Task 3: Course waitlist copy + multi-year note

**Files:**
- Modify: `src/app/waitlist/course/page.tsx`

- [ ] **Step 1: Fix "Live within 48 hours" copy**

In `src/app/waitlist/course/page.tsx`, find every instance of `"Live in 48 hours"` and change to `"Live within 48 hours"`. There is at least one in the benefit cards section:

```tsx
// Before
title: 'Live in 48 hours',
// After
title: 'Live within 48 hours',
```

Also check the body text of that card:
```tsx
// Before
body: 'We handle the tech. Your golfers can book immediately.',
// After — no change needed to body, only the title
```

And the headline:
```tsx
// Before
<h2 ...>Live in 48 hours. Zero tech headaches.</h2>
// After
<h2 ...>Live within 48 hours. Zero tech headaches.</h2>
```

- [ ] **Step 2: Add multi-year pricing note**

In `src/app/waitlist/course/page.tsx`, find the Standard pricing card (the one showing `$349/mo`). After its `<p className="text-sm text-[#6B7770]...">` description, add:

```tsx
<p className="text-xs text-[#9DAA9F] mt-1">
  Multi-year contracts available at a discount — ask Neil.
</p>
```

- [ ] **Step 3: Verify visually and commit**

```bash
git add src/app/waitlist/course/page.tsx
git commit -m "fix: 'live within 48 hours' copy; add multi-year pricing note"
```

---

## Task 4: GolfNow countdown → form auto-fill

**Files:**
- Create: `src/app/waitlist/course/CourseWaitlistSection.tsx`
- Modify: `src/app/waitlist/course/GolfNowCountdown.tsx`
- Modify: `src/app/waitlist/course/CourseWaitlistForm.tsx`
- Modify: `src/app/waitlist/course/page.tsx`
- Create: `src/test/course-waitlist-section.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/test/course-waitlist-section.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CourseWaitlistSection } from '@/app/waitlist/course/CourseWaitlistSection'

vi.mock('@/app/waitlist/course/CourseWaitlistForm', () => ({
  CourseWaitlistForm: ({ prefillExpiryDate }: { prefillExpiryDate?: string }) => (
    <div data-testid="course-form">
      <input
        data-testid="expiry-input"
        name="contract_expiry_date"
        type="date"
        defaultValue={prefillExpiryDate ?? ''}
        readOnly
      />
    </div>
  ),
}))

vi.mock('@/app/waitlist/course/GolfNowCountdown', () => ({
  GolfNowCountdown: ({
    expiryDate,
    onExpiryChange,
  }: {
    expiryDate: string
    onExpiryChange: (v: string) => void
  }) => (
    <input
      data-testid="countdown-input"
      type="date"
      value={expiryDate}
      onChange={(e) => onExpiryChange(e.target.value)}
    />
  ),
}))

describe('CourseWaitlistSection', () => {
  it('passes expiry date entered in countdown down to the form', () => {
    render(<CourseWaitlistSection spotsRemaining={5} />)
    const countdownInput = screen.getByTestId('countdown-input')
    fireEvent.change(countdownInput, { target: { value: '2026-12-31' } })
    const expiryInput = screen.getByTestId('expiry-input')
    expect(expiryInput).toHaveValue('2026-12-31')
  })

  it('starts with empty expiry date', () => {
    render(<CourseWaitlistSection spotsRemaining={5} />)
    expect(screen.getByTestId('countdown-input')).toHaveValue('')
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run src/test/course-waitlist-section.test.tsx
```

Expected: FAIL — `CourseWaitlistSection` does not exist.

- [ ] **Step 3: Update `GolfNowCountdown` to accept props**

Replace the component's own state management with controlled props. Full replacement for `src/app/waitlist/course/GolfNowCountdown.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface GolfNowCountdownProps {
  expiryDate: string
  onExpiryChange: (value: string) => void
}

export function GolfNowCountdown({ expiryDate, onExpiryChange }: GolfNowCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number; hours: number; minutes: number; seconds: number
  } | null>(null)

  useEffect(() => {
    if (!expiryDate) { setTimeLeft(null); return }
    const target = new Date(expiryDate + 'T00:00:00').getTime()
    function tick() {
      const now = Date.now()
      const diff = target - now
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiryDate])

  return (
    <div className="max-w-3xl mx-auto text-center space-y-6">
      <p className="text-xs font-bold tracking-[0.14em] uppercase text-[#9DAA9F]">GolfNow Contract Expiry Countdown</p>
      <h2 className="font-display font-black text-[#0F3D2E] text-2xl">How long until you can switch?</h2>
      <div className="max-w-xs mx-auto space-y-1.5 text-left">
        <Label htmlFor="golfnow_expiry_preview">Your GolfNow contract expiry date</Label>
        <Input
          id="golfnow_expiry_preview"
          type="date"
          value={expiryDate}
          onChange={e => onExpiryChange(e.target.value)}
        />
      </div>
      {timeLeft ? (
        <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
          {[
            { value: timeLeft.days, label: 'Days' },
            { value: timeLeft.hours, label: 'Hours' },
            { value: timeLeft.minutes, label: 'Minutes' },
            { value: timeLeft.seconds, label: 'Seconds' },
          ].map(({ value, label }) => (
            <div key={label} className="bg-[#0F3D2E] rounded-xl p-4 text-center">
              <p className="font-display font-black text-[#F4F1EA] text-3xl leading-none">{String(value).padStart(2, '0')}</p>
              <p className="text-xs text-[#F4F1EA]/60 mt-1 uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4 max-w-md mx-auto opacity-30">
          {['Days', 'Hours', 'Minutes', 'Seconds'].map(label => (
            <div key={label} className="bg-[#0F3D2E] rounded-xl p-4 text-center">
              <p className="font-display font-black text-[#F4F1EA] text-3xl leading-none">--</p>
              <p className="text-xs text-[#F4F1EA]/60 mt-1 uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      )}
      <p className="text-sm text-[#6B7770]">We&apos;ll remind you at 6 months, 3 months, 1 month &amp; more…</p>
    </div>
  )
}
```

- [ ] **Step 4: Update `CourseWaitlistForm` to accept prefill prop**

In `src/app/waitlist/course/CourseWaitlistForm.tsx`, add `prefillExpiryDate?: string` to the component props, and use it as the `defaultValue` on the `contract_expiry_date` input:

```tsx
// Change signature from:
export function CourseWaitlistForm() {
// To:
export function CourseWaitlistForm({ prefillExpiryDate }: { prefillExpiryDate?: string }) {
```

Then find the `contract_expiry_date` input and add `defaultValue`:

```tsx
<Input
  id="contract_expiry_date"
  name="contract_expiry_date"
  type="date"
  disabled={isPending}
  defaultValue={prefillExpiryDate ?? ''}
  className="bg-white/10 border-white/20 text-[#F4F1EA] placeholder:text-[#F4F1EA]/40 focus-visible:ring-[#E0A800]"
/>
```

- [ ] **Step 5: Create `CourseWaitlistSection.tsx`**

Create `src/app/waitlist/course/CourseWaitlistSection.tsx`:

```tsx
'use client'

import { useState, Suspense } from 'react'
import { GolfNowCountdown } from './GolfNowCountdown'
import { CourseWaitlistForm } from './CourseWaitlistForm'

interface CourseWaitlistSectionProps {
  spotsRemaining: number
}

export function CourseWaitlistSection({ spotsRemaining }: CourseWaitlistSectionProps) {
  const [expiryDate, setExpiryDate] = useState('')

  return (
    <>
      {/* GolfNow Countdown */}
      <section className="bg-white px-6 py-12 border-t border-black/5">
        <GolfNowCountdown expiryDate={expiryDate} onExpiryChange={setExpiryDate} />
      </section>

      {/* Waitlist Form */}
      <section className="px-6 py-16 bg-[#FAF7F2]">
        <div className="max-w-xl mx-auto">
          <div className="bg-[#0F3D2E] rounded-2xl p-8 sm:p-10">
            <p className="text-xs font-bold tracking-[0.14em] uppercase text-[#E0A800] mb-2">
              COURSE WAITLIST — FOUNDING PARTNER PROGRAM
            </p>
            {spotsRemaining > 0 && spotsRemaining < 10 && (
              <p className="text-sm text-[#E0A800]/80 mb-2">{spotsRemaining} of 10 founding spots remaining.</p>
            )}
            <p className="text-lg font-semibold text-[#F4F1EA] mb-8">Bring TeeAhead to your course.</p>
            <Suspense fallback={null}>
              <CourseWaitlistForm prefillExpiryDate={expiryDate || undefined} />
            </Suspense>
          </div>
        </div>
      </section>
    </>
  )
}
```

- [ ] **Step 6: Update `page.tsx` to use `CourseWaitlistSection`**

In `src/app/waitlist/course/page.tsx`:

1. Remove the direct imports of `GolfNowCountdown` and `CourseWaitlistForm` (if they're imported at the top level).
2. Add import: `import { CourseWaitlistSection } from './CourseWaitlistSection'`
3. Replace the two separate sections (the GolfNow countdown `<section>` and the form `<section>`) with a single:

```tsx
<CourseWaitlistSection spotsRemaining={spotsRemaining} />
```

- [ ] **Step 7: Run tests to confirm they pass**

```bash
npx vitest run src/test/course-waitlist-section.test.tsx
```

Expected: Both tests PASS.

- [ ] **Step 8: Commit**

```bash
git add src/app/waitlist/course/CourseWaitlistSection.tsx \
        src/app/waitlist/course/GolfNowCountdown.tsx \
        src/app/waitlist/course/CourseWaitlistForm.tsx \
        src/app/waitlist/course/page.tsx \
        src/test/course-waitlist-section.test.tsx
git commit -m "feat: auto-fill contract expiry date from countdown into waitlist form"
```

---

## Task 5: Fix barter calculator slider glitch on mobile

**Files:**
- Modify: `src/components/BarterPage.tsx`
- Modify: `src/test/barter-page.test.tsx`

- [ ] **Step 1: Write the failing test**

In `src/test/barter-page.test.tsx`, add a new test inside the existing `describe('BarterPage — rendering')` block:

```tsx
it('all range sliders have touchAction none to prevent mobile scroll conflict', () => {
  const { container } = render(<BarterPage spotsRemaining={10} />)
  const sliders = container.querySelectorAll('input[type="range"]')
  expect(sliders.length).toBe(3)
  sliders.forEach((slider) => {
    expect((slider as HTMLElement).style.touchAction).toBe('none')
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run src/test/barter-page.test.tsx
```

Expected: FAIL — sliders do not have `touchAction: none`.

- [ ] **Step 3: Add `touchAction: 'none'` to all three sliders in `BarterPage.tsx`**

In `src/components/BarterPage.tsx`, update each of the three `<input type="range">` elements. Each currently has `style={{ accentColor: '#0F3D2E' }}`. Merge `touchAction: 'none'` into that style object:

Line ~164 (green fee slider):
```tsx
style={{ accentColor: '#0F3D2E', touchAction: 'none' }}
```

Line ~179 (operating days slider):
```tsx
style={{ accentColor: '#0F3D2E', touchAction: 'none' }}
```

Line ~194 (barter tee times slider):
```tsx
style={{ accentColor: '#0F3D2E', touchAction: 'none' }}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/test/barter-page.test.tsx
```

Expected: All tests PASS including the new one.

- [ ] **Step 5: Commit**

```bash
git add src/components/BarterPage.tsx src/test/barter-page.test.tsx
git commit -m "fix: prevent mobile scroll conflict on barter calculator sliders"
```

---

## Task 6: FAQ copy updates

**Files:**
- Modify: `src/components/HomepageFaq.tsx`
- Create: `src/test/homepage-faq.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/test/homepage-faq.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { HomepageFaq } from '@/components/HomepageFaq'

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('HomepageFaq', () => {
  it('Q1 mentions founding partners', () => {
    render(<HomepageFaq />)
    expect(
      screen.getByText(/Is TeeAhead really free for courses for founding partners\?/i)
    ).toBeInTheDocument()
  })

  it('Q3 answer includes billy@teeahead.com', () => {
    render(<HomepageFaq />)
    // Open Q3
    const q3Button = screen.getByRole('button', {
      name: /What if my course already uses EZLinks/i,
    })
    fireEvent.click(q3Button)
    expect(
      screen.getByRole('link', { name: 'billy@teeahead.com' })
    ).toHaveAttribute('href', 'mailto:billy@teeahead.com')
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run src/test/homepage-faq.test.tsx
```

Expected: FAIL — Q1 text doesn't match, billy's email missing from Q3.

- [ ] **Step 3: Update Q1 question text in `HomepageFaq.tsx`**

In `src/components/HomepageFaq.tsx`, find:
```tsx
q: 'Is TeeAhead really free for courses?',
```
Change to:
```tsx
q: 'Is TeeAhead really free for courses for founding partners?',
```

- [ ] **Step 4: Add Billy's email to Q3 answer**

Find the Q3 entry (`What if my course already uses EZLinks...`). Its current answer ends with:
```tsx
<a href="mailto:neil@teeahead.com" className="underline text-[#0F3D2E] hover:text-[#0F3D2E]/80">
  neil@teeahead.com
</a>{' '}
— he'll give you a straight answer about your specific setup.
```

Replace that ending with:
```tsx
<a href="mailto:neil@teeahead.com" className="underline text-[#0F3D2E] hover:text-[#0F3D2E]/80">
  neil@teeahead.com
</a>{' '}
or{' '}
<a href="mailto:billy@teeahead.com" className="underline text-[#0F3D2E] hover:text-[#0F3D2E]/80">
  billy@teeahead.com
</a>{' '}
— they&apos;ll give you a straight answer about your specific setup.
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npx vitest run src/test/homepage-faq.test.tsx
```

Expected: Both tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/HomepageFaq.tsx src/test/homepage-faq.test.tsx
git commit -m "fix: update FAQ Q1 wording; add billy email to Q3"
```

---

## Task 7: Founders Scorecard — Holes 4 & 5

**Files:**
- Modify: `src/components/FoundersScorecard.tsx`
- Modify: `src/test/founders-scorecard.test.tsx`

- [ ] **Step 1: Add failing tests to `founders-scorecard.test.tsx`**

Append these tests to the existing file:

```tsx
test('Hole 4 reflects the updated "Why" copy', () => {
  render(<FoundersScorecard />)
  expect(
    screen.getByText(/just like every other golfer that wants something more reasonable and innovative/i)
  ).toBeInTheDocument()
})

test('Hole 5 does not contain "feels the same way"', () => {
  render(<FoundersScorecard />)
  expect(screen.queryByText(/feels the same way/i)).not.toBeInTheDocument()
})

test('Hole 5 includes billy email in the course outreach text', () => {
  render(<FoundersScorecard />)
  // Both emails should appear as mailto links (neil already tested above — this checks billy in the Ask hole context)
  const billyLinks = screen.getAllByRole('link', { name: 'billy@teeahead.com' })
  expect(billyLinks.length).toBeGreaterThanOrEqual(1)
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/test/founders-scorecard.test.tsx
```

Expected: The three new tests FAIL.

- [ ] **Step 3: Update Hole 4 notes in `FoundersScorecard.tsx`**

Find the Hole 4 entry in the `HOLES` array. Replace its `notes` with:

```tsx
notes: (
  <>
    We&apos;re just like every other golfer that wants something more reasonable
    and innovative.
  </>
),
```

- [ ] **Step 4: Update Hole 5 notes in `FoundersScorecard.tsx`**

Find the Hole 5 entry. Replace its `notes` with:

```tsx
notes: (
  <>
    If you run a course in Metro Detroit, reach out to Neil or Billy directly —{' '}
    <a
      href="mailto:neil@teeahead.com"
      className="text-[#0F3D2E] underline decoration-dotted"
    >
      neil@teeahead.com
    </a>{' '}
    or{' '}
    <a
      href="mailto:billy@teeahead.com"
      className="text-[#0F3D2E] underline decoration-dotted"
    >
      billy@teeahead.com
    </a>
    .
  </>
),
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npx vitest run src/test/founders-scorecard.test.tsx
```

Expected: All tests PASS (existing + 3 new).

- [ ] **Step 6: Commit**

```bash
git add src/components/FoundersScorecard.tsx src/test/founders-scorecard.test.tsx
git commit -m "fix: update Founders Scorecard holes 4 and 5 copy"
```

---

## Task 8: Footer — contact link + product column reorganisation

**Files:**
- Modify: `src/app/page.tsx` (homepage footer)
- Modify: `src/app/waitlist/course/page.tsx` (footer)
- Modify: `src/app/waitlist/golfer/page.tsx` (footer)

All three pages contain an identical inline footer. Apply the same changes to each.

- [ ] **Step 1: Update the contact link**

In each footer, find:
```tsx
<a href="mailto:support@teeahead.com" className="hover:text-[#F4F1EA] transition-colors">Contact</a>
```
Replace with:
```tsx
<Link href="/contact" className="hover:text-[#F4F1EA] transition-colors">Contact</Link>
```

Verify `Link` is already imported from `next/link` at the top of each file (it is in all three).

- [ ] **Step 2: Reorganise the Product column**

In each footer, find the Product `<nav>` block and replace its contents with:

```tsx
<nav className="flex flex-col gap-2 text-sm text-[#F4F1EA]/70">
  <p className="text-xs font-semibold text-[#F4F1EA]/40 uppercase tracking-wider mt-1">For Golfers</p>
  <Link href="/#pricing" className="hover:text-[#F4F1EA] transition-colors pl-2">Pricing</Link>

  <p className="text-xs font-semibold text-[#F4F1EA]/40 uppercase tracking-wider mt-2">For Courses</p>
  <Link href="/barter" className="hover:text-[#F4F1EA] transition-colors pl-2">Barter Calculator</Link>
  <Link href="/damage" className="hover:text-[#F4F1EA] transition-colors pl-2">GolfNow Damage Report</Link>
  <Link href="/software-cost" className="hover:text-[#F4F1EA] transition-colors pl-2">Software Cost Calculator</Link>
</nav>
```

- [ ] **Step 3: Verify all three footers are updated, then commit**

```bash
git add src/app/page.tsx src/app/waitlist/course/page.tsx src/app/waitlist/golfer/page.tsx
git commit -m "feat: reorganise footer product column; contact links to /contact page"
```

---

## Task 9: Full test run + smoke check

- [ ] **Step 1: Run the full Vitest suite**

```bash
npx vitest run
```

Expected: All tests pass. Fix any failures before continuing.

- [ ] **Step 2: Build to catch type errors**

```bash
npm run build
```

Expected: Build completes with no errors or type errors.

- [ ] **Step 3: Smoke-check key pages in browser**

Start the dev server:
```bash
npm run dev
```

Visit each changed page and verify:
- `/waitlist/golfer` — Tier cards show 1.5× Eagle, 2× Ace. Fine print visible. Form shows last name and optional fields without accordion.
- `/waitlist/course` — "Live within 48 hours" text. Multi-year note under $349. Entering a date in countdown pre-fills the form's expiry field.
- `/barter` — Sliders work on mobile without causing page scroll.
- Homepage + both waitlist pages — Footer Product column has "For Golfers / For Courses" grouping. Contact links to `/contact`.
- FAQ accordion — Q1 reads "…for founding partners?". Q3 shows both emails.
- Founders Scorecard — Hole 4 and 5 copy updated.

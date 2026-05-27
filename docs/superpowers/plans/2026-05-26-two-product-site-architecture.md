# Two-Product Site Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the homepage operator reshape, the public `/play/[slug]` golfer landing page, the `/courses` directory stub, and the operator-only `/course/[slug]/marketing` asset kit (with a day-zero onboarding link to it) — four deliverables landed sequentially on a single feature branch, pushed to qa per deliverable for review before the branch merges to main.

**Architecture:** Next.js App Router (server components by default, thin client wrappers where browser APIs are needed). Supabase server client for data. `revalidate: 300` ISR on `/play/[slug]`. New components live in audience-scoped namespaces: `src/components/play/`, `src/components/marketing/`, `src/components/home/`. Analytics via `@vercel/analytics`'s `track()` directly. QR generation via a route handler at `/api/qr/[slug]` using the already-installed `qrcode` package.

**Tech Stack:** Next.js (App Router), TypeScript, Tailwind, Supabase (server client at `@/lib/supabase/server`), Vitest + React Testing Library (unit), Playwright (e2e), `@vercel/analytics`, `qrcode`.

**Spec:** [docs/superpowers/specs/2026-05-26-two-product-site-architecture-design.md](../specs/2026-05-26-two-product-site-architecture-design.md)

**Branch strategy:** All work on `feat/two-product-site` off `main`. After each Phase's tasks land, push to `qa` branch, wait for review on `qa.teeahead.com`. Do **not** merge to `main` until all four phases are approved.

---

## Phase 0: Branch setup

### Task 0.1: Create the feature branch

**Files:**
- (none)

- [ ] **Step 1: Confirm clean state**

Run: `git status -s`
Expected: working tree is clean of unrelated changes you'd commit (untracked files with " 2" suffixes from Finder duplicates can be ignored or removed).

- [ ] **Step 2: Create and checkout the branch**

```bash
git checkout main
git pull --ff-only origin main
git checkout -b feat/two-product-site
```

- [ ] **Step 3: Verify**

Run: `git branch --show-current`
Expected: `feat/two-product-site`

---

## Phase 1: Homepage reshape + `/courses` stub (Deliverable 1)

These ship together because the `GolferEscapeBanner` link target is `/courses`.

### Task 1.1: Create `GolferEscapeBanner` component (TDD — localStorage dismissal)

**Files:**
- Create: `src/components/home/GolferEscapeBanner.tsx`
- Create: `src/test/golfer-escape-banner.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/test/golfer-escape-banner.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import GolferEscapeBanner from '@/components/home/GolferEscapeBanner'

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

vi.mock('@vercel/analytics', () => ({
  track: vi.fn(),
}))

describe('GolferEscapeBanner', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders the banner copy when not dismissed', () => {
    render(<GolferEscapeBanner />)
    expect(screen.getByText(/Looking to play, not run a course/i)).toBeInTheDocument()
    expect(screen.getByText(/See if your course is on TeeAhead/i)).toBeInTheDocument()
  })

  it('hides itself when the localStorage flag is set', () => {
    window.localStorage.setItem('teeahead.golfer-banner-dismissed', 'true')
    render(<GolferEscapeBanner />)
    expect(screen.queryByText(/Looking to play, not run a course/i)).not.toBeInTheDocument()
  })

  it('renders the banner when localStorage throws (private-mode-style failure)', () => {
    const original = window.localStorage.getItem
    Object.defineProperty(window.localStorage, 'getItem', {
      configurable: true,
      value: () => { throw new Error('private mode') },
    })
    try {
      render(<GolferEscapeBanner />)
      expect(screen.getByText(/Looking to play, not run a course/i)).toBeInTheDocument()
    } finally {
      Object.defineProperty(window.localStorage, 'getItem', { configurable: true, value: original })
    }
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/test/golfer-escape-banner.test.tsx`
Expected: FAIL with `Cannot find module '@/components/home/GolferEscapeBanner'`.

- [ ] **Step 3: Implement the component**

Create `src/components/home/GolferEscapeBanner.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { track } from '@vercel/analytics'

const STORAGE_KEY = 'teeahead.golfer-banner-dismissed'

export default function GolferEscapeBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === 'true') {
        setDismissed(true)
      }
    } catch {
      // localStorage unavailable (private mode); show the banner
    }
    setHydrated(true)
  }, [])

  if (!hydrated) {
    return (
      <div className="bg-[#0F3D2E]/5 border border-[#0F3D2E]/15 px-4 py-3 text-[13px] text-[#0F3D2E] flex items-center justify-between">
        <span>
          Looking to play, not run a course?{' '}
          <Link
            href="/courses"
            className="underline underline-offset-2"
            onClick={() => track('homepage_golfer_banner_clicked', { source: 'hole_01' })}
          >
            See if your course is on TeeAhead →
          </Link>
        </span>
        <button
          type="button"
          aria-label="Dismiss"
          className="text-[#0F3D2E]/60 hover:text-[#0F3D2E] text-[16px] leading-none px-1"
          onClick={() => {
            try { window.localStorage.setItem(STORAGE_KEY, 'true') } catch {}
            setDismissed(true)
          }}
        >
          ×
        </button>
      </div>
    )
  }

  if (dismissed) return null

  return (
    <div className="bg-[#0F3D2E]/5 border border-[#0F3D2E]/15 px-4 py-3 text-[13px] text-[#0F3D2E] flex items-center justify-between">
      <span>
        Looking to play, not run a course?{' '}
        <Link
          href="/courses"
          className="underline underline-offset-2"
          onClick={() => track('homepage_golfer_banner_clicked', { source: 'hole_01' })}
        >
          See if your course is on TeeAhead →
        </Link>
      </span>
      <button
        type="button"
        aria-label="Dismiss"
        className="text-[#0F3D2E]/60 hover:text-[#0F3D2E] text-[16px] leading-none px-1"
        onClick={() => {
          try { window.localStorage.setItem(STORAGE_KEY, 'true') } catch {}
          setDismissed(true)
        }}
      >
        ×
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test src/test/golfer-escape-banner.test.tsx`
Expected: PASS — all three test cases green.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/GolferEscapeBanner.tsx src/test/golfer-escape-banner.test.tsx
git commit -m "feat(home): add GolferEscapeBanner with localStorage dismissal"
```

---

### Task 1.2: Add operator eyebrow and the banner to the homepage

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Read Hole 01 of the homepage**

Open `src/app/page.tsx` and locate Hole 01 — it starts around line 52 with a `YardageShell` containing the `$94,500.` H1. Identify the JSX position immediately above the H1 (eyebrow goes here) and the JSX position at the bottom of Hole 01 just before `</YardageShell>` (banner goes here).

- [ ] **Step 2: Add the import at the top of `page.tsx`**

Add to the existing import block near the top:

```tsx
import GolferEscapeBanner from '@/components/home/GolferEscapeBanner'
```

- [ ] **Step 3: Add the eyebrow above the H1 in Hole 01**

Just before the existing `<h1>` containing `$94,500.`, insert:

```tsx
<p className="font-mono text-[11px] tracking-[0.2em] text-[#0F3D2E]/60 uppercase mb-2">
  Software for Golf Course Operators
</p>
```

- [ ] **Step 4: Add the banner at the bottom of Hole 01**

Inside Hole 01's `YardageShell`, just before `</YardageShell>` (or before the `<HoleFooter />` if there is one — whichever is the last child), insert:

```tsx
<div className="mt-8">
  <GolferEscapeBanner />
</div>
```

- [ ] **Step 5: Run the build to catch type errors**

Run: `pnpm build`
Expected: build succeeds. If it fails on an unrelated existing issue, scope the failure to the lines you touched.

- [ ] **Step 6: Run the homepage test to confirm nothing regressed**

Run: `pnpm test src/test/homepage-faq.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(home): operator eyebrow in Hole 01 + golfer escape banner"
```

---

### Task 1.3: Create the `/courses` public directory page

**Files:**
- Create: `src/app/courses/page.tsx`

- [ ] **Step 1: Create the route**

Create `src/app/courses/page.tsx`:

```tsx
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Courses on TeeAhead',
  description: 'Find your home course. Book direct, save 15% with the TeeAhead pass.',
}

export default async function CoursesPage() {
  const supabase = await createClient()
  const { data: courses } = await supabase
    .from('courses')
    .select('name, slug, city, state')
    .eq('status', 'active')
    .order('name')

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <p className="font-mono text-[11px] tracking-[0.2em] text-[#0F3D2E]/60 uppercase">
        TeeAhead Partner Courses
      </p>
      <h1 className="font-display text-[40px] sm:text-[52px] leading-[0.95] tracking-[-0.02em] text-[#0F3D2E] mt-3">
        Find your course.
      </h1>
      <p className="mt-4 text-[15px] text-[#1A1A1A]/82 leading-[1.6]">
        Book direct. Save 15% every round with the TeeAhead pass.
      </p>

      <ul className="divide-y divide-[#0F3D2E]/10 mt-8">
        {(courses ?? []).map((c) => (
          <li key={c.slug}>
            <Link
              href={`/play/${c.slug}`}
              className="flex items-baseline justify-between py-4 hover:bg-[#0F3D2E]/5 px-2 -mx-2 rounded transition-colors"
            >
              <span className="font-display text-[20px] text-[#0F3D2E]">{c.name}</span>
              {(c.city || c.state) && (
                <span className="text-[13px] text-[#0F3D2E]/60">
                  {[c.city, c.state].filter(Boolean).join(', ')}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
```

- [ ] **Step 2: Run the build**

Run: `pnpm build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/courses/page.tsx
git commit -m "feat(courses): public directory stub of active courses"
```

---

### Task 1.4: Local check + push Deliverable 1 to qa

**Files:**
- (none)

- [ ] **Step 1: Start the dev server**

Run: `pnpm dev`
Expected: starts on http://localhost:3000.

- [ ] **Step 2: Manually verify the homepage**

Open `http://localhost:3000/` in a browser.
- Confirm the eyebrow "Software for Golf Course Operators" appears above the `$94,500.` H1.
- Confirm the golfer escape banner appears at the bottom of Hole 01.
- Click the banner link — confirm it navigates to `/courses`.
- Reload — banner still appears.
- Click the × dismiss button.
- Reload — banner stays hidden (localStorage persistence).
- Clear localStorage (`localStorage.clear()` in devtools) — banner reappears on next reload.

- [ ] **Step 3: Manually verify `/courses`**

Open `http://localhost:3000/courses`.
- Confirm the list of active courses renders.
- Click one — confirm it navigates to `/play/{slug}` (which will 404 until Phase 2 ships; that's expected).

- [ ] **Step 4: Stop the dev server**

Press Ctrl-C in the dev server terminal.

- [ ] **Step 5: Run all tests**

Run: `pnpm test && pnpm build`
Expected: both pass.

- [ ] **Step 6: Push the branch to qa**

```bash
git push origin feat/two-product-site
git checkout qa
git pull --ff-only origin qa
git merge feat/two-product-site --no-ff -m "qa: deliverable 1 — homepage reshape + /courses stub"
git push origin qa
git checkout feat/two-product-site
```

- [ ] **Step 7: Notify the user and wait for review**

Tell the user: "Deliverable 1 is on qa. Review at qa.teeahead.com (homepage + /courses). Approve before I proceed to Phase 2."

**STOP. Wait for user approval before continuing.**

---

## Phase 2: `/play/[slug]` golfer landing page (Deliverable 2)

### Task 2.1: Create `formatTeeTimeLabel` helper (TDD — timezone-aware)

**Files:**
- Create: `src/lib/formatTeeTimeLabel.ts`
- Create: `src/test/format-tee-time-label.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/test/format-tee-time-label.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { formatTeeTimeLabel } from '@/lib/formatTeeTimeLabel'

describe('formatTeeTimeLabel', () => {
  it('formats a Friday 2:10pm in America/Detroit as "FRI · 2:10P"', () => {
    // 2026-06-05 14:10 America/Detroit is 18:10 UTC (EDT, UTC-4)
    const iso = '2026-06-05T18:10:00.000Z'
    expect(formatTeeTimeLabel(iso, 'America/Detroit')).toBe('FRI · 2:10P')
  })

  it('formats a Saturday 7:20am in America/Detroit as "SAT · 7:20A"', () => {
    const iso = '2026-06-06T11:20:00.000Z'
    expect(formatTeeTimeLabel(iso, 'America/Detroit')).toBe('SAT · 7:20A')
  })

  it('formats midnight correctly', () => {
    const iso = '2026-06-06T04:00:00.000Z' // 12:00 AM EDT
    expect(formatTeeTimeLabel(iso, 'America/Detroit')).toBe('SAT · 12:00A')
  })

  it('respects different timezones for the same UTC instant', () => {
    const iso = '2026-06-05T18:10:00.000Z'
    expect(formatTeeTimeLabel(iso, 'America/Los_Angeles')).toBe('FRI · 11:10A')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/test/format-tee-time-label.test.ts`
Expected: FAIL with `Cannot find module '@/lib/formatTeeTimeLabel'`.

- [ ] **Step 3: Implement the helper**

Create `src/lib/formatTeeTimeLabel.ts`:

```ts
const DAY_LABELS: Record<string, string> = {
  Sun: 'SUN', Mon: 'MON', Tue: 'TUE', Wed: 'WED', Thu: 'THU', Fri: 'FRI', Sat: 'SAT',
}

export function formatTeeTimeLabel(scheduledAt: string, timezone: string): string {
  const date = new Date(scheduledAt)
  const tz = timezone || 'America/Detroit'

  const dayShort = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: tz,
  }).format(date)

  const parts = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: tz,
  }).formatToParts(date)

  let hour = ''
  let minute = ''
  let ampm = ''
  for (const p of parts) {
    if (p.type === 'hour') hour = p.value
    else if (p.type === 'minute') minute = p.value
    else if (p.type === 'dayPeriod') ampm = p.value
  }
  const suffix = ampm.toUpperCase().startsWith('A') ? 'A' : 'P'

  return `${DAY_LABELS[dayShort] ?? dayShort.toUpperCase()} · ${hour}:${minute}${suffix}`
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test src/test/format-tee-time-label.test.ts`
Expected: PASS — all four cases green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/formatTeeTimeLabel.ts src/test/format-tee-time-label.test.ts
git commit -m "feat(lib): formatTeeTimeLabel for timezone-aware tile labels"
```

---

### Task 2.2: Create `PlayHeader` (server component)

**Files:**
- Create: `src/components/play/PlayHeader.tsx`

- [ ] **Step 1: Implement the header**

Create `src/components/play/PlayHeader.tsx`:

```tsx
import Link from 'next/link'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'

type Props = {
  courseName: string
  courseSlug: string
}

export default function PlayHeader({ courseName }: Props) {
  return (
    <header className="flex items-baseline justify-between px-6 py-4 border-b border-[#0F3D2E]/10">
      <div className="flex items-baseline gap-2">
        <Link href="/" aria-label="TeeAhead home" className="shrink-0">
          <TeeAheadLogo className="h-5 w-auto text-[#0F3D2E]" />
        </Link>
        <span className="text-[#0F3D2E]/40 text-[16px]">/</span>
        <span className="font-display text-[18px] text-[#0F3D2E] truncate">
          {courseName}
        </span>
      </div>
      <Link
        href="/login"
        className="text-[13px] text-[#0F3D2E] underline-offset-2 hover:underline"
      >
        Sign in
      </Link>
    </header>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/play/PlayHeader.tsx
git commit -m "feat(play): PlayHeader with TeeAhead wordmark and course name"
```

---

### Task 2.3: Create `PlayHero` (server) + inline `HeroPrimaryCta` (client)

**Files:**
- Create: `src/components/play/PlayHero.tsx`

- [ ] **Step 1: Implement the hero with its inline client CTA**

Create `src/components/play/PlayHero.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { track } from '@vercel/analytics'

type Props = {
  courseName: string
  region: string
  courseSlug: string
}

export default function PlayHero({ courseName, region, courseSlug }: Props) {
  return (
    <section className="bg-[#0F3D2E] text-[#F4F1EA] px-6 py-10 sm:py-14">
      <p className="font-mono text-[11px] tracking-[0.2em] uppercase opacity-80">
        {region ? `${courseName} · ${region}` : courseName}
      </p>
      <h1 className="font-display text-[40px] sm:text-[52px] leading-[0.95] tracking-[-0.02em] mt-3">
        Book direct.<br />Save 15% every round.
      </h1>
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Link
          href={`/join?course=${courseSlug}`}
          onClick={() => track('play_pass_cta_clicked', { slug: courseSlug, placement: 'hero' })}
          className="bg-[#F4F1EA] text-[#0F3D2E] px-5 py-3 font-medium text-[15px] text-center hover:bg-white transition-colors"
        >
          Get the pass · $89/yr
        </Link>
        <a
          href="#tee-times"
          className="border border-[#F4F1EA] text-[#F4F1EA] px-5 py-3 text-[15px] text-center hover:bg-[#F4F1EA]/10 transition-colors"
        >
          Book a tee time
        </a>
      </div>
    </section>
  )
}
```

Note: this whole component is a client component because it owns the `onClick` for analytics. Server-only siblings (`PlayHeader`, etc.) remain server components.

- [ ] **Step 2: Commit**

```bash
git add src/components/play/PlayHero.tsx
git commit -m "feat(play): PlayHero with primary CTA analytics fire"
```

---

### Task 2.4: Create `TeeTimeTile` (client component, fires per-tile analytics)

**Files:**
- Create: `src/components/play/TeeTimeTile.tsx`

- [ ] **Step 1: Implement the tile**

Create `src/components/play/TeeTimeTile.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { track } from '@vercel/analytics'

type Props = {
  courseSlug: string
  teeTimeId: string
  label: string  // e.g. "FRI · 2:10P"
  price: number
  dayOffset: 0 | 1 | 2
}

export default function TeeTimeTile({ courseSlug, teeTimeId, label, price, dayOffset }: Props) {
  return (
    <Link
      href={`/book/${courseSlug}?tee_time_id=${teeTimeId}`}
      onClick={() => track('play_tee_time_clicked', { slug: courseSlug, day_offset: dayOffset, price })}
      className="border border-[#0F3D2E]/15 p-3 hover:border-[#0F3D2E]/40 transition-colors block"
    >
      <p className="font-mono text-[11px] text-[#0F3D2E]/60 uppercase">{label}</p>
      <p className="font-display text-[20px] text-[#0F3D2E] mt-1">${price}</p>
    </Link>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/play/TeeTimeTile.tsx
git commit -m "feat(play): TeeTimeTile client component with per-tile click event"
```

---

### Task 2.5: Create `PlayTeeTimePreview` (server) — with empty-state TDD

**Files:**
- Create: `src/components/play/PlayTeeTimePreview.tsx`
- Create: `src/test/play-tee-time-preview.test.tsx`

- [ ] **Step 1: Write the failing empty-state test**

Create `src/test/play-tee-time-preview.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import PlayTeeTimePreview from '@/components/play/PlayTeeTimePreview'

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

vi.mock('@/components/play/TeeTimeTile', () => ({
  default: ({ label, price }: { label: string; price: number }) => (
    <div data-testid="tee-time-tile">{label} ${price}</div>
  ),
}))

describe('PlayTeeTimePreview', () => {
  it('renders tiles when tee times exist', () => {
    render(
      <PlayTeeTimePreview
        courseSlug="plum-hollow"
        timezone="America/Detroit"
        teeTimes={[
          { id: 't1', scheduled_at: '2026-06-05T18:10:00.000Z', base_price: 72, special_price: null, holes: 18 },
          { id: 't2', scheduled_at: '2026-06-06T11:20:00.000Z', base_price: 95, special_price: null, holes: 18 },
        ]}
      />
    )
    expect(screen.getAllByTestId('tee-time-tile')).toHaveLength(2)
    expect(screen.getByText(/NEXT 3 DAYS/)).toBeInTheDocument()
    expect(screen.getByText(/See full tee sheet/i)).toBeInTheDocument()
  })

  it('renders the empty-state membership pitch when teeTimes is empty', () => {
    render(
      <PlayTeeTimePreview
        courseSlug="plum-hollow"
        timezone="America/Detroit"
        teeTimes={[]}
      />
    )
    expect(screen.queryByTestId('tee-time-tile')).not.toBeInTheDocument()
    expect(screen.getByText(/No public availability this week/i)).toBeInTheDocument()
    expect(screen.getByText(/Get the pass/i)).toBeInTheDocument()
  })

  it('uses special_price over base_price when set', () => {
    render(
      <PlayTeeTimePreview
        courseSlug="plum-hollow"
        timezone="America/Detroit"
        teeTimes={[
          { id: 't1', scheduled_at: '2026-06-05T18:10:00.000Z', base_price: 95, special_price: 72, holes: 18 },
        ]}
      />
    )
    expect(screen.getByText(/FRI · 2:10P \$72/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/test/play-tee-time-preview.test.tsx`
Expected: FAIL with `Cannot find module '@/components/play/PlayTeeTimePreview'`.

- [ ] **Step 3: Implement the component**

Create `src/components/play/PlayTeeTimePreview.tsx`:

```tsx
import Link from 'next/link'
import TeeTimeTile from '@/components/play/TeeTimeTile'
import { formatTeeTimeLabel } from '@/lib/formatTeeTimeLabel'

type TeeTimeRow = {
  id: string
  scheduled_at: string
  base_price: number
  special_price: number | null
  holes: number
}

type Props = {
  courseSlug: string
  timezone: string
  teeTimes: TeeTimeRow[]
}

function computeDayOffset(scheduledAt: string, timezone: string): 0 | 1 | 2 {
  const tz = timezone || 'America/Detroit'
  const targetYmd = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(scheduledAt))
  const todayYmd = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  const target = new Date(`${targetYmd}T00:00:00Z`).getTime()
  const today = new Date(`${todayYmd}T00:00:00Z`).getTime()
  const diff = Math.round((target - today) / 86_400_000)
  return (diff < 0 ? 0 : diff > 2 ? 2 : diff) as 0 | 1 | 2
}

export default function PlayTeeTimePreview({ courseSlug, timezone, teeTimes }: Props) {
  if (teeTimes.length === 0) {
    return (
      <section id="tee-times" className="px-6 mt-10">
        <div className="flex justify-between items-baseline mb-4">
          <h2 className="font-mono text-[11px] tracking-[0.15em] text-[#0F3D2E]/60">NEXT 3 DAYS</h2>
          <span className="font-mono text-[11px] text-[#0F3D2E]/60">2 PLAYERS · 18 HOLES</span>
        </div>
        <div className="border border-[#0F3D2E]/15 p-6 text-[15px] text-[#1A1A1A]/82">
          No public availability this week. Members get first look —{' '}
          <Link href={`/join?course=${courseSlug}`} className="underline">Get the pass →</Link>
        </div>
      </section>
    )
  }

  return (
    <section id="tee-times" className="px-6 mt-10">
      <div className="flex justify-between items-baseline mb-4">
        <h2 className="font-mono text-[11px] tracking-[0.15em] text-[#0F3D2E]/60">NEXT 3 DAYS</h2>
        <span className="font-mono text-[11px] text-[#0F3D2E]/60">2 PLAYERS · 18 HOLES</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {teeTimes.map((t) => (
          <TeeTimeTile
            key={t.id}
            courseSlug={courseSlug}
            teeTimeId={t.id}
            label={formatTeeTimeLabel(t.scheduled_at, timezone)}
            price={t.special_price ?? t.base_price}
            dayOffset={computeDayOffset(t.scheduled_at, timezone)}
          />
        ))}
      </div>
      <Link
        href={`/book/${courseSlug}`}
        className="inline-block mt-4 text-[13px] text-[#0F3D2E] underline-offset-2 hover:underline"
      >
        See full tee sheet →
      </Link>
    </section>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test src/test/play-tee-time-preview.test.tsx`
Expected: PASS — all three cases green.

- [ ] **Step 5: Commit**

```bash
git add src/components/play/PlayTeeTimePreview.tsx src/test/play-tee-time-preview.test.tsx
git commit -m "feat(play): PlayTeeTimePreview with empty-state membership pitch"
```

---

### Task 2.6: Create `PlayMembershipExplainer` (server with client CTA)

**Files:**
- Create: `src/components/play/PlayMembershipExplainer.tsx`

- [ ] **Step 1: Implement the component**

Create `src/components/play/PlayMembershipExplainer.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { track } from '@vercel/analytics'

type Props = {
  courseSlug: string
}

const BENEFITS = [
  'Save 15% on every round at this course',
  'Free guest passes (Eagle tier)',
  'Early access to weekend tee times',
  'Cancel anytime',
]

export default function PlayMembershipExplainer({ courseSlug }: Props) {
  return (
    <section className="mt-10 border-t border-[#0F3D2E]/10 pt-8 px-6 pb-12">
      <p className="font-mono text-[11px] tracking-[0.2em] text-[#0F3D2E]/60 uppercase">
        About the Pass
      </p>
      <ul className="mt-4 space-y-2 text-[15px] text-[#1A1A1A]/82 leading-[1.6] list-disc pl-5">
        {BENEFITS.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      <Link
        href={`/join?course=${courseSlug}`}
        onClick={() => track('play_pass_cta_clicked', { slug: courseSlug, placement: 'membership_section' })}
        className="inline-block mt-6 bg-[#0F3D2E] text-[#F4F1EA] px-5 py-3 text-[15px] font-medium hover:bg-[#082419] transition-colors"
      >
        Get the pass · $89/yr
      </Link>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/play/PlayMembershipExplainer.tsx
git commit -m "feat(play): PlayMembershipExplainer with CTA analytics fire"
```

---

### Task 2.7: Create `PlayPageView` (client component for `play_page_viewed`)

**Files:**
- Create: `src/components/play/PlayPageView.tsx`

- [ ] **Step 1: Implement the component**

Create `src/components/play/PlayPageView.tsx`:

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { track } from '@vercel/analytics'

type Props = {
  slug: string
}

export default function PlayPageView({ slug }: Props) {
  const searchParams = useSearchParams()
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true
    track('play_page_viewed', {
      slug,
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      utm_source: searchParams?.get('utm_source') ?? null,
    })
  }, [slug, searchParams])

  return null
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/play/PlayPageView.tsx
git commit -m "feat(play): PlayPageView fires play_page_viewed once on mount"
```

---

### Task 2.8: Create the `/play/[slug]/page.tsx` route

**Files:**
- Create: `src/app/play/[slug]/page.tsx`

- [ ] **Step 1: Implement the route with data fetching and metadata**

Create `src/app/play/[slug]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import PlayHeader from '@/components/play/PlayHeader'
import PlayHero from '@/components/play/PlayHero'
import PlayTeeTimePreview from '@/components/play/PlayTeeTimePreview'
import PlayMembershipExplainer from '@/components/play/PlayMembershipExplainer'
import PlayPageView from '@/components/play/PlayPageView'

export const revalidate = 300

type Course = {
  id: string
  name: string
  slug: string
  city: string | null
  state: string | null
  timezone: string
  hero_image_url: string | null
}

type TeeTimeRow = {
  id: string
  scheduled_at: string
  base_price: number
  special_price: number | null
  available_players: number
  holes: number
  tee_start: string
}

async function fetchCourse(slug: string): Promise<Course | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('courses')
    .select('id, name, slug, city, state, timezone, hero_image_url')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()
  return (data as Course | null) ?? null
}

async function fetchNext3Days(courseId: string, timezone: string): Promise<TeeTimeRow[]> {
  const supabase = await createClient()
  const tz = timezone || 'America/Detroit'

  // Window: now → now + 3 days in the course's tz, expressed as UTC instants for DB filtering.
  const now = new Date()
  const ymdNow = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
  const startUtc = now.toISOString()
  const endLocal = new Date(`${ymdNow}T00:00:00Z`).getTime() + 3 * 86_400_000 + 86_400_000 // include all of day +2
  const endUtc = new Date(endLocal).toISOString()

  const { data } = await supabase
    .from('tee_times')
    .select('id, scheduled_at, base_price, special_price, available_players, holes, tee_start')
    .eq('course_id', courseId)
    .eq('status', 'open')
    .gt('available_players', 0)
    .gte('scheduled_at', startUtc)
    .lt('scheduled_at', endUtc)
    .order('scheduled_at', { ascending: true })
    .limit(6)

  return (data as TeeTimeRow[] | null) ?? []
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const course = await fetchCourse(slug)
  if (!course) {
    return { title: 'Course not found · TeeAhead' }
  }
  return {
    title: `${course.name} | Tee Times & Membership · TeeAhead`,
    description: `Book direct at ${course.name}. Save 15% on every round with the TeeAhead pass.`,
  }
}

export default async function PlayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const course = await fetchCourse(slug)
  if (!course) notFound()

  const teeTimes = await fetchNext3Days(course.id, course.timezone)
  const region = [course.city, course.state].filter(Boolean).join(', ')

  return (
    <>
      <PlayPageView slug={course.slug} />
      <PlayHeader courseName={course.name} courseSlug={course.slug} />
      <PlayHero courseName={course.name} region={region} courseSlug={course.slug} />
      <PlayTeeTimePreview
        courseSlug={course.slug}
        timezone={course.timezone}
        teeTimes={teeTimes.map((t) => ({
          id: t.id,
          scheduled_at: t.scheduled_at,
          base_price: Number(t.base_price),
          special_price: t.special_price !== null ? Number(t.special_price) : null,
          holes: t.holes,
        }))}
      />
      <PlayMembershipExplainer courseSlug={course.slug} />
    </>
  )
}
```

- [ ] **Step 2: Build to catch type errors**

Run: `pnpm build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/play/[slug]/page.tsx
git commit -m "feat(play): /play/[slug] route with ISR, metadata, 404 handling"
```

---

### Task 2.9: Playwright e2e for `/play/[slug]`

**Files:**
- Create: `tests/e2e/play-page.spec.ts`

- [ ] **Step 1: Find an active course slug to use**

Run: `psql "$DATABASE_URL" -c "SELECT slug FROM courses WHERE status='active' ORDER BY name LIMIT 1;"`

Or, if not using psql locally, run in dev: visit `http://localhost:3000/courses` and copy a slug from the URL.

Use that slug in the test (e.g. `fox-creek` or `plum-hollow`). If you cannot determine one, leave a `TEST_PLAY_SLUG` env variable read in the test (`process.env.TEST_PLAY_SLUG ?? 'fox-creek'`).

- [ ] **Step 2: Write the e2e test**

Create `tests/e2e/play-page.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

const SLUG = process.env.TEST_PLAY_SLUG ?? 'fox-creek'

test.describe('/play/[slug]', () => {
  test('renders hero, membership section, and sign-in link for an active course', async ({ page }) => {
    await page.goto(`/play/${SLUG}`)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Book direct/)
    await expect(page.getByText(/Save 15% every round/)).toBeVisible()
    await expect(page.getByText(/About the Pass/i)).toBeVisible()
    await expect(page.getByText(/Cancel anytime/)).toBeVisible()

    const signIn = page.getByRole('link', { name: /Sign in/ })
    await expect(signIn).toBeVisible()
    await expect(signIn).toHaveAttribute('href', '/login')
  })

  test('404s for an unknown slug', async ({ page }) => {
    const response = await page.goto('/play/this-slug-does-not-exist-12345')
    expect(response?.status()).toBe(404)
  })

  test('shows next-3-days header on the tee-times section', async ({ page }) => {
    await page.goto(`/play/${SLUG}`)
    await expect(page.getByText(/NEXT 3 DAYS/)).toBeVisible()
  })
})
```

- [ ] **Step 3: Run the e2e test**

Run: `pnpm test:e2e tests/e2e/play-page.spec.ts`
Expected: PASS. If it fails because no tee times exist for the course, that's fine — the test asserts the header text, not the tile presence.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/play-page.spec.ts
git commit -m "test(play): e2e coverage for /play/[slug] render and 404"
```

---

### Task 2.10: Local check + push Deliverable 2 to qa

**Files:**
- (none)

- [ ] **Step 1: Start dev server**

Run: `pnpm dev`

- [ ] **Step 2: Manually verify `/play/[slug]`**

Visit `http://localhost:3000/play/<slug>` for an active course.
- Confirm header shows TeeAhead logo · "/" · course name + Sign in on the right.
- Confirm hero shows `{courseName} · {region}` eyebrow, "Book direct. / Save 15% every round." headline, "Get the pass · $89/yr" primary CTA, "Book a tee time" secondary CTA.
- Confirm the "Book a tee time" button scrolls to the tee-times section.
- Confirm tee-time tiles render (if any) or the empty-state pitch appears.
- Confirm clicking a tile navigates to `/book/{slug}?tee_time_id=...`.
- Confirm "See full tee sheet" link goes to `/book/{slug}`.
- Confirm "About the Pass" bullets and the closing CTA render.
- Visit `/play/nonsense-slug-1234` and confirm a 404 page.

- [ ] **Step 3: Verify the homepage banner now reaches a real /play/[slug]**

Visit `http://localhost:3000/`, click the golfer escape banner, land on `/courses`, click a course, land on a working `/play/[slug]`.

- [ ] **Step 4: Stop dev server, run full test suite**

```bash
# Ctrl-C in dev terminal
pnpm test
pnpm test:e2e
pnpm build
```

All should pass.

- [ ] **Step 5: Push to qa**

```bash
git push origin feat/two-product-site
git checkout qa
git pull --ff-only origin qa
git merge feat/two-product-site --no-ff -m "qa: deliverable 2 — /play/[slug] golfer landing"
git push origin qa
git checkout feat/two-product-site
```

- [ ] **Step 6: Notify the user and wait for review**

Tell the user: "Deliverable 2 is on qa. Review at qa.teeahead.com/play/<slug>. Approve before I proceed to Phase 3."

**STOP. Wait for user approval before continuing.**

---

## Phase 3: `/course/[slug]/marketing` operator asset kit (Deliverable 3)

### Task 3.1: Create the `/api/qr/[slug]` route handler

**Files:**
- Create: `src/app/api/qr/[slug]/route.ts`

- [ ] **Step 1: Implement the handler**

Create `src/app/api/qr/[slug]/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const size = Math.min(
    Math.max(parseInt(req.nextUrl.searchParams.get('size') ?? '240', 10) || 240, 64),
    1200
  )

  const supabase = await createClient()
  const { data: course } = await supabase
    .from('courses')
    .select('slug')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()
  if (!course) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://teeahead.com'
  try {
    const png = await QRCode.toBuffer(`${baseUrl}/play/${slug}`, {
      width: size,
      margin: 1,
      color: { dark: '#0F3D2E', light: '#FAF7F2' },
    })
    return new NextResponse(png, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new NextResponse('QR generation failed', { status: 500 })
  }
}
```

- [ ] **Step 2: Build to catch type errors**

Run: `pnpm build`
Expected: build succeeds.

- [ ] **Step 3: Smoke-test the route**

Start dev (`pnpm dev`), then in a browser hit `http://localhost:3000/api/qr/<active-slug>`. Expected: a green-on-cream QR PNG renders.
Hit `http://localhost:3000/api/qr/<active-slug>?size=800`. Expected: a larger PNG.
Hit `http://localhost:3000/api/qr/nonsense-slug`. Expected: 404.
Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/qr/\[slug\]/route.ts
git commit -m "feat(api): /api/qr/[slug] PNG QR for /play/[slug]"
```

---

### Task 3.2: Create `CourseAssetsKit` (client — clipboard required)

**Files:**
- Create: `src/components/marketing/CourseAssetsKit.tsx`

- [ ] **Step 1: Implement the component**

Create `src/components/marketing/CourseAssetsKit.tsx`:

```tsx
'use client'

import { useState } from 'react'

type Props = {
  courseName: string
  courseSlug: string
  baseUrl: string
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } catch {
          // ignore clipboard failures
        }
      }}
      className="text-[12px] font-mono uppercase tracking-[0.1em] px-3 py-1.5 border border-[#0F3D2E]/20 text-[#0F3D2E] hover:bg-[#0F3D2E]/5"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

export default function CourseAssetsKit({ courseName, courseSlug, baseUrl }: Props) {
  const playUrl = `${baseUrl}/play/${courseSlug}`
  const [qrErrored, setQrErrored] = useState(false)

  const igBio = `🏌️ Save 15% on every round at ${courseName}.\nBook direct + earn rewards.\n${playUrl}`
  const scorecardFooter = `Book your next round direct at ${courseName} — save 15% with TeeAhead.\n${playUrl}`
  const emailSignature = `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Inter,Arial,sans-serif;font-size:13px;color:#0F3D2E"><tr><td><a href="${playUrl}" style="color:#0F3D2E;text-decoration:none;font-weight:600">Book direct at ${courseName} →</a><br/><span style="font-size:12px;color:#6B7770">Save 15% on every round with TeeAhead</span></td></tr></table>`

  return (
    <div className="space-y-8">
      <Block label="Your golfer page URL" helper="Share this anywhere golfers might find you.">
        <div className="flex items-center gap-3">
          <code className="block bg-[#FAF7F2] border border-[#0F3D2E]/15 px-3 py-2 text-[13px] text-[#0F3D2E] font-mono flex-1 truncate">
            {playUrl}
          </code>
          <CopyButton value={playUrl} />
        </div>
      </Block>

      <Block label="QR code" helper="Print on scorecards, posters, table tents — anywhere a golfer might see it.">
        <div className="flex items-start gap-4">
          {qrErrored ? (
            <div className="w-[200px] h-[200px] flex items-center justify-center border border-[#0F3D2E]/15 text-[13px] text-[#0F3D2E]/60 text-center px-4">
              QR generation unavailable — refresh to retry
            </div>
          ) : (
            <img
              src={`/api/qr/${courseSlug}`}
              width={200}
              height={200}
              alt={`QR code for ${playUrl}`}
              onError={() => setQrErrored(true)}
              className="border border-[#0F3D2E]/15"
            />
          )}
          <a
            href={`/api/qr/${courseSlug}?size=800`}
            download={`${courseSlug}-qr.png`}
            className="text-[13px] font-mono uppercase tracking-[0.1em] px-3 py-1.5 border border-[#0F3D2E]/20 text-[#0F3D2E] hover:bg-[#0F3D2E]/5 self-start"
          >
            Download PNG (800×800)
          </a>
        </div>
      </Block>

      <Block label="Instagram bio link copy" helper="Paste into your IG bio with the link in the URL slot.">
        <textarea
          readOnly
          value={igBio}
          rows={4}
          className="w-full bg-[#FAF7F2] border border-[#0F3D2E]/15 px-3 py-2 text-[13px] text-[#0F3D2E] font-sans resize-none"
        />
        <div className="mt-2"><CopyButton value={igBio} /></div>
      </Block>

      <Block label="Scorecard footer text" helper="Add to the bottom of your scorecard print template.">
        <textarea
          readOnly
          value={scorecardFooter}
          rows={3}
          className="w-full bg-[#FAF7F2] border border-[#0F3D2E]/15 px-3 py-2 text-[13px] text-[#0F3D2E] font-sans resize-none"
        />
        <div className="mt-2"><CopyButton value={scorecardFooter} /></div>
      </Block>

      <Block label="Email signature snippet" helper="Paste as HTML into Mailchimp, Constant Contact, or your email signature editor.">
        <textarea
          readOnly
          value={emailSignature}
          rows={5}
          className="w-full bg-[#FAF7F2] border border-[#0F3D2E]/15 px-3 py-2 text-[12px] text-[#0F3D2E] font-mono resize-none"
        />
        <div className="mt-2"><CopyButton value={emailSignature} /></div>
      </Block>
    </div>
  )
}

function Block({ label, helper, children }: { label: string; helper: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[11px] tracking-[0.2em] text-[#0F3D2E]/60 uppercase">{label}</p>
      <p className="text-[13px] text-[#6B7770] mt-1 mb-3 leading-relaxed">{helper}</p>
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/marketing/CourseAssetsKit.tsx
git commit -m "feat(marketing): CourseAssetsKit with QR, IG bio, scorecard, email blocks"
```

---

### Task 3.3: Create `/course/[slug]/marketing` page

**Files:**
- Create: `src/app/course/[slug]/marketing/page.tsx`

- [ ] **Step 1: Implement the route**

Create `src/app/course/[slug]/marketing/page.tsx`:

```tsx
import { requireManager } from '@/lib/courseRole'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CourseAssetsKit from '@/components/marketing/CourseAssetsKit'

export default async function MarketingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  await requireManager(slug)

  const supabase = await createClient()
  const { data: course } = await supabase
    .from('courses')
    .select('name, slug')
    .eq('slug', slug)
    .single()
  if (!course) notFound()

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://teeahead.com'

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Marketing Kit</h1>
        <p className="text-sm text-gray-500 mt-1">
          Everything you need to drive golfers to your TeeAhead page.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <CourseAssetsKit
          courseName={course.name}
          courseSlug={course.slug}
          baseUrl={baseUrl}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build to catch type errors**

Run: `pnpm build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/course/\[slug\]/marketing/page.tsx
git commit -m "feat(course): /course/[slug]/marketing operator asset kit page"
```

---

### Task 3.4: Playwright e2e for `/course/[slug]/marketing`

**Files:**
- Create: `tests/e2e/course-marketing.spec.ts`

- [ ] **Step 1: Identify a manager test account**

Reuse the auth pattern from `tests/e2e/split-tee.spec.ts`: the existing convention is `process.env.TEST_MANAGER_EMAIL` / `process.env.TEST_MANAGER_PASSWORD` against the `fox-creek` slug.

- [ ] **Step 2: Write the e2e test**

Create `tests/e2e/course-marketing.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

const SLUG = process.env.TEST_MANAGER_SLUG ?? 'fox-creek'
const EMAIL = process.env.TEST_MANAGER_EMAIL ?? 'manager@foxcreek.test'
const PASSWORD = process.env.TEST_MANAGER_PASSWORD ?? 'changeme'

test.describe('/course/[slug]/marketing', () => {
  test('redirects when unauthenticated', async ({ page, context }) => {
    await context.clearCookies()
    const response = await page.goto(`/course/${SLUG}/marketing`)
    // requireManager redirects unauth users; final URL should not be the marketing page
    expect(page.url()).not.toContain('/marketing')
  })

  test('renders the asset kit when authenticated as manager', async ({ page }) => {
    await page.goto(`/course/${SLUG}/login`)
    await page.fill('[name=email]', EMAIL)
    await page.fill('[name=password]', PASSWORD)
    await page.click('button[type=submit]')
    await page.waitForURL(/\/course\//)

    await page.goto(`/course/${SLUG}/marketing`)
    await expect(page.getByRole('heading', { name: /Marketing Kit/i })).toBeVisible()
    await expect(page.getByText(/Your golfer page URL/i)).toBeVisible()
    await expect(page.getByText(/QR code/i)).toBeVisible()
    await expect(page.getByText(/Instagram bio link copy/i)).toBeVisible()

    // QR <img> renders with the right src
    const qrImg = page.locator(`img[src="/api/qr/${SLUG}"]`)
    await expect(qrImg).toBeVisible()
  })
})
```

- [ ] **Step 3: Run the e2e test**

Run: `pnpm test:e2e tests/e2e/course-marketing.spec.ts`
Expected: PASS. If the manager login env vars aren't set, the second test will fail at login — set `TEST_MANAGER_EMAIL` / `TEST_MANAGER_PASSWORD` / `TEST_MANAGER_SLUG` and rerun.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/course-marketing.spec.ts
git commit -m "test(course): e2e for /course/[slug]/marketing auth + kit render"
```

---

### Task 3.5: Local check + push Deliverable 3 to qa

**Files:**
- (none)

- [ ] **Step 1: Start dev server, log in as a manager, visit `/course/<slug>/marketing`**

Run: `pnpm dev`. Sign in as a manager and visit `http://localhost:3000/course/<slug>/marketing`.

- Confirm all five blocks render (URL, QR, IG bio, scorecard, email signature).
- Click "Copy" on the URL block — confirm "Copied!" pill flashes; paste somewhere and verify the URL.
- Click "Download PNG (800×800)" — confirm a `.png` file downloads.
- Repeat copy for IG, scorecard, email blocks.

- [ ] **Step 2: Verify unauthenticated access is blocked**

In a private/incognito window, visit `/course/<slug>/marketing` — confirm you don't see the kit (redirected per `requireManager`).

- [ ] **Step 3: Stop dev, run full test suite**

```bash
# Ctrl-C
pnpm test
pnpm test:e2e
pnpm build
```

- [ ] **Step 4: Push to qa**

```bash
git push origin feat/two-product-site
git checkout qa
git pull --ff-only origin qa
git merge feat/two-product-site --no-ff -m "qa: deliverable 3 — /course/[slug]/marketing asset kit"
git push origin qa
git checkout feat/two-product-site
```

- [ ] **Step 5: Notify the user and wait for review**

Tell the user: "Deliverable 3 is on qa. Review at qa.teeahead.com/course/<slug>/marketing while logged in as a manager. Approve before I proceed to Phase 4."

**STOP. Wait for user approval before continuing.**

---

## Phase 4: Day-zero step 4 link (Deliverable 4)

### Task 4.1: Add the marketing-kit step to `DayZeroOnboarding`

**Files:**
- Modify: `src/app/course/[slug]/dashboard/page.tsx:155-229`

- [ ] **Step 1: Add the fourth step to the `steps` array**

In `src/app/course/[slug]/dashboard/page.tsx`, find the `DayZeroOnboarding` function (starts around line 155). In its `steps` array (currently three entries), append a fourth:

```tsx
{
  n: '04',
  title: 'Grab your marketing kit',
  desc: 'QR code, IG bio copy, scorecard footer, email signature — everything you need to send golfers to your TeeAhead page.',
  status: 'next' as const,
  cta: { label: 'Open marketing kit →', href: `/course/${slug}/marketing` },
},
```

The full updated `steps` array should now have four entries: tee times → install → email → marketing.

- [ ] **Step 2: Verify visually**

Run: `pnpm dev`. Visit `/course/<a-course-without-bookings>/dashboard` so the day-zero block shows. Confirm step 04 appears with the new copy and the CTA links to `/course/<slug>/marketing`.

If you don't have a day-zero course handy, temporarily comment out the `if (isDayZero)` guard in the dashboard page to force-render it for visual check, then restore the guard.

Stop dev (Ctrl-C).

- [ ] **Step 3: Build**

Run: `pnpm build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/course/\[slug\]/dashboard/page.tsx
git commit -m "feat(course): day-zero onboarding step 4 → marketing kit"
```

---

### Task 4.2: Local check + push Deliverable 4 to qa

**Files:**
- (none)

- [ ] **Step 1: Run full test suite one more time**

```bash
pnpm test
pnpm test:e2e
pnpm build
```

All should pass.

- [ ] **Step 2: Push to qa**

```bash
git push origin feat/two-product-site
git checkout qa
git pull --ff-only origin qa
git merge feat/two-product-site --no-ff -m "qa: deliverable 4 — day-zero step 4 link"
git push origin qa
git checkout feat/two-product-site
```

- [ ] **Step 3: Notify the user**

Tell the user: "All four deliverables are on qa. Final review on qa.teeahead.com:
- `/` (eyebrow + escape banner)
- `/courses` (directory)
- `/play/<slug>` (course landing)
- `/course/<slug>/marketing` (kit, while logged in as manager)
- `/course/<slug>/dashboard` (day-zero block now shows step 04)

If everything looks good, give me the green light and I'll merge `feat/two-product-site` to `main` for the production deploy."

**STOP. Wait for user approval before the final merge.**

---

## Phase 5: Merge to main (only after full qa approval)

### Task 5.1: Merge feat/two-product-site → main

**Files:**
- (none)

- [ ] **Step 1: Confirm with the user that all four deliverables are approved on qa**

Do not proceed without explicit approval.

- [ ] **Step 2: Merge to main**

```bash
git checkout main
git pull --ff-only origin main
git merge feat/two-product-site --no-ff -m "feat: two-product site architecture (homepage reshape + /play + /courses + marketing kit)"
git push origin main
```

This triggers the production deploy via Vercel's GitHub integration.

- [ ] **Step 3: Smoke-test production**

After the deploy completes (watch Vercel dashboard or `vercel ls`):
- Visit `https://teeahead.com/` and confirm eyebrow + banner.
- Visit `https://teeahead.com/courses`.
- Visit `https://teeahead.com/play/<slug>` for an active course.
- Sign in as a manager and visit `https://teeahead.com/course/<slug>/marketing`.

- [ ] **Step 4: Check Vercel Analytics for the new events**

In the Vercel dashboard's Web Analytics section, after a few hours of traffic, confirm the four new events appear:
- `play_page_viewed`
- `play_pass_cta_clicked`
- `play_tee_time_clicked`
- `homepage_golfer_banner_clicked`

Report any missing event to the user — it may indicate a wiring bug worth a follow-up.

- [ ] **Step 5: Delete the feature branch**

```bash
git branch -d feat/two-product-site
git push origin --delete feat/two-product-site
```

---

## Out-of-scope follow-ups (do not bundle into this work)

- `/auth/sign-in?returnTo=...` support (sign-in link on `/play/[slug]` currently bare).
- Per-course OG image generation for `/play/[slug]`.
- Rendering `courses.hero_image_url` as a darkened hero background.
- Filter selector ("2 players · 18 holes ⌄") on `PlayTeeTimePreview`.
- Average savings line on `PlayHero` (requires `course_membership_stats`).
- `content_blocks` migration for homepage and `/play` copy.
- Additional placements of `GolferEscapeBanner` (e.g., persistent footer chip).
- Persona-toggle homepage (Variation D) — revisit only if `homepage_golfer_banner_clicked` rate exceeds 10% of homepage clicks per the handoff's diagnostic.

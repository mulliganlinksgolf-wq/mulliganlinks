# Member App Round Card Theme — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the member app's light stat-card UI with a dark "Round Card" scorecard design across all 7 pages under `/app/*`.

**Architecture:** A shared set of pure helper functions (`src/lib/member-dashboard.ts`) drives the adaptive logic. Two new components (`RoundCard`, `ScorecardRows`) own the dashboard UI. All other pages receive inline rewrites — no new components needed since each page is small. All pages remain server components; no new routes or DB schema changes.

**Tech Stack:** Next.js App Router (server components), Supabase, Tailwind CSS, Vitest

---

## File Map

| Action | File |
|---|---|
| Create | `src/lib/member-dashboard.ts` |
| Create | `src/test/member-dashboard.test.ts` |
| Create | `src/components/app/RoundCard.tsx` |
| Create | `src/components/app/ScorecardRows.tsx` |
| Modify | `src/app/app/page.tsx` |
| Modify | `src/app/app/courses/page.tsx` |
| Modify | `src/app/app/bookings/page.tsx` |
| Modify | `src/app/app/points/page.tsx` |
| Modify | `src/app/app/card/page.tsx` |
| Modify | `src/app/app/profile/page.tsx` |
| Modify | `src/app/app/membership/page.tsx` |
| Modify | `src/components/FoundingGolferBanner.tsx` |

---

## Task 1: Logic helpers

**Files:**
- Create: `src/lib/member-dashboard.ts`
- Create: `src/test/member-dashboard.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/test/member-dashboard.test.ts
import { describe, it, expect } from 'vitest'
import {
  getMemberState,
  getSubHeadline,
  getPointsToNextCredit,
  formatDaysAway,
  getTierInfo,
} from '@/lib/member-dashboard'

describe('getMemberState', () => {
  it('returns new when 0 completed rounds', () => {
    expect(getMemberState(0)).toBe('new')
  })
  it('returns active when 1+ completed rounds', () => {
    expect(getMemberState(1)).toBe('active')
    expect(getMemberState(10)).toBe('active')
  })
})

describe('getSubHeadline', () => {
  it('returns blank scorecard copy for new state', () => {
    expect(getSubHeadline('new', 0)).toBe(
      "Your scorecard's still blank. 3 holes before your first round."
    )
  })
  it('returns warming up for 1–4 rounds', () => {
    expect(getSubHeadline('active', 1)).toContain("You're warming up")
    expect(getSubHeadline('active', 4)).toContain("You're warming up")
  })
  it('returns back nine for 5–9 rounds', () => {
    expect(getSubHeadline('active', 5)).toContain('back nine')
    expect(getSubHeadline('active', 9)).toContain('back nine')
  })
  it('returns regular for 10+ rounds', () => {
    expect(getSubHeadline('active', 10)).toContain('A regular')
    expect(getSubHeadline('active', 25)).toContain('A regular')
  })
  it('includes the round count in active headlines', () => {
    expect(getSubHeadline('active', 7)).toContain('7')
  })
})

describe('getPointsToNextCredit', () => {
  it('returns 100 when balance is 0', () => {
    expect(getPointsToNextCredit(0)).toBe(100)
  })
  it('returns 100 when balance is an exact multiple of 100', () => {
    expect(getPointsToNextCredit(100)).toBe(100)
    expect(getPointsToNextCredit(500)).toBe(100)
  })
  it('returns correct remainder', () => {
    expect(getPointsToNextCredit(891)).toBe(9)
    expect(getPointsToNextCredit(50)).toBe(50)
    expect(getPointsToNextCredit(99)).toBe(1)
  })
})

describe('getTierInfo', () => {
  it('returns correct labels', () => {
    expect(getTierInfo('free').label).toBe('Fairway')
    expect(getTierInfo('eagle').label).toBe('Eagle')
    expect(getTierInfo('ace').label).toBe('Ace')
  })
  it('returns correct earn rates', () => {
    expect(getTierInfo('free').earnRate).toBe('1×')
    expect(getTierInfo('eagle').earnRate).toBe('1.5×')
    expect(getTierInfo('ace').earnRate).toBe('2×')
  })
})

describe('formatDaysAway', () => {
  it('returns today for a past or same-second date', () => {
    const past = new Date(Date.now() - 1000).toISOString()
    expect(formatDaysAway(past)).toBe('today')
  })
  it('returns tomorrow for ~1 day out', () => {
    const tomorrow = new Date(Date.now() + 1000 * 60 * 60 * 25).toISOString()
    expect(formatDaysAway(tomorrow)).toBe('tomorrow')
  })
  it('returns N days away for further dates', () => {
    const fiveDays = new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString()
    expect(formatDaysAway(fiveDays)).toBe('5 days away')
  })
})
```

- [ ] **Step 2: Run tests — expect all to fail**

```bash
cd /Users/barris/Desktop/MulliganLinks && npx vitest run src/test/member-dashboard.test.ts
```

Expected: multiple failures like "Cannot find module '@/lib/member-dashboard'"

- [ ] **Step 3: Create the helper module**

```ts
// src/lib/member-dashboard.ts
export type MemberTier = 'free' | 'eagle' | 'ace'
export type DashboardState = 'new' | 'active'

export function getMemberState(completedRoundsCount: number): DashboardState {
  return completedRoundsCount > 0 ? 'active' : 'new'
}

export function getSubHeadline(state: DashboardState, roundsCount: number): string {
  if (state === 'new') return "Your scorecard's still blank. 3 holes before your first round."
  if (roundsCount <= 4) return `${roundsCount} round${roundsCount === 1 ? '' : 's'} played. You're warming up. 🏌️`
  if (roundsCount <= 9) return `${roundsCount} rounds played. You're on the back nine. 🏌️`
  return `${roundsCount} rounds played. A regular. See you out there. 🏌️`
}

export function getPointsToNextCredit(balance: number): number {
  const remainder = balance % 100
  return remainder === 0 ? 100 : 100 - remainder
}

export function formatDaysAway(scheduledAt: string): string {
  const diff = new Date(scheduledAt).getTime() - Date.now()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'today'
  if (days === 1) return 'tomorrow'
  return `${days} days away`
}

export function getTierInfo(tier: MemberTier): {
  label: string
  badgeBg: string
  badgeText: string
  earnRate: string
} {
  switch (tier) {
    case 'eagle':
      return { label: 'Eagle', badgeBg: 'bg-[#E0A800]', badgeText: 'text-[#1A1A1A]', earnRate: '1.5×' }
    case 'ace':
      return { label: 'Ace', badgeBg: 'bg-[#1B4332]', badgeText: 'text-[#FAF7F2]', earnRate: '2×' }
    default:
      return { label: 'Fairway', badgeBg: 'bg-[#8FA889]', badgeText: 'text-[#1A1A1A]', earnRate: '1×' }
  }
}
```

- [ ] **Step 4: Run tests — expect all to pass**

```bash
npx vitest run src/test/member-dashboard.test.ts
```

Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add src/lib/member-dashboard.ts src/test/member-dashboard.test.ts
git commit -m "feat: add member dashboard helper functions with tests"
```

---

## Task 2: ScorecardRows component

**Files:**
- Create: `src/components/app/ScorecardRows.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/app/ScorecardRows.tsx
import Link from 'next/link'
import { getPointsToNextCredit, formatDaysAway } from '@/lib/member-dashboard'
import type { DashboardState, MemberTier } from '@/lib/member-dashboard'

type UpcomingBooking = { courseName: string; scheduledAt: string }
type LastBooking = { courseName: string; scheduledAt: string; totalPaid: number }

type ScorecardRowsProps = {
  state: DashboardState
  tier: MemberTier
  pointsBalance: number
  upcomingBooking: UpcomingBooking | null
  lastBooking: LastBooking | null
}

function Row({
  icon,
  label,
  primary,
  sub,
  href,
}: {
  icon: string
  label: string
  primary: string
  sub: string
  href?: string
}) {
  const inner = (
    <div className="grid items-center gap-x-2 px-3 py-3 border-b border-[#333] last:border-0"
      style={{ gridTemplateColumns: '28px 44px 1fr' }}>
      <span className="text-sm font-bold text-white font-sans">{icon}</span>
      <span className="text-[9px] uppercase tracking-widest text-[#888] font-sans">{label}</span>
      <div>
        <p className="text-[11px] text-[#ddd] font-sans">{primary}</p>
        {sub && <p className="text-[10px] text-[#555] font-sans mt-0.5">{sub}</p>}
      </div>
    </div>
  )
  if (href) {
    return (
      <Link href={href} className="block hover:bg-[#333]/30 transition-colors">
        {inner}
      </Link>
    )
  }
  return <div>{inner}</div>
}

export function ScorecardRows({
  state,
  tier,
  pointsBalance,
  upcomingBooking,
  lastBooking,
}: ScorecardRowsProps) {
  if (state === 'new') {
    return (
      <>
        <Row icon="01" label="FIND" primary="Find a course near you" sub="3 partner courses within 5 miles" href="/app/courses" />
        <Row icon="02" label="EARN" primary="Bank your first 50 Fairway Points" sub="100 pts = $1 toward future bookings" href="/app/points" />
        <Row icon="03" label="TRY" primary="Eagle preview — 2× points + fee waived" sub="Upgrade — $50 less than Golf Pass" href="/app/membership" />
      </>
    )
  }

  // Row 1 — next tee time
  const nextPrimary = upcomingBooking
    ? `${upcomingBooking.courseName} · ${new Date(upcomingBooking.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}`
    : 'No round booked yet'
  const nextSub = upcomingBooking
    ? `${formatDaysAway(upcomingBooking.scheduledAt)}${tier !== 'free' ? ' · fee waived' : ''}`
    : 'Find a tee time →'
  const nextHref = upcomingBooking ? '/app/bookings' : '/app/courses'

  // Row 2 — last completed round
  const lastPrimary = lastBooking
    ? `${lastBooking.courseName} · ${new Date(lastBooking.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : 'No rounds completed yet'
  const lastSub = lastBooking ? `$${lastBooking.totalPaid.toFixed(2)} paid` : ''
  const lastHref = lastBooking ? '/app/bookings' : undefined

  // Row 3 — tier-dependent
  const ptsToNext = getPointsToNextCredit(pointsBalance)
  const goalIcon = tier === 'free' ? '↑' : '◎'
  const goalLabel = tier === 'free' ? 'UPGRADE' : 'GOAL'
  const goalPrimary = tier === 'free'
    ? 'Go Eagle — 2× points + fee waived'
    : `${ptsToNext} pts to your next $1 credit`
  const goalSub = tier === 'free'
    ? '$89/yr — $50 less than Golf Pass'
    : 'Book 1 more round to hit it'
  const goalHref = tier === 'free' ? '/app/membership' : '/app/points'

  return (
    <>
      <Row icon="▸" label="NEXT" primary={nextPrimary} sub={nextSub} href={nextHref} />
      <Row icon="✓" label="LAST" primary={lastPrimary} sub={lastSub} href={lastHref} />
      <Row icon={goalIcon} label={goalLabel} primary={goalPrimary} sub={goalSub} href={goalHref} />
    </>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors (or only pre-existing errors unrelated to this file)

- [ ] **Step 3: Commit**

```bash
git add src/components/app/ScorecardRows.tsx
git commit -m "feat: add ScorecardRows component"
```

---

## Task 3: RoundCard component

**Files:**
- Create: `src/components/app/RoundCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/app/RoundCard.tsx
import Link from 'next/link'
import { ScorecardRows } from './ScorecardRows'
import { getMemberState, getSubHeadline, getTierInfo } from '@/lib/member-dashboard'
import type { MemberTier } from '@/lib/member-dashboard'

type RoundCardProps = {
  firstName: string
  tier: MemberTier
  pointsBalance: number
  creditCents: number
  completedRoundsCount: number
  upcomingBooking: { courseName: string; scheduledAt: string } | null
  lastCompletedBooking: { courseName: string; scheduledAt: string; totalPaid: number } | null
}

export function RoundCard({
  firstName,
  tier,
  pointsBalance,
  creditCents,
  completedRoundsCount,
  upcomingBooking,
  lastCompletedBooking,
}: RoundCardProps) {
  const state = getMemberState(completedRoundsCount)
  const tierInfo = getTierInfo(tier)
  const subHeadline = getSubHeadline(state, completedRoundsCount)
  const isActive = state === 'active'

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#1C1C1C' }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] uppercase tracking-[0.2em] text-[#888] font-sans">
            Round Card
          </span>
          <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full font-sans ${tierInfo.badgeBg} ${tierInfo.badgeText}`}>
            {tierInfo.label}
          </span>
        </div>
        <h1 className="text-2xl font-bold font-serif text-white italic">Hey, {firstName}.</h1>
        <p className="text-[11px] text-[#888] font-sans mt-1">{subHeadline}</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 border-y border-[#333]" style={{ background: '#2a2a2a' }}>
        <div className="px-4 py-3 text-center border-r border-[#333]">
          <p className="text-[8px] uppercase tracking-widest text-[#888] font-sans mb-1">Points</p>
          <p className={`text-xl font-bold font-serif ${isActive ? 'text-white' : 'text-[#555]'}`}>
            {isActive ? pointsBalance.toLocaleString() : '0'}
          </p>
          <p className={`text-[8px] font-sans mt-0.5 ${isActive ? 'text-[#8FA889]' : 'text-[#444]'}`}>
            {isActive ? `$${(pointsBalance / 100).toFixed(2)} val` : 'not yet'}
          </p>
        </div>
        <div className="px-4 py-3 text-center border-r border-[#333]">
          <p className="text-[8px] uppercase tracking-widest text-[#888] font-sans mb-1">Credit</p>
          <p className={`text-xl font-bold font-serif ${isActive && creditCents > 0 ? 'text-[#E0A800]' : 'text-[#555]'}`}>
            {isActive && creditCents > 0 ? `$${(creditCents / 100).toFixed(0)}` : '—'}
          </p>
          <p className={`text-[8px] font-sans mt-0.5 ${isActive && creditCents > 0 ? 'text-[#8FA889]' : 'text-[#444]'}`}>
            {isActive && creditCents > 0 ? 'ready to use' : 'earn first'}
          </p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="text-[8px] uppercase tracking-widest text-[#888] font-sans mb-1">Rounds</p>
          <p className={`text-xl font-bold font-serif ${isActive ? 'text-white' : 'text-[#555]'}`}>
            {completedRoundsCount}
          </p>
          <p className={`text-[8px] font-sans mt-0.5 ${isActive ? 'text-[#8FA889]' : 'text-[#444]'}`}>
            {isActive ? 'all-time' : 'played'}
          </p>
        </div>
      </div>

      {/* Section label */}
      <div className="px-3 py-1.5" style={{ background: '#222' }}>
        <span className="text-[8px] uppercase tracking-widest text-[#555] font-sans">
          {state === 'new' ? 'Scorecard — 3 holes left' : 'This week'}
        </span>
      </div>

      {/* Scorecard rows */}
      <div style={{ background: '#2a2a2a' }}>
        <ScorecardRows
          state={state}
          tier={tier}
          pointsBalance={pointsBalance}
          upcomingBooking={upcomingBooking}
          lastBooking={lastCompletedBooking}
        />
      </div>

      {/* CTA */}
      <div className="p-4" style={{ background: '#1C1C1C' }}>
        <Link
          href="/app/courses"
          className="block w-full text-center py-3 rounded-lg text-sm font-semibold font-sans text-[#FAF7F2] transition-colors hover:opacity-90"
          style={{ background: '#1B4332' }}
        >
          ⛳ {state === 'new' ? 'Find a tee time near you' : 'Book another tee time'}
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors

- [ ] **Step 3: Commit**

```bash
git add src/components/app/RoundCard.tsx
git commit -m "feat: add RoundCard component"
```

---

## Task 4: Dashboard page

**Files:**
- Modify: `src/app/app/page.tsx`

- [ ] **Step 1: Replace page.tsx**

```tsx
// src/app/app/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAndIssueMemberCredits } from '@/app/actions/booking'
import { RoundCard } from '@/components/app/RoundCard'
import type { MemberTier } from '@/lib/member-dashboard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships')
    .select('tier, status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  const tier = (membership?.tier ?? 'free') as MemberTier

  const [{ data: profile }, { data: pointsData }, { data: bookings }, creditCents] =
    await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', user.id).single(),
      supabase.from('fairway_points').select('amount').eq('user_id', user.id),
      supabase
        .from('bookings')
        .select('id, total_paid, status, tee_times(scheduled_at, courses(name))')
        .eq('user_id', user.id)
        .in('status', ['confirmed', 'completed'])
        .order('created_at', { ascending: false })
        .limit(20),
      getAndIssueMemberCredits(user.id, tier),
    ])

  const pointsBalance = (pointsData ?? []).reduce((sum, r) => sum + (r.amount as number), 0)
  const firstName = (profile?.full_name as string | null)?.split(' ')[0] ?? 'there'

  const now = new Date().toISOString()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typedBookings = (bookings ?? []) as any[]
  const completedBookings = typedBookings.filter(b => b.status === 'completed')
  const upcomingRaw = typedBookings.find(
    b => b.status === 'confirmed' && b.tee_times?.scheduled_at > now
  )
  const lastCompletedRaw = completedBookings[0] ?? null

  const upcomingBooking = upcomingRaw
    ? {
        courseName: upcomingRaw.tee_times?.courses?.name ?? 'Course',
        scheduledAt: upcomingRaw.tee_times?.scheduled_at as string,
      }
    : null

  const lastCompletedBooking = lastCompletedRaw
    ? {
        courseName: lastCompletedRaw.tee_times?.courses?.name ?? 'Course',
        scheduledAt: lastCompletedRaw.tee_times?.scheduled_at as string,
        totalPaid: lastCompletedRaw.total_paid as number,
      }
    : null

  return (
    <RoundCard
      firstName={firstName}
      tier={tier}
      pointsBalance={pointsBalance}
      creditCents={creditCents}
      completedRoundsCount={completedBookings.length}
      upcomingBooking={upcomingBooking}
      lastCompletedBooking={lastCompletedBooking}
    />
  )
}
```

- [ ] **Step 2: Run the full test suite to confirm nothing broken**

```bash
npx vitest run
```

Expected: all tests pass (this page has no tests of its own)

- [ ] **Step 3: Build check**

```bash
npm run build 2>&1 | tail -20
```

Expected: build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/app/app/page.tsx
git commit -m "feat: replace dashboard with RoundCard scorecard UI"
```

---

## Task 5: Courses page

**Files:**
- Modify: `src/app/app/courses/page.tsx`

- [ ] **Step 1: Replace courses/page.tsx**

```tsx
// src/app/app/courses/page.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function CoursesPage() {
  const supabase = await createClient()

  const { data: courses } = await supabase
    .from('courses')
    .select('id, name, slug, city, state, address, base_green_fee, hero_image_url')
    .eq('status', 'active')
    .order('name')

  return (
    <div className="rounded-xl overflow-hidden">
      {/* Dark header */}
      <div className="px-5 py-5" style={{ background: '#1C1C1C' }}>
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#888] font-sans mb-1">
          Partner Courses
        </p>
        <h1 className="text-2xl font-bold font-serif text-white italic">Find your round.</h1>
        <p className="text-[11px] font-sans mt-1" style={{ color: '#8FA889' }}>
          Zero booking fees, always.
        </p>
      </div>

      {/* Content */}
      <div className="p-4" style={{ background: '#1C1C1C' }}>
        {!courses || courses.length === 0 ? (
          <div className="rounded-lg p-12 text-center" style={{ background: '#2a2a2a' }}>
            <p style={{ color: '#888' }}>No courses in your area yet — we&apos;re growing.</p>
            <p className="text-sm mt-2" style={{ color: '#555' }}>
              Check back soon or tell your home course about TeeAhead.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map(course => (
              <Link key={course.id} href={`/app/courses/${course.slug}`}>
                <div
                  className="rounded-lg overflow-hidden transition-colors cursor-pointer hover:bg-[#333]"
                  style={{ background: '#2a2a2a' }}
                >
                  <div
                    className="h-36 flex items-center justify-center overflow-hidden"
                    style={{ background: '#1B4332' }}
                  >
                    {course.hero_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={course.hero_image_url as string}
                        alt={course.name as string}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl">⛳</span>
                    )}
                  </div>
                  <div className="px-4 py-3">
                    <h2 className="font-semibold text-white text-sm">{course.name as string}</h2>
                    <p className="text-xs mt-0.5" style={{ color: '#888' }}>
                      {course.city as string}, {course.state as string}
                    </p>
                    {course.base_green_fee && (
                      <p className="text-xs font-medium mt-2" style={{ color: '#8FA889' }}>
                        From ${(course.base_green_fee as number).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -20
```

Expected: build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/app/app/courses/page.tsx
git commit -m "feat: apply Round Card theme to courses page"
```

---

## Task 6: Bookings page

**Files:**
- Modify: `src/app/app/bookings/page.tsx`

- [ ] **Step 1: Replace bookings/page.tsx**

```tsx
// src/app/app/bookings/page.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function BookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, players, total_paid, status, created_at, tee_times(scheduled_at, courses(name))')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const now = new Date().toISOString()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typed = (bookings ?? []) as any[]
  const upcoming = typed.filter(
    b => b.status === 'confirmed' && b.tee_times?.scheduled_at > now
  )
  const past = typed.filter(b => !upcoming.includes(b))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const BookingRow = ({ b, isUpcoming = false }: { b: any; isUpcoming?: boolean }) => (
    <Link
      href={`/app/bookings/${b.id}`}
      className="block border-b border-[#333] last:border-0 hover:bg-[#333]/30 transition-colors"
    >
      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-semibold text-white text-sm">
            {b.tee_times?.courses?.name ?? 'Course'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: isUpcoming ? '#8FA889' : '#555' }}>
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
                  ? '#888'
                  : '#ef4444',
            }}
          >
            {b.status}
          </span>
        </div>
      </div>
    </Link>
  )

  return (
    <div className="rounded-xl overflow-hidden">
      {/* Dark header */}
      <div className="px-5 py-5" style={{ background: '#1C1C1C' }}>
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#888] font-sans mb-1">
          My Bookings
        </p>
        <h1 className="text-2xl font-bold font-serif text-white italic">Your rounds.</h1>
      </div>

      {/* Content */}
      {!bookings || bookings.length === 0 ? (
        <div className="p-8 text-center" style={{ background: '#2a2a2a' }}>
          <p style={{ color: '#888' }}>No bookings yet.</p>
          <Link
            href="/app/courses"
            className="inline-block mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-[#FAF7F2]"
            style={{ background: '#1B4332' }}
          >
            Find a course
          </Link>
        </div>
      ) : (
        <div style={{ background: '#2a2a2a' }}>
          {upcoming.length > 0 && (
            <>
              <div className="px-4 py-1.5" style={{ background: '#222' }}>
                <span className="text-[8px] uppercase tracking-widest font-sans" style={{ color: '#555' }}>
                  Upcoming
                </span>
              </div>
              {upcoming.map(b => (
                <BookingRow key={b.id} b={b} isUpcoming />
              ))}
            </>
          )}
          {past.length > 0 && (
            <>
              <div className="px-4 py-1.5" style={{ background: '#222' }}>
                <span className="text-[8px] uppercase tracking-widest font-sans" style={{ color: '#555' }}>
                  Past
                </span>
              </div>
              {past.map(b => (
                <BookingRow key={b.id} b={b} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -20
```

Expected: build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/app/app/bookings/page.tsx
git commit -m "feat: apply Round Card theme to bookings page"
```

---

## Task 7: Points page

**Files:**
- Modify: `src/app/app/points/page.tsx`

- [ ] **Step 1: Replace points/page.tsx**

```tsx
// src/app/app/points/page.tsx
import { createClient } from '@/lib/supabase/server'
import { getAndIssueMemberCredits } from '@/app/actions/booking'

export default async function PointsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: membership } = await supabase
    .from('memberships')
    .select('tier')
    .eq('user_id', user!.id)
    .eq('status', 'active')
    .single()

  const tier = membership?.tier ?? 'free'
  const earnRate = tier === 'ace' ? '2×' : tier === 'eagle' ? '1.5×' : '1×'

  const [{ data: transactions }, creditBalanceCents] = await Promise.all([
    supabase
      .from('fairway_points')
      .select('id, amount, reason, created_at, courses(name)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }),
    getAndIssueMemberCredits(user!.id, tier),
  ])

  const balance = (transactions ?? []).reduce((s, t) => s + (t.amount as number), 0)

  return (
    <div className="rounded-xl overflow-hidden">
      {/* Dark header with inline stats */}
      <div className="px-5 py-5" style={{ background: '#1C1C1C' }}>
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#888] font-sans mb-3">
          Fairway Points
        </p>
        <div className="flex items-end gap-6 flex-wrap">
          <div>
            <p className="text-4xl font-bold font-serif text-white leading-none">
              {balance.toLocaleString()}
            </p>
            <p className="text-[10px] font-sans mt-1" style={{ color: '#8FA889' }}>
              pts · ${(balance / 100).toFixed(2)} value
            </p>
          </div>
          {creditBalanceCents > 0 && (
            <div>
              <p className="text-2xl font-bold font-serif leading-none" style={{ color: '#E0A800' }}>
                ${(creditBalanceCents / 100).toFixed(0)}
              </p>
              <p className="text-[10px] font-sans mt-1" style={{ color: '#8FA889' }}>
                credit ready
              </p>
            </div>
          )}
          <div>
            <p className="text-2xl font-bold font-serif text-white leading-none">{earnRate}</p>
            <p className="text-[10px] font-sans mt-1" style={{ color: '#8FA889' }}>
              earn rate
            </p>
          </div>
        </div>
        <p className="text-[10px] font-sans mt-3" style={{ color: '#555' }}>
          100 pts = $1 toward future rounds.
        </p>
      </div>

      {/* Transaction history */}
      <div style={{ background: '#2a2a2a' }}>
        <div className="px-4 py-1.5" style={{ background: '#222' }}>
          <span className="text-[8px] uppercase tracking-widest font-sans" style={{ color: '#555' }}>
            History
          </span>
        </div>
        {!transactions || transactions.length === 0 ? (
          <div className="py-10 text-center" style={{ color: '#888' }}>
            No transactions yet. Book a tee time to start earning.
          </div>
        ) : (
          transactions.map(t => (
            <div
              key={t.id}
              className="flex items-center justify-between px-4 py-3 border-b border-[#333] last:border-0"
            >
              <div>
                <p className="text-[11px] font-sans" style={{ color: '#ddd' }}>
                  {t.reason as string}
                </p>
                <p className="text-[9px] font-sans mt-0.5" style={{ color: '#555' }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(t.courses as any)?.name} · {new Date(t.created_at as string).toLocaleDateString()}
                </p>
              </div>
              <span
                className="text-sm font-semibold font-sans"
                style={{ color: (t.amount as number) > 0 ? '#8FA889' : '#ef4444' }}
              >
                {(t.amount as number) > 0 ? '+' : ''}
                {(t.amount as number).toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -20
```

Expected: build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/app/app/points/page.tsx
git commit -m "feat: apply Round Card theme to points page"
```

---

## Task 8: My Card page

**Files:**
- Modify: `src/app/app/card/page.tsx`

- [ ] **Step 1: Update the page — wrap in dark shell, update "How it works" and upgrade nudge**

The physical card block (`#1B4332` bg, QR code, stats) is unchanged. Only the outer wrapper, "How it works" panel, and upgrade nudge get restyled.

Replace the `return (...)` block (keep all data-fetching above it identical):

```tsx
  return (
    <div className="max-w-sm mx-auto rounded-xl overflow-hidden" style={{ background: '#1C1C1C' }}>
      {/* Header label */}
      <div className="px-5 pt-5 pb-3">
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#888] font-sans">Member Card</p>
        <p className="text-[11px] font-sans mt-1" style={{ color: '#555' }}>
          Show this at check-in to earn Fairway Points.
        </p>
      </div>

      {/* Physical card — unchanged */}
      <div className="px-4">
        <div className={`${TIER_BG[tier]} rounded-2xl p-6 text-[#FAF7F2] shadow-xl relative overflow-hidden`}>
          <div className="absolute -top-10 -right-10 size-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-16 -left-8 size-48 rounded-full bg-white/5" />
          <div className="relative space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[#FAF7F2]/60 text-xs uppercase tracking-widest font-medium">TeeAhead</p>
                <p className="text-2xl font-bold mt-1">{profile?.full_name ?? 'Member'}</p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-white/15 rounded-full px-3 py-1 text-sm font-bold">
                  {TIER_LABEL[tier]}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-lg font-bold">{balance.toLocaleString()}</p>
                <p className="text-[#FAF7F2]/60 text-xs mt-0.5">Points</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-lg font-bold">{TIER_MULT[tier]}</p>
                <p className="text-[#FAF7F2]/60 text-xs mt-0.5">Multiplier</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-sm font-bold leading-tight">
                  {memberSince.split(' ')[0]}<br />{memberSince.split(' ')[1]}
                </p>
                <p className="text-[#FAF7F2]/60 text-xs mt-0.5">Member since</p>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[#FAF7F2]/60 text-xs uppercase tracking-widest">Member ID</p>
                <p className="font-mono font-bold text-lg mt-0.5">ML-{shortId}</p>
              </div>
              <div className="bg-white rounded-xl p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="Member QR code" width={72} height={72} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How it works — dark surface */}
      <div className="mx-4 mt-4 rounded-xl p-5 space-y-3" style={{ background: '#2a2a2a' }}>
        <h2 className="font-bold text-sm font-sans" style={{ color: '#888' }}>How it works</h2>
        <ul className="space-y-2 text-sm font-sans" style={{ color: '#ddd' }}>
          <li className="flex gap-2">
            <span style={{ color: '#8FA889' }} className="font-bold shrink-0">1.</span>
            Show this card to the course staff when you check in.
          </li>
          <li className="flex gap-2">
            <span style={{ color: '#8FA889' }} className="font-bold shrink-0">2.</span>
            They look you up by name, email, or scan your QR.
          </li>
          <li className="flex gap-2">
            <span style={{ color: '#8FA889' }} className="font-bold shrink-0">3.</span>
            Fairway Points are automatically awarded at your {TIER_MULT[tier]} multiplier.
          </li>
          <li className="flex gap-2">
            <span style={{ color: '#8FA889' }} className="font-bold shrink-0">4.</span>
            100 points = $1 toward future rounds.
          </li>
        </ul>
      </div>

      {/* Upgrade nudge — dark surface with gold accent */}
      {tier === 'fairway' && (
        <div
          className="mx-4 mt-3 mb-4 rounded-xl p-5 space-y-2 border border-[#E0A800]/40"
          style={{ background: '#2a2a2a' }}
        >
          <p className="font-bold text-sm font-sans" style={{ color: '#E0A800' }}>
            Earn 1.5× points with Eagle
          </p>
          <p className="text-sm font-sans" style={{ color: '#888' }}>
            Upgrade to Eagle for 1.5× Fairway Points, $120/yr in tee time credits, and priority booking.
          </p>
          <a
            href="/app/membership"
            className="inline-flex items-center text-sm font-semibold font-sans"
            style={{ color: '#8FA889' }}
          >
            Upgrade for $89/yr →
          </a>
        </div>
      )}

      {/* Bottom padding */}
      <div className="h-4" style={{ background: '#1C1C1C' }} />
    </div>
  )
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -20
```

Expected: build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/app/app/card/page.tsx
git commit -m "feat: apply Round Card theme to My Card page"
```

---

## Task 9: Profile page

**Files:**
- Modify: `src/app/app/profile/page.tsx`

- [ ] **Step 1: Add dark header above the ProfileForm**

Replace the `return (...)` block (data-fetching above it is unchanged):

```tsx
  const tierLabel = membership?.tier === 'ace' ? 'Ace' : membership?.tier === 'eagle' ? 'Eagle' : 'Fairway'
  const tierColor = membership?.tier === 'ace' ? '#8FA889' : membership?.tier === 'eagle' ? '#E0A800' : '#8FA889'
  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="max-w-lg">
      {/* Dark header */}
      <div className="rounded-xl overflow-hidden mb-6" style={{ background: '#1C1C1C' }}>
        <div className="px-5 py-5">
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#888] font-sans mb-1">Profile</p>
          <h1 className="text-2xl font-bold font-serif text-white italic">
            {profile?.full_name ?? 'Your profile'}
          </h1>
          <p className="text-[11px] font-sans mt-1">
            <span style={{ color: tierColor }}>{tierLabel} Member</span>
            <span style={{ color: '#555' }}> · Member since {memberSince}</span>
          </p>
        </div>
      </div>

      {/* Form stays light */}
      <ProfileForm
        userId={user.id}
        email={user.email ?? ''}
        initialName={profile?.full_name ?? ''}
        initialPhone={profile?.phone ?? ''}
        isFoundingMember={profile?.founding_member ?? false}
        membership={membership ?? null}
      />
    </div>
  )
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -20
```

Expected: build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/app/app/profile/page.tsx
git commit -m "feat: apply Round Card theme to profile page"
```

---

## Task 10: Membership page + FoundingGolferBanner

**Files:**
- Modify: `src/app/app/membership/page.tsx`
- Modify: `src/components/FoundingGolferBanner.tsx`

- [ ] **Step 1: Update FoundingGolferBanner to support dark surface**

```tsx
// src/components/FoundingGolferBanner.tsx
export interface Props {
  spotsRemaining: number
  dark?: boolean
}

export function FoundingGolferBanner({ spotsRemaining, dark = false }: Props) {
  if (spotsRemaining <= 0) return null

  return (
    <div
      className={`rounded-xl border border-[#E0A800]/40 p-4 space-y-2 ${
        dark ? 'bg-[#E0A800]/10' : 'bg-[#E0A800]/15'
      }`}
      aria-live="polite"
      aria-label="Founding Golfer Offer"
    >
      <p className={`font-semibold text-sm ${dark ? 'text-[#FAF7F2]' : 'text-[#1A1A1A]'}`}>
        Founding Golfer Offer — First 100 members get 3 months of Eagle free at launch.
        Then $89/yr. Cancel anytime before.
      </p>
      <p className={`text-sm ${dark ? 'text-[#aaa]' : 'text-[#6B7770]'}`}>
        {spotsRemaining} of 100 spots remaining.
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Replace membership/page.tsx**

Keep the `TIERS` array and all data-fetching identical. Replace only the `return (...)` block:

```tsx
  const headerSub =
    currentTier === 'eagle'
      ? "You're on Eagle."
      : currentTier === 'ace'
      ? "You're on Ace."
      : 'Currently on Fairway (free).'

  return (
    <div className="max-w-3xl mx-auto">
      {/* Dark header */}
      <div className="rounded-xl overflow-hidden mb-6" style={{ background: '#1C1C1C' }}>
        <div className="px-5 py-5">
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#888] font-sans mb-1">
            Membership
          </p>
          <h1 className="text-2xl font-bold font-serif text-white italic">Upgrade your game.</h1>
          <p className="text-[11px] font-sans mt-1" style={{ color: '#555' }}>{headerSub}</p>
        </div>
      </div>

      {/* Founding banner */}
      <div className="mb-6">
        <FoundingGolferBanner spotsRemaining={spotsRemaining} dark />
      </div>

      {/* Tier cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {TIERS.map(tier => {
          const isCurrent = currentTier === tier.id
          const isRecommended = currentTier !== 'eagle' && currentTier !== 'ace' && tier.id === 'eagle'
          const tierNameColor = tier.id === 'eagle' ? '#E0A800' : '#8FA889'
          const borderColor = isRecommended
            ? 'border-[#E0A800]'
            : isCurrent
            ? 'border-[#555]'
            : 'border-[#333]'

          return (
            <div
              key={tier.id}
              className={`rounded-xl border p-6 space-y-5 relative ${borderColor}`}
              style={{ background: '#2a2a2a' }}
            >
              {isRecommended && (
                <div className="absolute -top-3 left-6">
                  <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-[#E0A800] text-[#1A1A1A]">
                    Most Popular
                  </span>
                </div>
              )}

              <div>
                <h2 className="text-xl font-bold font-serif" style={{ color: tierNameColor }}>
                  {tier.name}
                </h2>
                <div className="mt-2">
                  <span className="text-3xl font-bold font-serif text-white">${tier.price}</span>
                  <span className="ml-1" style={{ color: '#888' }}>/yr</span>
                  <span className="block text-xs mt-0.5" style={{ color: '#555' }}>
                    ~${tier.priceMonthly}/mo
                  </span>
                </div>
              </div>

              <ul className="space-y-2">
                {tier.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm font-sans" style={{ color: '#ddd' }}>
                    <span className="font-bold mt-0.5 shrink-0" style={{ color: '#8FA889' }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div
                  className="w-full text-center py-2.5 rounded-lg text-sm font-semibold font-sans"
                  style={{ background: '#333', color: '#666' }}
                >
                  Current plan
                </div>
              ) : (
                <form action="/api/membership/checkout" method="POST">
                  <input type="hidden" name="tier" value={tier.id} />
                  <button
                    type="submit"
                    className="w-full rounded-lg py-2.5 text-sm font-semibold font-sans transition-colors"
                    style={
                      isRecommended
                        ? { background: '#E0A800', color: '#1A1A1A' }
                        : { background: '#333', color: '#aaa' }
                    }
                  >
                    Upgrade to {tier.name} — ${tier.price}/yr
                  </button>
                </form>
              )}
            </div>
          )
        })}
      </div>

      <Link
        href="/app"
        className="inline-flex text-sm mt-6 font-sans"
        style={{ color: '#555' }}
      >
        ← Back to dashboard
      </Link>
    </div>
  )
```

- [ ] **Step 3: Build check**

```bash
npm run build 2>&1 | tail -20
```

Expected: build succeeds

- [ ] **Step 4: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add src/components/FoundingGolferBanner.tsx src/app/app/membership/page.tsx
git commit -m "feat: apply Round Card theme to membership page and FoundingGolferBanner"
```

---

## Final: Visual verification

- [ ] **Start dev server and walk through each tab**

```bash
npm run dev
```

Open `http://localhost:3000/app` and verify each page in order:
1. `/app` — Round Card visible, stats dimmed (new) or live (active), scorecard rows correct
2. `/app/courses` — dark header, dark course cards
3. `/app/bookings` — dark header, dark rows, Upcoming/Past sections
4. `/app/points` — dark header with inline stats, dark history rows
5. `/app/card` — dark shell, green member card unchanged, dark "How it works"
6. `/app/profile` — dark header block, light form below
7. `/app/membership` — dark header, dark tier cards, Eagle card has gold border

- [ ] **Final commit if any visual tweaks needed**

```bash
git add -p
git commit -m "fix: visual tweaks from member app theme review"
```

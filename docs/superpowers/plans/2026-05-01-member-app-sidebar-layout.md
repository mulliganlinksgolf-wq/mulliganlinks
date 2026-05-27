# Member App Sidebar Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the white top nav + cream background with a dark green sidebar (desktop) and bottom tab bar (mobile), making the member app feel cohesive instead of a marketing site with a bolted-on portal.

**Architecture:** Full-height flex layout with a fixed 224px sidebar on desktop (`md:`) and a pinned bottom nav on mobile. The content area uses `bg-[#0f2d1d]` throughout. Each page drops its outer card wrapper — sections render directly on the dark background. Nav config and active-state logic live in `src/lib/nav.ts` so they're testable without a browser.

**Tech Stack:** Next.js App Router, Tailwind CSS, Supabase server components, Vitest + @testing-library/react.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/lib/nav.ts` | Nav item config + `isNavItemActive` pure helper |
| Create | `src/test/nav.test.ts` | Unit tests for `isNavItemActive` |
| Create | `src/components/AppSidebar.tsx` | Desktop sidebar (`hidden md:flex`) |
| Create | `src/components/AppBottomNav.tsx` | Mobile bottom tab bar (`md:hidden`) |
| Modify | `src/app/app/layout.tsx` | New flex shell, dark bg, wire up new nav components |
| Modify | `src/app/app/courses/page.tsx` | Remove outer card wrapper, inline header |
| Modify | `src/app/app/bookings/page.tsx` | Remove outer card wrapper, inline header |
| Modify | `src/app/app/points/page.tsx` | Remove outer card wrapper, inline header |
| Modify | `src/app/app/card/page.tsx` | Remove `#1C1C1C` shell, keep physical card + max-w-sm |
| Modify | `src/app/app/profile/page.tsx` | Remove outer card wrapper, wrap ProfileForm in green card |
| Modify | `src/app/app/membership/page.tsx` | Remove outer card wrapper, inline header |
| Delete | `src/components/AppNav.tsx` | Replaced — no longer used |
| Delete | `src/components/NavMenu.tsx` | Untracked leftover — delete |

**Note:** `src/app/app/page.tsx` (dashboard) needs NO changes — it already returns `<RoundCard>` directly with no outer wrapper.

---

## Color Reference

| Token | Hex | Used for |
|-------|-----|----------|
| Brand green | `#1B4332` | Sidebar, card backgrounds |
| Deep green | `#0f2d1d` | Content area background, dividers |
| Surface green | `#163d2a` | Row backgrounds, stats strip |
| Sage | `#8FA889` | Inactive nav, subtitles |
| Gold | `#E0A800` | Logo, Eagle tier |
| Muted | `#aaa` | Small-caps labels |

---

## Task 1: Nav config + isNavItemActive helper

**Files:**
- Create: `src/lib/nav.ts`
- Create: `src/test/nav.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/test/nav.test.ts
import { describe, it, expect } from 'vitest'
import { isNavItemActive, SIDEBAR_NAV_ITEMS, BOTTOM_NAV_ITEMS } from '@/lib/nav'

describe('isNavItemActive', () => {
  it('matches exact path when exact=true', () => {
    expect(isNavItemActive('/app', '/app', true)).toBe(true)
  })
  it('does not match sub-path when exact=true', () => {
    expect(isNavItemActive('/app/courses', '/app', true)).toBe(false)
  })
  it('matches sub-path when exact=false', () => {
    expect(isNavItemActive('/app/courses/abc', '/app/courses', false)).toBe(true)
  })
  it('does not match unrelated path', () => {
    expect(isNavItemActive('/app/bookings', '/app/courses', false)).toBe(false)
  })
  it('defaults exact to false', () => {
    expect(isNavItemActive('/app/courses/slug', '/app/courses')).toBe(true)
  })
})

describe('SIDEBAR_NAV_ITEMS', () => {
  it('has 6 items', () => {
    expect(SIDEBAR_NAV_ITEMS).toHaveLength(6)
  })
  it('dashboard is the only exact match', () => {
    const exactItems = SIDEBAR_NAV_ITEMS.filter(i => i.exact)
    expect(exactItems).toHaveLength(1)
    expect(exactItems[0].href).toBe('/app')
  })
})

describe('BOTTOM_NAV_ITEMS', () => {
  it('has 5 items (My Card omitted on mobile)', () => {
    expect(BOTTOM_NAV_ITEMS).toHaveLength(5)
  })
  it('does not include My Card', () => {
    expect(BOTTOM_NAV_ITEMS.find(i => i.href === '/app/card')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/test/nav.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/nav'`

- [ ] **Step 3: Create `src/lib/nav.ts`**

```ts
export type NavItem = {
  href: string
  label: string
  icon: string
  exact?: boolean
}

export const SIDEBAR_NAV_ITEMS: NavItem[] = [
  { href: '/app',          label: 'Dashboard', icon: '⛳', exact: true },
  { href: '/app/courses',  label: 'Courses',   icon: '🗺️' },
  { href: '/app/bookings', label: 'Bookings',  icon: '📋' },
  { href: '/app/points',   label: 'Points',    icon: '⭐' },
  { href: '/app/card',     label: 'My Card',   icon: '🃏' },
  { href: '/app/profile',  label: 'Profile',   icon: '👤' },
]

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: '/app',          label: 'Home',     icon: '⛳', exact: true },
  { href: '/app/courses',  label: 'Courses',  icon: '🗺️' },
  { href: '/app/bookings', label: 'Bookings', icon: '📋' },
  { href: '/app/points',   label: 'Points',   icon: '⭐' },
  { href: '/app/profile',  label: 'Profile',  icon: '👤' },
]

export function isNavItemActive(pathname: string, href: string, exact = false): boolean {
  return exact ? pathname === href : pathname.startsWith(href)
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/test/nav.test.ts
```

Expected: PASS — 8 tests, 0 failures

- [ ] **Step 5: Commit**

```bash
git add src/lib/nav.ts src/test/nav.test.ts
git commit -m "feat: add nav config and isNavItemActive helper with tests"
```

---

## Task 2: AppSidebar component

**Files:**
- Create: `src/components/AppSidebar.tsx`

- [ ] **Step 1: Create `src/components/AppSidebar.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'
import { SIDEBAR_NAV_ITEMS, isNavItemActive } from '@/lib/nav'

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-56 fixed top-0 left-0 bottom-0 bg-[#1B4332] border-r border-[#0f2d1d] z-40">
      {/* Logo */}
      <div className="p-5 border-b border-[#0f2d1d]">
        <Link href="/app">
          <TeeAheadLogo className="h-10 w-auto brightness-0 invert" />
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {SIDEBAR_NAV_ITEMS.map(item => {
          const active = isNavItemActive(pathname, item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium font-sans transition-colors ${
                active
                  ? 'bg-white/10 text-white'
                  : 'text-[#8FA889] hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-[#0f2d1d]">
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium font-sans text-[#8FA889] hover:text-white hover:bg-white/5 transition-colors w-full text-left"
          >
            <span className="text-base leading-none">↩</span>
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
```

**Logo note:** `brightness-0 invert` converts any logo color to white (black → inverted to white). This works for dark-text-on-transparent PNGs. If the logo already appears white or shows incorrectly, remove the filter classes.

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep AppSidebar
```

Expected: no output (no errors for this file)

- [ ] **Step 3: Commit**

```bash
git add src/components/AppSidebar.tsx
git commit -m "feat: add AppSidebar desktop nav component"
```

---

## Task 3: AppBottomNav component

**Files:**
- Create: `src/components/AppBottomNav.tsx`

- [ ] **Step 1: Create `src/components/AppBottomNav.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BOTTOM_NAV_ITEMS, isNavItemActive } from '@/lib/nav'

export function AppBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1B4332] border-t border-[#0f2d1d] z-40">
      <div className="flex items-stretch">
        {BOTTOM_NAV_ITEMS.map(item => {
          const active = isNavItemActive(pathname, item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium font-sans transition-colors ${
                active ? 'text-white' : 'text-[#8FA889]'
              }`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep AppBottomNav
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/components/AppBottomNav.tsx
git commit -m "feat: add AppBottomNav mobile tab bar component"
```

---

## Task 4: Update app layout

**Files:**
- Modify: `src/app/app/layout.tsx`

- [ ] **Step 1: Rewrite `src/app/app/layout.tsx`**

Replace the entire file with:

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppSidebar } from '@/components/AppSidebar'
import { AppBottomNav } from '@/components/AppBottomNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="flex h-screen bg-[#0f2d1d] overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto md:pl-56">
        {/* md:pl-56 offsets the fixed 224px sidebar on desktop; no offset on mobile */}
        <div className="px-6 py-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>
      <AppBottomNav />
    </div>
  )
}
```

- [ ] **Step 2: Type-check the whole project**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: only pre-existing errors (none related to layout or nav)

- [ ] **Step 3: Build check**

```bash
npm run build 2>&1 | tail -20
```

Expected: successful build. If there are import errors for `AppNav`, proceed to Task 8 to delete it.

- [ ] **Step 4: Commit**

```bash
git add src/app/app/layout.tsx
git commit -m "feat: replace top nav with sidebar+bottom-nav shell layout"
```

---

## Task 5: Update courses and bookings pages

**Files:**
- Modify: `src/app/app/courses/page.tsx`
- Modify: `src/app/app/bookings/page.tsx`

### Courses page

- [ ] **Step 1: Replace `src/app/app/courses/page.tsx`**

```tsx
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
    <div>
      {/* Inline header — no card wrapper needed on dark bg */}
      <div className="mb-6">
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#aaa] font-sans mb-1">
          Partner Courses
        </p>
        <h1 className="text-2xl font-bold font-serif text-white italic">Find your round.</h1>
        <p className="text-[11px] font-sans mt-1" style={{ color: '#8FA889' }}>
          Zero booking fees, always.
        </p>
      </div>

      {!courses || courses.length === 0 ? (
        <div className="rounded-xl p-12 text-center" style={{ background: '#1B4332' }}>
          <p style={{ color: '#aaa' }}>No courses in your area yet — we&apos;re growing.</p>
          <p className="text-sm mt-2" style={{ color: '#8FA889' }}>
            Check back soon or tell your home course about TeeAhead.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(course => (
            <Link key={course.id} href={`/app/courses/${course.slug}`}>
              <div
                className="rounded-lg overflow-hidden transition-opacity cursor-pointer hover:opacity-90"
                style={{ background: '#1B4332' }}
              >
                <div
                  className="h-36 flex items-center justify-center overflow-hidden"
                  style={{ background: '#163d2a' }}
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
                  <p className="text-xs mt-0.5" style={{ color: '#aaa' }}>
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
  )
}
```

### Bookings page

- [ ] **Step 2: Replace `src/app/app/bookings/page.tsx`**

```tsx
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
      className="block border-b border-[#1d4c36] last:border-0 hover:bg-white/5 transition-colors"
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

  return (
    <div>
      {/* Inline header */}
      <div className="mb-6">
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#aaa] font-sans mb-1">
          My Bookings
        </p>
        <h1 className="text-2xl font-bold font-serif text-white italic">Your rounds.</h1>
      </div>

      {!bookings || bookings.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ background: '#1B4332' }}>
          <p style={{ color: '#aaa' }}>No bookings yet.</p>
          <Link
            href="/app/courses"
            className="inline-block mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-[#FAF7F2]"
            style={{ background: '#163d2a' }}
          >
            Find a course
          </Link>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: '#1B4332' }}>
          {upcoming.length > 0 && (
            <>
              <div className="px-4 py-1.5" style={{ background: '#0f2d1d' }}>
                <span className="text-[8px] uppercase tracking-widest font-sans text-[#aaa]">
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
              <div className="px-4 py-1.5" style={{ background: '#0f2d1d' }}>
                <span className="text-[8px] uppercase tracking-widest font-sans text-[#aaa]">
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

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -E "courses/page|bookings/page"
```

Expected: no output

- [ ] **Step 4: Commit**

```bash
git add src/app/app/courses/page.tsx src/app/app/bookings/page.tsx
git commit -m "feat: remove outer card wrappers from courses and bookings pages"
```

---

## Task 6: Update points and profile pages

**Files:**
- Modify: `src/app/app/points/page.tsx`
- Modify: `src/app/app/profile/page.tsx`

### Points page

- [ ] **Step 1: Replace `src/app/app/points/page.tsx`**

```tsx
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
    <div>
      {/* Inline header with inline stats */}
      <div className="mb-6">
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#aaa] font-sans mb-3">
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
        <p className="text-[10px] font-sans mt-3" style={{ color: '#8FA889' }}>
          100 pts = $1 toward future rounds.
        </p>
      </div>

      {/* Transaction history card */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#1B4332' }}>
        <div className="px-4 py-1.5" style={{ background: '#0f2d1d' }}>
          <span className="text-[8px] uppercase tracking-widest font-sans text-[#aaa]">
            History
          </span>
        </div>
        {!transactions || transactions.length === 0 ? (
          <div className="py-10 text-center" style={{ color: '#aaa' }}>
            No transactions yet. Book a tee time to start earning.
          </div>
        ) : (
          transactions.map(t => (
            <div
              key={t.id}
              className="flex items-center justify-between px-4 py-3 border-b border-[#1d4c36] last:border-0"
            >
              <div>
                <p className="text-[11px] font-sans" style={{ color: '#ddd' }}>
                  {t.reason as string}
                </p>
                <p className="text-[9px] font-sans mt-0.5" style={{ color: '#aaa' }}>
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

### Profile page

- [ ] **Step 2: Replace `src/app/app/profile/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/ProfileForm'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, founding_member')
    .eq('id', user.id)
    .single()

  const { data: membership } = await supabase
    .from('memberships')
    .select('tier, status, current_period_end')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  const tierLabel = membership?.tier === 'ace' ? 'Ace' : membership?.tier === 'eagle' ? 'Eagle' : 'Fairway'
  const tierColor = membership?.tier === 'eagle' ? '#E0A800' : '#8FA889'
  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="max-w-2xl">
      {/* Inline header */}
      <div className="mb-6">
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#aaa] font-sans mb-1">Profile</p>
        <h1 className="text-2xl font-bold font-serif text-white italic">
          {profile?.full_name ?? 'Your profile'}
        </h1>
        <p className="text-[11px] font-sans mt-1">
          <span style={{ color: tierColor }}>{tierLabel} Member</span>
          <span style={{ color: '#aaa' }}> · Member since {memberSince}</span>
        </p>
      </div>

      {/* ProfileForm wrapped in a green card so light form fields sit on dark bg */}
      <div className="rounded-xl p-6" style={{ background: '#1B4332' }}>
        <ProfileForm
          userId={user.id}
          email={user.email ?? ''}
          initialName={profile?.full_name ?? ''}
          initialPhone={profile?.phone ?? ''}
          isFoundingMember={profile?.founding_member ?? false}
          membership={membership ?? null}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -E "points/page|profile/page"
```

Expected: no output

- [ ] **Step 4: Commit**

```bash
git add src/app/app/points/page.tsx src/app/app/profile/page.tsx
git commit -m "feat: remove outer card wrappers from points and profile pages"
```

---

## Task 7: Update card and membership pages

**Files:**
- Modify: `src/app/app/card/page.tsx`
- Modify: `src/app/app/membership/page.tsx`

### Card page

The card page previously used `#1C1C1C` as an outer shell. Now the background is `#0f2d1d`. Remove the outer shell, keep `max-w-sm mx-auto` for the narrow card layout. Update the `#2a2a2a` info sections to `#1B4332`.

- [ ] **Step 1: Replace `src/app/app/card/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import QRCode from 'qrcode'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Member Card' }

const TIER_LABEL: Record<string, string> = { ace: 'Ace', eagle: 'Eagle', fairway: 'Fairway' }
const TIER_MULT: Record<string, string> = { ace: '2×', eagle: '1.5×', fairway: '1×' }
const TIER_BG: Record<string, string> = {
  ace: 'bg-[#1B4332]',
  eagle: 'bg-[#1A1A1A]',
  fairway: 'bg-[#3D5A4E]',
}

export default async function MemberCardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: membership }, { data: pointRows }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase.from('memberships').select('tier, status, current_period_end').eq('user_id', user.id).single(),
    supabase.from('fairway_points').select('amount').eq('user_id', user.id),
  ])

  const tier = membership?.tier ?? 'fairway'
  const balance = (pointRows ?? []).reduce((s: number, r: any) => s + r.amount, 0)
  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const shortId = user.id.slice(0, 8).toUpperCase()

  const qrData = `https://teeahead.com/checkin/${user.id}`
  const qrDataUrl = await QRCode.toDataURL(qrData, {
    width: 200,
    margin: 1,
    color: { dark: '#1B4332', light: '#ffffff' },
  })

  return (
    <div className="max-w-sm mx-auto">
      {/* Inline header */}
      <div className="mb-4">
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#aaa] font-sans">Member Card</p>
        <p className="text-[11px] font-sans mt-1" style={{ color: '#8FA889' }}>
          Show this at check-in to earn Fairway Points.
        </p>
      </div>

      {/* Physical card — inner design unchanged */}
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

      {/* How it works */}
      <div className="mt-4 rounded-xl p-5 space-y-3" style={{ background: '#1B4332' }}>
        <h2 className="font-bold text-sm font-sans text-[#aaa]">How it works</h2>
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

      {/* Upgrade nudge */}
      {tier === 'fairway' && (
        <div
          className="mt-3 mb-4 rounded-xl p-5 space-y-2 border border-[#E0A800]/40"
          style={{ background: '#1B4332' }}
        >
          <p className="font-bold text-sm font-sans" style={{ color: '#E0A800' }}>
            Earn 1.5× points with Eagle
          </p>
          <p className="text-sm font-sans" style={{ color: '#aaa' }}>
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
    </div>
  )
}
```

### Membership page

- [ ] **Step 2: Replace `src/app/app/membership/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { FoundingGolferBanner } from '@/components/FoundingGolferBanner'

export const metadata: Metadata = { title: 'Upgrade Membership' }

const TIERS = [
  {
    id: 'eagle',
    name: 'Eagle',
    price: 89,
    priceMonthly: 7.42,
    features: [
      '$10/mo in tee time credits ($120/yr)',
      '1 free round per year',
      'Zero booking fees, always',
      '1.5× Fairway Points on every dollar',
      '48hr priority booking window',
      '12 guest fee waivers per year',
      '10% green fee discount',
      '$25 birthday credit',
      'Unlimited free cancellation (1hr)',
    ],
  },
  {
    id: 'ace',
    name: 'Ace',
    price: 159,
    priceMonthly: 13.25,
    features: [
      '$20/mo in tee time credits ($240/yr)',
      '2 free rounds per year',
      'Zero booking fees, always',
      '2× Fairway Points on every dollar',
      '72hr priority booking window',
      '24 guest fee waivers per year',
      '15% green fee discount',
      '$50 birthday credit',
      'Unlimited free cancellation (1hr)',
      '2 in-person lessons per year',
      'Dedicated concierge booking line',
      'Physical Ace member card (coming soon)',
    ],
  },
]

export default async function MembershipPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: membership }, { data: counter }] = await Promise.all([
    supabase.from('memberships').select('tier').eq('user_id', user.id).single(),
    supabase.from('founding_golfer_counter').select('claimed, limit').eq('id', 1).single(),
  ])

  const spotsRemaining = counter ? counter.limit - counter.claimed : 0
  const currentTier = membership?.tier ?? 'fairway'

  const headerSub =
    currentTier === 'eagle'
      ? "You're on Eagle."
      : currentTier === 'ace'
      ? "You're on Ace."
      : 'Currently on Fairway (free).'

  return (
    <div>
      {/* Inline header */}
      <div className="mb-6">
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#aaa] font-sans mb-1">
          Membership
        </p>
        <h1 className="text-2xl font-bold font-serif text-white italic">Upgrade your game.</h1>
        <p className="text-[11px] font-sans mt-1" style={{ color: '#aaa' }}>{headerSub}</p>
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
            : 'border-[#1d4c36]'

          return (
            <div
              key={tier.id}
              className={`rounded-xl border p-6 space-y-5 relative ${borderColor}`}
              style={{ background: '#1B4332' }}
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
                  <span className="ml-1" style={{ color: '#aaa' }}>/yr</span>
                  <span className="block text-xs mt-0.5" style={{ color: '#8FA889' }}>
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
                  style={{ background: '#163d2a', color: '#8FA889' }}
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
                        : { background: '#163d2a', color: '#aaa' }
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
        style={{ color: '#8FA889' }}
      >
        ← Back to dashboard
      </Link>
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -E "card/page|membership/page"
```

Expected: no output

- [ ] **Step 4: Commit**

```bash
git add src/app/app/card/page.tsx src/app/app/membership/page.tsx
git commit -m "feat: remove outer card wrappers from card and membership pages"
```

---

## Task 8: Cleanup — delete old nav components

**Files:**
- Delete: `src/components/AppNav.tsx`
- Delete: `src/components/NavMenu.tsx`

- [ ] **Step 1: Delete both files**

```bash
git rm src/components/AppNav.tsx src/components/NavMenu.tsx
```

- [ ] **Step 2: Verify no remaining imports**

```bash
grep -r "AppNav\|NavMenu" src/ --include="*.tsx" --include="*.ts"
```

Expected: no output

- [ ] **Step 3: Run full test suite**

```bash
npm test
```

Expected: all tests pass (nav.test.ts + member-dashboard.test.ts + others)

- [ ] **Step 4: Final build check**

```bash
npm run build 2>&1 | tail -10
```

Expected: successful build, no errors

- [ ] **Step 5: Commit and push**

```bash
git commit -m "chore: delete AppNav and NavMenu — replaced by AppSidebar + AppBottomNav"
git push origin main
```

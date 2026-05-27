# Booking Widget & Course Install Docs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public-facing tee time booking page, embeddable `widget.js`, and a course portal Install page so courses can self-serve their website integration.

**Architecture:** A new public route `/book/[slug]` serves as the hosted booking page — it's light-themed, auth-free for browsing, and opens booking in a new tab. `public/widget.js` is a tiny script that iframes this page onto any course website. The course portal gets a new `/course/[slug]/install` page that surfaces embed codes and platform instructions (reusing the `PlatformInstallGuide` component that already exists in onboarding). `next.config.ts` gets a header override to allow `/book/*` to be iframed.

**Tech Stack:** Next.js App Router (server + client components), Supabase (tee time data), Tailwind CSS, vanilla JS (widget.js)

---

## File Map

| File | Status | Responsibility |
|------|--------|----------------|
| `next.config.ts` | **Modify** | Remove `X-Frame-Options` for `/book/(.*)` so iframe embedding works |
| `src/app/book/[slug]/page.tsx` | **Create** | Server component — fetches course + tee times, renders light-brand layout |
| `src/app/book/[slug]/PublicTeeTimeGrid.tsx` | **Create** | Client component — date navigation, player filter, tee time cards |
| `public/widget.js` | **Create** | Embeddable script — reads `data-course`, injects iframe pointing to `/book/[slug]` |
| `src/app/course/[slug]/install/page.tsx` | **Create** | Course portal Install page — embed code, booking URL, platform instructions |
| `src/app/course/[slug]/layout.tsx` | **Modify** | Add "Install" nav item (manager only) |
| `src/test/public-booking-page.test.tsx` | **Create** | Unit tests for `PublicTeeTimeGrid` |

---

## Task 1: Allow `/book/*` to be embedded in iframes

**Files:**
- Modify: `next.config.ts`

The current config sets `X-Frame-Options: SAMEORIGIN` on all routes, which blocks the widget iframe. We need a header override that removes this header specifically for `/book/*`.

- [ ] **Step 1: Update `next.config.ts`**

Replace the `headers()` function with a version that adds a second source entry for `/book/(.*)` that unsets `X-Frame-Options`:

```ts
// next.config.ts
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
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // Allow /book/* to be embedded as an iframe on course websites
        source: '/book/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: '' },
        ],
      },
    ]
  },
};

export default nextConfig;
```

- [ ] **Step 2: Verify build still compiles**

```bash
npm run build 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "feat: allow /book/* routes to be embedded in iframes"
```

---

## Task 2: Write failing tests for `PublicTeeTimeGrid`

**Files:**
- Create: `src/test/public-booking-page.test.tsx`

- [ ] **Step 1: Create the test file**

```tsx
// src/test/public-booking-page.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PublicTeeTimeGrid } from '@/app/book/[slug]/PublicTeeTimeGrid'

const BASE_DATE = '2026-05-10'

function makeTeeTime(overrides: Partial<{
  id: string
  scheduled_at: string
  available_players: number
  base_price: number
}> = {}) {
  return {
    id: 'tt-1',
    scheduled_at: `${BASE_DATE}T14:00:00+00:00`,
    available_players: 4,
    base_price: 55,
    ...overrides,
  }
}

describe('PublicTeeTimeGrid', () => {
  it('renders a tee time card with price and time', () => {
    render(
      <PublicTeeTimeGrid
        teeTimes={[makeTeeTime()]}
        courseName="Bay Pointe Golf Club"
        courseSlug="bay-pointe"
        selectedDate={BASE_DATE}
      />
    )
    expect(screen.getByText('$55.00')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /book now/i })).toBeInTheDocument()
  })

  it('shows an empty state when there are no tee times', () => {
    render(
      <PublicTeeTimeGrid
        teeTimes={[]}
        courseName="Bay Pointe Golf Club"
        courseSlug="bay-pointe"
        selectedDate={BASE_DATE}
      />
    )
    expect(screen.getByText(/no tee times available/i)).toBeInTheDocument()
  })

  it('Book Now links open in a new tab', () => {
    render(
      <PublicTeeTimeGrid
        teeTimes={[makeTeeTime({ id: 'tt-abc' })]}
        courseName="Bay Pointe Golf Club"
        courseSlug="bay-pointe"
        selectedDate={BASE_DATE}
      />
    )
    const link = screen.getByRole('link', { name: /book now/i })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('href', '/app/book/tt-abc')
  })

  it('filters to afternoon tee times when Afternoon filter selected', async () => {
    const user = userEvent.setup()
    const morning = makeTeeTime({ id: 'morning', scheduled_at: `${BASE_DATE}T10:00:00+00:00`, base_price: 45 })
    const afternoon = makeTeeTime({ id: 'afternoon', scheduled_at: `${BASE_DATE}T14:00:00+00:00`, base_price: 55 })

    render(
      <PublicTeeTimeGrid
        teeTimes={[morning, afternoon]}
        courseName="Bay Pointe Golf Club"
        courseSlug="bay-pointe"
        selectedDate={BASE_DATE}
      />
    )

    await user.click(screen.getByRole('button', { name: /afternoon/i }))
    expect(screen.queryByText('$45.00')).not.toBeInTheDocument()
    expect(screen.getByText('$55.00')).toBeInTheDocument()
  })

  it('filters by player count', async () => {
    const user = userEvent.setup()
    const solo = makeTeeTime({ id: 'solo', available_players: 1, base_price: 40 })
    const group = makeTeeTime({ id: 'group', available_players: 4, base_price: 55 })

    render(
      <PublicTeeTimeGrid
        teeTimes={[solo, group]}
        courseName="Bay Pointe Golf Club"
        courseSlug="bay-pointe"
        selectedDate={BASE_DATE}
      />
    )

    // Pick "4 golfers" — solo slot should be hidden
    await user.click(screen.getByRole('button', { name: '4' }))
    // Both $40 and $55 slots were rendered, but now solo is filtered
    const links = screen.getAllByRole('link', { name: /book now/i })
    expect(links).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run tests — verify they FAIL (component not yet created)**

```bash
npx vitest run src/test/public-booking-page.test.tsx 2>&1 | tail -15
```

Expected: `FAIL` — `Cannot find module '@/app/book/[slug]/PublicTeeTimeGrid'`

---

## Task 3: Build `PublicTeeTimeGrid` client component

**Files:**
- Create: `src/app/book/[slug]/PublicTeeTimeGrid.tsx`

- [ ] **Step 1: Create `PublicTeeTimeGrid.tsx`**

```tsx
// src/app/book/[slug]/PublicTeeTimeGrid.tsx
'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface TeeTime {
  id: string
  scheduled_at: string
  available_players: number
  base_price: number
}

const TZ = 'America/Detroit'

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ,
  })
}

function localHour(iso: string) {
  return parseInt(new Date(iso).toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: TZ }))
}

function formatDateLabel(s: string) {
  return new Date(s + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

function offsetDate(base: string, days: number) {
  const d = new Date(base + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function TeeTimeCard({ tt, courseSlug }: { tt: TeeTime; courseSlug: string }) {
  const spotsLeft = tt.available_players
  const isLast = spotsLeft === 1

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
      <div>
        <p className="text-lg font-bold text-gray-900">{formatTime(tt.scheduled_at)}</p>
        <p className={`text-xs font-medium mt-0.5 ${isLast ? 'text-red-500' : 'text-gray-400'}`}>
          {isLast ? '1 spot left' : `${spotsLeft} spots left`}
        </p>
      </div>
      <p className="text-2xl font-bold text-[#1B4332]">${tt.base_price.toFixed(2)}</p>
      <Link
        href={`/app/book/${tt.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center bg-[#1B4332] text-white text-sm font-semibold rounded-lg py-2 hover:bg-[#163d2a] transition-colors"
      >
        Book Now
      </Link>
    </div>
  )
}

export function PublicTeeTimeGrid({
  teeTimes,
  courseName,
  courseSlug,
  selectedDate,
}: {
  teeTimes: TeeTime[]
  courseName: string
  courseSlug: string
  selectedDate: string
}) {
  const [golfers, setGolfers] = useState<number | null>(null)
  const [timeOfDay, setTimeOfDay] = useState<'any' | 'morning' | 'afternoon'>('any')

  const prevDate = offsetDate(selectedDate, -1)
  const nextDate = offsetDate(selectedDate, 1)

  const filtered = useMemo(() => {
    return teeTimes.filter(tt => {
      if (golfers !== null && tt.available_players < golfers) return false
      const h = localHour(tt.scheduled_at)
      if (timeOfDay === 'morning' && h >= 12) return false
      if (timeOfDay === 'afternoon' && h < 12) return false
      return true
    })
  }, [teeTimes, golfers, timeOfDay])

  const morning = filtered.filter(tt => localHour(tt.scheduled_at) < 12)
  const afternoon = filtered.filter(tt => localHour(tt.scheduled_at) >= 12)

  return (
    <div className="space-y-6">
      {/* Date navigator */}
      <div className="flex items-center justify-between bg-[#1B4332] rounded-xl px-4 py-3 text-white">
        <Link
          href={`?date=${prevDate}`}
          className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors text-lg"
        >
          ←
        </Link>
        <div className="text-center">
          <p className="text-xs text-white/60 uppercase tracking-wider">Tee times at</p>
          <p className="font-bold">{courseName}</p>
          <p className="text-sm text-[#A3C97A]">{formatDateLabel(selectedDate)}</p>
        </div>
        <Link
          href={`?date=${nextDate}`}
          className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors text-lg"
        >
          →
        </Link>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Time of day */}
        <div className="flex gap-1 bg-gray-100 rounded-full p-1">
          {(['any', 'morning', 'afternoon'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTimeOfDay(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                timeOfDay === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'any' ? 'Any Time' : t === 'morning' ? 'Morning' : 'Afternoon'}
            </button>
          ))}
        </div>

        {/* Player count */}
        <div className="flex gap-1 bg-gray-100 rounded-full p-1">
          <button
            onClick={() => setGolfers(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              golfers === null ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Any
          </button>
          {[1, 2, 3, 4].map(n => (
            <button
              key={n}
              onClick={() => setGolfers(golfers === n ? null : n)}
              className={`w-8 h-7 rounded-full text-xs font-medium transition-all ${
                golfers === n ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-400 ml-auto">
          Members save up to 15% ·{' '}
          <Link href="/signup" target="_blank" className="text-[#1B4332] font-medium hover:underline">
            Join free →
          </Link>
        </p>
      </div>

      {/* Tee time grid */}
      {filtered.length === 0 ? (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No tee times available for this date.</p>
          <button
            onClick={() => { setGolfers(null); setTimeOfDay('any') }}
            className="mt-3 text-sm text-[#1B4332] underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          {morning.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Morning</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {morning.map(tt => <TeeTimeCard key={tt.id} tt={tt} courseSlug={courseSlug} />)}
              </div>
            </div>
          )}
          {afternoon.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Afternoon</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {afternoon.map(tt => <TeeTimeCard key={tt.id} tt={tt} courseSlug={courseSlug} />)}
              </div>
            </div>
          )}
        </>
      )}

      {/* TeeAhead footer */}
      <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
        <p className="text-xs text-gray-400">Powered by</p>
        <Link href="https://teeahead.com" target="_blank" className="text-xs font-bold text-[#1B4332] hover:underline">
          TeeAhead
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run tests — verify they pass**

```bash
npx vitest run src/test/public-booking-page.test.tsx 2>&1 | tail -15
```

Expected: `PASS` — all 5 tests green.

- [ ] **Step 3: Commit**

```bash
git add src/app/book/[slug]/PublicTeeTimeGrid.tsx src/test/public-booking-page.test.tsx
git commit -m "feat: add PublicTeeTimeGrid component with date nav and filters"
```

---

## Task 4: Build the public booking page server component

**Files:**
- Create: `src/app/book/[slug]/page.tsx`

- [ ] **Step 1: Create `page.tsx`**

```tsx
// src/app/book/[slug]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { PublicTeeTimeGrid } from './PublicTeeTimeGrid'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: course } = await supabase.from('courses').select('name').eq('slug', slug).single()
  return {
    title: course ? `Book Tee Times at ${course.name} | TeeAhead` : 'Book Tee Times | TeeAhead',
  }
}

export default async function PublicBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ date?: string }>
}) {
  const { slug } = await params
  const { date: dateParam } = await searchParams
  const supabase = await createClient()

  const { data: course } = await supabase
    .from('courses')
    .select('id, name, city, state, slug')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (!course) notFound()

  const selectedDate = dateParam ?? new Date().toISOString().split('T')[0]
  const startOfDay = `${selectedDate}T00:00:00+00:00`
  const endOfDay = `${selectedDate}T23:59:59+00:00`

  const { data: teeTimes } = await supabase
    .from('tee_times')
    .select('id, scheduled_at, available_players, base_price')
    .eq('course_id', course.id)
    .eq('status', 'open')
    .gt('available_players', 0)
    .gte('scheduled_at', startOfDay)
    .lte('scheduled_at', endOfDay)
    .order('scheduled_at')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Minimal header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link href="https://teeahead.com" target="_blank" className="flex items-center gap-2">
          <Image src="/logo.png" alt="TeeAhead" width={28} height={28} />
          <span className="font-bold text-[#1B4332] text-sm">TeeAhead</span>
        </Link>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">{course.name}</p>
          {course.city && (
            <p className="text-xs text-gray-500">{course.city}, {course.state}</p>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <PublicTeeTimeGrid
          teeTimes={teeTimes ?? []}
          courseName={course.name}
          courseSlug={slug}
          selectedDate={selectedDate}
        />
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Start dev server and manually visit `/book/bay-pointe` (or any active course slug)**

```bash
npm run dev
```

Open: `http://localhost:3000/book/<any-active-slug>`

Verify:
- Course name appears in header
- Tee time cards render with prices
- Date navigation works (← →)
- "Book Now" opens `/app/book/[id]` in a new tab
- Filters work

- [ ] **Step 3: Commit**

```bash
git add src/app/book/
git commit -m "feat: public booking page at /book/[slug]"
```

---

## Task 5: Build `widget.js`

**Files:**
- Create: `public/widget.js`

This script is what courses paste into their website. It reads the `data-course` attribute off the `<script>` tag and replaces itself with an iframe pointing at `/book/[slug]`.

- [ ] **Step 1: Create `public/widget.js`**

```js
// public/widget.js
(function () {
  var script = document.currentScript;
  if (!script) return;

  var course = script.getAttribute('data-course');
  if (!course) {
    console.warn('[TeeAhead] Missing data-course attribute on widget script tag.');
    return;
  }

  var iframe = document.createElement('iframe');
  iframe.src = 'https://app.teeahead.com/book/' + encodeURIComponent(course);
  iframe.style.cssText = 'width:100%;height:680px;border:none;display:block;border-radius:12px;';
  iframe.setAttribute('frameborder', '0');
  iframe.setAttribute('scrolling', 'yes');
  iframe.setAttribute('title', 'Book Tee Times');

  script.parentNode.replaceChild(iframe, script);
})();
```

- [ ] **Step 2: Verify it is served as a static file**

```bash
curl -I http://localhost:3000/widget.js 2>&1 | grep -E "HTTP|content-type"
```

Expected: `HTTP/1.1 200 OK` and `content-type: application/javascript`

- [ ] **Step 3: Manually test embed in a local HTML file**

Create `/tmp/widget-test.html`:

```html
<!DOCTYPE html>
<html>
<body>
  <h1>Bay Pointe Golf Club</h1>
  <p>Book your tee time below:</p>
  <script src="http://localhost:3000/widget.js" data-course="bay-pointe"></script>
</body>
</html>
```

Open in browser. Verify the iframe renders the booking page at the correct URL.

- [ ] **Step 4: Commit**

```bash
git add public/widget.js
git commit -m "feat: add widget.js for iframe embed on course websites"
```

---

## Task 6: Build the course portal Install page

**Files:**
- Create: `src/app/course/[slug]/install/page.tsx`
- Modify: `src/app/course/[slug]/layout.tsx`

This page lives inside the course portal (already auth-protected by the layout) and gives course staff everything they need to integrate TeeAhead on their website.

- [ ] **Step 1: Create `src/app/course/[slug]/install/page.tsx`**

```tsx
// src/app/course/[slug]/install/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PlatformInstallGuide from '@/components/onboarding/PlatformInstallGuide'

export default async function InstallPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: course } = await supabase
    .from('courses')
    .select('id, name, slug')
    .eq('slug', slug)
    .single()

  if (!course) notFound()

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Website Integration</h1>
        <p className="text-sm text-gray-500 mt-1">
          Add TeeAhead booking to your website in minutes. Choose your platform below.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <PlatformInstallGuide courseSlug={course.slug} />
      </div>

      <div className="bg-[#F0F9E8] border border-[#C3E6A0] rounded-xl p-5">
        <p className="text-sm font-medium text-[#1B4332]">Need help setting this up?</p>
        <p className="text-sm text-[#3B6D11] mt-1">
          We'll do it for you on a 15-minute screen share — no technical knowledge needed.
        </p>
        <a
          href="https://cal.com/teeahead/widget-setup"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-sm font-semibold text-[#1B4332] underline hover:no-underline"
        >
          Book a free setup call →
        </a>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add "Install" to the course portal nav in `layout.tsx`**

In `src/app/course/[slug]/layout.tsx`, add the Install nav item to `allNavItems` after Settings:

```ts
// Add after the existing Settings entry:
{ href: `/course/${slug}/install`, label: 'Install', managerOnly: true },
```

Full updated `allNavItems` array:

```ts
const allNavItems = [
  { href: `/course/${slug}`,           label: 'Tee Sheet', managerOnly: false },
  { href: `/course/${slug}/check-in`,  label: 'Check-in',  managerOnly: false },
  { href: `/course/${slug}/bookings`,  label: 'Bookings',  managerOnly: false },
  { href: `/course/${slug}/members`,   label: 'Members',   managerOnly: false },
  { href: `/course/${slug}/payments`,  label: 'Payments',  managerOnly: true },
  { href: `/course/${slug}/dashboard`, label: 'Dashboard', managerOnly: true },
  { href: `/course/${slug}/reports`,   label: 'Reports',   managerOnly: true },
  { href: `/course/${slug}/leagues`,   label: 'Leagues',   managerOnly: true },
  { href: `/course/${slug}/billing`,   label: 'Billing',   managerOnly: true },
  { href: `/course/${slug}/settings`,  label: 'Settings',  managerOnly: true },
  { href: `/course/${slug}/install`,   label: 'Install',   managerOnly: true },
]
```

- [ ] **Step 3: Verify in browser**

Navigate to `http://localhost:3000/course/<slug>/install` while logged in as a manager.

Verify:
- "Install" tab appears in the course portal nav
- Platform picker works (WordPress / Squarespace / Wix / Webflow / No website)
- Copy buttons work for embed snippet and course ID
- Booking URL shown for "No website" option matches `teeahead.com/book/<slug>`

- [ ] **Step 4: Run full test suite**

```bash
npx vitest run 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/course/[slug]/install/ src/app/course/[slug]/layout.tsx
git commit -m "feat: course portal Install page with embed code and platform instructions"
```

---

## Self-Review

### Spec coverage
| Requirement | Task |
|-------------|------|
| Public booking page (hosted URL courses can share) | Task 4 |
| Tee time cards with price, filters, date nav | Task 3 |
| `widget.js` embeddable on course websites | Task 5 |
| iframe X-Frame-Options fixed | Task 1 |
| Course portal Install page | Task 6 |
| Platform-specific instructions (WordPress, Squarespace, Wix, Webflow) | Task 6 (reuses `PlatformInstallGuide`) |
| "Book a setup call" link | Tasks 5 & 6 |
| Tests | Task 2 & 3 |

### Notes
- **Timezone:** `TZ = 'America/Detroit'` matches the existing `TeeTimeSearch` component — keep consistent.
- **`widget.js` prod URL:** The embed snippet in `PlatformInstallGuide` already uses `https://app.teeahead.com/widget.js` — once this file is merged to main and deployed, it will be live at that URL automatically (Vercel serves `public/` statically).
- **Auth:** The `/book/[slug]` page uses `createClient()` but does NOT gate on auth — it queries publicly available tee time data. "Book Now" opens `/app/book/[id]` in a new tab which handles the auth redirect naturally.

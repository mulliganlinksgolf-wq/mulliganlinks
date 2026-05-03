# Admin Portal — Plan 3: Analytics Dashboard + Dispute Management

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the basic admin dashboard with a full analytics view (stat cards, charts, recent signups, time filter) and build the dispute management page with urgency banners, deadline color-coding, inline detail panel, and admin actions.

**Architecture:** Analytics data is computed server-side from `memberships`, `profiles`, `bookings` — no external service. Charts render client-side with `recharts` wrapped in `'use client'` components. The dispute list is a server component + client interactivity layer; dispute status updates go through server actions that write to both `payment_disputes` and `admin_audit_log`. The dispute timeline reads from `admin_audit_log` filtered by dispute target_id.

**Tech Stack:** Next.js 16.2.4 App Router, Supabase (service-role), recharts, Vitest + @testing-library/react, Tailwind CSS v4

> **Before writing any Next.js code:** `params` and `searchParams` are `Promise<{...}>` in Next.js 16 — always `await` them.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `src/app/admin/page.tsx` | Full analytics dashboard |
| Create | `src/lib/analytics.ts` | Server-side data helpers (MRR, members, churn) |
| Create | `src/components/admin/AnalyticsStatCards.tsx` | 4 stat cards with delta |
| Create | `src/components/admin/AnalyticsCharts.tsx` | recharts client component — 4 charts |
| Create | `src/components/admin/AnalyticsTimeFilter.tsx` | 7d/30d/90d/1yr filter (URL params) |
| Create | `src/components/admin/RecentSignupsTable.tsx` | Recent signups table |
| Create | `src/app/admin/disputes/page.tsx` | Dispute list page |
| Create | `src/app/admin/disputes/actions.ts` | markWon, markLost, addDisputeNote server actions |
| Create | `src/components/admin/DisputeList.tsx` | Client component: filter tabs + table + detail panel |
| Create | `src/components/admin/DisputeDetailPanel.tsx` | Inline detail view for one dispute |
| Create | `src/test/analytics.test.ts` | Unit tests for analytics helpers |
| Create | `src/test/analytics-stat-cards.test.tsx` | Stat card component tests |
| Create | `src/test/dispute-actions.test.ts` | Server action unit tests |
| Create | `src/test/dispute-list.test.tsx` | DisputeList component tests |

---

## Pricing constants (used in MRR calculations)

The `site_config` table has: `price_ace_annual=159`, `price_eagle_annual=89`. Monthly prices: Ace = $159/mo, Eagle = $89/mo, Fairway = $0.

---

## Task 1: Analytics Data Helpers

**Files:**
- Create: `src/lib/analytics.ts`
- Create: `src/test/analytics.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/test/analytics.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockAdminClient,
}))

const mockFrom = vi.fn()
const mockAdminClient = { from: mockFrom }

function makeChain(data: any) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    then: (resolve: any) => resolve({ data, error: null }),
  }
  return chain
}

import { computeAnalytics, getRecentSignups } from '@/lib/analytics'

describe('computeAnalytics', () => {
  it('calculates MRR from active memberships', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'memberships') return makeChain([
        { tier: 'ace', status: 'active', created_at: '2026-01-01' },
        { tier: 'eagle', status: 'active', created_at: '2026-01-01' },
        { tier: 'fairway', status: 'active', created_at: '2026-01-01' },
      ])
      if (table === 'bookings') return makeChain([])
      return makeChain([])
    })
    const result = await computeAnalytics('30d')
    // Ace: $159 + Eagle: $89 = $248
    expect(result.mrr).toBe(248)
  })

  it('calculates total member count', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'memberships') return makeChain([
        { tier: 'eagle', status: 'active', created_at: '2026-01-01' },
        { tier: 'eagle', status: 'active', created_at: '2026-01-01' },
      ])
      if (table === 'bookings') return makeChain([])
      return makeChain([])
    })
    const result = await computeAnalytics('30d')
    expect(result.totalMembers).toBe(2)
  })

  it('calculates churn rate as canceled / total', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'memberships') return makeChain([
        { tier: 'ace', status: 'active', created_at: '2026-01-01' },
        { tier: 'eagle', status: 'canceled', created_at: '2026-01-01' },
        { tier: 'eagle', status: 'canceled', created_at: '2026-01-01' },
        { tier: 'fairway', status: 'active', created_at: '2026-01-01' },
      ])
      if (table === 'bookings') return makeChain([])
      return makeChain([])
    })
    const result = await computeAnalytics('30d')
    expect(result.churnRate).toBe(50) // 2/4 = 50%
  })
})

describe('getRecentSignups', () => {
  it('returns recent profiles in descending order', async () => {
    mockFrom.mockImplementation(() => makeChain([
      { id: '1', full_name: 'Alice', email: 'a@a.com', founding_member: false, created_at: '2026-04-01', memberships: [{ tier: 'eagle' }] },
    ]))
    const result = await getRecentSignups(5)
    expect(result).toHaveLength(1)
    expect(result[0].full_name).toBe('Alice')
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd /Users/barris/Desktop/MulliganLinks/.worktrees/admin-portal-analytics
npm test -- analytics.test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/lib/analytics.ts`**

```ts
import { createAdminClient } from '@/lib/supabase/admin'

// Monthly prices by tier
const TIER_PRICE: Record<string, number> = {
  ace: 159,
  eagle: 89,
  fairway: 0,
}

export interface AnalyticsResult {
  mrr: number            // dollars
  totalMembers: number
  churnRate: number      // percent 0-100
  avgRevenuePerMember: number
  tierBreakdown: { tier: string; count: number }[]
  bookingCount: number
}

export interface RecentSignup {
  id: string
  full_name: string | null
  email: string
  tier: string
  founding_member: boolean
  created_at: string
}

export async function computeAnalytics(_period: string): Promise<AnalyticsResult> {
  const admin = createAdminClient()

  const [membershipsResult, bookingsResult] = await Promise.all([
    admin.from('memberships').select('tier, status, created_at'),
    admin.from('bookings').select('id').neq('status', 'canceled'),
  ])

  const memberships = membershipsResult.data ?? []
  const active = memberships.filter(m => m.status === 'active')
  const canceled = memberships.filter(m => m.status === 'canceled')

  const mrr = active.reduce((sum, m) => sum + (TIER_PRICE[m.tier] ?? 0), 0)
  const totalMembers = memberships.length
  const churnRate = totalMembers > 0 ? Math.round((canceled.length / totalMembers) * 100) : 0
  const payingMembers = active.filter(m => m.tier !== 'fairway').length
  const avgRevenuePerMember = payingMembers > 0 ? Math.round((mrr / payingMembers) * 100) / 100 : 0

  const tierCounts = ['ace', 'eagle', 'fairway'].map(tier => ({
    tier,
    count: active.filter(m => m.tier === tier).length,
  }))

  return {
    mrr,
    totalMembers,
    churnRate,
    avgRevenuePerMember,
    tierBreakdown: tierCounts,
    bookingCount: (bookingsResult.data ?? []).length,
  }
}

export async function getRecentSignups(limit = 10): Promise<RecentSignup[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('id, full_name, email, founding_member, created_at, memberships(tier)')
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []).map((p: any) => ({
    id: p.id,
    full_name: p.full_name,
    email: p.email ?? '',
    tier: Array.isArray(p.memberships) ? (p.memberships[0]?.tier ?? 'fairway') : (p.memberships?.tier ?? 'fairway'),
    founding_member: p.founding_member,
    created_at: p.created_at,
  }))
}

// Build per-month data for the last 12 months from memberships
export function buildMrrHistory(memberships: { tier: string; status: string; created_at: string }[]): { month: string; mrr: number }[] {
  const months: { month: string; mrr: number }[] = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    // Count active memberships as of this month end (simplified: count all created before month end)
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    const activeAtMonth = memberships.filter(m =>
      new Date(m.created_at) <= monthEnd &&
      (m.status === 'active' || m.status === 'canceled')
    )
    const mrr = activeAtMonth
      .filter(m => m.status === 'active')
      .reduce((sum, m) => sum + (TIER_PRICE[m.tier] ?? 0), 0)
    months.push({ month: label, mrr })
  }
  return months
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- analytics.test
```

Expected: 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics.ts src/test/analytics.test.ts
git commit -m "feat: add analytics data helpers (MRR, members, churn, signups)"
```

---

## Task 2: Analytics Stat Cards

**Files:**
- Create: `src/components/admin/AnalyticsStatCards.tsx`
- Create: `src/test/analytics-stat-cards.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// src/test/analytics-stat-cards.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AnalyticsStatCards from '@/components/admin/AnalyticsStatCards'

const props = {
  mrr: 4876,
  totalMembers: 47,
  churnRate: 4,
  avgRevenuePerMember: 119,
}

describe('AnalyticsStatCards', () => {
  it('renders MRR in dollars', () => {
    render(<AnalyticsStatCards {...props} />)
    expect(screen.getByText('$4,876')).toBeInTheDocument()
  })

  it('renders MRR label', () => {
    render(<AnalyticsStatCards {...props} />)
    expect(screen.getByText(/monthly recurring revenue/i)).toBeInTheDocument()
  })

  it('renders total members count', () => {
    render(<AnalyticsStatCards {...props} />)
    expect(screen.getByText('47')).toBeInTheDocument()
  })

  it('renders churn rate as percentage', () => {
    render(<AnalyticsStatCards {...props} />)
    expect(screen.getByText('4%')).toBeInTheDocument()
  })

  it('renders avg revenue per member', () => {
    render(<AnalyticsStatCards {...props} />)
    expect(screen.getByText('$119')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test -- analytics-stat-cards
```

Expected: FAIL.

- [ ] **Step 3: Create component**

```tsx
// src/components/admin/AnalyticsStatCards.tsx
interface AnalyticsStatCardsProps {
  mrr: number
  totalMembers: number
  churnRate: number
  avgRevenuePerMember: number
}

export default function AnalyticsStatCards({ mrr, totalMembers, churnRate, avgRevenuePerMember }: AnalyticsStatCardsProps) {
  const cards = [
    {
      label: 'Monthly Recurring Revenue',
      value: `$${mrr.toLocaleString()}`,
      sub: 'from active paid members',
    },
    {
      label: 'Total Members',
      value: totalMembers.toLocaleString(),
      sub: 'registered accounts',
    },
    {
      label: 'Churn Rate',
      value: `${churnRate}%`,
      sub: 'canceled vs total',
    },
    {
      label: 'Avg Revenue / Member',
      value: `$${avgRevenuePerMember}`,
      sub: 'MRR ÷ paid members',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(c => (
        <div key={c.label} className="bg-white rounded-xl p-6 ring-1 ring-black/5">
          <p className="text-xs text-[#6B7770] uppercase tracking-wide font-medium">{c.label}</p>
          <p className="text-3xl font-bold mt-1 text-[#1B4332]">{c.value}</p>
          <p className="text-xs text-[#6B7770] mt-1">{c.sub}</p>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- analytics-stat-cards
```

Expected: 5 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/AnalyticsStatCards.tsx src/test/analytics-stat-cards.test.tsx
git commit -m "feat: add analytics stat cards component"
```

---

## Task 3: Analytics Charts + Time Filter

**Files:**
- Create: `src/components/admin/AnalyticsCharts.tsx`
- Create: `src/components/admin/AnalyticsTimeFilter.tsx`

Install recharts first:

- [ ] **Step 1: Install recharts**

```bash
cd /Users/barris/Desktop/MulliganLinks/.worktrees/admin-portal-analytics
npm install recharts
```

- [ ] **Step 2: Create AnalyticsTimeFilter**

```tsx
// src/components/admin/AnalyticsTimeFilter.tsx
'use client'
import { useRouter, useSearchParams } from 'next/navigation'

const PERIODS = ['7d', '30d', '90d', '1yr'] as const

export default function AnalyticsTimeFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = searchParams.get('period') ?? '30d'

  return (
    <div className="flex gap-1 rounded-lg bg-[#FAF7F2] p-1 ring-1 ring-black/5 w-fit">
      {PERIODS.map(p => (
        <button
          key={p}
          onClick={() => router.push(`/admin?period=${p}`)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            active === p
              ? 'bg-white text-[#1A1A1A] shadow-sm ring-1 ring-black/10'
              : 'text-[#6B7770] hover:text-[#1A1A1A]'
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Create AnalyticsCharts**

```tsx
// src/components/admin/AnalyticsCharts.tsx
'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'

interface MrrMonth { month: string; mrr: number }
interface TierCount { tier: string; count: number }
interface DailyCount { date: string; count: number }

interface AnalyticsChartsProps {
  mrrHistory: MrrMonth[]
  tierBreakdown: TierCount[]
  newMembersDaily: DailyCount[]
  bookingVolumeDaily: DailyCount[]
}

const TIER_COLORS: Record<string, string> = {
  ace: '#1B4332',
  eagle: '#E0A800',
  fairway: '#CBD5E1',
}

const CHART_STYLE = { fontSize: 11, fill: '#6B7770' }

export default function AnalyticsCharts({ mrrHistory, tierBreakdown, newMembersDaily, bookingVolumeDaily }: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* MRR Growth */}
      <div className="bg-white rounded-xl ring-1 ring-black/5 p-5">
        <h3 className="font-semibold text-sm text-[#1A1A1A] mb-4">MRR Growth</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={mrrHistory} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="month" tick={CHART_STYLE} tickLine={false} axisLine={false} />
            <YAxis tick={CHART_STYLE} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip formatter={(v: number) => [`$${v}`, 'MRR']} />
            <Bar dataKey="mrr" fill="#1B4332" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tier Breakdown */}
      <div className="bg-white rounded-xl ring-1 ring-black/5 p-5">
        <h3 className="font-semibold text-sm text-[#1A1A1A] mb-4">Tier Breakdown</h3>
        {tierBreakdown.every(t => t.count === 0) ? (
          <p className="text-sm text-[#6B7770] mt-8 text-center">No active members yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={tierBreakdown} dataKey="count" nameKey="tier" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                {tierBreakdown.map(entry => (
                  <Cell key={entry.tier} fill={TIER_COLORS[entry.tier] ?? '#94A3B8'} />
                ))}
              </Pie>
              <Legend formatter={(v: string) => <span className="capitalize text-xs">{v}</span>} />
              <Tooltip formatter={(v: number, name: string) => [v, name]} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* New Members */}
      <div className="bg-white rounded-xl ring-1 ring-black/5 p-5">
        <h3 className="font-semibold text-sm text-[#1A1A1A] mb-4">New Members</h3>
        {newMembersDaily.length === 0 ? (
          <p className="text-sm text-[#6B7770] mt-8 text-center">No signups in this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={newMembersDaily} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={CHART_STYLE} tickLine={false} axisLine={false} />
              <YAxis tick={CHART_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#1B4332" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Booking Volume */}
      <div className="bg-white rounded-xl ring-1 ring-black/5 p-5">
        <h3 className="font-semibold text-sm text-[#1A1A1A] mb-4">Booking Volume</h3>
        {bookingVolumeDaily.length === 0 ? (
          <p className="text-sm text-[#6B7770] mt-8 text-center">No bookings in this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={bookingVolumeDaily} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={CHART_STYLE} tickLine={false} axisLine={false} />
              <YAxis tick={CHART_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#E0A800" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run full test suite to make sure nothing broke**

```bash
npm test
```

Expected: all tests pass (recharts components are client-only so no test needed for charts themselves).

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/AnalyticsCharts.tsx src/components/admin/AnalyticsTimeFilter.tsx package.json package-lock.json
git commit -m "feat: add analytics charts and time filter (recharts)"
```

---

## Task 4: Rewire Admin Dashboard Page

**Files:**
- Modify: `src/app/admin/page.tsx`

Replace the existing dashboard with the new analytics layout. The page keeps its server-component nature — it fetches all data and passes to client chart/filter components.

- [ ] **Step 1: Replace `src/app/admin/page.tsx`**

```tsx
import { createAdminClient } from '@/lib/supabase/admin'
import { computeAnalytics, getRecentSignups, buildMrrHistory } from '@/lib/analytics'
import AnalyticsStatCards from '@/components/admin/AnalyticsStatCards'
import AnalyticsCharts from '@/components/admin/AnalyticsCharts'
import AnalyticsTimeFilter from '@/components/admin/AnalyticsTimeFilter'
import LaunchModeBanner from '@/components/admin/LaunchModeBanner'
import { isLiveMode } from '@/lib/site-config'
import { Suspense } from 'react'

export const metadata = { title: 'Admin Dashboard' }

function buildDailyBuckets(
  rows: { created_at: string }[],
  days: number
): { date: string; count: number }[] {
  const buckets: Record<string, number> = {}
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    buckets[key] = 0
  }
  for (const row of rows) {
    const key = new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (key in buckets) buckets[key]++
  }
  return Object.entries(buckets).map(([date, count]) => ({ date, count }))
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const { period = '30d' } = await searchParams
  const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '1yr' ? 365 : 30

  const admin = createAdminClient()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  const [analytics, recentSignups, liveMode, membershipsAll, recentBookings, recentProfiles] = await Promise.all([
    computeAnalytics(period),
    getRecentSignups(10),
    isLiveMode(),
    admin.from('memberships').select('tier, status, created_at'),
    admin.from('bookings').select('created_at').neq('status', 'canceled').gte('created_at', cutoff.toISOString()),
    admin.from('profiles').select('created_at').gte('created_at', cutoff.toISOString()),
  ])

  const mrrHistory = buildMrrHistory(membershipsAll.data ?? [])
  const newMembersDaily = buildDailyBuckets(recentProfiles.data ?? [], days > 90 ? 52 : 30)
  const bookingVolumeDaily = buildDailyBuckets(recentBookings.data ?? [], days > 90 ? 52 : 30)

  const tierColor: Record<string, string> = {
    ace: 'bg-[#1B4332] text-[#FAF7F2]',
    eagle: 'bg-[#E0A800] text-[#1A1A1A]',
    fairway: 'bg-[#FAF7F2] text-[#1A1A1A] ring-1 ring-black/10',
  }

  return (
    <div className="space-y-8">
      <LaunchModeBanner isLive={liveMode} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Dashboard</h1>
          <p className="text-[#6B7770] text-sm mt-1">TeeAhead at a glance</p>
        </div>
        <Suspense>
          <AnalyticsTimeFilter />
        </Suspense>
      </div>

      <AnalyticsStatCards
        mrr={analytics.mrr}
        totalMembers={analytics.totalMembers}
        churnRate={analytics.churnRate}
        avgRevenuePerMember={analytics.avgRevenuePerMember}
      />

      <AnalyticsCharts
        mrrHistory={mrrHistory}
        tierBreakdown={analytics.tierBreakdown}
        newMembersDaily={newMembersDaily}
        bookingVolumeDaily={bookingVolumeDaily}
      />

      {/* Recent Signups */}
      <div className="bg-white rounded-xl ring-1 ring-black/5 p-6">
        <h2 className="font-bold text-[#1A1A1A] mb-4">Recent Signups</h2>
        {recentSignups.length === 0 ? (
          <p className="text-sm text-[#6B7770]">No signups yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-[#6B7770] border-b border-black/5">
              <tr>
                <th className="text-left pb-2 font-medium">Name</th>
                <th className="text-left pb-2 font-medium">Email</th>
                <th className="text-left pb-2 font-medium">Tier</th>
                <th className="text-left pb-2 font-medium">Joined</th>
                <th className="text-left pb-2 font-medium">Founding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {recentSignups.map(s => (
                <tr key={s.id}>
                  <td className="py-2.5 font-medium text-[#1A1A1A]">{s.full_name || '—'}</td>
                  <td className="py-2.5 text-[#6B7770]">{s.email}</td>
                  <td className="py-2.5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${tierColor[s.tier] ?? tierColor.fairway}`}>
                      {s.tier}
                    </span>
                  </td>
                  <td className="py-2.5 text-[#6B7770]">
                    {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="py-2.5 text-[#6B7770] text-xs">
                    {s.founding_member ? '★' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run full test suite**

```bash
npm test
```

Expected: all tests pass. The existing `admin-dashboard-banner.test.tsx` may need a small update if it tests the old page — check and fix if needed.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat: rewire admin dashboard to analytics layout"
```

---

## Task 5: Dispute Server Actions

**Files:**
- Create: `src/app/admin/disputes/actions.ts`
- Create: `src/test/dispute-actions.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/test/dispute-actions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockUpdate = vi.fn().mockReturnThis()
const mockEq = vi.fn().mockResolvedValue({ error: null })
const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockSelect = vi.fn().mockReturnThis()
const mockSingle = vi.fn().mockResolvedValue({
  data: { id: 'd-1', stripe_dispute_id: 'dp_abc', amount_cents: 7900, reason: 'fraudulent', status: 'open', evidence_due_by: null },
  error: null,
})

const mockAdminClient = {
  from: vi.fn(() => ({ update: mockUpdate, eq: mockEq, insert: mockInsert, select: mockSelect, single: mockSingle })),
}

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => mockAdminClient }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'admin-1', email: 'nbarris11@gmail.com' } } }) },
  }),
}))
vi.mock('@/lib/audit', () => ({ writeAuditLog: vi.fn().mockResolvedValue(undefined) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { markDisputeWon, markDisputeLost, addDisputeNote } from '@/app/admin/disputes/actions'
import { writeAuditLog } from '@/lib/audit'

describe('markDisputeWon', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates status to won and writes audit log', async () => {
    mockUpdate.mockReturnThis()
    mockEq.mockResolvedValue({ error: null })
    const result = await markDisputeWon('d-1', 'dp_abc')
    expect(result.success).toBe(true)
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'dispute_updated', targetType: 'dispute' })
    )
  })
})

describe('markDisputeLost', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates status to lost and writes audit log', async () => {
    mockUpdate.mockReturnThis()
    mockEq.mockResolvedValue({ error: null })
    const result = await markDisputeLost('d-1', 'dp_abc')
    expect(result.success).toBe(true)
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'dispute_updated', targetType: 'dispute' })
    )
  })
})

describe('addDisputeNote', () => {
  beforeEach(() => vi.clearAllMocks())

  it('writes note to audit log', async () => {
    const formData = new FormData()
    formData.set('disputeId', 'd-1')
    formData.set('stripeDisputeId', 'dp_abc')
    formData.set('note', 'Called the bank.')
    const result = await addDisputeNote({}, formData)
    expect(result.success).toBe(true)
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'dispute_updated', details: expect.objectContaining({ note: 'Called the bank.' }) })
    )
  })

  it('returns error when note is empty', async () => {
    const formData = new FormData()
    formData.set('disputeId', 'd-1')
    formData.set('stripeDisputeId', 'dp_abc')
    formData.set('note', '  ')
    const result = await addDisputeNote({}, formData)
    expect(result.error).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test -- dispute-actions
```

Expected: FAIL.

- [ ] **Step 3: Create `src/app/admin/disputes/actions.ts`**

```ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit'
import { revalidatePath } from 'next/cache'

const ADMIN_EMAILS = ['mulliganlinksgolf@gmail.com', 'nbarris11@gmail.com', 'beslock@yahoo.com']

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!ADMIN_EMAILS.includes(user.email ?? '') && !profile?.is_admin) throw new Error('Not authorized')
  return { admin, user }
}

export async function markDisputeWon(
  disputeId: string,
  stripeDisputeId: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    const { admin, user } = await assertAdmin()
    const { error } = await admin.from('payment_disputes')
      .update({ status: 'won', outcome: 'won', resolved_at: new Date().toISOString() })
      .eq('id', disputeId)
    if (error) return { error: error.message }

    await writeAuditLog({
      eventType: 'dispute_updated',
      targetType: 'dispute',
      targetId: stripeDisputeId,
      targetLabel: `Dispute ${stripeDisputeId}`,
      details: { action: 'marked_won', by: user.email },
    })
    revalidatePath('/admin/disputes')
    return { success: true }
  } catch (e: any) {
    return { error: e.message ?? 'Something went wrong.' }
  }
}

export async function markDisputeLost(
  disputeId: string,
  stripeDisputeId: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    const { admin, user } = await assertAdmin()
    const { error } = await admin.from('payment_disputes')
      .update({ status: 'lost', outcome: 'lost', resolved_at: new Date().toISOString() })
      .eq('id', disputeId)
    if (error) return { error: error.message }

    await writeAuditLog({
      eventType: 'dispute_updated',
      targetType: 'dispute',
      targetId: stripeDisputeId,
      targetLabel: `Dispute ${stripeDisputeId}`,
      details: { action: 'marked_lost', by: user.email },
    })
    revalidatePath('/admin/disputes')
    return { success: true }
  } catch (e: any) {
    return { error: e.message ?? 'Something went wrong.' }
  }
}

export async function addDisputeNote(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const { user } = await assertAdmin()
    const disputeId = formData.get('disputeId') as string
    const stripeDisputeId = formData.get('stripeDisputeId') as string
    const note = (formData.get('note') as string).trim()
    if (!note) return { error: 'Note cannot be empty.' }

    await writeAuditLog({
      eventType: 'dispute_updated',
      targetType: 'dispute',
      targetId: stripeDisputeId,
      targetLabel: `Dispute ${stripeDisputeId}`,
      details: { action: 'note_added', note, by: user.email, dispute_row_id: disputeId },
    })
    revalidatePath('/admin/disputes')
    return { success: true }
  } catch (e: any) {
    return { error: e.message ?? 'Something went wrong.' }
  }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- dispute-actions
```

Expected: 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/disputes/actions.ts src/test/dispute-actions.test.ts
git commit -m "feat: add dispute server actions (mark won/lost, add note)"
```

---

## Task 6: Dispute List Page + Components

**Files:**
- Create: `src/app/admin/disputes/page.tsx`
- Create: `src/components/admin/DisputeList.tsx`
- Create: `src/components/admin/DisputeDetailPanel.tsx`
- Create: `src/test/dispute-list.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// src/test/dispute-list.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@/app/admin/disputes/actions', () => ({
  markDisputeWon: vi.fn().mockResolvedValue({ success: true }),
  markDisputeLost: vi.fn().mockResolvedValue({ success: true }),
  addDisputeNote: vi.fn().mockResolvedValue({ success: true }),
}))

import DisputeList from '@/components/admin/DisputeList'

const baseDispute = {
  id: 'd-1',
  stripe_dispute_id: 'dp_abc123',
  amount_cents: 7900,
  reason: 'fraudulent',
  status: 'open',
  evidence_due_by: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days from now
  created_at: '2026-04-01T00:00:00Z',
  resolved_at: null,
  member_name: 'Dave R.',
  member_email: 'dave@example.com',
  timeline: [],
}

describe('DisputeList', () => {
  it('renders dispute amount', () => {
    render(<DisputeList disputes={[baseDispute]} />)
    expect(screen.getByText('$79.00')).toBeInTheDocument()
  })

  it('renders member name', () => {
    render(<DisputeList disputes={[baseDispute]} />)
    expect(screen.getByText('Dave R.')).toBeInTheDocument()
  })

  it('renders filter tabs', () => {
    render(<DisputeList disputes={[baseDispute]} />)
    expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /open/i })).toBeInTheDocument()
  })

  it('shows urgent banner when deadline ≤ 3 days', () => {
    const urgent = { ...baseDispute, evidence_due_by: new Date(Date.now() + 86400000 * 2).toISOString() }
    render(<DisputeList disputes={[urgent]} />)
    expect(screen.getByText(/urgent/i)).toBeInTheDocument()
  })

  it('does not show urgent banner when deadline > 3 days', () => {
    render(<DisputeList disputes={[baseDispute]} />)
    expect(screen.queryByText(/urgent/i)).not.toBeInTheDocument()
  })

  it('opens detail panel on View click', () => {
    render(<DisputeList disputes={[baseDispute]} />)
    fireEvent.click(screen.getByRole('button', { name: /view/i }))
    expect(screen.getByText('dp_abc123')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test -- dispute-list
```

Expected: FAIL.

- [ ] **Step 3: Create `src/components/admin/DisputeDetailPanel.tsx`**

```tsx
'use client'
import { useActionState, useTransition } from 'react'
import { markDisputeWon, markDisputeLost, addDisputeNote } from '@/app/admin/disputes/actions'

export interface DisputeRow {
  id: string
  stripe_dispute_id: string
  amount_cents: number
  reason: string | null
  status: string
  evidence_due_by: string | null
  created_at: string
  resolved_at: string | null
  member_name: string | null
  member_email: string | null
  timeline: { event_type: string; created_at: string; details: any }[]
}

interface DisputeDetailPanelProps {
  dispute: DisputeRow
  onClose: () => void
}

export default function DisputeDetailPanel({ dispute, onClose }: DisputeDetailPanelProps) {
  const [noteState, noteAction, notePending] = useActionState(addDisputeNote, {})
  const [pending, startTransition] = useTransition()

  function handleWon() {
    startTransition(async () => {
      await markDisputeWon(dispute.id, dispute.stripe_dispute_id)
      onClose()
    })
  }

  function handleLost() {
    startTransition(async () => {
      await markDisputeLost(dispute.id, dispute.stripe_dispute_id)
      onClose()
    })
  }

  const isResolved = dispute.status === 'won' || dispute.status === 'lost'

  return (
    <div className="border border-black/8 rounded-xl p-5 bg-[#FAF7F2] space-y-5">
      <div className="flex items-start justify-between">
        <h3 className="font-bold text-[#1A1A1A]">Dispute Details</h3>
        <button onClick={onClose} className="text-sm text-[#6B7770] hover:text-[#1A1A1A]">✕ Close</button>
      </div>

      <dl className="grid grid-cols-2 gap-y-2 text-sm">
        {[
          { label: 'Stripe Dispute ID', value: dispute.stripe_dispute_id },
          { label: 'Amount', value: `$${(dispute.amount_cents / 100).toFixed(2)}` },
          { label: 'Reason', value: dispute.reason ?? '—' },
          { label: 'Status', value: <span className="capitalize">{dispute.status}</span> },
          { label: 'Opened', value: new Date(dispute.created_at).toLocaleDateString() },
          { label: 'Evidence Due', value: dispute.evidence_due_by ? new Date(dispute.evidence_due_by).toLocaleDateString() : '—' },
          { label: 'Member', value: dispute.member_name ?? dispute.member_email ?? '—' },
        ].map(({ label, value }) => (
          <>
            <dt key={label + 'dt'} className="text-[#6B7770]">{label}</dt>
            <dd key={label + 'dd'} className="font-medium text-[#1A1A1A]">{value}</dd>
          </>
        ))}
      </dl>

      {/* Timeline */}
      {dispute.timeline.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-[#6B7770] mb-2">Timeline</h4>
          <div className="space-y-2">
            {dispute.timeline.map((e, i) => (
              <div key={i} className="flex gap-2 text-xs">
                <span className="text-[#6B7770]">{new Date(e.created_at).toLocaleDateString()}</span>
                <span className="text-[#1A1A1A] capitalize">{e.event_type.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-black/8">
        <a
          href={`https://dashboard.stripe.com/disputes/${dispute.stripe_dispute_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-medium hover:bg-[#FAF7F2] transition-colors"
        >
          Open in Stripe ↗
        </a>
        {!isResolved && (
          <>
            <button
              onClick={handleWon}
              disabled={pending}
              className="rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              Mark Won
            </button>
            <button
              onClick={handleLost}
              disabled={pending}
              className="rounded-lg bg-red-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-red-700 disabled:opacity-50"
            >
              Mark Lost
            </button>
          </>
        )}
      </div>

      {/* Add Note */}
      {!isResolved && (
        <form action={noteAction} className="space-y-2">
          <input type="hidden" name="disputeId" value={dispute.id} />
          <input type="hidden" name="stripeDisputeId" value={dispute.stripe_dispute_id} />
          <textarea
            name="note"
            placeholder="Add a note…"
            rows={2}
            className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm resize-none focus:outline-none bg-white"
          />
          {noteState.error && <p className="text-red-600 text-xs">{noteState.error}</p>}
          {noteState.success && <p className="text-emerald-600 text-xs">Note saved.</p>}
          <button type="submit" disabled={notePending} className="rounded-lg bg-[#1B4332] text-white px-3 py-1.5 text-xs font-medium disabled:opacity-50">
            {notePending ? 'Saving…' : 'Save Note'}
          </button>
        </form>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create `src/components/admin/DisputeList.tsx`**

```tsx
'use client'
import { useState } from 'react'
import DisputeDetailPanel, { type DisputeRow } from '@/components/admin/DisputeDetailPanel'

const TABS = ['All', 'Open', 'Under Review', 'Won', 'Lost'] as const
type Tab = typeof TABS[number]

const STATUS_MAP: Record<Tab, string | null> = {
  All: null,
  Open: 'open',
  'Under Review': 'under_review',
  Won: 'won',
  Lost: 'lost',
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

function deadlineClass(days: number | null): string {
  if (days === null) return 'text-[#6B7770]'
  if (days <= 3) return 'text-red-600 font-semibold'
  if (days <= 10) return 'text-amber-600'
  return 'text-[#6B7770]'
}

interface DisputeListProps {
  disputes: DisputeRow[]
}

export default function DisputeList({ disputes }: DisputeListProps) {
  const [activeTab, setActiveTab] = useState<Tab>('All')
  const [selected, setSelected] = useState<DisputeRow | null>(null)

  const urgent = disputes.filter(d => {
    const days = daysUntil(d.evidence_due_by)
    return days !== null && days <= 3 && d.status === 'open'
  })

  const filtered = activeTab === 'All'
    ? disputes
    : disputes.filter(d => d.status === STATUS_MAP[activeTab])

  const tabCount = (tab: Tab) => tab === 'All'
    ? disputes.length
    : disputes.filter(d => d.status === STATUS_MAP[tab]).length

  return (
    <div className="space-y-4">
      {/* Urgent banner */}
      {urgent.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span className="text-base">⏰</span>
          <strong>Urgent:</strong> {urgent.length} open dispute{urgent.length !== 1 ? 's' : ''} with evidence deadline in ≤ 3 days.
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-black/5">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSelected(null) }}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-[#1B4332] text-[#1B4332]'
                : 'border-transparent text-[#6B7770] hover:text-[#1A1A1A]'
            }`}
          >
            {tab}
            <span className="ml-1.5 text-xs text-[#6B7770]">({tabCount(tab)})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="text-sm text-[#6B7770] py-4">No disputes in this category.</p>
      ) : (
        <div className="bg-white rounded-xl ring-1 ring-black/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#FAF7F2] text-[#6B7770] border-b border-black/5">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Dispute ID</th>
                <th className="text-left px-4 py-3 font-medium">Member</th>
                <th className="text-right px-4 py-3 font-medium">Amount</th>
                <th className="text-left px-4 py-3 font-medium">Reason</th>
                <th className="text-left px-4 py-3 font-medium">Evidence Deadline</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filtered.map(d => {
                const days = daysUntil(d.evidence_due_by)
                return (
                  <tr key={d.id} className={selected?.id === d.id ? 'bg-[#FAF7F2]/60' : 'hover:bg-[#FAF7F2]/40'}>
                    <td className="px-4 py-3 font-mono text-xs text-[#6B7770]">…{d.stripe_dispute_id.slice(-8)}</td>
                    <td className="px-4 py-3">{d.member_name ?? d.member_email ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-medium">${(d.amount_cents / 100).toFixed(2)}</td>
                    <td className="px-4 py-3 capitalize text-[#6B7770]">{d.reason?.replace('_', ' ') ?? '—'}</td>
                    <td className={`px-4 py-3 ${deadlineClass(days)}`}>
                      {d.evidence_due_by
                        ? <>
                            {days !== null && days <= 3 && <span className="mr-1">⏰</span>}
                            {new Date(d.evidence_due_by).toLocaleDateString()}
                            {days !== null && ` (${days}d)`}
                          </>
                        : '—'}
                    </td>
                    <td className="px-4 py-3 capitalize text-[#6B7770]">{d.status.replace('_', ' ')}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelected(selected?.id === d.id ? null : d)}
                        className="rounded border border-black/15 px-2.5 py-1 text-xs font-medium hover:bg-[#FAF7F2] transition-colors"
                      >
                        {selected?.id === d.id ? 'Close' : 'View'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <DisputeDetailPanel dispute={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
```

- [ ] **Step 5: Create `src/app/admin/disputes/page.tsx`**

```tsx
import { createAdminClient } from '@/lib/supabase/admin'
import DisputeList, { type DisputeRow } from '@/components/admin/DisputeList'

export const metadata = { title: 'Disputes' }

export default async function DisputesPage() {
  const admin = createAdminClient()

  const [disputesResult, auditResult] = await Promise.all([
    admin.from('payment_disputes')
      .select('id, stripe_dispute_id, amount_cents, reason, status, evidence_due_by, created_at, resolved_at, booking_id')
      .order('created_at', { ascending: false }),
    admin.from('admin_audit_log')
      .select('target_id, event_type, created_at, details')
      .eq('target_type', 'dispute')
      .order('created_at', { ascending: false }),
  ])

  const disputes = disputesResult.data ?? []
  const auditRows = auditResult.data ?? []

  // Enrich disputes with member info via booking_id
  const bookingIds = disputes.map(d => d.booking_id).filter(Boolean)
  let memberMap: Record<string, { name: string | null; email: string | null }> = {}

  if (bookingIds.length > 0) {
    const { data: bookings } = await admin
      .from('bookings')
      .select('id, user_id, profiles(full_name, email)')
      .in('id', bookingIds)

    for (const b of bookings ?? []) {
      memberMap[b.id] = {
        name: (b as any).profiles?.full_name ?? null,
        email: (b as any).profiles?.email ?? null,
      }
    }
  }

  const rows: DisputeRow[] = disputes.map(d => ({
    id: d.id,
    stripe_dispute_id: d.stripe_dispute_id ?? '',
    amount_cents: d.amount_cents ?? 0,
    reason: d.reason,
    status: d.status ?? 'open',
    evidence_due_by: d.evidence_due_by,
    created_at: d.created_at,
    resolved_at: d.resolved_at,
    member_name: d.booking_id ? (memberMap[d.booking_id]?.name ?? null) : null,
    member_email: d.booking_id ? (memberMap[d.booking_id]?.email ?? null) : null,
    timeline: auditRows
      .filter(a => a.target_id === (d.stripe_dispute_id ?? d.id))
      .map(a => ({ event_type: a.event_type, created_at: a.created_at, details: a.details })),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Disputes</h1>
        <p className="text-[#6B7770] text-sm mt-1">{rows.length} total dispute{rows.length !== 1 ? 's' : ''}</p>
      </div>
      <DisputeList disputes={rows} />
    </div>
  )
}
```

- [ ] **Step 6: Run tests — verify they pass**

```bash
npm test -- dispute-list
```

Expected: 6 tests passing.

- [ ] **Step 7: Run full suite**

```bash
npm test
```

All tests must pass. Fix any regressions.

- [ ] **Step 8: Commit**

```bash
git add src/app/admin/disputes/ src/components/admin/DisputeList.tsx src/components/admin/DisputeDetailPanel.tsx src/test/dispute-list.test.tsx
git commit -m "feat: add dispute management page with filter tabs, urgency banner, detail panel"
```

---

## Task 7: Full Test Run + Merge

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: all tests pass (190+).

- [ ] **Step 2: Verify git log**

```bash
git log --oneline -10
```

All Plan 3 commits should be present.

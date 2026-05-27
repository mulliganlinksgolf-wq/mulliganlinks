# Course Reports — 5 New Report Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 5 new standalone report pages (Tee Sheet Utilization, Member Loyalty, Guest Passes & Referrals, Comp Rounds, League Performance) to the course portal reports hub.

**Architecture:** Each report follows the existing pattern — server component page, co-located chart component, metric function in `src/lib/reports/courseMetrics.ts`, reusing `KpiTile`, `CsvExportButton`, `DateRangePicker`. Five new cards added to the reports hub page.

**Tech Stack:** Next.js App Router (server components), Supabase admin client, Recharts (bar/line charts), Tailwind CSS (heatmap), Vitest (unit tests)

---

## File Map

**New files:**
- `src/app/course/[slug]/reports/utilization/page.tsx`
- `src/app/course/[slug]/reports/utilization/UtilizationHeatmap.tsx`
- `src/app/course/[slug]/reports/loyalty/page.tsx`
- `src/app/course/[slug]/reports/loyalty/LoyaltyChart.tsx`
- `src/app/course/[slug]/reports/guests/page.tsx`
- `src/app/course/[slug]/reports/guests/GuestChart.tsx`
- `src/app/course/[slug]/reports/comps/page.tsx`
- `src/app/course/[slug]/reports/comps/CompTrendChart.tsx`
- `src/app/course/[slug]/reports/leagues/page.tsx`
- `src/test/course-reports-metrics.test.ts`

**Modified files:**
- `src/lib/reports/courseMetrics.ts` — add 5 new metric functions
- `src/app/course/[slug]/reports/page.tsx` — add 5 new hub cards

---

## Task 1: Utilization metric function

**Files:**
- Modify: `src/lib/reports/courseMetrics.ts`
- Test: `src/test/course-reports-metrics.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/test/course-reports-metrics.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  aggregateUtilizationCells,
  calcOffPeakPct,
  aggregateLoyaltyData,
  aggregateGuestData,
  aggregateCompData,
} from '@/lib/reports/courseMetrics'

// ── Utilization ────────────────────────────────────────────────────────────────

describe('aggregateUtilizationCells', () => {
  it('counts bookings per day/hour cell', () => {
    const slots = [
      { scheduled_at: '2026-05-05T14:00:00+00:00', confirmedPlayers: [2] },
      { scheduled_at: '2026-05-05T14:00:00+00:00', confirmedPlayers: [4] },
      { scheduled_at: '2026-05-06T09:00:00+00:00', confirmedPlayers: [2] },
    ]
    const cells = aggregateUtilizationCells(slots)
    const cell1 = cells.find(c => c.hourSlot === 10) // 14 UTC = ~10 EST
    expect(cell1?.count).toBeGreaterThanOrEqual(2)
  })

  it('returns empty array for no slots', () => {
    expect(aggregateUtilizationCells([])).toEqual([])
  })
})

describe('calcOffPeakPct', () => {
  it('returns 100 when all bookings are before 10am or after 3pm', () => {
    const cells = [
      { dayOfWeek: 1, hourSlot: 7, count: 10, avgParty: 2 },
      { dayOfWeek: 2, hourSlot: 16, count: 5, avgParty: 2 },
    ]
    expect(calcOffPeakPct(cells)).toBe(100)
  })

  it('returns 0 when all bookings are 10am–3pm', () => {
    const cells = [{ dayOfWeek: 1, hourSlot: 11, count: 20, avgParty: 2 }]
    expect(calcOffPeakPct(cells)).toBe(0)
  })

  it('returns 0 when cells is empty', () => {
    expect(calcOffPeakPct([])).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /Users/barris/Desktop/MulliganLinks && npx vitest run src/test/course-reports-metrics.test.ts 2>&1 | tail -20
```
Expected: fail — `aggregateUtilizationCells` not found.

- [ ] **Step 3: Add utilization helper functions to courseMetrics.ts**

Add at the bottom of `src/lib/reports/courseMetrics.ts`:

```typescript
// ── Utilization ────────────────────────────────────────────────────────────────

export interface UtilizationCell {
  dayOfWeek: number   // 0=Sun … 6=Sat (JS convention)
  hourSlot: number    // local hour 0–23
  count: number
  avgParty: number
}

export interface UtilizationData {
  cells: UtilizationCell[]
  peakDay: string
  peakSlot: string
  avgPartySize: number
  offPeakPct: number
  monthlySummary: Array<{ month: string; rounds: number; avgPartySize: number }>
}

const TZ = 'America/Detroit'
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_FULL  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function localDayOfWeek(iso: string): number {
  const parts = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: TZ })
    .formatToParts(new Date(iso))
  const day = parts.find(p => p.type === 'weekday')?.value ?? 'Sun'
  return DAY_NAMES.indexOf(day)
}

function localHour(iso: string): number {
  const parts = new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: TZ })
    .formatToParts(new Date(iso))
  return Number(parts.find(p => p.type === 'hour')?.value ?? 0)
}

export function aggregateUtilizationCells(
  slots: Array<{ scheduled_at: string; confirmedPlayers: number[] }>
): UtilizationCell[] {
  const map = new Map<string, { count: number; totalParty: number }>()
  for (const slot of slots) {
    if (slot.confirmedPlayers.length === 0) continue
    const day = localDayOfWeek(slot.scheduled_at)
    const hour = localHour(slot.scheduled_at)
    const key = `${day}:${hour}`
    const existing = map.get(key) ?? { count: 0, totalParty: 0 }
    const players = slot.confirmedPlayers.reduce((s, p) => s + p, 0)
    map.set(key, {
      count: existing.count + slot.confirmedPlayers.length,
      totalParty: existing.totalParty + players,
    })
  }
  return Array.from(map.entries()).map(([key, val]) => {
    const [day, hour] = key.split(':').map(Number)
    return {
      dayOfWeek: day,
      hourSlot: hour,
      count: val.count,
      avgParty: val.count > 0 ? Math.round((val.totalParty / val.count) * 10) / 10 : 0,
    }
  })
}

export function calcOffPeakPct(cells: UtilizationCell[]): number {
  const total = cells.reduce((s, c) => s + c.count, 0)
  if (total === 0) return 0
  const offPeak = cells
    .filter(c => c.hourSlot < 10 || c.hourSlot >= 15)
    .reduce((s, c) => s + c.count, 0)
  return Math.round((offPeak / total) * 100)
}

export async function getUtilizationData(
  courseId: string,
  from: string,
  to: string,
): Promise<UtilizationData> {
  const admin = createAdminClient()
  const { data: slots, error } = await admin
    .from('tee_times')
    .select('scheduled_at, bookings(players, status)')
    .eq('course_id', courseId)
    .gte('scheduled_at', `${from}T00:00:00`)
    .lte('scheduled_at', `${to}T23:59:59`)
  if (error) throw new Error(`[getUtilizationData] ${error.message}`)

  const normalized = (slots ?? []).map(s => ({
    scheduled_at: s.scheduled_at as string,
    confirmedPlayers: (s.bookings as Array<{ players: number; status: string }>)
      .filter(b => b.status === 'confirmed')
      .map(b => b.players),
  }))

  const cells = aggregateUtilizationCells(normalized)

  // Peak day
  const byDay = new Map<number, number>()
  for (const c of cells) byDay.set(c.dayOfWeek, (byDay.get(c.dayOfWeek) ?? 0) + c.count)
  let peakDayNum = 0, peakDayCount = 0
  for (const [d, cnt] of byDay) { if (cnt > peakDayCount) { peakDayCount = cnt; peakDayNum = d } }
  const peakDay = DAY_FULL[peakDayNum] ?? '—'

  // Peak slot
  const topCell = [...cells].sort((a, b) => b.count - a.count)[0]
  const peakSlot = topCell
    ? new Date(0).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true,
        // set hours directly
      }).replace('12:00 AM', `${topCell.hourSlot}:00`)
    : '—'
  // Simpler peak slot label:
  const ph = topCell?.hourSlot ?? 0
  const peakSlotLabel = `${ph === 0 ? 12 : ph > 12 ? ph - 12 : ph}:00 ${ph >= 12 ? 'PM' : 'AM'}`

  const allBookings = cells.reduce((s, c) => s + c.count, 0)
  const totalParty = normalized
    .flatMap(s => s.confirmedPlayers)
    .reduce((s, p) => s + p, 0)
  const avgPartySize = allBookings > 0 ? Math.round((totalParty / allBookings) * 10) / 10 : 0
  const offPeakPct = calcOffPeakPct(cells)

  // Monthly summary
  const monthMap = new Map<string, { rounds: number; totalParty: number }>()
  for (const slot of normalized) {
    if (slot.confirmedPlayers.length === 0) continue
    const month = slot.scheduled_at.slice(0, 7)
    const existing = monthMap.get(month) ?? { rounds: 0, totalParty: 0 }
    monthMap.set(month, {
      rounds: existing.rounds + slot.confirmedPlayers.length,
      totalParty: existing.totalParty + slot.confirmedPlayers.reduce((s, p) => s + p, 0),
    })
  }
  const monthlySummary = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, val]) => ({
      month,
      rounds: val.rounds,
      avgPartySize: val.rounds > 0 ? Math.round((val.totalParty / val.rounds) * 10) / 10 : 0,
    }))

  return { cells, peakDay, peakSlot: peakSlotLabel, avgPartySize, offPeakPct, monthlySummary }
}
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/barris/Desktop/MulliganLinks && npx vitest run src/test/course-reports-metrics.test.ts 2>&1 | tail -20
```
Expected: `aggregateUtilizationCells` and `calcOffPeakPct` tests pass. Loyalty/guest/comp tests still fail (not written yet).

- [ ] **Step 5: Commit**

```bash
git add src/lib/reports/courseMetrics.ts src/test/course-reports-metrics.test.ts
git commit -m "feat(reports): add utilization metric functions"
```

---

## Task 2: Utilization report page + heatmap

**Files:**
- Create: `src/app/course/[slug]/reports/utilization/page.tsx`
- Create: `src/app/course/[slug]/reports/utilization/UtilizationHeatmap.tsx`

- [ ] **Step 1: Create UtilizationHeatmap.tsx**

```tsx
'use client'

import type { UtilizationCell } from '@/lib/reports/courseMetrics'

const HOURS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]
const DAYS  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatHour(h: number) {
  if (h === 0 || h === 12) return `${h === 0 ? 12 : h}:00 ${h === 0 ? 'AM' : 'PM'}`
  return `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`
}

function intensityClass(count: number, max: number): string {
  if (max === 0 || count === 0) return 'bg-gray-100'
  const ratio = count / max
  if (ratio < 0.2) return 'bg-emerald-100'
  if (ratio < 0.4) return 'bg-emerald-200'
  if (ratio < 0.6) return 'bg-emerald-300'
  if (ratio < 0.8) return 'bg-emerald-400'
  return 'bg-emerald-600'
}

export function UtilizationHeatmap({ cells }: { cells: UtilizationCell[] }) {
  const cellMap = new Map<string, UtilizationCell>()
  for (const c of cells) cellMap.set(`${c.dayOfWeek}:${c.hourSlot}`, c)
  const max = Math.max(0, ...cells.map(c => c.count))

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[520px]">
        {/* Day headers */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 mb-1">
          <div />
          {DAYS.map(d => (
            <div key={d} className="text-xs text-center text-gray-500 font-medium">{d}</div>
          ))}
        </div>
        {/* Hour rows */}
        {HOURS.map(hour => (
          <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 mb-1">
            <div className="text-xs text-right pr-2 text-gray-400 leading-6">{formatHour(hour)}</div>
            {DAYS.map((_, dayIdx) => {
              const cell = cellMap.get(`${dayIdx}:${hour}`)
              return (
                <div
                  key={dayIdx}
                  title={cell ? `${cell.count} booking${cell.count !== 1 ? 's' : ''}, avg ${cell.avgParty} players` : 'No bookings'}
                  className={`h-6 rounded text-xs flex items-center justify-center ${intensityClass(cell?.count ?? 0, max)}`}
                >
                  {cell && cell.count > 0 ? (
                    <span className="text-[10px] font-medium text-emerald-900">{cell.count}</span>
                  ) : null}
                </div>
              )
            })}
          </div>
        ))}
        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="text-xs text-gray-400">Low</span>
          {['bg-gray-100', 'bg-emerald-100', 'bg-emerald-200', 'bg-emerald-400', 'bg-emerald-600'].map(c => (
            <div key={c} className={`w-4 h-4 rounded ${c}`} />
          ))}
          <span className="text-xs text-gray-400">High</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create utilization page**

```tsx
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUtilizationData } from '@/lib/reports/courseMetrics'
import { resolveDateRange } from '@/lib/reports/dateRange'
import { requireManager } from '@/lib/courseRole'
import KpiTile from '@/components/reports/KpiTile'
import CsvExportButton from '@/components/reports/CsvExportButton'
import DateRangePicker from '@/components/reports/DateRangePicker'
import { UtilizationHeatmap } from './UtilizationHeatmap'

export default async function UtilizationReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>
}) {
  const { slug } = await params
  await requireManager(slug)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/course/${slug}/login`)

  const admin = createAdminClient()
  const { data: course, error: courseError } = await admin
    .from('courses').select('id').eq('slug', slug).single()
  if (courseError && courseError.code !== 'PGRST116') throw new Error(`[UtilizationReport] ${courseError.message}`)
  if (!course) notFound()

  const sp = await searchParams
  const dateRange = resolveDateRange(sp.preset, sp.from, sp.to)
  const data = await getUtilizationData(course.id, dateRange.from, dateRange.to)

  const csvData = data.monthlySummary.map(row => ({
    Month: row.month,
    Rounds: row.rounds,
    'Avg Party Size': row.avgPartySize,
  }))

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Tee Sheet Utilization</h1>
        <CsvExportButton data={csvData} filename={`${slug}-utilization.csv`} />
      </div>

      <DateRangePicker />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiTile label="Peak Day" value={data.peakDay} accent />
        <KpiTile label="Peak Time Slot" value={data.peakSlot} />
        <KpiTile label="Avg Party Size" value={data.avgPartySize.toString()} />
        <KpiTile label="Off-Peak Bookings" value={`${data.offPeakPct}%`} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-[#1A1A1A] mb-4">Booking Heatmap</h2>
        <p className="text-xs text-gray-500 mb-4">Number of bookings by day of week and time of day</p>
        <UtilizationHeatmap cells={data.cells} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-[#1A1A1A] mb-4">Monthly Summary</h2>
        {data.monthlySummary.length === 0 ? (
          <p className="text-sm text-gray-500">No data for this date range.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Month', 'Rounds', 'Avg Party Size'].map(h => (
                  <th key={h} scope="col" className="text-left py-2 px-3 text-xs text-[#6B7770] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.monthlySummary.map(row => (
                <tr key={row.month} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3">{row.month}</td>
                  <td className="py-2 px-3 font-medium">{row.rounds.toLocaleString()}</td>
                  <td className="py-2 px-3">{row.avgPartySize}</td>
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

- [ ] **Step 3: Verify build**

```bash
cd /Users/barris/Desktop/MulliganLinks && npx tsc --noEmit 2>&1 | grep -i error | head -20
```
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/course/\[slug\]/reports/utilization/
git commit -m "feat(reports): add tee sheet utilization report page"
```

---

## Task 3: Loyalty & Comp metric functions

**Files:**
- Modify: `src/lib/reports/courseMetrics.ts`
- Modify: `src/test/course-reports-metrics.test.ts`

- [ ] **Step 1: Add tests for loyalty and comp aggregation**

Add to `src/test/course-reports-metrics.test.ts`:

```typescript
// ── Loyalty ────────────────────────────────────────────────────────────────────

describe('aggregateLoyaltyData', () => {
  it('counts visits per user', () => {
    const bookings = [
      { user_id: 'u1', players: 2 },
      { user_id: 'u1', players: 2 },
      { user_id: 'u2', players: 1 },
    ]
    const result = aggregateLoyaltyData(bookings)
    expect(result.visitsByUser.get('u1')).toBe(2)
    expect(result.visitsByUser.get('u2')).toBe(1)
  })

  it('calculates avg visits per member', () => {
    const bookings = [
      { user_id: 'u1', players: 2 },
      { user_id: 'u1', players: 2 },
      { user_id: 'u2', players: 1 },
    ]
    const result = aggregateLoyaltyData(bookings)
    // 2 users, 3 total visits → avg 1.5
    expect(result.avgVisitsPerMember).toBe(1.5)
  })

  it('counts single-visit members', () => {
    const bookings = [
      { user_id: 'u1', players: 2 },
      { user_id: 'u2', players: 1 },
    ]
    const result = aggregateLoyaltyData(bookings)
    expect(result.singleVisitCount).toBe(2)
  })
})

// ── Comp Rounds ────────────────────────────────────────────────────────────────

describe('aggregateCompData', () => {
  it('counts redeemed comps', () => {
    const bookings = [
      { redemption_type: 'complimentary', base_price: 45 },
      { redemption_type: 'complimentary', base_price: 45 },
      { redemption_type: null, base_price: 45 },
    ]
    const result = aggregateCompData(bookings)
    expect(result.redeemed).toBe(2)
  })

  it('calculates estimated cost from avg green fee', () => {
    const bookings = [
      { redemption_type: 'complimentary', base_price: 50 },
      { redemption_type: 'complimentary', base_price: 50 },
    ]
    const result = aggregateCompData(bookings)
    expect(result.estimatedCostCents).toBe(10000)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /Users/barris/Desktop/MulliganLinks && npx vitest run src/test/course-reports-metrics.test.ts 2>&1 | grep -E "FAIL|PASS|Error" | head -20
```
Expected: new tests fail — functions not defined.

- [ ] **Step 3: Add loyalty metric functions to courseMetrics.ts**

```typescript
// ── Loyalty ────────────────────────────────────────────────────────────────────

export interface LoyaltyAggregate {
  visitsByUser: Map<string, number>
  avgVisitsPerMember: number
  singleVisitCount: number
  threeOrMorePct: number
}

export function aggregateLoyaltyData(
  bookings: Array<{ user_id: string | null; players: number }>
): LoyaltyAggregate {
  const map = new Map<string, number>()
  for (const b of bookings) {
    if (!b.user_id) continue
    map.set(b.user_id, (map.get(b.user_id) ?? 0) + 1)
  }
  const counts = Array.from(map.values())
  const total = counts.reduce((s, c) => s + c, 0)
  const avgVisitsPerMember = map.size > 0
    ? Math.round((total / map.size) * 10) / 10
    : 0
  const singleVisitCount = counts.filter(c => c === 1).length
  const threeOrMorePct = map.size > 0
    ? Math.round((counts.filter(c => c >= 3).length / map.size) * 100)
    : 0
  return { visitsByUser: map, avgVisitsPerMember, singleVisitCount, threeOrMorePct }
}

export interface LoyaltyVisitor {
  userId: string
  fullName: string
  tier: string
  totalVisits: number
  lastVisit: string
}

export interface LoyaltyData {
  avgVisitsPerMember: number
  threeOrMorePct: number
  singleVisitCount: number
  topVisitors: LoyaltyVisitor[]
  frequencyBuckets: Array<{ label: string; count: number }>
}

export async function getLoyaltyData(
  courseId: string,
  from: string,
  to: string,
): Promise<LoyaltyData> {
  const admin = createAdminClient()
  const { data: slots, error } = await admin
    .from('tee_times')
    .select('scheduled_at, bookings(user_id, players, status)')
    .eq('course_id', courseId)
    .gte('scheduled_at', `${from}T00:00:00`)
    .lte('scheduled_at', `${to}T23:59:59`)
  if (error) throw new Error(`[getLoyaltyData] ${error.message}`)

  const flatBookings = (slots ?? []).flatMap(s =>
    (s.bookings as Array<{ user_id: string | null; players: number; status: string }>)
      .filter(b => b.status === 'confirmed' && b.user_id)
      .map(b => ({ user_id: b.user_id!, players: b.players, scheduled_at: s.scheduled_at as string }))
  )

  const agg = aggregateLoyaltyData(flatBookings)

  // Last visit per user
  const lastVisitMap = new Map<string, string>()
  for (const b of flatBookings) {
    const existing = lastVisitMap.get(b.user_id) ?? ''
    if (b.scheduled_at > existing) lastVisitMap.set(b.user_id, b.scheduled_at)
  }

  // Top 20 by visit count
  const sorted = Array.from(agg.visitsByUser.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)

  // Load profiles for top visitors
  let topVisitors: LoyaltyVisitor[] = []
  if (sorted.length > 0) {
    const userIds = sorted.map(([id]) => id)
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds)
    const { data: memberships } = await admin
      .from('memberships')
      .select('user_id, tier')
      .in('user_id', userIds)
      .eq('status', 'active')
    const profileMap = new Map((profiles ?? []).map(p => [p.id, p.full_name ?? 'Member']))
    const tierMap = new Map((memberships ?? []).map(m => [m.user_id, m.tier as string]))
    topVisitors = sorted.map(([userId, visits]) => ({
      userId,
      fullName: profileMap.get(userId) ?? 'Member',
      tier: tierMap.get(userId) ?? 'fairway',
      totalVisits: visits,
      lastVisit: lastVisitMap.get(userId)?.slice(0, 10) ?? '',
    }))
  }

  const frequencyBuckets = [
    { label: '1×', count: Array.from(agg.visitsByUser.values()).filter(v => v === 1).length },
    { label: '2×', count: Array.from(agg.visitsByUser.values()).filter(v => v === 2).length },
    { label: '3×', count: Array.from(agg.visitsByUser.values()).filter(v => v === 3).length },
    { label: '4×', count: Array.from(agg.visitsByUser.values()).filter(v => v === 4).length },
    { label: '5×+', count: Array.from(agg.visitsByUser.values()).filter(v => v >= 5).length },
  ]

  return {
    avgVisitsPerMember: agg.avgVisitsPerMember,
    threeOrMorePct: agg.threeOrMorePct,
    singleVisitCount: agg.singleVisitCount,
    topVisitors,
    frequencyBuckets,
  }
}
```

- [ ] **Step 4: Add comp metric functions to courseMetrics.ts**

```typescript
// ── Comp Rounds ────────────────────────────────────────────────────────────────

export interface CompAggregate {
  redeemed: number
  estimatedCostCents: number
}

export function aggregateCompData(
  bookings: Array<{ redemption_type: string | null; base_price: number }>
): CompAggregate {
  const comps = bookings.filter(b => b.redemption_type === 'complimentary')
  const estimatedCostCents = comps.reduce((s, b) => s + Math.round(b.base_price * 100), 0)
  return { redeemed: comps.length, estimatedCostCents }
}

export interface CompMonthRow {
  month: string
  redeemed: number
  estimatedCostCents: number
}

export interface CompData {
  redeemed: number
  redemptionRate: number
  estimatedCostCents: number
  monthly: CompMonthRow[]
  perMember: Array<{ userId: string; fullName: string; tier: string; redeemed: number; lastRedemption: string }>
}

export async function getCompData(
  courseId: string,
  from: string,
  to: string,
): Promise<CompData> {
  const admin = createAdminClient()
  const { data: slots, error } = await admin
    .from('tee_times')
    .select('scheduled_at, bookings(user_id, status, redemption_type, total_paid)')
    .eq('course_id', courseId)
    .gte('scheduled_at', `${from}T00:00:00`)
    .lte('scheduled_at', `${to}T23:59:59`)
  if (error) throw new Error(`[getCompData] ${error.message}`)

  const flatBookings = (slots ?? []).flatMap(s =>
    (s.bookings as Array<{ user_id: string | null; status: string; redemption_type: string | null; total_paid: number }>)
      .filter(b => b.status === 'confirmed')
      .map(b => ({ ...b, scheduled_at: s.scheduled_at as string }))
  )

  const total = flatBookings.length
  const compBookings = flatBookings.filter(b => b.redemption_type === 'complimentary')
  const redeemed = compBookings.length
  const redemptionRate = total > 0 ? Math.round((redeemed / total) * 100) : 0

  // Avg green fee from revenue data (use avg of total_paid as proxy)
  const avgGreenFeeCents = total > 0
    ? Math.round(flatBookings.reduce((s, b) => s + Math.round((b.total_paid ?? 0) * 100), 0) / total)
    : 4500
  const estimatedCostCents = redeemed * avgGreenFeeCents

  // Monthly
  const monthMap = new Map<string, number>()
  for (const b of compBookings) {
    const month = b.scheduled_at.slice(0, 7)
    monthMap.set(month, (monthMap.get(month) ?? 0) + 1)
  }
  const monthly: CompMonthRow[] = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({
      month,
      redeemed: count,
      estimatedCostCents: count * avgGreenFeeCents,
    }))

  // Per member
  const userMap = new Map<string, { count: number; lastRedemption: string }>()
  for (const b of compBookings) {
    if (!b.user_id) continue
    const existing = userMap.get(b.user_id) ?? { count: 0, lastRedemption: '' }
    userMap.set(b.user_id, {
      count: existing.count + 1,
      lastRedemption: b.scheduled_at > existing.lastRedemption ? b.scheduled_at.slice(0, 10) : existing.lastRedemption,
    })
  }

  let perMember: CompData['perMember'] = []
  if (userMap.size > 0) {
    const userIds = Array.from(userMap.keys())
    const { data: profiles } = await admin.from('profiles').select('id, full_name').in('id', userIds)
    const { data: memberships } = await admin.from('memberships').select('user_id, tier').in('user_id', userIds).eq('status', 'active')
    const profileMap = new Map((profiles ?? []).map(p => [p.id, p.full_name ?? 'Member']))
    const tierMap = new Map((memberships ?? []).map(m => [m.user_id, m.tier as string]))
    perMember = Array.from(userMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([userId, val]) => ({
        userId,
        fullName: profileMap.get(userId) ?? 'Member',
        tier: tierMap.get(userId) ?? 'fairway',
        redeemed: val.count,
        lastRedemption: val.lastRedemption,
      }))
  }

  return { redeemed, redemptionRate, estimatedCostCents, monthly, perMember }
}
```

- [ ] **Step 5: Add guest/referral and league functions to courseMetrics.ts**

```typescript
// ── Guest Passes & Referrals ───────────────────────────────────────────────────

export interface GuestData {
  passesRedeemed: number
  guestToMemberConversions: number
  membersViaReferral: number
  totalAttributions: number
  monthly: Array<{ month: string; passesRedeemed: number }>
  details: Array<{ fullName: string; source: string; joinDate: string; tier: string }>
}

export async function getGuestData(
  courseId: string,
  from: string,
  to: string,
): Promise<GuestData> {
  const admin = createAdminClient()

  // Guest passes redeemed at this course (booking at this course that had a guest pass)
  const { data: slots } = await admin
    .from('tee_times')
    .select('scheduled_at, bookings(guest_pass_id, status, user_id)')
    .eq('course_id', courseId)
    .gte('scheduled_at', `${from}T00:00:00`)
    .lte('scheduled_at', `${to}T23:59:59`)

  const passBookings = (slots ?? []).flatMap(s =>
    (s.bookings as Array<{ guest_pass_id: string | null; status: string; user_id: string | null }>)
      .filter(b => b.status === 'confirmed' && b.guest_pass_id)
      .map(b => ({ ...b, month: (s.scheduled_at as string).slice(0, 7) }))
  )
  const passesRedeemed = passBookings.length

  // Monthly breakdown
  const monthMap = new Map<string, number>()
  for (const b of passBookings) monthMap.set(b.month, (monthMap.get(b.month) ?? 0) + 1)
  const monthly = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, passesRedeemed]) => ({ month, passesRedeemed }))

  // Members acquired via this course's referral link (table: course_referrals, col: profile_id)
  const { data: referrals } = await admin
    .from('course_referrals')
    .select('profile_id, attributed_at')
    .eq('course_id', courseId)
    .gte('attributed_at', `${from}T00:00:00`)
    .lte('attributed_at', `${to}T23:59:59`)

  const membersViaReferral = (referrals ?? []).length

  // Guest-to-member conversions: users who redeemed a guest pass at this course, then became members
  const guestUserIds = [...new Set(passBookings.map(b => b.user_id).filter(Boolean))] as string[]
  let guestToMemberConversions = 0
  let details: GuestData['details'] = []

  if (guestUserIds.length > 0 || membersViaReferral > 0) {
    const referralProfileIds = (referrals ?? []).map(r => r.profile_id as string)
    const allUserIds = [...new Set([...guestUserIds, ...referralProfileIds])]
    const { data: profiles } = await admin.from('profiles').select('id, full_name, created_at').in('id', allUserIds)
    const { data: memberships } = await admin.from('memberships').select('user_id, tier').in('user_id', allUserIds).eq('status', 'active')
    const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))
    const tierMap = new Map((memberships ?? []).map(m => [m.user_id, m.tier as string]))

    guestToMemberConversions = guestUserIds.filter(id => tierMap.has(id)).length

    details = [
      ...guestUserIds.map(id => ({
        fullName: profileMap.get(id)?.full_name ?? 'Member',
        source: 'Guest Pass',
        joinDate: profileMap.get(id)?.created_at?.slice(0, 10) ?? '',
        tier: tierMap.get(id) ?? 'fairway',
      })),
      ...referralProfileIds.map(id => ({
        fullName: profileMap.get(id)?.full_name ?? 'Member',
        source: 'Referral Link',
        joinDate: profileMap.get(id)?.created_at?.slice(0, 10) ?? '',
        tier: tierMap.get(id) ?? 'fairway',
      })),
    ]
  }

  return {
    passesRedeemed,
    guestToMemberConversions,
    membersViaReferral,
    totalAttributions: guestToMemberConversions + membersViaReferral,
    monthly,
    details,
  }
}

// ── League Performance ─────────────────────────────────────────────────────────

export interface LeagueRow {
  id: string
  name: string
  memberCount: number
  roundsPlayed: number
  holes: number
  lastActivity: string
  estRevenueCents: number
}

export interface LeagueData {
  activeLeagues: number
  totalRounds: number
  totalMembers: number
  estRevenueCents: number
  leagues: LeagueRow[]
}

export async function getLeagueData(
  courseId: string,
  from: string,
  to: string,
): Promise<LeagueData> {
  const admin = createAdminClient()

  const { data: leagues, error } = await admin
    .from('leagues')
    .select('id, name, holes, league_members(count)')
    .eq('course_id', courseId)
    .eq('is_active', true)
  if (error) throw new Error(`[getLeagueData] ${error.message}`)

  // Rounds played: bookings by league members at this course in date range
  const { data: slots } = await admin
    .from('tee_times')
    .select('scheduled_at, bookings(user_id, status)')
    .eq('course_id', courseId)
    .gte('scheduled_at', `${from}T00:00:00`)
    .lte('scheduled_at', `${to}T23:59:59`)

  // Avg green fee
  const { data: kpisRow } = await admin
    .from('crm_course_metrics')
    .select('avg_green_fee, month')
    .eq('course_id', courseId)
    .order('month', { ascending: false })
    .limit(1)
    .single()
  const avgGreenFeeCents = Math.round(((kpisRow as any)?.avg_green_fee ?? 45) * 100)

  const confirmedUserIds = new Set(
    (slots ?? []).flatMap(s =>
      (s.bookings as Array<{ user_id: string | null; status: string }>)
        .filter(b => b.status === 'confirmed' && b.user_id)
        .map(b => b.user_id!)
    )
  )

  let totalRounds = 0
  let totalMembers = 0

  const leagueRows: LeagueRow[] = await Promise.all(
    (leagues ?? []).map(async (league) => {
      const { data: members } = await admin
        .from('league_members')
        .select('user_id')
        .eq('league_id', league.id)
      const memberIds = new Set((members ?? []).map(m => m.user_id as string))
      const memberCount = memberIds.size
      const roundsPlayed = Array.from(confirmedUserIds).filter(id => memberIds.has(id)).length

      const { data: lastBooking } = await admin
        .from('tee_times')
        .select('scheduled_at, bookings!inner(user_id, status)')
        .eq('course_id', courseId)
        .eq('bookings.status', 'confirmed')
        .order('scheduled_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      totalRounds += roundsPlayed
      totalMembers += memberCount

      return {
        id: league.id,
        name: league.name,
        memberCount,
        roundsPlayed,
        holes: league.holes ?? 18,
        lastActivity: lastBooking?.scheduled_at?.slice(0, 10) ?? '—',
        estRevenueCents: roundsPlayed * avgGreenFeeCents,
      }
    })
  )

  return {
    activeLeagues: leagueRows.length,
    totalRounds,
    totalMembers,
    estRevenueCents: totalRounds * avgGreenFeeCents,
    leagues: leagueRows,
  }
}
```

- [ ] **Step 6: Run all metric tests**

```bash
cd /Users/barris/Desktop/MulliganLinks && npx vitest run src/test/course-reports-metrics.test.ts 2>&1 | tail -20
```
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/reports/courseMetrics.ts src/test/course-reports-metrics.test.ts
git commit -m "feat(reports): add loyalty, comp, guest, league metric functions"
```

---

## Task 4: Loyalty report page + chart

**Files:**
- Create: `src/app/course/[slug]/reports/loyalty/LoyaltyChart.tsx`
- Create: `src/app/course/[slug]/reports/loyalty/page.tsx`

- [ ] **Step 1: Create LoyaltyChart.tsx**

```tsx
'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export function LoyaltyChart({ data }: { data: Array<{ label: string; count: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip formatter={(v: number) => [v, 'Members']} />
        <Bar dataKey="count" fill="#3B6D11" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 2: Create loyalty page**

```tsx
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getLoyaltyData } from '@/lib/reports/courseMetrics'
import { resolveDateRange } from '@/lib/reports/dateRange'
import { requireManager } from '@/lib/courseRole'
import KpiTile from '@/components/reports/KpiTile'
import CsvExportButton from '@/components/reports/CsvExportButton'
import DateRangePicker from '@/components/reports/DateRangePicker'
import { LoyaltyChart } from './LoyaltyChart'

export default async function LoyaltyReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>
}) {
  const { slug } = await params
  await requireManager(slug)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/course/${slug}/login`)

  const admin = createAdminClient()
  const { data: course, error: courseError } = await admin
    .from('courses').select('id').eq('slug', slug).single()
  if (courseError && courseError.code !== 'PGRST116') throw new Error(`[LoyaltyReport] ${courseError.message}`)
  if (!course) notFound()

  const sp = await searchParams
  const dateRange = resolveDateRange(sp.preset, sp.from, sp.to)
  const data = await getLoyaltyData(course.id, dateRange.from, dateRange.to)

  const csvData = data.topVisitors.map(v => ({
    Name: v.fullName,
    Tier: v.tier,
    'Total Visits': v.totalVisits,
    'Last Visit': v.lastVisit,
  }))

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Member Loyalty & Repeat Visits</h1>
        <CsvExportButton data={csvData} filename={`${slug}-loyalty.csv`} />
      </div>

      <DateRangePicker />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiTile label="Avg Visits / Member" value={data.avgVisitsPerMember.toString()} accent />
        <KpiTile label="Members with 3+ Visits" value={`${data.threeOrMorePct}%`} />
        <KpiTile label="Single-Visit Members" value={data.singleVisitCount.toString()} />
        <KpiTile label="Top Visitors Tracked" value={data.topVisitors.length.toString()} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-[#1A1A1A] mb-4">Visit Frequency Distribution</h2>
        {data.frequencyBuckets.every(b => b.count === 0) ? (
          <p className="text-sm text-gray-500">No data for this date range.</p>
        ) : (
          <LoyaltyChart data={data.frequencyBuckets} />
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-[#1A1A1A] mb-4">Top 20 Most Frequent Visitors</h2>
        {data.topVisitors.length === 0 ? (
          <p className="text-sm text-gray-500">No data for this date range.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Name', 'Tier', 'Total Visits', 'Last Visit'].map(h => (
                  <th key={h} scope="col" className="text-left py-2 px-3 text-xs text-[#6B7770] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.topVisitors.map(v => (
                <tr key={v.userId} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3 font-medium">{v.fullName}</td>
                  <td className="py-2 px-3 capitalize">{v.tier}</td>
                  <td className="py-2 px-3">{v.totalVisits}</td>
                  <td className="py-2 px-3 text-gray-500">{v.lastVisit}</td>
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

- [ ] **Step 3: Commit**

```bash
git add src/app/course/\[slug\]/reports/loyalty/
git commit -m "feat(reports): add member loyalty report page"
```

---

## Task 5: Guest Passes & Referrals report page

**Files:**
- Create: `src/app/course/[slug]/reports/guests/GuestChart.tsx`
- Create: `src/app/course/[slug]/reports/guests/page.tsx`

- [ ] **Step 1: Create GuestChart.tsx**

```tsx
'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export function GuestChart({ data }: { data: Array<{ month: string; passesRedeemed: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip formatter={(v: number) => [v, 'Passes Redeemed']} />
        <Bar dataKey="passesRedeemed" fill="#1B4332" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 2: Create guests page**

```tsx
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getGuestData } from '@/lib/reports/courseMetrics'
import { resolveDateRange } from '@/lib/reports/dateRange'
import { requireManager } from '@/lib/courseRole'
import KpiTile from '@/components/reports/KpiTile'
import CsvExportButton from '@/components/reports/CsvExportButton'
import DateRangePicker from '@/components/reports/DateRangePicker'
import { GuestChart } from './GuestChart'

export default async function GuestsReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>
}) {
  const { slug } = await params
  await requireManager(slug)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/course/${slug}/login`)

  const admin = createAdminClient()
  const { data: course, error: courseError } = await admin
    .from('courses').select('id').eq('slug', slug).single()
  if (courseError && courseError.code !== 'PGRST116') throw new Error(`[GuestsReport] ${courseError.message}`)
  if (!course) notFound()

  const sp = await searchParams
  const dateRange = resolveDateRange(sp.preset, sp.from, sp.to)
  const data = await getGuestData(course.id, dateRange.from, dateRange.to)

  const csvData = data.details.map(d => ({
    Name: d.fullName,
    Source: d.source,
    'Join Date': d.joinDate,
    Tier: d.tier,
  }))

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Guest Passes & Referral Activity</h1>
        <CsvExportButton data={csvData} filename={`${slug}-guests.csv`} />
      </div>

      <DateRangePicker />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiTile label="Guest Passes Redeemed" value={data.passesRedeemed.toString()} accent />
        <KpiTile label="Guest → Member Conversions" value={data.guestToMemberConversions.toString()} />
        <KpiTile label="Members via Referral Link" value={data.membersViaReferral.toString()} />
        <KpiTile label="Total New Attributions" value={data.totalAttributions.toString()} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-[#1A1A1A] mb-4">Guest Pass Redemptions by Month</h2>
        {data.monthly.length === 0 ? (
          <p className="text-sm text-gray-500">No guest pass redemptions in this date range.</p>
        ) : (
          <GuestChart data={data.monthly} />
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-[#1A1A1A] mb-4">Attribution Detail</h2>
        {data.details.length === 0 ? (
          <p className="text-sm text-gray-500">No attributions in this date range.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Name', 'Source', 'Join Date', 'Tier'].map(h => (
                  <th key={h} scope="col" className="text-left py-2 px-3 text-xs text-[#6B7770] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.details.map((d, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3 font-medium">{d.fullName}</td>
                  <td className="py-2 px-3">{d.source}</td>
                  <td className="py-2 px-3 text-gray-500">{d.joinDate}</td>
                  <td className="py-2 px-3 capitalize">{d.tier}</td>
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

- [ ] **Step 3: Commit**

```bash
git add src/app/course/\[slug\]/reports/guests/
git commit -m "feat(reports): add guest passes and referral report page"
```

---

## Task 6: Comp Rounds report page

**Files:**
- Create: `src/app/course/[slug]/reports/comps/CompTrendChart.tsx`
- Create: `src/app/course/[slug]/reports/comps/page.tsx`

- [ ] **Step 1: Create CompTrendChart.tsx**

```tsx
'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export function CompTrendChart({ data }: { data: Array<{ month: string; redeemed: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip formatter={(v: number) => [v, 'Comps Redeemed']} />
        <Line type="monotone" dataKey="redeemed" stroke="#1B4332" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 2: Create comps page**

```tsx
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCompData } from '@/lib/reports/courseMetrics'
import { resolveDateRange } from '@/lib/reports/dateRange'
import { requireManager } from '@/lib/courseRole'
import KpiTile from '@/components/reports/KpiTile'
import CsvExportButton from '@/components/reports/CsvExportButton'
import DateRangePicker from '@/components/reports/DateRangePicker'
import { CompTrendChart } from './CompTrendChart'

export default async function CompsReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>
}) {
  const { slug } = await params
  await requireManager(slug)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/course/${slug}/login`)

  const admin = createAdminClient()
  const { data: course, error: courseError } = await admin
    .from('courses').select('id').eq('slug', slug).single()
  if (courseError && courseError.code !== 'PGRST116') throw new Error(`[CompsReport] ${courseError.message}`)
  if (!course) notFound()

  const sp = await searchParams
  const dateRange = resolveDateRange(sp.preset, sp.from, sp.to)
  const data = await getCompData(course.id, dateRange.from, dateRange.to)

  const csvData = data.perMember.map(m => ({
    Name: m.fullName,
    Tier: m.tier,
    'Comps Redeemed': m.redeemed,
    'Last Redemption': m.lastRedemption,
  }))

  const estCostDollars = (data.estimatedCostCents / 100).toLocaleString('en-US', {
    style: 'currency', currency: 'USD',
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Comp Rounds Tracker</h1>
        <CsvExportButton data={csvData} filename={`${slug}-comps.csv`} />
      </div>

      <DateRangePicker />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiTile label="Comps Redeemed" value={data.redeemed.toString()} accent />
        <KpiTile label="Redemption Rate" value={`${data.redemptionRate}%`} />
        <KpiTile label="Estimated Cost" value={estCostDollars} />
        <KpiTile label="Members Using Comps" value={data.perMember.length.toString()} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-[#1A1A1A] mb-4">Comp Redemptions by Month</h2>
        {data.monthly.length === 0 ? (
          <p className="text-sm text-gray-500">No comp rounds redeemed in this date range.</p>
        ) : (
          <CompTrendChart data={data.monthly} />
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-[#1A1A1A] mb-4">Per-Member Comp Usage</h2>
        {data.perMember.length === 0 ? (
          <p className="text-sm text-gray-500">No comp rounds redeemed in this date range.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Name', 'Tier', 'Comps Redeemed', 'Last Redemption'].map(h => (
                  <th key={h} scope="col" className="text-left py-2 px-3 text-xs text-[#6B7770] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.perMember.map(m => (
                <tr key={m.userId} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3 font-medium">{m.fullName}</td>
                  <td className="py-2 px-3 capitalize">{m.tier}</td>
                  <td className="py-2 px-3">{m.redeemed}</td>
                  <td className="py-2 px-3 text-gray-500">{m.lastRedemption}</td>
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

- [ ] **Step 3: Commit**

```bash
git add src/app/course/\[slug\]/reports/comps/
git commit -m "feat(reports): add comp rounds tracker report page"
```

---

## Task 7: League Performance report page

**Files:**
- Create: `src/app/course/[slug]/reports/leagues/page.tsx`

- [ ] **Step 1: Create leagues page**

```tsx
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getLeagueData } from '@/lib/reports/courseMetrics'
import { resolveDateRange } from '@/lib/reports/dateRange'
import { requireManager } from '@/lib/courseRole'
import KpiTile from '@/components/reports/KpiTile'
import CsvExportButton from '@/components/reports/CsvExportButton'
import DateRangePicker from '@/components/reports/DateRangePicker'

export default async function LeaguesReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>
}) {
  const { slug } = await params
  await requireManager(slug)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/course/${slug}/login`)

  const admin = createAdminClient()
  const { data: course, error: courseError } = await admin
    .from('courses').select('id').eq('slug', slug).single()
  if (courseError && courseError.code !== 'PGRST116') throw new Error(`[LeaguesReport] ${courseError.message}`)
  if (!course) notFound()

  const sp = await searchParams
  const dateRange = resolveDateRange(sp.preset, sp.from, sp.to)
  const data = await getLeagueData(course.id, dateRange.from, dateRange.to)

  const csvData = data.leagues.map(l => ({
    'League Name': l.name,
    Members: l.memberCount,
    'Rounds Played': l.roundsPlayed,
    Holes: l.holes,
    'Last Activity': l.lastActivity,
    'Est. Revenue': `$${(l.estRevenueCents / 100).toFixed(2)}`,
  }))

  const estRevenueDollars = (data.estRevenueCents / 100).toLocaleString('en-US', {
    style: 'currency', currency: 'USD',
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">League Performance</h1>
        <CsvExportButton data={csvData} filename={`${slug}-leagues.csv`} />
      </div>

      <DateRangePicker />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiTile label="Active Leagues" value={data.activeLeagues.toString()} accent />
        <KpiTile label="League Rounds Played" value={data.totalRounds.toLocaleString()} />
        <KpiTile label="League Members" value={data.totalMembers.toLocaleString()} />
        <KpiTile label="Est. Revenue Contribution" value={estRevenueDollars} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-[#1A1A1A] mb-4">League Breakdown</h2>
        {data.leagues.length === 0 ? (
          <p className="text-sm text-gray-500">No active leagues at this course.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['League Name', 'Members', 'Rounds', 'Holes', 'Est. Revenue', 'Last Activity'].map(h => (
                  <th key={h} scope="col" className="text-left py-2 px-3 text-xs text-[#6B7770] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.leagues.map(l => (
                <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3 font-medium">{l.name}</td>
                  <td className="py-2 px-3">{l.memberCount}</td>
                  <td className="py-2 px-3">{l.roundsPlayed}</td>
                  <td className="py-2 px-3">{l.holes}</td>
                  <td className="py-2 px-3">${(l.estRevenueCents / 100).toFixed(2)}</td>
                  <td className="py-2 px-3 text-gray-500">{l.lastActivity}</td>
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

- [ ] **Step 2: Commit**

```bash
git add src/app/course/\[slug\]/reports/leagues/
git commit -m "feat(reports): add league performance report page"
```

---

## Task 8: Update reports hub — add 5 new cards

**Files:**
- Modify: `src/app/course/[slug]/reports/page.tsx`

- [ ] **Step 1: Add 5 new entries to the `subPages` array**

In `src/app/course/[slug]/reports/page.tsx`, find the `subPages` array (currently lines 41–47) and replace it with:

```tsx
const subPages = [
  { href: `/course/${slug}/reports/rounds`,      label: 'Rounds & Utilization',       icon: '⛳' },
  { href: `/course/${slug}/reports/revenue`,     label: 'Revenue',                    icon: '💰' },
  { href: `/course/${slug}/reports/members`,     label: 'Member Activity',            icon: '👥' },
  { href: `/course/${slug}/reports/waitlist`,    label: 'Waitlist & Recovery',        icon: '📋' },
  { href: `/course/${slug}/reports/utilization`, label: 'Tee Sheet Utilization',      icon: '🗓️' },
  { href: `/course/${slug}/reports/loyalty`,     label: 'Member Loyalty',             icon: '🔁' },
  { href: `/course/${slug}/reports/guests`,      label: 'Guest Passes & Referrals',   icon: '🎟️' },
  { href: `/course/${slug}/reports/comps`,       label: 'Comp Rounds',                icon: '🎁' },
  { href: `/course/${slug}/reports/leagues`,     label: 'League Performance',         icon: '🏅' },
  { href: `/course/${slug}/reports/barter`,      label: 'The TeeAhead Difference',    icon: '🏆', highlight: true },
]
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/barris/Desktop/MulliganLinks && npx tsc --noEmit 2>&1 | grep -i error | head -20
```
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/course/\[slug\]/reports/page.tsx
git commit -m "feat(reports): add 5 new report cards to hub page"
```

---

## Task 9: Final build check

- [ ] **Step 1: Run full test suite**

```bash
cd /Users/barris/Desktop/MulliganLinks && npx vitest run 2>&1 | tail -30
```
Expected: all tests pass, no regressions.

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/barris/Desktop/MulliganLinks && npx tsc --noEmit 2>&1 | head -30
```
Expected: no errors.

- [ ] **Step 3: Build check**

```bash
cd /Users/barris/Desktop/MulliganLinks && npm run build 2>&1 | tail -20
```
Expected: build succeeds.

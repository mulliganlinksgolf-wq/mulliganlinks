# Reports Module — Plan 2: Admin Reports

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build all admin report pages: `/admin/reports` nav hub, `/admin/reports/financial`, `/admin/reports/members`, `/admin/reports/courses`, and `/admin/reports/courses/[id]`.

**Architecture:** Server components fetch data directly from Supabase using `createAdminClient()`. Chart components are client components (Recharts). Shared components (DateRangePicker, KpiTile, CsvExportButton) live in `src/components/reports/`. Data query functions live in `src/lib/reports/`. PDF generation uses `@react-pdf/renderer` (server-side). Date range is passed as URL search params so pages remain server-rendered and shareable.

**Tech Stack:** Next.js 14 App Router, Supabase, TypeScript, Tailwind CSS, Recharts (already installed), @react-pdf/renderer (install in Task 1)

**Depends on:** Plan 1 (DB tables must exist)

**Tier prices:** Eagle = $89/mo, Ace = $159/mo

---

### Task 1: Install PDF Library + Add Reports to Admin Sidebar + Nav Page

**Files:**
- Modify: `src/components/admin/AdminSidebar.tsx`
- Create: `src/app/admin/reports/page.tsx`

> Before writing any Next.js code, read `node_modules/next/dist/docs/` for App Router patterns relevant to server components and search params.

- [ ] **Step 1: Install @react-pdf/renderer**

```bash
npm install @react-pdf/renderer
npm install --save-dev @types/react-pdf
```

Expected: installs without peer dep errors. If you see React version conflicts, add `--legacy-peer-deps`.

- [ ] **Step 2: Add Reports section to AdminSidebar**

In `src/components/admin/AdminSidebar.tsx`, add after the `<SidebarSection label="Finance" />` block:

```typescript
// Add after the Finance section (after the Disputes SidebarItem):
<SidebarSection label="Reports" />
<SidebarItem href="/admin/reports/financial" icon="💰" label="Financial" active={pathname.startsWith('/admin/reports/financial')} />
<SidebarItem href="/admin/reports/members" icon="📈" label="Members" active={pathname.startsWith('/admin/reports/members')} />
<SidebarItem href="/admin/reports/courses" icon="🏌️" label="Courses" active={pathname.startsWith('/admin/reports/courses')} />
```

- [ ] **Step 3: Create the reports nav page**

```typescript
// src/app/admin/reports/page.tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function AdminReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/app')

  const reports = [
    {
      href: '/admin/reports/financial',
      title: 'Financial Reports',
      description: 'MRR, ARR, revenue by stream, P&L with expense tracking, PDF export',
      icon: '💰',
    },
    {
      href: '/admin/reports/members',
      title: 'Member Reports',
      description: 'Growth, churn, cohort retention, LTV analysis, at-risk members',
      icon: '📈',
    },
    {
      href: '/admin/reports/courses',
      title: 'Course Network Reports',
      description: 'Health scores, all-courses summary, individual course drilldowns',
      icon: '🏌️',
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Reports</h1>
      <p className="text-[#6B7770] mb-8">Platform analytics and reporting for admins.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {reports.map(r => (
          <Link key={r.href} href={r.href}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-[#1B4332] transition-all group">
            <div className="text-3xl mb-3">{r.icon}</div>
            <h2 className="font-semibold text-[#1A1A1A] group-hover:text-[#1B4332] mb-1">{r.title}</h2>
            <p className="text-sm text-[#6B7770]">{r.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Smoke test**

```bash
npm run dev
```

Navigate to `/admin/reports`. Confirm three report cards appear. Confirm new sidebar items appear under "Reports".

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/AdminSidebar.tsx src/app/admin/reports/page.tsx package.json package-lock.json
git commit -m "feat: admin reports nav page and sidebar entries, install @react-pdf/renderer"
```

---

### Task 2: Shared Report Components

**Files:**
- Create: `src/components/reports/KpiTile.tsx`
- Create: `src/components/reports/DateRangePicker.tsx`
- Create: `src/components/reports/CsvExportButton.tsx`
- Create: `src/lib/reports/dateRange.ts`
- Create: `src/lib/reports/__tests__/dateRange.test.ts`

- [ ] **Step 1: Write the failing test for date range logic**

```typescript
// src/lib/reports/__tests__/dateRange.test.ts
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { resolveDateRange } from '../dateRange'

describe('resolveDateRange', () => {
  beforeAll(() => {
    vi.setSystemTime(new Date('2026-04-29T12:00:00Z'))
  })

  it('this_month returns Apr 1 – Apr 29', () => {
    const { from, to } = resolveDateRange('this_month')
    expect(from).toBe('2026-04-01')
    expect(to).toBe('2026-04-29')
  })

  it('last_month returns Mar 1 – Mar 31', () => {
    const { from, to } = resolveDateRange('last_month')
    expect(from).toBe('2026-03-01')
    expect(to).toBe('2026-03-31')
  })

  it('ytd returns Jan 1 – Apr 29', () => {
    const { from, to } = resolveDateRange('ytd')
    expect(from).toBe('2026-01-01')
    expect(to).toBe('2026-04-29')
  })

  it('custom passes through provided dates', () => {
    const { from, to } = resolveDateRange('custom', '2026-02-01', '2026-02-28')
    expect(from).toBe('2026-02-01')
    expect(to).toBe('2026-02-28')
  })

  it('defaults to this_month when preset is unknown', () => {
    const { from } = resolveDateRange(undefined)
    expect(from).toBe('2026-04-01')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/reports/__tests__/dateRange.test.ts
```

Expected: FAIL — `resolveDateRange` not defined

- [ ] **Step 3: Implement dateRange.ts**

```typescript
// src/lib/reports/dateRange.ts
export type DatePreset = 'this_month' | 'last_month' | 'this_quarter' | 'ytd' | 'custom'

export interface DateRange {
  from: string  // YYYY-MM-DD
  to: string
  preset: DatePreset
}

export function resolveDateRange(
  preset: string | undefined,
  customFrom?: string,
  customTo?: string,
): DateRange {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = today.getMonth()   // 0-indexed
  const dd = String(today.getDate()).padStart(2, '0')
  const pad = (n: number) => String(n).padStart(2, '0')
  const toISO = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`
  const lastDayOf = (y: number, m: number) => new Date(y, m + 1, 0).getDate()

  switch (preset) {
    case 'last_month': {
      const lm = mm === 0 ? 11 : mm - 1
      const ly = mm === 0 ? yyyy - 1 : yyyy
      return { from: toISO(ly, lm, 1), to: toISO(ly, lm, lastDayOf(ly, lm)), preset: 'last_month' }
    }
    case 'this_quarter': {
      const qStart = Math.floor(mm / 3) * 3
      return { from: toISO(yyyy, qStart, 1), to: `${yyyy}-${pad(mm + 1)}-${dd}`, preset: 'this_quarter' }
    }
    case 'ytd':
      return { from: `${yyyy}-01-01`, to: `${yyyy}-${pad(mm + 1)}-${dd}`, preset: 'ytd' }
    case 'custom':
      if (customFrom && customTo) {
        return { from: customFrom, to: customTo, preset: 'custom' }
      }
      // fall through to default
    default:
    case 'this_month':
      return { from: toISO(yyyy, mm, 1), to: `${yyyy}-${pad(mm + 1)}-${dd}`, preset: 'this_month' }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/reports/__tests__/dateRange.test.ts
```

Expected: 5 passing

- [ ] **Step 5: Create KpiTile component**

```typescript
// src/components/reports/KpiTile.tsx
interface KpiTileProps {
  label: string
  value: string
  sub?: string
  accent?: boolean
  alert?: boolean
}

export default function KpiTile({ label, value, sub, accent, alert }: KpiTileProps) {
  return (
    <div className={`bg-white rounded-xl border p-5 ${alert ? 'border-red-300 bg-red-50' : accent ? 'border-[#1B4332]' : 'border-gray-200'}`}>
      <p className="text-xs text-[#6B7770] uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${alert ? 'text-red-700' : 'text-[#1A1A1A]'}`}>{value}</p>
      {sub && <p className="text-xs text-[#6B7770] mt-1">{sub}</p>}
    </div>
  )
}
```

- [ ] **Step 6: Create DateRangePicker component**

This is a client component that updates URL search params on selection.

```typescript
// src/components/reports/DateRangePicker.tsx
'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import type { DatePreset } from '@/lib/reports/dateRange'

const PRESETS: { label: string; value: DatePreset }[] = [
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'This Quarter', value: 'this_quarter' },
  { label: 'YTD', value: 'ytd' },
  { label: 'Custom', value: 'custom' },
]

export default function DateRangePicker() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = (searchParams.get('preset') ?? 'this_month') as DatePreset
  const [showCustom, setShowCustom] = useState(current === 'custom')
  const [customFrom, setCustomFrom] = useState(searchParams.get('from') ?? '')
  const [customTo, setCustomTo] = useState(searchParams.get('to') ?? '')

  function navigate(preset: DatePreset, from?: string, to?: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('preset', preset)
    if (preset === 'custom' && from && to) {
      params.set('from', from)
      params.set('to', to)
    } else {
      params.delete('from')
      params.delete('to')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map(p => (
        <button
          key={p.value}
          onClick={() => {
            setShowCustom(p.value === 'custom')
            if (p.value !== 'custom') navigate(p.value)
          }}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            current === p.value
              ? 'bg-[#1B4332] text-[#FAF7F2] border-[#1B4332]'
              : 'bg-white text-[#6B7770] border-gray-200 hover:border-[#1B4332] hover:text-[#1A1A1A]'
          }`}
        >
          {p.label}
        </button>
      ))}
      {showCustom && (
        <div className="flex items-center gap-2">
          <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]" />
          <span className="text-[#6B7770] text-sm">to</span>
          <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]" />
          <button onClick={() => navigate('custom', customFrom, customTo)}
            disabled={!customFrom || !customTo}
            className="px-3 py-1.5 bg-[#1B4332] text-[#FAF7F2] rounded-lg text-sm font-medium disabled:opacity-40">
            Apply
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Create CsvExportButton component**

```typescript
// src/components/reports/CsvExportButton.tsx
'use client'

interface CsvExportButtonProps {
  data: Record<string, string | number | null>[]
  filename: string
  label?: string
}

export default function CsvExportButton({ data, filename, label = 'Export CSV' }: CsvExportButtonProps) {
  function download() {
    if (!data.length) return
    const headers = Object.keys(data[0])
    const rows = data.map(row =>
      headers.map(h => {
        const v = row[h]
        if (v === null || v === undefined) return ''
        const s = String(v)
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
      }).join(',')
    )
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button onClick={download}
      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-[#6B7770] hover:border-[#1B4332] hover:text-[#1A1A1A] transition-colors">
      {label}
    </button>
  )
}
```

- [ ] **Step 8: Commit**

```bash
git add src/lib/reports/ src/components/reports/
git commit -m "feat: shared report components — DateRangePicker, KpiTile, CsvExportButton, dateRange util"
```

---

### Task 3: Financial Report Data Library

**Files:**
- Create: `src/lib/reports/financial.ts`
- Create: `src/lib/reports/__tests__/financial.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/reports/__tests__/financial.test.ts
import { describe, it, expect } from 'vitest'
import { calcMrr, calcGrossMargin, buildPnlRows } from '../financial'

describe('calcMrr', () => {
  it('sums eagle and ace MRR correctly', () => {
    const result = calcMrr({ eagleCount: 10, aceCount: 5 })
    expect(result).toBe(10 * 89 + 5 * 159)  // 890 + 795 = 1685
  })
  it('returns 0 when no paying members', () => {
    expect(calcMrr({ eagleCount: 0, aceCount: 0 })).toBe(0)
  })
})

describe('calcGrossMargin', () => {
  it('returns correct percentage', () => {
    expect(calcGrossMargin({ revenue: 1000, cogs: 300 })).toBeCloseTo(70)
  })
  it('returns 0 when revenue is 0', () => {
    expect(calcGrossMargin({ revenue: 0, cogs: 0 })).toBe(0)
  })
})

describe('buildPnlRows', () => {
  it('calculates net correctly', () => {
    const rows = buildPnlRows({
      revenue: 5000,
      expensesByCategory: { Engineering: 1000, Marketing: 500 },
    })
    expect(rows.totalExpenses).toBe(1500)
    expect(rows.net).toBe(3500)
  })
})
```

- [ ] **Step 2: Run test to verify failure**

```bash
npx vitest run src/lib/reports/__tests__/financial.test.ts
```

Expected: FAIL — functions not defined

- [ ] **Step 3: Implement financial.ts**

```typescript
// src/lib/reports/financial.ts
import { createAdminClient } from '@/lib/supabase/admin'

export const EAGLE_PRICE = 89
export const ACE_PRICE = 159

export const EXPENSE_CATEGORIES = [
  'Engineering',
  'Sales',
  'Marketing',
  'Operations',
  'Infrastructure',
  'G&A',
] as const

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]

export function calcMrr({ eagleCount, aceCount }: { eagleCount: number; aceCount: number }): number {
  return eagleCount * EAGLE_PRICE + aceCount * ACE_PRICE
}

export function calcGrossMargin({ revenue, cogs }: { revenue: number; cogs: number }): number {
  if (revenue === 0) return 0
  return Math.round(((revenue - cogs) / revenue) * 100 * 10) / 10
}

export function buildPnlRows({
  revenue,
  expensesByCategory,
}: {
  revenue: number
  expensesByCategory: Partial<Record<string, number>>
}) {
  const totalExpenses = Object.values(expensesByCategory).reduce((s, v) => s + (v ?? 0), 0)
  return { totalExpenses, net: revenue - totalExpenses }
}

export interface FinancialKpis {
  mrrCurrent: number
  arrCurrent: number
  totalRevenueMtd: number
  grossMarginPct: number
  netBurn: number | null
  eagleCount: number
  aceCount: number
}

export async function getFinancialKpis(from: string, to: string): Promise<FinancialKpis> {
  const admin = createAdminClient()

  const [{ data: memberships }, { data: expenses }] = await Promise.all([
    admin.from('memberships').select('tier, status').eq('status', 'active'),
    admin.from('crm_expenses').select('amount, month').gte('month', from.slice(0, 7)).lte('month', to.slice(0, 7)),
  ])

  const active = memberships ?? []
  const eagleCount = active.filter(m => m.tier === 'eagle').length
  const aceCount = active.filter(m => m.tier === 'ace').length
  const mrr = calcMrr({ eagleCount, aceCount })
  const arr = mrr * 12
  const totalExpenses = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0)
  const grossMarginPct = calcGrossMargin({ revenue: mrr, cogs: 0 })

  return {
    mrrCurrent: mrr,
    arrCurrent: arr,
    totalRevenueMtd: mrr,
    grossMarginPct,
    netBurn: totalExpenses > mrr ? totalExpenses - mrr : null,
    eagleCount,
    aceCount,
  }
}

export interface RevenueByMonth {
  month: string
  membership: number
  outing: number
  affiliate: number
}

export async function getRevenueByMonth(from: string, to: string): Promise<RevenueByMonth[]> {
  const admin = createAdminClient()
  const { data: metrics } = await admin
    .from('crm_member_metrics')
    .select('month, mrr_eagle, mrr_ace')
    .gte('month', from.slice(0, 7))
    .lte('month', to.slice(0, 7))
    .order('month')

  return (metrics ?? []).map(m => ({
    month: m.month,
    membership: Number(m.mrr_eagle) + Number(m.mrr_ace),
    outing: 0,      // populated when outing billing is wired up
    affiliate: 0,
  }))
}

export interface MrrHistory {
  month: string
  mrr: number
  eagle: number
  ace: number
}

export async function getMrrHistory(months = 12): Promise<MrrHistory[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('crm_member_metrics')
    .select('month, mrr_eagle, mrr_ace')
    .order('month', { ascending: false })
    .limit(months)

  return (data ?? []).reverse().map(m => ({
    month: m.month,
    eagle: Number(m.mrr_eagle),
    ace: Number(m.mrr_ace),
    mrr: Number(m.mrr_eagle) + Number(m.mrr_ace),
  }))
}

export interface PnlRow {
  month: string
  revenue: number
  expenses: Partial<Record<ExpenseCategory, number>>
  totalExpenses: number
  net: number
}

export async function getPnlByMonth(from: string, to: string): Promise<PnlRow[]> {
  const admin = createAdminClient()
  const [{ data: metrics }, { data: expenses }] = await Promise.all([
    admin.from('crm_member_metrics').select('month, mrr_eagle, mrr_ace')
      .gte('month', from.slice(0, 7)).lte('month', to.slice(0, 7)).order('month'),
    admin.from('crm_expenses').select('month, category, amount')
      .gte('month', from.slice(0, 7)).lte('month', to.slice(0, 7)),
  ])

  const expMap: Record<string, Partial<Record<ExpenseCategory, number>>> = {}
  for (const e of expenses ?? []) {
    if (!expMap[e.month]) expMap[e.month] = {}
    expMap[e.month][e.category as ExpenseCategory] = Number(e.amount)
  }

  return (metrics ?? []).map(m => {
    const revenue = Number(m.mrr_eagle) + Number(m.mrr_ace)
    const exps = expMap[m.month] ?? {}
    const totalExpenses = Object.values(exps).reduce((s, v) => s + (v ?? 0), 0)
    return { month: m.month, revenue, expenses: exps, totalExpenses, net: revenue - totalExpenses }
  })
}
```

- [ ] **Step 4: Run tests to verify passing**

```bash
npx vitest run src/lib/reports/__tests__/financial.test.ts
```

Expected: all passing

- [ ] **Step 5: Commit**

```bash
git add src/lib/reports/financial.ts src/lib/reports/__tests__/financial.test.ts
git commit -m "feat: financial report data library with MRR, P&L, revenue-by-month queries"
```

---

### Task 4: Financial Report Page — KPIs + Charts

**Files:**
- Create: `src/app/admin/reports/financial/page.tsx`
- Create: `src/app/admin/reports/financial/FinancialCharts.tsx`

- [ ] **Step 1: Create the chart component (client)**

```typescript
// src/app/admin/reports/financial/FinancialCharts.tsx
'use client'

import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { RevenueByMonth, MrrHistory } from '@/lib/reports/financial'

export function RevenueStackedChart({ data }: { data: RevenueByMonth[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, '']} />
        <Legend />
        <Bar dataKey="membership" fill="#1B4332" name="Membership" stackId="a" />
        <Bar dataKey="outing" fill="#E0A800" name="Outing" stackId="a" />
        <Bar dataKey="affiliate" fill="#6B7770" name="Affiliate" stackId="a" />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function MrrAreaChart({ data }: { data: MrrHistory[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, '']} />
        <Legend />
        <Area dataKey="eagle" fill="#E0A800" stroke="#E0A800" fillOpacity={0.3} name="Eagle MRR" stackId="a" />
        <Area dataKey="ace" fill="#1B4332" stroke="#1B4332" fillOpacity={0.3} name="Ace MRR" stackId="a" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 2: Create the financial page**

```typescript
// src/app/admin/reports/financial/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveDateRange } from '@/lib/reports/dateRange'
import { getFinancialKpis, getRevenueByMonth, getMrrHistory, getPnlByMonth, EXPENSE_CATEGORIES } from '@/lib/reports/financial'
import KpiTile from '@/components/reports/KpiTile'
import DateRangePicker from '@/components/reports/DateRangePicker'
import CsvExportButton from '@/components/reports/CsvExportButton'
import { RevenueStackedChart, MrrAreaChart } from './FinancialCharts'
import ExpenseForm from './ExpenseForm'

export default async function FinancialReportPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/app')

  const sp = await searchParams
  const range = resolveDateRange(sp.preset, sp.from, sp.to)

  const [kpis, revenueByMonth, mrrHistory, pnl] = await Promise.all([
    getFinancialKpis(range.from, range.to),
    getRevenueByMonth(range.from, range.to),
    getMrrHistory(12),
    getPnlByMonth(range.from, range.to),
  ])

  const revenueTableData = revenueByMonth.map(r => ({
    Month: r.month,
    'Membership Revenue': r.membership,
    'Outing Revenue': r.outing,
    'Affiliate Revenue': r.affiliate,
    Total: r.membership + r.outing + r.affiliate,
  }))

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Financial Reports</h1>
        <DateRangePicker />
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiTile label="MRR" value={`$${kpis.mrrCurrent.toLocaleString()}`} accent />
        <KpiTile label="ARR" value={`$${kpis.arrCurrent.toLocaleString()}`} />
        <KpiTile label="Total Revenue MTD" value={`$${kpis.totalRevenueMtd.toLocaleString()}`} />
        <KpiTile label="Gross Margin" value={`${kpis.grossMarginPct}%`} />
        {kpis.netBurn !== null && (
          <KpiTile label="Net Burn" value={`$${kpis.netBurn.toLocaleString()}`} alert />
        )}
      </div>

      {/* Revenue by Stream */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[#1A1A1A]">Revenue by Stream</h2>
          <CsvExportButton data={revenueTableData} filename="revenue-by-stream.csv" />
        </div>
        <RevenueStackedChart data={revenueByMonth} />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Month', 'Membership', 'Outing', 'Affiliate', 'Total'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-xs text-[#6B7770] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {revenueByMonth.map(r => (
                <tr key={r.month} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3 text-[#1A1A1A]">{r.month}</td>
                  <td className="py-2 px-3">${r.membership.toLocaleString()}</td>
                  <td className="py-2 px-3">${r.outing.toLocaleString()}</td>
                  <td className="py-2 px-3">${r.affiliate.toLocaleString()}</td>
                  <td className="py-2 px-3 font-medium">${(r.membership + r.outing + r.affiliate).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MRR / ARR Tracker */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-[#1A1A1A] mb-4">MRR / ARR (Last 12 Months)</h2>
        <MrrAreaChart data={mrrHistory} />
      </div>

      {/* P&L */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[#1A1A1A]">P&amp;L View</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-xs text-[#6B7770] font-medium">Month</th>
                <th className="text-right py-2 px-3 text-xs text-[#6B7770] font-medium">Revenue</th>
                {EXPENSE_CATEGORIES.map(c => (
                  <th key={c} className="text-right py-2 px-3 text-xs text-[#6B7770] font-medium">{c}</th>
                ))}
                <th className="text-right py-2 px-3 text-xs text-[#6B7770] font-medium">Total Expenses</th>
                <th className="text-right py-2 px-3 text-xs text-[#6B7770] font-medium">Net</th>
              </tr>
            </thead>
            <tbody>
              {pnl.map(row => (
                <tr key={row.month} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3">{row.month}</td>
                  <td className="py-2 px-3 text-right text-emerald-700">${row.revenue.toLocaleString()}</td>
                  {EXPENSE_CATEGORIES.map(c => (
                    <td key={c} className="py-2 px-3 text-right">${(row.expenses[c] ?? 0).toLocaleString()}</td>
                  ))}
                  <td className="py-2 px-3 text-right font-medium">${row.totalExpenses.toLocaleString()}</td>
                  <td className={`py-2 px-3 text-right font-semibold ${row.net >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    ${row.net.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Input Form */}
      <ExpenseForm />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/reports/financial/
git commit -m "feat: financial report page — KPIs, revenue chart, MRR chart, P&L table"
```

---

### Task 5: Expense Input Form + Save Action

**Files:**
- Create: `src/app/admin/reports/financial/ExpenseForm.tsx`
- Create: `src/app/admin/reports/financial/expenseActions.ts`

- [ ] **Step 1: Create the server action**

```typescript
// src/app/admin/reports/financial/expenseActions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '@/lib/reports/financial'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin, email').eq('id', user.id).single()
  if (!profile?.is_admin) throw new Error('Forbidden')
  return profile.email ?? user.email ?? 'admin'
}

export async function saveExpenses(
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  let createdBy: string
  try { createdBy = await assertAdmin() } catch { return { error: 'Unauthorized' } }

  const month = formData.get('month') as string
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return { error: 'Invalid month format (YYYY-MM required)' }

  const admin = createAdminClient()
  const upserts = EXPENSE_CATEGORIES.map(category => ({
    category,
    month,
    amount: Number(formData.get(`expense_${category}`) ?? 0),
    notes: (formData.get(`notes_${category}`) as string) ?? '',
    created_by: createdBy,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await admin.from('crm_expenses').upsert(upserts, { onConflict: 'category,month' })
  if (error) return { error: error.message }

  revalidatePath('/admin/reports/financial')
  return { success: true }
}
```

- [ ] **Step 2: Create ExpenseForm client component**

```typescript
// src/app/admin/reports/financial/ExpenseForm.tsx
'use client'

import { useState } from 'react'
import { saveExpenses } from './expenseActions'
import { EXPENSE_CATEGORIES } from '@/lib/reports/financial'

export default function ExpenseForm() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<{ error?: string; success?: boolean } | null>(null)
  const [loading, setLoading] = useState(false)

  // Default month to current YYYY-MM
  const defaultMonth = new Date().toISOString().slice(0, 7)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    const result = await saveExpenses(new FormData(e.currentTarget))
    setStatus(result)
    setLoading(false)
    if (result.success) setTimeout(() => { setOpen(false); setStatus(null) }, 1500)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold text-[#1A1A1A]">Log Expenses</h2>
        <button onClick={() => setOpen(v => !v)}
          className="text-sm text-[#1B4332] font-medium hover:underline">
          {open ? 'Hide' : 'Enter expenses'}
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {status?.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{status.error}</div>
          )}
          {status?.success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm text-emerald-800">Expenses saved.</div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Month</label>
            <input name="month" type="month" defaultValue={defaultMonth} required
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {EXPENSE_CATEGORIES.map(category => (
              <div key={category}>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">{category}</label>
                <input name={`expense_${category}`} type="number" min="0" step="0.01" defaultValue="0"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]" />
              </div>
            ))}
          </div>

          <button type="submit" disabled={loading}
            className="bg-[#1B4332] text-[#FAF7F2] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#163829] disabled:opacity-50">
            {loading ? 'Saving…' : 'Save Expenses'}
          </button>
        </form>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Smoke test expense form**

Visit `/admin/reports/financial`, click "Enter expenses", fill in a few fields for current month, submit. Confirm success message appears and page revalidates.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/reports/financial/ExpenseForm.tsx src/app/admin/reports/financial/expenseActions.ts
git commit -m "feat: expense log form with per-category monthly input, saves to crm_expenses"
```

---

### Task 6: Financial P&L PDF Export

**Files:**
- Create: `src/app/admin/reports/financial/PnlPdf.tsx`
- Create: `src/app/api/reports/financial/pnl-pdf/route.ts`

- [ ] **Step 1: Create the PDF document component**

```typescript
// src/app/admin/reports/financial/PnlPdf.tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { PnlRow } from '@/lib/reports/financial'
import { EXPENSE_CATEGORIES } from '@/lib/reports/financial'

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1A1A1A' },
  header: { marginBottom: 24 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1B4332', marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#6B7770' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 4 },
  row: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  cell: { flex: 1, paddingHorizontal: 4 },
  cellRight: { flex: 1, paddingHorizontal: 4, textAlign: 'right' },
  headerRow: { flexDirection: 'row', paddingVertical: 4, backgroundColor: '#F9FAFB', marginBottom: 2 },
  bold: { fontWeight: 'bold' },
  positive: { color: '#065F46' },
  negative: { color: '#991B1B' },
})

export default function PnlPdf({ rows, generatedAt }: { rows: PnlRow[]; generatedAt: string }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>
        <View style={s.header}>
          <Text style={s.title}>TeeAhead — P&L Report</Text>
          <Text style={s.subtitle}>Generated {generatedAt}</Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Monthly P&L</Text>
          <View style={s.headerRow}>
            <Text style={[s.cell, s.bold]}>Month</Text>
            <Text style={[s.cellRight, s.bold]}>Revenue</Text>
            {EXPENSE_CATEGORIES.map(c => (
              <Text key={c} style={[s.cellRight, s.bold]}>{c}</Text>
            ))}
            <Text style={[s.cellRight, s.bold]}>Expenses</Text>
            <Text style={[s.cellRight, s.bold]}>Net</Text>
          </View>
          {rows.map(row => (
            <View key={row.month} style={s.row}>
              <Text style={s.cell}>{row.month}</Text>
              <Text style={[s.cellRight, s.positive]}>${row.revenue.toLocaleString()}</Text>
              {EXPENSE_CATEGORIES.map(c => (
                <Text key={c} style={s.cellRight}>${(row.expenses[c] ?? 0).toLocaleString()}</Text>
              ))}
              <Text style={s.cellRight}>${row.totalExpenses.toLocaleString()}</Text>
              <Text style={[s.cellRight, row.net >= 0 ? s.positive : s.negative]}>
                ${row.net.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )
}
```

- [ ] **Step 2: Create the PDF API route**

```typescript
// src/app/api/reports/financial/pnl-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveDateRange } from '@/lib/reports/dateRange'
import { getPnlByMonth } from '@/lib/reports/financial'
import PnlPdf from '@/app/admin/reports/financial/PnlPdf'
import { createElement } from 'react'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return new NextResponse('Forbidden', { status: 403 })

  const sp = req.nextUrl.searchParams
  const range = resolveDateRange(sp.get('preset') ?? undefined, sp.get('from') ?? undefined, sp.get('to') ?? undefined)
  const rows = await getPnlByMonth(range.from, range.to)

  const buffer = await renderToBuffer(
    createElement(PnlPdf, { rows, generatedAt: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) })
  )

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="teeahead-pnl-${range.from}-${range.to}.pdf"`,
    },
  })
}
```

- [ ] **Step 3: Add "Export as PDF" button to the P&L section**

In `src/app/admin/reports/financial/page.tsx`, update the P&L section header to include a link to the PDF route:

```typescript
// Replace the P&L section header div with:
<div className="flex items-center justify-between mb-4">
  <h2 className="font-semibold text-[#1A1A1A]">P&amp;L View</h2>
  <a
    href={`/api/reports/financial/pnl-pdf?preset=${range.preset}${range.preset === 'custom' ? `&from=${range.from}&to=${range.to}` : ''}`}
    target="_blank"
    rel="noopener noreferrer"
    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-[#6B7770] hover:border-[#1B4332] hover:text-[#1A1A1A] transition-colors"
  >
    Export as PDF
  </a>
</div>
```

- [ ] **Step 4: Test PDF download**

Visit `/admin/reports/financial`, click "Export as PDF". Confirm a PDF downloads with the TeeAhead header, a P&L table, and correct month formatting.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/reports/financial/PnlPdf.tsx src/app/api/reports/financial/pnl-pdf/route.ts src/app/admin/reports/financial/page.tsx
git commit -m "feat: financial P&L PDF export via @react-pdf/renderer"
```

---

### Task 7: Member Report Data Library

**Files:**
- Create: `src/lib/reports/members.ts`
- Create: `src/lib/reports/__tests__/members.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/reports/__tests__/members.test.ts
import { describe, it, expect } from 'vitest'
import { calcChurnRate, calcLtv, labelHealthStatus } from '../members'

describe('calcChurnRate', () => {
  it('returns percentage of churned from total', () => {
    expect(calcChurnRate({ churned: 10, total: 100 })).toBeCloseTo(10)
  })
  it('returns 0 when total is 0', () => {
    expect(calcChurnRate({ churned: 0, total: 0 })).toBe(0)
  })
})

describe('calcLtv', () => {
  it('multiplies monthly price by avg months retained', () => {
    expect(calcLtv({ monthlyPrice: 89, avgMonthsRetained: 14 })).toBe(1246)
  })
})

describe('labelHealthStatus', () => {
  it('labels At Risk correctly', () => {
    expect(labelHealthStatus(45)).toBe('at_risk')
  })
  it('labels Healthy correctly', () => {
    expect(labelHealthStatus(0)).toBe('healthy')
  })
})
```

- [ ] **Step 2: Run test to verify failure**

```bash
npx vitest run src/lib/reports/__tests__/members.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement members.ts**

```typescript
// src/lib/reports/members.ts
import { createAdminClient } from '@/lib/supabase/admin'
import { EAGLE_PRICE, ACE_PRICE } from './financial'

export function calcChurnRate({ churned, total }: { churned: number; total: number }): number {
  if (total === 0) return 0
  return Math.round((churned / total) * 100 * 10) / 10
}

export function calcLtv({ monthlyPrice, avgMonthsRetained }: { monthlyPrice: number; avgMonthsRetained: number }): number {
  return monthlyPrice * avgMonthsRetained
}

export function labelHealthStatus(daysSinceActivity: number): 'healthy' | 'at_risk' | 'lapsed' {
  if (daysSinceActivity >= 60) return 'lapsed'
  if (daysSinceActivity >= 45) return 'at_risk'
  return 'healthy'
}

export interface MemberKpis {
  totalPaying: number
  mrr: number
  churnRatePct: number
  atRiskCount: number
  eagleCount: number
  aceCount: number
  freeCount: number
}

export async function getMemberKpis(): Promise<MemberKpis> {
  const admin = createAdminClient()
  const { data: memberships } = await admin
    .from('memberships').select('tier, status, updated_at')
  const active = (memberships ?? []).filter(m => m.status === 'active')
  const eagleCount = active.filter(m => m.tier === 'eagle').length
  const aceCount = active.filter(m => m.tier === 'ace').length
  const freeCount = active.filter(m => m.tier === 'fairway' || m.tier === 'free').length
  const totalPaying = eagleCount + aceCount
  const mrr = eagleCount * EAGLE_PRICE + aceCount * ACE_PRICE
  const canceled = (memberships ?? []).filter(m => m.status === 'canceled').length
  const churnRatePct = calcChurnRate({ churned: canceled, total: (memberships ?? []).length })

  const cutoff45 = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
  const { count: atRiskCount } = await admin
    .from('memberships')
    .select('id', { count: 'exact', head: true })
    .eq('tier', 'eagle')
    .eq('status', 'active')
    .lt('updated_at', cutoff45)

  return { totalPaying, mrr, churnRatePct, atRiskCount: atRiskCount ?? 0, eagleCount, aceCount, freeCount }
}

export interface MemberGrowthRow {
  month: string
  totalActive: number
  newFree: number
  newEagle: number
  newAce: number
  churned: number
}

export async function getMemberGrowth(months = 12): Promise<MemberGrowthRow[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('crm_member_metrics')
    .select('month, total_active, new_members_free, new_members_eagle, new_members_ace, churned_members')
    .order('month', { ascending: false })
    .limit(months)
  return (data ?? []).reverse().map(m => ({
    month: m.month,
    totalActive: m.total_active,
    newFree: m.new_members_free,
    newEagle: m.new_members_eagle,
    newAce: m.new_members_ace,
    churned: m.churned_members,
  }))
}

export interface AtRiskMember {
  id: string
  name: string | null
  email: string
  tier: string
  joinedAt: string
  daysSinceActivity: number
}

export async function getAtRiskMembers(): Promise<AtRiskMember[]> {
  const admin = createAdminClient()
  const cutoff = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
  const { data } = await admin
    .from('memberships')
    .select('id, tier, created_at, profiles(full_name, email)')
    .eq('tier', 'eagle')
    .eq('status', 'active')
    .lt('updated_at', cutoff)
    .limit(100)

  return (data ?? []).map((m: any) => ({
    id: m.id,
    name: m.profiles?.full_name ?? null,
    email: m.profiles?.email ?? '',
    tier: m.tier,
    joinedAt: m.created_at,
    daysSinceActivity: Math.floor((Date.now() - new Date(m.updated_at ?? m.created_at).getTime()) / (1000 * 60 * 60 * 24)),
  }))
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/lib/reports/__tests__/members.test.ts
```

Expected: all passing

- [ ] **Step 5: Commit**

```bash
git add src/lib/reports/members.ts src/lib/reports/__tests__/members.test.ts
git commit -m "feat: member report data library — KPIs, growth, at-risk members"
```

---

### Task 8: Member Report Page

**Files:**
- Create: `src/app/admin/reports/members/page.tsx`
- Create: `src/app/admin/reports/members/MemberCharts.tsx`

- [ ] **Step 1: Create chart component**

```typescript
// src/app/admin/reports/members/MemberCharts.tsx
'use client'

import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { MemberGrowthRow } from '@/lib/reports/members'

const TIER_COLORS = { free: '#E5E7EB', eagle: '#E0A800', ace: '#1B4332' }

export function GrowthLineChart({ data }: { data: MemberGrowthRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Line dataKey="totalActive" stroke="#1B4332" name="Total Active" strokeWidth={2} dot={false} />
        <Line dataKey="newEagle" stroke="#E0A800" name="New Eagle" strokeWidth={1} dot={false} />
        <Line dataKey="newAce" stroke="#6B7770" name="New Ace" strokeWidth={1} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function ChurnLineChart({ data }: { data: { month: string; churnPct: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v: number) => [`${v}%`, 'Churn Rate']} />
        <Line dataKey="churnPct" stroke="#EF4444" strokeWidth={2} dot={false} name="Churn %" />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function TierDonut({ eagle, ace, free }: { eagle: number; ace: number; free: number }) {
  const pieData = [
    { name: 'Ace', value: ace, color: '#1B4332' },
    { name: 'Eagle', value: eagle, color: '#E0A800' },
    { name: 'Free', value: free, color: '#E5E7EB' },
  ]
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
          {pieData.map(entry => <Cell key={entry.name} fill={entry.color} />)}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 2: Create the members report page**

```typescript
// src/app/admin/reports/members/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveDateRange } from '@/lib/reports/dateRange'
import { getMemberKpis, getMemberGrowth, getAtRiskMembers } from '@/lib/reports/members'
import KpiTile from '@/components/reports/KpiTile'
import DateRangePicker from '@/components/reports/DateRangePicker'
import CsvExportButton from '@/components/reports/CsvExportButton'
import { GrowthLineChart, ChurnLineChart, TierDonut } from './MemberCharts'

export default async function MemberReportPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/app')

  const sp = await searchParams
  const range = resolveDateRange(sp.preset, sp.from, sp.to)

  const [kpis, growth, atRisk] = await Promise.all([
    getMemberKpis(),
    getMemberGrowth(12),
    getAtRiskMembers(),
  ])

  const churnData = growth.map(g => ({
    month: g.month,
    churnPct: g.totalActive > 0 ? Math.round((g.churned / g.totalActive) * 100 * 10) / 10 : 0,
  }))

  const atRiskCsvData = atRisk.map(m => ({
    Name: m.name ?? '',
    Email: m.email,
    Tier: m.tier,
    'Joined': m.joinedAt.slice(0, 10),
    'Days Since Activity': m.daysSinceActivity,
  }))

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Member Reports</h1>
        <DateRangePicker />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiTile label="Total Paying Members" value={kpis.totalPaying.toString()} accent />
        <KpiTile label="MRR" value={`$${kpis.mrr.toLocaleString()}`} />
        <KpiTile label="Churn Rate" value={`${kpis.churnRatePct}%`} sub="all time" />
        <KpiTile label="At-Risk Members" value={kpis.atRiskCount.toString()} alert={kpis.atRiskCount > 0} sub="Eagle, no activity 45+ days" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="sm:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-[#1A1A1A] mb-4">Member Growth (12 months)</h2>
          <GrowthLineChart data={growth} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-[#1A1A1A] mb-4">Tier Mix</h2>
          <TierDonut eagle={kpis.eagleCount} ace={kpis.aceCount} free={kpis.freeCount} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-[#1A1A1A] mb-4">Churn Rate (12 months)</h2>
        <ChurnLineChart data={churnData} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[#1A1A1A]">At-Risk Eagle Members</h2>
          <CsvExportButton data={atRiskCsvData} filename="at-risk-members.csv" label="Export for Win-Back" />
        </div>
        {atRisk.length === 0 ? (
          <p className="text-sm text-[#6B7770]">No at-risk members. Great retention!</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Name', 'Email', 'Joined', 'Days Inactive'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-xs text-[#6B7770] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {atRisk.map(m => (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3">{m.name ?? '—'}</td>
                  <td className="py-2 px-3 text-[#6B7770]">{m.email}</td>
                  <td className="py-2 px-3 text-[#6B7770]">{m.joinedAt.slice(0, 10)}</td>
                  <td className="py-2 px-3 font-medium text-amber-700">{m.daysSinceActivity}d</td>
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
git add src/app/admin/reports/members/
git commit -m "feat: member report page — KPIs, growth chart, churn, at-risk table with CSV export"
```

---

### Task 9: Course Network Reports — Health Score + Summary Table

**Files:**
- Create: `src/lib/reports/courses.ts`
- Create: `src/lib/reports/__tests__/courses.test.ts`
- Create: `src/app/admin/reports/courses/page.tsx`
- Create: `src/app/admin/reports/courses/[id]/page.tsx`

- [ ] **Step 1: Write failing tests for health score**

```typescript
// src/lib/reports/__tests__/courses.test.ts
import { describe, it, expect } from 'vitest'
import { calcHealthScore, healthLabel } from '../courses'

describe('calcHealthScore', () => {
  it('returns 100 for max inputs', () => {
    expect(calcHealthScore({ roundsScore: 100, membersScore: 100, revenueScore: 100, waitlistFillRate: 100, daysSinceActivity: 0 })).toBe(100)
  })

  it('weights rounds at 30%', () => {
    expect(calcHealthScore({ roundsScore: 100, membersScore: 0, revenueScore: 0, waitlistFillRate: 0, daysSinceActivity: 999 })).toBe(30)
  })

  it('weights members at 25%', () => {
    expect(calcHealthScore({ roundsScore: 0, membersScore: 100, revenueScore: 0, waitlistFillRate: 0, daysSinceActivity: 999 })).toBe(25)
  })

  it('clamps to 0-100', () => {
    expect(calcHealthScore({ roundsScore: 200, membersScore: 200, revenueScore: 200, waitlistFillRate: 200, daysSinceActivity: -10 })).toBe(100)
  })
})

describe('healthLabel', () => {
  it('marks 70+ as healthy', () => { expect(healthLabel(75)).toBe('healthy') })
  it('marks 40-69 as at_risk', () => { expect(healthLabel(55)).toBe('at_risk') })
  it('marks 0-39 as critical', () => { expect(healthLabel(30)).toBe('critical') })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
npx vitest run src/lib/reports/__tests__/courses.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement courses.ts**

```typescript
// src/lib/reports/courses.ts
import { createAdminClient } from '@/lib/supabase/admin'

export type HealthLabel = 'healthy' | 'at_risk' | 'critical'

export function healthLabel(score: number): HealthLabel {
  if (score >= 70) return 'healthy'
  if (score >= 40) return 'at_risk'
  return 'critical'
}

export function calcHealthScore(opts: {
  roundsScore: number   // 0-100 relative to network average
  membersScore: number
  revenueScore: number
  waitlistFillRate: number  // 0-100 actual pct
  daysSinceActivity: number // 0 = today; higher = worse
}): number {
  const activityScore = Math.max(0, 100 - opts.daysSinceActivity * 10)
  const raw =
    opts.roundsScore * 0.30 +
    opts.membersScore * 0.25 +
    opts.revenueScore * 0.25 +
    Math.min(100, opts.waitlistFillRate) * 0.10 +
    Math.min(100, activityScore) * 0.10
  return Math.min(100, Math.max(0, Math.round(raw)))
}

export interface CourseNetworkKpis {
  totalActive: number
  totalRoundsMtd: number
  totalRevenueMtd: number
  avgHealthScore: number
  criticalOrAtRiskCount: number
}

export interface CourseSummaryRow {
  id: string
  name: string
  slug: string
  roundsMtd: number
  revenueMtd: number
  membersAttributed: number
  pointsEarned: number
  pointsRedeemed: number
  waitlistFills: number
  healthScore: number
  healthLabel: HealthLabel
}

export async function getCourseNetworkData(month: string): Promise<{
  kpis: CourseNetworkKpis
  rows: CourseSummaryRow[]
}> {
  const admin = createAdminClient()
  const [{ data: courses }, { data: metrics }, { data: auditLog }] = await Promise.all([
    admin.from('courses').select('id, name, slug').eq('active', true).order('name'),
    admin.from('crm_course_metrics').select('*').eq('month', month),
    admin.from('admin_audit_log').select('course_id, created_at').order('created_at', { ascending: false }),
  ])

  const metricsMap = Object.fromEntries((metrics ?? []).map(m => [m.course_id, m]))
  const lastActivityMap: Record<string, number> = {}
  for (const log of auditLog ?? []) {
    if (log.course_id && !lastActivityMap[log.course_id]) {
      lastActivityMap[log.course_id] = Math.floor((Date.now() - new Date(log.created_at).getTime()) / (1000 * 60 * 60 * 24))
    }
  }

  const networkRounds = (metrics ?? []).map(m => m.rounds_booked)
  const maxRounds = Math.max(...networkRounds, 1)
  const networkRevenue = (metrics ?? []).map(m => Number(m.green_fee_revenue))
  const maxRevenue = Math.max(...networkRevenue, 1)
  const networkMembers = (metrics ?? []).map(m => m.members_attributed)
  const maxMembers = Math.max(...networkMembers, 1)

  const rows: CourseSummaryRow[] = (courses ?? []).map(c => {
    const m = metricsMap[c.id]
    const rounds = m?.rounds_booked ?? 0
    const revenue = Number(m?.green_fee_revenue ?? 0)
    const members = m?.members_attributed ?? 0
    const waitlistFills = m?.waitlist_fills ?? 0
    const totalCancellations = m?.total_cancellations ?? 0
    const fillRate = totalCancellations > 0 ? (waitlistFills / totalCancellations) * 100 : 0
    const daysSince = lastActivityMap[c.id] ?? 30

    const score = calcHealthScore({
      roundsScore: (rounds / maxRounds) * 100,
      membersScore: (members / maxMembers) * 100,
      revenueScore: (revenue / maxRevenue) * 100,
      waitlistFillRate: fillRate,
      daysSinceActivity: daysSince,
    })

    return {
      id: c.id,
      name: c.name,
      slug: c.slug ?? c.id,
      roundsMtd: rounds,
      revenueMtd: revenue,
      membersAttributed: members,
      pointsEarned: m?.points_earned ?? 0,
      pointsRedeemed: m?.points_redeemed ?? 0,
      waitlistFills,
      healthScore: score,
      healthLabel: healthLabel(score),
    }
  })

  const totalRoundsMtd = rows.reduce((s, r) => s + r.roundsMtd, 0)
  const totalRevenueMtd = rows.reduce((s, r) => s + r.revenueMtd, 0)
  const avgHealthScore = rows.length > 0 ? Math.round(rows.reduce((s, r) => s + r.healthScore, 0) / rows.length) : 0
  const criticalOrAtRiskCount = rows.filter(r => r.healthLabel !== 'healthy').length

  return {
    kpis: { totalActive: rows.length, totalRoundsMtd, totalRevenueMtd, avgHealthScore, criticalOrAtRiskCount },
    rows,
  }
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/lib/reports/__tests__/courses.test.ts
```

Expected: all passing

- [ ] **Step 5: Create courses overview page**

```typescript
// src/app/admin/reports/courses/page.tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCourseNetworkData } from '@/lib/reports/courses'
import KpiTile from '@/components/reports/KpiTile'
import CsvExportButton from '@/components/reports/CsvExportButton'

const HEALTH_BADGE: Record<string, string> = {
  healthy: 'bg-emerald-100 text-emerald-800',
  at_risk: 'bg-amber-100 text-amber-800',
  critical: 'bg-red-100 text-red-800',
}
const HEALTH_LABEL: Record<string, string> = {
  healthy: 'Healthy',
  at_risk: 'At Risk',
  critical: 'Critical',
}

export default async function CourseNetworkReportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/app')

  const currentMonth = new Date().toISOString().slice(0, 7)
  const { kpis, rows } = await getCourseNetworkData(currentMonth)

  const csvData = rows.map(r => ({
    Course: r.name,
    'Rounds MTD': r.roundsMtd,
    'Revenue MTD': r.revenueMtd,
    'Members Attributed': r.membersAttributed,
    'Points Earned': r.pointsEarned,
    'Points Redeemed': r.pointsRedeemed,
    'Waitlist Fills': r.waitlistFills,
    'Health Score': r.healthScore,
    Status: HEALTH_LABEL[r.healthLabel],
  }))

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Course Network — {currentMonth}</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiTile label="Active Partner Courses" value={kpis.totalActive.toString()} accent />
        <KpiTile label="Rounds Booked MTD" value={kpis.totalRoundsMtd.toLocaleString()} />
        <KpiTile label="Green Fee Revenue MTD" value={`$${kpis.totalRevenueMtd.toLocaleString()}`} />
        <KpiTile label="Avg Health Score" value={`${kpis.avgHealthScore}/100`} />
        {kpis.criticalOrAtRiskCount > 0 && (
          <KpiTile label="Courses Flagged" value={kpis.criticalOrAtRiskCount.toString()} alert sub="Critical or At Risk" />
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[#1A1A1A]">All Courses</h2>
          <CsvExportButton data={csvData} filename={`course-network-${currentMonth}.csv`} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Course', 'Rounds MTD', 'Revenue MTD', 'Members', 'Pts Earned', 'Pts Redeemed', 'Waitlist Fills', 'Health'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-xs text-[#6B7770] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer">
                  <td className="py-2 px-3">
                    <Link href={`/admin/reports/courses/${r.id}`} className="font-medium text-[#1B4332] hover:underline">
                      {r.name}
                    </Link>
                  </td>
                  <td className="py-2 px-3">{r.roundsMtd.toLocaleString()}</td>
                  <td className="py-2 px-3">${r.revenueMtd.toLocaleString()}</td>
                  <td className="py-2 px-3">{r.membersAttributed}</td>
                  <td className="py-2 px-3">{r.pointsEarned.toLocaleString()}</td>
                  <td className="py-2 px-3">{r.pointsRedeemed.toLocaleString()}</td>
                  <td className="py-2 px-3">{r.waitlistFills}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${HEALTH_BADGE[r.healthLabel]}`}>
                      {HEALTH_LABEL[r.healthLabel]} {r.healthScore}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create the individual course drilldown page**

```typescript
// src/app/admin/reports/courses/[id]/page.tsx
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import KpiTile from '@/components/reports/KpiTile'
import CsvExportButton from '@/components/reports/CsvExportButton'
import { healthLabel } from '@/lib/reports/courses'

export default async function CourseDrilldownPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/app')

  const { data: course } = await admin.from('courses').select('id, name, slug').eq('id', id).single()
  if (!course) notFound()

  const { data: metrics } = await admin
    .from('crm_course_metrics')
    .select('*')
    .eq('course_id', id)
    .order('month', { ascending: false })
    .limit(12)

  const latest = metrics?.[0]
  const csvData = (metrics ?? []).map(m => ({
    Month: m.month,
    'Rounds Booked': m.rounds_booked,
    'Revenue': m.green_fee_revenue,
    'Members Attributed': m.members_attributed,
    'Waitlist Fills': m.waitlist_fills,
  }))

  const avgGreenFee = latest?.avg_green_fee ?? 0
  const golfnowCostMtd = latest ? latest.rounds_booked * avgGreenFee * 0.20 : 0

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/admin/reports/courses" className="text-[#6B7770] hover:text-[#1A1A1A] text-sm">← All Courses</Link>
        <span className="text-[#6B7770]">/</span>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">{course.name}</h1>
      </div>

      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiTile label="Rounds MTD" value={latest.rounds_booked.toLocaleString()} accent />
          <KpiTile label="Revenue MTD" value={`$${Number(latest.green_fee_revenue).toLocaleString()}`} />
          <KpiTile label="Members Attributed" value={latest.members_attributed.toString()} />
          <KpiTile label="Waitlist Fills" value={latest.waitlist_fills.toString()} />
        </div>
      )}

      {/* GolfNow Comparison Panel */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <h2 className="font-semibold text-[#1A1A1A] mb-2">What GolfNow Would Have Cost This Month</h2>
        <p className="text-sm text-[#6B7770] mb-4">
          GolfNow charges ~20% of green fee value as barter. Based on {latest?.rounds_booked ?? 0} rounds × ${avgGreenFee}/avg green fee:
        </p>
        <div className="text-3xl font-bold text-amber-700 mb-2">${golfnowCostMtd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        <p className="text-sm text-[#6B7770]">in tee time value surrendered if on GolfNow</p>
        <p className="text-sm font-semibold text-emerald-700 mt-3">Your TeeAhead cost this month: $0</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[#1A1A1A]">Monthly History</h2>
          <CsvExportButton data={csvData} filename={`${course.slug}-history.csv`} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Month', 'Rounds', 'Revenue', 'Members', 'Waitlist Fills'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-xs text-[#6B7770] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(metrics ?? []).map(m => (
                <tr key={m.month} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3">{m.month}</td>
                  <td className="py-2 px-3">{m.rounds_booked.toLocaleString()}</td>
                  <td className="py-2 px-3">${Number(m.green_fee_revenue).toLocaleString()}</td>
                  <td className="py-2 px-3">{m.members_attributed}</td>
                  <td className="py-2 px-3">{m.waitlist_fills}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm text-[#6B7770]">
        View the full course portal:{' '}
        <Link href={`/course/${course.slug}/reports`} className="text-[#1B4332] hover:underline">
          /course/{course.slug}/reports
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Run all tests**

```bash
npx vitest run src/lib/reports/
```

Expected: all passing

- [ ] **Step 8: Commit**

```bash
git add src/lib/reports/courses.ts src/lib/reports/__tests__/courses.test.ts src/app/admin/reports/courses/
git commit -m "feat: course network report — health scores, summary table, drilldown with GolfNow calculator"
```

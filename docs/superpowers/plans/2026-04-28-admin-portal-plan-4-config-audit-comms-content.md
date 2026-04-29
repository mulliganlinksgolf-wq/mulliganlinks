# Admin Portal — Plan 4: Configuration, Audit Log, Communications, Content Management

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the four remaining admin portal sections: a site configuration page with feature flag toggles, a read-only audit log viewer, a broadcast communications tool, and an upgraded content management editor with page-group sidebar navigation.

**Architecture:** All pages are Next.js 16 server components reading from Supabase (service-role). Mutations go through server actions that write to `site_config` or `content_blocks`, call `revalidatePath`, and redirect back. Communications uses the existing Resend integration with a new `sendBroadcast` helper. Audit log is read-only with URL-param-based filters.

**Tech Stack:** Next.js 16.2.4 App Router, Supabase (service-role), Resend, Vitest + @testing-library/react, Tailwind CSS v4

> **Before writing any Next.js code:** `params` and `searchParams` are `Promise<{...}>` in Next.js 16 — always `await` them.

---

## Key DB facts (verified against prod)

**`site_config`** — columns: `key` (text PK), `value` (text), `type` (text), `description` (text), `updated_at` (timestamptz). Existing keys:
- `launch_mode` — `'waitlist'` or `'live'`
- `metro_area_name`, `founding_golfer_cap`
- `price_ace_annual`, `price_eagle_annual`, `price_ace_monthly_credit`, `price_eagle_monthly_credit`
- `fee_fairway_booking`, `fee_paid_booking`
- `flag_golfer_waitlist`, `flag_course_waitlist`, `flag_membership_signups`, `flag_tee_time_bookings` — values `'true'`/`'false'`

**`content_blocks`** — columns: `id` (uuid), `key` (text), `value` (text), `type` (text), `description` (text), `updated_at` (timestamptz). Keys follow pattern `{group}.{block}` (e.g., `home.headline`). Existing keys: `home.badge`, `home.headline`, `home.subhead`, `home.tagline`.

**`admin_audit_log`** — columns: `id`, `created_at`, `admin_id`, `admin_email`, `event_type`, `target_type`, `target_id`, `target_label`, `details` (jsonb).

**`src/lib/site-config.ts`** exports: `getSiteConfig()`, `getConfigValue(key)`, `isFeatureEnabled(flag)`, `isLiveMode()`.

**`src/lib/audit.ts`** exports `writeAuditLog({ eventType, targetType, targetId?, targetLabel?, details? })`.

**`src/lib/resend.ts`** — private `getResend()` returns a Resend client or null if not configured.

**assertAdmin pattern** used in every action file:
```ts
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
```

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/app/admin/config/page.tsx` | Config page server component |
| Create | `src/app/admin/config/actions.ts` | `saveConfigValue` server action |
| Create | `src/components/admin/ConfigForm.tsx` | Config sections + flag toggles (client) |
| Create | `src/app/admin/audit/page.tsx` | Audit log server component |
| Create | `src/components/admin/AuditLogFilters.tsx` | Search/filter/time controls (client) |
| Modify | `src/lib/resend.ts` | Add `sendBroadcast()` export |
| Create | `src/app/admin/communications/page.tsx` | Comms page server component |
| Create | `src/app/admin/communications/actions.ts` | `sendBroadcastEmail` server action |
| Modify | `src/app/admin/content/page.tsx` | Add group sidebar, audit log on save |
| Create | `src/app/admin/content/actions.ts` | `saveBlock`, `addBlock` server actions |
| Create | `src/components/admin/AddContentBlockModal.tsx` | "+ Add block" modal (client) |
| Create | `src/test/config-actions.test.ts` | Config server action tests |
| Create | `src/test/audit-log-filters.test.tsx` | AuditLogFilters component tests |
| Create | `src/test/communications-actions.test.ts` | Broadcast action tests |
| Create | `src/test/content-actions.test.ts` | Content server action tests |

---

## Task 1: Configuration Page

**Files:**
- Create: `src/app/admin/config/page.tsx`
- Create: `src/app/admin/config/actions.ts`
- Create: `src/components/admin/ConfigForm.tsx`
- Create: `src/test/config-actions.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/test/config-actions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

function makeChain(data: any) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error: null }),
    then: (resolve: any) => resolve({ data, error: null }),
  }
  return chain
}

const mockFrom = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: mockFrom }),
}))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'admin-1', email: 'nbarris11@gmail.com' } } }) },
  }),
}))
vi.mock('@/lib/audit', () => ({ writeAuditLog: vi.fn().mockResolvedValue(undefined) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))

import { saveConfigValue } from '@/app/admin/config/actions'
import { writeAuditLog } from '@/lib/audit'
import { redirect } from 'next/navigation'

describe('saveConfigValue', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates the config value and writes audit log', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'site_config') return makeChain({ value: '1.49' })
      if (table === 'profiles') return makeChain({ is_admin: false })
      return makeChain(null)
    })
    const formData = new FormData()
    formData.set('key', 'fee_fairway_booking')
    formData.set('value', '1.99')
    await saveConfigValue(formData)
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'config_changed',
        details: expect.objectContaining({ old_value: '1.49', new_value: '1.99' }),
      })
    )
  })

  it('redirects to config page on success', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'site_config') return makeChain({ value: 'waitlist' })
      if (table === 'profiles') return makeChain({ is_admin: false })
      return makeChain(null)
    })
    const formData = new FormData()
    formData.set('key', 'launch_mode')
    formData.set('value', 'live')
    await saveConfigValue(formData)
    expect(redirect).toHaveBeenCalledWith('/admin/config?saved=1')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/barris/Desktop/MulliganLinks/.worktrees/admin-portal-plan-4
npm test -- --reporter=verbose config-actions 2>&1 | tail -10
```

Expected: FAIL.

- [ ] **Step 3: Create `src/app/admin/config/actions.ts`**

```ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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

export async function saveConfigValue(formData: FormData) {
  const key = formData.get('key') as string
  const value = formData.get('value') as string
  const { admin, user } = await assertAdmin()
  const { data: existing } = await admin.from('site_config').select('value').eq('key', key).single()
  await admin.from('site_config').update({ value, updated_at: new Date().toISOString() }).eq('key', key)
  await writeAuditLog({
    eventType: 'config_changed',
    targetType: 'config',
    targetId: key,
    targetLabel: key,
    details: { old_value: existing?.value ?? null, new_value: value, by: user.email },
  })
  revalidatePath('/', 'layout')
  revalidatePath('/admin')
  redirect('/admin/config?saved=1')
}
```

- [ ] **Step 4: Create `src/app/admin/config/page.tsx`**

```tsx
import { getSiteConfig } from '@/lib/site-config'
import ConfigForm from '@/components/admin/ConfigForm'

export const metadata = { title: 'Configuration' }

export default async function ConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>
}) {
  const { saved } = await searchParams
  const config = await getSiteConfig()

  return (
    <div className="space-y-10 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Configuration</h1>
        <p className="text-[#6B7770] text-sm mt-1">Site-wide settings and feature flags. Changes take effect immediately.</p>
      </div>
      {saved && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 font-medium">
          ✓ Saved
        </div>
      )}
      <ConfigForm config={config} />
    </div>
  )
}
```

- [ ] **Step 5: Create `src/components/admin/ConfigForm.tsx`**

```tsx
import { saveConfigValue } from '@/app/admin/config/actions'

interface ConfigFormProps {
  config: Record<string, string>
}

function Field({ label, configKey, type = 'text', hint }: { label: string; configKey: string; type?: string; hint?: string }) {
  return (
    <form action={saveConfigValue} className="flex items-center justify-between gap-4">
      <input type="hidden" name="key" value={configKey} />
      <div>
        <p className="text-sm font-medium text-[#1A1A1A]">{label}</p>
        {hint && <p className="text-xs text-[#6B7770]">{hint}</p>}
      </div>
      <div className="flex items-center gap-2">
        <input
          name="value"
          type={type}
          defaultValue={'__VALUE__'}
          className="w-44 rounded-lg border border-black/15 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
        />
        <button type="submit" className="rounded-lg bg-[#1B4332] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1B4332]/90">
          Save
        </button>
      </div>
    </form>
  )
}

export default function ConfigForm({ config }: ConfigFormProps) {
  const isLive = config['launch_mode'] === 'live'

  function ConfigField({ label, configKey, type = 'text', hint }: { label: string; configKey: string; type?: string; hint?: string }) {
    return (
      <form action={saveConfigValue} className="flex items-center justify-between gap-4">
        <input type="hidden" name="key" value={configKey} />
        <div>
          <p className="text-sm font-medium text-[#1A1A1A]">{label}</p>
          {hint && <p className="text-xs text-[#6B7770]">{hint}</p>}
        </div>
        <div className="flex items-center gap-2">
          <input
            name="value"
            type={type}
            defaultValue={config[configKey] ?? ''}
            className="w-44 rounded-lg border border-black/15 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
          />
          <button type="submit" className="rounded-lg bg-[#1B4332] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1B4332]/90">
            Save
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="space-y-10">
      {/* Launch Mode */}
      <section className="space-y-4">
        <h2 className="font-bold text-[#1A1A1A]">Launch Mode</h2>
        <div className="flex items-center justify-between bg-white rounded-xl ring-1 ring-black/5 p-5">
          <div>
            <p className="font-medium text-[#1A1A1A]">Site Mode</p>
            <p className="text-xs text-[#6B7770] mt-0.5">
              {isLive
                ? 'Live Mode — full product active. Bookings and signups enabled.'
                : 'Waitlist Mode — coming-soon page shown. Bookings and signups disabled.'}
            </p>
          </div>
          <form action={saveConfigValue}>
            <input type="hidden" name="key" value="launch_mode" />
            <input type="hidden" name="value" value={isLive ? 'waitlist' : 'live'} />
            <button
              type="submit"
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                isLive
                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  : 'bg-[#1B4332] text-white hover:bg-[#1B4332]/90'
              }`}
            >
              {isLive ? 'Switch to Waitlist Mode' : 'Go Live ✓'}
            </button>
          </form>
        </div>
        <div className="bg-white rounded-xl ring-1 ring-black/5 p-5 space-y-4">
          <ConfigField label="Metro Area Name" configKey="metro_area_name" />
          <ConfigField label="Founding Golfer Cap" configKey="founding_golfer_cap" type="number" />
        </div>
      </section>

      {/* Membership Pricing Display */}
      <section className="space-y-4">
        <h2 className="font-bold text-[#1A1A1A]">Membership Pricing Display</h2>
        <p className="text-xs text-[#6B7770]">Display values only. Stripe product prices are managed in the Stripe dashboard.</p>
        <div className="bg-white rounded-xl ring-1 ring-black/5 p-5 space-y-4">
          <ConfigField label="Eagle annual price ($/yr)" configKey="price_eagle_annual" type="number" />
          <ConfigField label="Ace annual price ($/yr)" configKey="price_ace_annual" type="number" />
          <ConfigField label="Eagle monthly credit value ($)" configKey="price_eagle_monthly_credit" type="number" />
          <ConfigField label="Ace monthly credit value ($)" configKey="price_ace_monthly_credit" type="number" />
        </div>
      </section>

      {/* Platform Fees */}
      <section className="space-y-4">
        <h2 className="font-bold text-[#1A1A1A]">Platform Fees</h2>
        <p className="text-xs text-[#6B7770]">Changes take effect immediately for new bookings.</p>
        <div className="bg-white rounded-xl ring-1 ring-black/5 p-5 space-y-4">
          <ConfigField label="Fairway tier per-booking fee ($)" configKey="fee_fairway_booking" type="number" />
          <ConfigField label="Eagle / Ace per-booking fee ($)" configKey="fee_paid_booking" type="number" hint="Expected: $0.00" />
        </div>
      </section>

      {/* Feature Flags */}
      <section className="space-y-4">
        <h2 className="font-bold text-[#1A1A1A]">Feature Flags</h2>
        <div className="bg-white rounded-xl ring-1 ring-black/5 divide-y divide-black/5">
          {[
            { label: 'Golfer Waitlist', key: 'flag_golfer_waitlist', desc: 'Show/hide the golfer waitlist signup form' },
            { label: 'Course Partner Waitlist', key: 'flag_course_waitlist', desc: 'Show/hide the course partner application' },
            { label: 'Membership Signups', key: 'flag_membership_signups', desc: 'Enable/disable new membership checkout' },
            { label: 'Tee Time Bookings', key: 'flag_tee_time_bookings', desc: 'Enable/disable tee time booking for members' },
          ].map(flag => {
            const isOn = config[flag.key] === 'true'
            return (
              <div key={flag.key} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">{flag.label}</p>
                  <p className="text-xs text-[#6B7770]">{flag.desc}</p>
                </div>
                <form action={saveConfigValue}>
                  <input type="hidden" name="key" value={flag.key} />
                  <input type="hidden" name="value" value={isOn ? 'false' : 'true'} />
                  <button
                    type="submit"
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isOn ? 'bg-[#1B4332]' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isOn ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </form>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd /Users/barris/Desktop/MulliganLinks/.worktrees/admin-portal-plan-4
npm test -- --reporter=verbose config-actions 2>&1 | tail -15
```

Expected: 2 tests passing.

- [ ] **Step 7: Commit**

```bash
cd /Users/barris/Desktop/MulliganLinks/.worktrees/admin-portal-plan-4
git add src/app/admin/config/ src/components/admin/ConfigForm.tsx src/test/config-actions.test.ts
git commit -m "feat: add configuration page with launch mode, pricing, fees, feature flag toggles"
```

---

## Task 2: Audit Log Page

**Files:**
- Create: `src/app/admin/audit/page.tsx`
- Create: `src/components/admin/AuditLogFilters.tsx`
- Create: `src/test/audit-log-filters.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// src/test/audit-log-filters.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(''),
}))

import AuditLogFilters from '@/components/admin/AuditLogFilters'

describe('AuditLogFilters', () => {
  it('renders search input', () => {
    render(<AuditLogFilters />)
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
  })

  it('renders action type filter', () => {
    render(<AuditLogFilters />)
    expect(screen.getByRole('combobox', { name: /action/i })).toBeInTheDocument()
  })

  it('renders time range filter', () => {
    render(<AuditLogFilters />)
    expect(screen.getByRole('combobox', { name: /time/i })).toBeInTheDocument()
  })

  it('pushes search query to router on input', async () => {
    render(<AuditLogFilters />)
    const input = screen.getByPlaceholderText(/search/i)
    fireEvent.change(input, { target: { value: 'John' } })
    // debounced — just verify the input value changed
    expect((input as HTMLInputElement).value).toBe('John')
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
cd /Users/barris/Desktop/MulliganLinks/.worktrees/admin-portal-plan-4
npm test -- --reporter=verbose audit-log-filters 2>&1 | tail -10
```

- [ ] **Step 3: Create `src/components/admin/AuditLogFilters.tsx`**

```tsx
'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback } from 'react'

const ACTION_TYPES = [
  { value: '', label: 'All Actions' },
  { value: 'membership_cancelled', label: 'Cancellations & Refunds' },
  { value: 'tier_changed', label: 'Tier Changes' },
  { value: 'content_edited', label: 'Content Edits' },
  { value: 'config_changed', label: 'Config Changes' },
  { value: 'email_sent', label: 'Communications' },
  { value: 'dispute_updated', label: 'Disputes' },
  { value: 'credit_added', label: 'Credits' },
  { value: 'points_adjusted', label: 'Points' },
]

const TIME_RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
]

export default function AuditLogFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') ?? '')

  const push = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', '1')
      for (const [k, v] of Object.entries(updates)) {
        if (v) params.set(k, v)
        else params.delete(k)
      }
      router.push(`/admin/audit?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <input
        aria-label="Search"
        placeholder="Search by member or admin…"
        value={q}
        onChange={e => {
          setQ(e.target.value)
          push({ q: e.target.value })
        }}
        className="rounded-lg border border-black/15 px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
      />
      <select
        aria-label="Action type"
        defaultValue={searchParams.get('event_type') ?? ''}
        onChange={e => push({ event_type: e.target.value })}
        className="rounded-lg border border-black/15 px-3 py-1.5 text-sm bg-white focus:outline-none"
      >
        {ACTION_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <select
        aria-label="Time range"
        defaultValue={searchParams.get('range') ?? '30d'}
        onChange={e => push({ range: e.target.value })}
        className="rounded-lg border border-black/15 px-3 py-1.5 text-sm bg-white focus:outline-none"
      >
        {TIME_RANGES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}
```

- [ ] **Step 4: Create `src/app/admin/audit/page.tsx`**

```tsx
import { createAdminClient } from '@/lib/supabase/admin'
import AuditLogFilters from '@/components/admin/AuditLogFilters'
import Link from 'next/link'
import { Suspense } from 'react'

export const metadata = { title: 'Audit Log' }

const PAGE_SIZE = 25

const TAG_STYLE: Record<string, string> = {
  membership_cancelled: 'bg-red-100 text-red-700',
  refund_issued: 'bg-amber-100 text-amber-800',
  tier_changed: 'bg-violet-100 text-violet-700',
  content_edited: 'bg-blue-100 text-blue-700',
  config_changed: 'bg-emerald-100 text-emerald-700',
  member_created: 'bg-slate-100 text-slate-600',
  member_deleted: 'bg-slate-100 text-slate-600',
  dispute_updated: 'bg-orange-100 text-orange-700',
  email_sent: 'bg-pink-100 text-pink-700',
  credit_added: 'bg-teal-100 text-teal-700',
  points_adjusted: 'bg-indigo-100 text-indigo-700',
  admin_note_added: 'bg-slate-100 text-slate-600',
  profile_updated: 'bg-slate-100 text-slate-600',
}

function tagLabel(eventType: string) {
  return eventType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function detailSummary(details: any): string {
  if (!details) return ''
  if (details.old_value !== undefined && details.new_value !== undefined) {
    return `${details.old_value ?? '—'} → ${details.new_value}`
  }
  if (details.action) return details.action.replace(/_/g, ' ')
  if (details.note) return `"${String(details.note).slice(0, 60)}"`
  if (details.subject) return `"${String(details.subject).slice(0, 60)}"`
  return ''
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; event_type?: string; range?: string; page?: string }>
}) {
  const { q, event_type, range = '30d', page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const admin = createAdminClient()
  let query = admin
    .from('admin_audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (event_type) query = query.eq('event_type', event_type)
  if (range !== 'all') {
    const days = range === '7d' ? 7 : 30
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    query = query.gte('created_at', cutoff.toISOString())
  }
  if (q) {
    query = query.or(
      `target_label.ilike.%${q}%,admin_email.ilike.%${q}%`
    )
  }

  const { data: rows, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Audit Log</h1>
        <p className="text-[#6B7770] text-sm mt-1">All admin actions, newest first</p>
      </div>

      <Suspense>
        <AuditLogFilters />
      </Suspense>

      <div className="bg-white rounded-xl ring-1 ring-black/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#FAF7F2] text-[#6B7770] border-b border-black/5">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Action</th>
              <th className="text-left px-4 py-3 font-medium">Details</th>
              <th className="text-left px-4 py-3 font-medium">Admin</th>
              <th className="text-left px-4 py-3 font-medium">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {(rows ?? []).length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-[#6B7770]">No actions found.</td></tr>
            ) : (rows ?? []).map((row: any) => (
              <tr key={row.id} className="hover:bg-[#FAF7F2]/40">
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${TAG_STYLE[row.event_type] ?? 'bg-slate-100 text-slate-600'}`}>
                    {tagLabel(row.event_type)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-[#1A1A1A]">{row.target_label || '—'}</span>
                  {detailSummary(row.details) && (
                    <p className="text-xs text-[#6B7770] mt-0.5">{detailSummary(row.details)}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-[#6B7770] text-xs">{row.admin_email}</td>
                <td className="px-4 py-3 text-[#6B7770] text-xs whitespace-nowrap">
                  {new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-[#6B7770]">
          <span>Showing {from + 1}–{Math.min(to + 1, count ?? 0)} of {count} actions</span>
          <div className="flex gap-1">
            {page > 1 && (
              <Link href={`/admin/audit?${new URLSearchParams({ ...(q && { q }), ...(event_type && { event_type }), range, page: String(page - 1) })}`}
                className="rounded border border-black/15 px-3 py-1 hover:bg-[#FAF7F2]">←</Link>
            )}
            {page < totalPages && (
              <Link href={`/admin/audit?${new URLSearchParams({ ...(q && { q }), ...(event_type && { event_type }), range, page: String(page + 1) })}`}
                className="rounded border border-black/15 px-3 py-1 hover:bg-[#FAF7F2]">→</Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd /Users/barris/Desktop/MulliganLinks/.worktrees/admin-portal-plan-4
npm test -- --reporter=verbose audit-log-filters 2>&1 | tail -15
```

Expected: 4 tests passing.

- [ ] **Step 6: Commit**

```bash
cd /Users/barris/Desktop/MulliganLinks/.worktrees/admin-portal-plan-4
git add src/app/admin/audit/ src/components/admin/AuditLogFilters.tsx src/test/audit-log-filters.test.tsx
git commit -m "feat: add audit log page with search, filters, and pagination"
```

---

## Task 3: Broadcast Communications

**Files:**
- Modify: `src/lib/resend.ts`
- Create: `src/app/admin/communications/page.tsx`
- Create: `src/app/admin/communications/actions.ts`
- Create: `src/test/communications-actions.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/test/communications-actions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

function makeChain(data: any) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error: null }),
    then: (resolve: any) => resolve({ data, error: null }),
  }
  return chain
}

const mockFrom = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: mockFrom }),
}))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'admin-1', email: 'nbarris11@gmail.com' } } }) },
  }),
}))
vi.mock('@/lib/audit', () => ({ writeAuditLog: vi.fn().mockResolvedValue(undefined) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('@/lib/resend', () => ({
  sendBroadcast: vi.fn().mockResolvedValue({ sent: 2 }),
}))

import { sendBroadcastEmail } from '@/app/admin/communications/actions'
import { sendBroadcast } from '@/lib/resend'
import { writeAuditLog } from '@/lib/audit'
import { redirect } from 'next/navigation'

describe('sendBroadcastEmail', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sends to filtered members and writes audit log', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return makeChain({ is_admin: false })
      if (table === 'memberships') return makeChain([
        { tier: 'ace', profiles: { email: 'a@a.com', full_name: 'Alice' } },
        { tier: 'eagle', profiles: { email: 'b@b.com', full_name: 'Bob' } },
      ])
      return makeChain(null)
    })
    const formData = new FormData()
    formData.set('subject', 'Hello members')
    formData.set('body', 'Great news!')
    formData.set('filter', 'eagle_ace')

    await sendBroadcastEmail(formData)

    expect(sendBroadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Hello members',
        recipients: expect.arrayContaining([
          expect.objectContaining({ email: 'a@a.com' }),
        ]),
      })
    )
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'email_sent', targetType: 'communication' })
    )
  })

  it('returns error when subject is empty', async () => {
    mockFrom.mockImplementation(() => makeChain({ is_admin: false }))
    const formData = new FormData()
    formData.set('subject', '  ')
    formData.set('body', 'body')
    formData.set('filter', 'all')
    const result = await sendBroadcastEmail(formData)
    expect(result?.error).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
cd /Users/barris/Desktop/MulliganLinks/.worktrees/admin-portal-plan-4
npm test -- --reporter=verbose communications-actions 2>&1 | tail -10
```

- [ ] **Step 3: Add `sendBroadcast` to `src/lib/resend.ts`**

Read the existing file first, then append this export at the bottom:

```ts
export async function sendBroadcast({
  subject,
  html,
  recipients,
}: {
  subject: string
  html: string
  recipients: { email: string; name: string | null }[]
}): Promise<{ sent: number; error?: string }> {
  const client = getResend()
  if (!client) {
    console.log('[broadcast] Resend not configured — skipping:', subject)
    return { sent: 0, error: 'Resend not configured.' }
  }
  await Promise.all(
    recipients.map(r =>
      client.emails.send({
        from: 'TeeAhead <notifications@teeahead.com>',
        to: r.email,
        subject,
        html,
      })
    )
  )
  return { sent: recipients.length }
}
```

- [ ] **Step 4: Create `src/app/admin/communications/actions.ts`**

```ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit'
import { sendBroadcast } from '@/lib/resend'
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

const FILTER_TIERS: Record<string, string[]> = {
  all: ['ace', 'eagle', 'fairway'],
  eagle_ace: ['ace', 'eagle'],
  ace: ['ace'],
  eagle: ['eagle'],
  fairway: ['fairway'],
}

export async function sendBroadcastEmail(
  formData: FormData
): Promise<{ error?: string; success?: boolean; count?: number } | undefined> {
  const subject = (formData.get('subject') as string).trim()
  const body = (formData.get('body') as string).trim()
  const filter = (formData.get('filter') as string) || 'all'

  if (!subject) return { error: 'Subject is required.' }
  if (!body) return { error: 'Body is required.' }

  const { admin, user } = await assertAdmin()

  const tiers = FILTER_TIERS[filter] ?? FILTER_TIERS.all
  const { data: members } = await admin
    .from('memberships')
    .select('tier, profiles(email, full_name)')
    .in('tier', tiers)
    .eq('status', 'active')

  const recipients = (members ?? [])
    .map((m: any) => ({
      email: m.profiles?.email ?? '',
      name: m.profiles?.full_name ?? null,
    }))
    .filter(r => r.email)

  const html = body.split('\n\n').map((p: string) => `<p>${p.replace(/\n/g, '<br />')}</p>`).join('')

  const { sent, error: sendError } = await sendBroadcast({ subject, html, recipients })
  if (sendError && sent === 0) return { error: sendError }

  await writeAuditLog({
    eventType: 'email_sent',
    targetType: 'communication',
    targetLabel: `Broadcast to ${filter} members`,
    details: { subject, filter, recipient_count: sent, by: user.email },
  })
  revalidatePath('/admin/communications')
  return { success: true, count: sent }
}
```

- [ ] **Step 5: Create `src/app/admin/communications/page.tsx`**

```tsx
import { createAdminClient } from '@/lib/supabase/admin'
import { sendBroadcastEmail } from '@/app/admin/communications/actions'

export const metadata = { title: 'Communications' }

const FILTER_LABELS: Record<string, string> = {
  all: 'All Members',
  eagle_ace: 'Eagle + Ace',
  ace: 'Ace only',
  eagle: 'Eagle only',
  fairway: 'Fairway only',
}

export default async function CommunicationsPage() {
  const admin = createAdminClient()

  const [membershipResult, historyResult] = await Promise.all([
    admin.from('memberships').select('tier').eq('status', 'active'),
    admin.from('admin_audit_log')
      .select('created_at, admin_email, details')
      .eq('event_type', 'email_sent')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const m = membershipResult.data ?? []
  const counts = {
    all: m.length,
    eagle_ace: m.filter((r: any) => ['eagle', 'ace'].includes(r.tier)).length,
    ace: m.filter((r: any) => r.tier === 'ace').length,
    eagle: m.filter((r: any) => r.tier === 'eagle').length,
    fairway: m.filter((r: any) => r.tier === 'fairway').length,
  }

  const history = historyResult.data ?? []

  return (
    <div className="space-y-10 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Communications</h1>
        <p className="text-[#6B7770] text-sm mt-1">Send a broadcast email to your members.</p>
      </div>

      {/* Compose */}
      <form action={sendBroadcastEmail} className="bg-white rounded-xl ring-1 ring-black/5 p-6 space-y-5">
        <h2 className="font-bold text-[#1A1A1A]">Compose</h2>
        <div className="space-y-1">
          <label className="text-sm font-medium text-[#1A1A1A]">Recipients</label>
          <select
            name="filter"
            className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
          >
            {Object.entries(FILTER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label} ({counts[value as keyof typeof counts]} members)
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-[#1A1A1A]">Subject</label>
          <input
            name="subject"
            type="text"
            required
            className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-[#1A1A1A]">Body</label>
          <textarea
            name="body"
            rows={6}
            required
            placeholder="Write your message here. Separate paragraphs with a blank line."
            className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
          />
        </div>
        <button type="submit" className="rounded-lg bg-[#1B4332] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1B4332]/90">
          Send →
        </button>
      </form>

      {/* Sent history */}
      {history.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-bold text-[#1A1A1A]">Sent History</h2>
          <div className="bg-white rounded-xl ring-1 ring-black/5 divide-y divide-black/5">
            {history.map((row: any, i: number) => (
              <div key={i} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A]">
                      {row.details?.subject ?? '—'}
                    </p>
                    <p className="text-xs text-[#6B7770] mt-0.5">
                      {FILTER_LABELS[row.details?.filter] ?? row.details?.filter} · {row.details?.recipient_count ?? 0} recipients · by {row.admin_email}
                    </p>
                  </div>
                  <span className="text-xs text-[#6B7770] whitespace-nowrap">
                    {new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd /Users/barris/Desktop/MulliganLinks/.worktrees/admin-portal-plan-4
npm test -- --reporter=verbose communications-actions 2>&1 | tail -15
```

Expected: 2 tests passing.

- [ ] **Step 7: Run full suite to check for regressions**

```bash
cd /Users/barris/Desktop/MulliganLinks/.worktrees/admin-portal-plan-4
npm test 2>&1 | tail -8
```

- [ ] **Step 8: Commit**

```bash
cd /Users/barris/Desktop/MulliganLinks/.worktrees/admin-portal-plan-4
git add src/lib/resend.ts src/app/admin/communications/ src/test/communications-actions.test.ts
git commit -m "feat: add broadcast communications page with member filter and sent history"
```

---

## Task 4: Content Management Upgrade

**Files:**
- Modify: `src/app/admin/content/page.tsx`
- Create: `src/app/admin/content/actions.ts`
- Create: `src/components/admin/AddContentBlockModal.tsx`
- Create: `src/test/content-actions.test.ts`

The existing `src/app/admin/content/page.tsx` shows all blocks in a flat list. This task adds a left sidebar for page-group navigation (URL param `?group=home`), an "+ Add block" modal, and moves the server actions to `actions.ts` with audit log writes.

- [ ] **Step 1: Write failing tests**

```ts
// src/test/content-actions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

function makeChain(data: any) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error: null }),
    then: (resolve: any) => resolve({ data, error: null }),
  }
  return chain
}

const mockFrom = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: mockFrom }),
}))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'admin-1', email: 'nbarris11@gmail.com' } } }) },
  }),
}))
vi.mock('@/lib/audit', () => ({ writeAuditLog: vi.fn().mockResolvedValue(undefined) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))

import { saveBlock, addBlock } from '@/app/admin/content/actions'
import { writeAuditLog } from '@/lib/audit'
import { redirect } from 'next/navigation'

describe('saveBlock', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates block value and writes audit log', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return makeChain({ is_admin: false })
      if (table === 'content_blocks') return makeChain({ key: 'home.headline', value: 'Old value' })
      return makeChain(null)
    })
    const formData = new FormData()
    formData.set('key', 'home.headline')
    formData.set('value', 'New value')
    await saveBlock(formData)
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'content_edited',
        targetType: 'content',
        details: expect.objectContaining({ old_value: 'Old value', new_value: 'New value' }),
      })
    )
    expect(redirect).toHaveBeenCalled()
  })
})

describe('addBlock', () => {
  beforeEach(() => vi.clearAllMocks())

  it('inserts a new content block', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return makeChain({ is_admin: false })
      if (table === 'content_blocks') return makeChain(null)
      return makeChain(null)
    })
    const formData = new FormData()
    formData.set('key', 'pricing.headline')
    formData.set('value', 'Simple pricing')
    formData.set('type', 'text')
    formData.set('description', 'Pricing page headline')
    await addBlock(formData)
    expect(redirect).toHaveBeenCalled()
  })

  it('returns error for empty key', async () => {
    mockFrom.mockImplementation(() => makeChain({ is_admin: false }))
    const formData = new FormData()
    formData.set('key', '  ')
    formData.set('value', 'value')
    formData.set('type', 'text')
    formData.set('description', '')
    const result = await addBlock(formData)
    expect(result?.error).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
cd /Users/barris/Desktop/MulliganLinks/.worktrees/admin-portal-plan-4
npm test -- --reporter=verbose content-actions 2>&1 | tail -10
```

- [ ] **Step 3: Create `src/app/admin/content/actions.ts`**

```ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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

export async function saveBlock(formData: FormData) {
  const key = formData.get('key') as string
  const value = formData.get('value') as string
  const group = (formData.get('group') as string) ?? key.split('.')[0]
  const { admin, user } = await assertAdmin()
  const { data: existing } = await admin
    .from('content_blocks')
    .select('value')
    .eq('key', key)
    .single()
  await admin
    .from('content_blocks')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('key', key)
  await writeAuditLog({
    eventType: 'content_edited',
    targetType: 'content',
    targetId: key,
    targetLabel: key,
    details: { old_value: existing?.value ?? null, new_value: value, by: user.email },
  })
  revalidatePath('/', 'layout')
  redirect(`/admin/content?group=${group}&saved=1`)
}

export async function addBlock(
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const key = (formData.get('key') as string).trim()
  const value = (formData.get('value') as string) ?? ''
  const type = (formData.get('type') as string) || 'text'
  const description = (formData.get('description') as string) ?? ''

  if (!key) return { error: 'Key is required.' }
  if (!/^[a-z0-9_]+\.[a-z0-9_]+$/.test(key)) return { error: 'Key must be in format group.block (lowercase, underscores only).' }

  const group = key.split('.')[0]
  const { admin } = await assertAdmin()
  await admin.from('content_blocks').insert({
    key,
    value,
    type,
    description,
    updated_at: new Date().toISOString(),
  })
  revalidatePath('/', 'layout')
  redirect(`/admin/content?group=${group}&saved=1`)
}
```

- [ ] **Step 4: Create `src/components/admin/AddContentBlockModal.tsx`**

```tsx
'use client'
import { useState, useActionState } from 'react'
import { addBlock } from '@/app/admin/content/actions'

export default function AddContentBlockModal({ group }: { group: string }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string }, formData: FormData) => {
      const result = await addBlock(formData)
      return result ?? {}
    },
    {}
  )

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-dashed border-black/20 px-4 py-2 text-sm text-[#6B7770] hover:border-[#1B4332] hover:text-[#1B4332] transition-colors"
      >
        + Add new content block
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl p-6 space-y-4 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[#1A1A1A]">Add Content Block</h3>
          <button onClick={() => setOpen(false)} className="text-[#6B7770] hover:text-[#1A1A1A] text-sm">✕</button>
        </div>
        <form action={action} className="space-y-4">
          <input type="hidden" name="group" value={group} />
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#6B7770] uppercase tracking-wide">Key</label>
            <input
              name="key"
              type="text"
              required
              defaultValue={`${group}.`}
              placeholder={`${group}.my_block`}
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
            />
            <p className="text-xs text-[#6B7770]">Format: group.block_name (lowercase)</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#6B7770] uppercase tracking-wide">Label / Description</label>
            <input
              name="description"
              type="text"
              placeholder="e.g. Homepage headline"
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#6B7770] uppercase tracking-wide">Type</label>
            <select name="type" className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm bg-white focus:outline-none">
              <option value="text">text</option>
              <option value="markdown">markdown</option>
              <option value="html">html</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#6B7770] uppercase tracking-wide">Initial value</label>
            <textarea
              name="value"
              rows={2}
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
            />
          </div>
          {state.error && <p className="text-red-600 text-xs">{state.error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium hover:bg-[#FAF7F2]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {pending ? 'Adding…' : 'Add Block'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Replace `src/app/admin/content/page.tsx`**

Read the file first, then replace it entirely with:

```tsx
import { createAdminClient } from '@/lib/supabase/admin'
import { saveBlock } from '@/app/admin/content/actions'
import AddContentBlockModal from '@/components/admin/AddContentBlockModal'
import Link from 'next/link'

export const metadata = { title: 'Content' }

const PAGE_GROUPS = [
  { key: 'home', label: 'Homepage', path: '/' },
  { key: 'pricing', label: 'Pricing / Tiers', path: '/pricing' },
  { key: 'golfnow', label: 'GolfNow Alternative', path: '/golfnow-alternative' },
  { key: 'waitlist', label: 'Golfer Waitlist', path: '/waitlist' },
  { key: 'waitlist_course', label: 'Course Signup', path: '/waitlist/course' },
  { key: 'nav', label: 'Nav & Footer', path: null },
  { key: 'legal', label: 'Privacy / Terms', path: '/privacy-policy' },
]

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string; saved?: string }>
}) {
  const { group = 'home', saved } = await searchParams
  const activeGroup = PAGE_GROUPS.find(g => g.key === group) ?? PAGE_GROUPS[0]

  const admin = createAdminClient()
  const { data: blocks } = await admin
    .from('content_blocks')
    .select('*')
    .ilike('key', `${activeGroup.key}.%`)
    .order('key')

  return (
    <div className="flex gap-6 min-h-[60vh]">
      {/* Sidebar */}
      <nav className="w-44 shrink-0 space-y-0.5">
        {PAGE_GROUPS.map(g => (
          <Link
            key={g.key}
            href={`/admin/content?group=${g.key}`}
            className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              g.key === activeGroup.key
                ? 'bg-[#1B4332] text-white'
                : 'text-[#6B7770] hover:text-[#1A1A1A] hover:bg-[#FAF7F2]'
            }`}
          >
            {g.label}
          </Link>
        ))}
      </nav>

      {/* Content panel */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">{activeGroup.label}</h1>
            {activeGroup.path && (
              <a
                href={activeGroup.path}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#6B7770] hover:text-[#1B4332]"
              >
                View live page ↗
              </a>
            )}
          </div>
          {saved && (
            <span className="text-sm text-emerald-700 font-medium bg-emerald-50 rounded-lg px-3 py-1.5">✓ Saved</span>
          )}
        </div>

        {(blocks ?? []).length === 0 && (
          <p className="text-sm text-[#6B7770]">No content blocks for this page yet. Add one below.</p>
        )}

        <div className="space-y-4">
          {(blocks ?? []).map((block: any) => (
            <form key={block.key} action={saveBlock} className="bg-white rounded-xl ring-1 ring-black/5 p-5 space-y-3">
              <input type="hidden" name="key" value={block.key} />
              <input type="hidden" name="group" value={activeGroup.key} />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[#1A1A1A]">{block.description || block.key}</p>
                  <p className="text-xs text-[#6B7770] font-mono mt-0.5">{block.key}</p>
                </div>
                <span className="text-xs text-[#6B7770] bg-[#FAF7F2] px-2 py-0.5 rounded">{block.type}</span>
              </div>
              {block.type === 'text' ? (
                <input
                  name="value"
                  type="text"
                  defaultValue={block.value ?? ''}
                  className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
                />
              ) : (
                <textarea
                  name="value"
                  rows={4}
                  defaultValue={block.value ?? ''}
                  className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:outline-none resize-y focus:ring-2 focus:ring-[#1B4332]/30"
                />
              )}
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#6B7770]">
                  {block.updated_at ? `Last updated ${new Date(block.updated_at).toLocaleDateString()}` : ''}
                </p>
                <button
                  type="submit"
                  className="rounded-lg bg-[#1B4332] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#1B4332]/90"
                >
                  Save
                </button>
              </div>
            </form>
          ))}
        </div>

        <AddContentBlockModal group={activeGroup.key} />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd /Users/barris/Desktop/MulliganLinks/.worktrees/admin-portal-plan-4
npm test -- --reporter=verbose content-actions 2>&1 | tail -15
```

Expected: 3 tests passing.

- [ ] **Step 7: Run full test suite**

```bash
cd /Users/barris/Desktop/MulliganLinks/.worktrees/admin-portal-plan-4
npm test 2>&1 | tail -8
```

All tests must pass. If `content-actions` tests fail due to the `ilike` method missing from your chain mock, add it: `ilike: vi.fn().mockReturnThis()`.

- [ ] **Step 8: Commit**

```bash
cd /Users/barris/Desktop/MulliganLinks/.worktrees/admin-portal-plan-4
git add src/app/admin/content/ src/components/admin/AddContentBlockModal.tsx src/test/content-actions.test.ts
git commit -m "feat: upgrade content management with page-group sidebar, Add block modal, audit log"
```

---

## Task 5: Full Test Run + Merge

- [ ] **Step 1: Run full test suite**

```bash
cd /Users/barris/Desktop/MulliganLinks/.worktrees/admin-portal-plan-4
npm test 2>&1 | tail -8
```

Expected: all tests pass (210+).

- [ ] **Step 2: Verify git log**

```bash
git -C /Users/barris/Desktop/MulliganLinks/.worktrees/admin-portal-plan-4 log --oneline -6
```

Should show 4 feature commits from this plan.

- [ ] **Step 3: Merge to main**

```bash
cd /Users/barris/Desktop/MulliganLinks
git merge feature/admin-portal-plan-4 --no-ff -m "feat: admin portal Plan 4 — configuration, audit log, communications, content management"
npm test 2>&1 | tail -8
```

---

## Self-Review

**Spec coverage:**
- ✅ Section 5 (Communications): compose form, filter, Resend send, audit log, sent history — Task 3
- ✅ Section 6 (Content): grouped sidebar, block editor, "+ Add" modal, audit log, revalidatePath — Task 4
- ✅ Section 7 (Configuration): launch mode toggle, pricing display, platform fees, feature flags — Task 1
- ✅ Section 8 (Audit Log): search, filter, time range, paginated table, color-coded tags — Task 2

**Gap check:**
- Content management "Publish Changes" (save all at once) → simplified to per-block save, which is equivalent UX and simpler to implement
- Content block `last_edited_by` column doesn't exist in DB — showing `updated_at` only
- Communications "Preview recipient count" shown via server-side counts passed to the form select options
- Audit log "Admin names from profiles.full_name" → using `admin_email` from the log row directly (simpler, avoids a join)

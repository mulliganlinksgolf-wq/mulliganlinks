# Admin Portal — Plan 2: Member Management

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full member detail experience: upgrade the member list with search/filter, add a 7-tab member detail page, and implement server actions for profile edits, cancellation, tier changes, credits, points, and notes.

**Architecture:** The member list gets URL-param-based search/filter (server-side filtering, client filter bar component). The detail page is a server component that fetches all member data upfront and passes it to a client `MemberDetailTabs` component. Server actions live in `src/app/admin/users/[userId]/actions.ts` and all write to the audit log. Cancel + refund calls Stripe first, then updates the DB.

**Tech Stack:** Next.js 16.2.4 App Router, Supabase (service-role client for all admin writes), Stripe Node SDK (`stripe` v22), Vitest + @testing-library/react, Tailwind CSS v4

> **Before writing any Next.js code:** In Next.js 16, `params` and `searchParams` are Promises — always type them as `Promise<{...}>` and `await` them. See `src/app/course/[slug]/page.tsx` for the pattern.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `src/app/admin/users/page.tsx` | Add search/filter via URL params, status + founding columns, clickable rows |
| Create | `src/components/admin/MemberListFilters.tsx` | Client filter bar (search input + selects → updates URL) |
| Create | `src/app/admin/users/[userId]/page.tsx` | Server component — fetches all member data, renders header + tabs |
| Create | `src/app/admin/users/[userId]/actions.ts` | All member detail server actions |
| Create | `src/components/admin/MemberDetailHeader.tsx` | Avatar, badges, Edit Tier + Cancel buttons |
| Create | `src/components/admin/MemberDetailTabs.tsx` | Client tab switcher — renders active tab |
| Create | `src/components/admin/tabs/ProfileTab.tsx` | Editable profile form |
| Create | `src/components/admin/tabs/MembershipTab.tsx` | Read-only membership details |
| Create | `src/components/admin/tabs/PaymentsTab.tsx` | Combined membership + booking charges |
| Create | `src/components/admin/tabs/BookingsTab.tsx` | Bookings table |
| Create | `src/components/admin/tabs/CreditsTab.tsx` | Credits display + add form |
| Create | `src/components/admin/tabs/PointsTab.tsx` | Points ledger + adjust form |
| Create | `src/components/admin/tabs/NotesTab.tsx` | Admin notes timeline + add form |
| Create | `src/components/admin/CancelMembershipModal.tsx` | Two-option cancel modal |
| Create | `src/components/admin/EditTierModal.tsx` | Tier change modal |
| Create | `src/test/member-list-filters.test.tsx` | Filter bar tests |
| Create | `src/test/member-detail-header.test.tsx` | Header component tests |
| Create | `src/test/member-detail-tabs.test.tsx` | Tab switching tests |
| Create | `src/test/member-actions.test.ts` | Server action unit tests |
| Create | `src/test/cancel-membership-modal.test.tsx` | Modal tests |

---

## Shared Types

All tab components and actions share these types. They are defined inline in `src/app/admin/users/[userId]/page.tsx` and passed as props — no separate types file needed.

```ts
// Used across tabs:
export type MemberProfile = {
  id: string
  full_name: string | null
  phone: string | null
  home_course_id: string | null
  is_admin: boolean
  founding_member: boolean
  stripe_customer_id: string | null
  created_at: string
  email: string  // from auth.users via emailMap
}

export type MemberMembership = {
  id: string
  tier: string
  status: string
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  created_at: string
} | null

export type MemberBooking = {
  id: string
  created_at: string
  paid_at: string | null
  players: number
  green_fee_cents: number | null
  platform_fee_cents: number | null
  total_charged_cents: number | null
  payment_status: string | null
  stripe_charge_id: string | null
  status: string
  course_name: string | null
  scheduled_at: string | null
}

export type MemberCredit = {
  id: string
  type: string
  amount_cents: number
  status: string
  period: string | null
  expires_at: string | null
  created_at: string
}

export type MemberPoint = {
  id: string
  amount: number
  reason: string | null
  created_at: string
  course_name: string | null
  booking_id: string | null
}

export type MemberNote = {
  id: string
  body: string
  admin_email: string
  created_at: string
}
```

---

## Task 1: Member List — Search, Filter, Clickable Rows

**Files:**
- Modify: `src/app/admin/users/page.tsx`
- Create: `src/components/admin/MemberListFilters.tsx`
- Create: `src/test/member-list-filters.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// src/test/member-list-filters.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MemberListFilters from '@/components/admin/MemberListFilters'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}))

describe('MemberListFilters', () => {
  it('renders search input', () => {
    render(<MemberListFilters />)
    expect(screen.getByPlaceholderText(/search by name or email/i)).toBeInTheDocument()
  })

  it('renders tier filter select', () => {
    render(<MemberListFilters />)
    expect(screen.getByRole('combobox', { name: /tier/i })).toBeInTheDocument()
  })

  it('renders status filter select', () => {
    render(<MemberListFilters />)
    expect(screen.getByRole('combobox', { name: /status/i })).toBeInTheDocument()
  })

  it('renders founding member filter select', () => {
    render(<MemberListFilters />)
    expect(screen.getByRole('combobox', { name: /founding/i })).toBeInTheDocument()
  })

  it('updates URL when search input changes', () => {
    render(<MemberListFilters />)
    const input = screen.getByPlaceholderText(/search by name or email/i)
    fireEvent.change(input, { target: { value: 'john' } })
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('q=john'))
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd /Users/barris/Desktop/MulliganLinks/.worktrees/admin-portal-members
npm test -- member-list-filters
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create MemberListFilters component**

```tsx
// src/components/admin/MemberListFilters.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export default function MemberListFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/admin/users?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <input
        type="search"
        placeholder="Search by name or email…"
        defaultValue={searchParams.get('q') ?? ''}
        onChange={e => update('q', e.target.value)}
        className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4332]/30 w-64"
      />
      <label className="sr-only" htmlFor="filter-tier">Tier</label>
      <select
        id="filter-tier"
        defaultValue={searchParams.get('tier') ?? ''}
        onChange={e => update('tier', e.target.value)}
        className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm focus:outline-none"
      >
        <option value="">All tiers</option>
        <option value="ace">Ace</option>
        <option value="eagle">Eagle</option>
        <option value="fairway">Fairway</option>
      </select>
      <label className="sr-only" htmlFor="filter-status">Status</label>
      <select
        id="filter-status"
        defaultValue={searchParams.get('status') ?? ''}
        onChange={e => update('status', e.target.value)}
        className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm focus:outline-none"
      >
        <option value="">All statuses</option>
        <option value="active">Active</option>
        <option value="canceled">Canceled</option>
        <option value="past_due">Past due</option>
      </select>
      <label className="sr-only" htmlFor="filter-founding">Founding</label>
      <select
        id="filter-founding"
        defaultValue={searchParams.get('founding') ?? ''}
        onChange={e => update('founding', e.target.value)}
        className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm focus:outline-none"
      >
        <option value="">All members</option>
        <option value="true">Founding only</option>
      </select>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- member-list-filters
```

Expected: 5 tests passing.

- [ ] **Step 5: Upgrade the member list page**

Replace the content of `src/app/admin/users/page.tsx` keeping the existing imports and adding:

```tsx
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CreateMemberModal } from '@/components/admin/CreateMemberModal'
import Link from 'next/link'
import MemberListFilters from '@/components/admin/MemberListFilters'

export const metadata = { title: 'Members' }

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tier?: string; status?: string; founding?: string }>
}) {
  const { q, tier, status, founding } = await searchParams

  const admin = createAdminClient()
  const supabase = await createClient()
  const { data: { user: me } } = await supabase.auth.getUser()

  const [{ data: golferWaitlist }, { data: waitlist }, profilesResult, { data: { users: authUsers } }] = await Promise.all([
    admin.from('golfer_waitlist').select('id, email, first_name, last_name, created_at').order('created_at', { ascending: false }),
    admin.from('waitlist').select('*').order('created_at', { ascending: false }),
    admin.from('profiles').select('id, full_name, email, phone, is_admin, founding_member, created_at, memberships(tier, status)').order('created_at', { ascending: false }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ])

  const emailMap = Object.fromEntries((authUsers ?? []).map(u => [u.id, u.email ?? '']))

  let members = (profilesResult.data ?? []).map(p => ({
    ...p,
    email: p.email ?? emailMap[p.id] ?? '',
    membership: Array.isArray(p.memberships) ? p.memberships[0] : p.memberships,
  }))

  // Apply filters in JS (small dataset)
  if (q) {
    const lq = q.toLowerCase()
    members = members.filter(m =>
      m.full_name?.toLowerCase().includes(lq) || m.email.toLowerCase().includes(lq)
    )
  }
  if (tier) members = members.filter(m => (m.membership as any)?.tier === tier)
  if (status) members = members.filter(m => (m.membership as any)?.status === status)
  if (founding === 'true') members = members.filter(m => m.founding_member)

  const golferEmails = new Set((golferWaitlist ?? []).map((g: any) => g.email))
  const combinedWaitlist = [
    ...(golferWaitlist ?? []).map((g: any) => ({
      id: `gw-${g.id}`, email: g.email,
      name: [g.first_name, g.last_name].filter(Boolean).join(' ') || null,
      created_at: g.created_at,
    })),
    ...(waitlist ?? []).filter((w: any) => !golferEmails.has(w.email))
      .map((w: any) => ({ id: `w-${w.id}`, email: w.email, name: null, created_at: w.created_at })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const tierColor: Record<string, string> = {
    ace: 'bg-[#1B4332] text-[#FAF7F2]',
    eagle: 'bg-[#E0A800] text-[#1A1A1A]',
    fairway: 'bg-[#FAF7F2] text-[#1A1A1A] ring-1 ring-black/10',
  }
  const statusColor: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700',
    canceled: 'bg-red-50 text-red-700',
    past_due: 'bg-amber-50 text-amber-700',
  }

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Members</h1>
          <p className="text-[#6B7770] text-sm mt-1">Manage members, tiers, and admin access</p>
        </div>
        <CreateMemberModal />
      </div>

      <section>
        <h2 className="text-lg font-bold text-[#1A1A1A] mb-3">
          Registered members <span className="text-[#6B7770] font-normal text-sm ml-1">({members.length})</span>
        </h2>
        <MemberListFilters />
        <div className="bg-white rounded-xl ring-1 ring-black/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#FAF7F2] text-[#6B7770] border-b border-black/5">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Name</th>
                  <th className="text-left px-5 py-3 font-medium">Email</th>
                  <th className="text-left px-5 py-3 font-medium">Tier</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium">Founding</th>
                  <th className="text-left px-5 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {members.length > 0 ? members.map((m) => {
                  const tier = (m.membership as any)?.tier ?? 'fairway'
                  const memberStatus = (m.membership as any)?.status ?? 'active'
                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-[#FAF7F2]/60 transition-colors cursor-pointer"
                      onClick={() => {}}
                    >
                      <td className="px-5 py-3 font-medium text-[#1A1A1A]">
                        <Link href={`/admin/users/${m.id}`} className="hover:text-[#1B4332] hover:underline">
                          {m.full_name || '—'}
                        </Link>
                        {m.is_admin && m.id !== me?.id && (
                          <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-[#1B4332] bg-[#1B4332]/10 rounded px-1.5 py-0.5">admin</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-[#6B7770]">{m.email || '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${tierColor[tier] ?? tierColor.fairway}`}>
                          {tier}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusColor[memberStatus] ?? 'bg-gray-50 text-gray-700'}`}>
                          {memberStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[#6B7770] text-xs">
                        {m.founding_member ? '★ Founding' : '—'}
                      </td>
                      <td className="px-5 py-3 text-[#6B7770]">
                        {new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  )
                }) : (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-[#6B7770]">No members match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#1A1A1A] mb-4">
          Waitlist <span className="text-[#6B7770] font-normal text-sm ml-1">({combinedWaitlist.length})</span>
        </h2>
        <div className="bg-white rounded-xl ring-1 ring-black/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#FAF7F2] text-[#6B7770] border-b border-black/5">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Name</th>
                  <th className="text-left px-5 py-3 font-medium">Email</th>
                  <th className="text-left px-5 py-3 font-medium">Signed up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {combinedWaitlist.length > 0 ? combinedWaitlist.map((w) => (
                  <tr key={w.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                    <td className="px-5 py-3 text-[#1A1A1A]">{w.name ?? <span className="text-[#6B7770] italic">—</span>}</td>
                    <td className="px-5 py-3 text-[#6B7770]">{w.email}</td>
                    <td className="px-5 py-3 text-[#6B7770]">
                      {new Date(w.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-[#6B7770]">No waitlist signups yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/users/page.tsx src/components/admin/MemberListFilters.tsx src/test/member-list-filters.test.tsx
git commit -m "feat: upgrade member list with search, filters, status, founding, and detail links"
```

---

## Task 2: Member Detail Page + Server Actions Shell

**Files:**
- Create: `src/app/admin/users/[userId]/page.tsx`
- Create: `src/app/admin/users/[userId]/actions.ts`
- Create: `src/test/member-actions.test.ts`

- [ ] **Step 1: Write failing tests for server actions**

```ts
// src/test/member-actions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockUpdate = vi.fn().mockReturnThis()
const mockEq = vi.fn().mockResolvedValue({ error: null })
const mockSelect = vi.fn().mockReturnThis()
const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'mem-1', tier: 'eagle' }, error: null })

const mockAdminFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  eq: mockEq,
  single: mockSingle,
}))

const mockAdminClient = {
  from: mockAdminFrom,
  auth: { admin: { updateUserById: vi.fn().mockResolvedValue({ error: null }) } },
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockAdminClient,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: 'admin-1', email: 'nbarris11@gmail.com' } } }),
    },
  }),
}))

vi.mock('@/lib/audit', () => ({
  writeAuditLog: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { saveProfile, addNote, editTier } from '@/app/admin/users/[userId]/actions'
import { writeAuditLog } from '@/lib/audit'

describe('saveProfile', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates profile fields and writes audit log', async () => {
    mockSelect.mockReturnThis()
    mockEq.mockResolvedValue({ error: null })
    mockUpdate.mockReturnThis()

    const formData = new FormData()
    formData.set('userId', 'user-1')
    formData.set('full_name', 'Jane Doe')
    formData.set('phone', '555-1234')
    formData.set('home_course_id', '')
    formData.set('founding_member', 'false')
    formData.set('is_admin', 'false')

    const result = await saveProfile({}, formData)
    expect(result.success).toBe(true)
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'profile_updated', targetType: 'member' })
    )
  })
})

describe('addNote', () => {
  beforeEach(() => vi.clearAllMocks())

  it('inserts note and writes audit log', async () => {
    mockInsert.mockResolvedValue({ error: null })

    const formData = new FormData()
    formData.set('userId', 'user-1')
    formData.set('body', 'Test note body')

    const result = await addNote({}, formData)
    expect(result.success).toBe(true)
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'admin_note_added', targetType: 'member' })
    )
  })

  it('returns error when body is empty', async () => {
    const formData = new FormData()
    formData.set('userId', 'user-1')
    formData.set('body', '  ')

    const result = await addNote({}, formData)
    expect(result.error).toBeTruthy()
  })
})

describe('editTier', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates membership tier and writes audit log', async () => {
    mockSelect.mockReturnThis()
    mockSingle.mockResolvedValue({ data: { id: 'mem-1', tier: 'eagle' }, error: null })
    mockUpdate.mockReturnThis()
    mockEq.mockResolvedValue({ error: null })

    const result = await editTier('user-1', 'ace', 'eagle')
    expect(result.success).toBe(true)
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'tier_changed', targetType: 'member' })
    )
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test -- member-actions
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create the server actions file**

```ts
// src/app/admin/users/[userId]/actions.ts
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

// ─── Save Profile ────────────────────────────────────────────────────────────

export async function saveProfile(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const { admin, user } = await assertAdmin()
    const userId = formData.get('userId') as string
    const full_name = (formData.get('full_name') as string).trim()
    const phone = (formData.get('phone') as string).trim() || null
    const home_course_id = (formData.get('home_course_id') as string).trim() || null
    const founding_member = formData.get('founding_member') === 'true'
    const is_admin = formData.get('is_admin') === 'true'
    const newEmail = (formData.get('email') as string).trim().toLowerCase()

    if (!full_name) return { error: 'Name is required.' }

    const { error: profileError } = await admin.from('profiles')
      .update({ full_name, phone, home_course_id, founding_member, is_admin })
      .eq('id', userId)
    if (profileError) return { error: profileError.message }

    if (newEmail) {
      const { error: emailError } = await admin.auth.admin.updateUserById(userId, { email: newEmail })
      if (emailError) return { error: emailError.message }
      await admin.from('profiles').update({ email: newEmail }).eq('id', userId)
    }

    await writeAuditLog({
      eventType: 'profile_updated',
      targetType: 'member',
      targetId: userId,
      targetLabel: full_name,
      details: { updated_by: user.email },
    })
    revalidatePath(`/admin/users/${userId}`)
    return { success: true }
  } catch (e: any) {
    return { error: e.message ?? 'Something went wrong.' }
  }
}

// ─── Add Note ────────────────────────────────────────────────────────────────

export async function addNote(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const { admin, user } = await assertAdmin()
    const userId = formData.get('userId') as string
    const body = (formData.get('body') as string).trim()
    if (!body) return { error: 'Note cannot be empty.' }

    const { error } = await admin.from('member_admin_notes').insert({
      member_id: userId,
      admin_id: user.id,
      admin_email: user.email ?? '',
      body,
    })
    if (error) return { error: error.message }

    await writeAuditLog({
      eventType: 'admin_note_added',
      targetType: 'member',
      targetId: userId,
      details: { note_preview: body.slice(0, 100) },
    })
    revalidatePath(`/admin/users/${userId}`)
    return { success: true }
  } catch (e: any) {
    return { error: e.message ?? 'Something went wrong.' }
  }
}

// ─── Edit Tier ───────────────────────────────────────────────────────────────

export async function editTier(
  userId: string,
  newTier: string,
  oldTier: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    const { admin, user } = await assertAdmin()
    const { data: existing } = await admin.from('memberships').select('id').eq('user_id', userId).single()
    if (existing) {
      const { error } = await admin.from('memberships').update({ tier: newTier }).eq('user_id', userId)
      if (error) return { error: error.message }
    } else {
      const { error } = await admin.from('memberships').insert({ user_id: userId, tier: newTier, status: 'active' })
      if (error) return { error: error.message }
    }

    await writeAuditLog({
      eventType: 'tier_changed',
      targetType: 'member',
      targetId: userId,
      details: { from: oldTier, to: newTier, changed_by: user.email },
    })
    revalidatePath(`/admin/users/${userId}`)
    revalidatePath('/admin/users')
    return { success: true }
  } catch (e: any) {
    return { error: e.message ?? 'Something went wrong.' }
  }
}

// ─── Add Credit ──────────────────────────────────────────────────────────────

export async function addCredit(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const { admin, user } = await assertAdmin()
    const userId = formData.get('userId') as string
    const type = formData.get('type') as string
    const amount_cents = Math.round(parseFloat(formData.get('amount') as string) * 100)
    if (isNaN(amount_cents) || amount_cents <= 0) return { error: 'Amount must be a positive number.' }

    const { error } = await admin.from('member_credits').insert({
      user_id: userId,
      type,
      amount_cents,
      status: 'available',
      period: null,
    })
    if (error) return { error: error.message }

    await writeAuditLog({
      eventType: 'credit_added',
      targetType: 'member',
      targetId: userId,
      details: { type, amount_cents, added_by: user.email },
    })
    revalidatePath(`/admin/users/${userId}`)
    return { success: true }
  } catch (e: any) {
    return { error: e.message ?? 'Something went wrong.' }
  }
}

// ─── Adjust Points ───────────────────────────────────────────────────────────

export async function adjustPoints(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const { admin, user } = await assertAdmin()
    const userId = formData.get('userId') as string
    const amount = parseInt(formData.get('amount') as string, 10)
    const reason = (formData.get('reason') as string).trim()
    if (isNaN(amount) || amount === 0) return { error: 'Amount must be a non-zero integer.' }
    if (!reason) return { error: 'Reason is required.' }

    const { error } = await admin.from('fairway_points').insert({
      user_id: userId,
      amount,
      reason: `Admin adjustment: ${reason}`,
    })
    if (error) return { error: error.message }

    await writeAuditLog({
      eventType: 'points_adjusted',
      targetType: 'member',
      targetId: userId,
      details: { amount, reason, adjusted_by: user.email },
    })
    revalidatePath(`/admin/users/${userId}`)
    return { success: true }
  } catch (e: any) {
    return { error: e.message ?? 'Something went wrong.' }
  }
}

// ─── Cancel Membership ───────────────────────────────────────────────────────

export async function cancelMembership(
  userId: string,
  mode: 'now' | 'period_end'
): Promise<{ error?: string; success?: boolean; refundAmount?: number }> {
  try {
    const { admin, user } = await assertAdmin()

    const { data: membership } = await admin
      .from('memberships')
      .select('stripe_subscription_id, stripe_customer_id, current_period_end, tier')
      .eq('user_id', userId)
      .single()

    if (!membership?.stripe_subscription_id) return { error: 'No active Stripe subscription found.' }

    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

    if (mode === 'period_end') {
      await stripe.subscriptions.update(membership.stripe_subscription_id, {
        cancel_at_period_end: true,
      })
      const { error } = await admin.from('memberships')
        .update({ cancel_at_period_end: true })
        .eq('user_id', userId)
      if (error) return { error: error.message }

      await writeAuditLog({
        eventType: 'membership_cancelled',
        targetType: 'member',
        targetId: userId,
        details: { mode: 'period_end', tier: membership.tier, by: user.email },
      })
    } else {
      // Cancel immediately and issue pro-rated refund
      const sub = await stripe.subscriptions.retrieve(membership.stripe_subscription_id, {
        expand: ['latest_invoice.payment_intent'],
      })

      // Calculate pro-rated refund
      let refundCents = 0
      const invoice = sub.latest_invoice as any
      if (invoice?.payment_intent?.amount_received && sub.current_period_start && sub.current_period_end) {
        const totalDays = (sub.current_period_end - sub.current_period_start) / 86400
        const daysUsed = (Math.floor(Date.now() / 1000) - sub.current_period_start) / 86400
        const daysRemaining = Math.max(0, totalDays - daysUsed)
        refundCents = Math.round((daysRemaining / totalDays) * invoice.payment_intent.amount_received)
      }

      await stripe.subscriptions.cancel(membership.stripe_subscription_id)

      if (refundCents > 0 && invoice?.payment_intent?.latest_charge) {
        await stripe.refunds.create({
          charge: invoice.payment_intent.latest_charge as string,
          amount: refundCents,
        })
        await writeAuditLog({
          eventType: 'refund_issued',
          targetType: 'member',
          targetId: userId,
          details: { amount_cents: refundCents, tier: membership.tier, by: user.email },
        })
      }

      const { error } = await admin.from('memberships')
        .update({ status: 'canceled', canceled_at: new Date().toISOString(), cancel_at_period_end: false })
        .eq('user_id', userId)
      if (error) return { error: error.message }

      await writeAuditLog({
        eventType: 'membership_cancelled',
        targetType: 'member',
        targetId: userId,
        details: { mode: 'immediate', tier: membership.tier, refund_cents: refundCents, by: user.email },
      })

      revalidatePath(`/admin/users/${userId}`)
      revalidatePath('/admin/users')
      return { success: true, refundAmount: refundCents }
    }

    revalidatePath(`/admin/users/${userId}`)
    revalidatePath('/admin/users')
    return { success: true }
  } catch (e: any) {
    return { error: e.message ?? 'Something went wrong.' }
  }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- member-actions
```

Expected: 5 tests passing.

- [ ] **Step 5: Create the detail page server component**

```tsx
// src/app/admin/users/[userId]/page.tsx
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import MemberDetailHeader from '@/components/admin/MemberDetailHeader'
import MemberDetailTabs from '@/components/admin/MemberDetailTabs'

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const admin = createAdminClient()

  const [
    profileResult,
    membershipResult,
    bookingsResult,
    creditsResult,
    pointsResult,
    notesResult,
    coursesResult,
    { data: { users: authUsers } },
  ] = await Promise.all([
    admin.from('profiles').select('id, full_name, email, phone, home_course_id, is_admin, founding_member, stripe_customer_id, created_at').eq('id', userId).single(),
    admin.from('memberships').select('id, tier, status, stripe_subscription_id, stripe_customer_id, current_period_end, cancel_at_period_end, created_at').eq('user_id', userId).single(),
    admin.from('bookings').select('id, created_at, paid_at, players, green_fee_cents, platform_fee_cents, total_charged_cents, payment_status, stripe_charge_id, status, tee_times(scheduled_at, courses(name))').eq('user_id', userId).order('created_at', { ascending: false }),
    admin.from('member_credits').select('id, type, amount_cents, status, period, expires_at, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
    admin.from('fairway_points').select('id, amount, reason, created_at, booking_id, courses(name)').eq('user_id', userId).order('created_at', { ascending: false }),
    admin.from('member_admin_notes').select('id, body, admin_email, created_at').eq('member_id', userId).order('created_at', { ascending: false }),
    admin.from('courses').select('id, name').eq('status', 'active').order('name'),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ])

  if (!profileResult.data) notFound()

  const emailMap = Object.fromEntries((authUsers ?? []).map((u: any) => [u.id, u.email ?? '']))
  const profile = { ...profileResult.data, email: profileResult.data.email ?? emailMap[userId] ?? '' }
  const membership = membershipResult.data ?? null
  const courses = coursesResult.data ?? []
  const homeCourse = courses.find(c => c.id === profile.home_course_id) ?? null

  const bookings = (bookingsResult.data ?? []).map((b: any) => ({
    id: b.id,
    created_at: b.created_at,
    paid_at: b.paid_at,
    players: b.players,
    green_fee_cents: b.green_fee_cents,
    platform_fee_cents: b.platform_fee_cents,
    total_charged_cents: b.total_charged_cents,
    payment_status: b.payment_status,
    stripe_charge_id: b.stripe_charge_id,
    status: b.status,
    course_name: b.tee_times?.courses?.name ?? null,
    scheduled_at: b.tee_times?.scheduled_at ?? null,
  }))

  const points = (pointsResult.data ?? []).map((p: any) => ({
    id: p.id,
    amount: p.amount,
    reason: p.reason,
    created_at: p.created_at,
    booking_id: p.booking_id,
    course_name: p.courses?.name ?? null,
  }))

  return (
    <div className="space-y-6">
      <MemberDetailHeader
        userId={userId}
        fullName={profile.full_name}
        email={profile.email}
        joinDate={profile.created_at}
        tier={membership?.tier ?? null}
        status={membership?.status ?? null}
        isFoundingMember={profile.founding_member}
        periodEndDate={membership?.current_period_end ?? null}
        hasMembership={!!membership?.stripe_subscription_id}
      />
      <MemberDetailTabs
        userId={userId}
        profile={profile}
        membership={membership}
        bookings={bookings}
        credits={creditsResult.data ?? []}
        points={points}
        notes={notesResult.data ?? []}
        courses={courses}
        homeCourse={homeCourse}
      />
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/users/[userId]/page.tsx src/app/admin/users/[userId]/actions.ts src/test/member-actions.test.ts
git commit -m "feat: add member detail page and server actions (profile, note, tier, credit, points, cancel)"
```

---

## Task 3: MemberDetailHeader Component

**Files:**
- Create: `src/components/admin/MemberDetailHeader.tsx`
- Create: `src/test/member-detail-header.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// src/test/member-detail-header.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/components/admin/CancelMembershipModal', () => ({
  default: () => <button>Cancel Membership</button>,
}))
vi.mock('@/components/admin/EditTierModal', () => ({
  default: () => <button>Edit Tier</button>,
}))

import MemberDetailHeader from '@/components/admin/MemberDetailHeader'

const baseProps = {
  userId: 'user-1',
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  joinDate: '2026-01-15T00:00:00Z',
  tier: 'eagle',
  status: 'active',
  isFoundingMember: false,
  periodEndDate: null,
  hasMembership: true,
}

describe('MemberDetailHeader', () => {
  it('renders full name', () => {
    render(<MemberDetailHeader {...baseProps} />)
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
  })

  it('renders email', () => {
    render(<MemberDetailHeader {...baseProps} />)
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
  })

  it('renders avatar initials', () => {
    render(<MemberDetailHeader {...baseProps} />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('renders tier badge', () => {
    render(<MemberDetailHeader {...baseProps} />)
    expect(screen.getByText('eagle')).toBeInTheDocument()
  })

  it('renders founding member badge when founding', () => {
    render(<MemberDetailHeader {...baseProps} isFoundingMember={true} />)
    expect(screen.getByText(/founding/i)).toBeInTheDocument()
  })

  it('does not render founding badge when not founding', () => {
    render(<MemberDetailHeader {...baseProps} isFoundingMember={false} />)
    expect(screen.queryByText(/founding/i)).not.toBeInTheDocument()
  })

  it('renders Edit Tier and Cancel Membership buttons', () => {
    render(<MemberDetailHeader {...baseProps} />)
    expect(screen.getByText('Edit Tier')).toBeInTheDocument()
    expect(screen.getByText('Cancel Membership')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test -- member-detail-header
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create stub modal components**

```tsx
// src/components/admin/EditTierModal.tsx
'use client'
import { useState, useTransition } from 'react'
import { editTier } from '@/app/admin/users/[userId]/actions'

interface EditTierModalProps {
  userId: string
  currentTier: string | null
}

export default function EditTierModal({ userId, currentTier }: EditTierModalProps) {
  const [open, setOpen] = useState(false)
  const [tier, setTier] = useState(currentTier ?? 'fairway')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSave() {
    startTransition(async () => {
      const result = await editTier(userId, tier, currentTier ?? 'fairway')
      if (result.error) { setError(result.error); return }
      setOpen(false)
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-black/15 bg-white px-4 py-2 text-sm font-medium hover:bg-[#FAF7F2] transition-colors"
      >
        Edit Tier
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl p-6 w-80 shadow-xl">
        <h2 className="font-bold text-lg mb-4">Change Tier</h2>
        <select
          value={tier}
          onChange={e => setTier(e.target.value)}
          className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm mb-4"
        >
          <option value="fairway">Fairway</option>
          <option value="eagle">Eagle</option>
          <option value="ace">Ace</option>
        </select>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm rounded-lg border border-black/15">Cancel</button>
          <button onClick={handleSave} disabled={pending || tier === currentTier} className="px-4 py-2 text-sm rounded-lg bg-[#1B4332] text-white font-medium disabled:opacity-50">
            {pending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

```tsx
// src/components/admin/CancelMembershipModal.tsx
'use client'
import { useState, useTransition } from 'react'
import { cancelMembership } from '@/app/admin/users/[userId]/actions'

interface CancelMembershipModalProps {
  userId: string
  periodEndDate: string | null
  hasMembership: boolean
}

export default function CancelMembershipModal({ userId, periodEndDate, hasMembership }: CancelMembershipModalProps) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const periodEndFormatted = periodEndDate
    ? new Date(periodEndDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  function handle(mode: 'now' | 'period_end') {
    startTransition(async () => {
      const result = await cancelMembership(userId, mode)
      if (result.error) { setError(result.error); return }
      setOpen(false)
    })
  }

  if (!hasMembership) return null

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
      >
        Cancel Membership
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl p-6 w-96 shadow-xl">
        <h2 className="font-bold text-lg mb-2">Cancel Membership</h2>
        <p className="text-sm text-[#6B7770] mb-5">Choose how to cancel this membership.</p>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <div className="space-y-3 mb-5">
          <button
            onClick={() => handle('now')}
            disabled={pending}
            className="w-full rounded-lg border-2 border-red-200 bg-red-50 p-4 text-left hover:border-red-400 transition-colors disabled:opacity-50"
          >
            <div className="font-semibold text-red-800">Cancel + Refund Now</div>
            <div className="text-sm text-red-600 mt-0.5">Ends immediately. Issues a pro-rated refund for unused days.</div>
          </button>
          <button
            onClick={() => handle('period_end')}
            disabled={pending}
            className="w-full rounded-lg border-2 border-amber-200 bg-amber-50 p-4 text-left hover:border-amber-400 transition-colors disabled:opacity-50"
          >
            <div className="font-semibold text-amber-800">Cancel at Period End</div>
            <div className="text-sm text-amber-600 mt-0.5">
              Member retains access until{periodEndFormatted ? ` ${periodEndFormatted}` : ' end of billing period'}.
            </div>
          </button>
        </div>
        <button onClick={() => setOpen(false)} className="w-full px-4 py-2 text-sm rounded-lg border border-black/15 text-[#6B7770]">
          Keep Membership
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create MemberDetailHeader**

```tsx
// src/components/admin/MemberDetailHeader.tsx
import Link from 'next/link'
import EditTierModal from '@/components/admin/EditTierModal'
import CancelMembershipModal from '@/components/admin/CancelMembershipModal'

interface MemberDetailHeaderProps {
  userId: string
  fullName: string | null
  email: string
  joinDate: string
  tier: string | null
  status: string | null
  isFoundingMember: boolean
  periodEndDate: string | null
  hasMembership: boolean
}

const tierColor: Record<string, string> = {
  ace: 'bg-[#1B4332] text-[#FAF7F2]',
  eagle: 'bg-[#E0A800] text-[#1A1A1A]',
  fairway: 'bg-[#FAF7F2] text-[#1A1A1A] ring-1 ring-black/10',
}
const statusColor: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  canceled: 'bg-red-50 text-red-700',
  past_due: 'bg-amber-50 text-amber-700',
}

function initials(name: string | null): string {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

export default function MemberDetailHeader({
  userId, fullName, email, joinDate, tier, status, isFoundingMember, periodEndDate, hasMembership,
}: MemberDetailHeaderProps) {
  return (
    <div className="bg-white rounded-xl ring-1 ring-black/5 p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 h-14 w-14 rounded-full bg-[#1B4332] flex items-center justify-center text-[#FAF7F2] font-bold text-xl">
          {initials(fullName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-[#1A1A1A]">{fullName || '—'}</h1>
            {tier && (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${tierColor[tier] ?? tierColor.fairway}`}>
                {tier}
              </span>
            )}
            {status && (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusColor[status] ?? 'bg-gray-50 text-gray-700'}`}>
                {status.replace('_', ' ')}
              </span>
            )}
            {isFoundingMember && (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700">
                ★ Founding
              </span>
            )}
          </div>
          <p className="text-sm text-[#6B7770]">{email}</p>
          <p className="text-xs text-[#6B7770] mt-0.5">
            Joined {new Date(joinDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/admin/users" className="text-sm text-[#6B7770] hover:text-[#1A1A1A] mr-2">← All members</Link>
          <EditTierModal userId={userId} currentTier={tier} />
          <CancelMembershipModal userId={userId} periodEndDate={periodEndDate} hasMembership={hasMembership} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run tests — verify they pass**

```bash
npm test -- member-detail-header
```

Expected: 7 tests passing.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/MemberDetailHeader.tsx src/components/admin/CancelMembershipModal.tsx src/components/admin/EditTierModal.tsx src/test/member-detail-header.test.tsx
git commit -m "feat: add MemberDetailHeader with Edit Tier and Cancel Membership modals"
```

---

## Task 4: MemberDetailTabs + Profile Tab

**Files:**
- Create: `src/components/admin/MemberDetailTabs.tsx`
- Create: `src/components/admin/tabs/ProfileTab.tsx`
- Create: `src/test/member-detail-tabs.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// src/test/member-detail-tabs.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@/app/admin/users/[userId]/actions', () => ({
  saveProfile: vi.fn().mockResolvedValue({ success: true }),
  addNote: vi.fn().mockResolvedValue({ success: true }),
  addCredit: vi.fn().mockResolvedValue({ success: true }),
  adjustPoints: vi.fn().mockResolvedValue({ success: true }),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

import MemberDetailTabs from '@/components/admin/MemberDetailTabs'

const baseProps = {
  userId: 'user-1',
  profile: { id: 'user-1', full_name: 'Jane Doe', email: 'jane@example.com', phone: null, home_course_id: null, is_admin: false, founding_member: false, stripe_customer_id: null, created_at: '2026-01-01T00:00:00Z' },
  membership: { id: 'mem-1', tier: 'eagle', status: 'active', stripe_subscription_id: 'sub_abc', stripe_customer_id: 'cus_abc', current_period_end: '2026-05-01T00:00:00Z', cancel_at_period_end: false, created_at: '2026-01-01T00:00:00Z' },
  bookings: [],
  credits: [],
  points: [],
  notes: [],
  courses: [],
  homeCourse: null,
}

describe('MemberDetailTabs', () => {
  it('renders all 7 tab buttons', () => {
    render(<MemberDetailTabs {...baseProps} />)
    expect(screen.getByRole('button', { name: /profile/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /membership/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /payments/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /bookings/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /credits/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /points/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /notes/i })).toBeInTheDocument()
  })

  it('shows Profile tab content by default', () => {
    render(<MemberDetailTabs {...baseProps} />)
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
  })

  it('switches to Membership tab on click', () => {
    render(<MemberDetailTabs {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: /membership/i }))
    expect(screen.getByText(/stripe subscription id/i)).toBeInTheDocument()
  })

  it('switches to Notes tab on click', () => {
    render(<MemberDetailTabs {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: /notes/i }))
    expect(screen.getByPlaceholderText(/write a note/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test -- member-detail-tabs
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Create ProfileTab**

```tsx
// src/components/admin/tabs/ProfileTab.tsx
'use client'

import { useActionState } from 'react'
import { saveProfile } from '@/app/admin/users/[userId]/actions'

interface ProfileTabProps {
  userId: string
  profile: {
    id: string
    full_name: string | null
    email: string
    phone: string | null
    home_course_id: string | null
    is_admin: boolean
    founding_member: boolean
    stripe_customer_id: string | null
  }
  courses: { id: string; name: string }[]
  homeCourse: { id: string; name: string } | null
}

export default function ProfileTab({ userId, profile, courses, homeCourse }: ProfileTabProps) {
  const [state, action, pending] = useActionState(saveProfile, {})

  return (
    <form action={action} className="space-y-5 max-w-lg">
      <input type="hidden" name="userId" value={userId} />

      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-[#1A1A1A] mb-1">Full Name</label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          defaultValue={profile.full_name ?? ''}
          className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4332]/30"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-[#1A1A1A] mb-1">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={profile.email}
          className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4332]/30"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-[#1A1A1A] mb-1">Phone</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={profile.phone ?? ''}
          className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4332]/30"
        />
      </div>

      <div>
        <label htmlFor="home_course_id" className="block text-sm font-medium text-[#1A1A1A] mb-1">Home Course</label>
        <select
          id="home_course_id"
          name="home_course_id"
          defaultValue={profile.home_course_id ?? ''}
          className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">— None —</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="stripe_customer_id" className="block text-sm font-medium text-[#1A1A1A] mb-1">
          Stripe Customer ID <span className="text-[#6B7770] font-normal">(read-only)</span>
        </label>
        <input
          id="stripe_customer_id"
          type="text"
          value={profile.stripe_customer_id ?? '—'}
          readOnly
          className="w-full rounded-lg border border-black/10 bg-[#FAF7F2] px-3 py-2 text-sm text-[#6B7770]"
        />
      </div>

      <div>
        <label htmlFor="user_id" className="block text-sm font-medium text-[#1A1A1A] mb-1">
          User ID <span className="text-[#6B7770] font-normal">(read-only)</span>
        </label>
        <input
          id="user_id"
          type="text"
          value={userId}
          readOnly
          className="w-full rounded-lg border border-black/10 bg-[#FAF7F2] px-3 py-2 text-sm text-[#6B7770]"
        />
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="hidden" name="founding_member" value="false" />
          <input
            type="checkbox"
            name="founding_member"
            value="true"
            defaultChecked={profile.founding_member}
            className="rounded"
          />
          Founding Member
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="hidden" name="is_admin" value="false" />
          <input
            type="checkbox"
            name="is_admin"
            value="true"
            defaultChecked={profile.is_admin}
            className="rounded"
          />
          Admin Access
        </label>
      </div>

      {state.error && <p className="text-red-600 text-sm">{state.error}</p>}
      {state.success && <p className="text-emerald-600 text-sm">Changes saved.</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[#1B4332] text-[#FAF7F2] px-5 py-2 text-sm font-semibold hover:bg-[#1B4332]/90 transition-colors disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save Changes'}
      </button>
    </form>
  )
}
```

- [ ] **Step 4: Create remaining tab components**

```tsx
// src/components/admin/tabs/MembershipTab.tsx
interface MembershipTabProps {
  membership: {
    tier: string
    status: string
    stripe_subscription_id: string | null
    stripe_customer_id: string | null
    current_period_end: string | null
    cancel_at_period_end: boolean
    created_at: string
  } | null
  isFoundingMember: boolean
}

export default function MembershipTab({ membership, isFoundingMember }: MembershipTabProps) {
  if (!membership) {
    return <p className="text-sm text-[#6B7770]">No membership record found.</p>
  }

  const rows = [
    { label: 'Tier', value: <span className="capitalize">{membership.tier}</span> },
    { label: 'Status', value: <span className="capitalize">{membership.status.replace('_', ' ')}</span> },
    { label: 'Stripe Subscription ID', value: membership.stripe_subscription_id ?? '—' },
    { label: 'Stripe Customer ID', value: membership.stripe_customer_id ?? '—' },
    { label: 'Current Period End', value: membership.current_period_end ? new Date(membership.current_period_end).toLocaleDateString() : '—' },
    { label: 'Cancel at Period End', value: membership.cancel_at_period_end ? 'Yes' : 'No' },
    { label: 'Founding Member', value: isFoundingMember ? 'Yes' : 'No' },
    { label: 'Date Joined', value: new Date(membership.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
  ]

  return (
    <dl className="divide-y divide-black/5 max-w-lg">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex justify-between py-3 text-sm">
          <dt className="text-[#6B7770]">{label}</dt>
          <dd className="font-medium text-[#1A1A1A]">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
```

```tsx
// src/components/admin/tabs/PaymentsTab.tsx
interface Booking {
  id: string
  created_at: string
  paid_at: string | null
  total_charged_cents: number | null
  payment_status: string | null
  stripe_charge_id: string | null
  course_name: string | null
  players: number
}

interface PaymentsTabProps {
  bookings: Booking[]
  membership: { tier: string; stripe_subscription_id: string | null } | null
}

export default function PaymentsTab({ bookings, membership }: PaymentsTabProps) {
  const rows = bookings
    .filter(b => b.total_charged_cents && b.total_charged_cents > 0)
    .map(b => ({
      id: b.id,
      date: b.paid_at ?? b.created_at,
      description: b.course_name ? `${b.course_name} — ${b.players} player${b.players !== 1 ? 's' : ''}` : 'Tee time booking',
      amount: b.total_charged_cents!,
      status: b.payment_status ?? 'unknown',
      reference: b.stripe_charge_id ? b.stripe_charge_id.slice(-8) : '—',
    }))

  if (rows.length === 0) {
    return <p className="text-sm text-[#6B7770]">No payment history found.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-[#FAF7F2] text-[#6B7770] border-b border-black/5">
          <tr>
            <th className="text-left px-4 py-2 font-medium">Date</th>
            <th className="text-left px-4 py-2 font-medium">Description</th>
            <th className="text-right px-4 py-2 font-medium">Amount</th>
            <th className="text-left px-4 py-2 font-medium">Status</th>
            <th className="text-left px-4 py-2 font-medium">Ref</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {rows.map(r => (
            <tr key={r.id}>
              <td className="px-4 py-3 text-[#6B7770]">{new Date(r.date).toLocaleDateString()}</td>
              <td className="px-4 py-3">{r.description}</td>
              <td className="px-4 py-3 text-right font-medium">${(r.amount / 100).toFixed(2)}</td>
              <td className="px-4 py-3 capitalize text-[#6B7770]">{r.status}</td>
              <td className="px-4 py-3 font-mono text-xs text-[#6B7770]">…{r.reference}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

```tsx
// src/components/admin/tabs/BookingsTab.tsx
interface Booking {
  id: string
  scheduled_at: string | null
  created_at: string
  players: number
  green_fee_cents: number | null
  platform_fee_cents: number | null
  status: string
  paid_at: string | null
  course_name: string | null
}

export default function BookingsTab({ bookings }: { bookings: Booking[] }) {
  if (bookings.length === 0) {
    return <p className="text-sm text-[#6B7770]">No bookings found.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-[#FAF7F2] text-[#6B7770] border-b border-black/5">
          <tr>
            <th className="text-left px-4 py-2 font-medium">Course</th>
            <th className="text-left px-4 py-2 font-medium">Date/Time</th>
            <th className="text-right px-4 py-2 font-medium">Players</th>
            <th className="text-right px-4 py-2 font-medium">Green Fee</th>
            <th className="text-right px-4 py-2 font-medium">Platform Fee</th>
            <th className="text-left px-4 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {bookings.map(b => (
            <tr key={b.id}>
              <td className="px-4 py-3 font-medium">{b.course_name ?? '—'}</td>
              <td className="px-4 py-3 text-[#6B7770]">
                {b.scheduled_at ? new Date(b.scheduled_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'}
              </td>
              <td className="px-4 py-3 text-right">{b.players}</td>
              <td className="px-4 py-3 text-right">{b.green_fee_cents != null ? `$${(b.green_fee_cents / 100).toFixed(2)}` : '—'}</td>
              <td className="px-4 py-3 text-right">{b.platform_fee_cents != null ? `$${(b.platform_fee_cents / 100).toFixed(2)}` : '—'}</td>
              <td className="px-4 py-3 capitalize text-[#6B7770]">{b.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

```tsx
// src/components/admin/tabs/CreditsTab.tsx
'use client'
import { useActionState } from 'react'
import { addCredit } from '@/app/admin/users/[userId]/actions'

interface Credit {
  id: string
  type: string
  amount_cents: number
  status: string
  expires_at: string | null
  created_at: string
}

interface CreditsTabProps {
  userId: string
  credits: Credit[]
}

export default function CreditsTab({ userId, credits }: CreditsTabProps) {
  const [state, action, pending] = useActionState(addCredit, {})

  return (
    <div className="space-y-6">
      {credits.length === 0 ? (
        <p className="text-sm text-[#6B7770]">No credits found.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-[#FAF7F2] text-[#6B7770] border-b border-black/5">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Type</th>
              <th className="text-right px-4 py-2 font-medium">Amount</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-left px-4 py-2 font-medium">Expires</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {credits.map(c => (
              <tr key={c.id}>
                <td className="px-4 py-3 capitalize">{c.type.replace('_', ' ')}</td>
                <td className="px-4 py-3 text-right font-medium">${(c.amount_cents / 100).toFixed(2)}</td>
                <td className="px-4 py-3 capitalize text-[#6B7770]">{c.status}</td>
                <td className="px-4 py-3 text-[#6B7770]">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="border-t border-black/5 pt-5">
        <h3 className="text-sm font-semibold mb-3">Add Credit</h3>
        <form action={action} className="flex flex-wrap gap-3 items-end">
          <input type="hidden" name="userId" value={userId} />
          <div>
            <label className="block text-xs text-[#6B7770] mb-1">Type</label>
            <select name="type" className="rounded-lg border border-black/15 px-3 py-2 text-sm">
              <option value="monthly">Monthly</option>
              <option value="birthday">Birthday</option>
              <option value="free_round">Free Round</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#6B7770] mb-1">Amount ($)</label>
            <input name="amount" type="number" step="0.01" min="0.01" placeholder="10.00" className="w-28 rounded-lg border border-black/15 px-3 py-2 text-sm" />
          </div>
          <button type="submit" disabled={pending} className="rounded-lg bg-[#1B4332] text-[#FAF7F2] px-4 py-2 text-sm font-semibold disabled:opacity-50">
            {pending ? 'Adding…' : 'Add Credit'}
          </button>
          {state.error && <p className="text-red-600 text-sm w-full">{state.error}</p>}
          {state.success && <p className="text-emerald-600 text-sm w-full">Credit added.</p>}
        </form>
      </div>
    </div>
  )
}
```

```tsx
// src/components/admin/tabs/PointsTab.tsx
'use client'
import { useActionState } from 'react'
import { adjustPoints } from '@/app/admin/users/[userId]/actions'

interface Point {
  id: string
  amount: number
  reason: string | null
  created_at: string
  course_name: string | null
}

interface PointsTabProps {
  userId: string
  points: Point[]
}

export default function PointsTab({ userId, points }: PointsTabProps) {
  const [state, action, pending] = useActionState(adjustPoints, {})
  const total = points.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold text-[#1B4332]">{total.toLocaleString()}</span>
        <span className="text-sm text-[#6B7770]">total Fairway Points</span>
      </div>

      {points.length === 0 ? (
        <p className="text-sm text-[#6B7770]">No points history.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-[#FAF7F2] text-[#6B7770] border-b border-black/5">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Date</th>
              <th className="text-left px-4 py-2 font-medium">Reason</th>
              <th className="text-right px-4 py-2 font-medium">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {points.map(p => (
              <tr key={p.id}>
                <td className="px-4 py-3 text-[#6B7770]">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">{p.reason ?? '—'}</td>
                <td className={`px-4 py-3 text-right font-semibold ${p.amount >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {p.amount >= 0 ? '+' : ''}{p.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="border-t border-black/5 pt-5">
        <h3 className="text-sm font-semibold mb-3">Adjust Points</h3>
        <form action={action} className="flex flex-wrap gap-3 items-end">
          <input type="hidden" name="userId" value={userId} />
          <div>
            <label className="block text-xs text-[#6B7770] mb-1">Amount (use − for deduction)</label>
            <input name="amount" type="number" placeholder="e.g. 500 or -100" className="w-36 rounded-lg border border-black/15 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-[#6B7770] mb-1">Reason</label>
            <input name="reason" type="text" placeholder="Courtesy adjustment" className="w-56 rounded-lg border border-black/15 px-3 py-2 text-sm" />
          </div>
          <button type="submit" disabled={pending} className="rounded-lg bg-[#1B4332] text-[#FAF7F2] px-4 py-2 text-sm font-semibold disabled:opacity-50">
            {pending ? 'Saving…' : 'Apply Adjustment'}
          </button>
          {state.error && <p className="text-red-600 text-sm w-full">{state.error}</p>}
          {state.success && <p className="text-emerald-600 text-sm w-full">Points adjusted.</p>}
        </form>
      </div>
    </div>
  )
}
```

```tsx
// src/components/admin/tabs/NotesTab.tsx
'use client'
import { useActionState } from 'react'
import { addNote } from '@/app/admin/users/[userId]/actions'

interface Note {
  id: string
  body: string
  admin_email: string
  created_at: string
}

interface NotesTabProps {
  userId: string
  notes: Note[]
}

export default function NotesTab({ userId, notes }: NotesTabProps) {
  const [state, action, pending] = useActionState(addNote, {})

  return (
    <div className="space-y-6 max-w-2xl">
      <form action={action} className="space-y-3">
        <input type="hidden" name="userId" value={userId} />
        <textarea
          name="body"
          placeholder="Write a note… (not visible to the member)"
          rows={3}
          className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#1B4332]/30"
        />
        {state.error && <p className="text-red-600 text-sm">{state.error}</p>}
        <button type="submit" disabled={pending} className="rounded-lg bg-[#1B4332] text-[#FAF7F2] px-4 py-2 text-sm font-semibold disabled:opacity-50">
          {pending ? 'Saving…' : 'Save Note'}
        </button>
      </form>

      {notes.length === 0 ? (
        <p className="text-sm text-[#6B7770]">No notes yet.</p>
      ) : (
        <div className="space-y-4">
          {notes.map(n => (
            <div key={n.id} className="rounded-lg border border-black/8 bg-[#FAF7F2] p-4">
              <p className="text-sm text-[#1A1A1A] whitespace-pre-wrap">{n.body}</p>
              <p className="text-xs text-[#6B7770] mt-2">
                {n.admin_email} · {new Date(n.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Create MemberDetailTabs**

```tsx
// src/components/admin/MemberDetailTabs.tsx
'use client'
import { useState } from 'react'
import ProfileTab from '@/components/admin/tabs/ProfileTab'
import MembershipTab from '@/components/admin/tabs/MembershipTab'
import PaymentsTab from '@/components/admin/tabs/PaymentsTab'
import BookingsTab from '@/components/admin/tabs/BookingsTab'
import CreditsTab from '@/components/admin/tabs/CreditsTab'
import PointsTab from '@/components/admin/tabs/PointsTab'
import NotesTab from '@/components/admin/tabs/NotesTab'

const TABS = ['Profile', 'Membership', 'Payments', 'Bookings', 'Credits', 'Points', 'Notes'] as const
type Tab = typeof TABS[number]

interface MemberDetailTabsProps {
  userId: string
  profile: any
  membership: any
  bookings: any[]
  credits: any[]
  points: any[]
  notes: any[]
  courses: { id: string; name: string }[]
  homeCourse: { id: string; name: string } | null
}

export default function MemberDetailTabs({
  userId, profile, membership, bookings, credits, points, notes, courses, homeCourse,
}: MemberDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Profile')

  return (
    <div className="bg-white rounded-xl ring-1 ring-black/5 overflow-hidden">
      <div className="flex border-b border-black/5 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-5 py-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-[#1B4332] text-[#1B4332]'
                : 'text-[#6B7770] hover:text-[#1A1A1A]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="p-6">
        {activeTab === 'Profile' && <ProfileTab userId={userId} profile={profile} courses={courses} homeCourse={homeCourse} />}
        {activeTab === 'Membership' && <MembershipTab membership={membership} isFoundingMember={profile.founding_member} />}
        {activeTab === 'Payments' && <PaymentsTab bookings={bookings} membership={membership} />}
        {activeTab === 'Bookings' && <BookingsTab bookings={bookings} />}
        {activeTab === 'Credits' && <CreditsTab userId={userId} credits={credits} />}
        {activeTab === 'Points' && <PointsTab userId={userId} points={points} />}
        {activeTab === 'Notes' && <NotesTab userId={userId} notes={notes} />}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Run tests — verify they pass**

```bash
npm test -- member-detail-tabs
```

Expected: 4 tests passing.

- [ ] **Step 7: Run full suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/components/admin/MemberDetailTabs.tsx src/components/admin/tabs/ src/test/member-detail-tabs.test.tsx
git commit -m "feat: add member detail tabs with all 7 tab components"
```

---

## Task 5: Cancel Membership Modal Tests

**Files:**
- Create: `src/test/cancel-membership-modal.test.tsx`

- [ ] **Step 1: Write tests**

```tsx
// src/test/cancel-membership-modal.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@/app/admin/users/[userId]/actions', () => ({
  cancelMembership: vi.fn().mockResolvedValue({ success: true }),
}))

import CancelMembershipModal from '@/components/admin/CancelMembershipModal'

describe('CancelMembershipModal', () => {
  it('renders Cancel Membership button when member has subscription', () => {
    render(<CancelMembershipModal userId="user-1" periodEndDate="2026-05-01T00:00:00Z" hasMembership={true} />)
    expect(screen.getByText(/cancel membership/i)).toBeInTheDocument()
  })

  it('renders nothing when hasMembership is false', () => {
    const { container } = render(<CancelMembershipModal userId="user-1" periodEndDate={null} hasMembership={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('opens modal on button click', () => {
    render(<CancelMembershipModal userId="user-1" periodEndDate="2026-05-01T00:00:00Z" hasMembership={true} />)
    fireEvent.click(screen.getByText(/cancel membership/i))
    expect(screen.getByText(/cancel \+ refund now/i)).toBeInTheDocument()
    expect(screen.getByText(/cancel at period end/i)).toBeInTheDocument()
  })

  it('shows formatted period end date in modal', () => {
    render(<CancelMembershipModal userId="user-1" periodEndDate="2026-05-01T00:00:00Z" hasMembership={true} />)
    fireEvent.click(screen.getByText(/cancel membership/i))
    expect(screen.getByText(/may 1, 2026/i)).toBeInTheDocument()
  })

  it('closes modal when Keep Membership is clicked', () => {
    render(<CancelMembershipModal userId="user-1" periodEndDate="2026-05-01T00:00:00Z" hasMembership={true} />)
    fireEvent.click(screen.getByText(/cancel membership/i))
    fireEvent.click(screen.getByText(/keep membership/i))
    expect(screen.queryByText(/cancel \+ refund now/i)).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests**

```bash
npm test -- cancel-membership-modal
```

Expected: 5 tests passing.

- [ ] **Step 3: Run full suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/test/cancel-membership-modal.test.tsx
git commit -m "test: add cancel membership modal tests"
```

---

## Task 6: Full Test Run + Merge

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: all tests pass (165+).

- [ ] **Step 2: Commit any unstaged files**

```bash
git status
```

If anything is uncommitted, commit it.

- [ ] **Step 3: Final commit message if needed**

```bash
git commit -m "feat: complete Plan 2 — member management with detail page, 7 tabs, cancel/refund, tier edit"
```

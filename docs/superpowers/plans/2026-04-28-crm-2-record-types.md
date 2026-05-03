# TeeAhead CRM — Plan 2: Record Types (Courses, Outings, Members)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Prerequisite:** Plan 1 (Foundation + Dashboard) must be complete. The DB schema, types, and `src/lib/crm/queries.ts` must exist.

**Goal:** Build full CRUD for all three CRM record types — course pipeline (Kanban + table + detail), outings (table + detail), and members (table + detail) — including server actions, list pages, detail pages, activity logs, and inline editing.

**Architecture:** Each record type follows the same pattern: server actions for CRUD in `src/app/actions/crm/`, list page with table view (courses also has Kanban), and a detail page with an inline-editable form and activity log panel. The `@hello-pangea/dnd` Kanban is a client component wrapping server-fetched data.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4, Supabase (admin client), `@hello-pangea/dnd` for Kanban, Vitest for action tests

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/app/actions/crm/courses.ts` | Create | Course CRUD + stage update server actions |
| `src/app/actions/crm/courses.test.ts` | Create | Unit tests for course actions |
| `src/app/actions/crm/outings.ts` | Create | Outing CRUD + status update server actions |
| `src/app/actions/crm/outings.test.ts` | Create | Unit tests for outing actions |
| `src/app/actions/crm/members.ts` | Create | Member CRUD server actions |
| `src/app/actions/crm/members.test.ts` | Create | Unit tests for member actions |
| `src/app/actions/crm/activity.ts` | Create | Log activity + fetch activity log |
| `src/components/crm/CourseKanbanCard.tsx` | Create | Single Kanban card |
| `src/components/crm/CourseKanban.tsx` | Create | Full drag-and-drop Kanban board |
| `src/components/crm/CourseTable.tsx` | Create | Sortable courses table with inline stage dropdown |
| `src/components/crm/OutingTable.tsx` | Create | Outings table |
| `src/components/crm/MemberTable.tsx` | Create | Members table with tier/status filters |
| `src/components/crm/ActivityLog.tsx` | Create | Activity log panel (read) |
| `src/components/crm/LogActivityModal.tsx` | Create | Modal to log a new activity |
| `src/components/crm/InlineEditField.tsx` | Create | Click-to-edit field component |
| `src/components/crm/RecordHeader.tsx` | Create | Shared detail page header |
| `src/app/admin/crm/courses/page.tsx` | Create | Courses list (Kanban/Table toggle) |
| `src/app/admin/crm/courses/new/page.tsx` | Create | New course form |
| `src/app/admin/crm/courses/[id]/page.tsx` | Create | Course detail page |
| `src/app/admin/crm/outings/page.tsx` | Create | Outings list |
| `src/app/admin/crm/outings/new/page.tsx` | Create | New outing form |
| `src/app/admin/crm/outings/[id]/page.tsx` | Create | Outing detail page |
| `src/app/admin/crm/members/page.tsx` | Create | Members list |
| `src/app/admin/crm/members/new/page.tsx` | Create | New member form |
| `src/app/admin/crm/members/[id]/page.tsx` | Create | Member detail page |

---

### Task 1: Course server actions + tests

**Files:**
- Create: `src/app/actions/crm/courses.ts`
- Create: `src/app/actions/crm/courses.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/app/actions/crm/courses.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const ADMIN_EMAILS = ['nbarris11@gmail.com', 'beslock@yahoo.com']

function makeSupabaseMock(insertData?: unknown, updateData?: unknown) {
  const admin = {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: insertData ?? { id: 'abc' }, error: null }),
  }
  return admin
}

describe('createCourse', () => {
  it('inserts a new course and returns its id', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const { createAdminClient } = await import('@/lib/supabase/admin')

    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1', email: ADMIN_EMAILS[0] } } }) },
    } as never)

    const adminMock = makeSupabaseMock({ id: 'course-1', name: 'Oak Hollow GC' })
    vi.mocked(createAdminClient).mockReturnValue(adminMock as never)

    const { createCourse } = await import('./courses')
    const fd = new FormData()
    fd.set('name', 'Oak Hollow GC')
    fd.set('city', 'Detroit')
    fd.set('state', 'MI')

    const result = await createCourse({}, fd)
    expect(result.error).toBeUndefined()
    expect(adminMock.from).toHaveBeenCalledWith('crm_courses')
    expect(adminMock.insert).toHaveBeenCalled()
  })
})

describe('updateCourseStage', () => {
  it('updates the stage field on a course', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const { createAdminClient } = await import('@/lib/supabase/admin')

    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1', email: ADMIN_EMAILS[0] } } }) },
    } as never)

    const adminMock = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null }),
      update: vi.fn().mockReturnThis(),
    }
    vi.mocked(createAdminClient).mockReturnValue(adminMock as never)
    adminMock.eq.mockResolvedValueOnce({ error: null }) // for the update call

    const { updateCourseStage } = await import('./courses')
    const result = await updateCourseStage('course-1', 'demo')
    expect(result.error).toBeUndefined()
    expect(adminMock.from).toHaveBeenCalledWith('crm_courses')
    expect(adminMock.update).toHaveBeenCalledWith(expect.objectContaining({ stage: 'demo' }))
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
cd /Users/barris/Desktop/MulliganLinks && npx vitest run src/app/actions/crm/courses.test.ts 2>&1 | tail -5
```

Expected: FAIL — `Cannot find module './courses'`

- [ ] **Step 3: Create course server actions**

```typescript
// src/app/actions/crm/courses.ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CrmCourseStage } from '@/lib/crm/types'

const ADMIN_EMAILS = ['mulliganlinksgolf@gmail.com', 'nbarris11@gmail.com', 'beslock@yahoo.com']

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!ADMIN_EMAILS.includes(user.email ?? '') && !profile?.is_admin) throw new Error('Not authorized')
  return admin
}

export async function createCourse(
  _: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean; id?: string }> {
  try {
    const admin = await assertAdmin()
    const { data, error } = await admin
      .from('crm_courses')
      .insert({
        name: formData.get('name') as string,
        address: formData.get('address') as string || null,
        city: formData.get('city') as string || null,
        state: formData.get('state') as string || null,
        zip: formData.get('zip') as string || null,
        contact_name: formData.get('contact_name') as string || null,
        contact_email: formData.get('contact_email') as string || null,
        contact_phone: formData.get('contact_phone') as string || null,
        stage: (formData.get('stage') as CrmCourseStage) || 'lead',
        assigned_to: formData.get('assigned_to') as string || null,
        notes: formData.get('notes') as string || null,
        estimated_value: formData.get('estimated_value')
          ? parseFloat(formData.get('estimated_value') as string)
          : null,
      })
      .select('id')
      .single()

    if (error) return { error: error.message }
    revalidatePath('/admin/crm/courses')
    return { success: true, id: data.id }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function updateCourse(
  id: string,
  fields: Partial<{
    name: string
    address: string | null
    city: string | null
    state: string | null
    zip: string | null
    contact_name: string | null
    contact_email: string | null
    contact_phone: string | null
    stage: CrmCourseStage
    assigned_to: string | null
    notes: string | null
    estimated_value: number | null
  }>
): Promise<{ error?: string; success?: boolean }> {
  try {
    const admin = await assertAdmin()
    const { error } = await admin
      .from('crm_courses')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return { error: error.message }
    revalidatePath(`/admin/crm/courses/${id}`)
    revalidatePath('/admin/crm/courses')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function updateCourseStage(
  id: string,
  stage: CrmCourseStage
): Promise<{ error?: string; success?: boolean }> {
  try {
    const admin = await assertAdmin()
    const { error } = await admin
      .from('crm_courses')
      .update({ stage, last_activity_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return { error: error.message }
    revalidatePath('/admin/crm/courses')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function deleteCourse(id: string): Promise<{ error?: string; success?: boolean }> {
  try {
    const admin = await assertAdmin()
    const { error } = await admin.from('crm_courses').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/crm/courses')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/app/actions/crm/courses.test.ts 2>&1 | tail -5
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/actions/crm/courses.ts src/app/actions/crm/courses.test.ts
git commit -m "feat: course CRM server actions with tests"
```

---

### Task 2: Activity server actions

**Files:**
- Create: `src/app/actions/crm/activity.ts`

- [ ] **Step 1: Create activity actions**

```typescript
// src/app/actions/crm/activity.ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CrmActivityType, CrmRecordType } from '@/lib/crm/types'

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

export async function logActivity(
  recordType: CrmRecordType,
  recordId: string,
  type: CrmActivityType,
  body: string,
  createdBy: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    const { admin } = await assertAdmin()
    const { error } = await admin.from('crm_activity_log').insert({
      record_type: recordType,
      record_id: recordId,
      type,
      body: body || null,
      created_by: createdBy,
    })
    if (error) return { error: error.message }

    // Update last_activity_at on the parent record
    const table =
      recordType === 'course' ? 'crm_courses'
      : recordType === 'outing' ? 'crm_outings'
      : 'crm_members'

    if (recordType !== 'member') {
      await admin
        .from(table)
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', recordId)
    }

    revalidatePath(`/admin/crm/${recordType === 'course' ? 'courses' : recordType === 'outing' ? 'outings' : 'members'}/${recordId}`)
    revalidatePath('/admin/crm')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function getActivityLog(recordType: CrmRecordType, recordId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('crm_activity_log')
    .select('*')
    .eq('record_type', recordType)
    .eq('record_id', recordId)
    .order('created_at', { ascending: false })
  return data ?? []
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/actions/crm/activity.ts
git commit -m "feat: CRM activity log server actions"
```

---

### Task 3: Outing and Member server actions

**Files:**
- Create: `src/app/actions/crm/outings.ts`
- Create: `src/app/actions/crm/members.ts`

- [ ] **Step 1: Create outing actions**

```typescript
// src/app/actions/crm/outings.ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CrmOutingStatus } from '@/lib/crm/types'

const ADMIN_EMAILS = ['mulliganlinksgolf@gmail.com', 'nbarris11@gmail.com', 'beslock@yahoo.com']

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!ADMIN_EMAILS.includes(user.email ?? '') && !profile?.is_admin) throw new Error('Not authorized')
  return admin
}

export async function createOuting(
  _: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean; id?: string }> {
  try {
    const admin = await assertAdmin()
    const { data, error } = await admin
      .from('crm_outings')
      .insert({
        contact_name: formData.get('contact_name') as string,
        contact_email: formData.get('contact_email') as string || null,
        contact_phone: formData.get('contact_phone') as string || null,
        event_date: formData.get('event_date') as string || null,
        num_golfers: formData.get('num_golfers') ? parseInt(formData.get('num_golfers') as string, 10) : null,
        preferred_course: formData.get('preferred_course') as string || null,
        budget_estimate: formData.get('budget_estimate') ? parseFloat(formData.get('budget_estimate') as string) : null,
        status: (formData.get('status') as CrmOutingStatus) || 'lead',
        assigned_to: formData.get('assigned_to') as string || null,
        notes: formData.get('notes') as string || null,
      })
      .select('id')
      .single()

    if (error) return { error: error.message }
    revalidatePath('/admin/crm/outings')
    return { success: true, id: data.id }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function updateOuting(
  id: string,
  fields: Record<string, unknown>
): Promise<{ error?: string; success?: boolean }> {
  try {
    const admin = await assertAdmin()
    const { error } = await admin
      .from('crm_outings')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return { error: error.message }
    revalidatePath(`/admin/crm/outings/${id}`)
    revalidatePath('/admin/crm/outings')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function deleteOuting(id: string): Promise<{ error?: string; success?: boolean }> {
  try {
    const admin = await assertAdmin()
    const { error } = await admin.from('crm_outings').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/crm/outings')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
```

- [ ] **Step 2: Create member actions**

```typescript
// src/app/actions/crm/members.ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CrmMemberTier, CrmMemberStatus } from '@/lib/crm/types'

const ADMIN_EMAILS = ['mulliganlinksgolf@gmail.com', 'nbarris11@gmail.com', 'beslock@yahoo.com']

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!ADMIN_EMAILS.includes(user.email ?? '') && !profile?.is_admin) throw new Error('Not authorized')
  return admin
}

export async function createCrmMember(
  _: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean; id?: string }> {
  try {
    const admin = await assertAdmin()
    const { data, error } = await admin
      .from('crm_members')
      .insert({
        name: formData.get('name') as string,
        email: formData.get('email') as string || null,
        phone: formData.get('phone') as string || null,
        membership_tier: (formData.get('membership_tier') as CrmMemberTier) || 'free',
        home_course: formData.get('home_course') as string || null,
        join_date: formData.get('join_date') as string || null,
        lifetime_spend: formData.get('lifetime_spend') ? parseFloat(formData.get('lifetime_spend') as string) : 0,
        status: (formData.get('status') as CrmMemberStatus) || 'active',
        notes: formData.get('notes') as string || null,
      })
      .select('id')
      .single()

    if (error) return { error: error.message }
    revalidatePath('/admin/crm/members')
    return { success: true, id: data.id }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function updateCrmMember(
  id: string,
  fields: Record<string, unknown>
): Promise<{ error?: string; success?: boolean }> {
  try {
    const admin = await assertAdmin()
    const { error } = await admin
      .from('crm_members')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return { error: error.message }
    revalidatePath(`/admin/crm/members/${id}`)
    revalidatePath('/admin/crm/members')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function deleteCrmMember(id: string): Promise<{ error?: string; success?: boolean }> {
  try {
    const admin = await assertAdmin()
    const { error } = await admin.from('crm_members').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/crm/members')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
```

- [ ] **Step 3: Compile check**

```bash
npx tsc --noEmit 2>&1 | grep "actions/crm" | head -10
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/actions/crm/
git commit -m "feat: outing and member CRM server actions"
```

---

### Task 4: Shared UI components (InlineEditField, RecordHeader, ActivityLog, LogActivityModal)

**Files:**
- Create: `src/components/crm/InlineEditField.tsx`
- Create: `src/components/crm/RecordHeader.tsx`
- Create: `src/components/crm/ActivityLog.tsx`
- Create: `src/components/crm/LogActivityModal.tsx`

- [ ] **Step 1: InlineEditField — click to reveal input**

```typescript
// src/components/crm/InlineEditField.tsx
'use client'

import { useState, useRef } from 'react'

interface Props {
  label: string
  value: string | null
  onSave: (value: string) => Promise<void>
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'textarea'
  placeholder?: string
}

export function InlineEditField({ label, value, onSave, type = 'text', placeholder = '—' }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  async function handleSave() {
    setSaving(true)
    await onSave(draft)
    setSaving(false)
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && type !== 'textarea') handleSave()
    if (e.key === 'Escape') { setDraft(value ?? ''); setEditing(false) }
  }

  if (editing) {
    return (
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</label>
        {type === 'textarea' ? (
          <textarea
            ref={inputRef as React.Ref<HTMLTextAreaElement>}
            className="w-full text-sm border border-emerald-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none"
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        ) : (
          <input
            ref={inputRef as React.Ref<HTMLInputElement>}
            type={type}
            className="w-full text-sm border border-emerald-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        )}
        <div className="flex gap-2 mt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs px-2 py-0.5 bg-emerald-700 text-white rounded hover:bg-emerald-800 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={() => { setDraft(value ?? ''); setEditing(false) }}
            className="text-xs px-2 py-0.5 text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-0.5 group cursor-pointer" onClick={() => setEditing(true)}>
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="text-sm text-slate-800 flex items-center gap-1">
        <span>{value || <span className="text-slate-400">{placeholder}</span>}</span>
        <span className="opacity-0 group-hover:opacity-100 text-slate-400 text-xs">✏️</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: RecordHeader — shared detail page header**

```typescript
// src/components/crm/RecordHeader.tsx
import Link from 'next/link'

interface Props {
  backHref: string
  backLabel: string
  title: string
  subtitle?: string
  badge?: { label: string; color: 'green' | 'amber' | 'slate' | 'red' | 'blue' }
}

const badgeColors = {
  green: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  slate: 'bg-slate-100 text-slate-600',
  red: 'bg-red-100 text-red-600',
  blue: 'bg-blue-100 text-blue-700',
}

export function RecordHeader({ backHref, backLabel, title, subtitle, badge }: Props) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <Link href={backHref} className="text-sm text-slate-400 hover:text-slate-600 mb-1 block">
          ← {backLabel}
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {badge && (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${badgeColors[badge.color]}`}>
          {badge.label}
        </span>
      )}
    </div>
  )
}
```

- [ ] **Step 3: ActivityLog — read-only list panel**

```typescript
// src/components/crm/ActivityLog.tsx
import type { CrmActivityLog as CrmActivityLogType, CrmActivityType } from '@/lib/crm/types'

const icons: Record<CrmActivityType, string> = {
  call: '📞', email: '✉️', note: '📝',
  meeting: '🤝', demo: '💻', contract_sent: '📄',
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(new Date(iso))
}

interface Props {
  activities: CrmActivityLogType[]
}

export function ActivityLog({ activities }: Props) {
  if (activities.length === 0) {
    return <p className="text-sm text-slate-400">No activity logged yet.</p>
  }
  return (
    <ul className="space-y-4">
      {activities.map((a) => (
        <li key={a.id} className="flex gap-3">
          <span className="text-lg mt-0.5">{icons[a.type]}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700 capitalize">{a.type.replace('_', ' ')}</span>
              <span>·</span>
              <span>{a.created_by}</span>
              <span>·</span>
              <span>{formatDate(a.created_at)}</span>
            </div>
            {a.body && <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{a.body}</p>}
          </div>
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 4: LogActivityModal — form to log a new activity**

```typescript
// src/components/crm/LogActivityModal.tsx
'use client'

import { useState } from 'react'
import { logActivity } from '@/app/actions/crm/activity'
import type { CrmActivityType, CrmRecordType } from '@/lib/crm/types'

const ACTIVITY_TYPES: CrmActivityType[] = [
  'call', 'email', 'note', 'meeting', 'demo', 'contract_sent',
]

interface Props {
  recordType: CrmRecordType
  recordId: string
  assignee: string
  onClose: () => void
  onLogged: () => void
}

export function LogActivityModal({ recordType, recordId, assignee, onClose, onLogged }: Props) {
  const [type, setType] = useState<CrmActivityType>('note')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const result = await logActivity(recordType, recordId, type, body, assignee)
    setSaving(false)
    if (result.error) {
      setError(result.error)
    } else {
      onLogged()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Log Activity</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CrmActivityType)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">
              Notes
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none"
              placeholder="What happened?"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="text-sm px-4 py-2 text-slate-500 hover:text-slate-700">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="text-sm px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 disabled:opacity-50"
            >
              {saving ? 'Logging…' : 'Log Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/crm/InlineEditField.tsx src/components/crm/RecordHeader.tsx src/components/crm/ActivityLog.tsx src/components/crm/LogActivityModal.tsx
git commit -m "feat: shared CRM UI components (inline edit, activity log, modal)"
```

---

### Task 5: CourseKanbanCard and CourseKanban

**Files:**
- Create: `src/components/crm/CourseKanbanCard.tsx`
- Create: `src/components/crm/CourseKanban.tsx`

- [ ] **Step 1: CourseKanbanCard**

```typescript
// src/components/crm/CourseKanbanCard.tsx
import Link from 'next/link'
import type { CrmCourse } from '@/lib/crm/types'

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

interface Props {
  course: CrmCourse
  isDragging?: boolean
}

export function CourseKanbanCard({ course, isDragging }: Props) {
  const stale = daysSince(course.last_activity_at) >= 7
  return (
    <div
      className={`bg-white rounded-lg border p-3 shadow-sm cursor-grab select-none
        ${stale ? 'border-amber-400' : 'border-slate-200'}
        ${isDragging ? 'shadow-lg rotate-1 scale-105' : ''}
      `}
    >
      <Link
        href={`/admin/crm/courses/${course.id}`}
        className="font-medium text-slate-800 text-sm hover:text-emerald-700 block mb-1"
        onClick={(e) => e.stopPropagation()}
      >
        {course.name}
      </Link>
      {course.contact_name && (
        <p className="text-xs text-slate-500">{course.contact_name}</p>
      )}
      <div className="flex items-center justify-between mt-2">
        {course.estimated_value != null && (
          <span className="text-xs font-medium text-emerald-700">
            ${course.estimated_value.toLocaleString()}/yr
          </span>
        )}
        {stale && (
          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full ml-auto">
            {daysSince(course.last_activity_at)}d stale
          </span>
        )}
        {!stale && course.assigned_to && (
          <span className="text-xs text-slate-400 ml-auto capitalize">{course.assigned_to}</span>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: CourseKanban — drag and drop board**

```typescript
// src/components/crm/CourseKanban.tsx
'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { CourseKanbanCard } from './CourseKanbanCard'
import { updateCourseStage } from '@/app/actions/crm/courses'
import type { CrmCourse, CrmCourseStage } from '@/lib/crm/types'

const STAGES: { id: CrmCourseStage; label: string }[] = [
  { id: 'lead', label: 'Lead' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'demo', label: 'Demo' },
  { id: 'negotiating', label: 'Negotiating' },
  { id: 'partner', label: 'Partner' },
  { id: 'churned', label: 'Churned' },
]

interface Props {
  initialCourses: CrmCourse[]
}

export function CourseKanban({ initialCourses }: Props) {
  const [courses, setCourses] = useState(initialCourses)

  function groupByStage(): Record<CrmCourseStage, CrmCourse[]> {
    const grouped = {} as Record<CrmCourseStage, CrmCourse[]>
    for (const s of STAGES) grouped[s.id] = []
    for (const c of courses) grouped[c.stage].push(c)
    return grouped
  }

  async function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result
    if (!destination || source.droppableId === destination.droppableId) return

    const newStage = destination.droppableId as CrmCourseStage
    setCourses((prev) =>
      prev.map((c) => (c.id === draggableId ? { ...c, stage: newStage } : c))
    )
    const res = await updateCourseStage(draggableId, newStage)
    if (res.error) {
      // revert on error
      setCourses(initialCourses)
    }
  }

  const grouped = groupByStage()

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map(({ id, label }) => (
          <div key={id} className="flex-shrink-0 w-52">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
              <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-1.5">{grouped[id].length}</span>
            </div>
            <Droppable droppableId={id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-24 rounded-xl p-2 space-y-2 transition-colors
                    ${snapshot.isDraggingOver ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50'}
                  `}
                >
                  {grouped[id].map((course, index) => (
                    <Draggable key={course.id} draggableId={course.id} index={index}>
                      {(prov, snap) => (
                        <div
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          {...prov.dragHandleProps}
                        >
                          <CourseKanbanCard course={course} isDragging={snap.isDragging} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/crm/CourseKanbanCard.tsx src/components/crm/CourseKanban.tsx
git commit -m "feat: course Kanban drag-and-drop board"
```

---

### Task 6: CourseTable component

**Files:**
- Create: `src/components/crm/CourseTable.tsx`

- [ ] **Step 1: Create sortable table with inline stage dropdown**

```typescript
// src/components/crm/CourseTable.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { updateCourseStage } from '@/app/actions/crm/courses'
import type { CrmCourse, CrmCourseStage } from '@/lib/crm/types'

const STAGES: CrmCourseStage[] = ['lead', 'contacted', 'demo', 'negotiating', 'partner', 'churned']

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

type SortKey = 'name' | 'stage' | 'estimated_value' | 'last_activity_at'

interface Props {
  initialCourses: CrmCourse[]
  onExportCsv: () => void
}

export function CourseTable({ initialCourses, onExportCsv }: Props) {
  const [courses, setCourses] = useState(initialCourses)
  const [sortKey, setSortKey] = useState<SortKey>('last_activity_at')
  const [sortAsc, setSortAsc] = useState(false)

  function sort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v)
    else { setSortKey(key); setSortAsc(true) }
  }

  const sorted = [...courses].sort((a, b) => {
    const av = a[sortKey] ?? ''
    const bv = b[sortKey] ?? ''
    return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
  })

  async function handleStageChange(id: string, stage: CrmCourseStage) {
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, stage } : c)))
    await updateCourseStage(id, stage)
  }

  function SortHeader({ label, k }: { label: string; k: SortKey }) {
    return (
      <th
        className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2 cursor-pointer hover:text-slate-700 select-none"
        onClick={() => sort(k)}
      >
        {label} {sortKey === k ? (sortAsc ? '↑' : '↓') : ''}
      </th>
    )
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={onExportCsv} className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded px-3 py-1">
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <SortHeader label="Course" k="name" />
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">Contact</th>
              <SortHeader label="Stage" k="stage" />
              <SortHeader label="Value" k="estimated_value" />
              <SortHeader label="Last Activity" k="last_activity_at" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((course) => {
              const days = daysSince(course.last_activity_at)
              return (
                <tr key={course.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2">
                    <Link href={`/admin/crm/courses/${course.id}`} className="font-medium text-slate-800 hover:text-emerald-700">
                      {course.name}
                    </Link>
                    {course.city && <div className="text-xs text-slate-400">{course.city}, {course.state}</div>}
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-slate-700">{course.contact_name ?? '—'}</div>
                    {course.contact_email && <div className="text-xs text-slate-400">{course.contact_email}</div>}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={course.stage}
                      onChange={(e) => handleStageChange(course.id, e.target.value as CrmCourseStage)}
                      className="text-xs border border-slate-200 rounded px-2 py-1 capitalize focus:outline-none focus:ring-1 focus:ring-emerald-300"
                    >
                      {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {course.estimated_value != null ? `$${course.estimated_value.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <span className={days >= 7 ? 'text-amber-600 font-medium' : 'text-slate-500'}>
                      {days === 0 ? 'Today' : `${days}d ago`}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-8">No courses yet.</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/crm/CourseTable.tsx
git commit -m "feat: course table with sort and inline stage dropdown"
```

---

### Task 7: Courses list page (Kanban / Table toggle)

**Files:**
- Create: `src/app/admin/crm/courses/page.tsx`

- [ ] **Step 1: Create the courses list page**

```typescript
// src/app/admin/crm/courses/page.tsx
import { createAdminClient } from '@/lib/supabase/admin'
import { CourseKanban } from '@/components/crm/CourseKanban'
import { CourseTable } from '@/components/crm/CourseTable'
import CoursesViewToggle from './CoursesViewToggle'
import Link from 'next/link'
import type { CrmCourse } from '@/lib/crm/types'

export const dynamic = 'force-dynamic'

async function getCourses(): Promise<CrmCourse[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('crm_courses')
    .select('*')
    .order('last_activity_at', { ascending: false })
  return data ?? []
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const params = await searchParams
  const view = params.view ?? 'kanban'
  const courses = await getCourses()

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Course Pipeline</h1>
        <div className="flex items-center gap-3">
          <CoursesViewToggle currentView={view} />
          <Link
            href="/admin/crm/courses/new"
            className="px-3 py-1.5 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800"
          >
            + New Course
          </Link>
        </div>
      </div>

      {view === 'kanban' ? (
        <CourseKanban initialCourses={courses} />
      ) : (
        <CourseTable initialCourses={courses} onExportCsv={() => {}} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create the view toggle client component**

Create `src/app/admin/crm/courses/CoursesViewToggle.tsx`:

```typescript
// src/app/admin/crm/courses/CoursesViewToggle.tsx
'use client'

import { useRouter } from 'next/navigation'

interface Props {
  currentView: string
}

export default function CoursesViewToggle({ currentView }: Props) {
  const router = useRouter()
  return (
    <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm">
      <button
        onClick={() => router.push('?view=kanban')}
        className={`px-3 py-1.5 font-medium transition-colors
          ${currentView === 'kanban' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
      >
        Kanban
      </button>
      <button
        onClick={() => router.push('?view=table')}
        className={`px-3 py-1.5 font-medium transition-colors border-l border-slate-200
          ${currentView === 'table' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
      >
        Table
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/crm/courses/page.tsx src/app/admin/crm/courses/CoursesViewToggle.tsx
git commit -m "feat: courses list page with Kanban/table view toggle"
```

---

### Task 8: New course page + form

**Files:**
- Create: `src/app/admin/crm/courses/new/page.tsx`

- [ ] **Step 1: Create the new course page**

```typescript
// src/app/admin/crm/courses/new/page.tsx
'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { createCourse } from '@/app/actions/crm/courses'
import { RecordHeader } from '@/components/crm/RecordHeader'
import { useEffect } from 'react'

const initialState = { error: undefined, success: undefined }

export default function NewCoursePage() {
  const router = useRouter()
  const [state, action, pending] = useActionState(createCourse, initialState)

  useEffect(() => {
    if (state.success && state.id) router.push(`/admin/crm/courses/${state.id}`)
  }, [state.success, state.id, router])

  return (
    <div className="p-6 max-w-2xl">
      <RecordHeader backHref="/admin/crm/courses" backLabel="Course Pipeline" title="New Course" />

      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4 bg-white rounded-xl border border-slate-200 p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
              Course Name *
            </label>
            <input name="name" required className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">City</label>
            <input name="city" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">State</label>
            <input name="state" maxLength={2} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Contact Name</label>
            <input name="contact_name" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Contact Email</label>
            <input name="contact_email" type="email" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Contact Phone</label>
            <input name="contact_phone" type="tel" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Est. Annual Value ($)</label>
            <input name="estimated_value" type="number" min="0" step="1" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Assigned To</label>
            <select name="assigned_to" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300">
              <option value="">Unassigned</option>
              <option value="neil">Neil</option>
              <option value="billy">Billy</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Stage</label>
            <select name="stage" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300">
              {['lead','contacted','demo','negotiating','partner','churned'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Notes</label>
            <textarea name="notes" rows={3} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none" />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 disabled:opacity-50"
          >
            {pending ? 'Creating…' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/crm/courses/new/page.tsx
git commit -m "feat: new course form page"
```

---

### Task 9: Course detail page

**Files:**
- Create: `src/app/admin/crm/courses/[id]/page.tsx`

- [ ] **Step 1: Create the course detail page**

```typescript
// src/app/admin/crm/courses/[id]/page.tsx
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { RecordHeader } from '@/components/crm/RecordHeader'
import { ActivityLog } from '@/components/crm/ActivityLog'
import { CourseDetailClient } from './CourseDetailClient'
import { getActivityLog } from '@/app/actions/crm/activity'
import type { CrmCourse } from '@/lib/crm/types'

export const dynamic = 'force-dynamic'

async function getCourse(id: string): Promise<CrmCourse | null> {
  const supabase = createAdminClient()
  const { data } = await supabase.from('crm_courses').select('*').eq('id', id).single()
  return data ?? null
}

const stageColors: Record<string, 'green' | 'amber' | 'slate' | 'red' | 'blue'> = {
  partner: 'green',
  negotiating: 'blue',
  demo: 'amber',
  churned: 'red',
  lead: 'slate',
  contacted: 'slate',
}

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [course, activities] = await Promise.all([
    getCourse(id),
    getActivityLog('course', id),
  ])
  if (!course) notFound()

  return (
    <div className="p-6 max-w-5xl">
      <RecordHeader
        backHref="/admin/crm/courses"
        backLabel="Course Pipeline"
        title={course.name}
        subtitle={[course.city, course.state].filter(Boolean).join(', ')}
        badge={{ label: course.stage, color: stageColors[course.stage] ?? 'slate' }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CourseDetailClient course={course} />
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4 text-sm uppercase tracking-wide">Activity Log</h3>
            <ActivityLog activities={activities} />
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create the client-side editable fields component**

Create `src/app/admin/crm/courses/[id]/CourseDetailClient.tsx`:

```typescript
// src/app/admin/crm/courses/[id]/CourseDetailClient.tsx
'use client'

import { useState } from 'react'
import { InlineEditField } from '@/components/crm/InlineEditField'
import { LogActivityModal } from '@/components/crm/LogActivityModal'
import { updateCourse } from '@/app/actions/crm/courses'
import { deleteCourse } from '@/app/actions/crm/courses'
import { useRouter } from 'next/navigation'
import type { CrmCourse } from '@/lib/crm/types'

interface Props {
  course: CrmCourse
}

export function CourseDetailClient({ course }: Props) {
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const router = useRouter()

  async function save(field: string, value: string) {
    await updateCourse(course.id, { [field]: value || null })
    router.refresh()
  }

  async function handleDelete() {
    await deleteCourse(course.id)
    router.push('/admin/crm/courses')
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">Details</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowActivityModal(true)}
              className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Log Activity
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs px-3 py-1.5 border border-red-200 rounded-lg text-red-500 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <InlineEditField label="Contact Name" value={course.contact_name} onSave={(v) => save('contact_name', v)} />
          <InlineEditField label="Contact Email" value={course.contact_email} onSave={(v) => save('contact_email', v)} type="email" />
          <InlineEditField label="Contact Phone" value={course.contact_phone} onSave={(v) => save('contact_phone', v)} type="tel" />
          <InlineEditField label="Estimated Value" value={course.estimated_value?.toString() ?? null} onSave={(v) => save('estimated_value', v)} type="number" />
          <InlineEditField label="City" value={course.city} onSave={(v) => save('city', v)} />
          <InlineEditField label="State" value={course.state} onSave={(v) => save('state', v)} />
          <InlineEditField label="Address" value={course.address} onSave={(v) => save('address', v)} />
          <InlineEditField label="ZIP" value={course.zip} onSave={(v) => save('zip', v)} />
          <div className="col-span-2">
            <InlineEditField label="Notes" value={course.notes} onSave={(v) => save('notes', v)} type="textarea" />
          </div>
        </div>
      </div>

      {showActivityModal && (
        <LogActivityModal
          recordType="course"
          recordId={course.id}
          assignee={course.assigned_to ?? 'neil'}
          onClose={() => setShowActivityModal(false)}
          onLogged={() => router.refresh()}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold text-slate-800 mb-2">Delete {course.name}?</h3>
            <p className="text-sm text-slate-500 mb-4">This will permanently delete this course and all its activity history.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowDeleteConfirm(false)} className="text-sm px-4 py-2 text-slate-500">Cancel</button>
              <button onClick={handleDelete} className="text-sm px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 3: Compile check**

```bash
npx tsc --noEmit 2>&1 | grep "crm/courses" | head -10
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/crm/courses/
git commit -m "feat: course detail page with inline editing and activity log"
```

---

### Task 10: Outings pages (list, new, detail)

**Files:**
- Create: `src/app/admin/crm/outings/page.tsx`
- Create: `src/app/admin/crm/outings/new/page.tsx`
- Create: `src/app/admin/crm/outings/[id]/page.tsx`
- Create: `src/components/crm/OutingTable.tsx`

- [ ] **Step 1: OutingTable component**

```typescript
// src/components/crm/OutingTable.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { CrmOuting, CrmOutingStatus } from '@/lib/crm/types'
import { updateOuting } from '@/app/actions/crm/outings'

const STATUSES: CrmOutingStatus[] = ['lead', 'quoted', 'confirmed', 'completed', 'cancelled']

const statusColors: Record<CrmOutingStatus, string> = {
  lead: 'bg-slate-100 text-slate-600',
  quoted: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-500',
}

interface Props {
  initialOutings: CrmOuting[]
  onExportCsv: () => void
}

export function OutingTable({ initialOutings, onExportCsv }: Props) {
  const [outings, setOutings] = useState(initialOutings)

  async function handleStatusChange(id: string, status: CrmOutingStatus) {
    setOutings((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
    await updateOuting(id, { status })
  }

  const sorted = [...outings].sort((a, b) => {
    if (!a.event_date) return 1
    if (!b.event_date) return -1
    return a.event_date.localeCompare(b.event_date)
  })

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={onExportCsv} className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded px-3 py-1">
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">Contact</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">Event Date</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">Golfers</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">Budget</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">Status</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">Assigned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((outing) => (
              <tr key={outing.id} className="hover:bg-slate-50">
                <td className="px-3 py-2">
                  <Link href={`/admin/crm/outings/${outing.id}`} className="font-medium text-slate-800 hover:text-emerald-700">
                    {outing.contact_name}
                  </Link>
                  {outing.preferred_course && <div className="text-xs text-slate-400">{outing.preferred_course}</div>}
                </td>
                <td className="px-3 py-2 text-slate-600">
                  {outing.event_date ? new Date(outing.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </td>
                <td className="px-3 py-2 text-slate-600">{outing.num_golfers ?? '—'}</td>
                <td className="px-3 py-2 text-slate-600">
                  {outing.budget_estimate != null ? `$${outing.budget_estimate.toLocaleString()}` : '—'}
                </td>
                <td className="px-3 py-2">
                  <select
                    value={outing.status}
                    onChange={(e) => handleStatusChange(outing.id, e.target.value as CrmOutingStatus)}
                    className={`text-xs border-0 rounded-full px-2 py-1 font-medium capitalize focus:outline-none ${statusColors[outing.status]}`}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2 text-slate-500 capitalize">{outing.assigned_to ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && <p className="text-center text-slate-400 text-sm py-8">No outings yet.</p>}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Outings list page**

```typescript
// src/app/admin/crm/outings/page.tsx
import { createAdminClient } from '@/lib/supabase/admin'
import { OutingTable } from '@/components/crm/OutingTable'
import Link from 'next/link'
import type { CrmOuting } from '@/lib/crm/types'

export const dynamic = 'force-dynamic'

async function getOutings(): Promise<CrmOuting[]> {
  const supabase = createAdminClient()
  const { data } = await supabase.from('crm_outings').select('*').order('event_date', { ascending: true, nullsFirst: false })
  return data ?? []
}

export default async function OutingsPage() {
  const outings = await getOutings()
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Outing Leads</h1>
        <Link href="/admin/crm/outings/new" className="px-3 py-1.5 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800">
          + New Outing
        </Link>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <OutingTable initialOutings={outings} onExportCsv={() => {}} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: New outing page**

```typescript
// src/app/admin/crm/outings/new/page.tsx
'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { createOuting } from '@/app/actions/crm/outings'
import { RecordHeader } from '@/components/crm/RecordHeader'
import { useEffect } from 'react'

export default function NewOutingPage() {
  const router = useRouter()
  const [state, action, pending] = useActionState(createOuting, {})

  useEffect(() => {
    if (state.success && state.id) router.push(`/admin/crm/outings/${state.id}`)
  }, [state.success, state.id, router])

  return (
    <div className="p-6 max-w-2xl">
      <RecordHeader backHref="/admin/crm/outings" backLabel="Outing Leads" title="New Outing Lead" />
      {state.error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">{state.error}</div>}
      <form action={action} className="space-y-4 bg-white rounded-xl border border-slate-200 p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Contact Name *</label>
            <input name="contact_name" required className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Contact Email</label>
            <input name="contact_email" type="email" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Contact Phone</label>
            <input name="contact_phone" type="tel" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Event Date</label>
            <input name="event_date" type="date" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Number of Golfers</label>
            <input name="num_golfers" type="number" min="1" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Preferred Course</label>
            <input name="preferred_course" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Budget Estimate ($)</label>
            <input name="budget_estimate" type="number" min="0" step="0.01" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Assigned To</label>
            <select name="assigned_to" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300">
              <option value="">Unassigned</option>
              <option value="neil">Neil</option>
              <option value="billy">Billy</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Notes</label>
            <textarea name="notes" rows={3} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none" />
          </div>
        </div>
        <button type="submit" disabled={pending} className="px-4 py-2 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 disabled:opacity-50">
          {pending ? 'Creating…' : 'Create Outing Lead'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Outing detail page**

```typescript
// src/app/admin/crm/outings/[id]/page.tsx
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { RecordHeader } from '@/components/crm/RecordHeader'
import { ActivityLog } from '@/components/crm/ActivityLog'
import { OutingDetailClient } from './OutingDetailClient'
import { getActivityLog } from '@/app/actions/crm/activity'

export const dynamic = 'force-dynamic'

export default async function OutingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const [{ data: outing }, activities] = await Promise.all([
    supabase.from('crm_outings').select('*').eq('id', id).single(),
    getActivityLog('outing', id),
  ])
  if (!outing) notFound()

  const statusColors: Record<string, 'green' | 'amber' | 'slate' | 'red' | 'blue'> = {
    confirmed: 'green', completed: 'green', quoted: 'blue',
    lead: 'slate', cancelled: 'red',
  }

  return (
    <div className="p-6 max-w-5xl">
      <RecordHeader
        backHref="/admin/crm/outings"
        backLabel="Outing Leads"
        title={outing.contact_name}
        subtitle={outing.event_date ? `Event: ${new Date(outing.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : undefined}
        badge={{ label: outing.status, color: statusColors[outing.status] ?? 'slate' }}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OutingDetailClient outing={outing} />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4 text-sm uppercase tracking-wide">Activity Log</h3>
          <ActivityLog activities={activities} />
        </div>
      </div>
    </div>
  )
}
```

Create `src/app/admin/crm/outings/[id]/OutingDetailClient.tsx`:

```typescript
// src/app/admin/crm/outings/[id]/OutingDetailClient.tsx
'use client'

import { useState } from 'react'
import { InlineEditField } from '@/components/crm/InlineEditField'
import { LogActivityModal } from '@/components/crm/LogActivityModal'
import { updateOuting, deleteOuting } from '@/app/actions/crm/outings'
import { useRouter } from 'next/navigation'
import type { CrmOuting } from '@/lib/crm/types'

interface Props { outing: CrmOuting }

export function OutingDetailClient({ outing }: Props) {
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const router = useRouter()

  async function save(field: string, value: string) {
    await updateOuting(outing.id, { [field]: value || null })
    router.refresh()
  }

  async function handleDelete() {
    await deleteOuting(outing.id)
    router.push('/admin/crm/outings')
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">Details</h3>
          <div className="flex gap-2">
            <button onClick={() => setShowActivityModal(true)} className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Log Activity</button>
            <button onClick={() => setShowDeleteConfirm(true)} className="text-xs px-3 py-1.5 border border-red-200 rounded-lg text-red-500 hover:bg-red-50">Delete</button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <InlineEditField label="Contact Email" value={outing.contact_email} onSave={(v) => save('contact_email', v)} type="email" />
          <InlineEditField label="Contact Phone" value={outing.contact_phone} onSave={(v) => save('contact_phone', v)} type="tel" />
          <InlineEditField label="Event Date" value={outing.event_date} onSave={(v) => save('event_date', v)} type="date" />
          <InlineEditField label="# Golfers" value={outing.num_golfers?.toString() ?? null} onSave={(v) => save('num_golfers', v)} type="number" />
          <InlineEditField label="Preferred Course" value={outing.preferred_course} onSave={(v) => save('preferred_course', v)} />
          <InlineEditField label="Budget Estimate ($)" value={outing.budget_estimate?.toString() ?? null} onSave={(v) => save('budget_estimate', v)} type="number" />
          <div className="col-span-2">
            <InlineEditField label="Notes" value={outing.notes} onSave={(v) => save('notes', v)} type="textarea" />
          </div>
        </div>
      </div>

      {showActivityModal && (
        <LogActivityModal
          recordType="outing"
          recordId={outing.id}
          assignee={outing.assigned_to ?? 'neil'}
          onClose={() => setShowActivityModal(false)}
          onLogged={() => router.refresh()}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold text-slate-800 mb-2">Delete outing for {outing.contact_name}?</h3>
            <p className="text-sm text-slate-500 mb-4">This will permanently delete this outing and all activity history.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowDeleteConfirm(false)} className="text-sm px-4 py-2 text-slate-500">Cancel</button>
              <button onClick={handleDelete} className="text-sm px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 5: Compile check**

```bash
npx tsc --noEmit 2>&1 | grep "crm/outings" | head -10
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/crm/outings/ src/components/crm/OutingTable.tsx
git commit -m "feat: outing list, new, and detail pages"
```

---

### Task 11: Member pages (list, new, detail)

**Files:**
- Create: `src/components/crm/MemberTable.tsx`
- Create: `src/app/admin/crm/members/page.tsx`
- Create: `src/app/admin/crm/members/new/page.tsx`
- Create: `src/app/admin/crm/members/[id]/page.tsx`

- [ ] **Step 1: MemberTable component**

```typescript
// src/components/crm/MemberTable.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { CrmMember, CrmMemberTier, CrmMemberStatus } from '@/lib/crm/types'

const tierColors: Record<CrmMemberTier, string> = {
  free: 'bg-slate-100 text-slate-600',
  eagle: 'bg-blue-100 text-blue-700',
  ace: 'bg-amber-100 text-amber-700',
}

const statusColors: Record<CrmMemberStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  lapsed: 'bg-amber-100 text-amber-700',
  churned: 'bg-red-100 text-red-500',
}

interface Props {
  initialMembers: CrmMember[]
  onExportCsv: () => void
}

export function MemberTable({ initialMembers, onExportCsv }: Props) {
  const [tierFilter, setTierFilter] = useState<CrmMemberTier | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<CrmMemberStatus | 'all'>('all')

  const filtered = initialMembers.filter((m) => {
    if (tierFilter !== 'all' && m.membership_tier !== tierFilter) return false
    if (statusFilter !== 'all' && m.status !== statusFilter) return false
    return true
  })

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value as CrmMemberTier | 'all')}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none"
        >
          <option value="all">All Tiers</option>
          <option value="free">Free</option>
          <option value="eagle">Eagle</option>
          <option value="ace">Ace</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as CrmMemberStatus | 'all')}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="lapsed">Lapsed</option>
          <option value="churned">Churned</option>
        </select>
        <span className="text-xs text-slate-400 ml-1">{filtered.length} members</span>
        <button onClick={onExportCsv} className="ml-auto text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded px-3 py-1">
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">Name</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">Email</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">Tier</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">Status</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">Home Course</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">Join Date</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">Lifetime $</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((member) => (
              <tr key={member.id} className="hover:bg-slate-50">
                <td className="px-3 py-2">
                  <Link href={`/admin/crm/members/${member.id}`} className="font-medium text-slate-800 hover:text-emerald-700">
                    {member.name}
                  </Link>
                </td>
                <td className="px-3 py-2 text-slate-600">{member.email ?? '—'}</td>
                <td className="px-3 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${tierColors[member.membership_tier]}`}>
                    {member.membership_tier}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[member.status]}`}>
                    {member.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-slate-600">{member.home_course ?? '—'}</td>
                <td className="px-3 py-2 text-slate-500">
                  {member.join_date ? new Date(member.join_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </td>
                <td className="px-3 py-2 text-slate-600">
                  {member.lifetime_spend > 0 ? `$${member.lifetime_spend.toLocaleString()}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-slate-400 text-sm py-8">No members match the filter.</p>}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Members list page**

```typescript
// src/app/admin/crm/members/page.tsx
import { createAdminClient } from '@/lib/supabase/admin'
import { MemberTable } from '@/components/crm/MemberTable'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CrmMembersPage() {
  const supabase = createAdminClient()
  const { data: members } = await supabase
    .from('crm_members')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Members</h1>
        <Link href="/admin/crm/members/new" className="px-3 py-1.5 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800">
          + New Member
        </Link>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <MemberTable initialMembers={members ?? []} onExportCsv={() => {}} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: New member page**

```typescript
// src/app/admin/crm/members/new/page.tsx
'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { createCrmMember } from '@/app/actions/crm/members'
import { RecordHeader } from '@/components/crm/RecordHeader'
import { useEffect } from 'react'

export default function NewMemberPage() {
  const router = useRouter()
  const [state, action, pending] = useActionState(createCrmMember, {})

  useEffect(() => {
    if (state.success && state.id) router.push(`/admin/crm/members/${state.id}`)
  }, [state.success, state.id, router])

  return (
    <div className="p-6 max-w-2xl">
      <RecordHeader backHref="/admin/crm/members" backLabel="Members" title="New Member" />
      {state.error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">{state.error}</div>}
      <form action={action} className="space-y-4 bg-white rounded-xl border border-slate-200 p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Name *</label>
            <input name="name" required className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Email</label>
            <input name="email" type="email" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Phone</label>
            <input name="phone" type="tel" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Membership Tier</label>
            <select name="membership_tier" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300">
              <option value="free">Free</option>
              <option value="eagle">Eagle</option>
              <option value="ace">Ace</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Status</label>
            <select name="status" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300">
              <option value="active">Active</option>
              <option value="lapsed">Lapsed</option>
              <option value="churned">Churned</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Home Course</label>
            <input name="home_course" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Join Date</label>
            <input name="join_date" type="date" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Lifetime Spend ($)</label>
            <input name="lifetime_spend" type="number" min="0" step="0.01" defaultValue="0" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Notes</label>
            <textarea name="notes" rows={3} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none" />
          </div>
        </div>
        <button type="submit" disabled={pending} className="px-4 py-2 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 disabled:opacity-50">
          {pending ? 'Creating…' : 'Create Member'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Member detail page**

```typescript
// src/app/admin/crm/members/[id]/page.tsx
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { RecordHeader } from '@/components/crm/RecordHeader'
import { ActivityLog } from '@/components/crm/ActivityLog'
import { MemberDetailClient } from './MemberDetailClient'
import { getActivityLog } from '@/app/actions/crm/activity'

export const dynamic = 'force-dynamic'

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const [{ data: member }, activities] = await Promise.all([
    supabase.from('crm_members').select('*').eq('id', id).single(),
    getActivityLog('member', id),
  ])
  if (!member) notFound()

  const tierColors: Record<string, 'green' | 'amber' | 'slate' | 'red' | 'blue'> = {
    ace: 'amber', eagle: 'blue', free: 'slate',
  }

  return (
    <div className="p-6 max-w-5xl">
      <RecordHeader
        backHref="/admin/crm/members"
        backLabel="Members"
        title={member.name}
        subtitle={member.email ?? undefined}
        badge={{ label: member.membership_tier, color: tierColors[member.membership_tier] ?? 'slate' }}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MemberDetailClient member={member} />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4 text-sm uppercase tracking-wide">Activity Log</h3>
          <ActivityLog activities={activities} />
        </div>
      </div>
    </div>
  )
}
```

Create `src/app/admin/crm/members/[id]/MemberDetailClient.tsx`:

```typescript
// src/app/admin/crm/members/[id]/MemberDetailClient.tsx
'use client'

import { useState } from 'react'
import { InlineEditField } from '@/components/crm/InlineEditField'
import { LogActivityModal } from '@/components/crm/LogActivityModal'
import { updateCrmMember, deleteCrmMember } from '@/app/actions/crm/members'
import { useRouter } from 'next/navigation'
import type { CrmMember } from '@/lib/crm/types'

interface Props { member: CrmMember }

export function MemberDetailClient({ member }: Props) {
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const router = useRouter()

  async function save(field: string, value: string) {
    await updateCrmMember(member.id, { [field]: value || null })
    router.refresh()
  }

  async function handleDelete() {
    await deleteCrmMember(member.id)
    router.push('/admin/crm/members')
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">Details</h3>
          <div className="flex gap-2">
            <button onClick={() => setShowActivityModal(true)} className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Log Activity</button>
            <button onClick={() => setShowDeleteConfirm(true)} className="text-xs px-3 py-1.5 border border-red-200 rounded-lg text-red-500 hover:bg-red-50">Delete</button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <InlineEditField label="Email" value={member.email} onSave={(v) => save('email', v)} type="email" />
          <InlineEditField label="Phone" value={member.phone} onSave={(v) => save('phone', v)} type="tel" />
          <InlineEditField label="Home Course" value={member.home_course} onSave={(v) => save('home_course', v)} />
          <InlineEditField label="Join Date" value={member.join_date} onSave={(v) => save('join_date', v)} type="date" />
          <InlineEditField label="Lifetime Spend ($)" value={member.lifetime_spend?.toString() ?? '0'} onSave={(v) => save('lifetime_spend', v)} type="number" />
          <div className="col-span-2">
            <InlineEditField label="Notes" value={member.notes} onSave={(v) => save('notes', v)} type="textarea" />
          </div>
        </div>
      </div>

      {showActivityModal && (
        <LogActivityModal
          recordType="member"
          recordId={member.id}
          assignee="neil"
          onClose={() => setShowActivityModal(false)}
          onLogged={() => router.refresh()}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold text-slate-800 mb-2">Delete {member.name}?</h3>
            <p className="text-sm text-slate-500 mb-4">This will permanently delete this member and all activity history.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowDeleteConfirm(false)} className="text-sm px-4 py-2 text-slate-500">Cancel</button>
              <button onClick={handleDelete} className="text-sm px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 5: Final compile check for all Plan 2 work**

```bash
npx tsc --noEmit 2>&1 | grep -E "crm/" | head -20
```

Expected: no errors.

- [ ] **Step 6: Run all CRM tests**

```bash
npx vitest run src/app/actions/crm/ 2>&1 | tail -15
```

Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/admin/crm/members/ src/components/crm/MemberTable.tsx
git commit -m "feat: member list, new, and detail pages — Plan 2 complete"
```

---

**Plan 2 complete.** All three record types (courses, outings, members) are fully functional with list pages, detail pages, inline editing, activity logging, and delete confirmations. The Kanban board supports drag-and-drop stage updates.

**Next:** Execute [Plan 3 — Advanced Features](2026-04-28-crm-3-advanced.md) to add email sending, PDF generation, the stale lead cron job, CSV export, and seed data.

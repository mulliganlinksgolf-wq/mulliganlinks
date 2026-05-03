# Course Portal Role-Based Access Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce owner/manager/staff role restrictions in the `/course/[slug]/` portal and give owners/managers a self-serve UI to invite and remove staff members.

**Architecture:** The layout already resolves the caller's `role` from `course_admins` on every request — we add a `ROUTE_ROLES` map there to block/redirect staff from restricted pages and filter the nav. A new `/settings/team` sub-page plus two server actions handle invite (via Supabase `inviteUserByEmail`) and remove. No DB schema changes required.

**Tech Stack:** Next.js App Router (server components + server actions), Supabase Auth Admin API (`inviteUserByEmail`), `createAdminClient` for DB writes, `revalidatePath` for cache invalidation.

---

### Task 1: Access enforcement in layout + unauthorized page

**Files:**
- Modify: `src/app/course/[slug]/layout.tsx`
- Create: `src/app/course/[slug]/unauthorized/page.tsx`

- [ ] **Step 1: Create the unauthorized page**

Create `src/app/course/[slug]/unauthorized/page.tsx`:

```tsx
export default async function UnauthorizedPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="text-4xl mb-4">🔒</div>
      <h1 className="text-xl font-bold text-[#1A1A1A] mb-2">Access restricted</h1>
      <p className="text-[#6B7770] mb-6 max-w-sm">
        You don&apos;t have permission to view this section. Contact your course manager if you need access.
      </p>
      <a
        href={`/course/${slug}`}
        className="px-4 py-2 rounded-lg bg-[#1B4332] text-white text-sm font-medium hover:bg-[#163d2a] transition-colors"
      >
        ← Back to tee sheet
      </a>
    </div>
  )
}
```

- [ ] **Step 2: Add ROUTE_ROLES map and enforcement to layout.tsx**

Open `src/app/course/[slug]/layout.tsx`. After the existing imports, add the `ROUTE_ROLES` constant and update the layout as shown. The full updated file:

```tsx
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'

const MANAGER_ROLES = ['owner', 'manager']

// Segments restricted to owner/manager. Anything not listed allows all roles.
const RESTRICTED_SEGMENTS = new Set([
  'payments',
  'reports',
  'dashboard',
  'billing',
  'settings',
])

export default async function CourseAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/course/${slug}/login`)

  const { data: course } = await supabase
    .from('courses')
    .select('id, name, slug')
    .eq('slug', slug)
    .single()

  if (!course) notFound()

  const admin = createAdminClient()
  const [
    { data: profile },
    { data: courseAdmin },
    { data: courseUser },
  ] = await Promise.all([
    admin.from('profiles').select('is_admin').eq('id', user.id).single(),
    admin.from('course_admins').select('role').eq('user_id', user.id).eq('course_id', course.id).single(),
    admin.from('crm_course_users').select('role').eq('user_id', user.id).eq('course_id', course.id).single(),
  ])

  const isGlobalAdmin = profile?.is_admin === true
  if (!isGlobalAdmin && !courseAdmin && !courseUser) redirect(`/course/${slug}/login`)

  const role = isGlobalAdmin ? 'owner' : (courseAdmin?.role ?? courseUser?.role ?? 'staff')

  // Enforce role restrictions — global admins bypass all checks
  if (!isGlobalAdmin) {
    const hdrs = await headers()
    const pathname = hdrs.get('x-pathname') ?? hdrs.get('x-invoke-path') ?? ''
    // Extract the segment after /course/[slug]/
    const afterSlug = pathname.replace(`/course/${slug}`, '').replace(/^\//, '')
    const segment = afterSlug.split('/')[0]
    if (segment && RESTRICTED_SEGMENTS.has(segment) && !MANAGER_ROLES.includes(role)) {
      redirect(`/course/${slug}/unauthorized`)
    }
  }

  const allNavItems = [
    { href: `/course/${slug}`, label: 'Tee Sheet' },
    { href: `/course/${slug}/check-in`, label: 'Check-in' },
    { href: `/course/${slug}/bookings`, label: 'Bookings' },
    { href: `/course/${slug}/members`, label: 'Members' },
    { href: `/course/${slug}/payments`, label: 'Payments', restricted: true },
    { href: `/course/${slug}/dashboard`, label: 'Dashboard', restricted: true },
    { href: `/course/${slug}/reports`, label: 'Reports', restricted: true },
    { href: `/course/${slug}/billing`, label: 'Billing', restricted: true },
    { href: `/course/${slug}/settings`, label: 'Settings', restricted: true },
  ]

  const navItems = (isGlobalAdmin || MANAGER_ROLES.includes(role))
    ? allNavItems
    : allNavItems.filter(item => !item.restricted)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#1B4332] text-[#FAF7F2] px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/app" className="text-[#FAF7F2]/60 hover:text-[#FAF7F2] text-sm">← teeahead</Link>
            <span className="text-[#FAF7F2]/40">|</span>
            <span className="font-semibold">{course.name}</span>
          </div>
          <span className="text-xs text-[#FAF7F2]/60 uppercase tracking-wider">{role}</span>
        </div>
      </header>
      <nav className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-7xl mx-auto flex gap-0">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="px-4 py-3 text-sm font-medium text-[#6B7770] hover:text-[#1A1A1A] border-b-2 border-transparent hover:border-[#1B4332] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-6">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Verify the approach works for reading the pathname**

Next.js App Router does not expose the current pathname to server components directly. The `headers()` approach with `x-pathname` only works if a middleware sets that header. Instead, use a simpler approach: pass `params` to check from context. Update the segment detection to use `searchParams` pattern — actually the cleanest approach in Next.js App Router is to NOT read the path in the layout at all, but instead use `redirect` inside each restricted page.

**Revise Step 2** — remove the headers-based path check from the layout entirely. Instead, the layout only filters the nav. Enforcement happens via a shared helper called from each restricted page server component.

Replace the layout with this simpler version (no path reading, nav filtering only):

```tsx
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MANAGER_ROLES = ['owner', 'manager']

export default async function CourseAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/course/${slug}/login`)

  const { data: course } = await supabase
    .from('courses')
    .select('id, name, slug')
    .eq('slug', slug)
    .single()

  if (!course) notFound()

  const admin = createAdminClient()
  const [
    { data: profile },
    { data: courseAdmin },
    { data: courseUser },
  ] = await Promise.all([
    admin.from('profiles').select('is_admin').eq('id', user.id).single(),
    admin.from('course_admins').select('role').eq('user_id', user.id).eq('course_id', course.id).single(),
    admin.from('crm_course_users').select('role').eq('user_id', user.id).eq('course_id', course.id).single(),
  ])

  const isGlobalAdmin = profile?.is_admin === true
  if (!isGlobalAdmin && !courseAdmin && !courseUser) redirect(`/course/${slug}/login`)

  const role = isGlobalAdmin ? 'owner' : (courseAdmin?.role ?? courseUser?.role ?? 'staff')
  const isManager = isGlobalAdmin || MANAGER_ROLES.includes(role)

  const allNavItems = [
    { href: `/course/${slug}`, label: 'Tee Sheet', managerOnly: false },
    { href: `/course/${slug}/check-in`, label: 'Check-in', managerOnly: false },
    { href: `/course/${slug}/bookings`, label: 'Bookings', managerOnly: false },
    { href: `/course/${slug}/members`, label: 'Members', managerOnly: false },
    { href: `/course/${slug}/payments`, label: 'Payments', managerOnly: true },
    { href: `/course/${slug}/dashboard`, label: 'Dashboard', managerOnly: true },
    { href: `/course/${slug}/reports`, label: 'Reports', managerOnly: true },
    { href: `/course/${slug}/billing`, label: 'Billing', managerOnly: true },
    { href: `/course/${slug}/settings`, label: 'Settings', managerOnly: true },
  ]

  const navItems = allNavItems.filter(item => !item.managerOnly || isManager)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#1B4332] text-[#FAF7F2] px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/app" className="text-[#FAF7F2]/60 hover:text-[#FAF7F2] text-sm">← teeahead</Link>
            <span className="text-[#FAF7F2]/40">|</span>
            <span className="font-semibold">{course.name}</span>
          </div>
          <span className="text-xs text-[#FAF7F2]/60 uppercase tracking-wider">{role}</span>
        </div>
      </header>
      <nav className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-7xl mx-auto flex gap-0">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="px-4 py-3 text-sm font-medium text-[#6B7770] hover:text-[#1A1A1A] border-b-2 border-transparent hover:border-[#1B4332] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-6">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Create shared role-guard helper**

Create `src/lib/courseRole.ts`:

```ts
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export const MANAGER_ROLES = ['owner', 'manager']

export interface CourseRoleContext {
  userId: string
  courseId: string
  role: string
  isGlobalAdmin: boolean
  isManager: boolean
}

/**
 * Resolves the caller's role for a course. Redirects if not authenticated or not a member.
 * Call at the top of any restricted page server component.
 */
export async function resolveCourseRole(slug: string): Promise<CourseRoleContext> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/course/${slug}/login`)

  const admin = createAdminClient()
  const { data: course } = await admin
    .from('courses')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!course) redirect(`/course/${slug}/login`)

  const [
    { data: profile },
    { data: courseAdmin },
    { data: courseUser },
  ] = await Promise.all([
    admin.from('profiles').select('is_admin').eq('id', user.id).single(),
    admin.from('course_admins').select('role').eq('user_id', user.id).eq('course_id', course.id).single(),
    admin.from('crm_course_users').select('role').eq('user_id', user.id).eq('course_id', course.id).single(),
  ])

  const isGlobalAdmin = profile?.is_admin === true
  if (!isGlobalAdmin && !courseAdmin && !courseUser) redirect(`/course/${slug}/login`)

  const role = isGlobalAdmin ? 'owner' : (courseAdmin?.role ?? courseUser?.role ?? 'staff')
  const isManager = isGlobalAdmin || MANAGER_ROLES.includes(role)

  return { userId: user.id, courseId: course.id, role, isGlobalAdmin, isManager }
}

/**
 * Call at the top of any manager-only page. Redirects staff to the unauthorized page.
 */
export async function requireManager(slug: string): Promise<CourseRoleContext> {
  const ctx = await resolveCourseRole(slug)
  if (!ctx.isManager) redirect(`/course/${slug}/unauthorized`)
  return ctx
}
```

- [ ] **Step 5: Add requireManager guard to each restricted page**

The restricted pages are: `payments`, `reports`, `dashboard`, `billing`, `settings`. Add this at the very top of each page's default export (before any other data fetching):

For each file below, add the import and guard call. Show payments as the example — repeat the same pattern for the others.

In `src/app/course/[slug]/payments/page.tsx`, add after the existing imports:
```ts
import { requireManager } from '@/lib/courseRole'
```
And as the first line inside the function body:
```ts
await requireManager(slug)
```

Repeat for:
- `src/app/course/[slug]/reports/page.tsx`
- `src/app/course/[slug]/reports/rounds/page.tsx` (and any other reports sub-pages)
- `src/app/course/[slug]/dashboard/page.tsx`
- `src/app/course/[slug]/billing/page.tsx`
- `src/app/course/[slug]/settings/page.tsx`

- [ ] **Step 6: Commit**

```bash
git add src/app/course/\[slug\]/layout.tsx \
        src/app/course/\[slug\]/unauthorized/page.tsx \
        src/lib/courseRole.ts \
        src/app/course/\[slug\]/payments/page.tsx \
        src/app/course/\[slug\]/reports/page.tsx \
        src/app/course/\[slug\]/dashboard/page.tsx \
        src/app/course/\[slug\]/billing/page.tsx \
        src/app/course/\[slug\]/settings/page.tsx
git commit -m "feat: enforce course role restrictions — staff blocked from financial/admin pages"
```

---

### Task 2: Server actions for invite and remove

**Files:**
- Create: `src/lib/actions/courseTeam.ts`

- [ ] **Step 1: Create the server actions file**

Create `src/lib/actions/courseTeam.ts`:

```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { MANAGER_ROLES } from '@/lib/courseRole'

async function assertManager(courseId: string): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles').select('is_admin').eq('id', user.id).single()

  if (profile?.is_admin) return user.id

  const { data: courseAdmin } = await admin
    .from('course_admins')
    .select('role')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()

  if (!courseAdmin || !MANAGER_ROLES.includes(courseAdmin.role)) {
    throw new Error('Forbidden')
  }
  return user.id
}

export async function inviteStaff(
  email: string,
  courseId: string,
  slug: string,
): Promise<void> {
  await assertManager(courseId)

  const admin = createAdminClient()
  const { data: invited, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/course/${slug}`,
  })
  if (error) throw new Error(error.message)

  const userId = invited.user.id
  const { error: insertError } = await admin.from('course_admins').upsert(
    { user_id: userId, course_id: courseId, role: 'staff' },
    { onConflict: 'user_id,course_id', ignoreDuplicates: true },
  )
  if (insertError) throw new Error(insertError.message)

  revalidatePath(`/course/${slug}/settings/team`)
}

export async function removeStaff(
  targetUserId: string,
  courseId: string,
  slug: string,
): Promise<void> {
  await assertManager(courseId)

  const admin = createAdminClient()
  const { error } = await admin
    .from('course_admins')
    .delete()
    .eq('user_id', targetUserId)
    .eq('course_id', courseId)
    .eq('role', 'staff') // safety: can only remove staff, not owners/managers

  if (error) throw new Error(error.message)
  revalidatePath(`/course/${slug}/settings/team`)
}
```

- [ ] **Step 2: Confirm NEXT_PUBLIC_SITE_URL is set**

Check `.env.local` (or Vercel env vars) for `NEXT_PUBLIC_SITE_URL=https://teeahead.com`. If it's missing, add it. This is used to build the invite redirect URL.

```bash
grep NEXT_PUBLIC_SITE_URL .env.local 2>/dev/null || echo "ADD: NEXT_PUBLIC_SITE_URL=https://teeahead.com to .env.local and Vercel"
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/courseTeam.ts
git commit -m "feat: add inviteStaff and removeStaff server actions"
```

---

### Task 3: Team management UI

**Files:**
- Create: `src/app/course/[slug]/settings/team/page.tsx`
- Create: `src/app/course/[slug]/settings/team/InviteStaffModal.tsx`
- Create: `src/app/course/[slug]/settings/team/RemoveStaffButton.tsx`

- [ ] **Step 1: Create RemoveStaffButton client component**

Create `src/app/course/[slug]/settings/team/RemoveStaffButton.tsx`:

```tsx
'use client'

import { useTransition } from 'react'
import { removeStaff } from '@/lib/actions/courseTeam'

export default function RemoveStaffButton({
  targetUserId,
  courseId,
  slug,
  name,
}: {
  targetUserId: string
  courseId: string
  slug: string
  name: string
}) {
  const [pending, startTransition] = useTransition()

  function handleRemove() {
    if (!confirm(`Remove ${name} from this course? They will lose portal access immediately.`)) return
    startTransition(async () => {
      await removeStaff(targetUserId, courseId, slug)
    })
  }

  return (
    <button
      onClick={handleRemove}
      disabled={pending}
      className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50 font-medium"
    >
      {pending ? 'Removing…' : 'Remove'}
    </button>
  )
}
```

- [ ] **Step 2: Create InviteStaffModal client component**

Create `src/app/course/[slug]/settings/team/InviteStaffModal.tsx`:

```tsx
'use client'

import { useState, useTransition } from 'react'
import { inviteStaff } from '@/lib/actions/courseTeam'

export default function InviteStaffModal({
  courseId,
  slug,
}: {
  courseId: string
  slug: string
}) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        await inviteStaff(email, courseId, slug)
        setSuccess(true)
        setTimeout(() => {
          setOpen(false)
          setEmail('')
          setSuccess(false)
        }, 2000)
      } catch (err: any) {
        setError(err.message ?? 'Failed to send invite')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-lg bg-[#1B4332] text-white text-sm font-medium hover:bg-[#163d2a] transition-colors"
      >
        + Invite staff member
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-1">Invite staff member</h2>
            <p className="text-sm text-[#6B7770] mb-4">
              They&apos;ll receive an email to set up their account and will have access to the tee sheet, check-in, bookings, and members pages.
            </p>

            {success ? (
              <p className="text-sm text-emerald-700 font-medium">✓ Invite sent to {email}</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Email address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="staff@thecourse.com"
                    className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
                  />
                </div>
                {error && <p className="text-xs text-red-600">{error}</p>}
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => { setOpen(false); setEmail(''); setError(null) }}
                    className="px-4 py-2 text-sm text-[#6B7770] hover:text-[#1A1A1A]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="px-4 py-2 rounded-lg bg-[#1B4332] text-white text-sm font-medium hover:bg-[#163d2a] disabled:opacity-50 transition-colors"
                  >
                    {pending ? 'Sending…' : 'Send invite'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 3: Create team page server component**

Create `src/app/course/[slug]/settings/team/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireManager } from '@/lib/courseRole'
import InviteStaffModal from './InviteStaffModal'
import RemoveStaffButton from './RemoveStaffButton'

export default async function CourseTeamPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { courseId } = await requireManager(slug)

  const admin = createAdminClient()
  const { data: members } = await admin
    .from('course_admins')
    .select('user_id, role, created_at, profiles_with_email(full_name, email)')
    .eq('course_id', courseId)
    .order('created_at', { ascending: true })

  if (!members) notFound()

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A]">Team</h1>
          <p className="text-sm text-[#6B7770] mt-0.5">Manage who has access to this course portal.</p>
        </div>
        <InviteStaffModal courseId={courseId} slug={slug} />
      </div>

      <div className="bg-white rounded-xl ring-1 ring-black/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#FAF7F2] border-b border-black/5">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Name</th>
              <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Email</th>
              <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Role</th>
              <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Added</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {(members as any[]).map(m => {
              const pwe = m.profiles_with_email as any
              const name = pwe?.full_name ?? '—'
              const email = pwe?.email ?? '—'
              const isStaff = m.role === 'staff'
              return (
                <tr key={m.user_id} className="hover:bg-[#FAF7F2]/50">
                  <td className="px-4 py-3 font-medium text-[#1A1A1A]">{name}</td>
                  <td className="px-4 py-3 text-[#6B7770]">{email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                      m.role === 'owner'   ? 'bg-[#1B4332]/10 text-[#1B4332]' :
                      m.role === 'manager' ? 'bg-amber-50 text-amber-700' :
                                            'bg-gray-100 text-gray-600'
                    }`}>
                      {m.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#6B7770]">
                    {new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isStaff && (
                      <RemoveStaffButton
                        targetUserId={m.user_id}
                        courseId={courseId}
                        slug={slug}
                        name={name}
                      />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Add Team link to Settings page**

Open `src/app/course/[slug]/settings/page.tsx`. Add a "Team" card/link below the existing settings form:

```tsx
import Link from 'next/link'
```

Add at the bottom of the returned JSX, after the `<CourseSettingsForm />`:

```tsx
<div className="mt-6 bg-white rounded-xl ring-1 ring-black/5 p-5 flex items-center justify-between">
  <div>
    <p className="font-semibold text-[#1A1A1A] text-sm">Team members</p>
    <p className="text-xs text-[#6B7770] mt-0.5">Invite and manage staff who can access this portal.</p>
  </div>
  <Link
    href={`/course/${slug}/settings/team`}
    className="text-sm font-medium text-[#1B4332] hover:underline"
  >
    Manage →
  </Link>
</div>
```

- [ ] **Step 5: Commit**

```bash
git add src/app/course/\[slug\]/settings/team/ src/app/course/\[slug\]/settings/page.tsx
git commit -m "feat: add team management page with invite and remove staff"
```

---

### Task 4: Final check and push

- [ ] **Step 1: Check for TypeScript errors**

```bash
cd /Users/barris/Desktop/MulliganLinks && npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -30
```

Expected: no new errors. Pre-existing errors in test files can be ignored (known issue).

- [ ] **Step 2: Verify reports sub-pages also have requireManager**

```bash
ls src/app/course/\[slug\]/reports/
```

Add `await requireManager(slug)` to any sub-pages found (e.g. `rounds/page.tsx`, `revenue/page.tsx`) that don't already have it, following the same pattern as Step 5 in Task 1.

- [ ] **Step 3: Push to production**

```bash
git push origin main
```

Expected: Vercel build triggers and deploys. Confirm at https://teeahead.com/course/pilot-course/settings/team after deploy.

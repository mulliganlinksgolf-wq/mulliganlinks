# Reports Module — Plan 1: Database Schema & Course Partner Auth

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four new DB tables and a complete course partner auth flow (invite → setup → login) so course GMs can access their portal.

**Architecture:** New Supabase tables extend the existing schema. Course partner passwords are managed by Supabase Auth; `crm_course_users` is a profile table linking `auth.users` to a course. The existing `course_admins` table and auth keep working — we add `crm_course_users` as a parallel auth path. Admins bypass all course-level checks via `profiles.is_admin`.

**Tech Stack:** Next.js 14 App Router, Supabase (Postgres + Auth), TypeScript, Tailwind CSS, Resend

**Depends on:** Nothing — this is the foundation.

---

### Task 1: DB Migration

**Files:**
- Create: `supabase/migrations/031_reports_schema.sql`

> Before writing any Next.js code in later tasks, read `node_modules/next/dist/docs/` for App Router server action and middleware patterns.

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/031_reports_schema.sql

-- Course partner user accounts (passwords managed by Supabase Auth)
CREATE TABLE IF NOT EXISTS crm_course_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'owner',
  setup_token VARCHAR(255),
  setup_token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_crm_course_users_user_id ON crm_course_users(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_course_users_course_id ON crm_course_users(course_id);
CREATE INDEX IF NOT EXISTS idx_crm_course_users_token
  ON crm_course_users(setup_token) WHERE setup_token IS NOT NULL;

-- Monthly course-level metrics (populated by booking data or manual seed)
CREATE TABLE IF NOT EXISTS crm_course_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL,                    -- YYYY-MM
  rounds_booked INTEGER DEFAULT 0,
  green_fee_revenue DECIMAL(10,2) DEFAULT 0,
  avg_green_fee DECIMAL(10,2) DEFAULT 0,
  members_attributed INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  points_redeemed INTEGER DEFAULT 0,
  waitlist_fills INTEGER DEFAULT 0,
  total_cancellations INTEGER DEFAULT 0,
  cancellations_recovered_revenue DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, month)
);

-- Monthly platform-wide member metrics
CREATE TABLE IF NOT EXISTS crm_member_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month VARCHAR(7) NOT NULL UNIQUE,
  new_members_free INTEGER DEFAULT 0,
  new_members_eagle INTEGER DEFAULT 0,
  new_members_ace INTEGER DEFAULT 0,
  churned_members INTEGER DEFAULT 0,
  lapsed_members INTEGER DEFAULT 0,
  total_active INTEGER DEFAULT 0,
  mrr_eagle DECIMAL(10,2) DEFAULT 0,
  mrr_ace DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Manual expense entries (admin input via P&L page)
CREATE TABLE IF NOT EXISTS crm_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  month VARCHAR(7) NOT NULL,
  notes TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, month)
);

-- Ensure courses.slug column exists (may already be present)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE;

-- RLS: all queries from app use admin client (service role), which bypasses RLS
ALTER TABLE crm_course_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_course_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_member_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_crm_course_users" ON crm_course_users TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_crm_course_metrics" ON crm_course_metrics TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_crm_member_metrics" ON crm_member_metrics TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_crm_expenses" ON crm_expenses TO service_role USING (true) WITH CHECK (true);
```

- [ ] **Step 2: Apply the migration**

```bash
npx supabase db push
```

Expected: migration applied without errors.

- [ ] **Step 3: Verify tables exist**

```bash
npx supabase db execute --sql "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'crm_%' ORDER BY table_name"
```

Expected output: `crm_course_metrics`, `crm_course_users`, `crm_expenses`, `crm_member_metrics`

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/031_reports_schema.sql
git commit -m "feat: add crm_course_users, crm_course_metrics, crm_member_metrics, crm_expenses tables"
```

---

### Task 2: Update Course Portal Layout for Dual Auth

The existing layout at `src/app/course/[slug]/layout.tsx` checks `course_admins`. We need it to also accept `crm_course_users` and global admins, and add "Reports" to the nav. It also currently redirects to `/login` on failure — change that to `/course/[slug]/login`.

**Files:**
- Modify: `src/app/course/[slug]/layout.tsx`
- Create: `src/app/course/[slug]/__tests__/auth-logic.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/app/course/[slug]/__tests__/auth-logic.test.ts
import { describe, it, expect } from 'vitest'

function checkCourseAccess(opts: {
  isGlobalAdmin: boolean
  inCourseAdmins: boolean
  inCrmCourseUsers: boolean
}): boolean {
  return opts.isGlobalAdmin || opts.inCourseAdmins || opts.inCrmCourseUsers
}

describe('course portal access logic', () => {
  it('allows global admin with no course record', () => {
    expect(checkCourseAccess({ isGlobalAdmin: true, inCourseAdmins: false, inCrmCourseUsers: false })).toBe(true)
  })
  it('allows user in course_admins', () => {
    expect(checkCourseAccess({ isGlobalAdmin: false, inCourseAdmins: true, inCrmCourseUsers: false })).toBe(true)
  })
  it('allows user in crm_course_users', () => {
    expect(checkCourseAccess({ isGlobalAdmin: false, inCourseAdmins: false, inCrmCourseUsers: true })).toBe(true)
  })
  it('denies user with no association', () => {
    expect(checkCourseAccess({ isGlobalAdmin: false, inCourseAdmins: false, inCrmCourseUsers: false })).toBe(false)
  })
})
```

- [ ] **Step 2: Run test**

```bash
npx vitest run "src/app/course/\[slug\]/__tests__/auth-logic.test.ts"
```

Expected: 4 passing

- [ ] **Step 3: Replace layout.tsx**

```typescript
// src/app/course/[slug]/layout.tsx
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

  const role = isGlobalAdmin ? 'admin' : (courseAdmin?.role ?? courseUser?.role ?? 'owner')

  const navItems = [
    { href: `/course/${slug}`, label: 'Tee Sheet' },
    { href: `/course/${slug}/check-in`, label: 'Check-in' },
    { href: `/course/${slug}/bookings`, label: 'Bookings' },
    { href: `/course/${slug}/members`, label: 'Members' },
    { href: `/course/${slug}/payments`, label: 'Payments' },
    { href: `/course/${slug}/dashboard`, label: 'Dashboard' },
    { href: `/course/${slug}/reports`, label: 'Reports' },
    { href: `/course/${slug}/settings`, label: 'Settings' },
  ]

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

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/app/course/\[slug\]/layout.tsx src/app/course/\[slug\]/__tests__/auth-logic.test.ts
git commit -m "feat: course portal accepts crm_course_users auth, adds Reports nav item"
```

---

### Task 3: Course Partner Login Page

**Files:**
- Create: `src/app/course/[slug]/login/page.tsx`
- Create: `src/app/course/[slug]/login/LoginForm.tsx`
- Create: `src/app/course/[slug]/login/actions.ts`

- [ ] **Step 1: Create the server action**

```typescript
// src/app/course/[slug]/login/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function loginCoursePartner(
  formData: FormData,
  slug: string,
): Promise<{ error: string }> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) return { error: 'Invalid email or password' }

  const admin = createAdminClient()
  const { data: course } = await admin.from('courses').select('id').eq('slug', slug).single()
  if (!course) {
    await supabase.auth.signOut()
    return { error: 'Course not found' }
  }

  const [{ data: profile }, { data: courseAdmin }, { data: courseUser }] = await Promise.all([
    admin.from('profiles').select('is_admin').eq('id', data.user.id).single(),
    admin.from('course_admins').select('id').eq('user_id', data.user.id).eq('course_id', course.id).single(),
    admin.from('crm_course_users').select('id').eq('user_id', data.user.id).eq('course_id', course.id).single(),
  ])

  if (!profile?.is_admin && !courseAdmin && !courseUser) {
    await supabase.auth.signOut()
    return { error: 'You do not have access to this portal' }
  }

  if (courseUser) {
    await admin
      .from('crm_course_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', courseUser.id)
  }

  redirect(`/course/${slug}/reports`)
}
```

- [ ] **Step 2: Create the client login form**

```typescript
// src/app/course/[slug]/login/LoginForm.tsx
'use client'

import { useState } from 'react'
import { loginCoursePartner } from './actions'

export default function LoginForm({ slug }: { slug: string }) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await loginCoursePartner(new FormData(e.currentTarget), slug)
    if (result?.error) { setError(result.error); setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      <div>
        <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Email</label>
        <input name="email" type="email" required autoComplete="email"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]" />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Password</label>
        <input name="password" type="password" required autoComplete="current-password"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]" />
      </div>
      <button type="submit" disabled={loading}
        className="w-full bg-[#1B4332] text-[#FAF7F2] rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#163829] disabled:opacity-50">
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Create the login page**

```typescript
// src/app/course/[slug]/login/page.tsx
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginForm from './LoginForm'

export default async function CourseLoginPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect(`/course/${slug}/reports`)

  const { data: course } = await supabase
    .from('courses').select('name').eq('slug', slug).single()
  if (!course) notFound()

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-2xl font-bold text-[#1B4332] mb-1">TeeAhead</div>
          <h1 className="text-lg font-semibold text-[#1A1A1A]">{course.name}</h1>
          <p className="text-[#6B7770] text-sm mt-1">Partner Portal</p>
        </div>
        <LoginForm slug={slug} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Manual smoke test**

```bash
npm run dev
```

Visit `http://localhost:3000/course/pilot-course/login`. Confirm: form renders with course name, wrong credentials show error message.

- [ ] **Step 5: Commit**

```bash
git add src/app/course/\[slug\]/login/
git commit -m "feat: course partner login page"
```

---

### Task 4: Course Partner Account Setup Page

**Files:**
- Create: `src/app/course/[slug]/setup/page.tsx`
- Create: `src/app/course/[slug]/setup/SetupForm.tsx`
- Create: `src/app/course/[slug]/setup/actions.ts`
- Create: `src/app/course/[slug]/setup/__tests__/token.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/app/course/[slug]/setup/__tests__/token.test.ts
import { describe, it, expect } from 'vitest'

function isTokenExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date()
}

describe('setup token expiry', () => {
  it('rejects tokens older than 72 hours', () => {
    const pastDate = new Date(Date.now() - 73 * 60 * 60 * 1000).toISOString()
    expect(isTokenExpired(pastDate)).toBe(true)
  })
  it('accepts tokens within 72 hours', () => {
    const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    expect(isTokenExpired(futureDate)).toBe(false)
  })
})
```

- [ ] **Step 2: Run test**

```bash
npx vitest run "src/app/course/\[slug\]/setup/__tests__/token.test.ts"
```

Expected: 2 passing

- [ ] **Step 3: Create the setup server action**

```typescript
// src/app/course/[slug]/setup/actions.ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function activateCoursePartner(
  formData: FormData,
  token: string,
  slug: string,
): Promise<{ error: string }> {
  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string

  if (password !== confirm) return { error: 'Passwords do not match' }
  if (password.length < 8) return { error: 'Password must be at least 8 characters' }

  const admin = createAdminClient()
  const { data: invite } = await admin
    .from('crm_course_users')
    .select('id, email, setup_token_expires_at')
    .eq('setup_token', token)
    .is('user_id', null)
    .single()

  if (!invite) return { error: 'Invalid setup link' }
  if (new Date(invite.setup_token_expires_at) < new Date()) {
    return { error: 'This setup link has expired — contact your TeeAhead account manager to resend' }
  }

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: invite.email,
    password,
    email_confirm: true,
  })

  if (authError?.message?.includes('already registered')) {
    return { error: 'An account with this email already exists. Try logging in instead.' }
  }
  if (authError || !authData.user) {
    return { error: authError?.message ?? 'Failed to create account. Please try again.' }
  }

  await admin
    .from('crm_course_users')
    .update({
      user_id: authData.user.id,
      setup_token: null,
      setup_token_expires_at: null,
      last_login_at: new Date().toISOString(),
    })
    .eq('id', invite.id)

  const supabase = await createClient()
  await supabase.auth.signInWithPassword({ email: invite.email, password })

  redirect(`/course/${slug}/reports`)
}
```

- [ ] **Step 4: Create SetupForm.tsx**

```typescript
// src/app/course/[slug]/setup/SetupForm.tsx
'use client'

import { useState } from 'react'
import { activateCoursePartner } from './actions'

export default function SetupForm({ token, slug, email }: { token: string; slug: string; email: string }) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await activateCoursePartner(new FormData(e.currentTarget), token, slug)
    if (result?.error) { setError(result.error); setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      <div>
        <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Email</label>
        <input value={email} disabled
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-[#6B7770]" />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Password</label>
        <input name="password" type="password" required minLength={8} autoComplete="new-password"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]" />
        <p className="text-xs text-[#6B7770] mt-1">Minimum 8 characters</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Confirm Password</label>
        <input name="confirm" type="password" required autoComplete="new-password"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]" />
      </div>
      <button type="submit" disabled={loading}
        className="w-full bg-[#1B4332] text-[#FAF7F2] rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#163829] disabled:opacity-50">
        {loading ? 'Activating…' : 'Activate Account'}
      </button>
    </form>
  )
}
```

- [ ] **Step 5: Create setup page**

```typescript
// src/app/course/[slug]/setup/page.tsx
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import SetupForm from './SetupForm'

export default async function CourseSetupPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { slug } = await params
  const { token } = await searchParams
  if (!token) notFound()

  const admin = createAdminClient()
  const { data: invite } = await admin
    .from('crm_course_users')
    .select('id, name, email, setup_token_expires_at, courses(name)')
    .eq('setup_token', token)
    .is('user_id', null)
    .single()

  const courseName = invite
    ? (Array.isArray(invite.courses) ? invite.courses[0]?.name : (invite.courses as { name: string } | null)?.name)
    : null

  if (!invite) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-bold text-[#1A1A1A]">Invalid setup link</h1>
          <p className="text-[#6B7770] mt-2 text-sm">This link is invalid or already used. Contact your TeeAhead account manager.</p>
        </div>
      </div>
    )
  }

  if (new Date(invite.setup_token_expires_at) < new Date()) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-bold text-[#1A1A1A]">Link expired</h1>
          <p className="text-[#6B7770] mt-2 text-sm">Setup links expire after 72 hours. Contact your TeeAhead account manager to resend.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-2xl font-bold text-[#1B4332] mb-1">TeeAhead</div>
          <h1 className="text-lg font-semibold text-[#1A1A1A]">Welcome, {invite.name}</h1>
          {courseName && <p className="text-[#6B7770] text-sm mt-1">{courseName} Partner Portal</p>}
        </div>
        <p className="text-sm text-[#6B7770] mb-6 text-center">Set a password to activate your account.</p>
        <SetupForm token={token} slug={slug} email={invite.email} />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/course/\[slug\]/setup/
git commit -m "feat: course partner account setup page with token validation"
```

---

### Task 5: Admin Invite Action + Email + UI

**Files:**
- Create: `src/lib/email/coursePartnerInvite.ts`
- Create: `src/app/admin/courses/inviteActions.ts`
- Create: `src/components/admin/InviteCoursePartner.tsx`
- Modify: `src/app/admin/courses/page.tsx`

- [ ] **Step 1: Write the email template**

```typescript
// src/lib/email/coursePartnerInvite.ts
export function buildCoursePartnerInviteEmail(params: {
  recipientName: string
  courseName: string
  setupUrl: string
  adminName: string
}) {
  const { recipientName, courseName, setupUrl, adminName } = params
  return {
    subject: `Your TeeAhead partner portal is ready — ${courseName}`,
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:32px 16px;color:#1A1A1A">
  <div style="margin-bottom:24px"><span style="font-size:24px;font-weight:700;color:#1B4332">TeeAhead</span></div>
  <h1 style="font-size:20px;font-weight:700;margin-bottom:8px">Hi ${recipientName},</h1>
  <p style="color:#6B7770;margin-bottom:24px">${adminName} has invited you to access the <strong>${courseName}</strong> partner portal on TeeAhead. Your portal includes booking analytics, member activity, revenue reports, and your monthly performance summary.</p>
  <a href="${setupUrl}" style="display:inline-block;background:#1B4332;color:#FAF7F2;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">Set up your account</a>
  <p style="color:#6B7770;font-size:13px;margin-top:24px">This link expires in 72 hours.</p>
</body></html>`,
    text: `Hi ${recipientName},\n\n${adminName} invited you to the ${courseName} partner portal.\n\nSet up your account: ${setupUrl}\n\nExpires in 72 hours.`,
  }
}
```

- [ ] **Step 2: Write the server action**

```typescript
// src/app/admin/courses/inviteActions.ts
'use server'

import { randomBytes } from 'crypto'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { buildCoursePartnerInviteEmail } from '@/lib/email/coursePartnerInvite'
import { revalidatePath } from 'next/cache'

const resend = new Resend(process.env.RESEND_API_KEY)

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin, full_name').eq('id', user.id).single()
  if (!profile?.is_admin) throw new Error('Forbidden')
  return profile.full_name ?? 'TeeAhead Admin'
}

export async function inviteCoursePartner(
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  let adminName: string
  try { adminName = await assertAdmin() } catch { return { error: 'Unauthorized' } }

  const courseId = formData.get('course_id') as string
  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const role = (formData.get('role') as string) || 'owner'

  if (!courseId || !name || !email) return { error: 'Name, email, and course are required' }

  const admin = createAdminClient()
  const { data: course } = await admin.from('courses').select('id, name, slug').eq('id', courseId).single()
  if (!course) return { error: 'Course not found' }

  const setupToken = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()

  const { error: upsertError } = await admin
    .from('crm_course_users')
    .upsert(
      { course_id: courseId, name, email, role, setup_token: setupToken, setup_token_expires_at: expiresAt, user_id: null },
      { onConflict: 'email' },
    )

  if (upsertError) return { error: upsertError.message }

  const setupUrl = `${process.env.NEXT_PUBLIC_APP_URL}/course/${course.slug}/setup?token=${setupToken}`
  const { subject, html, text } = buildCoursePartnerInviteEmail({ recipientName: name, courseName: course.name, setupUrl, adminName })

  const { error: emailError } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: email,
    subject,
    html,
    text,
  })

  if (emailError) return { error: `Invite saved but email failed: ${emailError.message}` }

  revalidatePath('/admin/courses')
  return { success: true }
}
```

- [ ] **Step 3: Create InviteCoursePartner component**

```typescript
// src/components/admin/InviteCoursePartner.tsx
'use client'

import { useState } from 'react'
import { inviteCoursePartner } from '@/app/admin/courses/inviteActions'

interface Course { id: string; name: string }

export default function InviteCoursePartner({ courses }: { courses: Course[] }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<{ error?: string; success?: boolean } | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    const result = await inviteCoursePartner(new FormData(e.currentTarget))
    setStatus(result)
    setLoading(false)
    if (result.success) setTimeout(() => { setOpen(false); setStatus(null) }, 2000)
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="bg-[#1B4332] text-[#FAF7F2] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#163829]">
        Invite Course Partner
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#1A1A1A]">Invite Course Partner</h2>
              <button onClick={() => setOpen(false)} className="text-[#6B7770] hover:text-[#1A1A1A] text-xl leading-none">×</button>
            </div>

            {status?.success && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm text-emerald-800 mb-4">
                Invite sent successfully.
              </div>
            )}
            {status?.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 mb-4">{status.error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Course</label>
                <select name="course_id" required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]">
                  <option value="">Select course…</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Contact Name</label>
                <input name="name" type="text" required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Email</label>
                <input name="email" type="email" required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Role</label>
                <select name="role" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]">
                  <option value="owner">Owner</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 border border-gray-200 text-[#6B7770] rounded-lg px-4 py-2 text-sm hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-[#1B4332] text-[#FAF7F2] rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#163829] disabled:opacity-50">
                  {loading ? 'Sending…' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 4: Add InviteCoursePartner to the admin courses page**

Open `src/app/admin/courses/page.tsx`. Add the following import and fetch, then place the component in the page header:

```typescript
// Add import:
import InviteCoursePartner from '@/components/admin/InviteCoursePartner'

// Add to data fetching (alongside existing admin client queries):
const { data: coursesForInvite } = await admin.from('courses').select('id, name').order('name')

// Add to JSX header (wrap existing header content in a flex row if needed):
<div className="flex items-center justify-between mb-6">
  <h1 className="text-2xl font-bold text-[#1A1A1A]">Courses</h1>
  <InviteCoursePartner courses={coursesForInvite ?? []} />
</div>
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/lib/email/coursePartnerInvite.ts src/app/admin/courses/inviteActions.ts src/components/admin/InviteCoursePartner.tsx src/app/admin/courses/page.tsx
git commit -m "feat: admin invite course partner — Resend email with 72-hour setup token"
```

---

### Task 6: Seed Pilot-Course Partner Test Account

**Files:**
- Create: `scripts/seed-pilot-partner.ts`

- [ ] **Step 1: Create the seed script**

```typescript
// scripts/seed-pilot-partner.ts
// Usage: PILOT_COURSE_PASSWORD=yourpw npx tsx scripts/seed-pilot-partner.ts
import { createAdminClient } from '../src/lib/supabase/admin'

async function main() {
  const password = process.env.PILOT_COURSE_PASSWORD
  if (!password) throw new Error('PILOT_COURSE_PASSWORD env var required')

  const admin = createAdminClient()

  const { data: course } = await admin
    .from('courses').select('id').eq('slug', 'pilot-course').single()
  if (!course) throw new Error('pilot-course not found — run course seed first')

  const email = 'pilot@teeahead.com'

  // Try to find existing auth user
  const { data: { users } } = await admin.auth.admin.listUsers()
  const existing = users.find(u => u.email === email)

  let userId: string
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, { password })
    userId = existing.id
    console.log('Updated existing user password')
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
    })
    if (error || !data.user) throw new Error(error?.message ?? 'Failed to create user')
    userId = data.user.id
    console.log('Created auth user:', userId)
  }

  const { error } = await admin.from('crm_course_users').upsert(
    { user_id: userId, course_id: course.id, name: 'Pilot GM', email, role: 'owner', setup_token: null, setup_token_expires_at: null },
    { onConflict: 'email' },
  )
  if (error) throw new Error(error.message)

  console.log('Done. Login at /course/pilot-course/login with', email)
}

main().catch(e => { console.error(e); process.exit(1) })
```

- [ ] **Step 2: Run the script**

```bash
PILOT_COURSE_PASSWORD=testpass123 npx tsx scripts/seed-pilot-partner.ts
```

Expected: "Done. Login at /course/pilot-course/login with pilot@teeahead.com"

- [ ] **Step 3: Smoke test the full auth flow**

1. Visit `http://localhost:3000/course/pilot-course/login`
2. Log in with `pilot@teeahead.com` / `testpass123`
3. Confirm redirect to `/course/pilot-course/reports` (404 is expected — reports pages come in Plan 3)
4. Visit `http://localhost:3000/course/pilot-course/bookings` — confirm it still loads for this user

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-pilot-partner.ts
git commit -m "chore: seed script for pilot-course partner test account"
```

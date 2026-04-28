# Admin Portal — Plan 1: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run all DB migrations required by the admin redesign, add the site-config and audit-log helpers, replace the admin top navbar with a sidebar layout, and wire the launch mode banner to live config.

**Architecture:** Four new Supabase migrations add `site_config`, `admin_audit_log`, `member_admin_notes`, and `memberships.cancel_at_period_end`. Two new lib modules (`site-config.ts`, `audit.ts`) provide helpers used by every subsequent admin feature. The admin layout is refactored from a top navbar to a two-column sidebar layout; the sidebar is a Server Component that reads open dispute count. The dashboard page adds a launch mode banner driven by `site_config`.

**Tech Stack:** Next.js 16.2.4 App Router, Supabase (PostgreSQL + RLS), Vitest + @testing-library/react, Tailwind CSS v4

> **Before writing any Next.js code:** Read `node_modules/next/dist/docs/` for any API you're unsure about — this version has breaking changes from prior Next.js versions.

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `supabase/migrations/027_site_config.sql` | site_config table + seed |
| Create | `supabase/migrations/028_admin_audit_log.sql` | admin_audit_log table |
| Create | `supabase/migrations/029_member_admin_notes.sql` | member_admin_notes table |
| Create | `supabase/migrations/030_memberships_cancel_col.sql` | cancel_at_period_end column |
| Create | `src/lib/site-config.ts` | Read site_config from DB, feature flag helpers |
| Create | `src/lib/audit.ts` | Non-blocking audit log writer |
| Create | `src/components/admin/AdminSidebar.tsx` | Client sidebar component |
| Modify | `src/app/admin/layout.tsx` | Replace top nav with sidebar layout |
| Modify | `src/app/admin/page.tsx` | Add launch mode banner, read from site_config |
| Create | `src/test/site-config.test.ts` | Unit tests for site-config helpers |
| Create | `src/test/audit-log.test.ts` | Unit tests for audit log writer |
| Create | `src/test/admin-sidebar.test.tsx` | Component tests for AdminSidebar |
| Create | `src/test/admin-dashboard-banner.test.tsx` | Tests for launch mode banner |

---

## Task 1: site_config Migration

**Files:**
- Create: `supabase/migrations/027_site_config.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/027_site_config.sql

CREATE TABLE site_config (
  key         text PRIMARY KEY,
  value       text NOT NULL,
  type        text NOT NULL CHECK (type IN ('text', 'boolean', 'number')),
  description text,
  updated_at  timestamptz DEFAULT now()
);

-- Seed initial values
INSERT INTO site_config (key, value, type, description) VALUES
  ('launch_mode',                'waitlist', 'text',    'Site mode: waitlist or live'),
  ('metro_area_name',            'Metro Detroit', 'text', 'Metro area shown throughout the site'),
  ('founding_golfer_cap',        '500',  'number',  'Max founding member spots'),
  ('price_eagle_annual',         '89',   'number',  'Eagle tier annual price (display only)'),
  ('price_ace_annual',           '159',  'number',  'Ace tier annual price (display only)'),
  ('price_eagle_monthly_credit', '10',   'number',  'Eagle monthly credit in dollars'),
  ('price_ace_monthly_credit',   '20',   'number',  'Ace monthly credit in dollars'),
  ('fee_fairway_booking',        '1.49', 'number',  'Platform fee per booking for fairway tier'),
  ('fee_paid_booking',           '0',    'number',  'Platform fee per booking for eagle/ace tier'),
  ('flag_golfer_waitlist',       'true', 'boolean', 'Show golfer waitlist signup form'),
  ('flag_course_waitlist',       'true', 'boolean', 'Show course partner application form'),
  ('flag_membership_signups',    'false','boolean', 'Allow new membership signups'),
  ('flag_tee_time_bookings',     'false','boolean', 'Allow tee time bookings');

-- RLS: anyone can read (needed for public feature flag checks), only service_role writes
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read site_config"
  ON site_config FOR SELECT USING (true);

CREATE POLICY "Service role write site_config"
  ON site_config FOR ALL USING (auth.role() = 'service_role');
```

- [ ] **Step 2: Run the migration**

```bash
supabase db push
```

Expected: migration applies cleanly with no errors.

- [ ] **Step 3: Verify the table and seed data**

```bash
supabase db execute --sql "SELECT key, value FROM site_config ORDER BY key;"
```

Expected: 13 rows, all keys present.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/027_site_config.sql
git commit -m "feat: add site_config table with initial seed"
```

---

## Task 2: admin_audit_log Migration

**Files:**
- Create: `supabase/migrations/028_admin_audit_log.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/028_admin_audit_log.sql

CREATE TABLE admin_audit_log (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz DEFAULT now(),
  admin_id     uuid        REFERENCES auth.users(id),
  admin_email  text        NOT NULL,
  event_type   text        NOT NULL,
  target_type  text        NOT NULL,
  target_id    text,
  target_label text,
  details      jsonb       DEFAULT '{}'
);

CREATE INDEX admin_audit_log_created_at_idx ON admin_audit_log (created_at DESC);
CREATE INDEX admin_audit_log_event_type_idx ON admin_audit_log (event_type);
CREATE INDEX admin_audit_log_admin_id_idx   ON admin_audit_log (admin_id);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can read all audit log entries
CREATE POLICY "Admin read audit_log"
  ON admin_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Only service_role can insert (all writes go through the server)
CREATE POLICY "Service role insert audit_log"
  ON admin_audit_log FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
```

- [ ] **Step 2: Run and verify**

```bash
supabase db push
supabase db execute --sql "SELECT column_name FROM information_schema.columns WHERE table_name = 'admin_audit_log' ORDER BY ordinal_position;"
```

Expected: id, created_at, admin_id, admin_email, event_type, target_type, target_id, target_label, details.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/028_admin_audit_log.sql
git commit -m "feat: add admin_audit_log table"
```

---

## Task 3: member_admin_notes Migration

**Files:**
- Create: `supabase/migrations/029_member_admin_notes.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/029_member_admin_notes.sql

CREATE TABLE member_admin_notes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz DEFAULT now(),
  member_id   uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  admin_id    uuid        NOT NULL REFERENCES auth.users(id),
  admin_email text        NOT NULL,
  body        text        NOT NULL
);

CREATE INDEX member_admin_notes_member_id_idx ON member_admin_notes (member_id);

ALTER TABLE member_admin_notes ENABLE ROW LEVEL SECURITY;

-- Only admins can read and write notes
CREATE POLICY "Admin all member_admin_notes"
  ON member_admin_notes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Service role all member_admin_notes"
  ON member_admin_notes FOR ALL
  USING (auth.role() = 'service_role');
```

- [ ] **Step 2: Run and verify**

```bash
supabase db push
supabase db execute --sql "SELECT COUNT(*) FROM member_admin_notes;"
```

Expected: 0 rows, no error.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/029_member_admin_notes.sql
git commit -m "feat: add member_admin_notes table"
```

---

## Task 4: memberships.cancel_at_period_end Migration

**Files:**
- Create: `supabase/migrations/030_memberships_cancel_col.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/030_memberships_cancel_col.sql

ALTER TABLE memberships
  ADD COLUMN cancel_at_period_end boolean NOT NULL DEFAULT false;
```

- [ ] **Step 2: Run and verify**

```bash
supabase db push
supabase db execute --sql "SELECT column_name FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'cancel_at_period_end';"
```

Expected: one row returned.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/030_memberships_cancel_col.sql
git commit -m "feat: add cancel_at_period_end to memberships"
```

---

## Task 5: site-config.ts Helper + Tests

**Files:**
- Create: `src/lib/site-config.ts`
- Create: `src/test/site-config.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/test/site-config.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSelect = vi.fn()
const mockFrom = vi.fn(() => ({ select: mockSelect }))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: mockFrom }),
}))

import { getSiteConfig, getConfigValue, isFeatureEnabled, isLiveMode } from '@/lib/site-config'

const seedRows = [
  { key: 'launch_mode',             value: 'waitlist' },
  { key: 'metro_area_name',         value: 'Metro Detroit' },
  { key: 'flag_golfer_waitlist',    value: 'true' },
  { key: 'flag_membership_signups', value: 'false' },
  { key: 'fee_fairway_booking',     value: '1.49' },
]

beforeEach(() => {
  vi.clearAllMocks()
  mockSelect.mockResolvedValue({ data: seedRows, error: null })
})

describe('getSiteConfig', () => {
  it('returns a key→value map of all config rows', async () => {
    const config = await getSiteConfig()
    expect(config['launch_mode']).toBe('waitlist')
    expect(config['metro_area_name']).toBe('Metro Detroit')
  })

  it('throws when supabase returns an error', async () => {
    mockSelect.mockResolvedValue({ data: null, error: { message: 'db error' } })
    await expect(getSiteConfig()).rejects.toThrow('Failed to load site config: db error')
  })
})

describe('getConfigValue', () => {
  it('returns the value for a known key', async () => {
    expect(await getConfigValue('metro_area_name')).toBe('Metro Detroit')
  })

  it('returns null for an unknown key', async () => {
    expect(await getConfigValue('nonexistent_key')).toBeNull()
  })
})

describe('isFeatureEnabled', () => {
  it('returns true when flag value is "true"', async () => {
    expect(await isFeatureEnabled('golfer_waitlist')).toBe(true)
  })

  it('returns false when flag value is "false"', async () => {
    expect(await isFeatureEnabled('membership_signups')).toBe(false)
  })

  it('returns false for unknown flags', async () => {
    expect(await isFeatureEnabled('unknown_flag')).toBe(false)
  })
})

describe('isLiveMode', () => {
  it('returns false when launch_mode is "waitlist"', async () => {
    expect(await isLiveMode()).toBe(false)
  })

  it('returns true when launch_mode is "live"', async () => {
    mockSelect.mockResolvedValue({
      data: [{ key: 'launch_mode', value: 'live' }],
      error: null,
    })
    expect(await isLiveMode()).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test -- site-config
```

Expected: FAIL — module `@/lib/site-config` not found.

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/site-config.ts
import { createAdminClient } from '@/lib/supabase/admin'

export type SiteConfig = Record<string, string>

export async function getSiteConfig(): Promise<SiteConfig> {
  const admin = createAdminClient()
  const { data, error } = await admin.from('site_config').select('key, value')
  if (error) throw new Error(`Failed to load site config: ${error.message}`)
  return Object.fromEntries((data ?? []).map(row => [row.key, row.value]))
}

export async function getConfigValue(key: string): Promise<string | null> {
  const config = await getSiteConfig()
  return config[key] ?? null
}

export async function isFeatureEnabled(flag: string): Promise<boolean> {
  const value = await getConfigValue(`flag_${flag}`)
  return value === 'true'
}

export async function isLiveMode(): Promise<boolean> {
  const value = await getConfigValue('launch_mode')
  return value === 'live'
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- site-config
```

Expected: PASS — 8 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/site-config.ts src/test/site-config.test.ts
git commit -m "feat: add site-config helper with feature flag and launch mode support"
```

---

## Task 6: audit.ts Helper + Tests

**Files:**
- Create: `src/lib/audit.ts`
- Create: `src/test/audit-log.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/test/audit-log.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockInsert = vi.fn()
const mockFrom = vi.fn(() => ({ insert: mockInsert }))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: mockGetUser },
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: mockFrom }),
}))

import { writeAuditLog } from '@/lib/audit'

const fakeUser = { id: 'admin-uuid', email: 'neil@example.com' }

beforeEach(() => {
  vi.clearAllMocks()
  mockGetUser.mockResolvedValue({ data: { user: fakeUser } })
  mockInsert.mockResolvedValue({ error: null })
})

describe('writeAuditLog', () => {
  it('inserts a row with correct fields', async () => {
    await writeAuditLog({
      eventType: 'tier_changed',
      targetType: 'member',
      targetId: 'member-uuid',
      targetLabel: 'John Doe',
      details: { from: 'eagle', to: 'ace' },
    })

    expect(mockFrom).toHaveBeenCalledWith('admin_audit_log')
    expect(mockInsert).toHaveBeenCalledWith({
      admin_id: 'admin-uuid',
      admin_email: 'neil@example.com',
      event_type: 'tier_changed',
      target_type: 'member',
      target_id: 'member-uuid',
      target_label: 'John Doe',
      details: { from: 'eagle', to: 'ace' },
    })
  })

  it('does not throw when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    await expect(writeAuditLog({ eventType: 'config_changed', targetType: 'config' })).resolves.toBeUndefined()
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('does not throw when the DB insert fails', async () => {
    mockInsert.mockRejectedValue(new Error('DB down'))
    await expect(
      writeAuditLog({ eventType: 'content_edited', targetType: 'content' })
    ).resolves.toBeUndefined()
  })

  it('uses empty object for details when not provided', async () => {
    await writeAuditLog({ eventType: 'member_deleted', targetType: 'member', targetId: 'u-1', targetLabel: 'Jane' })
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ details: {} }))
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test -- audit-log
```

Expected: FAIL — module `@/lib/audit` not found.

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/audit.ts
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type AuditEventType =
  | 'membership_cancelled'
  | 'refund_issued'
  | 'tier_changed'
  | 'member_created'
  | 'member_deleted'
  | 'credit_added'
  | 'points_adjusted'
  | 'config_changed'
  | 'content_edited'
  | 'dispute_updated'
  | 'email_sent'
  | 'admin_note_added'
  | 'profile_updated'

export type AuditTargetType = 'member' | 'config' | 'content' | 'dispute' | 'communication'

interface WriteAuditLogParams {
  eventType: AuditEventType
  targetType: AuditTargetType
  targetId?: string
  targetLabel?: string
  details?: Record<string, unknown>
}

export async function writeAuditLog(params: WriteAuditLogParams): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const admin = createAdminClient()
    await admin.from('admin_audit_log').insert({
      admin_id: user.id,
      admin_email: user.email ?? '',
      event_type: params.eventType,
      target_type: params.targetType,
      target_id: params.targetId,
      target_label: params.targetLabel,
      details: params.details ?? {},
    })
  } catch {
    // Non-blocking: audit log failure never surfaces to the caller
  }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- audit-log
```

Expected: PASS — 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/audit.ts src/test/audit-log.test.ts
git commit -m "feat: add non-blocking audit log writer"
```

---

## Task 7: AdminSidebar Component + Tests

**Files:**
- Create: `src/components/admin/AdminSidebar.tsx`
- Create: `src/test/admin-sidebar.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// src/test/admin-sidebar.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AdminSidebar from '@/components/admin/AdminSidebar'

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin',
}))

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

describe('AdminSidebar', () => {
  it('renders the brand name', () => {
    render(<AdminSidebar userEmail="neil@example.com" openDisputeCount={0} />)
    expect(screen.getByText(/TeeAhead/i)).toBeInTheDocument()
  })

  it('renders all nav sections', () => {
    render(<AdminSidebar userEmail="neil@example.com" openDisputeCount={0} />)
    expect(screen.getByText('Members')).toBeInTheDocument()
    expect(screen.getByText('Finance')).toBeInTheDocument()
    expect(screen.getByText('Platform')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders all nav items with correct hrefs', () => {
    render(<AdminSidebar userEmail="neil@example.com" openDisputeCount={0} />)
    expect(screen.getByRole('link', { name: /Dashboard/i })).toHaveAttribute('href', '/admin')
    expect(screen.getByRole('link', { name: /All Members/i })).toHaveAttribute('href', '/admin/users')
    expect(screen.getByRole('link', { name: /Communications/i })).toHaveAttribute('href', '/admin/communications')
    expect(screen.getByRole('link', { name: /Configuration/i })).toHaveAttribute('href', '/admin/config')
    expect(screen.getByRole('link', { name: /Audit Log/i })).toHaveAttribute('href', '/admin/audit')
  })

  it('shows dispute badge when openDisputeCount > 0', () => {
    render(<AdminSidebar userEmail="neil@example.com" openDisputeCount={3} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('does not show dispute badge when openDisputeCount is 0', () => {
    render(<AdminSidebar userEmail="neil@example.com" openDisputeCount={0} />)
    expect(screen.queryByTestId('dispute-badge')).not.toBeInTheDocument()
  })

  it('shows the signed-in user email', () => {
    render(<AdminSidebar userEmail="neil@example.com" openDisputeCount={0} />)
    expect(screen.getByText('neil@example.com')).toBeInTheDocument()
  })

  it('renders member view link pointing to /app', () => {
    render(<AdminSidebar userEmail="neil@example.com" openDisputeCount={0} />)
    expect(screen.getByRole('link', { name: /member view/i })).toHaveAttribute('href', '/app')
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test -- admin-sidebar
```

Expected: FAIL — module `@/components/admin/AdminSidebar` not found.

- [ ] **Step 3: Write the implementation**

```tsx
// src/components/admin/AdminSidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface AdminSidebarProps {
  userEmail: string
  openDisputeCount: number
}

export default function AdminSidebar({ userEmail, openDisputeCount }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-52 flex-shrink-0 bg-slate-900 text-slate-200 flex flex-col min-h-screen">
      <div className="px-4 py-4 font-bold text-white border-b border-slate-800">
        Tee<span className="text-emerald-400">Ahead</span> Admin
      </div>

      <nav className="flex-1 py-2">
        <SidebarItem href="/admin" icon="📊" label="Dashboard" active={pathname === '/admin'} />

        <SidebarSection label="Members" />
        <SidebarItem href="/admin/users" icon="👥" label="All Members" active={pathname.startsWith('/admin/users')} />
        <SidebarItem href="/admin/communications" icon="✉️" label="Communications" active={pathname === '/admin/communications'} />

        <SidebarSection label="Finance" />
        <SidebarItem
          href="/admin/disputes"
          icon="⚠️"
          label="Disputes"
          active={pathname === '/admin/disputes'}
          badge={openDisputeCount > 0 ? openDisputeCount : undefined}
        />

        <SidebarSection label="Platform" />
        <SidebarItem href="/admin/content" icon="📝" label="Content" active={pathname === '/admin/content'} />
        <SidebarItem href="/admin/courses" icon="🏌️" label="Courses" active={pathname.startsWith('/admin/courses')} />
        <SidebarItem href="/admin/waitlist" icon="📋" label="Waitlist" active={pathname === '/admin/waitlist'} />

        <SidebarSection label="Settings" />
        <SidebarItem href="/admin/config" icon="⚙️" label="Configuration" active={pathname === '/admin/config'} />
        <SidebarItem href="/admin/audit" icon="🔍" label="Audit Log" active={pathname === '/admin/audit'} />
      </nav>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-400">
        <div>Signed in as</div>
        <div className="text-slate-300 truncate">{userEmail}</div>
        <Link href="/app" className="text-emerald-400 hover:text-emerald-300 mt-1 block">
          ← Member view
        </Link>
      </div>
    </aside>
  )
}

function SidebarSection({ label }: { label: string }) {
  return (
    <div className="px-4 pt-3 pb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
      {label}
    </div>
  )
}

function SidebarItem({
  href,
  icon,
  label,
  active,
  badge,
}: {
  href: string
  icon: string
  label: string
  active: boolean
  badge?: number
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-4 py-1.5 text-sm border-l-[3px] transition-colors ${
        active
          ? 'bg-slate-800 text-white border-emerald-400'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white border-transparent hover:border-emerald-400'
      }`}
    >
      <span className="w-4 text-center">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <span data-testid="dispute-badge" className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </Link>
  )
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- admin-sidebar
```

Expected: PASS — 7 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/AdminSidebar.tsx src/test/admin-sidebar.test.tsx
git commit -m "feat: add AdminSidebar client component with active state and dispute badge"
```

---

## Task 8: Refactor Admin Layout to Use Sidebar

**Files:**
- Modify: `src/app/admin/layout.tsx`

- [ ] **Step 1: Replace the layout**

Replace the entire contents of `src/app/admin/layout.tsx` with:

```tsx
// src/app/admin/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminSidebar from '@/components/admin/AdminSidebar'

const ADMIN_EMAILS = ['mulliganlinksgolf@gmail.com', 'nbarris11@gmail.com', 'beslock@yahoo.com']

async function getOpenDisputeCount(): Promise<number> {
  const admin = createAdminClient()
  const { count } = await admin
    .from('payment_disputes')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open')
  return count ?? 0
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const isHardcoded = ADMIN_EMAILS.includes(user.email ?? '')
  if (!isHardcoded) {
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    if (!profile?.is_admin) redirect('/app')
  }

  const openDisputeCount = await getOpenDisputeCount()

  return (
    <div className="flex min-h-screen bg-[#FAF7F2]">
      <AdminSidebar userEmail={user.email ?? ''} openDisputeCount={openDisputeCount} />
      <main className="flex-1 px-8 py-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Verify the build compiles**

```bash
npm run build 2>&1 | tail -20
```

Expected: no TypeScript errors. If there are import errors, check that `@/components/admin/AdminSidebar` path matches the file created in Task 7.

- [ ] **Step 3: Start the dev server and verify the layout**

```bash
npm run dev
```

Navigate to `http://localhost:3000/admin`. Expected: sidebar visible on the left, all nav items present, no top navbar, main content area on the right.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/layout.tsx
git commit -m "feat: replace admin top navbar with sidebar layout"
```

---

## Task 9: Launch Mode Banner on Dashboard

**Files:**
- Modify: `src/app/admin/page.tsx`
- Create: `src/test/admin-dashboard-banner.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// src/test/admin-dashboard-banner.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/site-config', () => ({
  isLiveMode: vi.fn(),
}))

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

import { isLiveMode } from '@/lib/site-config'
import LaunchModeBanner from '@/components/admin/LaunchModeBanner'

describe('LaunchModeBanner', () => {
  it('shows waitlist mode banner when not live', () => {
    render(<LaunchModeBanner isLive={false} />)
    expect(screen.getByText(/Waitlist Mode is ON/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Go Live/i })).toHaveAttribute('href', '/admin/config')
  })

  it('shows live mode banner when live', () => {
    render(<LaunchModeBanner isLive={true} />)
    expect(screen.getByText(/Live Mode is ON/i)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Go Live/i })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test -- admin-dashboard-banner
```

Expected: FAIL — module `@/components/admin/LaunchModeBanner` not found.

- [ ] **Step 3: Create the LaunchModeBanner component**

```tsx
// src/components/admin/LaunchModeBanner.tsx

interface LaunchModeBannerProps {
  isLive: boolean
}

export default function LaunchModeBanner({ isLive }: LaunchModeBannerProps) {
  if (isLive) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 mb-6">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
        <strong>Live Mode is ON</strong> — Members can book tee times and sign up for membership.
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 mb-6">
      <span className="h-2.5 w-2.5 rounded-full bg-amber-400 flex-shrink-0" />
      <div className="flex-1">
        <strong>Waitlist Mode is ON</strong> — The site is showing the coming-soon experience. Members cannot book tee times.
      </div>
      <a
        href="/admin/config"
        className="ml-auto flex-shrink-0 rounded bg-amber-500 px-3 py-1 text-xs font-bold text-white hover:bg-amber-600 transition-colors"
      >
        Go Live
      </a>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- admin-dashboard-banner
```

Expected: PASS — 2 tests passing.

- [ ] **Step 5: Add the banner to the dashboard page**

Open `src/app/admin/page.tsx`. At the top of the async component function, add the `isLiveMode()` call and render the banner as the first element in the return. The rest of the existing dashboard content (stat cards, recent tables) remains unchanged.

Add to imports at top of file:
```tsx
import { isLiveMode } from '@/lib/site-config'
import LaunchModeBanner from '@/components/admin/LaunchModeBanner'
```

Add inside the async server component, before the return:
```tsx
const liveMode = await isLiveMode()
```

Add as first element inside the returned JSX (before any existing stat cards):
```tsx
<LaunchModeBanner isLive={liveMode} />
```

- [ ] **Step 6: Verify in the browser**

```bash
npm run dev
```

Navigate to `http://localhost:3000/admin`. Expected: amber "Waitlist Mode is ON" banner at the top with a "Go Live" link to `/admin/config`.

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/LaunchModeBanner.tsx src/test/admin-dashboard-banner.test.tsx src/app/admin/page.tsx
git commit -m "feat: add launch mode banner to admin dashboard"
```

---

## Task 10: Full Test Run + Final Commit

- [ ] **Step 1: Run the full test suite**

```bash
npm test
```

Expected: all existing tests pass, plus the new tests from Tasks 5–9. Zero failures.

- [ ] **Step 2: Fix any failures before proceeding**

If any existing tests fail due to the layout change (e.g., tests that render the admin layout component), update those tests to match the new sidebar structure.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: admin portal foundation — migrations, site-config, audit lib, sidebar layout"
```

---

## What Comes Next

- **Plan 2 — Member Management**: Member list upgrade (search, filter, tier badges), full member detail page with all 7 tabs, cancel/refund modal wired to Stripe.
- **Plan 3 — Finance & Analytics**: Analytics dashboard with charts (MRR, tier breakdown, new members, bookings), dispute management UI with deadlines and detail panel.
- **Plan 4 — Operations**: Config UI, expanded content management editor, broadcast communications (admin + course admin), audit log UI.

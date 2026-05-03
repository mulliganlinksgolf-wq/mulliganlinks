# TeeAhead CRM — Plan 1: Foundation + Dashboard

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install dependencies, create the CRM database schema, TypeScript types, query utilities, and the `/admin/crm` dashboard with KPI tiles, activity feed, and stale lead alerts.

**Architecture:** All CRM tables live in Supabase (Postgres) alongside the existing schema. The `/admin/crm` route sits inside the existing admin layout, which already handles auth. Server actions use `createAdminClient()` (service role) to bypass RLS since all CRM operations are admin-only. Dashboard is a React Server Component that fetches in parallel.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4, Supabase (postgres + admin client), Vitest for unit tests

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `supabase/migrations/031_crm_schema.sql` | Create | 6 CRM tables + enums + indexes |
| `src/lib/crm/types.ts` | Create | TypeScript interfaces for all CRM entities |
| `src/lib/crm/queries.ts` | Create | Supabase query helpers for dashboard stats |
| `src/lib/crm/queries.test.ts` | Create | Unit tests for query utilities |
| `src/components/admin/AdminSidebar.tsx` | Modify | Add CRM section to sidebar nav |
| `src/components/crm/KPITiles.tsx` | Create | Dashboard KPI tiles component |
| `src/components/crm/ActivityFeed.tsx` | Create | Recent activity feed component |
| `src/components/crm/StaleLeadAlert.tsx` | Create | Stale lead warning banner |
| `src/app/admin/crm/page.tsx` | Create | CRM dashboard page (RSC) |

---

### Task 1: Read the Next.js version guide

**Files:** none

- [ ] **Step 1: Read the Next.js docs for this version**

```bash
ls /Users/barris/Desktop/MulliganLinks/node_modules/next/dist/docs/ 2>/dev/null | head -20
```

Read any files that cover App Router server actions, caching, or breaking changes from version 14. The project runs Next.js 16 — APIs may differ from your training data.

- [ ] **Step 2: Note the actual Next.js version**

```bash
cat /Users/barris/Desktop/MulliganLinks/node_modules/next/package.json | grep '"version"'
```

Confirm version before writing any Next.js-specific code.

---

### Task 2: Install new dependencies

**Files:** `package.json`

- [ ] **Step 1: Install drag-and-drop and PDF packages**

```bash
cd /Users/barris/Desktop/MulliganLinks && npm install @hello-pangea/dnd @react-pdf/renderer
```

- [ ] **Step 2: Install type declarations**

```bash
npm install -D @types/react-pdf 2>/dev/null || true
```

Note: `@react-pdf/renderer` ships its own types. Only install `@types/react-pdf` if TypeScript errors appear.

- [ ] **Step 3: Verify installation**

```bash
cat package.json | grep -E "@hello-pangea|@react-pdf"
```

Expected output: both packages listed in `dependencies`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @hello-pangea/dnd and @react-pdf/renderer"
```

---

### Task 3: Database migration — CRM schema

**Files:** `supabase/migrations/031_crm_schema.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- 031_crm_schema.sql
-- CRM tables for TeeAhead internal sales/operations tool

-- Enums
CREATE TYPE crm_course_stage AS ENUM (
  'lead', 'contacted', 'demo', 'negotiating', 'partner', 'churned'
);

CREATE TYPE crm_outing_status AS ENUM (
  'lead', 'quoted', 'confirmed', 'completed', 'cancelled'
);

CREATE TYPE crm_member_tier AS ENUM ('free', 'eagle', 'ace');

CREATE TYPE crm_member_status AS ENUM ('active', 'lapsed', 'churned');

CREATE TYPE crm_activity_type AS ENUM (
  'call', 'email', 'note', 'meeting', 'demo', 'contract_sent'
);

CREATE TYPE crm_record_type AS ENUM ('course', 'outing', 'member');

CREATE TYPE crm_doc_type AS ENUM ('contract', 'proposal', 'other');

-- crm_courses
CREATE TABLE crm_courses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  address         TEXT,
  city            TEXT,
  state           TEXT,
  zip             TEXT,
  contact_name    TEXT,
  contact_email   TEXT,
  contact_phone   TEXT,
  stage           crm_course_stage NOT NULL DEFAULT 'lead',
  assigned_to     TEXT CHECK (assigned_to IN ('neil', 'billy')),
  notes           TEXT,
  estimated_value NUMERIC(10,2),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- crm_outings
CREATE TABLE crm_outings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name     TEXT NOT NULL,
  contact_email    TEXT,
  contact_phone    TEXT,
  event_date       DATE,
  num_golfers      INTEGER,
  preferred_course TEXT,
  budget_estimate  NUMERIC(10,2),
  status           crm_outing_status NOT NULL DEFAULT 'lead',
  assigned_to      TEXT CHECK (assigned_to IN ('neil', 'billy')),
  notes            TEXT,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- crm_members (internal CRM view — separate from auth users)
CREATE TABLE crm_members (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  email            TEXT,
  phone            TEXT,
  membership_tier  crm_member_tier NOT NULL DEFAULT 'free',
  home_course      TEXT,
  join_date        DATE,
  lifetime_spend   NUMERIC(10,2) NOT NULL DEFAULT 0,
  status           crm_member_status NOT NULL DEFAULT 'active',
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- crm_activity_log
CREATE TABLE crm_activity_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type crm_record_type NOT NULL,
  record_id   UUID NOT NULL,
  type        crm_activity_type NOT NULL,
  body        TEXT,
  created_by  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- crm_email_templates
CREATE TABLE crm_email_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  subject     TEXT NOT NULL,
  body_html   TEXT NOT NULL,
  record_type crm_record_type NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- crm_documents
CREATE TABLE crm_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type crm_record_type NOT NULL,
  record_id   UUID NOT NULL,
  name        TEXT NOT NULL,
  type        crm_doc_type NOT NULL DEFAULT 'other',
  file_url    TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by  TEXT NOT NULL
);

-- Indexes
CREATE INDEX idx_crm_courses_stage        ON crm_courses(stage);
CREATE INDEX idx_crm_courses_last_activity ON crm_courses(last_activity_at);
CREATE INDEX idx_crm_courses_assigned     ON crm_courses(assigned_to);
CREATE INDEX idx_crm_outings_status       ON crm_outings(status);
CREATE INDEX idx_crm_outings_last_activity ON crm_outings(last_activity_at);
CREATE INDEX idx_crm_activity_record      ON crm_activity_log(record_type, record_id);
CREATE INDEX idx_crm_activity_created     ON crm_activity_log(created_at DESC);
CREATE INDEX idx_crm_documents_record     ON crm_documents(record_type, record_id);

-- updated_at auto-update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_crm_courses_updated_at
  BEFORE UPDATE ON crm_courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_crm_outings_updated_at
  BEFORE UPDATE ON crm_outings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_crm_members_updated_at
  BEFORE UPDATE ON crm_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_crm_email_templates_updated_at
  BEFORE UPDATE ON crm_email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS enabled; service role key bypasses it (admin-only feature)
ALTER TABLE crm_courses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_outings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_members         ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activity_log    ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_documents       ENABLE ROW LEVEL SECURITY;
```

- [ ] **Step 2: Run the migration**

```bash
cd /Users/barris/Desktop/MulliganLinks && npx supabase db push
```

Expected: `Applied 1 migration` (or similar success message).

- [ ] **Step 3: Verify tables exist**

```bash
npx supabase db diff --schema public 2>/dev/null | grep "crm_" | head -20
```

Expected: lines showing `crm_courses`, `crm_outings`, `crm_members`, `crm_activity_log`, `crm_email_templates`, `crm_documents`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/031_crm_schema.sql
git commit -m "feat: CRM database schema — 6 tables with indexes and RLS"
```

---

### Task 4: TypeScript types for CRM

**Files:**
- Create: `src/lib/crm/types.ts`

- [ ] **Step 1: Create the types file**

```typescript
// src/lib/crm/types.ts

export type CrmCourseStage =
  | 'lead' | 'contacted' | 'demo' | 'negotiating' | 'partner' | 'churned'

export type CrmOutingStatus =
  | 'lead' | 'quoted' | 'confirmed' | 'completed' | 'cancelled'

export type CrmMemberTier = 'free' | 'eagle' | 'ace'

export type CrmMemberStatus = 'active' | 'lapsed' | 'churned'

export type CrmActivityType =
  | 'call' | 'email' | 'note' | 'meeting' | 'demo' | 'contract_sent'

export type CrmRecordType = 'course' | 'outing' | 'member'

export type CrmDocType = 'contract' | 'proposal' | 'other'

export type CrmAssignee = 'neil' | 'billy'

export interface CrmCourse {
  id: string
  name: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  stage: CrmCourseStage
  assigned_to: CrmAssignee | null
  notes: string | null
  estimated_value: number | null
  last_activity_at: string
  created_at: string
  updated_at: string
}

export interface CrmOuting {
  id: string
  contact_name: string
  contact_email: string | null
  contact_phone: string | null
  event_date: string | null
  num_golfers: number | null
  preferred_course: string | null
  budget_estimate: number | null
  status: CrmOutingStatus
  assigned_to: CrmAssignee | null
  notes: string | null
  last_activity_at: string
  created_at: string
  updated_at: string
}

export interface CrmMember {
  id: string
  name: string
  email: string | null
  phone: string | null
  membership_tier: CrmMemberTier
  home_course: string | null
  join_date: string | null
  lifetime_spend: number
  status: CrmMemberStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CrmActivityLog {
  id: string
  record_type: CrmRecordType
  record_id: string
  type: CrmActivityType
  body: string | null
  created_by: string
  created_at: string
}

export interface CrmEmailTemplate {
  id: string
  name: string
  subject: string
  body_html: string
  record_type: CrmRecordType
  created_at: string
  updated_at: string
}

export interface CrmDocument {
  id: string
  record_type: CrmRecordType
  record_id: string
  name: string
  type: CrmDocType
  file_url: string | null
  generated_at: string
  created_by: string
}

export interface CrmDashboardStats {
  pipelineCourses: number
  activeOutings: number
  payingMembers: number
  pipelineValue: number
}

export interface StaleLeadSummary {
  staleCourses: Array<{
    id: string
    name: string
    stage: CrmCourseStage
    last_activity_at: string
    assigned_to: CrmAssignee | null
  }>
  staleOutings: Array<{
    id: string
    contact_name: string
    status: CrmOutingStatus
    last_activity_at: string
    assigned_to: CrmAssignee | null
  }>
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/barris/Desktop/MulliganLinks && npx tsc --noEmit 2>&1 | grep "crm/types"
```

Expected: no errors for this file.

- [ ] **Step 3: Commit**

```bash
git add src/lib/crm/types.ts
git commit -m "feat: CRM TypeScript types"
```

---

### Task 5: CRM query utilities + tests

**Files:**
- Create: `src/lib/crm/queries.ts`
- Create: `src/lib/crm/queries.test.ts`

- [ ] **Step 1: Write the failing tests first**

```typescript
// src/lib/crm/queries.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockLt = vi.fn()
const mockNot = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()

// Chain builder
function buildChain(data: unknown[], error: null = null) {
  const chain = {
    select: vi.fn().mockReturnValue(chain),
    lt: vi.fn().mockReturnValue(chain),
    not: vi.fn().mockReturnValue(chain),
    order: vi.fn().mockReturnValue(chain),
    limit: vi.fn().mockResolvedValue({ data, error }),
    filter: vi.fn().mockReturnValue(chain),
  }
  // Make final awaits work on the chain itself too
  chain.select.mockReturnValue({ ...chain, then: (resolve: (v: { data: unknown[]; error: null }) => void) => resolve({ data, error }) })
  return chain
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => buildChain([])),
  })),
}))

import { getCrmDashboardStats, getRecentActivity, getStaleLeads } from './queries'

describe('getCrmDashboardStats', () => {
  it('counts pipeline courses excluding partner and churned', async () => {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'crm_courses') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [
                { stage: 'lead', estimated_value: 500 },
                { stage: 'partner', estimated_value: 1000 },
                { stage: 'churned', estimated_value: null },
              ],
              error: null,
            }),
          }
        }
        if (table === 'crm_outings') {
          return { select: vi.fn().mockResolvedValue({ data: [{ status: 'lead' }, { status: 'completed' }], error: null }) }
        }
        if (table === 'crm_members') {
          return { select: vi.fn().mockResolvedValue({ data: [{ status: 'active', membership_tier: 'eagle' }], error: null }) }
        }
        return { select: vi.fn().mockResolvedValue({ data: [], error: null }) }
      }),
    } as ReturnType<typeof createAdminClient>)

    const stats = await getCrmDashboardStats()
    expect(stats.pipelineCourses).toBe(1)       // only 'lead'
    expect(stats.pipelineValue).toBe(500)        // sum of non-partner/churned
    expect(stats.activeOutings).toBe(1)          // only 'lead', not 'completed'
    expect(stats.payingMembers).toBe(1)          // active + not free
  })
})

describe('getStaleLeads', () => {
  it('returns courses and outings with activity older than threshold', async () => {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const staleDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        const chain: Record<string, unknown> = {}
        chain.select = vi.fn().mockReturnValue(chain)
        chain.lt = vi.fn().mockReturnValue(chain)
        chain.not = vi.fn().mockResolvedValue({
          data: table === 'crm_courses'
            ? [{ id: '1', name: 'Oak Hollow', stage: 'lead', last_activity_at: staleDate, assigned_to: 'neil' }]
            : [{ id: '2', contact_name: 'Bob Smith', status: 'lead', last_activity_at: staleDate, assigned_to: 'billy' }],
          error: null,
        })
        return chain
      }),
    } as ReturnType<typeof createAdminClient>)

    const result = await getStaleLeads(7)
    expect(result.staleCourses).toHaveLength(1)
    expect(result.staleCourses[0].name).toBe('Oak Hollow')
    expect(result.staleOutings).toHaveLength(1)
    expect(result.staleOutings[0].contact_name).toBe('Bob Smith')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd /Users/barris/Desktop/MulliganLinks && npx vitest run src/lib/crm/queries.test.ts 2>&1 | tail -10
```

Expected: FAIL — `Cannot find module './queries'`

- [ ] **Step 3: Create the queries utility**

```typescript
// src/lib/crm/queries.ts
import { createAdminClient } from '@/lib/supabase/admin'
import type { CrmDashboardStats, StaleLeadSummary } from './types'

export async function getCrmDashboardStats(): Promise<CrmDashboardStats> {
  const supabase = createAdminClient()
  const [courses, outings, members] = await Promise.all([
    supabase.from('crm_courses').select('stage, estimated_value'),
    supabase.from('crm_outings').select('status'),
    supabase.from('crm_members').select('status, membership_tier'),
  ])

  const nonTerminalCourses = (courses.data ?? []).filter(
    (c) => c.stage !== 'partner' && c.stage !== 'churned'
  )
  const activeOutings = (outings.data ?? []).filter(
    (o) => o.status !== 'completed' && o.status !== 'cancelled'
  )
  const payingMembers = (members.data ?? []).filter(
    (m) => m.status === 'active' && m.membership_tier !== 'free'
  )

  return {
    pipelineCourses: nonTerminalCourses.length,
    activeOutings: activeOutings.length,
    payingMembers: payingMembers.length,
    pipelineValue: nonTerminalCourses.reduce(
      (sum, c) => sum + (c.estimated_value ?? 0),
      0
    ),
  }
}

export async function getRecentActivity(limit = 20) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('crm_activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function getStaleLeads(days: number): Promise<StaleLeadSummary> {
  const supabase = createAdminClient()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffIso = cutoff.toISOString()

  const [courses, outings] = await Promise.all([
    supabase
      .from('crm_courses')
      .select('id, name, stage, last_activity_at, assigned_to')
      .lt('last_activity_at', cutoffIso)
      .not('stage', 'in', '("partner","churned")'),
    supabase
      .from('crm_outings')
      .select('id, contact_name, status, last_activity_at, assigned_to')
      .lt('last_activity_at', cutoffIso)
      .not('status', 'in', '("completed","cancelled")'),
  ])

  return {
    staleCourses: courses.data ?? [],
    staleOutings: outings.data ?? [],
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npx vitest run src/lib/crm/queries.test.ts 2>&1 | tail -10
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/crm/queries.ts src/lib/crm/queries.test.ts
git commit -m "feat: CRM query utilities with tests"
```

---

### Task 6: Update AdminSidebar with CRM navigation

**Files:**
- Modify: `src/components/admin/AdminSidebar.tsx`

- [ ] **Step 1: Add a CRM section to the sidebar**

In `src/components/admin/AdminSidebar.tsx`, add this block directly after the Members section (after the Communications item):

```typescript
        <SidebarSection label="CRM" />
        <SidebarItem href="/admin/crm" icon="🎯" label="CRM Dashboard" active={pathname === '/admin/crm'} />
        <SidebarItem href="/admin/crm/courses" icon="🏌️" label="Courses" active={pathname.startsWith('/admin/crm/courses')} />
        <SidebarItem href="/admin/crm/outings" icon="📅" label="Outings" active={pathname.startsWith('/admin/crm/outings')} />
        <SidebarItem href="/admin/crm/members" icon="👤" label="Members" active={pathname.startsWith('/admin/crm/members')} />
        <SidebarItem href="/admin/crm/templates" icon="📧" label="Email Templates" active={pathname.startsWith('/admin/crm/templates')} />
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "AdminSidebar"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/AdminSidebar.tsx
git commit -m "feat: add CRM nav section to admin sidebar"
```

---

### Task 7: KPITiles component

**Files:**
- Create: `src/components/crm/KPITiles.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/components/crm/KPITiles.tsx
import type { CrmDashboardStats } from '@/lib/crm/types'

interface Props {
  stats: CrmDashboardStats
}

function KPITile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{label}</div>
      <div className="text-3xl font-bold text-slate-900">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  )
}

export function KPITiles({ stats }: Props) {
  const { pipelineCourses, activeOutings, payingMembers, pipelineValue } = stats
  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(pipelineValue)

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPITile label="Courses in Pipeline" value={String(pipelineCourses)} sub="excl. partner & churned" />
      <KPITile label="Active Outing Leads" value={String(activeOutings)} />
      <KPITile label="Paying Members" value={String(payingMembers)} sub="eagle + ace" />
      <KPITile label="Pipeline Value" value={formattedValue} sub="estimated annual" />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/crm/KPITiles.tsx
git commit -m "feat: CRM KPI tiles component"
```

---

### Task 8: ActivityFeed component

**Files:**
- Create: `src/components/crm/ActivityFeed.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/components/crm/ActivityFeed.tsx
import type { CrmActivityLog, CrmActivityType, CrmRecordType } from '@/lib/crm/types'
import Link from 'next/link'

const activityIcons: Record<CrmActivityType, string> = {
  call: '📞',
  email: '✉️',
  note: '📝',
  meeting: '🤝',
  demo: '💻',
  contract_sent: '📄',
}

const recordLabels: Record<CrmRecordType, string> = {
  course: 'Course',
  outing: 'Outing',
  member: 'Member',
}

const recordPaths: Record<CrmRecordType, string> = {
  course: '/admin/crm/courses',
  outing: '/admin/crm/outings',
  member: '/admin/crm/members',
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

interface Props {
  activities: CrmActivityLog[]
}

export function ActivityFeed({ activities }: Props) {
  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-800 mb-3">Recent Activity</h2>
        <p className="text-sm text-slate-400">No activity logged yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="font-semibold text-slate-800 mb-4">Recent Activity</h2>
      <ul className="space-y-3">
        {activities.map((entry) => (
          <li key={entry.id} className="flex items-start gap-3 text-sm">
            <span className="mt-0.5 text-base">{activityIcons[entry.type]}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-700 capitalize">{entry.type.replace('_', ' ')}</span>
                <span className="text-slate-400">·</span>
                <Link
                  href={`${recordPaths[entry.record_type]}/${entry.record_id}`}
                  className="text-emerald-600 hover:underline"
                >
                  {recordLabels[entry.record_type]}
                </Link>
                <span className="text-slate-400">·</span>
                <span className="text-slate-400">{entry.created_by}</span>
              </div>
              {entry.body && (
                <p className="text-slate-500 truncate mt-0.5">{entry.body}</p>
              )}
            </div>
            <span className="text-slate-400 text-xs whitespace-nowrap">{timeAgo(entry.created_at)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/crm/ActivityFeed.tsx
git commit -m "feat: CRM activity feed component"
```

---

### Task 9: StaleLeadAlert component

**Files:**
- Create: `src/components/crm/StaleLeadAlert.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/components/crm/StaleLeadAlert.tsx
import Link from 'next/link'
import type { StaleLeadSummary } from '@/lib/crm/types'

interface Props extends StaleLeadSummary {
  staleDays: number
}

export function StaleLeadAlert({ staleCourses, staleOutings, staleDays }: Props) {
  const total = staleCourses.length + staleOutings.length
  if (total === 0) return null

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-amber-600 font-semibold text-sm">
          ⚠️ {total} stale lead{total !== 1 ? 's' : ''} — no activity in {staleDays}+ days
        </span>
      </div>
      <ul className="space-y-1">
        {staleCourses.map((course) => (
          <li key={course.id} className="text-sm flex items-center gap-2">
            <span className="text-amber-500">🏌️</span>
            <Link href={`/admin/crm/courses/${course.id}`} className="text-amber-800 hover:underline font-medium">
              {course.name}
            </Link>
            <span className="text-amber-600 capitalize">({course.stage})</span>
            {course.assigned_to && (
              <span className="text-amber-500 text-xs">→ {course.assigned_to}</span>
            )}
          </li>
        ))}
        {staleOutings.map((outing) => (
          <li key={outing.id} className="text-sm flex items-center gap-2">
            <span className="text-amber-500">📅</span>
            <Link href={`/admin/crm/outings/${outing.id}`} className="text-amber-800 hover:underline font-medium">
              {outing.contact_name}
            </Link>
            <span className="text-amber-600 capitalize">({outing.status})</span>
            {outing.assigned_to && (
              <span className="text-amber-500 text-xs">→ {outing.assigned_to}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/crm/StaleLeadAlert.tsx
git commit -m "feat: CRM stale lead alert component"
```

---

### Task 10: CRM Dashboard page

**Files:**
- Create: `src/app/admin/crm/page.tsx`

- [ ] **Step 1: Create the dashboard page**

```typescript
// src/app/admin/crm/page.tsx
import { getCrmDashboardStats, getRecentActivity, getStaleLeads } from '@/lib/crm/queries'
import { KPITiles } from '@/components/crm/KPITiles'
import { ActivityFeed } from '@/components/crm/ActivityFeed'
import { StaleLeadAlert } from '@/components/crm/StaleLeadAlert'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CrmDashboardPage() {
  const staleDays = parseInt(process.env.STALE_LEAD_DAYS ?? '7', 10)

  const [stats, recentActivity, staleLeads] = await Promise.all([
    getCrmDashboardStats(),
    getRecentActivity(20),
    getStaleLeads(staleDays),
  ])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">CRM</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/crm/courses/new"
            className="px-3 py-1.5 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 transition-colors"
          >
            + Course
          </Link>
          <Link
            href="/admin/crm/outings/new"
            className="px-3 py-1.5 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 transition-colors"
          >
            + Outing
          </Link>
          <Link
            href="/admin/crm/members/new"
            className="px-3 py-1.5 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 transition-colors"
          >
            + Member
          </Link>
        </div>
      </div>

      <KPITiles stats={stats} />

      <StaleLeadAlert
        staleCourses={staleLeads.staleCourses}
        staleOutings={staleLeads.staleOutings}
        staleDays={staleDays}
      />

      <ActivityFeed activities={recentActivity} />
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -E "crm/" | head -10
```

Expected: no errors.

- [ ] **Step 3: Start the dev server and verify the page renders**

```bash
npm run dev &
sleep 5
curl -s http://localhost:3000/admin/crm | grep -c "CRM" || echo "page responded"
```

Expected: page loads (redirects to login if not authenticated — that's expected).

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/crm/page.tsx src/components/crm/
git commit -m "feat: CRM dashboard page with KPI tiles, activity feed, and stale lead alerts"
```

---

### Task 11: Environment variable

**Files:** `.env.local` (if it exists) or note for developer

- [ ] **Step 1: Ensure STALE_LEAD_DAYS is set**

```bash
grep "STALE_LEAD_DAYS" .env.local 2>/dev/null || echo "STALE_LEAD_DAYS=7 # Add to .env.local and Vercel env vars"
```

If not present, add to `.env.local`:
```
STALE_LEAD_DAYS=7
```

Also add to `env.example`:
```
STALE_LEAD_DAYS=7
```

- [ ] **Step 2: Commit env.example update**

```bash
git add env.example 2>/dev/null; git commit -m "chore: add STALE_LEAD_DAYS to env.example" 2>/dev/null || true
```

---

**Plan 1 complete.** The CRM route `/admin/crm` now renders a live dashboard with KPI tiles, a recent activity feed, and stale lead alerts. Database schema is deployed.

**Next:** Execute [Plan 2 — Record Types](2026-04-28-crm-2-record-types.md) to build the course Kanban pipeline, outings table, and member management.

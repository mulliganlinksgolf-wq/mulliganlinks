# CRM Email Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-sender identity (`neil@` / `billy@`), email open tracking via Resend webhooks, per-admin email signatures, bulk CSV course import, and an email performance dashboard to the admin CRM.

**Architecture:** A DB migration adds tracking columns to `crm_activity_log` and a `signature` column to `profiles`. The `sendCrmEmail` action is updated to resolve the sender from session, append signatures, and capture the Resend message ID. A new public webhook route receives `email.opened` events from Resend and updates the activity log. Bulk import and the performance dashboard are new pages that use existing Supabase patterns.

**Tech Stack:** Next.js App Router (server actions, server components, route handlers), Supabase, Resend, `svix` (webhook signature verification), `papaparse` (CSV parsing)

---

## File Map

| Status | File | Purpose |
|---|---|---|
| Create | `supabase/migrations/065_crm_email_tracking.sql` | Add tracking cols to activity log + signature to profiles |
| Modify | `src/lib/crm/types.ts` | Add new fields to `CrmActivityLog` type |
| Modify | `src/app/actions/crm/email.ts` | Per-sender, signature appending, store resend_email_id |
| Create | `src/app/api/webhooks/resend/route.ts` | Resend open-tracking webhook handler |
| Modify | `src/components/crm/ActivityLog.tsx` | Add "Opened" badge to email activities |
| Modify | `src/app/admin/config/page.tsx` | Add signature section |
| Modify | `src/app/admin/config/actions.ts` | Add `saveAdminSignature` server action |
| Create | `src/app/admin/crm/import/page.tsx` | Bulk CSV import page |
| Create | `src/app/admin/crm/import/ImportClient.tsx` | Client component: upload + column mapper |
| Create | `src/app/actions/crm/import.ts` | Server action: validate + insert courses from CSV |
| Create | `src/app/admin/crm/email-performance/page.tsx` | Email performance dashboard (server component) |
| Create | `src/tests/crm/email-sender.test.ts` | Unit tests for sender resolution + signature appending |
| Create | `src/tests/crm/webhook.test.ts` | Unit tests for webhook handler logic |
| Create | `src/tests/crm/import.test.ts` | Unit tests for CSV import validation + dedup |

---

## Task 1: DB Migration

**Files:**
- Create: `supabase/migrations/065_crm_email_tracking.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/065_crm_email_tracking.sql

-- Open tracking fields on activity log
ALTER TABLE crm_activity_log
  ADD COLUMN IF NOT EXISTS resend_email_id TEXT,
  ADD COLUMN IF NOT EXISTS opened_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS open_count      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS from_email      TEXT;

CREATE INDEX IF NOT EXISTS idx_crm_activity_resend_id
  ON crm_activity_log (resend_email_id)
  WHERE resend_email_id IS NOT NULL;

-- Per-admin email signature
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS signature TEXT;
```

- [ ] **Step 2: Apply the migration**

```bash
npx supabase db push
```

Expected: migration applies cleanly, no errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/065_crm_email_tracking.sql
git commit -m "feat(db): add email tracking columns and admin signature to profiles"
```

---

## Task 2: Update CrmActivityLog Type

**Files:**
- Modify: `src/lib/crm/types.ts:73-81`

- [ ] **Step 1: Write a failing test that imports the new fields**

Create `src/tests/crm/email-sender.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'

// Inline the sender resolution logic so we can test it in isolation
const SENDER_MAP: Record<string, string> = {
  'nbarris11@gmail.com': 'Neil Barris <neil@teeahead.com>',
  'beslock@yahoo.com':   'Billy Eslock <billy@teeahead.com>',
}
const DEFAULT_SENDER = 'TeeAhead <hello@teeahead.com>'

function resolveSender(userEmail: string | undefined): string {
  return (userEmail && SENDER_MAP[userEmail]) ?? DEFAULT_SENDER
}

function buildHtmlWithSignature(bodyHtml: string, signature: string | null): string {
  if (!signature) return bodyHtml
  const escaped = signature
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br />')
  return `${bodyHtml}<br /><br />--<br />${escaped}`
}

describe('resolveSender', () => {
  it('returns neil@ for nbarris11@gmail.com', () => {
    expect(resolveSender('nbarris11@gmail.com')).toBe('Neil Barris <neil@teeahead.com>')
  })
  it('returns billy@ for beslock@yahoo.com', () => {
    expect(resolveSender('beslock@yahoo.com')).toBe('Billy Eslock <billy@teeahead.com>')
  })
  it('returns hello@ for unknown admin', () => {
    expect(resolveSender('mulliganlinksgolf@gmail.com')).toBe('TeeAhead <hello@teeahead.com>')
  })
  it('returns hello@ for undefined', () => {
    expect(resolveSender(undefined)).toBe('TeeAhead <hello@teeahead.com>')
  })
})

describe('buildHtmlWithSignature', () => {
  it('appends signature with separator', () => {
    const result = buildHtmlWithSignature('<p>Hello</p>', 'Neil Barris\nneil@teeahead.com')
    expect(result).toContain('--<br />')
    expect(result).toContain('Neil Barris')
    expect(result).toContain('<br />')
  })
  it('returns body unchanged when signature is null', () => {
    const body = '<p>Hello</p>'
    expect(buildHtmlWithSignature(body, null)).toBe(body)
  })
  it('escapes HTML in signature', () => {
    const result = buildHtmlWithSignature('<p>Hi</p>', '<script>alert(1)</script>')
    expect(result).not.toContain('<script>')
    expect(result).toContain('&lt;script&gt;')
  })
})
```

- [ ] **Step 2: Run test to confirm it passes (logic is inline)**

```bash
npx vitest run src/tests/crm/email-sender.test.ts
```

Expected: all tests PASS (logic is self-contained in the test file — this validates the algorithm before we wire it into the action).

- [ ] **Step 3: Update `CrmActivityLog` type**

In `src/lib/crm/types.ts`, replace the `CrmActivityLog` interface (lines 73–81):

```typescript
export interface CrmActivityLog {
  id: string
  record_type: CrmRecordType
  record_id: string
  type: CrmActivityType
  body: string | null
  created_by: string
  created_at: string
  // email tracking (null on non-email activities)
  resend_email_id: string | null
  opened_at: string | null
  open_count: number
  from_email: string | null
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/crm/types.ts src/tests/crm/email-sender.test.ts
git commit -m "feat(crm): add email tracking fields to CrmActivityLog type + sender/signature tests"
```

---

## Task 3: Update sendCrmEmail Action

**Files:**
- Modify: `src/app/actions/crm/email.ts`

- [ ] **Step 1: Rewrite the action**

Replace the entire contents of `src/app/actions/crm/email.ts`:

```typescript
'use server'

import { getResend } from '@/lib/resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CrmRecordType } from '@/lib/crm/types'

const ADMIN_EMAILS = ['mulliganlinksgolf@gmail.com', 'nbarris11@gmail.com', 'beslock@yahoo.com']

const SENDER_MAP: Record<string, string> = {
  'nbarris11@gmail.com': 'Neil Barris <neil@teeahead.com>',
  'beslock@yahoo.com':   'Billy Eslock <billy@teeahead.com>',
}
const DEFAULT_SENDER = 'TeeAhead <hello@teeahead.com>'

function resolveSender(userEmail: string | undefined): string {
  return (userEmail && SENDER_MAP[userEmail]) ?? DEFAULT_SENDER
}

function buildHtmlWithSignature(bodyHtml: string, signature: string | null): string {
  if (!signature) return bodyHtml
  const escaped = signature
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br />')
  return `${bodyHtml}<br /><br />--<br />${escaped}`
}

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('is_admin, signature')
    .eq('id', user.id)
    .single()
  if (!ADMIN_EMAILS.includes(user.email ?? '') && !profile?.is_admin) throw new Error('Not authorized')
  return { admin, user, signature: profile?.signature ?? null }
}

interface SendEmailParams {
  recordType: CrmRecordType
  recordId: string
  to: string
  subject: string
  bodyHtml: string
  sentBy: string
}

export async function sendCrmEmail(
  params: SendEmailParams
): Promise<{ error?: string; success?: boolean }> {
  const resend = getResend()
  if (!resend) {
    return { error: 'Email sending not configured. Set RESEND_API_KEY.' }
  }

  try {
    const { admin, user, signature } = await assertAdmin()

    const fromAddress = resolveSender(user.email ?? undefined)
    const finalHtml = buildHtmlWithSignature(params.bodyHtml, signature)

    const { data: sendData, error: sendError } = await resend.emails.send({
      from: fromAddress,
      to: params.to,
      subject: params.subject,
      html: finalHtml,
    })

    if (sendError) return { error: (sendError as { message?: string }).message ?? 'Send failed' }

    await admin.from('crm_activity_log').insert({
      record_type: params.recordType,
      record_id: params.recordId,
      type: 'email',
      body: `To: ${params.to}\nSubject: ${params.subject}`,
      created_by: params.sentBy,
      resend_email_id: sendData?.id ?? null,
      from_email: fromAddress,
      open_count: 0,
    })

    if (params.recordType !== 'member') {
      const table = params.recordType === 'course' ? 'crm_courses' : 'crm_outings'
      await admin.from(table).update({ last_activity_at: new Date().toISOString() }).eq('id', params.recordId)
    }

    const path =
      params.recordType === 'course' ? `/admin/crm/courses/${params.recordId}`
      : params.recordType === 'outing' ? `/admin/crm/outings/${params.recordId}`
      : `/admin/crm/members/${params.recordId}`
    revalidatePath(path)
    revalidatePath('/admin/crm')

    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function getEmailTemplatesByType(recordType: CrmRecordType) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('crm_email_templates')
    .select('*')
    .eq('record_type', recordType)
    .order('name', { ascending: true })
  return data ?? []
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/crm/email.ts
git commit -m "feat(crm): per-sender identity, signature appending, capture resend_email_id"
```

---

## Task 4: Admin Signature UI

**Files:**
- Modify: `src/app/admin/config/actions.ts`
- Modify: `src/app/admin/config/page.tsx`

- [ ] **Step 1: Add `saveAdminSignature` action**

In `src/app/admin/config/actions.ts`, add this export after the existing `saveConfigValue` function:

```typescript
export async function saveAdminSignature(formData: FormData) {
  const signature = (formData.get('signature') as string | null) ?? ''
  const { admin, user } = await assertAdmin()
  await admin
    .from('profiles')
    .update({ signature: signature.trim() || null })
    .eq('id', user.id)
  revalidatePath('/admin/config')
  redirect('/admin/config?saved=1')
}
```

- [ ] **Step 2: Update the config page to load and display the signature form**

Replace `src/app/admin/config/page.tsx` with:

```typescript
import { getSiteConfig } from '@/lib/site-config'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import ConfigForm from '@/components/admin/ConfigForm'
import { saveAdminSignature } from './actions'

export const metadata = { title: 'Configuration' }

export default async function ConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>
}) {
  const { saved } = await searchParams
  const config = await getSiteConfig()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminClient = createAdminClient()
  const { data: profile } = user
    ? await adminClient.from('profiles').select('signature').eq('id', user.id).single()
    : { data: null }

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

      <div className="border-t pt-8">
        <h2 className="text-lg font-semibold text-[#1A1A1A] mb-1">Email Signature</h2>
        <p className="text-[#6B7770] text-sm mb-4">
          Appended automatically to CRM emails you send. Plain text only.
        </p>
        <form action={saveAdminSignature}>
          <textarea
            name="signature"
            defaultValue={profile?.signature ?? ''}
            rows={4}
            placeholder={'Neil Barris\nneil@teeahead.com\nteeahead.com'}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="mt-3 px-4 py-2 bg-[#1B4332] text-white text-sm font-medium rounded-lg hover:bg-[#155728]"
          >
            Save signature
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/config/page.tsx src/app/admin/config/actions.ts
git commit -m "feat(admin): add per-admin email signature setting to config page"
```

---

## Task 5: Resend Webhook — Open Tracking

**Files:**
- Create: `src/app/api/webhooks/resend/route.ts`
- Create: `src/tests/crm/webhook.test.ts`

- [ ] **Step 1: Install svix**

```bash
npm install svix
```

- [ ] **Step 2: Write failing tests for the webhook handler logic**

Create `src/tests/crm/webhook.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'

// Isolated handler logic — no Supabase or svix imported here
function parseOpenEvent(body: unknown): { emailId: string } | null {
  if (
    typeof body !== 'object' ||
    body === null ||
    (body as Record<string, unknown>).type !== 'email.opened'
  ) return null

  const data = (body as Record<string, unknown>).data as Record<string, unknown> | undefined
  const emailId = data?.email_id
  if (typeof emailId !== 'string' || !emailId) return null
  return { emailId }
}

describe('parseOpenEvent', () => {
  it('returns emailId for valid email.opened event', () => {
    const payload = {
      type: 'email.opened',
      data: { email_id: 're_abc123', created_at: '2026-05-11T10:00:00Z' },
    }
    expect(parseOpenEvent(payload)).toEqual({ emailId: 're_abc123' })
  })

  it('returns null for wrong event type', () => {
    const payload = { type: 'email.delivered', data: { email_id: 're_abc123' } }
    expect(parseOpenEvent(payload)).toBeNull()
  })

  it('returns null when email_id is missing', () => {
    const payload = { type: 'email.opened', data: {} }
    expect(parseOpenEvent(payload)).toBeNull()
  })

  it('returns null for null input', () => {
    expect(parseOpenEvent(null)).toBeNull()
  })
})
```

- [ ] **Step 3: Run test to confirm it passes**

```bash
npx vitest run src/tests/crm/webhook.test.ts
```

Expected: all 4 tests PASS.

- [ ] **Step 4: Create the webhook route**

Create `src/app/api/webhooks/resend/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    console.error('[resend-webhook] RESEND_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  const body = await req.text()
  const headers = {
    'svix-id':        req.headers.get('svix-id') ?? '',
    'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
    'svix-signature': req.headers.get('svix-signature') ?? '',
  }

  let payload: Record<string, unknown>
  try {
    const wh = new Webhook(secret)
    payload = wh.verify(body, headers) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (payload.type !== 'email.opened') {
    return NextResponse.json({ received: true })
  }

  const data = payload.data as Record<string, unknown> | undefined
  const emailId = data?.email_id
  if (typeof emailId !== 'string' || !emailId) {
    return NextResponse.json({ received: true })
  }

  const admin = createAdminClient()
  const { data: activity } = await admin
    .from('crm_activity_log')
    .select('id, opened_at, open_count')
    .eq('resend_email_id', emailId)
    .single()

  if (activity) {
    await admin
      .from('crm_activity_log')
      .update({
        opened_at: activity.opened_at ?? new Date().toISOString(),
        open_count: (activity.open_count ?? 0) + 1,
      })
      .eq('id', activity.id)
  }

  return NextResponse.json({ received: true })
}
```

- [ ] **Step 5: Add `RESEND_WEBHOOK_SECRET` to env**

```bash
echo "RESEND_WEBHOOK_SECRET=" >> .env.local
```

Then open `.env.local` and paste in the signing secret from the Resend dashboard (Webhooks → your endpoint → Signing Secret).

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Register the webhook in Resend dashboard (manual step)**

1. Go to resend.com → Webhooks → Add Endpoint
2. URL: `https://teeahead.com/api/webhooks/resend`
3. Subscribe to: `email.opened` only
4. Copy the Signing Secret into `RESEND_WEBHOOK_SECRET` in Vercel env vars:

```bash
vercel env add RESEND_WEBHOOK_SECRET --value=<secret> production
```

- [ ] **Step 8: Commit**

```bash
git add src/app/api/webhooks/resend/route.ts src/tests/crm/webhook.test.ts
git commit -m "feat(crm): Resend webhook for email open tracking"
```

---

## Task 6: Activity Log "Opened" Badge

**Files:**
- Modify: `src/components/crm/ActivityLog.tsx`

- [ ] **Step 1: Update the component**

Replace the entire contents of `src/components/crm/ActivityLog.tsx`:

```typescript
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
            <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700 capitalize">{a.type.replace('_', ' ')}</span>
              <span>·</span>
              <span>{a.created_by}</span>
              <span>·</span>
              <span>{formatDate(a.created_at)}</span>
              {a.type === 'email' && a.opened_at && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                  ✓ Opened{a.open_count > 1 ? ` ×${a.open_count}` : ''}
                </span>
              )}
              {a.type === 'email' && !a.opened_at && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 font-medium border border-slate-200">
                  Not opened
                </span>
              )}
            </div>
            {a.body && <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{a.body}</p>}
          </div>
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 2: Check that queries fetching activities select the new columns**

Search for all places `crm_activity_log` is selected and verify the query uses `'*'` or explicitly includes `opened_at`, `open_count`, `from_email`, `resend_email_id`:

```bash
grep -r "crm_activity_log" /Users/barris/Desktop/MulliganLinks/src --include="*.ts" --include="*.tsx" -l
```

Open each file and confirm the `.select()` call uses `'*'` — if any use explicit column lists, add the four new columns.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/crm/ActivityLog.tsx
git commit -m "feat(crm): show Opened badge on email activity log entries"
```

---

## Task 7: Bulk CSV Import

**Files:**
- Create: `src/app/actions/crm/import.ts`
- Create: `src/app/admin/crm/import/page.tsx`
- Create: `src/app/admin/crm/import/ImportClient.tsx`
- Create: `src/tests/crm/import.test.ts`

- [ ] **Step 1: Install papaparse**

```bash
npm install papaparse
npm install --save-dev @types/papaparse
```

- [ ] **Step 2: Write failing tests for import validation**

Create `src/tests/crm/import.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'

type CsvRow = Record<string, string>
type ColumnMap = Record<string, string> // csvHeader -> crmField

interface CourseImportRow {
  name: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  stage: string
  assigned_to: string | null
  notes: string | null
}

const VALID_STAGES = ['lead','contacted','demo','negotiating','partner','churned']
const VALID_ASSIGNEES = ['neil','billy']

function mapRow(row: CsvRow, columnMap: ColumnMap, defaultAssignee: string): CourseImportRow | null {
  const name = row[columnMap['name']]?.trim()
  if (!name) return null

  const stageRaw = row[columnMap['stage']]?.trim().toLowerCase() ?? ''
  const stage = VALID_STAGES.includes(stageRaw) ? stageRaw : 'lead'

  const assigneeRaw = row[columnMap['assigned_to']]?.trim().toLowerCase() ?? ''
  const assigned_to = VALID_ASSIGNEES.includes(assigneeRaw) ? assigneeRaw : defaultAssignee

  return {
    name,
    contact_name: row[columnMap['contact_name']]?.trim() || null,
    contact_email: row[columnMap['contact_email']]?.trim() || null,
    contact_phone: row[columnMap['contact_phone']]?.trim() || null,
    stage,
    assigned_to,
    notes: row[columnMap['notes']]?.trim() || null,
  }
}

describe('mapRow', () => {
  const columnMap = {
    name: 'Course Name',
    contact_name: 'Contact',
    contact_email: 'Email',
    contact_phone: 'Phone',
    stage: 'Stage',
    assigned_to: 'Assigned',
    notes: 'Notes',
  }

  it('maps a complete row', () => {
    const row: CsvRow = {
      'Course Name': 'Pine Hills Golf Club',
      Contact: 'John Smith',
      Email: 'john@pinehills.com',
      Phone: '555-1234',
      Stage: 'contacted',
      Assigned: 'neil',
      Notes: 'Called twice',
    }
    expect(mapRow(row, columnMap, 'neil')).toEqual({
      name: 'Pine Hills Golf Club',
      contact_name: 'John Smith',
      contact_email: 'john@pinehills.com',
      contact_phone: '555-1234',
      stage: 'contacted',
      assigned_to: 'neil',
      notes: 'Called twice',
    })
  })

  it('defaults stage to lead for unrecognized value', () => {
    const row: CsvRow = { 'Course Name': 'Test Course', Stage: 'prospect', Email: '', Contact: '', Phone: '', Assigned: '', Notes: '' }
    expect(mapRow(row, columnMap, 'neil')?.stage).toBe('lead')
  })

  it('defaults assigned_to to caller when blank', () => {
    const row: CsvRow = { 'Course Name': 'Test Course', Stage: '', Email: '', Contact: '', Phone: '', Assigned: '', Notes: '' }
    expect(mapRow(row, columnMap, 'billy')?.assigned_to).toBe('billy')
  })

  it('returns null when name is blank', () => {
    const row: CsvRow = { 'Course Name': '', Stage: '', Email: '', Contact: '', Phone: '', Assigned: '', Notes: '' }
    expect(mapRow(row, columnMap, 'neil')).toBeNull()
  })
})
```

- [ ] **Step 3: Run test to confirm it passes**

```bash
npx vitest run src/tests/crm/import.test.ts
```

Expected: all 4 tests PASS.

- [ ] **Step 4: Create the server action**

Create `src/app/actions/crm/import.ts`:

```typescript
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAILS = ['mulliganlinksgolf@gmail.com', 'nbarris11@gmail.com', 'beslock@yahoo.com']
const VALID_STAGES = ['lead','contacted','demo','negotiating','partner','churned']
const VALID_ASSIGNEES = ['neil','billy']

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!ADMIN_EMAILS.includes(user.email ?? '') && !profile?.is_admin) throw new Error('Not authorized')
  return { admin, user }
}

export interface CsvCourseRow {
  name: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  stage: string
  assigned_to: string | null
  notes: string | null
}

export interface ImportResult {
  created: number
  skipped: number
  errors: string[]
}

export async function importCourses(rows: CsvCourseRow[]): Promise<ImportResult> {
  const { admin, user } = await assertAdmin()

  const defaultAssignee = user.email === 'beslock@yahoo.com' ? 'billy' : 'neil'

  // Fetch existing contact emails to deduplicate
  const emailsToCheck = rows
    .map(r => r.contact_email)
    .filter((e): e is string => !!e)

  const { data: existing } = await admin
    .from('crm_courses')
    .select('contact_email')
    .in('contact_email', emailsToCheck)

  const existingEmails = new Set(existing?.map(r => r.contact_email) ?? [])

  const toInsert: object[] = []
  const errors: string[] = []
  let skipped = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row.name.trim()) {
      errors.push(`Row ${i + 1}: missing course name`)
      continue
    }
    if (row.contact_email && existingEmails.has(row.contact_email)) {
      skipped++
      continue
    }

    const stage = VALID_STAGES.includes(row.stage) ? row.stage : 'lead'
    const assignedTo = VALID_ASSIGNEES.includes(row.assigned_to ?? '') ? row.assigned_to : defaultAssignee

    toInsert.push({
      name: row.name.trim(),
      contact_name: row.contact_name || null,
      contact_email: row.contact_email || null,
      contact_phone: row.contact_phone || null,
      stage,
      assigned_to: assignedTo,
      notes: row.notes || null,
      last_activity_at: new Date().toISOString(),
    })
  }

  if (toInsert.length > 0) {
    const { error } = await admin.from('crm_courses').insert(toInsert)
    if (error) return { created: 0, skipped, errors: [error.message] }
  }

  return { created: toInsert.length, skipped, errors }
}
```

- [ ] **Step 5: Create the import client component**

Create `src/app/admin/crm/import/ImportClient.tsx`:

```typescript
'use client'

import { useRef, useState } from 'react'
import Papa from 'papaparse'
import { importCourses } from '@/app/actions/crm/import'
import type { CsvCourseRow, ImportResult } from '@/app/actions/crm/import'

const CRM_FIELDS = [
  { key: 'name', label: 'Course name', required: true },
  { key: 'contact_name', label: 'Contact name' },
  { key: 'contact_email', label: 'Contact email' },
  { key: 'contact_phone', label: 'Contact phone' },
  { key: 'stage', label: 'Pipeline stage' },
  { key: 'assigned_to', label: 'Assigned to' },
  { key: 'notes', label: 'Notes' },
] as const

type CrmFieldKey = typeof CRM_FIELDS[number]['key']

export function ImportClient() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [allRows, setAllRows] = useState<Record<string, string>[]>([])
  const [columnMap, setColumnMap] = useState<Partial<Record<CrmFieldKey, string>>>({})
  const [result, setResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleFile(file: File) {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const cols = results.meta.fields ?? []
        setHeaders(cols)
        setAllRows(results.data)
        setPreview(results.data.slice(0, 5))
        setResult(null)
        setError(null)
        // Auto-map obvious headers
        const auto: Partial<Record<CrmFieldKey, string>> = {}
        for (const col of cols) {
          const lower = col.toLowerCase().replace(/\s+/g, '_')
          if (lower.includes('course') || lower === 'name') auto.name = col
          else if (lower.includes('contact_name') || lower === 'contact') auto.contact_name = col
          else if (lower.includes('email')) auto.contact_email = col
          else if (lower.includes('phone')) auto.contact_phone = col
          else if (lower.includes('stage')) auto.stage = col
          else if (lower.includes('assign')) auto.assigned_to = col
          else if (lower.includes('note')) auto.notes = col
        }
        setColumnMap(auto)
      },
    })
  }

  async function handleImport() {
    if (!columnMap.name) {
      setError('You must map the "Course name" column before importing.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const rows: CsvCourseRow[] = allRows.map(row => ({
        name: row[columnMap.name!] ?? '',
        contact_name: columnMap.contact_name ? row[columnMap.contact_name] ?? null : null,
        contact_email: columnMap.contact_email ? row[columnMap.contact_email] ?? null : null,
        contact_phone: columnMap.contact_phone ? row[columnMap.contact_phone] ?? null : null,
        stage: columnMap.stage ? row[columnMap.stage] ?? '' : '',
        assigned_to: columnMap.assigned_to ? row[columnMap.assigned_to] ?? null : null,
        notes: columnMap.notes ? row[columnMap.notes] ?? null : null,
      }))
      const res = await importCourses(rows)
      setResult(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Upload zone */}
      <div
        className="border-2 border-dashed border-slate-200 rounded-xl p-10 text-center cursor-pointer hover:border-emerald-400 transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
      >
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        <p className="text-slate-500 text-sm">Drop a CSV here or <span className="text-emerald-700 font-medium">click to browse</span></p>
        <p className="text-slate-400 text-xs mt-1">Columns: course name, contact name, email, phone, stage, assigned to, notes</p>
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-2">Preview (first {preview.length} rows)</h2>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="text-xs w-full">
              <thead className="bg-slate-50">
                <tr>{headers.map(h => <th key={h} className="px-3 py-2 text-left text-slate-600 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    {headers.map(h => <td key={h} className="px-3 py-2 text-slate-700">{row[h]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Column mapper */}
      {headers.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Map columns</h2>
          <div className="grid grid-cols-2 gap-3">
            {CRM_FIELDS.map(field => (
              <div key={field.key} className="flex items-center gap-3">
                <span className="text-sm text-slate-600 w-36 flex-shrink-0">
                  {field.label}{'required' in field && field.required && <span className="text-red-500 ml-0.5">*</span>}
                </span>
                <select
                  value={columnMap[field.key] ?? ''}
                  onChange={e => setColumnMap(prev => ({ ...prev, [field.key]: e.target.value || undefined }))}
                  className="flex-1 text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700"
                >
                  <option value="">— skip —</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Import button */}
      {headers.length > 0 && !result && (
        <div className="flex items-center gap-4">
          <button
            onClick={handleImport}
            disabled={loading || !columnMap.name}
            className="px-5 py-2 bg-[#1B4332] text-white text-sm font-medium rounded-lg hover:bg-[#155728] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Importing…' : `Import ${allRows.length} courses`}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4 space-y-2">
          <p className="text-sm font-semibold text-emerald-800">Import complete</p>
          <p className="text-sm text-emerald-700">✓ {result.created} courses created</p>
          {result.skipped > 0 && <p className="text-sm text-slate-500">{result.skipped} skipped (already exist)</p>}
          {result.errors.length > 0 && (
            <ul className="text-sm text-red-600 list-disc list-inside">
              {result.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Create the import page**

Create `src/app/admin/crm/import/page.tsx`:

```typescript
import { ImportClient } from './ImportClient'

export const metadata = { title: 'Import Courses' }

export default function ImportPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Import Courses</h1>
        <p className="text-[#6B7770] text-sm mt-1">
          Upload a CSV to bulk-create course pipeline records. Duplicates (matched by email) are skipped.
        </p>
      </div>
      <ImportClient />
    </div>
  )
}
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/app/actions/crm/import.ts src/app/admin/crm/import/ src/tests/crm/import.test.ts
git commit -m "feat(crm): bulk CSV course import with column mapper"
```

---

## Task 8: Email Performance Dashboard

**Files:**
- Create: `src/app/admin/crm/email-performance/page.tsx`

- [ ] **Step 1: Create the dashboard page**

Create `src/app/admin/crm/email-performance/page.tsx`:

```typescript
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = { title: 'Email Performance' }

function pct(opened: number, sent: number) {
  if (!sent) return '—'
  return `${Math.round((opened / sent) * 100)}%`
}

export default async function EmailPerformancePage() {
  const admin = createAdminClient()

  // All email activities
  const { data: activities } = await admin
    .from('crm_activity_log')
    .select('id, opened_at, open_count, from_email, record_type, body, created_at')
    .eq('type', 'email')
    .order('created_at', { ascending: false })

  const rows = activities ?? []

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const recentRows = rows.filter(r => r.created_at >= thirtyDaysAgo)

  const totalSent = rows.length
  const totalOpened = rows.filter(r => r.opened_at).length
  const recentSent = recentRows.length
  const recentOpened = recentRows.filter(r => r.opened_at).length

  // By sender
  const bySender: Record<string, { sent: number; opened: number }> = {}
  for (const r of rows) {
    const key = r.from_email ?? 'hello@teeahead.com'
    bySender[key] ??= { sent: 0, opened: 0 }
    bySender[key].sent++
    if (r.opened_at) bySender[key].opened++
  }

  // By record type
  const byType: Record<string, { sent: number; opened: number }> = {}
  for (const r of rows) {
    const key = r.record_type as string
    byType[key] ??= { sent: 0, opened: 0 }
    byType[key].sent++
    if (r.opened_at) byType[key].opened++
  }

  // By template — derive template name from subject in body ("Subject: ...")
  const byTemplate: Record<string, { sent: number; opened: number; lastSent: string }> = {}
  for (const r of rows) {
    const subjectMatch = (r.body ?? '').match(/Subject:\s*(.+)/)
    const subject = subjectMatch?.[1]?.trim() ?? '(no subject)'
    byTemplate[subject] ??= { sent: 0, opened: 0, lastSent: r.created_at }
    byTemplate[subject].sent++
    if (r.opened_at) byTemplate[subject].opened++
    if (r.created_at > byTemplate[subject].lastSent) byTemplate[subject].lastSent = r.created_at
  }
  const templateRows = Object.entries(byTemplate).sort((a, b) => b[1].sent - a[1].sent)

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso))

  return (
    <div className="max-w-4xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Email Performance</h1>
        <p className="text-[#6B7770] text-sm mt-1">Open tracking for CRM emails sent via TeeAhead.</p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total sent (all time)', value: totalSent },
          { label: 'Total sent (30 days)', value: recentSent },
          { label: 'Open rate (all time)', value: pct(totalOpened, totalSent) },
          { label: 'Open rate (30 days)', value: pct(recentOpened, recentSent) },
        ].map(card => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs text-slate-500">{card.label}</p>
            <p className="text-2xl font-bold text-[#1A1A1A] mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* By sender */}
      <div>
        <h2 className="text-base font-semibold text-[#1A1A1A] mb-3">By sender</h2>
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">Sender</th>
                <th className="px-4 py-3 text-right text-slate-600 font-medium">Sent</th>
                <th className="px-4 py-3 text-right text-slate-600 font-medium">Opened</th>
                <th className="px-4 py-3 text-right text-slate-600 font-medium">Open rate</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(bySender).map(([sender, s]) => (
                <tr key={sender} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-700">{sender}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{s.sent}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{s.opened}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700">{pct(s.opened, s.sent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* By contact type */}
      <div>
        <h2 className="text-base font-semibold text-[#1A1A1A] mb-3">By contact type</h2>
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">Type</th>
                <th className="px-4 py-3 text-right text-slate-600 font-medium">Sent</th>
                <th className="px-4 py-3 text-right text-slate-600 font-medium">Open rate</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(byType).map(([type, s]) => (
                <tr key={type} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-700 capitalize">{type}s</td>
                  <td className="px-4 py-3 text-right text-slate-700">{s.sent}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700">{pct(s.opened, s.sent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* By template (subject) */}
      <div>
        <h2 className="text-base font-semibold text-[#1A1A1A] mb-3">By template / subject</h2>
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">Subject</th>
                <th className="px-4 py-3 text-right text-slate-600 font-medium">Sent</th>
                <th className="px-4 py-3 text-right text-slate-600 font-medium">Opened</th>
                <th className="px-4 py-3 text-right text-slate-600 font-medium">Open rate</th>
                <th className="px-4 py-3 text-right text-slate-600 font-medium">Last sent</th>
              </tr>
            </thead>
            <tbody>
              {templateRows.map(([subject, s]) => (
                <tr key={subject} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-700 max-w-xs truncate">{subject}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{s.sent}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{s.opened}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700">{pct(s.opened, s.sent)}</td>
                  <td className="px-4 py-3 text-right text-slate-500">{formatDate(s.lastSent)}</td>
                </tr>
              ))}
              {templateRows.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No emails sent yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add sidebar navigation links**

In `src/components/admin/AdminSidebar.tsx`, add two entries after line 56 (the "Email Templates" `SidebarItem`):

```typescript
<SidebarItem href="/admin/crm/import" icon="📥" label="Import Courses" active={pathname.startsWith('/admin/crm/import')} />
<SidebarItem href="/admin/crm/email-performance" icon="📊" label="Email Performance" active={pathname.startsWith('/admin/crm/email-performance')} />
```

- [ ] **Step 3: Run all tests**

```bash
npx vitest run
```

Expected: all tests PASS.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/crm/email-performance/ src/app/admin/crm/page.tsx
git commit -m "feat(crm): email performance dashboard with open rate by sender, type, and subject"
```

---

## Final Verification

- [ ] Deploy to Vercel: `git push origin main`
- [ ] Send a test CRM email as Neil — confirm activity log shows `from_email: neil@teeahead.com`
- [ ] Check Resend dashboard — confirm the email was sent from `neil@teeahead.com`
- [ ] Wait for the open webhook to fire (open the email) — confirm "Opened" badge appears on the activity
- [ ] Check `/admin/crm/email-performance` — confirm the send appears in all three tables
- [ ] Test bulk import with `michigan_golf_courses_outreach.csv`
- [ ] Set a signature in `/admin/config` — send a CRM email and confirm it appears in the received email

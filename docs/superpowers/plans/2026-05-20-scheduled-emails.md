# Scheduled Emails Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow CRM users to compose an email, pick a future date/time, and have it send automatically — with the ability to view and cancel pending scheduled emails from the course/outing/member detail page.

**Architecture:** A new `crm_scheduled_emails` DB table holds pending sends. A Vercel Cron job at `/api/cron/send-scheduled-emails` runs every 5 minutes, picks up due rows, sends via Resend, and writes activity log entries. The `EmailComposerModal` gains a "Schedule for later" toggle with a datetime picker. A new `ScheduledEmailsList` server component renders on each detail page above the activity log.

**Tech Stack:** Next.js App Router (server actions, server components), Supabase (PostgreSQL), Resend API, Vercel Cron

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `supabase/migrations/089_scheduled_emails.sql` | Create | Table + index |
| `src/app/actions/crm/email.ts` | Modify | Add `scheduleCrmEmail`, `cancelScheduledEmail`, `getScheduledEmails` |
| `src/components/crm/EmailComposerModal.tsx` | Modify | Schedule toggle + datetime picker |
| `src/components/crm/ScheduledEmailsList.tsx` | Create | Pending emails list with cancel buttons |
| `src/app/admin/crm/courses/[id]/page.tsx` | Modify | Add `<ScheduledEmailsList>` |
| `src/app/admin/crm/outings/[id]/page.tsx` | Modify | Add `<ScheduledEmailsList>` |
| `src/app/admin/crm/members/[id]/page.tsx` | Modify | Add `<ScheduledEmailsList>` |
| `src/app/api/cron/send-scheduled-emails/route.ts` | Create | Cron handler |
| `vercel.json` | Modify | Register cron schedule |

---

## Task 1: Database migration

**Files:**
- Create: `supabase/migrations/089_scheduled_emails.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/089_scheduled_emails.sql
create table if not exists crm_scheduled_emails (
  id            uuid primary key default gen_random_uuid(),
  record_type   text not null check (record_type in ('course','outing','member')),
  record_id     uuid not null,
  to_email      text not null,
  subject       text not null,
  body_html     text not null,
  scheduled_for timestamptz not null,
  status        text not null default 'pending'
                  check (status in ('pending','sent','cancelled','failed')),
  created_by    text not null,
  from_email    text not null,
  in_reply_to   text,
  message_id    text,
  sent_at       timestamptz,
  error         text,
  created_at    timestamptz not null default now()
);

create index if not exists crm_scheduled_emails_due
  on crm_scheduled_emails (status, scheduled_for)
  where status = 'pending';
```

- [ ] **Step 2: Push migration to production**

```bash
supabase db push --linked
```

Expected: `Finished supabase db push.`

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/089_scheduled_emails.sql
git commit -m "feat: crm_scheduled_emails table"
```

---

## Task 2: Server actions

**Files:**
- Modify: `src/app/actions/crm/email.ts`

The file already exports `sendCrmEmail` and `getLastEmailToContact`. Add three new exports at the bottom. The existing `assertAdmin`, `resolveSender`, `buildHtmlWithSignature`, and `ADMIN_EMAILS` helpers are already defined — use them directly.

- [ ] **Step 1: Add `scheduleCrmEmail` action**

Append to `src/app/actions/crm/email.ts`:

```typescript
interface ScheduleEmailParams {
  recordType: CrmRecordType
  recordId: string
  to: string
  subject: string
  bodyHtml: string
  sentBy: string
  scheduledFor: string  // ISO string (UTC)
  inReplyTo?: string | null
}

export async function scheduleCrmEmail(
  params: ScheduleEmailParams
): Promise<{ error?: string; success?: boolean }> {
  try {
    const { admin, user } = await assertAdmin()
    const fromAddress = resolveSender(user.email ?? undefined)
    const signature = (await admin
      .from('profiles')
      .select('signature')
      .eq('id', user.id)
      .single()).data?.signature ?? null
    const finalHtml = buildHtmlWithSignature(params.bodyHtml, signature)
    const messageId = `<${crypto.randomUUID()}@teeahead.com>`

    const { error } = await admin.from('crm_scheduled_emails').insert({
      record_type: params.recordType,
      record_id: params.recordId,
      to_email: params.to,
      subject: params.subject,
      body_html: finalHtml,
      scheduled_for: params.scheduledFor,
      status: 'pending',
      created_by: params.sentBy,
      from_email: fromAddress,
      in_reply_to: params.inReplyTo ?? null,
      message_id: messageId,
    })

    if (error) return { error: error.message }

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
```

- [ ] **Step 2: Add `cancelScheduledEmail` action**

Append to `src/app/actions/crm/email.ts`:

```typescript
export async function cancelScheduledEmail(
  id: string,
  recordType: CrmRecordType,
  recordId: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    const { admin } = await assertAdmin()
    const { error } = await admin
      .from('crm_scheduled_emails')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('status', 'pending')

    if (error) return { error: error.message }

    const path =
      recordType === 'course' ? `/admin/crm/courses/${recordId}`
      : recordType === 'outing' ? `/admin/crm/outings/${recordId}`
      : `/admin/crm/members/${recordId}`
    revalidatePath(path)

    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
```

- [ ] **Step 3: Add `getScheduledEmails` action**

Append to `src/app/actions/crm/email.ts`:

```typescript
export interface ScheduledEmail {
  id: string
  to_email: string
  subject: string
  scheduled_for: string
  status: string
  created_by: string
}

export async function getScheduledEmails(
  recordType: CrmRecordType,
  recordId: string
): Promise<ScheduledEmail[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('crm_scheduled_emails')
    .select('id, to_email, subject, scheduled_for, status, created_by')
    .eq('record_type', recordType)
    .eq('record_id', recordId)
    .eq('status', 'pending')
    .order('scheduled_for', { ascending: true })
  return data ?? []
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/app/actions/crm/email.ts
git commit -m "feat: scheduleCrmEmail, cancelScheduledEmail, getScheduledEmails actions"
```

---

## Task 3: EmailComposerModal — schedule toggle

**Files:**
- Modify: `src/components/crm/EmailComposerModal.tsx`

The file already has `useState`, `sending`, `error`, `handleSend`, and imports for `sendCrmEmail`. Add `scheduleCrmEmail` to the import, new state, and UI.

- [ ] **Step 1: Add import and state**

Change the import line at the top:

```typescript
import { sendCrmEmail, getEmailTemplatesByType, getLastEmailToContact, scheduleCrmEmail } from '@/app/actions/crm/email'
```

Add two new state variables after the existing `useState` declarations (around line 34):

```typescript
const [scheduleMode, setScheduleMode] = useState(false)
const [scheduledFor, setScheduledFor] = useState('')
```

- [ ] **Step 2: Update `handleSend` to branch on schedule mode**

Replace the existing `handleSend` function:

```typescript
async function handleSend(e: React.FormEvent) {
  e.preventDefault()
  if (submittingRef.current) return
  if (!to) { setError('Recipient email is required'); return }
  if (!bodyText.trim()) { setError('Email body is required'); return }
  if (scheduleMode && !scheduledFor) { setError('Please pick a date and time'); return }
  submittingRef.current = true
  setSending(true)
  setError(null)
  try {
    const bodyHtml = plainTextToHtml(bodyText)
    if (scheduleMode) {
      // Convert Detroit local time to UTC ISO string
      const detroitDate = new Date(scheduledFor)
      const result = await scheduleCrmEmail({
        recordType, recordId, to, subject, bodyHtml, sentBy,
        scheduledFor: detroitDate.toISOString(),
        inReplyTo: replyMode && previousEmail ? previousEmail.message_id : null,
      })
      if (result.error) {
        setError(result.error)
      } else {
        onSent()
        onClose()
      }
    } else {
      const result = await sendCrmEmail({
        recordType, recordId, to, subject, bodyHtml, sentBy,
        inReplyTo: replyMode && previousEmail ? previousEmail.message_id : null,
      })
      if (result.error) {
        setError(result.error)
      } else {
        onSent()
        onClose()
      }
    }
  } finally {
    submittingRef.current = false
    setSending(false)
  }
}
```

- [ ] **Step 3: Add schedule toggle UI**

Add this block in the JSX immediately before the `{error && ...}` line:

```tsx
{/* Schedule toggle */}
<div className="flex items-center gap-3 pt-1">
  <label className="flex items-center gap-2 cursor-pointer select-none">
    <input
      type="checkbox"
      checked={scheduleMode}
      onChange={(e) => {
        setScheduleMode(e.target.checked)
        if (!e.target.checked) setScheduledFor('')
      }}
      className="w-4 h-4 rounded"
    />
    <span className="text-sm text-slate-600">Schedule for later</span>
  </label>
  {scheduleMode && (
    <input
      type="datetime-local"
      value={scheduledFor}
      onChange={(e) => setScheduledFor(e.target.value)}
      min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
      className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-300"
    />
  )}
</div>
```

- [ ] **Step 4: Update submit button label**

Change the submit button text to reflect mode:

```tsx
{sending ? 'Sending…' : scheduleMode ? 'Schedule Email' : 'Send Email'}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/components/crm/EmailComposerModal.tsx
git commit -m "feat: schedule for later toggle in email composer"
```

---

## Task 4: ScheduledEmailsList component

**Files:**
- Create: `src/components/crm/ScheduledEmailsList.tsx`

This is a server component. It fetches pending scheduled emails for a record and renders them with cancel buttons. Cancel uses a server action bound to a form.

- [ ] **Step 1: Create the component**

```typescript
// src/components/crm/ScheduledEmailsList.tsx
import { getScheduledEmails, cancelScheduledEmail } from '@/app/actions/crm/email'
import type { CrmRecordType } from '@/lib/crm/types'

interface Props {
  recordType: CrmRecordType
  recordId: string
}

function formatScheduled(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    timeZone: 'America/Detroit',
  }).format(new Date(iso))
}

export async function ScheduledEmailsList({ recordType, recordId }: Props) {
  const emails = await getScheduledEmails(recordType, recordId)
  if (emails.length === 0) return null

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <h3 className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-3">
        Scheduled Emails ({emails.length})
      </h3>
      <ul className="space-y-2">
        {emails.map((email) => (
          <li key={email.id} className="flex items-start justify-between gap-3 text-sm">
            <div className="min-w-0">
              <p className="font-medium text-slate-700 truncate">{email.subject}</p>
              <p className="text-xs text-slate-500">
                To: {email.to_email} · Sends {formatScheduled(email.scheduled_for)}
              </p>
            </div>
            <form
              action={async () => {
                'use server'
                await cancelScheduledEmail(email.id, recordType, recordId)
              }}
            >
              <button
                type="submit"
                className="text-xs text-red-500 hover:text-red-700 hover:underline shrink-0 mt-0.5"
              >
                Cancel
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/crm/ScheduledEmailsList.tsx
git commit -m "feat: ScheduledEmailsList component"
```

---

## Task 5: Wire ScheduledEmailsList into detail pages

**Files:**
- Modify: `src/app/admin/crm/courses/[id]/page.tsx`
- Modify: `src/app/admin/crm/outings/[id]/page.tsx`
- Modify: `src/app/admin/crm/members/[id]/page.tsx`

- [ ] **Step 1: Update courses detail page**

In `src/app/admin/crm/courses/[id]/page.tsx`, add the import:

```typescript
import { ScheduledEmailsList } from '@/components/crm/ScheduledEmailsList'
```

Then add `<ScheduledEmailsList>` directly above the `<ActivityLog>` usage:

```tsx
<ScheduledEmailsList recordType="course" recordId={id} />
<ActivityLog activities={activities} />
```

- [ ] **Step 2: Update outings detail page**

In `src/app/admin/crm/outings/[id]/page.tsx`, add the same import and add above `<ActivityLog>`:

```tsx
<ScheduledEmailsList recordType="outing" recordId={id} />
<ActivityLog activities={activities} />
```

- [ ] **Step 3: Update members detail page**

In `src/app/admin/crm/members/[id]/page.tsx`, add the same import and add above `<ActivityLog>`:

```tsx
<ScheduledEmailsList recordType="member" recordId={id} />
<ActivityLog activities={activities} />
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/crm/courses/[id]/page.tsx src/app/admin/crm/outings/[id]/page.tsx src/app/admin/crm/members/[id]/page.tsx
git commit -m "feat: show scheduled emails on detail pages"
```

---

## Task 6: Cron route and vercel.json

**Files:**
- Create: `src/app/api/cron/send-scheduled-emails/route.ts`
- Modify: `vercel.json`

- [ ] **Step 1: Create the cron route**

```typescript
// src/app/api/cron/send-scheduled-emails/route.ts
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getResend } from '@/lib/resend'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const resend = getResend()
  if (!resend) return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 })

  const admin = createAdminClient()

  const { data: due, error: fetchError } = await admin
    .from('crm_scheduled_emails')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
  if (!due?.length) return NextResponse.json({ sent: 0, message: 'Nothing due' })

  let sent = 0, failed = 0

  for (const row of due) {
    const headers: Record<string, string> = { 'Message-ID': row.message_id ?? `<${crypto.randomUUID()}@teeahead.com>` }
    if (row.in_reply_to) {
      headers['In-Reply-To'] = row.in_reply_to
      headers['References'] = row.in_reply_to
    }

    const { data: sendData, error: sendError } = await resend.emails.send({
      from: row.from_email,
      to: row.to_email,
      subject: row.subject,
      html: row.body_html,
      headers,
    })

    if (sendError) {
      await admin
        .from('crm_scheduled_emails')
        .update({ status: 'failed', error: (sendError as { message?: string }).message ?? 'Send failed' })
        .eq('id', row.id)
      failed++
      continue
    }

    // Write activity log entry
    await admin.from('crm_activity_log').insert({
      record_type: row.record_type,
      record_id: row.record_id,
      type: 'email',
      body: `To: ${row.to_email}\nSubject: ${row.subject}`,
      email_html: row.body_html,
      created_by: row.created_by,
      resend_email_id: sendData?.id ?? null,
      from_email: row.from_email,
      open_count: 0,
      message_id: row.message_id,
      in_reply_to: row.in_reply_to ?? null,
    })

    await admin
      .from('crm_scheduled_emails')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', row.id)

    sent++
  }

  return NextResponse.json({ sent, failed, total: due.length })
}
```

- [ ] **Step 2: Register cron in vercel.json**

In `vercel.json`, add to the `crons` array:

```json
{
  "path": "/api/cron/send-scheduled-emails",
  "schedule": "*/5 * * * *"
}
```

Full updated `crons` array:

```json
"crons": [
  { "path": "/api/crm/stale-leads", "schedule": "0 8 * * *" },
  { "path": "/api/cron/referral-payouts", "schedule": "0 9 1 * *" },
  { "path": "/api/cron/imap-sync", "schedule": "0 13 * * *" },
  { "path": "/api/cron/send-scheduled-emails", "schedule": "*/5 * * * *" }
]
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 4: Commit and push**

```bash
git add src/app/api/cron/send-scheduled-emails/route.ts vercel.json
git commit -m "feat: scheduled email cron job every 5 minutes"
git push origin main
```

---

## Task 7: Smoke test

- [ ] **Step 1: Open a course detail page and open the email composer**

Navigate to any course in `/admin/crm/courses/[id]`.

- [ ] **Step 2: Schedule a test email 2 minutes from now**

Toggle "Schedule for later", pick a time 2 minutes out, fill in subject and body, click "Schedule Email". Verify the modal closes and the amber "Scheduled Emails" card appears on the page showing the pending email.

- [ ] **Step 3: Test cancellation**

Click the Cancel button on the scheduled email. Verify the card disappears.

- [ ] **Step 4: Test actual sending via cron**

Schedule an email 2 minutes from now. Wait for the cron to fire (within 5 minutes of the scheduled time). Verify:
- Email arrives in the recipient inbox
- The scheduled card disappears from the detail page
- An entry appears in the activity log showing the sent email

- [ ] **Step 5: Trigger cron manually to verify auth**

```bash
curl -s -L -X POST "https://www.teeahead.com/api/cron/send-scheduled-emails" \
  -H "Authorization: Bearer 5ef44ff526493b3c32dc936ae13f62321efe549f14cae75d1897e0845daa9247"
```

Expected: `{"sent":0,"message":"Nothing due"}` (if nothing is pending)

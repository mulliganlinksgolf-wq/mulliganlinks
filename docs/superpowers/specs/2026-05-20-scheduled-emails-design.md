# Scheduled Emails Design

## Goal
Allow CRM users to compose an email and schedule it to send at a specific future time, with the ability to view and cancel pending scheduled emails before they go out.

## Architecture
New `crm_scheduled_emails` table stores pending sends. A Vercel Cron job runs every 5 minutes to dispatch due emails via Resend and write activity log entries. The composer modal gains an optional schedule toggle. Each detail page (course/outing/member) shows a cancelable list of pending scheduled emails.

## Tech Stack
Next.js App Router server actions, Supabase (PostgreSQL), Resend API, Vercel Cron

---

## Database

### Table: `crm_scheduled_emails`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, default gen_random_uuid() |
| `record_type` | text | 'course' / 'outing' / 'member' |
| `record_id` | uuid | FK to the CRM record |
| `to_email` | text | recipient address |
| `subject` | text | |
| `body_html` | text | full HTML including signature |
| `scheduled_for` | timestamptz | when to send |
| `status` | text | 'pending' / 'sent' / 'cancelled' / 'failed' |
| `created_by` | text | 'neil' or 'billy' |
| `from_email` | text | resolved sender address |
| `in_reply_to` | text | nullable, Message-ID for threading |
| `sent_at` | timestamptz | nullable, set when sent |
| `error` | text | nullable, stored on failure |
| `created_at` | timestamptz | default now() |

Index on `(status, scheduled_for)` for efficient cron queries.

---

## Components

### 1. Migration
`supabase/migrations/075_scheduled_emails.sql` — creates the table with index.

### 2. Server Action: `scheduleCrmEmail`
`src/app/actions/crm/email.ts` — new export alongside `sendCrmEmail`.
- Same `assertAdmin()` auth check
- Resolves sender, builds final HTML with signature, generates Message-ID
- Inserts row into `crm_scheduled_emails` with status='pending'
- Updates `last_activity_at` on the parent record (same as send)
- Revalidates the detail page path

### 3. Server Action: `cancelScheduledEmail`
`src/app/actions/crm/email.ts` — new export.
- Auth check
- Updates status to 'cancelled' where id matches and status='pending'
- Revalidates path

### 4. Server Action: `getScheduledEmails`
`src/app/actions/crm/email.ts` — new export.
- Returns pending scheduled emails for a given record_type + record_id
- Ordered by scheduled_for ascending

### 5. Cron Route: `/api/cron/send-scheduled-emails`
`src/app/api/cron/send-scheduled-emails/route.ts`
- Authenticated with `Authorization: Bearer CRON_SECRET`
- Queries `crm_scheduled_emails` where `status = 'pending' AND scheduled_for <= now()`
- For each row:
  - Sends via Resend with stored from_email, to_email, subject, body_html, in_reply_to
  - On success: inserts `crm_activity_log` entry (type='email'), marks row `sent`, sets `sent_at`
  - On failure: marks row `failed`, stores error message
- Returns JSON summary

### 6. `vercel.json` Cron Entry
Adds `{ "path": "/api/cron/send-scheduled-emails", "schedule": "*/5 * * * *" }` alongside existing cron entries.

### 7. EmailComposerModal UI Changes
`src/components/crm/EmailComposerModal.tsx`
- New `scheduledFor` state (Date | null), `scheduleMode` boolean
- Below the body field: a "Schedule for later" toggle (checkbox/switch)
- When on: datetime-local input appears showing Detroit timezone, Send button label changes to "Schedule Email"
- On submit in schedule mode: calls `scheduleCrmEmail` instead of `sendCrmEmail`
- On success: closes modal, calls `onSent()`

### 8. ScheduledEmailsList Component
`src/components/crm/ScheduledEmailsList.tsx` — server component.
- Props: `recordType`, `recordId`
- Fetches pending scheduled emails via `getScheduledEmails`
- Renders nothing if empty
- Shows a card per pending email: recipient, subject, scheduled time (America/Detroit), Cancel button
- Cancel button is a form action calling `cancelScheduledEmail`

### 9. Detail Page Integration
Add `<ScheduledEmailsList>` to:
- `src/app/admin/crm/courses/[id]/page.tsx`
- `src/app/admin/crm/outings/[id]/page.tsx`
- `src/app/admin/crm/members/[id]/page.tsx`

Placed above the ActivityLog section so scheduled emails are visible near the top.

---

## Error Handling
- Cron failures are stored in the `error` column; the row stays `failed` and won't be retried automatically (avoids duplicate sends)
- If Resend returns an error, the activity log entry is NOT written (no false positive in the timeline)
- Cancel only works on `pending` rows — safe to call multiple times

## Timezone
All datetime-local inputs are interpreted as America/Detroit. The UI shows scheduled times in Detroit timezone. The DB stores UTC.

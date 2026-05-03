# TeeAhead CRM — Plan 3: Advanced Features (Email, PDF, Cron, CSV, Seed)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Prerequisite:** Plans 1 and 2 must be complete. DB schema, all record types, server actions, and UI components must exist.

**Goal:** Add email sending via Resend, email template management, PDF generation via `@react-pdf/renderer` with Supabase Storage, the stale lead digest cron job, CSV export on all three tables, and seed data for email templates and document templates.

**Architecture:** Email sending is a server action that calls the Resend client and auto-logs to `crm_activity_log`. PDFs are generated in an API route (`/api/crm/generate-pdf`) using `@react-pdf/renderer`, stored in Supabase Storage bucket `crm-documents`, and the URL saved to `crm_documents`. The stale lead digest runs as a Vercel cron endpoint that sends one email to both admins. CSV export is a client-side utility that serializes table data.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4, Resend v6, `@react-pdf/renderer`, Supabase Storage, Vercel Cron

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/app/actions/crm/email.ts` | Create | Send email via Resend + log to activity |
| `src/app/actions/crm/email.test.ts` | Create | Unit tests for email action |
| `src/app/actions/crm/templates.ts` | Create | Email template CRUD server actions |
| `src/components/crm/EmailComposerModal.tsx` | Create | Rich email composer with template selector |
| `src/app/admin/crm/templates/page.tsx` | Create | Template list + CRUD management page |
| `src/lib/crm/pdf.ts` | Create | PDF generation utilities |
| `src/lib/crm/pdf-templates/FoundingPartnerAgreement.tsx` | Create | PDF template |
| `src/lib/crm/pdf-templates/CourseProposal.tsx` | Create | PDF template |
| `src/lib/crm/pdf-templates/OutingQuote.tsx` | Create | PDF template |
| `src/lib/crm/pdf-templates/OutingConfirmation.tsx` | Create | PDF template |
| `src/app/api/crm/generate-pdf/route.ts` | Create | PDF generation API route |
| `src/components/crm/GenerateDocModal.tsx` | Create | Document generation modal |
| `src/components/crm/DocumentList.tsx` | Create | List of generated documents on a record |
| `src/lib/crm/csv.ts` | Create | CSV export utilities |
| `src/app/api/crm/stale-leads/route.ts` | Create | Cron endpoint for stale lead digest email |
| `supabase/migrations/032_crm_seed.sql` | Create | Seed email templates |
| `src/app/admin/crm/courses/[id]/CourseDetailClient.tsx` | Modify | Add Send Email + Generate Doc buttons |
| `src/app/admin/crm/outings/[id]/OutingDetailClient.tsx` | Modify | Add Send Email + Generate Doc buttons |
| `src/app/admin/crm/members/[id]/MemberDetailClient.tsx` | Modify | Add Send Email button |
| `src/components/crm/CourseTable.tsx` | Modify | Wire up CSV export |
| `src/components/crm/OutingTable.tsx` | Modify | Wire up CSV export |
| `src/components/crm/MemberTable.tsx` | Modify | Wire up CSV export |

---

### Task 1: Email send server action + tests

**Files:**
- Create: `src/app/actions/crm/email.ts`
- Create: `src/app/actions/crm/email.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/app/actions/crm/email.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: 'email-1' }, error: null }),
    },
  })),
}))

const ADMIN_EMAILS = ['nbarris11@gmail.com']

describe('sendCrmEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.RESEND_API_KEY = 're_test_key'
    process.env.RESEND_FROM_EMAIL = 'crm@teeahead.com'
  })

  it('sends an email and logs the activity', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const { createAdminClient } = await import('@/lib/supabase/admin')

    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1', email: ADMIN_EMAILS[0] } } }) },
    } as never)

    const insertMock = vi.fn().mockResolvedValue({ error: null })
    const updateMock = vi.fn().mockReturnThis()
    const eqMock = vi.fn().mockResolvedValue({ error: null })
    const adminMock = {
      from: vi.fn((table: string) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null }),
        insert: insertMock,
        update: updateMock,
      })),
    }
    vi.mocked(createAdminClient).mockReturnValue(adminMock as never)

    const { sendCrmEmail } = await import('./email')
    const result = await sendCrmEmail({
      recordType: 'course',
      recordId: 'course-1',
      to: 'gm@oakhollow.com',
      subject: 'Welcome to TeeAhead',
      bodyHtml: '<p>Hello!</p>',
      sentBy: 'neil',
    })

    expect(result.error).toBeUndefined()
    expect(result.success).toBe(true)
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      type: 'email',
      record_type: 'course',
      record_id: 'course-1',
    }))
  })

  it('returns error if Resend key is placeholder', async () => {
    process.env.RESEND_API_KEY = 're_placeholder'
    const { sendCrmEmail } = await import('./email')
    const result = await sendCrmEmail({
      recordType: 'course',
      recordId: 'course-1',
      to: 'gm@oakhollow.com',
      subject: 'Test',
      bodyHtml: '<p>Test</p>',
      sentBy: 'neil',
    })
    expect(result.error).toBeDefined()
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
cd /Users/barris/Desktop/MulliganLinks && npx vitest run src/app/actions/crm/email.test.ts 2>&1 | tail -5
```

Expected: FAIL — `Cannot find module './email'`

- [ ] **Step 3: Create email server action**

```typescript
// src/app/actions/crm/email.ts
'use server'

import { getResend } from '@/lib/resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CrmRecordType } from '@/lib/crm/types'

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
    const { admin } = await assertAdmin()

    const { error: sendError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'TeeAhead CRM <crm@teeahead.com>',
      to: params.to,
      subject: params.subject,
      html: params.bodyHtml,
    })

    if (sendError) return { error: sendError.message }

    await admin.from('crm_activity_log').insert({
      record_type: params.recordType,
      record_id: params.recordId,
      type: 'email',
      body: `To: ${params.to}\nSubject: ${params.subject}`,
      created_by: params.sentBy,
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

- [ ] **Step 4: Run tests to verify passing**

```bash
npx vitest run src/app/actions/crm/email.test.ts 2>&1 | tail -5
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/actions/crm/email.ts src/app/actions/crm/email.test.ts
git commit -m "feat: CRM email send action with Resend integration"
```

---

### Task 2: Email template CRUD actions

**Files:**
- Create: `src/app/actions/crm/templates.ts`

- [ ] **Step 1: Create template actions**

```typescript
// src/app/actions/crm/templates.ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CrmRecordType } from '@/lib/crm/types'

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

export async function createEmailTemplate(
  _: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const admin = await assertAdmin()
    const { error } = await admin.from('crm_email_templates').insert({
      name: formData.get('name') as string,
      subject: formData.get('subject') as string,
      body_html: formData.get('body_html') as string,
      record_type: formData.get('record_type') as CrmRecordType,
    })
    if (error) return { error: error.message }
    revalidatePath('/admin/crm/templates')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function updateEmailTemplate(
  id: string,
  fields: { name?: string; subject?: string; body_html?: string; record_type?: CrmRecordType }
): Promise<{ error?: string; success?: boolean }> {
  try {
    const admin = await assertAdmin()
    const { error } = await admin
      .from('crm_email_templates')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/crm/templates')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function deleteEmailTemplate(id: string): Promise<{ error?: string; success?: boolean }> {
  try {
    const admin = await assertAdmin()
    const { error } = await admin.from('crm_email_templates').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/crm/templates')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/actions/crm/templates.ts
git commit -m "feat: email template CRUD actions"
```

---

### Task 3: EmailComposerModal component

**Files:**
- Create: `src/components/crm/EmailComposerModal.tsx`

- [ ] **Step 1: Create the email composer**

```typescript
// src/components/crm/EmailComposerModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { sendCrmEmail, getEmailTemplatesByType } from '@/app/actions/crm/email'
import type { CrmRecordType, CrmEmailTemplate } from '@/lib/crm/types'

interface Props {
  recordType: CrmRecordType
  recordId: string
  toEmail: string | null
  sentBy: string
  onClose: () => void
  onSent: () => void
}

export function EmailComposerModal({ recordType, recordId, toEmail, sentBy, onClose, onSent }: Props) {
  const [templates, setTemplates] = useState<CrmEmailTemplate[]>([])
  const [to, setTo] = useState(toEmail ?? '')
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    getEmailTemplatesByType(recordType).then(setTemplates)
  }, [recordType])

  function applyTemplate(template: CrmEmailTemplate) {
    setSubject(template.subject)
    setBodyHtml(template.body_html)
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!to) { setError('Recipient email is required'); return }
    setSending(true)
    setError(null)
    const result = await sendCrmEmail({ recordType, recordId, to, subject, bodyHtml, sentBy })
    setSending(false)
    if (result.error) {
      setError(result.error)
    } else {
      onSent()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Send Email</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
          </div>
        </div>

        <form onSubmit={handleSend} className="p-6 space-y-4">
          {templates.length > 0 && (
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">Template</label>
              <select
                defaultValue=""
                onChange={(e) => {
                  const t = templates.find((t) => t.id === e.target.value)
                  if (t) applyTemplate(t)
                }}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              >
                <option value="">Select a template…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">To *</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Body *</label>
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                className="text-xs text-emerald-600 hover:underline"
              >
                {showPreview ? 'Edit' : 'Preview'}
              </button>
            </div>
            {showPreview ? (
              <div
                className="w-full min-h-48 text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />
            ) : (
              <textarea
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                required
                rows={8}
                placeholder="HTML email body…"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none font-mono text-xs"
              />
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="text-sm px-4 py-2 text-slate-500 hover:text-slate-700">
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="text-sm px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Send Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/crm/EmailComposerModal.tsx
git commit -m "feat: email composer modal with template selector and preview"
```

---

### Task 4: Add Send Email button to all detail pages

**Files:**
- Modify: `src/app/admin/crm/courses/[id]/CourseDetailClient.tsx`
- Modify: `src/app/admin/crm/outings/[id]/OutingDetailClient.tsx`
- Modify: `src/app/admin/crm/members/[id]/MemberDetailClient.tsx`

- [ ] **Step 1: Add email button to CourseDetailClient**

In `src/app/admin/crm/courses/[id]/CourseDetailClient.tsx`:

1. Add import: `import { EmailComposerModal } from '@/components/crm/EmailComposerModal'`
2. Add state: `const [showEmailModal, setShowEmailModal] = useState(false)`
3. Add button in the actions row next to "Log Activity":
```typescript
<button
  onClick={() => setShowEmailModal(true)}
  className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
>
  Send Email
</button>
```
4. Add modal after the `LogActivityModal` block:
```typescript
{showEmailModal && (
  <EmailComposerModal
    recordType="course"
    recordId={course.id}
    toEmail={course.contact_email}
    sentBy={course.assigned_to ?? 'neil'}
    onClose={() => setShowEmailModal(false)}
    onSent={() => router.refresh()}
  />
)}
```

- [ ] **Step 2: Add email button to OutingDetailClient**

Same pattern in `src/app/admin/crm/outings/[id]/OutingDetailClient.tsx`:

1. Add import: `import { EmailComposerModal } from '@/components/crm/EmailComposerModal'`
2. Add state: `const [showEmailModal, setShowEmailModal] = useState(false)`
3. Add button: `<button onClick={() => setShowEmailModal(true)} ...>Send Email</button>`
4. Add modal:
```typescript
{showEmailModal && (
  <EmailComposerModal
    recordType="outing"
    recordId={outing.id}
    toEmail={outing.contact_email}
    sentBy={outing.assigned_to ?? 'neil'}
    onClose={() => setShowEmailModal(false)}
    onSent={() => router.refresh()}
  />
)}
```

- [ ] **Step 3: Add email button to MemberDetailClient**

Same pattern in `src/app/admin/crm/members/[id]/MemberDetailClient.tsx`:

1. Add import: `import { EmailComposerModal } from '@/components/crm/EmailComposerModal'`
2. Add state: `const [showEmailModal, setShowEmailModal] = useState(false)`
3. Add button: `<button onClick={() => setShowEmailModal(true)} ...>Send Email</button>`
4. Add modal:
```typescript
{showEmailModal && (
  <EmailComposerModal
    recordType="member"
    recordId={member.id}
    toEmail={member.email}
    sentBy="neil"
    onClose={() => setShowEmailModal(false)}
    onSent={() => router.refresh()}
  />
)}
```

- [ ] **Step 4: Compile check**

```bash
npx tsc --noEmit 2>&1 | grep -E "EmailComposer|Detail" | head -10
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/crm/courses/[id]/CourseDetailClient.tsx src/app/admin/crm/outings/[id]/OutingDetailClient.tsx src/app/admin/crm/members/[id]/MemberDetailClient.tsx
git commit -m "feat: add Send Email button to all CRM detail pages"
```

---

### Task 5: Email templates management page

**Files:**
- Create: `src/app/admin/crm/templates/page.tsx`

- [ ] **Step 1: Create the templates management page**

```typescript
// src/app/admin/crm/templates/page.tsx
import { createAdminClient } from '@/lib/supabase/admin'
import { TemplatesClient } from './TemplatesClient'

export const dynamic = 'force-dynamic'

export default async function TemplatesPage() {
  const supabase = createAdminClient()
  const { data: templates } = await supabase
    .from('crm_email_templates')
    .select('*')
    .order('record_type', { ascending: true })

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Email Templates</h1>
      </div>
      <TemplatesClient initialTemplates={templates ?? []} />
    </div>
  )
}
```

- [ ] **Step 2: Create the client component for template CRUD**

Create `src/app/admin/crm/templates/TemplatesClient.tsx`:

```typescript
// src/app/admin/crm/templates/TemplatesClient.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
} from '@/app/actions/crm/templates'
import type { CrmEmailTemplate, CrmRecordType } from '@/lib/crm/types'

const RECORD_TYPES: CrmRecordType[] = ['course', 'outing', 'member']
const typeColors: Record<CrmRecordType, string> = {
  course: 'bg-blue-100 text-blue-700',
  outing: 'bg-amber-100 text-amber-700',
  member: 'bg-emerald-100 text-emerald-700',
}

interface Props {
  initialTemplates: CrmEmailTemplate[]
}

export function TemplatesClient({ initialTemplates }: Props) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const router = useRouter()

  // New template form state
  const [newName, setNewName] = useState('')
  const [newSubject, setNewSubject] = useState('')
  const [newBody, setNewBody] = useState('')
  const [newRecordType, setNewRecordType] = useState<CrmRecordType>('course')
  const [saving, setSaving] = useState(false)

  // Edit state
  const [editFields, setEditFields] = useState<Partial<CrmEmailTemplate>>({})

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    const fd = new FormData()
    fd.set('name', newName)
    fd.set('subject', newSubject)
    fd.set('body_html', newBody)
    fd.set('record_type', newRecordType)
    const result = await createEmailTemplate({}, fd)
    setSaving(false)
    if (result.error) { setFormError(result.error); return }
    setCreating(false)
    setNewName(''); setNewSubject(''); setNewBody(''); setNewRecordType('course')
    router.refresh()
  }

  async function handleUpdate(id: string) {
    setSaving(true)
    const result = await updateEmailTemplate(id, editFields)
    setSaving(false)
    if (result.error) { setFormError(result.error); return }
    setEditingId(null)
    setEditFields({})
    router.refresh()
  }

  async function handleDelete(id: string) {
    await deleteEmailTemplate(id)
    setDeleteConfirmId(null)
    router.refresh()
  }

  function startEdit(template: CrmEmailTemplate) {
    setEditingId(template.id)
    setEditFields({ name: template.name, subject: template.subject, body_html: template.body_html, record_type: template.record_type })
  }

  const grouped = RECORD_TYPES.reduce((acc, rt) => {
    acc[rt] = templates.filter((t) => t.record_type === rt)
    return acc
  }, {} as Record<CrmRecordType, CrmEmailTemplate[]>)

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setCreating(true)}
          className="px-3 py-1.5 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800"
        >
          + New Template
        </button>
      </div>

      {creating && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">New Template</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Name</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} required className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Record Type</label>
                <select value={newRecordType} onChange={(e) => setNewRecordType(e.target.value as CrmRecordType)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300">
                  {RECORD_TYPES.map((rt) => <option key={rt} value={rt}>{rt}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Subject</label>
                <input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} required className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Body (HTML)</label>
                <textarea value={newBody} onChange={(e) => setNewBody(e.target.value)} required rows={6} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none font-mono text-xs" />
              </div>
            </div>
            {formError && <p className="text-sm text-red-500">{formError}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-emerald-700 text-white text-sm rounded-lg hover:bg-emerald-800 disabled:opacity-50">{saving ? 'Creating…' : 'Create'}</button>
              <button type="button" onClick={() => setCreating(false)} className="px-4 py-2 text-slate-500 text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {RECORD_TYPES.map((rt) => (
        <div key={rt}>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 capitalize">{rt} Templates</h2>
          {grouped[rt].length === 0 ? (
            <p className="text-sm text-slate-400 mb-4">No {rt} templates yet.</p>
          ) : (
            <div className="space-y-3">
              {grouped[rt].map((template) => (
                <div key={template.id} className="bg-white rounded-xl border border-slate-200 p-4">
                  {editingId === template.id ? (
                    <div className="space-y-3">
                      <input value={editFields.name ?? ''} onChange={(e) => setEditFields((p) => ({ ...p, name: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300 font-medium" />
                      <input value={editFields.subject ?? ''} onChange={(e) => setEditFields((p) => ({ ...p, subject: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300" placeholder="Subject" />
                      <textarea value={editFields.body_html ?? ''} onChange={(e) => setEditFields((p) => ({ ...p, body_html: e.target.value }))} rows={6} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none font-mono text-xs" />
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdate(template.id)} disabled={saving} className="px-3 py-1.5 bg-emerald-700 text-white text-xs rounded-lg hover:bg-emerald-800 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-slate-500 text-xs">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <span className="font-medium text-slate-800 text-sm">{template.name}</span>
                          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full capitalize ${typeColors[template.record_type]}`}>{template.record_type}</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => startEdit(template)} className="text-xs text-slate-500 hover:text-slate-700">Edit</button>
                          <button onClick={() => setDeleteConfirmId(template.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">Subject: {template.subject}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold text-slate-800 mb-2">Delete this template?</h3>
            <p className="text-sm text-slate-500 mb-4">This cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirmId(null)} className="text-sm px-4 py-2 text-slate-500">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirmId)} className="text-sm px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/crm/templates/
git commit -m "feat: email templates management page"
```

---

### Task 6: PDF generation — templates and API route

**Files:**
- Create: `src/lib/crm/pdf-templates/FoundingPartnerAgreement.tsx`
- Create: `src/lib/crm/pdf-templates/CourseProposal.tsx`
- Create: `src/lib/crm/pdf-templates/OutingQuote.tsx`
- Create: `src/lib/crm/pdf-templates/OutingConfirmation.tsx`
- Create: `src/app/api/crm/generate-pdf/route.ts`

- [ ] **Step 1: FoundingPartnerAgreement PDF template**

```typescript
// src/lib/crm/pdf-templates/FoundingPartnerAgreement.tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { CrmCourse } from '@/lib/crm/types'

const styles = StyleSheet.create({
  page: { padding: 60, fontFamily: 'Helvetica', fontSize: 11, color: '#1a1a1a' },
  header: { marginBottom: 32 },
  brandName: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#1B4332', marginBottom: 4 },
  docTitle: { fontSize: 16, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  subtitle: { fontSize: 10, color: '#6B7770' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 8, color: '#1B4332', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 4 },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 140, fontFamily: 'Helvetica-Bold', color: '#6B7770' },
  value: { flex: 1 },
  body: { lineHeight: 1.6, marginBottom: 8 },
  signatureBlock: { marginTop: 40, flexDirection: 'row', gap: 40 },
  signatureLine: { flex: 1, borderTopWidth: 1, borderTopColor: '#1a1a1a', paddingTop: 6 },
  signatureLabel: { fontSize: 9, color: '#6B7770' },
  footer: { position: 'absolute', bottom: 40, left: 60, right: 60, textAlign: 'center', fontSize: 9, color: '#9CA3AF' },
})

interface Props {
  course: CrmCourse
  generatedAt: string
}

export function FoundingPartnerAgreementPDF({ course, generatedAt }: Props) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brandName}>TeeAhead</Text>
          <Text style={styles.docTitle}>Founding Partner Agreement</Text>
          <Text style={styles.subtitle}>Generated {new Date(generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Course Information</Text>
          <View style={styles.row}><Text style={styles.label}>Course Name:</Text><Text style={styles.value}>{course.name}</Text></View>
          {course.city && <View style={styles.row}><Text style={styles.label}>Location:</Text><Text style={styles.value}>{[course.city, course.state].filter(Boolean).join(', ')}</Text></View>}
          {course.contact_name && <View style={styles.row}><Text style={styles.label}>Contact:</Text><Text style={styles.value}>{course.contact_name}</Text></View>}
          {course.contact_email && <View style={styles.row}><Text style={styles.label}>Email:</Text><Text style={styles.value}>{course.contact_email}</Text></View>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Founding Partner Terms</Text>
          <Text style={styles.body}>
            This Founding Partner Agreement ("Agreement") is entered into between TeeAhead, LLC ("TeeAhead") and the course identified above ("Partner Course").
          </Text>
          <Text style={styles.body}>
            As a TeeAhead Founding Partner, the Partner Course agrees to: (1) Honor TeeAhead membership benefits for qualifying members at the rates described in the current benefit schedule; (2) Provide accurate tee time availability to the TeeAhead platform; (3) Collaborate on joint marketing initiatives to grow the local golf community.
          </Text>
          <Text style={styles.body}>
            TeeAhead agrees to: (1) List the Partner Course on the TeeAhead platform at no cost during the Founding Partner period; (2) Drive qualified member traffic and bookings to the Partner Course; (3) Provide monthly reports on member activity and bookings.
          </Text>
          <Text style={styles.body}>
            This agreement is valid for a period of twelve (12) months from the date of signing and may be renewed by mutual written consent.
          </Text>
        </View>

        <View style={[styles.signatureBlock, { marginTop: 48 }]}>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureLabel}>Authorized Signature — {course.name}</Text>
            <Text style={{ marginTop: 32, color: '#9CA3AF', fontSize: 9 }}>Print name & title:</Text>
            <View style={{ marginTop: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }} />
            <Text style={[styles.signatureLabel, { marginTop: 4 }]}>Date:</Text>
          </View>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureLabel}>Authorized Signature — TeeAhead</Text>
            <Text style={{ marginTop: 32, color: '#9CA3AF', fontSize: 9 }}>Neil Barris, Co-Founder</Text>
            <View style={{ marginTop: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }} />
            <Text style={[styles.signatureLabel, { marginTop: 4 }]}>Date:</Text>
          </View>
        </View>

        <Text style={styles.footer}>TeeAhead, LLC · teeahead.com · Confidential</Text>
      </Page>
    </Document>
  )
}
```

- [ ] **Step 2: CourseProposal PDF template**

```typescript
// src/lib/crm/pdf-templates/CourseProposal.tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { CrmCourse } from '@/lib/crm/types'

const styles = StyleSheet.create({
  page: { padding: 60, fontFamily: 'Helvetica', fontSize: 11, color: '#1a1a1a' },
  brandName: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#1B4332', marginBottom: 4 },
  tagline: { fontSize: 11, color: '#6B7770', marginBottom: 32 },
  docTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  addressee: { fontSize: 12, color: '#6B7770', marginBottom: 24 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 8, color: '#1B4332' },
  bullet: { flexDirection: 'row', marginBottom: 6 },
  bulletDot: { width: 16, color: '#E0A800', fontFamily: 'Helvetica-Bold' },
  bulletText: { flex: 1, lineHeight: 1.5 },
  highlight: { backgroundColor: '#F0FDF4', padding: 12, borderRadius: 4, marginTop: 16 },
  highlightText: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#1B4332', textAlign: 'center' },
  footer: { position: 'absolute', bottom: 40, left: 60, right: 60, textAlign: 'center', fontSize: 9, color: '#9CA3AF' },
})

interface Props { course: CrmCourse }

export function CourseProposalPDF({ course }: Props) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.brandName}>TeeAhead</Text>
        <Text style={styles.tagline}>Detroit's Local Golf Loyalty Network</Text>
        <Text style={styles.docTitle}>Partnership Proposal</Text>
        <Text style={styles.addressee}>Prepared for: {course.contact_name ?? 'Golf Course Management'} at {course.name}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What is TeeAhead?</Text>
          <Text style={{ lineHeight: 1.6, marginBottom: 8 }}>
            TeeAhead is a local-first golf loyalty platform connecting metro Detroit golfers with their favorite courses. Members pay a monthly subscription and receive exclusive benefits — discounted rounds, tee time priority, and barter credits — at our network of partner courses.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Partner with TeeAhead?</Text>
          {[
            'Zero cost to your course — no upfront fees, no technology investment',
            'Drive incremental rounds from our growing member base',
            'Increase off-peak utilization with targeted member offers',
            'Data on member usage patterns to help optimize your tee sheet',
            'Co-marketing through TeeAhead digital channels and email list',
          ].map((point, i) => (
            <View key={i} style={styles.bullet}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{point}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Founding Partner Benefits</Text>
          {[
            'Founding Partner badge on your TeeAhead listing — permanent recognition',
            'Priority placement in member search and recommendations',
            'Locked-in terms for the first 12 months — no surprise changes',
            'Direct line to TeeAhead founders for feedback and collaboration',
          ].map((point, i) => (
            <View key={i} style={styles.bullet}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{point}</Text>
            </View>
          ))}
        </View>

        <View style={styles.highlight}>
          <Text style={styles.highlightText}>No commitment required to get started.</Text>
          <Text style={{ textAlign: 'center', fontSize: 10, color: '#4B7C61', marginTop: 4 }}>
            Schedule a 20-minute demo and see the platform in action.
          </Text>
        </View>

        <Text style={styles.footer}>TeeAhead, LLC · teeahead.com · {new Date().getFullYear()}</Text>
      </Page>
    </Document>
  )
}
```

- [ ] **Step 3: OutingQuote PDF template**

```typescript
// src/lib/crm/pdf-templates/OutingQuote.tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { CrmOuting } from '@/lib/crm/types'

const styles = StyleSheet.create({
  page: { padding: 60, fontFamily: 'Helvetica', fontSize: 11, color: '#1a1a1a' },
  header: { marginBottom: 32 },
  brandName: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#1B4332', marginBottom: 4 },
  docTitle: { fontSize: 16, fontFamily: 'Helvetica-Bold' },
  date: { fontSize: 10, color: '#6B7770', marginTop: 2 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 8, color: '#1B4332', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 4 },
  row: { flexDirection: 'row', marginBottom: 6 },
  label: { width: 160, fontFamily: 'Helvetica-Bold', color: '#6B7770' },
  value: { flex: 1 },
  totalRow: { flexDirection: 'row', backgroundColor: '#F0FDF4', padding: 10, borderRadius: 4, marginTop: 8 },
  totalLabel: { flex: 1, fontFamily: 'Helvetica-Bold', fontSize: 13, color: '#1B4332' },
  totalValue: { fontFamily: 'Helvetica-Bold', fontSize: 13, color: '#1B4332' },
  footer: { position: 'absolute', bottom: 40, left: 60, right: 60, textAlign: 'center', fontSize: 9, color: '#9CA3AF' },
})

interface Props { outing: CrmOuting }

export function OutingQuotePDF({ outing }: Props) {
  const eventDateFormatted = outing.event_date
    ? new Date(outing.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : 'TBD'

  const perPersonCost = outing.budget_estimate && outing.num_golfers
    ? (outing.budget_estimate / outing.num_golfers).toFixed(2)
    : null

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brandName}>TeeAhead</Text>
          <Text style={styles.docTitle}>Outing Quote</Text>
          <Text style={styles.date}>Prepared {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Event Details</Text>
          <View style={styles.row}><Text style={styles.label}>Organizer:</Text><Text style={styles.value}>{outing.contact_name}</Text></View>
          {outing.contact_email && <View style={styles.row}><Text style={styles.label}>Email:</Text><Text style={styles.value}>{outing.contact_email}</Text></View>}
          {outing.contact_phone && <View style={styles.row}><Text style={styles.label}>Phone:</Text><Text style={styles.value}>{outing.contact_phone}</Text></View>}
          <View style={styles.row}><Text style={styles.label}>Event Date:</Text><Text style={styles.value}>{eventDateFormatted}</Text></View>
          {outing.preferred_course && <View style={styles.row}><Text style={styles.label}>Preferred Course:</Text><Text style={styles.value}>{outing.preferred_course}</Text></View>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          {outing.num_golfers != null && <View style={styles.row}><Text style={styles.label}>Number of Golfers:</Text><Text style={styles.value}>{outing.num_golfers}</Text></View>}
          {perPersonCost && <View style={styles.row}><Text style={styles.label}>Estimated Per Person:</Text><Text style={styles.value}>${perPersonCost}</Text></View>}
          {outing.budget_estimate != null && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Estimate</Text>
              <Text style={styles.totalValue}>${outing.budget_estimate.toLocaleString()}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Steps</Text>
          <Text style={{ lineHeight: 1.6 }}>
            To confirm your outing, please reply to this quote or contact your TeeAhead representative. A 50% deposit is due upon booking confirmation. Final headcount should be confirmed no later than 7 days before the event.
          </Text>
        </View>

        <Text style={styles.footer}>TeeAhead, LLC · teeahead.com · Questions? Email hello@teeahead.com</Text>
      </Page>
    </Document>
  )
}
```

- [ ] **Step 4: OutingConfirmation PDF template**

```typescript
// src/lib/crm/pdf-templates/OutingConfirmation.tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { CrmOuting } from '@/lib/crm/types'

const styles = StyleSheet.create({
  page: { padding: 60, fontFamily: 'Helvetica', fontSize: 11, color: '#1a1a1a' },
  brandName: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#1B4332', marginBottom: 4 },
  banner: { backgroundColor: '#1B4332', color: 'white', padding: 16, borderRadius: 6, marginBottom: 28 },
  bannerTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: 'white', marginBottom: 2 },
  bannerSub: { fontSize: 10, color: '#A7C4B5' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 8, color: '#1B4332' },
  row: { flexDirection: 'row', marginBottom: 6 },
  label: { width: 160, fontFamily: 'Helvetica-Bold', color: '#6B7770' },
  value: { flex: 1 },
  bullet: { flexDirection: 'row', marginBottom: 5 },
  bulletDot: { width: 14, color: '#E0A800', fontFamily: 'Helvetica-Bold' },
  bulletText: { flex: 1 },
  footer: { position: 'absolute', bottom: 40, left: 60, right: 60, textAlign: 'center', fontSize: 9, color: '#9CA3AF' },
})

interface Props { outing: CrmOuting }

export function OutingConfirmationPDF({ outing }: Props) {
  const eventDateFormatted = outing.event_date
    ? new Date(outing.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : 'TBD'

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.brandName}>TeeAhead</Text>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Your Outing is Confirmed!</Text>
          <Text style={styles.bannerSub}>We look forward to seeing you on the course.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Event Summary</Text>
          <View style={styles.row}><Text style={styles.label}>Organizer:</Text><Text style={styles.value}>{outing.contact_name}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Event Date:</Text><Text style={styles.value}>{eventDateFormatted}</Text></View>
          {outing.preferred_course && <View style={styles.row}><Text style={styles.label}>Course:</Text><Text style={styles.value}>{outing.preferred_course}</Text></View>}
          {outing.num_golfers != null && <View style={styles.row}><Text style={styles.label}>Golfers:</Text><Text style={styles.value}>{outing.num_golfers}</Text></View>}
          {outing.budget_estimate != null && <View style={styles.row}><Text style={styles.label}>Total Amount:</Text><Text style={styles.value}>${outing.budget_estimate.toLocaleString()}</Text></View>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Steps</Text>
          {[
            'Confirm final headcount 7 days before the event',
            'Remaining balance due at event check-in',
            'Any special requests should be submitted 48 hours prior',
            'Contact your TeeAhead rep for any questions or changes',
          ].map((step, i) => (
            <View key={i} style={styles.bullet}>
              <Text style={styles.bulletDot}>{i + 1}.</Text>
              <Text style={styles.bulletText}>{step}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>TeeAhead, LLC · teeahead.com · Questions? hello@teeahead.com</Text>
      </Page>
    </Document>
  )
}
```

- [ ] **Step 5: PDF generation API route**

```typescript
// src/app/api/crm/generate-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { FoundingPartnerAgreementPDF } from '@/lib/crm/pdf-templates/FoundingPartnerAgreement'
import { CourseProposalPDF } from '@/lib/crm/pdf-templates/CourseProposal'
import { OutingQuotePDF } from '@/lib/crm/pdf-templates/OutingQuote'
import { OutingConfirmationPDF } from '@/lib/crm/pdf-templates/OutingConfirmation'

const ADMIN_EMAILS = ['mulliganlinksgolf@gmail.com', 'nbarris11@gmail.com', 'beslock@yahoo.com']

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!ADMIN_EMAILS.includes(user.email ?? '') && !profile?.is_admin) return null
  return { admin, user }
}

export async function POST(req: NextRequest) {
  const auth = await assertAdmin()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { admin, user } = auth

  const body = await req.json() as {
    template: string
    recordType: 'course' | 'outing'
    recordId: string
    createdBy: string
  }

  // Fetch the record
  const table = body.recordType === 'course' ? 'crm_courses' : 'crm_outings'
  const { data: record, error: recordError } = await admin.from(table).select('*').eq('id', body.recordId).single()
  if (recordError || !record) {
    return NextResponse.json({ error: 'Record not found' }, { status: 404 })
  }

  // Build the PDF element based on template
  let element: React.ReactElement
  let docName: string

  switch (body.template) {
    case 'founding-partner-agreement':
      element = createElement(FoundingPartnerAgreementPDF, { course: record, generatedAt: new Date().toISOString() })
      docName = `Founding Partner Agreement — ${record.name}`
      break
    case 'course-proposal':
      element = createElement(CourseProposalPDF, { course: record })
      docName = `Course Proposal — ${record.name}`
      break
    case 'outing-quote':
      element = createElement(OutingQuotePDF, { outing: record })
      docName = `Outing Quote — ${record.contact_name}`
      break
    case 'outing-confirmation':
      element = createElement(OutingConfirmationPDF, { outing: record })
      docName = `Outing Confirmation — ${record.contact_name}`
      break
    default:
      return NextResponse.json({ error: 'Unknown template' }, { status: 400 })
  }

  // Generate PDF buffer
  const pdfBuffer = await renderToBuffer(element)

  // Upload to Supabase Storage
  const filename = `${body.recordType}/${body.recordId}/${Date.now()}-${body.template}.pdf`
  const { error: uploadError } = await admin.storage
    .from('crm-documents')
    .upload(filename, pdfBuffer, { contentType: 'application/pdf', upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
  }

  // Get public URL
  const { data: urlData } = admin.storage.from('crm-documents').getPublicUrl(filename)
  const fileUrl = urlData.publicUrl

  // Save to crm_documents
  const { data: doc, error: docError } = await admin.from('crm_documents').insert({
    record_type: body.recordType,
    record_id: body.recordId,
    name: docName,
    type: body.template.includes('agreement') || body.template.includes('confirmation') ? 'contract' : 'proposal',
    file_url: fileUrl,
    created_by: body.createdBy,
  }).select('id, file_url').single()

  if (docError) {
    return NextResponse.json({ error: docError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, documentId: doc.id, fileUrl: doc.file_url })
}
```

- [ ] **Step 6: Create Supabase Storage bucket for CRM documents**

Run this via the Supabase CLI:

```bash
npx supabase storage create-bucket crm-documents --public 2>/dev/null || echo "Bucket may already exist or use Supabase dashboard to create it"
```

Alternatively, create the bucket via the Supabase dashboard:
- Go to Storage → New bucket
- Name: `crm-documents`
- Public: Yes (so generated PDFs have accessible URLs)

- [ ] **Step 7: Compile check**

```bash
npx tsc --noEmit 2>&1 | grep -E "pdf|generate-pdf" | head -10
```

Expected: no TypeScript errors.

- [ ] **Step 8: Commit**

```bash
git add src/lib/crm/pdf-templates/ src/app/api/crm/generate-pdf/
git commit -m "feat: PDF generation API route with 4 document templates"
```

---

### Task 7: GenerateDocModal and DocumentList components

**Files:**
- Create: `src/components/crm/GenerateDocModal.tsx`
- Create: `src/components/crm/DocumentList.tsx`

- [ ] **Step 1: DocumentList component**

```typescript
// src/components/crm/DocumentList.tsx
import type { CrmDocument } from '@/lib/crm/types'
import { createAdminClient } from '@/lib/supabase/admin'

interface Props {
  recordType: 'course' | 'outing'
  recordId: string
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  }).format(new Date(iso))
}

export async function DocumentList({ recordType, recordId }: Props) {
  const supabase = createAdminClient()
  const { data: docs } = await supabase
    .from('crm_documents')
    .select('*')
    .eq('record_type', recordType)
    .eq('record_id', recordId)
    .order('generated_at', { ascending: false })

  if (!docs || docs.length === 0) {
    return <p className="text-sm text-slate-400">No documents generated yet.</p>
  }

  return (
    <ul className="space-y-2">
      {docs.map((doc: CrmDocument) => (
        <li key={doc.id} className="flex items-center gap-2 text-sm">
          <span className="text-slate-400">📄</span>
          <span className="flex-1 text-slate-700">{doc.name}</span>
          <span className="text-xs text-slate-400">{formatDate(doc.generated_at)}</span>
          {doc.file_url && (
            <a
              href={doc.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-600 hover:underline"
            >
              Download
            </a>
          )}
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 2: GenerateDocModal component**

```typescript
// src/components/crm/GenerateDocModal.tsx
'use client'

import { useState } from 'react'

interface DocTemplate {
  id: string
  label: string
  description: string
}

const COURSE_TEMPLATES: DocTemplate[] = [
  { id: 'founding-partner-agreement', label: 'Founding Partner Agreement', description: 'Agreement terms, obligations, signature block' },
  { id: 'course-proposal', label: 'Course Proposal', description: 'TeeAhead pitch, platform features, zero commitment' },
]

const OUTING_TEMPLATES: DocTemplate[] = [
  { id: 'outing-quote', label: 'Outing Quote', description: 'Event details, player count, pricing' },
  { id: 'outing-confirmation', label: 'Outing Confirmation', description: 'Confirmed event summary, next steps' },
]

interface Props {
  recordType: 'course' | 'outing'
  recordId: string
  createdBy: string
  onClose: () => void
  onGenerated: () => void
}

export function GenerateDocModal({ recordType, recordId, createdBy, onClose, onGenerated }: Props) {
  const templates = recordType === 'course' ? COURSE_TEMPLATES : OUTING_TEMPLATES
  const [selected, setSelected] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  async function handleGenerate() {
    if (!selected) return
    setGenerating(true)
    setError(null)

    try {
      const res = await fetch('/api/crm/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: selected, recordType, recordId, createdBy }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error ?? 'Generation failed')
      } else {
        setDownloadUrl(data.fileUrl)
        onGenerated()
      }
    } catch (e) {
      setError('Network error')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Generate Document</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>

        {downloadUrl ? (
          <div className="text-center space-y-4 py-4">
            <div className="text-4xl">✅</div>
            <p className="font-medium text-slate-800">Document generated!</p>
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-2 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800"
            >
              Download PDF
            </a>
            <br />
            <button onClick={onClose} className="text-sm text-slate-400 hover:text-slate-600">Close</button>
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-6">
              {templates.map((t) => (
                <label
                  key={t.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors
                    ${selected === t.id ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <input
                    type="radio"
                    name="template"
                    value={t.id}
                    checked={selected === t.id}
                    onChange={() => setSelected(t.id)}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="font-medium text-slate-800 text-sm">{t.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{t.description}</div>
                  </div>
                </label>
              ))}
            </div>

            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

            <div className="flex gap-2 justify-end">
              <button onClick={onClose} className="text-sm px-4 py-2 text-slate-500 hover:text-slate-700">Cancel</button>
              <button
                onClick={handleGenerate}
                disabled={!selected || generating}
                className="text-sm px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 disabled:opacity-50"
              >
                {generating ? 'Generating…' : 'Generate PDF'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Wire Generate Document button into course and outing detail pages**

In `src/app/admin/crm/courses/[id]/CourseDetailClient.tsx`:
1. Add import: `import { GenerateDocModal } from '@/components/crm/GenerateDocModal'`
2. Add state: `const [showDocModal, setShowDocModal] = useState(false)`
3. Add button: `<button onClick={() => setShowDocModal(true)} ...>Generate Doc</button>`
4. Add modal:
```typescript
{showDocModal && (
  <GenerateDocModal
    recordType="course"
    recordId={course.id}
    createdBy={course.assigned_to ?? 'neil'}
    onClose={() => setShowDocModal(false)}
    onGenerated={() => router.refresh()}
  />
)}
```

Repeat for `OutingDetailClient.tsx` with `recordType="outing"`.

In `src/app/admin/crm/courses/[id]/page.tsx` and `src/app/admin/crm/outings/[id]/page.tsx`, add a `<Suspense>` wrapped `<DocumentList>` in the right sidebar panel:
```typescript
import { Suspense } from 'react'
import { DocumentList } from '@/components/crm/DocumentList'

// In the sidebar area:
<div className="bg-white rounded-xl border border-slate-200 p-5 mt-4">
  <h3 className="font-semibold text-slate-800 mb-4 text-sm uppercase tracking-wide">Documents</h3>
  <Suspense fallback={<p className="text-xs text-slate-400">Loading…</p>}>
    <DocumentList recordType="course" recordId={id} />
  </Suspense>
</div>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/crm/GenerateDocModal.tsx src/components/crm/DocumentList.tsx src/app/admin/crm/courses/[id]/ src/app/admin/crm/outings/[id]/
git commit -m "feat: PDF generate modal and document list on course/outing detail pages"
```

---

### Task 8: Stale lead cron endpoint

**Files:**
- Create: `src/app/api/crm/stale-leads/route.ts`

- [ ] **Step 1: Create the cron endpoint**

```typescript
// src/app/api/crm/stale-leads/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getResend } from '@/lib/resend'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  // Protect with CRON_SECRET header (set in Vercel env + vercel.json)
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const staleDays = parseInt(process.env.STALE_LEAD_DAYS ?? '7', 10)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - staleDays)
  const cutoffIso = cutoff.toISOString()

  const supabase = createAdminClient()
  const [{ data: staleCourses }, { data: staleOutings }] = await Promise.all([
    supabase
      .from('crm_courses')
      .select('id, name, stage, last_activity_at, assigned_to, contact_name')
      .lt('last_activity_at', cutoffIso)
      .not('stage', 'in', '("partner","churned")')
      .order('last_activity_at', { ascending: true }),
    supabase
      .from('crm_outings')
      .select('id, contact_name, status, last_activity_at, assigned_to')
      .lt('last_activity_at', cutoffIso)
      .not('status', 'in', '("completed","cancelled")')
      .order('last_activity_at', { ascending: true }),
  ])

  const total = (staleCourses?.length ?? 0) + (staleOutings?.length ?? 0)
  if (total === 0) {
    return NextResponse.json({ message: 'No stale leads. Nothing to send.' })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://teeahead.com'

  function daysAgo(iso: string) {
    return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <h1 style="color: #1B4332; font-size: 20px; margin-bottom: 8px;">TeeAhead CRM — Stale Lead Digest</h1>
      <p style="color: #6B7770; font-size: 14px; margin-bottom: 24px;">
        ${total} lead${total !== 1 ? 's' : ''} with no activity in ${staleDays}+ days.
      </p>

      ${staleCourses && staleCourses.length > 0 ? `
        <h2 style="font-size: 16px; margin-bottom: 12px;">🏌️ Courses (${staleCourses.length})</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <thead>
            <tr style="background: #f1f5f9; font-size: 12px; text-transform: uppercase; color: #64748b;">
              <th style="text-align: left; padding: 8px 12px;">Course</th>
              <th style="text-align: left; padding: 8px 12px;">Stage</th>
              <th style="text-align: left; padding: 8px 12px;">Assigned</th>
              <th style="text-align: left; padding: 8px 12px;">Last Activity</th>
            </tr>
          </thead>
          <tbody>
            ${staleCourses.map((c) => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 12px;">
                  <a href="${appUrl}/admin/crm/courses/${c.id}" style="color: #1B4332; font-weight: 600;">${c.name}</a>
                  ${c.contact_name ? `<br><span style="font-size: 12px; color: #94a3b8;">${c.contact_name}</span>` : ''}
                </td>
                <td style="padding: 8px 12px; text-transform: capitalize; font-size: 13px;">${c.stage}</td>
                <td style="padding: 8px 12px; text-transform: capitalize; font-size: 13px;">${c.assigned_to ?? '—'}</td>
                <td style="padding: 8px 12px; font-size: 13px; color: #dc2626;">${daysAgo(c.last_activity_at)}d ago</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}

      ${staleOutings && staleOutings.length > 0 ? `
        <h2 style="font-size: 16px; margin-bottom: 12px;">📅 Outings (${staleOutings.length})</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <thead>
            <tr style="background: #f1f5f9; font-size: 12px; text-transform: uppercase; color: #64748b;">
              <th style="text-align: left; padding: 8px 12px;">Contact</th>
              <th style="text-align: left; padding: 8px 12px;">Status</th>
              <th style="text-align: left; padding: 8px 12px;">Assigned</th>
              <th style="text-align: left; padding: 8px 12px;">Last Activity</th>
            </tr>
          </thead>
          <tbody>
            ${staleOutings.map((o) => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 12px;">
                  <a href="${appUrl}/admin/crm/outings/${o.id}" style="color: #1B4332; font-weight: 600;">${o.contact_name}</a>
                </td>
                <td style="padding: 8px 12px; text-transform: capitalize; font-size: 13px;">${o.status}</td>
                <td style="padding: 8px 12px; text-transform: capitalize; font-size: 13px;">${o.assigned_to ?? '—'}</td>
                <td style="padding: 8px 12px; font-size: 13px; color: #dc2626;">${daysAgo(o.last_activity_at)}d ago</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}

      <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">
        Sent by TeeAhead CRM · <a href="${appUrl}/admin/crm" style="color: #1B4332;">Open CRM Dashboard</a>
      </p>
    </div>
  `

  const resend = getResend()
  if (!resend) {
    return NextResponse.json({ message: `Skipped — no Resend key. Would have sent digest for ${total} stale leads.` })
  }

  const recipients = [
    process.env.ADMIN_EMAIL_NEIL,
    process.env.ADMIN_EMAIL_BILLY,
  ].filter(Boolean) as string[]

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'TeeAhead CRM <crm@teeahead.com>',
    to: recipients,
    subject: `TeeAhead CRM — ${total} stale lead${total !== 1 ? 's' : ''} need attention`,
    html,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, staleCount: total, recipients })
}
```

- [ ] **Step 2: Add cron configuration to vercel.json**

Check if `vercel.json` exists:
```bash
cat /Users/barris/Desktop/MulliganLinks/vercel.json 2>/dev/null || echo "no vercel.json"
```

If it doesn't exist, create it:
```json
{
  "crons": [
    {
      "path": "/api/crm/stale-leads",
      "schedule": "0 8 * * *"
    }
  ]
}
```

If it already exists, add the `crons` key to the existing JSON.

- [ ] **Step 3: Add CRON_SECRET and admin email env vars to .env.example**

```
CRON_SECRET=your_random_secret_here
ADMIN_EMAIL_NEIL=nbarris11@gmail.com
ADMIN_EMAIL_BILLY=beslock@yahoo.com
```

Set `CRON_SECRET` in Vercel dashboard → Settings → Environment Variables. Vercel automatically passes it as the `Authorization: Bearer <secret>` header for cron jobs.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/crm/stale-leads/route.ts vercel.json env.example
git commit -m "feat: stale lead digest cron job endpoint"
```

---

### Task 9: CSV export utility + wire into tables

**Files:**
- Create: `src/lib/crm/csv.ts`
- Modify: `src/components/crm/CourseTable.tsx`
- Modify: `src/components/crm/OutingTable.tsx`
- Modify: `src/components/crm/MemberTable.tsx`

- [ ] **Step 1: Create CSV utility**

```typescript
// src/lib/crm/csv.ts
type Row = Record<string, string | number | null | undefined>

export function exportCsv(rows: Row[], filename: string): void {
  if (rows.length === 0) return
  const headers = Object.keys(rows[0])
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((h) => {
        const val = row[h]
        if (val == null) return ''
        const str = String(val)
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }).join(',')
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 2: Write a unit test for the CSV utility**

```typescript
// src/lib/crm/csv.test.ts
import { describe, it, expect, vi } from 'vitest'

// We can't test the DOM download trigger, but we can test the CSV content logic
function buildCsvContent(rows: Record<string, string | number | null>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  return [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((h) => {
        const val = row[h]
        if (val == null) return ''
        const str = String(val)
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }).join(',')
    ),
  ].join('\n')
}

describe('CSV content building', () => {
  it('creates header row from object keys', () => {
    const csv = buildCsvContent([{ name: 'Oak Hollow', city: 'Detroit' }])
    expect(csv.split('\n')[0]).toBe('name,city')
  })

  it('wraps values with commas in quotes', () => {
    const csv = buildCsvContent([{ name: 'Smith, Jr.', value: 100 }])
    expect(csv).toContain('"Smith, Jr."')
  })

  it('handles null values as empty string', () => {
    const csv = buildCsvContent([{ name: 'Test', phone: null }])
    const rows = csv.split('\n')
    expect(rows[1]).toBe('Test,')
  })
})
```

- [ ] **Step 3: Run CSV tests**

```bash
npx vitest run src/lib/crm/csv.test.ts 2>&1 | tail -5
```

Expected: all PASS.

- [ ] **Step 4: Wire CSV export into CourseTable**

In `src/components/crm/CourseTable.tsx`, import the utility and implement the `onExportCsv` handler. The `CourseTable` component receives `onExportCsv` as a prop but the courses list page currently passes an empty function. Update the courses page to pass a real handler:

In `src/app/admin/crm/courses/page.tsx`, replace the `CourseTable` render with a client wrapper:

Create `src/app/admin/crm/courses/CoursesTableWrapper.tsx`:
```typescript
// src/app/admin/crm/courses/CoursesTableWrapper.tsx
'use client'

import { CourseTable } from '@/components/crm/CourseTable'
import { exportCsv } from '@/lib/crm/csv'
import type { CrmCourse } from '@/lib/crm/types'

interface Props { courses: CrmCourse[] }

export function CoursesTableWrapper({ courses }: Props) {
  function handleExport() {
    exportCsv(
      courses.map((c) => ({
        name: c.name,
        city: c.city,
        state: c.state,
        contact_name: c.contact_name,
        contact_email: c.contact_email,
        contact_phone: c.contact_phone,
        stage: c.stage,
        estimated_value: c.estimated_value,
        assigned_to: c.assigned_to,
        last_activity_at: c.last_activity_at,
      })),
      'teeahead-courses'
    )
  }
  return <CourseTable initialCourses={courses} onExportCsv={handleExport} />
}
```

Update `src/app/admin/crm/courses/page.tsx` to use `CoursesTableWrapper` instead of `CourseTable` directly.

- [ ] **Step 5: Wire CSV export into OutingTable and MemberTable**

Follow the same pattern as Step 4:

Create `src/app/admin/crm/outings/OutingsTableWrapper.tsx`:
```typescript
'use client'
import { OutingTable } from '@/components/crm/OutingTable'
import { exportCsv } from '@/lib/crm/csv'
import type { CrmOuting } from '@/lib/crm/types'

export function OutingsTableWrapper({ outings }: { outings: CrmOuting[] }) {
  function handleExport() {
    exportCsv(
      outings.map((o) => ({
        contact_name: o.contact_name,
        contact_email: o.contact_email,
        contact_phone: o.contact_phone,
        event_date: o.event_date,
        num_golfers: o.num_golfers,
        preferred_course: o.preferred_course,
        budget_estimate: o.budget_estimate,
        status: o.status,
        assigned_to: o.assigned_to,
      })),
      'teeahead-outings'
    )
  }
  return <OutingTable initialOutings={outings} onExportCsv={handleExport} />
}
```

Create `src/app/admin/crm/members/MembersTableWrapper.tsx`:
```typescript
'use client'
import { MemberTable } from '@/components/crm/MemberTable'
import { exportCsv } from '@/lib/crm/csv'
import type { CrmMember } from '@/lib/crm/types'

export function MembersTableWrapper({ members }: { members: CrmMember[] }) {
  function handleExport() {
    exportCsv(
      members.map((m) => ({
        name: m.name,
        email: m.email,
        phone: m.phone,
        membership_tier: m.membership_tier,
        home_course: m.home_course,
        join_date: m.join_date,
        lifetime_spend: m.lifetime_spend,
        status: m.status,
      })),
      'teeahead-members'
    )
  }
  return <MemberTable initialMembers={members} onExportCsv={handleExport} />
}
```

Update `outings/page.tsx` and `members/page.tsx` to use these wrappers.

- [ ] **Step 6: Commit**

```bash
git add src/lib/crm/csv.ts src/lib/crm/csv.test.ts src/app/admin/crm/courses/CoursesTableWrapper.tsx src/app/admin/crm/outings/OutingsTableWrapper.tsx src/app/admin/crm/members/MembersTableWrapper.tsx src/app/admin/crm/courses/page.tsx src/app/admin/crm/outings/page.tsx src/app/admin/crm/members/page.tsx
git commit -m "feat: CSV export for all three CRM tables"
```

---

### Task 10: Seed data migration

**Files:**
- Create: `supabase/migrations/032_crm_seed.sql`

- [ ] **Step 1: Create the seed migration**

```sql
-- 032_crm_seed.sql
-- Seed data: 9 starter email templates

INSERT INTO crm_email_templates (name, subject, body_html, record_type) VALUES

-- Course templates
(
  'Course Intro Outreach',
  'Introducing TeeAhead — Your Course, More Rounds',
  '<p>Hi {{contact_name}},</p>
<p>My name is Neil Barris, co-founder of TeeAhead — we''re building a local golf loyalty network for metro Detroit golfers.</p>
<p>The concept is simple: golfers subscribe monthly and get exclusive benefits at our network of partner courses. We drive incremental rounds to your course at <strong>zero cost to you</strong>.</p>
<p>I''d love to share more about how it works and why courses like {{course_name}} are a great fit. Would you have 20 minutes this week for a quick call?</p>
<p>Best,<br>Neil<br>TeeAhead Co-Founder<br>teeahead.com</p>',
  'course'
),

(
  'Follow-Up (No Response)',
  'Following up — TeeAhead Partnership',
  '<p>Hi {{contact_name}},</p>
<p>I wanted to follow up on my previous note about TeeAhead. I know your inbox stays full — just wanted to make sure this didn''t get buried.</p>
<p>We''re building a local golf membership network and {{course_name}} would be a natural fit. No fees, no technology lift on your end — just more members walking through your doors.</p>
<p>Happy to work around your schedule. Even a 15-minute call would be great.</p>
<p>Best,<br>Neil</p>',
  'course'
),

(
  'Demo Confirmation',
  'Confirmed: TeeAhead Demo — {{date}}',
  '<p>Hi {{contact_name}},</p>
<p>Looking forward to our demo on {{date}}. I''ll walk you through the TeeAhead platform and show you exactly how the member experience works from a course perspective.</p>
<p>Join link: {{meeting_link}}</p>
<p>Questions before then? Just reply to this email.</p>
<p>See you then,<br>Neil</p>',
  'course'
),

(
  'Founding Partner Offer',
  'Founding Partner Offer — Reserved for {{course_name}}',
  '<p>Hi {{contact_name}},</p>
<p>I''m reaching out to extend a Founding Partner invitation to {{course_name}}.</p>
<p>Founding Partners get locked-in terms, priority placement in our platform, and permanent "Founding Partner" recognition — in exchange for being an early believer in what we''re building.</p>
<p>I''ve attached our Founding Partner proposal. Happy to walk through it on a call if helpful.</p>
<p>Best,<br>Neil</p>',
  'course'
),

-- Outing templates
(
  'Outing Quote',
  'Your TeeAhead Outing Quote — {{event_date}}',
  '<p>Hi {{contact_name}},</p>
<p>Thanks for reaching out about an outing through TeeAhead! I''ve attached a quote based on the details you shared.</p>
<p>Please review and let me know if you''d like to make any adjustments — we can accommodate most requests. To lock in the date, we''ll need a 50% deposit.</p>
<p>Let me know if you have questions!</p>
<p>Best,<br>Neil<br>TeeAhead</p>',
  'outing'
),

(
  'Outing Confirmation',
  'Your Outing is Confirmed — {{event_date}} at {{course_name}}',
  '<p>Hi {{contact_name}},</p>
<p>Great news — your outing on {{event_date}} is officially confirmed at {{course_name}}!</p>
<p>I''ve attached your confirmation document with all the details. Please review and reach out with any questions.</p>
<p>We''ll be in touch a week before the event to confirm final headcount. Looking forward to a great day on the course!</p>
<p>Best,<br>Neil<br>TeeAhead</p>',
  'outing'
),

-- Member templates
(
  'Member Welcome',
  'Welcome to TeeAhead, {{name}}!',
  '<p>Hi {{name}},</p>
<p>Welcome to TeeAhead! We''re thrilled to have you as a member.</p>
<p>Here''s what you can expect:</p>
<ul>
<li>Access to exclusive member rates at our partner courses</li>
<li>Monthly barter credits to use toward rounds</li>
<li>Priority tee times at your home course</li>
</ul>
<p>Log in at teeahead.com to see available courses and book your first round. If you have any questions, just reply to this email — we''re here to help.</p>
<p>See you on the course,<br>Neil & Billy<br>TeeAhead Co-Founders</p>',
  'member'
),

(
  'Win-Back (Lapsed)',
  'We miss you at TeeAhead, {{name}}',
  '<p>Hi {{name}},</p>
<p>It''s been a while since we''ve seen you on the platform, and we wanted to reach out personally.</p>
<p>A lot has changed at TeeAhead — we''ve added new courses and improved the booking experience. We''d love to have you back.</p>
<p>If something wasn''t working for you, I''d genuinely love to hear it. Just reply to this email — I read every response.</p>
<p>Best,<br>Neil<br>TeeAhead Co-Founder</p>',
  'member'
),

(
  'Upgrade to Ace',
  'Upgrade to TeeAhead Ace — Unlock More',
  '<p>Hi {{name}},</p>
<p>You''ve been a great TeeAhead Eagle member — thank you for being part of our community.</p>
<p>I wanted to share what you''d unlock by upgrading to our Ace tier: higher monthly barter credits, access to premium-tier course rates, and early access to new features.</p>
<p>You can upgrade directly from your account at teeahead.com, or just reply here and I''ll take care of it for you.</p>
<p>Best,<br>Neil</p>',
  'member'
);
```

- [ ] **Step 2: Run the seed migration**

```bash
cd /Users/barris/Desktop/MulliganLinks && npx supabase db push
```

Expected: `Applied 1 migration`.

- [ ] **Step 3: Verify templates are seeded**

```bash
npx supabase db diff --schema public 2>/dev/null | grep "crm_email_templates" | head -3
```

Or log into the Supabase dashboard and verify 9 rows exist in `crm_email_templates`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/032_crm_seed.sql
git commit -m "feat: seed 9 starter email templates for CRM"
```

---

### Task 11: Final compile check and run all tests

- [ ] **Step 1: Run all CRM tests**

```bash
cd /Users/barris/Desktop/MulliganLinks && npx vitest run src/lib/crm/ src/app/actions/crm/ 2>&1 | tail -20
```

Expected: all tests PASS with no failures.

- [ ] **Step 2: Full TypeScript compile**

```bash
npx tsc --noEmit 2>&1 | grep -v "^$" | head -30
```

Expected: zero errors, or address any remaining type errors before proceeding.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: TeeAhead CRM Plan 3 complete — email, PDF, cron, CSV, seed data"
```

---

**Plan 3 complete. The full TeeAhead CRM is now built:**

- ✅ `/admin/crm` — Dashboard with KPI tiles, activity feed, stale lead alerts
- ✅ `/admin/crm/courses` — Kanban + table pipeline, full detail with inline editing
- ✅ `/admin/crm/outings` — Lead table + detail pages
- ✅ `/admin/crm/members` — Member table with tier/status filters + detail pages
- ✅ `/admin/crm/templates` — Email template CRUD management
- ✅ Email sending via Resend on all three record types
- ✅ PDF generation (4 templates) via `@react-pdf/renderer` + Supabase Storage
- ✅ Stale lead digest cron job (daily at 8am)
- ✅ CSV export on all three tables
- ✅ 9 seeded email templates

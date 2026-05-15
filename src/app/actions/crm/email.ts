'use server'

import { getResend } from '@/lib/resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { appendToSentFolder } from '@/lib/crm/imap-sync'
import { revalidatePath } from 'next/cache'
import type { CrmRecordType } from '@/lib/crm/types'

const ADMIN_EMAILS = ['mulliganlinksgolf@gmail.com', 'neil@teeahead.com', 'beslock@yahoo.com']

const SENDER_MAP: Record<string, string> = {
  'neil@teeahead.com': 'Neil Barris <neil@teeahead.com>',
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
  inReplyTo?: string | null  // Message-ID of the email this is a reply to
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

    // Generate our own Message-ID so threading is deterministic, even if the
    // SMTP relay rewrites the default. Format: <uuid@teeahead.com>
    const messageId = `<${crypto.randomUUID()}@teeahead.com>`
    const headers: Record<string, string> = { 'Message-ID': messageId }
    if (params.inReplyTo) {
      headers['In-Reply-To'] = params.inReplyTo
      headers['References'] = params.inReplyTo
    }

    const { data: sendData, error: sendError } = await resend.emails.send({
      from: fromAddress,
      to: params.to,
      subject: params.subject,
      html: finalHtml,
      headers,
    })

    if (sendError) return { error: (sendError as { message?: string }).message ?? 'Send failed' }

    // Mirror the sent email into the sender's IMAP Sent folder (best-effort).
    // The match between fromAddress (e.g. "Neil Barris <neil@teeahead.com>")
    // and the IMAP mailbox key is by the bare email inside the angle brackets.
    const bareEmailMatch = fromAddress.match(/<([^>]+)>/)
    const fromEmailOnly = (bareEmailMatch?.[1] ?? fromAddress).toLowerCase()
    try {
      const imapErr = await appendToSentFolder({
        fromHeader: fromAddress,
        fromEmail: fromEmailOnly,
        to: params.to,
        subject: params.subject,
        html: finalHtml,
        messageId,
        inReplyTo: params.inReplyTo ?? null,
      })
      if (imapErr) console.error('[crm-email] IMAP append failed:', imapErr)
    } catch (err) {
      console.error('[crm-email] IMAP append exception:', err)
    }

    await admin.from('crm_activity_log').insert({
      record_type: params.recordType,
      record_id: params.recordId,
      type: 'email',
      body: `To: ${params.to}\nSubject: ${params.subject}`,
      email_html: finalHtml,
      created_by: params.sentBy,
      resend_email_id: sendData?.id ?? null,
      from_email: fromAddress,
      open_count: 0,
      message_id: messageId,
      in_reply_to: params.inReplyTo ?? null,
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

// Look up the most recent outbound email to `toEmail` for this record so the
// composer can offer a "Reply to last email" flow and show the preview.
// Returns null only when there's no prior email at all. `message_id` may be
// null for older emails that predate threading support.
export async function getLastEmailToContact(args: {
  recordType: CrmRecordType
  recordId: string
  toEmail: string
}): Promise<{ message_id: string | null; subject: string; body: string | null; created_at: string } | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('crm_activity_log')
    .select('message_id, body, created_at')
    .eq('record_type', args.recordType)
    .eq('record_id', args.recordId)
    .eq('type', 'email')
    .ilike('body', `%To: ${args.toEmail}%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data) return null
  const subjectMatch = data.body?.match(/Subject:\s*(.+)/i)
  const subject = subjectMatch?.[1]?.trim() ?? ''
  return { message_id: data.message_id, subject, body: data.body, created_at: data.created_at }
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

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { appendToSentFolder } from '@/lib/crm/imap-sync'

// ONE-TIME backfill route — delete after use.
// Appends already-sent scheduled emails to the sender's IMAP Sent folder
// so they show up in their Mail app. Targets rows where the cron sent the
// email but the original cron code didn't do the IMAP append.

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-backfill-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: rows } = await admin
    .from('crm_scheduled_emails')
    .select('id, from_email, to_email, subject, body_html, message_id, in_reply_to, sent_at')
    .eq('status', 'sent')
    .ilike('from_email', '%billy%')
    .order('sent_at', { ascending: true })

  if (!rows?.length) return NextResponse.json({ updated: 0, message: 'Nothing to backfill' })

  let appended = 0
  const errors: Array<{ id: string; error: string }> = []

  for (const row of rows) {
    const bareEmailMatch = row.from_email.match(/<([^>]+)>/)
    const fromEmailOnly = (bareEmailMatch?.[1] ?? row.from_email).toLowerCase()
    try {
      const imapErr = await appendToSentFolder({
        fromHeader: row.from_email,
        fromEmail: fromEmailOnly,
        to: row.to_email,
        subject: row.subject,
        html: row.body_html,
        messageId: row.message_id ?? undefined,
        inReplyTo: row.in_reply_to ?? null,
      })
      if (imapErr) {
        errors.push({ id: row.id, error: imapErr })
      } else {
        appended++
      }
    } catch (err) {
      errors.push({ id: row.id, error: (err as Error).message })
    }
  }

  return NextResponse.json({ appended, errors, total: rows.length })
}

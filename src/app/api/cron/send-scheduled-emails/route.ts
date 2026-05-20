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
    const headers: Record<string, string> = {
      'Message-ID': row.message_id ?? `<${crypto.randomUUID()}@teeahead.com>`,
    }
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

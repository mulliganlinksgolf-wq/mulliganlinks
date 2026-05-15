import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ONE-TIME backfill route — delete after use
// Fetches email HTML from Resend for all activity log entries that have a
// resend_email_id but no email_html stored yet.

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-backfill-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return NextResponse.json({ error: 'No RESEND_API_KEY' }, { status: 500 })

  const admin = createAdminClient()
  const { data: rows } = await admin
    .from('crm_activity_log')
    .select('id, resend_email_id')
    .eq('type', 'email')
    .not('resend_email_id', 'is', null)
    .is('email_html', null)

  if (!rows?.length) return NextResponse.json({ updated: 0, message: 'Nothing to backfill' })

  let updated = 0, notFound = 0, errors = 0

  for (const row of rows) {
    try {
      const res = await fetch(`https://api.resend.com/emails/${row.resend_email_id}`, {
        headers: { Authorization: `Bearer ${resendKey}` },
      })
      if (!res.ok) {
        if (res.status === 404) { notFound++; continue }
        if (errors === 0) {
          const body = await res.text()
          console.error('[backfill] Resend error', res.status, body)
          return NextResponse.json({ firstError: { status: res.status, body } })
        }
        errors++; continue
      }
      const data = await res.json()
      const html = data.html
      if (!html) { notFound++; continue }

      await admin
        .from('crm_activity_log')
        .update({ email_html: html })
        .eq('id', row.id)

      updated++
    } catch {
      errors++
    }
  }

  return NextResponse.json({ updated, notFound, errors, total: rows.length })
}

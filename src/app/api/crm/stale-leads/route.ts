import { NextRequest, NextResponse } from 'next/server'
import { getResend } from '@/lib/resend'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
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
        <h2 style="font-size: 16px; margin-bottom: 12px;">Courses (${staleCourses.length})</h2>
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
        <h2 style="font-size: 16px; margin-bottom: 12px;">Outings (${staleOutings.length})</h2>
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

  if (error) return NextResponse.json({ error: (error as { message?: string }).message }, { status: 500 })
  return NextResponse.json({ success: true, staleCount: total, recipients })
}

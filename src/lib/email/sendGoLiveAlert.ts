import { Resend } from 'resend'

export async function sendGoLiveAlert(course: {
  id: string
  name: string
  city: string | null
  state: string | null
  gm_name: string | null
  email: string | null
  phone: string | null
  website: string | null
  holes: number
  slug: string
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey === 're_placeholder') {
    console.log('[sendGoLiveAlert] Resend not configured, skipping.')
    return
  }

  const resend = new Resend(apiKey)
  const from = process.env.FROM_EMAIL_ALERTS ?? 'alerts@teeahead.com'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.teeahead.com'

  const to: string[] = []
  if (process.env.NEIL_EMAIL) to.push(process.env.NEIL_EMAIL)
  if (process.env.BILLY_EMAIL) to.push(process.env.BILLY_EMAIL)

  if (to.length === 0) {
    console.log('[sendGoLiveAlert] No recipient emails configured, skipping.')
    return
  }

  const html = `
<div style="font-family: sans-serif; max-width: 480px; color: #1A1A1A;">
  <h2 style="color: #3B6D11;">New TeeAhead partner is live.</h2>
  <p><strong>Course:</strong> ${course.name}</p>
  <p><strong>Location:</strong> ${course.city ?? '—'}, ${course.state ?? '—'}</p>
  <p><strong>GM:</strong> ${course.gm_name ?? '—'} · ${course.email ?? '—'} · ${course.phone ?? '—'}</p>
  <p><strong>Website:</strong> ${course.website ?? '—'}</p>
  <p><strong>Holes:</strong> ${course.holes}</p>
  <p><strong>Slug:</strong> ${course.slug}</p>
  <p><a href="${appUrl}/admin/courses/${course.id}" style="color: #3B6D11;">View in admin →</a></p>
  <hr style="border: none; border-top: 1px solid #eee;" />
  <p style="color: #6B7770; font-size: 12px;">— TeeAhead Alerts</p>
</div>
`

  const { error } = await resend.emails.send({
    from,
    to,
    subject: `New course live: ${course.name}`,
    html,
  })

  if (error) {
    console.error('[sendGoLiveAlert] Failed to send email:', error)
  }
}

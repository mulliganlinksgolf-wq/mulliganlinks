import { Resend } from 'resend'

export async function sendCourseWelcome(course: {
  name: string
  slug: string
  gm_name: string | null
  email: string | null
}): Promise<void> {
  if (!course.email) {
    console.log('[sendCourseWelcome] No course email, skipping.')
    return
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey === 're_placeholder') {
    console.log('[sendCourseWelcome] Resend not configured, skipping.')
    return
  }

  const resend = new Resend(apiKey)
  const from = process.env.FROM_EMAIL_HELLO ?? 'hello@teeahead.com'
  const firstName = course.gm_name?.split(' ')[0] ?? 'there'

  const html = `
<div style="font-family: sans-serif; max-width: 520px; color: #1A1A1A;">
  <h2 style="color: #3B6D11;">You're live on TeeAhead ⛳</h2>
  <p>Hi ${firstName},</p>
  <p>${course.name} is officially live on TeeAhead.</p>
  <p>Your booking widget is ready to install on your website. Your Course ID is:</p>
  <p style="font-family: monospace; background: #EAF3DE; padding: 8px 12px; border-radius: 6px; display: inline-block;">${course.slug}</p>
  <p>Your hosted booking page (works without a website install):</p>
  <p><a href="https://teeahead.com/book/${course.slug}" style="color: #3B6D11;">teeahead.com/book/${course.slug}</a></p>
  <p><strong>Next steps:</strong></p>
  <ol style="color: #444; line-height: 2;">
    <li>Install the booking widget on your site (instructions in your onboarding portal)</li>
    <li>Share your hosted booking page on your Google Business Profile</li>
    <li>Tell your regulars — they can join TeeAhead and earn points every round at your course</li>
  </ol>
  <p>Questions? Reply to this email.</p>
  <p>Welcome to TeeAhead.</p>
  <p><strong>Neil &amp; Billy</strong><br/>TeeAhead Co-Founders</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
  <p style="color: #6B7770; font-size: 12px;">TeeAhead · Your home course, redone right.</p>
</div>
`

  const { error } = await resend.emails.send({
    from,
    to: course.email,
    subject: `You're live on TeeAhead — here's what's next`,
    html,
  })

  if (error) {
    console.error('[sendCourseWelcome] Failed to send email:', error)
  }
}

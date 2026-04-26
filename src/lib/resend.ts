import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendAdminNotification({
  subject,
  html,
}: {
  subject: string
  html: string
}) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_placeholder') {
    console.log('[notify] Resend not configured — skipping email:', subject)
    return
  }

  await resend.emails.send({
    from: 'MulliganLinks <notifications@mulliganlinks.com>',
    to: 'mulliganlinksgolf@gmail.com',
    subject,
    html,
  })
}

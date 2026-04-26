import { Resend } from 'resend'

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key || key === 're_placeholder') return null
  return new Resend(key)
}

export async function sendAdminNotification({
  subject,
  html,
}: {
  subject: string
  html: string
}) {
  const client = getResend()
  if (!client) {
    console.log('[notify] Resend not configured — skipping email:', subject)
    return
  }

  await client.emails.send({
    from: 'MulliganLinks <notifications@mulliganlinks.com>',
    to: 'mulliganlinksgolf@gmail.com',
    subject,
    html,
  })
}

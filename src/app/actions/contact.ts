'use server'

import { redirect } from 'next/navigation'
import { sendAdminNotification } from '@/lib/resend'

export async function submitCourseInquiry(formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim()
  const course = (formData.get('course') as string)?.trim()
  const audience = (formData.get('audience') as string)?.trim()
  const message = (formData.get('message') as string)?.trim()

  if (!name || !email) return

  await sendAdminNotification({
    subject: `New contact inquiry${course ? `: ${course}` : ` from ${name}`}`,
    html: `
      <h2>New Contact Inquiry</h2>
      <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px">
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;width:140px">Name</td><td style="padding:8px;border-bottom:1px solid #eee">${name}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Email</td><td style="padding:8px;border-bottom:1px solid #eee"><a href="mailto:${email}">${email}</a></td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Reaching out as</td><td style="padding:8px;border-bottom:1px solid #eee">${audience || 'Not specified'}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Course / club</td><td style="padding:8px;border-bottom:1px solid #eee">${course || 'Not specified'}</td></tr>
        <tr><td style="padding:8px;font-weight:bold">Message</td><td style="padding:8px">${message || 'None'}</td></tr>
      </table>
    `,
  })

  redirect('/contact/thanks')
}

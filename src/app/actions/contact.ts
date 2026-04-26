'use server'

import { redirect } from 'next/navigation'
import { sendAdminNotification } from '@/lib/resend'

export async function submitCourseInquiry(formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim()
  const course = (formData.get('course') as string)?.trim()
  const software = (formData.get('software') as string)?.trim()
  const message = (formData.get('message') as string)?.trim()

  if (!name || !email || !course) return

  await sendAdminNotification({
    subject: `New course inquiry: ${course}`,
    html: `
      <h2>New Course Inquiry</h2>
      <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px">
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;width:140px">Name</td><td style="padding:8px;border-bottom:1px solid #eee">${name}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Email</td><td style="padding:8px;border-bottom:1px solid #eee"><a href="mailto:${email}">${email}</a></td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Course</td><td style="padding:8px;border-bottom:1px solid #eee">${course}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">Current software</td><td style="padding:8px;border-bottom:1px solid #eee">${software || 'Not specified'}</td></tr>
        <tr><td style="padding:8px;font-weight:bold">Message</td><td style="padding:8px">${message || 'None'}</td></tr>
      </table>
    `,
  })

  redirect('/contact/thanks')
}

import { NextResponse } from 'next/server'
import { sendAdminNotification } from '@/lib/resend'

export async function POST(request: Request) {
  try {
    const { email, fullName } = await request.json()

    await sendAdminNotification({
      subject: `New signup: ${email}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px;">
          <h2 style="color: #1B4332;">New MulliganLinks Signup</h2>
          <p><strong>Name:</strong> ${fullName || 'Not provided'}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
          <p style="color: #6B7770; font-size: 13px;">MulliganLinks · mulliganlinks.com</p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[signup-notification]', err)
    return NextResponse.json({ ok: false }, { status: 200 }) // Never block signup
  }
}

import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

const TZ = 'America/Detroit'

function fmtDateTime(iso: string) {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: TZ })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ })
  return { date, time }
}

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key || key === 're_placeholder') return null
  return new Resend(key)
}

export async function sendBookingConfirmation({
  userId,
  bookingId,
  players,
  total,
  pointsEarned,
  teeTimeId,
}: {
  userId: string
  bookingId: string
  players: number
  total: number
  pointsEarned: number
  teeTimeId: string
}) {
  try {
    const resend = getResend()
    if (!resend) return

    const admin = createAdminClient()
    const [{ data: profile }, { data: teeTime }, { data: { user } }] = await Promise.all([
      admin.from('profiles').select('full_name, email').eq('id', userId).single(),
      admin.from('tee_times').select('scheduled_at, courses(name, city, state, slug)').eq('id', teeTimeId).single(),
      admin.auth.admin.getUserById(userId),
    ])

    const email = profile?.email ?? user?.email
    if (!email) return

    const course = (teeTime as any)?.courses
    const courseSlug = course?.slug ?? ''
    const { date: dateStr, time: timeStr } = fmtDateTime(teeTime?.scheduled_at ?? '')
    const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

    await resend.emails.send({
      from: 'TeeAhead <notifications@teeahead.com>',
      to: email,
      subject: `You're on the tee — ${course?.name} ${dateStr}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; color: #1A1A1A;">
          <h2 style="color: #1B4332;">Booking confirmed ⛳</h2>
          <p>Hey ${firstName}, you're all set.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px 0; color: #6B7770; border-bottom: 1px solid #eee;">Course</td><td style="padding: 8px 0; font-weight: 600; border-bottom: 1px solid #eee;">${course?.name}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7770; border-bottom: 1px solid #eee;">Date</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${dateStr}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7770; border-bottom: 1px solid #eee;">Tee time</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${timeStr}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7770; border-bottom: 1px solid #eee;">Players</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${players}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7770; border-bottom: 1px solid #eee;">Total paid</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">$${total.toFixed(2)}</td></tr>
            <tr><td style="padding: 8px 0; color: #1B4332;">Points to earn</td><td style="padding: 8px 0; color: #1B4332; font-weight: 600;">+${pointsEarned} (awarded when round is marked complete)</td></tr>
          </table>
          <p style="color: #6B7770; font-size: 13px;">Free cancellation up to 1 hour before your tee time at teeahead.com</p>
          <p style="margin: 20px 0;">
            <a href="https://teeahead.com/app/bookings"
               style="background: #1B4332; color: #FAF7F2; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
              View my bookings →
            </a>
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #6B7770; font-size: 12px;">TeeAhead &middot; Your home course, redone right.</p>
        </div>
      `,
    })
  } catch (err) {
    console.error('[booking-email]', err)
  }
}

export async function sendCourseBookingAlert({
  courseId,
  courseSlug,
  memberName,
  memberEmail,
  players,
  total,
  teeTimeIso,
  courseName,
}: {
  courseId: string
  courseSlug: string
  memberName: string
  memberEmail: string
  players: number
  total: number
  teeTimeIso: string
  courseName: string
}) {
  try {
    const resend = getResend()
    if (!resend) return

    const { date: dateStr, time: timeStr } = fmtDateTime(teeTimeIso)

    const admin = createAdminClient()
    const { data: admins } = await admin
      .from('course_admins')
      .select('profiles(email)')
      .eq('course_id', courseId)

    const adminEmails = (admins ?? [])
      .map((a: any) => a.profiles?.email)
      .filter(Boolean) as string[]

    if (adminEmails.length === 0) return

    await resend.emails.send({
      from: 'TeeAhead <notifications@teeahead.com>',
      to: adminEmails,
      subject: `New booking — ${timeStr} ${dateStr.split(',')[0]}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; color: #1A1A1A;">
          <h2 style="color: #1B4332;">New tee time booking ⛳</h2>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px 0; color: #6B7770; border-bottom: 1px solid #eee;">Course</td><td style="padding: 8px 0; font-weight: 600; border-bottom: 1px solid #eee;">${courseName}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7770; border-bottom: 1px solid #eee;">Date</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${dateStr}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7770; border-bottom: 1px solid #eee;">Tee time</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${timeStr}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7770; border-bottom: 1px solid #eee;">Member</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${memberName} (${memberEmail})</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7770; border-bottom: 1px solid #eee;">Players</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${players}</td></tr>
            <tr><td style="padding: 8px 0; color: #1B4332;">Total paid</td><td style="padding: 8px 0; color: #1B4332; font-weight: 600;">$${total.toFixed(2)}</td></tr>
          </table>
          <p style="margin: 0;">
            <a href="https://teeahead.com/course/${courseSlug}/bookings"
               style="background: #1B4332; color: #FAF7F2; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
              View in tee sheet →
            </a>
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #6B7770; font-size: 12px;">TeeAhead &middot; Course portal</p>
        </div>
      `,
    })
  } catch (err) {
    console.error('[course-booking-alert]', err)
  }
}

export async function sendCancellationConfirmation({
  userId,
  courseName,
  teeTimeIso,
  players,
  redeemedPointsRestored,
}: {
  userId: string
  courseName: string
  teeTimeIso: string
  players: number
  redeemedPointsRestored: number
}) {
  try {
    const resend = getResend()
    if (!resend) return

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single()

    const email = profile?.email
    if (!email) return

    const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
    const { date: dateStr, time: timeStr } = fmtDateTime(teeTimeIso)

    await resend.emails.send({
      from: 'TeeAhead <notifications@teeahead.com>',
      to: email,
      subject: `Booking canceled — ${courseName} ${dateStr}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; color: #1A1A1A;">
          <h2 style="color: #1A1A1A;">Booking canceled</h2>
          <p>Hey ${firstName}, your booking has been canceled.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px 0; color: #6B7770; border-bottom: 1px solid #eee;">Course</td><td style="padding: 8px 0; font-weight: 600; border-bottom: 1px solid #eee;">${courseName}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7770; border-bottom: 1px solid #eee;">Date</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${dateStr}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7770; border-bottom: 1px solid #eee;">Tee time</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${timeStr}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7770; border-bottom: 1px solid #eee;">Players</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${players}</td></tr>
            ${redeemedPointsRestored > 0 ? `<tr><td style="padding: 8px 0; color: #1B4332;">Points restored</td><td style="padding: 8px 0; color: #1B4332; font-weight: 600;">+${redeemedPointsRestored}</td></tr>` : ''}
          </table>
          <p style="color: #6B7770; font-size: 13px;">
            ${redeemedPointsRestored > 0 ? 'Your redeemed points have been returned to your balance. ' : ''}
            Refunds are processed through Stripe once payment is wired.
          </p>
          <p style="margin: 20px 0;">
            <a href="https://teeahead.com/app/courses"
               style="background: #1B4332; color: #FAF7F2; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
              Book another tee time →
            </a>
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #6B7770; font-size: 12px;">TeeAhead &middot; Your home course, redone right.</p>
        </div>
      `,
    })
  } catch (err) {
    console.error('[cancel-email]', err)
  }
}

export async function sendRainCheckEmail({
  userId,
  courseName,
  code,
  amountCents,
  note,
}: {
  userId: string
  courseName: string
  code: string
  amountCents: number
  note?: string | null
}) {
  try {
    const resend = getResend()
    if (!resend) return

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single()

    const email = profile?.email
    if (!email) return

    const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
    const amount = (amountCents / 100).toFixed(2)

    await resend.emails.send({
      from: 'TeeAhead <notifications@teeahead.com>',
      to: email,
      subject: `Your rain check — $${amount} at ${courseName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; color: #1A1A1A;">
          <h2 style="color: #1B4332;">Rain check issued 🌧️</h2>
          <p>Hey ${firstName}, ${courseName} has issued you a rain check.</p>
          ${note ? `<p style="color: #6B7770; font-size: 14px; font-style: italic;">"${note}"</p>` : ''}
          <div style="background: #F8F7F4; border: 1px solid #E5E2DC; border-radius: 12px; padding: 24px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 8px; color: #6B7770; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em;">Your code</p>
            <p style="margin: 0 0 8px; font-size: 32px; font-weight: 800; letter-spacing: 0.15em; font-family: monospace; color: #1A1A1A;">${code}</p>
            <p style="margin: 0; color: #1B4332; font-weight: 600; font-size: 18px;">$${amount} credit</p>
          </div>
          <p style="color: #6B7770; font-size: 13px;">Enter this code at checkout on your next tee time booking. Valid for 1 year.</p>
          <p style="margin: 20px 0;">
            <a href="https://teeahead.com/app/courses"
               style="background: #1B4332; color: #FAF7F2; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
              Book a tee time →
            </a>
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #6B7770; font-size: 12px;">TeeAhead &middot; Your home course, redone right.</p>
        </div>
      `,
    })
  } catch (err) {
    console.error('[rain-check-email]', err)
  }
}

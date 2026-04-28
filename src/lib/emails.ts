import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const TZ = 'America/Detroit'

function fmtDateTime(iso: string) {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: TZ })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ })
  return { date, time }
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
    const supabase = await createClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single()

    const { data: teeTime } = await supabase
      .from('tee_times')
      .select('scheduled_at, courses(name, city, state)')
      .eq('id', teeTimeId)
      .single()

    const { data: user } = await supabase.auth.admin.getUserById(userId)
    const email = user.user?.email
    if (!email) return

    const course = (teeTime as any)?.courses
    const { date: dateStr, time: timeStr } = fmtDateTime(teeTime?.scheduled_at ?? '')
    const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

    const { Resend } = await import('resend')
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey || resendKey === 're_placeholder') return

    const resend = new Resend(resendKey)
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
            <tr><td style="padding: 8px 0; color: #6B7770; border-bottom: 1px solid #eee;">Time</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${timeStr}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7770; border-bottom: 1px solid #eee;">Players</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${players}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7770; border-bottom: 1px solid #eee;">Total paid</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">$${total.toFixed(2)}</td></tr>
            <tr><td style="padding: 8px 0; color: #1B4332;">Points earned</td><td style="padding: 8px 0; color: #1B4332; font-weight: 600;">+${pointsEarned}</td></tr>
          </table>
          <p style="color: #6B7770; font-size: 13px;">Free cancellation up to 1 hour before your tee time at teeahead.com</p>
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
  memberName,
  memberEmail,
  players,
  total,
  teeTimeIso,
  courseName,
}: {
  courseId: string
  memberName: string
  memberEmail: string
  players: number
  total: number
  teeTimeIso: string
  courseName: string
}) {
  try {
    const { date: dateStr, time: timeStr } = fmtDateTime(teeTimeIso)

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey || resendKey === 're_placeholder') return

    // Get all course admin emails
    const admin = createAdminClient()
    const { data: admins } = await admin
      .from('course_admins')
      .select('profiles(email, full_name)')
      .eq('course_id', courseId)

    const adminEmails = (admins ?? [])
      .map((a: any) => a.profiles?.email)
      .filter(Boolean) as string[]

    if (adminEmails.length === 0) return

    const { Resend } = await import('resend')
    const resend = new Resend(resendKey)

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
            <a href="https://teeahead.com/course/fieldstone-golf-club/bookings"
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

export async function sendPhoneBookingConfirmation({
  guestName,
  guestEmail,
  courseName,
  teeTimeIso,
  players,
  totalPaid,
  paymentMethod,
}: {
  guestName: string
  guestEmail: string
  courseName: string
  teeTimeIso: string
  players: number
  totalPaid: number
  paymentMethod: 'cash' | 'card' | 'unpaid'
}) {
  try {
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey || resendKey === 're_placeholder') return

    const { date: dateStr, time: timeStr } = fmtDateTime(teeTimeIso)
    const firstName = guestName.split(' ')[0]
    const paymentLabel =
      paymentMethod === 'cash' ? 'Cash' : paymentMethod === 'card' ? 'Card' : 'Unpaid'

    const { Resend } = await import('resend')
    const resend = new Resend(resendKey)

    await resend.emails.send({
      from: 'TeeAhead <notifications@teeahead.com>',
      to: guestEmail,
      subject: `Tee time confirmed — ${courseName} ${dateStr}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; color: #1A1A1A;">
          <h2 style="color: #1B4332;">You're on the tee ⛳</h2>
          <p>Hey ${firstName}, your tee time at <strong>${courseName}</strong> is confirmed.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px 0; color: #6B7770; border-bottom: 1px solid #eee;">Course</td><td style="padding: 8px 0; font-weight: 600; border-bottom: 1px solid #eee;">${courseName}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7770; border-bottom: 1px solid #eee;">Date</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${dateStr}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7770; border-bottom: 1px solid #eee;">Time</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${timeStr}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7770; border-bottom: 1px solid #eee;">Players</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${players}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7770; border-bottom: 1px solid #eee;">Total paid</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">$${totalPaid.toFixed(2)}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7770;">Payment method</td><td style="padding: 8px 0;">${paymentLabel}</td></tr>
          </table>
          <p style="color: #6B7770; font-size: 13px;">Booked by calling the course. Questions? Contact us at support@teeahead.com</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #6B7770; font-size: 12px;">TeeAhead &middot; Your home course, redone right.</p>
        </div>
      `,
    })
  } catch (err) {
    console.error('[phone-booking-email]', err)
  }
}

import { createClient } from '@/lib/supabase/server'

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
    const scheduledAt = new Date(teeTime?.scheduled_at ?? '')
    const dateStr = scheduledAt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    const timeStr = scheduledAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

    const { Resend } = await import('resend')
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey || resendKey === 're_placeholder') return

    const resend = new Resend(resendKey)
    await resend.emails.send({
      from: 'MulliganLinks <notifications@mulliganlinks.com>',
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
          <p style="color: #6B7770; font-size: 13px;">Free cancellation up to 1 hour before your tee time at mulliganlinks.com</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #6B7770; font-size: 12px;">MulliganLinks &middot; Your home course, redone right.</p>
        </div>
      `,
    })
  } catch (err) {
    console.error('[booking-email]', err)
  }
}

import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

const TZ = 'America/Detroit'

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key || key === 're_placeholder') return null
  return new Resend(key)
}

export function parseFirstName(fullName: string | null | undefined): string {
  if (!fullName) return ''
  return fullName.trim().split(/\s+/)[0] ?? ''
}

export function joinFirstNames(names: string[]): string {
  const filtered = names.filter(Boolean)
  if (filtered.length === 0) return ''
  if (filtered.length === 1) return filtered[0]
  if (filtered.length === 2) return `${filtered[0]} and ${filtered[1]}`
  return `${filtered.slice(0, -1).join(', ')}, and ${filtered[filtered.length - 1]}`
}

type PairingMember = {
  booking_id: string
  booking_group_id: string
  scheduled_at: string
  user_id: string
  full_name: string | null
  email: string | null
  course_name: string
  course_slug: string
}

export async function sendPairingNotificationsForTomorrow(): Promise<{
  sent: number
  errors: number
  skipped: number
}> {
  const admin = createAdminClient()

  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  const startWindow = new Date(Date.UTC(
    tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate(), 0, 0, 0
  )).toISOString()
  const endWindow = new Date(Date.UTC(
    tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate(), 23, 59, 59
  )).toISOString()

  // Pull all self-grouped, un-notified bookings for tomorrow with denormalized fields
  const { data, error } = await admin
    .from('bookings')
    .select(`
      id,
      booking_group_id,
      user_id,
      tee_times!inner ( scheduled_at, courses!inner ( name, slug ) ),
      profiles_with_email!inner ( full_name, email )
    `)
    .eq('is_self_grouped', true)
    .is('pairing_notification_sent_at', null)
    .not('status', 'in', '(canceled,no_show)')
    .gte('tee_times.scheduled_at', startWindow)
    .lte('tee_times.scheduled_at', endWindow)

  if (error) throw error

  const rows: PairingMember[] = (data ?? []).map((b: any) => ({
    booking_id: b.id,
    booking_group_id: b.booking_group_id,
    scheduled_at: b.tee_times.scheduled_at,
    user_id: b.user_id,
    full_name: b.profiles_with_email?.full_name ?? null,
    email: b.profiles_with_email?.email ?? null,
    course_name: b.tee_times.courses.name,
    course_slug: b.tee_times.courses.slug,
  }))

  // Group by booking_group_id
  const groups = new Map<string, PairingMember[]>()
  for (const r of rows) {
    const arr = groups.get(r.booking_group_id) ?? []
    arr.push(r)
    groups.set(r.booking_group_id, arr)
  }

  const resend = getResend()

  let sent = 0
  let errors = 0
  let skipped = 0

  for (const [, members] of groups) {
    if (members.length < 2) {
      // Solo "group" — no one to pair with
      skipped += members.length
      continue
    }

    const firstNames = members.map(m => parseFirstName(m.full_name))
    const scheduledAt = new Date(members[0].scheduled_at)
    const timeStr = scheduledAt.toLocaleString('en-US', {
      weekday: 'long',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: TZ,
    })

    for (const m of members) {
      const recipientFirst = parseFirstName(m.full_name)
      const otherNames = firstNames.filter((_, i) => members[i].booking_id !== m.booking_id)
      const namesText = joinFirstNames(otherNames)

      if (!namesText || !m.email) {
        skipped++
        continue
      }

      if (!resend) {
        // No Resend key (test/dev) — record the would-have-sent and stamp the row so we don't loop
        await admin
          .from('bookings')
          .update({ pairing_notification_sent_at: new Date().toISOString() })
          .eq('id', m.booking_id)
        sent++
        continue
      }

      try {
        await resend.emails.send({
          from: 'TeeAhead <hello@teeahead.com>',
          to: m.email,
          subject: `Tomorrow's pairing — ${m.course_name} at ${timeStr}`,
          html: `
            <div style="font-family: sans-serif; max-width: 480px; color: #1A1A1A;">
              <h2 style="color: #1B4332;">You're paired tomorrow ⛳</h2>
              <p>Hi ${recipientFirst || 'there'},</p>
              <p>Quick heads-up on your group for tomorrow's round at <strong>${m.course_name}</strong> — <strong>${timeStr}</strong>:</p>
              <p style="font-size: 18px;">You'll be playing with <strong>${namesText}</strong>.</p>
              <p>This was a self-grouped tee time — everyone booked separately and was paired by us. Show up 10 minutes early, introduce yourself on the first tee, and have a great round.</p>
              <p style="color: #6B7770; font-size: 13px; margin-top: 24px;">— TeeAhead</p>
            </div>
          `,
        })

        await admin
          .from('bookings')
          .update({ pairing_notification_sent_at: new Date().toISOString() })
          .eq('id', m.booking_id)

        sent++
      } catch (e) {
        console.error(`[pairing] failed for booking ${m.booking_id}:`, e)
        errors++
      }
    }
  }

  return { sent, errors, skipped }
}

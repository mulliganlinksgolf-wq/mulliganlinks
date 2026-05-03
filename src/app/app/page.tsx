// src/app/app/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAndIssueMemberCredits } from '@/app/actions/booking'
import { RoundCard } from '@/components/app/RoundCard'
import { RequestButton } from '@/components/ServiceRequest/RequestButton'
import type { MemberTier } from '@/lib/member-dashboard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships')
    .select('tier, status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  const tier = (membership?.tier ?? 'free') as MemberTier

  const [{ data: profile }, { data: pointsData }, { data: bookings }, creditCents] =
    await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', user.id).single(),
      supabase.from('fairway_points').select('amount').eq('user_id', user.id),
      supabase
        .from('bookings')
        .select('id, total_paid, status, tee_times(scheduled_at, course_id, courses(name))')
        .eq('user_id', user.id)
        .in('status', ['confirmed', 'completed'])
        .order('created_at', { ascending: false })
        .limit(20),
      getAndIssueMemberCredits(user.id, tier),
    ])

  const pointsBalance = (pointsData ?? []).reduce((sum, r) => sum + (r.amount as number), 0)
  const firstName = (profile?.full_name as string | null)?.split(' ')[0] ?? 'there'

  const now = new Date().toISOString()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typedBookings = (bookings ?? []) as any[]
  // Count rounds played = completed status OR confirmed with a past tee time
  const completedBookings = typedBookings.filter(
    b => b.status === 'completed' || (b.status === 'confirmed' && b.tee_times?.scheduled_at < now)
  )
  const upcomingRaw = typedBookings.find(
    b => b.status === 'confirmed' && b.tee_times?.scheduled_at > now
  )
  const lastCompletedRaw = completedBookings[0] ?? null

  const upcomingBooking = upcomingRaw
    ? {
        id: upcomingRaw.id as string,
        course_name: upcomingRaw.tee_times?.courses?.name ?? 'Course',
        scheduled_at: upcomingRaw.tee_times?.scheduled_at as string,
        total_price: upcomingRaw.total_paid as number,
      }
    : null

  const lastCompletedBooking = lastCompletedRaw
    ? {
        id: lastCompletedRaw.id as string,
        course_name: lastCompletedRaw.tee_times?.courses?.name ?? 'Course',
        scheduled_at: lastCompletedRaw.tee_times?.scheduled_at as string,
        total_price: lastCompletedRaw.total_paid as number,
      }
    : null

  return (
    <>
      <RoundCard
        firstName={firstName}
        tier={tier}
        pointsBalance={pointsBalance}
        creditCents={creditCents}
        completedRoundsCount={completedBookings.length}
        upcomingBooking={upcomingBooking}
        lastCompletedBooking={lastCompletedBooking}
      />
      {upcomingRaw?.tee_times?.course_id && upcomingRaw?.tee_times?.scheduled_at && (
        <RequestButton
          courseId={upcomingRaw.tee_times.course_id}
          bookingId={upcomingRaw.id}
          teeTime={upcomingRaw.tee_times.scheduled_at}
        />
      )}
    </>
  )
}

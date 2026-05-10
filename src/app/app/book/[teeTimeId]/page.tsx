import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { BookingForm } from '@/components/BookingForm'
import { BookingPaymentForm } from '@/components/BookingPaymentForm'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAndIssueMemberCredits } from '@/app/actions/booking'
import { getAvailablePasses } from '@/app/actions/guestPasses'
import { COMP_DEFAULT } from '@/lib/redemption'

export default async function BookPage({
  params,
}: {
  params: Promise<{ teeTimeId: string }>
}) {
  const { teeTimeId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: teeTime } = await admin
    .from('tee_times')
    .select('id, scheduled_at, available_players, base_price, status, courses(id, name, slug, city, state, stripe_account_id, stripe_charges_enabled)')
    .eq('id', teeTimeId)
    .single()

  if (!teeTime || teeTime.status !== 'open' || teeTime.available_players < 1) notFound()

  const { data: membership } = await supabase
    .from('memberships')
    .select('tier, comp_rounds_remaining, comp_rounds_reset_at')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  const tier = membership?.tier ?? 'free'

  const course = teeTime.courses as any
  const stripeEnabled = course?.stripe_charges_enabled === true

  // Display-correct comp rounds (if anniversary has passed, show the reset value without writing)
  const resetAt = membership?.comp_rounds_reset_at ? new Date(membership.comp_rounds_reset_at) : null
  const compRoundsRemaining = resetAt && resetAt < new Date()
    ? (COMP_DEFAULT[tier] ?? 0)
    : (membership?.comp_rounds_remaining ?? 0)

  const [{ data: pointsRows }, creditBalanceCents, availablePasses, { data: redemptionSettings }] = await Promise.all([
    supabase.from('fairway_points').select('amount').eq('user_id', user.id),
    getAndIssueMemberCredits(user.id, tier),
    getAvailablePasses(user.id),
    supabase
      .from('course_redemption_settings')
      .select('points_threshold')
      .eq('course_id', (teeTime.courses as any)?.id)
      .single(),
  ])

  const pointsThreshold = (redemptionSettings as { points_threshold: number } | null)?.points_threshold ?? 5000

  const pointsBalance = pointsRows?.reduce((s, r) => s + r.amount, 0) ?? 0

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          {stripeEnabled ? 'Complete Booking' : 'Confirm Booking'}
        </h1>
        <p className="text-[#8FA889] mt-1">
          {course?.name} · {new Date(teeTime.scheduled_at).toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Detroit',
          })}
        </p>
      </div>

      {stripeEnabled ? (
        <BookingPaymentForm
          teeTime={teeTime as any}
          tier={tier}
          userId={user.id}
          availablePasses={availablePasses}
        />
      ) : (
        <BookingForm
          teeTime={teeTime as any}
          tier={tier}
          pointsBalance={pointsBalance}
          creditBalanceCents={creditBalanceCents}
          userId={user.id}
          availablePasses={availablePasses}
          compRoundsRemaining={compRoundsRemaining}
          compRoundsResetAt={membership?.comp_rounds_reset_at}
          pointsThreshold={pointsThreshold}
        />
      )}
    </div>
  )
}

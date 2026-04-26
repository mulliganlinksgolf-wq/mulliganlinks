import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { BookingForm } from '@/components/BookingForm'

export default async function BookPage({
  params,
}: {
  params: Promise<{ teeTimeId: string }>
}) {
  const { teeTimeId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: teeTime } = await supabase
    .from('tee_times')
    .select('id, scheduled_at, available_players, base_price, status, courses(id, name, slug, city, state)')
    .eq('id', teeTimeId)
    .single()

  if (!teeTime || teeTime.status !== 'open' || teeTime.available_players < 1) notFound()

  const { data: membership } = await supabase
    .from('memberships')
    .select('tier')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  const tier = membership?.tier ?? 'free'

  const { data: pointsRows } = await supabase
    .from('fairway_points')
    .select('amount')
    .eq('user_id', user.id)

  const pointsBalance = pointsRows?.reduce((s, r) => s + r.amount, 0) ?? 0

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Confirm Booking</h1>
        <p className="text-[#6B7770] mt-1">
          {(teeTime.courses as any)?.name} · {new Date(teeTime.scheduled_at).toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Detroit'
          })}
        </p>
      </div>
      <BookingForm
        teeTime={teeTime as any}
        tier={tier}
        pointsBalance={pointsBalance}
        userId={user.id}
      />
    </div>
  )
}

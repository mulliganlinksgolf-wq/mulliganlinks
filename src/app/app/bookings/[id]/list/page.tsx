import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canCreateListing, calcListingExpiry, formatCredit } from '@/lib/trading'
import { createListing } from '@/app/actions/trading'

export default async function ListBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id: bookingId } = await params
  const { error: errorParam } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: booking } = await admin
    .from('bookings')
    .select(`
      id, status, total_paid, user_id,
      tee_times (
        id, scheduled_at, course_id,
        courses ( name, trading_enabled, trading_min_hours_before )
      )
    `)
    .eq('id', bookingId)
    .single()

  if (!booking || booking.user_id !== user.id) notFound()

  // Check for existing active listing
  const { data: existingListing } = await supabase
    .from('tee_time_listings')
    .select('id')
    .eq('booking_id', bookingId)
    .eq('status', 'active')
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tt = booking.tee_times as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const course = tt?.courses as any

  const eligible = canCreateListing({
    scheduledAt: tt.scheduled_at,
    bookingStatus: booking.status,
    tradingEnabled: course?.trading_enabled ?? false,
    minHoursBefore: course?.trading_min_hours_before ?? 4,
  })

  const creditCents = Math.round((booking.total_paid as number) * 100)
  const expiresAt = eligible
    ? calcListingExpiry(tt.scheduled_at, course?.trading_min_hours_before ?? 4)
    : null

  const scheduledDate = new Date(tt.scheduled_at).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  })

  async function handleList() {
    'use server'
    const result = await createListing(bookingId)
    if (result.error) redirect(`/app/bookings/${bookingId}/list?error=1`)
    else redirect('/app/trading?listed=1')
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <Link href="/app/bookings" className="text-xs text-[#8FA889] hover:text-white">
          ← My Bookings
        </Link>
        <h1 className="text-2xl font-bold font-serif text-white italic mt-1">List This Time</h1>
        <p className="text-sm text-[#8FA889] mt-0.5">
          Another member claims it — you get credit instantly.
        </p>
      </div>

      {/* Booking summary */}
      <div className="rounded-xl p-5 space-y-1" style={{ background: '#163d2a' }}>
        <p className="text-xs text-[#8FA889] uppercase tracking-widest">Your booking</p>
        <p className="text-white font-semibold">{course?.name}</p>
        <p className="text-sm text-[#8FA889]">{scheduledDate}</p>
        <p className="text-sm text-[#8FA889]">
          Paid: {formatCredit(creditCents)}
        </p>
      </div>

      {errorParam === '1' && (
        <div className="rounded-xl p-4" style={{ background: '#163d2a', border: '1px solid #ef4444' }}>
          <p className="text-red-400 text-sm font-semibold">Couldn't list this time</p>
          <p className="text-xs text-[#8FA889] mt-1">
            The course may have disabled trading, or this booking was already listed. Try again or contact support.
          </p>
        </div>
      )}

      {existingListing ? (
        <div className="rounded-xl p-5" style={{ background: '#163d2a' }}>
          <p className="text-emerald-400 font-semibold text-sm">✓ Already listed</p>
          <p className="text-xs text-[#8FA889] mt-1">
            This time is already on the trading board. Check{' '}
            <Link href="/app/trading" className="underline hover:text-white">Available Times</Link>{' '}
            to see it.
          </p>
        </div>
      ) : !eligible ? (
        <div className="rounded-xl p-5" style={{ background: '#163d2a' }}>
          <p className="text-red-400 font-semibold text-sm">Not eligible for trading</p>
          <p className="text-xs text-[#8FA889] mt-1">
            {!course?.trading_enabled
              ? 'This course hasn\'t enabled member trading yet.'
              : 'This tee time is too soon to list — the window has passed.'}
          </p>
        </div>
      ) : (
        <>
          {/* Credit callout */}
          <div className="rounded-xl p-5" style={{ background: '#0f2d1d', border: '1px solid #1d4c36' }}>
            <p className="text-[10px] uppercase tracking-widest text-[#8FA889] mb-1">If claimed, you receive</p>
            <p className="text-3xl font-bold text-white">{formatCredit(creditCents)}</p>
            <p className="text-xs text-[#8FA889] mt-1">
              TeeAhead credit · usable at any partner course
            </p>
            {expiresAt && (
              <p className="text-[10px] text-[#8FA889]/60 mt-2">
                Listing expires {expiresAt.toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                })} if unclaimed
              </p>
            )}
          </div>

          <p className="text-xs text-[#8FA889]">
            If nobody claims it before the listing expires, your booking remains as-is and the
            course&apos;s normal cancellation policy applies.
          </p>

          <form action={handleList}>
            <button
              type="submit"
              className="w-full rounded-xl py-3.5 text-sm font-semibold text-[#0a0a0a] transition-colors"
              style={{ background: '#E0A800' }}
            >
              List This Time
            </button>
          </form>
        </>
      )}
    </div>
  )
}

import { related } from '@/lib/supabase/related'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { CancelBookingButton } from '@/components/CancelBookingButton'
import { RequestButton } from '@/components/ServiceRequest/RequestButton'

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) notFound()
  const { data: booking } = await createAdminClient()
    .from('bookings')
    .select(`
      id, players, total_paid, status, created_at, points_awarded, cancellation_requested_at, refunded_amount_cents,
      tee_times(scheduled_at, course_id, courses(name, city, state, slug, service_requests_enabled))
    `)
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!booking) notFound()

  const tt = booking.tee_times
  const course = related(tt)?.courses
  const scheduledAt = new Date(related(tt)?.scheduled_at)
  // eslint-disable-next-line react-hooks/purity -- Request-time calculation in an async Server Component.
  const canCancel = booking.status === 'pending_payment' || (booking.status === 'confirmed' && (booking.cancellation_requested_at || scheduledAt.getTime() - Date.now() > 60 * 60 * 1000))

  const calendarDate = scheduledAt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const googleCalLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Tee+Time+at+${encodeURIComponent(related(course)?.name ?? '')}&dates=${calendarDate}/${calendarDate}&details=Booked+via+TeeAhead`

  return (
    <div className="max-w-lg space-y-6">
      {booking.status === 'confirmed' && !booking.cancellation_requested_at && (
        <div className="bg-[#1B4332] text-[#FAF7F2] rounded-lg px-5 py-4">
          <p className="font-bold text-lg">You&apos;re on the tee. ⛳</p>
          <p className="text-[#FAF7F2]/80 text-sm mt-1">Booking confirmed. See you out there.</p>
        </div>
      )}

      {booking.cancellation_requested_at && booking.status !== 'canceled' && <p role="status">Your cancellation is being processed. You can retry below to check its progress.</p>}
      {booking.status === 'pending_payment' && !booking.cancellation_requested_at && <p role="status">Payment is awaiting confirmation. Refresh shortly if you just paid. Unpaid reservations expire after 15 minutes.</p>}
      {booking.refunded_amount_cents > 0 && <p role="status">Refund issued: ${(booking.refunded_amount_cents / 100).toFixed(2)}. Your bank may take several days to show it.</p>}
      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="pt-5 pb-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-[#6B7770]">Course</span>
            <span className="font-medium text-[#1A1A1A]">{related(course)?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6B7770]">Date & time</span>
            <span className="font-medium text-[#1A1A1A]">
              {scheduledAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
              {scheduledAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6B7770]">Players</span>
            <span className="font-medium text-[#1A1A1A]">{booking.players}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6B7770]">Total paid</span>
            <span className="font-medium text-[#1A1A1A]">${booking.total_paid.toFixed(2)}</span>
          </div>
          {booking.points_awarded > 0 && booking.status !== 'canceled' && (
            <div className="flex justify-between text-[#1B4332]">
              <span>{booking.status === 'completed' ? 'Points earned' : 'Points after your round'}</span>
              <span className="font-medium">+{booking.points_awarded}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[#6B7770]">Status</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
              booking.status === 'completed' ? 'bg-[#8FA889]/20 text-[#1B4332]' :
              'bg-red-100 text-red-700'
            }`}>{booking.status}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 flex-wrap">
        <a
          href={googleCalLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm px-4 py-2 border rounded hover:bg-gray-50 text-[#6B7770]"
        >
          Add to Google Calendar
        </a>
        <Link href="/app/bookings" className="text-sm px-4 py-2 border rounded hover:bg-gray-50 text-[#6B7770]">
          All bookings
        </Link>
      </div>

      {canCancel && <CancelBookingButton bookingId={booking.id} />}

      {related(tt)?.course_id && related(tt)?.scheduled_at && (
        <RequestButton
          courseId={related(tt)!.course_id}
          bookingId={booking.id}
          teeTime={related(tt)!.scheduled_at}
          serviceRequestsEnabled={related(course)?.service_requests_enabled ?? true}
        />
      )}
    </div>
  )
}

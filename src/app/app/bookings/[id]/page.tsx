import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { CancelBookingButton } from '@/components/CancelBookingButton'

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      id, players, total_paid, status, created_at, points_awarded,
      tee_times(scheduled_at, courses(name, city, state, slug))
    `)
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!booking) notFound()

  const course = (booking.tee_times as any)?.courses
  const scheduledAt = new Date((booking.tee_times as any)?.scheduled_at)
  const canCancel = booking.status === 'confirmed' && scheduledAt.getTime() - Date.now() > 60 * 60 * 1000

  const calendarDate = scheduledAt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const googleCalLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Tee+Time+at+${encodeURIComponent(course?.name ?? '')}&dates=${calendarDate}/${calendarDate}&details=Booked+via+TeeAhead`

  return (
    <div className="max-w-lg space-y-6">
      {booking.status === 'confirmed' && (
        <div className="bg-[#1B4332] text-[#FAF7F2] rounded-lg px-5 py-4">
          <p className="font-bold text-lg">You&apos;re on the tee. ⛳</p>
          <p className="text-[#FAF7F2]/80 text-sm mt-1">Booking confirmed. See you out there.</p>
        </div>
      )}

      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="pt-5 pb-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-[#6B7770]">Course</span>
            <span className="font-medium text-[#1A1A1A]">{course?.name}</span>
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
          {booking.points_awarded > 0 && (
            <div className="flex justify-between text-[#1B4332]">
              <span>Points earned</span>
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
    </div>
  )
}

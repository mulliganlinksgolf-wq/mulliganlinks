import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

export default async function BookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`id, players, total_paid, status, created_at, tee_times(scheduled_at, courses(name))`)
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const upcoming = bookings?.filter(b => b.status === 'confirmed' && new Date((b.tee_times as any)?.scheduled_at) > new Date()) ?? []
  const past = bookings?.filter(b => !upcoming.includes(b)) ?? []

  const BookingRow = ({ b }: { b: any }) => (
    <Link href={`/app/bookings/${b.id}`}>
      <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="py-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-[#1A1A1A]">{b.tee_times?.courses?.name ?? 'Course'}</p>
            <p className="text-sm text-[#6B7770]">
              {new Date(b.tee_times?.scheduled_at).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
              })} · {b.players} player{b.players !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-[#1A1A1A]">${b.total_paid.toFixed(2)}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
              b.status === 'completed' ? 'bg-[#8FA889]/20 text-[#1B4332]' :
              'bg-red-100 text-red-700'
            }`}>{b.status}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[#1A1A1A]">My Bookings</h1>
      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#6B7770] uppercase tracking-wide">Upcoming</h2>
          {upcoming.map(b => <BookingRow key={b.id} b={b} />)}
        </div>
      )}
      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#6B7770] uppercase tracking-wide">Past</h2>
          {past.map(b => <BookingRow key={b.id} b={b} />)}
        </div>
      )}
      {(!bookings || bookings.length === 0) && (
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <p className="text-[#6B7770]">No bookings yet.</p>
            <Link href="/app/courses" className="inline-block mt-4 px-4 py-2 bg-[#1B4332] text-[#FAF7F2] rounded text-sm">
              Find a course
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

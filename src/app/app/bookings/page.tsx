// src/app/app/bookings/page.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function BookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, players, total_paid, status, created_at, tee_times(scheduled_at, courses(name))')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const now = new Date().toISOString()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typed = (bookings ?? []) as any[]
  const upcoming = typed.filter(
    b => b.status === 'confirmed' && b.tee_times?.scheduled_at > now
  )
  const past = typed.filter(b => !upcoming.includes(b))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const BookingRow = ({ b, isUpcoming = false }: { b: any; isUpcoming?: boolean }) => (
    <Link
      href={`/app/bookings/${b.id}`}
      className="block border-b border-[#1d4c36] last:border-0 hover:bg-[#333]/30 transition-colors"
    >
      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-semibold text-white text-sm">
            {b.tee_times?.courses?.name ?? 'Course'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: isUpcoming ? '#8FA889' : '#555' }}>
            {new Date(b.tee_times?.scheduled_at).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}{' '}
            · {b.players} player{b.players !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-white text-sm">
            ${(b.total_paid as number).toFixed(2)}
          </p>
          <span
            className="text-[10px]"
            style={{
              color:
                b.status === 'confirmed'
                  ? '#8FA889'
                  : b.status === 'completed'
                  ? '#888'
                  : '#ef4444',
            }}
          >
            {b.status}
          </span>
        </div>
      </div>
    </Link>
  )

  return (
    <div>
      {/* Inline header */}
      <div className="mb-6">
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#aaa] font-sans mb-1">
          My Bookings
        </p>
        <h1 className="text-2xl font-bold font-serif text-white italic">Your rounds.</h1>
      </div>

      {/* Content */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#1B4332' }}>
        {!bookings || bookings.length === 0 ? (
          <div className="p-8 text-center" style={{ background: '#163d2a' }}>
            <p style={{ color: '#888' }}>No bookings yet.</p>
            <Link
              href="/app/courses"
              className="inline-block mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-[#FAF7F2]"
              style={{ background: '#1B4332' }}
            >
              Find a course
            </Link>
          </div>
        ) : (
          <div style={{ background: '#163d2a' }}>
            {upcoming.length > 0 && (
              <>
                <div className="px-4 py-1.5" style={{ background: '#0f2d1d' }}>
                  <span className="text-[8px] uppercase tracking-widest font-sans" style={{ color: '#555' }}>
                    Upcoming
                  </span>
                </div>
                {upcoming.map(b => (
                  <BookingRow key={b.id} b={b} isUpcoming />
                ))}
              </>
            )}
            {past.length > 0 && (
              <>
                <div className="px-4 py-1.5" style={{ background: '#0f2d1d' }}>
                  <span className="text-[8px] uppercase tracking-widest font-sans" style={{ color: '#555' }}>
                    Past
                  </span>
                </div>
                {past.map(b => (
                  <BookingRow key={b.id} b={b} />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

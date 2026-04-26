import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ date?: string }>
}) {
  const { slug } = await params
  const { date: dateParam } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()
  if (!course) notFound()

  // Get member tier for discount display
  const { data: membership } = await supabase
    .from('memberships')
    .select('tier')
    .eq('user_id', user!.id)
    .eq('status', 'active')
    .single()

  const tier = membership?.tier ?? 'free'
  const discountPct = tier === 'ace' ? 15 : tier === 'eagle' ? 10 : 0

  const selectedDate = dateParam ?? new Date().toISOString().split('T')[0]
  const nextDate = new Date(selectedDate + 'T00:00:00')
  nextDate.setDate(nextDate.getDate() + 1)
  const prevDate = new Date(selectedDate + 'T00:00:00')
  prevDate.setDate(prevDate.getDate() - 1)
  const fmt = (d: Date) => d.toISOString().split('T')[0]

  const { data: teeTimes } = await supabase
    .from('tee_times')
    .select('id, scheduled_at, available_players, base_price, status')
    .eq('course_id', course.id)
    .eq('status', 'open')
    .gte('scheduled_at', selectedDate + 'T00:00:00+00:00')
    .lte('scheduled_at', selectedDate + 'T23:59:59+00:00')
    .gt('available_players', 0)
    .order('scheduled_at')

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

  const formatDate = (s: string) =>
    new Date(s + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  // Group by morning/afternoon/evening
  const groups: Record<string, typeof teeTimes> = { Morning: [], Afternoon: [], Evening: [] }
  for (const tt of teeTimes ?? []) {
    const hour = new Date(tt.scheduled_at).getHours()
    if (hour < 12) groups.Morning!.push(tt)
    else if (hour < 17) groups.Afternoon!.push(tt)
    else groups.Evening!.push(tt)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/app/courses" className="text-sm text-[#6B7770] hover:text-[#1A1A1A]">← All courses</Link>
        <h1 className="text-2xl font-bold text-[#1A1A1A] mt-2">{course.name}</h1>
        <p className="text-[#6B7770]">{course.address}, {course.city}, {course.state}</p>
        {discountPct > 0 && (
          <span className="inline-block mt-2 text-xs bg-[#E0A800]/20 text-[#92700a] px-3 py-1 rounded-full font-medium">
            {discountPct}% member discount applied
          </span>
        )}
      </div>

      {/* Date picker */}
      <div className="flex items-center gap-2">
        <Link href={`?date=${fmt(prevDate)}`} className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 text-[#6B7770] bg-white">← Prev</Link>
        <span className="text-sm font-medium text-[#1A1A1A] px-2">{formatDate(selectedDate)}</span>
        <Link href={`?date=${fmt(nextDate)}`} className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 text-[#6B7770] bg-white">Next →</Link>
      </div>

      {/* Tee times */}
      {Object.entries(groups).map(([label, slots]) =>
        slots && slots.length > 0 ? (
          <div key={label}>
            <h2 className="text-sm font-semibold text-[#6B7770] uppercase tracking-wide mb-3">{label}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {slots.map(tt => {
                const price = tt.base_price * (1 - discountPct / 100)
                return (
                  <Link
                    key={tt.id}
                    href={`/app/book/${tt.id}`}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:border-[#1B4332] hover:shadow-sm transition-all text-center"
                  >
                    <p className="font-semibold text-[#1A1A1A]">{formatTime(tt.scheduled_at)}</p>
                    <p className="text-xs text-[#6B7770] mt-1">{tt.available_players} spot{tt.available_players !== 1 ? 's' : ''} left</p>
                    <p className="text-sm font-medium text-[#1B4332] mt-2">${price.toFixed(2)}</p>
                    {discountPct > 0 && (
                      <p className="text-xs text-[#6B7770] line-through">${tt.base_price.toFixed(2)}</p>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ) : null
      )}

      {(!teeTimes || teeTimes.length === 0) && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-[#6B7770]">No available tee times for this date.</p>
          <p className="text-sm text-[#6B7770] mt-1">Try a different date.</p>
        </div>
      )}
    </div>
  )
}

import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { TeeSheetGrid } from '@/components/course/TeeSheetGrid'

export default async function ViewAsCoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ date?: string }>
}) {
  const { slug } = await params
  const { date: dateParam } = await searchParams
  const admin = createAdminClient()

  const { data: course } = await admin
    .from('courses')
    .select('id, name, slug, city, state, status')
    .eq('slug', slug)
    .single()

  if (!course) notFound()

  const selectedDate = dateParam ?? new Date().toISOString().split('T')[0]
  const nextDate = (() => { const d = new Date(selectedDate + 'T12:00:00'); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] })()
  const prevDate = (() => { const d = new Date(selectedDate + 'T12:00:00'); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0] })()

  const formatDate = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const { data: teeTimes } = await admin
    .from('tee_times')
    .select(`
      id, scheduled_at, max_players, available_players, base_price, status,
      bookings(id, players, total_paid, status, user_id,
        profiles(full_name)
      )
    `)
    .eq('course_id', course.id)
    .gte('scheduled_at', selectedDate + 'T00:00:00+00:00')
    .lte('scheduled_at', selectedDate + 'T23:59:59+00:00')
    .order('scheduled_at')

  // Dashboard stats for the banner
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const { data: todayBookings } = await admin
    .from('bookings')
    .select('total_paid, tee_times!inner(course_id, scheduled_at)')
    .eq('tee_times.course_id', course.id)
    .gte('tee_times.scheduled_at', today.toISOString())
    .neq('status', 'canceled')

  const todayRevenue = (todayBookings ?? []).reduce((s, b) => s + Number(b.total_paid), 0)

  const openSlots = (teeTimes ?? []).filter(t => t.status === 'open').length
  const bookedSlots = (teeTimes ?? []).filter(t => t.status === 'booked').length

  return (
    <div className="space-y-6">
      {/* Admin banner */}
      <div className="bg-amber-50 border border-amber-300 rounded-xl px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-amber-600 font-bold text-sm">Admin View</span>
          <span className="text-amber-700 text-sm">You are viewing the course portal for <strong>{course.name}</strong></span>
        </div>
        <Link href="/admin/courses" className="text-xs text-amber-600 hover:text-amber-800 font-medium underline">
          ← Back to courses
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-[#1B4332]">{todayBookings?.length ?? 0}</p>
          <p className="text-xs text-[#6B7770] mt-0.5">Today&apos;s bookings</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-[#1A1A1A]">${todayRevenue.toFixed(0)}</p>
          <p className="text-xs text-[#6B7770] mt-0.5">Today&apos;s revenue</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-[#1A1A1A]">{bookedSlots}/{openSlots + bookedSlots}</p>
          <p className="text-xs text-[#6B7770] mt-0.5">Slots filled today</p>
        </div>
      </div>

      {/* Tee sheet — identical to what course staff see */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#1A1A1A]">{formatDate(new Date(selectedDate + 'T12:00:00'))}</h1>
          <div className="flex items-center gap-2">
            <Link href={`?date=${prevDate}`} className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 text-[#6B7770]">← Prev</Link>
            <Link href={`/admin/courses/${slug}/view`} className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 text-[#6B7770]">Today</Link>
            <Link href={`?date=${nextDate}`} className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 text-[#6B7770]">Next →</Link>
          </div>
        </div>

        {!teeTimes || teeTimes.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-[#6B7770]">No tee times for this date.</p>
          </div>
        ) : (
          <TeeSheetGrid teeTimes={teeTimes as any} slug={slug} />
        )}
      </div>

      {/* Admin-only: course metadata */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-2 text-sm">
        <p className="font-bold text-amber-800">Admin info (not visible to course staff)</p>
        <p className="text-amber-700">Course ID: <code className="font-mono text-xs bg-amber-100 px-1 py-0.5 rounded">{course.id}</code></p>
        <p className="text-amber-700">Slug: <code className="font-mono text-xs bg-amber-100 px-1 py-0.5 rounded">{course.slug}</code></p>
        <p className="text-amber-700">Status: {course.status}</p>
        <div className="flex gap-3 pt-1">
          <Link href={`/course/${slug}`} target="_blank" className="text-xs text-[#1B4332] underline">Open real course portal ↗</Link>
          <Link href={`/course/${slug}/bookings`} target="_blank" className="text-xs text-[#1B4332] underline">View bookings ↗</Link>
          <Link href={`/course/${slug}/check-in`} target="_blank" className="text-xs text-[#1B4332] underline">Check-in ↗</Link>
          <Link href={`/course/${slug}/dashboard`} target="_blank" className="text-xs text-[#1B4332] underline">Dashboard ↗</Link>
        </div>
      </div>
    </div>
  )
}

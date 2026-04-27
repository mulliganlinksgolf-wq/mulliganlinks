import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { TeeSheetGrid } from '@/components/course/TeeSheetGrid'

export default async function TeeSheetPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ date?: string }>
}) {
  const { slug } = await params
  const { date: dateParam } = await searchParams

  const selectedDate = dateParam
    ? new Date(dateParam + 'T00:00:00')
    : new Date()

  const dateStr = selectedDate.toISOString().split('T')[0]

  const nextDate = new Date(selectedDate)
  nextDate.setDate(nextDate.getDate() + 1)
  const prevDate = new Date(selectedDate)
  prevDate.setDate(prevDate.getDate() - 1)

  const supabase = await createClient()

  const { data: course } = await supabase
    .from('courses')
    .select('id, name')
    .eq('slug', slug)
    .single()

  if (!course) notFound()

  const startOfDay = `${dateStr}T00:00:00+00:00`
  const endOfDay = `${dateStr}T23:59:59+00:00`

  const { data: teeTimes } = await supabase
    .from('tee_times')
    .select(`
      id, scheduled_at, max_players, available_players, base_price, status,
      bookings(id, players, total_paid, status, user_id, guest_name, guest_phone, payment_method,
        profiles(full_name)
      )
    `)
    .eq('course_id', course.id)
    .gte('scheduled_at', startOfDay)
    .lte('scheduled_at', endOfDay)
    .order('scheduled_at')

  const formatDate = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const formatDateParam = (d: Date) => d.toISOString().split('T')[0]

  return (
    <div className="space-y-4">
      {/* Date navigator */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1A1A1A]">{formatDate(selectedDate)}</h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/course/${slug}?date=${formatDateParam(prevDate)}`}
            className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 text-[#6B7770]"
          >
            ← Prev
          </Link>
          <Link
            href={`/course/${slug}`}
            className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 text-[#6B7770]"
          >
            Today
          </Link>
          <Link
            href={`/course/${slug}?date=${formatDateParam(nextDate)}`}
            className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 text-[#6B7770]"
          >
            Next →
          </Link>
          <Link
            href={`/course/${slug}/tee-times/create`}
            className="px-3 py-1.5 text-sm bg-[#1B4332] text-[#FAF7F2] rounded hover:bg-[#1B4332]/90"
          >
            + Create Tee Times
          </Link>
        </div>
      </div>

      {/* Tee sheet */}
      {!teeTimes || teeTimes.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-[#6B7770]">No tee times for this date.</p>
          <Link
            href={`/course/${slug}/tee-times/create`}
            className="inline-block mt-4 px-4 py-2 bg-[#1B4332] text-[#FAF7F2] rounded hover:bg-[#1B4332]/90 text-sm"
          >
            Create Tee Times
          </Link>
        </div>
      ) : (
        <TeeSheetGrid teeTimes={teeTimes as any} slug={slug} />
      )}
    </div>
  )
}

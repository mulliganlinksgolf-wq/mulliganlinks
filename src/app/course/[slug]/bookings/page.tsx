import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function CourseBookingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ status?: string; range?: string }>
}) {
  const { slug } = await params
  const { status: statusFilter, range } = await searchParams
  const supabase = await createClient()

  const { data: course } = await supabase
    .from('courses')
    .select('id, name')
    .eq('slug', slug)
    .single()
  if (!course) notFound()

  let query = supabase
    .from('bookings')
    .select(`
      id, players, total_paid, status, created_at, points_awarded, guest_name, guest_phone, payment_method,
      tee_times!inner(scheduled_at, course_id),
      profiles(full_name, phone)
    `)
    .eq('tee_times.course_id', course.id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const now = new Date()
  if (range === 'today') {
    query = query.gte('tee_times.scheduled_at', new Date(now.setHours(0,0,0,0)).toISOString())
  } else if (range === 'week') {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
    query = query.gte('created_at', weekAgo.toISOString())
  } else if (range === 'month') {
    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30)
    query = query.gte('created_at', monthAgo.toISOString())
  }

  const { data: bookings } = await query

  const statuses = [
    { value: 'all', label: 'All' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'canceled', label: 'Canceled' },
    { value: 'no_show', label: 'No show' },
  ]
  const ranges = [
    { value: '', label: 'All time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Last 7 days' },
    { value: 'month', label: 'Last 30 days' },
  ]

  const totalRevenue = bookings?.filter(b => b.status !== 'canceled')
    .reduce((sum, b) => sum + (b.total_paid ?? 0), 0) ?? 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1A1A1A]">Bookings</h1>
        <div className="text-sm text-[#6B7770]">
          {bookings?.length ?? 0} bookings · ${totalRevenue.toFixed(2)} revenue
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {statuses.map(s => (
          <a
            key={s.value}
            href={`?status=${s.value}&range=${range ?? ''}`}
            className={`px-3 py-1 text-xs rounded-full border font-medium capitalize transition-colors ${
              (statusFilter ?? 'all') === s.value
                ? 'bg-[#1B4332] text-[#FAF7F2] border-[#1B4332]'
                : 'bg-white text-[#6B7770] border-gray-200 hover:border-[#1B4332]'
            }`}
          >
            {s.label}
          </a>
        ))}
        <span className="w-px bg-gray-200 mx-1" />
        {ranges.map(r => (
          <a
            key={r.value}
            href={`?status=${statusFilter ?? 'all'}&range=${r.value}`}
            className={`px-3 py-1 text-xs rounded-full border font-medium transition-colors ${
              (range ?? '') === r.value
                ? 'bg-[#1B4332] text-[#FAF7F2] border-[#1B4332]'
                : 'bg-white text-[#6B7770] border-gray-200 hover:border-[#1B4332]'
            }`}
          >
            {r.label}
          </a>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#6B7770] uppercase tracking-wide">Golfer</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#6B7770] uppercase tracking-wide">Tee Time</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#6B7770] uppercase tracking-wide">Players</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#6B7770] uppercase tracking-wide">Paid</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#6B7770] uppercase tracking-wide">Method</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#6B7770] uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#6B7770] uppercase tracking-wide">Booked</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!bookings || bookings.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[#6B7770]">No bookings found.</td></tr>
            ) : bookings.map((b: any) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium text-[#1A1A1A]">
                  {b.profiles?.full_name ?? b.guest_name ?? '—'}
                  {!b.profiles && b.guest_name && (
                    <span className="ml-1.5 text-xs text-[#6B7770] font-normal">walk-in</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-[#6B7770]">
                  {new Date(b.tee_times?.scheduled_at).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                  })}
                </td>
                <td className="px-4 py-2.5 text-[#6B7770]">{b.players}</td>
                <td className="px-4 py-2.5 font-medium text-[#1A1A1A]">${b.total_paid?.toFixed(2)}</td>
                <td className="px-4 py-2.5 text-[#6B7770] capitalize text-xs">
                  {b.payment_method ?? '—'}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    b.status === 'completed' ? 'bg-[#8FA889]/20 text-[#1B4332]' :
                    b.status === 'no_show' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>{b.status}</span>
                </td>
                <td className="px-4 py-2.5 text-[#6B7770] text-xs">
                  {new Date(b.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

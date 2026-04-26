import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function CourseDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: course } = await supabase
    .from('courses')
    .select('id, name')
    .eq('slug', slug)
    .single()
  if (!course) notFound()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7)

  // Today's bookings
  const { data: todayBookings } = await supabase
    .from('bookings')
    .select('id, total_paid, status, tee_times!inner(scheduled_at, course_id)')
    .eq('tee_times.course_id', course.id)
    .gte('tee_times.scheduled_at', today.toISOString())
    .neq('status', 'canceled')

  // This week revenue
  const { data: weekBookings } = await supabase
    .from('bookings')
    .select('total_paid, tee_times!inner(course_id)')
    .eq('tee_times.course_id', course.id)
    .gte('created_at', weekStart.toISOString())
    .neq('status', 'canceled')

  // Last 30 days utilization: tee times created vs booked
  const { data: teeTimes30 } = await supabase
    .from('tee_times')
    .select('id, status')
    .eq('course_id', course.id)
    .gte('scheduled_at', thirtyDaysAgo.toISOString())

  // Top 5 members by spend at this course
  const { data: topSpenders } = await supabase
    .from('bookings')
    .select('user_id, total_paid, profiles!inner(full_name), tee_times!inner(course_id)')
    .eq('tee_times.course_id', course.id)
    .neq('status', 'canceled')
    .order('total_paid', { ascending: false })
    .limit(50)

  const todayRevenue = todayBookings?.reduce((s, b) => s + (b.total_paid ?? 0), 0) ?? 0
  const weekRevenue = weekBookings?.reduce((s, b) => s + (b.total_paid ?? 0), 0) ?? 0
  const totalSlots = teeTimes30?.length ?? 0
  const bookedSlots = teeTimes30?.filter(t => t.status === 'booked').length ?? 0
  const utilizationPct = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0

  // Aggregate top spenders
  const spenderMap = new Map<string, { name: string; spent: number }>()
  for (const b of topSpenders ?? []) {
    const e = spenderMap.get(b.user_id)
    if (e) e.spent += b.total_paid ?? 0
    else spenderMap.set(b.user_id, { name: (b.profiles as any)?.full_name ?? '—', spent: b.total_paid ?? 0 })
  }
  const topMembers = Array.from(spenderMap.values())
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[#1A1A1A]">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white border border-gray-200 shadow-none">
          <CardHeader className="pb-1 pt-4 px-4"><CardTitle className="text-xs text-[#6B7770] font-medium uppercase tracking-wide">Today&apos;s Bookings</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-[#1A1A1A]">{todayBookings?.length ?? 0}</p>
            <p className="text-xs text-[#6B7770] mt-0.5">${todayRevenue.toFixed(2)} revenue</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-200 shadow-none">
          <CardHeader className="pb-1 pt-4 px-4"><CardTitle className="text-xs text-[#6B7770] font-medium uppercase tracking-wide">This Week</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-[#1A1A1A]">${weekRevenue.toFixed(2)}</p>
            <p className="text-xs text-[#6B7770] mt-0.5">{weekBookings?.length ?? 0} bookings</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-200 shadow-none">
          <CardHeader className="pb-1 pt-4 px-4"><CardTitle className="text-xs text-[#6B7770] font-medium uppercase tracking-wide">30-Day Utilization</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-[#1A1A1A]">{utilizationPct}%</p>
            <p className="text-xs text-[#6B7770] mt-0.5">{bookedSlots}/{totalSlots} slots</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-200 shadow-none">
          <CardHeader className="pb-1 pt-4 px-4"><CardTitle className="text-xs text-[#6B7770] font-medium uppercase tracking-wide">Active Members</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-[#1A1A1A]">{spenderMap.size}</p>
            <p className="text-xs text-[#6B7770] mt-0.5">have booked here</p>
          </CardContent>
        </Card>
      </div>

      {/* Top members */}
      <div>
        <h2 className="text-sm font-semibold text-[#1A1A1A] mb-3 uppercase tracking-wide">Top Members by Spend</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-medium text-[#6B7770] uppercase tracking-wide">Member</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-[#6B7770] uppercase tracking-wide">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topMembers.length === 0 ? (
                <tr><td colSpan={2} className="px-4 py-6 text-center text-[#6B7770]">No booking data yet.</td></tr>
              ) : topMembers.map((m, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-[#1A1A1A]">{m.name}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-[#1B4332]">${m.spent.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

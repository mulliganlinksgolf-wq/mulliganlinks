import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCourseMetricHistory } from '@/lib/reports/courseMetrics'
import { resolveDateRange } from '@/lib/reports/dateRange'
import { requireManager } from '@/lib/courseRole'
import KpiTile from '@/components/reports/KpiTile'
import DateRangePicker from '@/components/reports/DateRangePicker'
import { PointsBarChart } from './MemberActivityChart'

export default async function MemberActivityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>
}) {
  const { slug } = await params
  await requireManager(slug)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/course/${slug}/login`)

  const admin = createAdminClient()
  const { data: course, error: courseError } = await admin.from('courses').select('id').eq('slug', slug).single()
  if (courseError && courseError.code !== 'PGRST116') throw new Error(`[MemberActivityPage] course query failed: ${courseError.message}`)
  if (!course) notFound()

  const sp = await searchParams
  const dateRange = resolveDateRange(sp.preset, sp.from, sp.to)
  const history = await getCourseMetricHistory(course.id, 12, dateRange.from, dateRange.to)
  const latest = history[history.length - 1]
  const totalAttributed = history.reduce((s, h) => s + h.members_attributed, 0)
  const totalPointsEarned = history.reduce((s, h) => s + h.points_earned, 0)

  const latestMonthLabel = latest?.month
    ? new Date(latest.month + '-01').toLocaleString('en-US', { month: 'long', year: 'numeric' })
    : 'Latest Month'

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[#1A1A1A]">Member Activity</h1>

      <DateRangePicker />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <KpiTile label={`New Members — ${latestMonthLabel}`} value={(latest?.members_attributed ?? 0).toString()} accent />
        <KpiTile label="Total Members Attributed" value={totalAttributed.toLocaleString()} sub="selected period" />
        <KpiTile label="Points Earned" value={totalPointsEarned.toLocaleString()} sub="selected period" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-[#1A1A1A] mb-4">Fairway Points — Earned vs. Redeemed</h2>
        <PointsBarChart data={history} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 id="member-table-heading" className="font-semibold text-[#1A1A1A] mb-4">Monthly Member Activity</h2>
        <table className="w-full text-sm" aria-labelledby="member-table-heading">
          <thead>
            <tr className="border-b border-gray-100">
              {['Month', 'New Members', 'Points Earned', 'Points Redeemed'].map(h => (
                <th key={h} scope="col" className="text-left py-2 px-3 text-xs text-[#6B7770] font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {history.map(row => (
              <tr key={row.month} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2 px-3">{row.month}</td>
                <td className="py-2 px-3">{row.members_attributed}</td>
                <td className="py-2 px-3">{row.points_earned.toLocaleString()}</td>
                <td className="py-2 px-3">{row.points_redeemed.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

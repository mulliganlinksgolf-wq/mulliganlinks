import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCourseMetricHistory } from '@/lib/reports/courseMetrics'
import KpiTile from '@/components/reports/KpiTile'
import { PointsBarChart } from './MemberActivityChart'

export default async function MemberActivityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/course/${slug}/login`)

  const admin = createAdminClient()
  const { data: course, error: courseError } = await admin.from('courses').select('id').eq('slug', slug).single()
  if (courseError && courseError.code !== 'PGRST116') throw new Error(`[MemberActivityPage] course query failed: ${courseError.message}`)
  if (!course) notFound()

  const history = await getCourseMetricHistory(course.id, 12)
  const latest = history[history.length - 1]
  const totalAttributed = history.reduce((s, h) => s + h.members_attributed, 0)

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[#1A1A1A]">Member Activity</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <KpiTile label="New Members This Month" value={(latest?.members_attributed ?? 0).toString()} accent />
        <KpiTile label="Total Members Attributed" value={totalAttributed.toLocaleString()} sub="all time" />
        <KpiTile label="Points Earned This Month" value={(latest?.points_earned ?? 0).toLocaleString()} />
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

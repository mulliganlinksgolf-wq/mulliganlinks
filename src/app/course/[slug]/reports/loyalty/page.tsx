import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getLoyaltyData } from '@/lib/reports/courseMetrics'
import { resolveDateRange } from '@/lib/reports/dateRange'
import { requireManager } from '@/lib/courseRole'
import KpiTile from '@/components/reports/KpiTile'
import CsvExportButton from '@/components/reports/CsvExportButton'
import DateRangePicker from '@/components/reports/DateRangePicker'
import { LoyaltyChart } from './LoyaltyChart'

export default async function LoyaltyReportPage({
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
  const { data: course, error: courseError } = await admin
    .from('courses').select('id').eq('slug', slug).single()
  if (courseError && courseError.code !== 'PGRST116') throw new Error(`[LoyaltyReport] ${courseError.message}`)
  if (!course) notFound()

  const sp = await searchParams
  const dateRange = resolveDateRange(sp.preset, sp.from, sp.to)
  const data = await getLoyaltyData(course.id, dateRange.from, dateRange.to)

  const topVisitor = data.topVisitors[0] ?? null

  const csvData = data.topVisitors.map(row => ({
    Member: row.fullName,
    Tier: row.tier,
    Visits: row.totalVisits,
    'Last Visit': row.lastVisit,
  }))

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Member Loyalty & Repeat Visits</h1>
        <CsvExportButton data={csvData} filename={`${slug}-loyalty.csv`} disabled={csvData.length === 0} />
      </div>

      <DateRangePicker />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiTile label="Avg Visits / Member" value={data.avgVisitsPerMember.toFixed(1)} accent />
        <KpiTile label="3+ Visit Members" value={`${data.threeOrMorePct.toFixed(1)}%`} />
        <KpiTile label="Single-Visit Members" value={data.singleVisitCount.toString()} />
        <KpiTile
          label="Top Visitor"
          value={topVisitor ? `${topVisitor.fullName} (${topVisitor.totalVisits}×)` : '—'}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-[#1A1A1A] mb-4">Visit Frequency Distribution</h2>
        <p className="text-xs text-gray-500 mb-4">Number of members by how many times they visited</p>
        <LoyaltyChart buckets={data.frequencyBuckets} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-[#1A1A1A] mb-4">Top 20 Most Frequent Visitors</h2>
        {data.topVisitors.length === 0 ? (
          <p className="text-sm text-gray-500">No visit data for this period.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Member', 'Tier', 'Visits', 'Last Visit'].map(h => (
                  <th key={h} scope="col" className="text-left py-2 px-3 text-xs text-[#6B7770] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.topVisitors.map(row => (
                <tr key={row.userId} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3 font-medium">{row.fullName}</td>
                  <td className="py-2 px-3 capitalize">{row.tier}</td>
                  <td className="py-2 px-3">{row.totalVisits}</td>
                  <td className="py-2 px-3">{row.lastVisit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

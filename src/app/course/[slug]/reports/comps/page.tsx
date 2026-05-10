import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCompData } from '@/lib/reports/courseMetrics'
import { resolveDateRange } from '@/lib/reports/dateRange'
import { requireManager } from '@/lib/courseRole'
import KpiTile from '@/components/reports/KpiTile'
import CsvExportButton from '@/components/reports/CsvExportButton'
import DateRangePicker from '@/components/reports/DateRangePicker'
import { CompTrendChart } from './CompTrendChart'

export default async function CompRoundsReportPage({
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
  if (courseError && courseError.code !== 'PGRST116') throw new Error(`[CompRoundsReport] ${courseError.message}`)
  if (!course) notFound()

  const sp = await searchParams
  const dateRange = resolveDateRange(sp.preset, sp.from, sp.to)
  const data = await getCompData(course.id, dateRange.from, dateRange.to)

  const csvData = data.perMember.map(row => ({
    Member: row.fullName,
    Tier: row.tier,
    'Comps Redeemed': row.redeemed,
    'Last Redemption': row.lastRedemption,
  }))

  const hasChartData = data.monthly.some(m => m.redeemed > 0)

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Comp Rounds Tracker</h1>
        <CsvExportButton data={csvData} filename={`${slug}-comp-rounds.csv`} disabled={csvData.length === 0} />
      </div>

      <DateRangePicker />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiTile label="Comps Redeemed" value={data.totalRedeemed.toString()} accent />
        <KpiTile label="Est. Cost to Course" value={`$${(data.estimatedCostCents / 100).toFixed(2)}`} />
        <KpiTile label="Members Using Comps" value={data.membersUsingComps.toString()} />
        <KpiTile label="Avg Comps / Member" value={data.avgCompsPerMember.toFixed(1)} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-[#1A1A1A] mb-4">Comp Rounds Trend</h2>
        {hasChartData
          ? <CompTrendChart monthly={data.monthly} />
          : <p className="text-sm text-gray-500">No comp round data for this period.</p>}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-[#1A1A1A] mb-4">Per-Member Comp Usage</h2>
        {data.perMember.length === 0 ? (
          <p className="text-sm text-gray-500">No comp round activity for this period.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Member', 'Tier', 'Comps Redeemed', 'Last Redemption'].map(h => (
                  <th key={h} scope="col" className="text-left py-2 px-3 text-xs text-[#6B7770] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.perMember.map(row => (
                <tr key={row.userId} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3 font-medium">{row.fullName}</td>
                  <td className="py-2 px-3 capitalize">{row.tier}</td>
                  <td className="py-2 px-3">{row.redeemed}</td>
                  <td className="py-2 px-3">{row.lastRedemption}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getLeagueData } from '@/lib/reports/courseMetrics'
import { resolveDateRange } from '@/lib/reports/dateRange'
import { requireManager } from '@/lib/courseRole'
import KpiTile from '@/components/reports/KpiTile'
import CsvExportButton from '@/components/reports/CsvExportButton'
import DateRangePicker from '@/components/reports/DateRangePicker'

export default async function LeaguesReportPage({
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
  if (courseError && courseError.code !== 'PGRST116') throw new Error(`[LeaguesReport] ${courseError.message}`)
  if (!course) notFound()

  const sp = await searchParams
  const dateRange = resolveDateRange(sp.preset, sp.from, sp.to)
  const data = await getLeagueData(course.id, dateRange.from, dateRange.to)

  const estRevenueFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(data.estRevenueCents / 100)

  const csvData = data.leagues.map(row => ({
    League: row.name,
    Members: row.memberCount,
    'Rounds Played': row.roundsPlayed,
    Holes: row.holes,
    'Last Activity': row.lastActivity,
    'Est. Revenue': `$${(row.estRevenueCents / 100).toFixed(2)}`,
  }))

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">League Performance</h1>
        <CsvExportButton data={csvData} filename={`${slug}-leagues.csv`} disabled={csvData.length === 0} />
      </div>

      <DateRangePicker />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiTile label="Active Leagues" value={data.activeLeagues.toString()} accent />
        <KpiTile label="Total League Rounds" value={data.totalRounds.toString()} />
        <KpiTile label="Total League Members" value={data.totalMembers.toString()} />
        <KpiTile label="Est. Revenue Contribution" value={estRevenueFormatted} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-[#1A1A1A] mb-4">League Breakdown</h2>
        {data.leagues.length === 0 ? (
          <p className="text-sm text-gray-500">No league activity for this period.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['League', 'Members', 'Rounds Played', 'Holes', 'Last Activity'].map(h => (
                  <th key={h} scope="col" className="text-left py-2 px-3 text-xs text-[#6B7770] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.leagues.map(row => (
                <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3 font-medium">{row.name}</td>
                  <td className="py-2 px-3">{row.memberCount}</td>
                  <td className="py-2 px-3">{row.roundsPlayed}</td>
                  <td className="py-2 px-3">{row.holes}</td>
                  <td className="py-2 px-3">{row.lastActivity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

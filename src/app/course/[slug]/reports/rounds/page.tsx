import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCourseMetricHistory } from '@/lib/reports/courseMetrics'
import { resolveDateRange } from '@/lib/reports/dateRange'
import { requireManager } from '@/lib/courseRole'
import KpiTile from '@/components/reports/KpiTile'
import CsvExportButton from '@/components/reports/CsvExportButton'
import DateRangePicker from '@/components/reports/DateRangePicker'
import { RoundsBarChart } from './RoundsCharts'

export default async function RoundsReportPage({
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
  if (courseError && courseError.code !== 'PGRST116') throw new Error(`[RoundsReportPage] course query failed: ${courseError.message}`)
  if (!course) notFound()

  const sp = await searchParams
  const dateRange = resolveDateRange(sp.preset, sp.from, sp.to)
  const history = await getCourseMetricHistory(course.id, 12, dateRange.from, dateRange.to)
  const latest = history[history.length - 1]
  const prev = history[history.length - 2]
  const momChange = latest && prev && prev.rounds_booked > 0
    ? Math.round(((latest.rounds_booked - prev.rounds_booked) / prev.rounds_booked) * 100)
    : null

  const csvData = history.map((h, i) => {
    const prevRow = history[i - 1]
    const change = prevRow && prevRow.rounds_booked > 0
      ? `${Math.round(((h.rounds_booked - prevRow.rounds_booked) / prevRow.rounds_booked) * 100)}%`
      : ''
    return {
      Month: h.month,
      'Rounds Booked': h.rounds_booked,
      'MoM Change': change,
    }
  })

  const latestMonthLabel = latest?.month
    ? new Date(latest.month + '-01').toLocaleString('en-US', { month: 'long', year: 'numeric' })
    : 'Latest Month'

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Rounds &amp; Utilization</h1>
        <CsvExportButton data={csvData} filename={`${slug}-rounds.csv`} />
      </div>

      <DateRangePicker />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <KpiTile label={`Rounds — ${latestMonthLabel}`} value={(latest?.rounds_booked ?? 0).toLocaleString()} accent />
        {momChange !== null && (
          <KpiTile label="Month-over-Month" value={`${momChange > 0 ? '+' : ''}${momChange}%`} />
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 id="rounds-chart-heading" className="font-semibold text-[#1A1A1A] mb-4">Rounds Booked</h2>
        <RoundsBarChart data={history} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 id="rounds-table-heading" className="font-semibold text-[#1A1A1A] mb-4">Monthly Breakdown</h2>
        <table className="w-full text-sm" aria-labelledby="rounds-table-heading">
          <thead>
            <tr className="border-b border-gray-100">
              {['Month', 'Rounds', 'MoM Change'].map(h => (
                <th key={h} scope="col" className="text-left py-2 px-3 text-xs text-[#6B7770] font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {history.map((row, i) => {
              const prevRow = history[i - 1]
              const change = prevRow && prevRow.rounds_booked > 0
                ? Math.round(((row.rounds_booked - prevRow.rounds_booked) / prevRow.rounds_booked) * 100)
                : null
              return (
                <tr key={row.month} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3">{row.month}</td>
                  <td className="py-2 px-3 font-medium">{row.rounds_booked.toLocaleString()}</td>
                  <td className={`py-2 px-3 ${change === null ? '' : change >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {change === null ? '—' : `${change > 0 ? '+' : ''}${change}%`}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

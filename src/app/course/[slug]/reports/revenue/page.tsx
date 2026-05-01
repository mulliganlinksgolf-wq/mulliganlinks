import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCourseMetricHistory } from '@/lib/reports/courseMetrics'
import { resolveDateRange } from '@/lib/reports/dateRange'
import { requireManager } from '@/lib/courseRole'
import KpiTile from '@/components/reports/KpiTile'
import CsvExportButton from '@/components/reports/CsvExportButton'
import DateRangePicker from '@/components/reports/DateRangePicker'
import { RevenueLineChart } from './RevenueChart'

export default async function RevenueReportPage({
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
  if (courseError && courseError.code !== 'PGRST116') throw new Error(`[RevenueReportPage] course query failed: ${courseError.message}`)
  if (!course) notFound()

  const sp = await searchParams
  const dateRange = resolveDateRange(sp.preset, sp.from, sp.to)
  const history = await getCourseMetricHistory(course.id, 12, dateRange.from, dateRange.to)
  const latest = history[history.length - 1]
  const prev = history[history.length - 2]
  const revenueMtd = Number(latest?.green_fee_revenue ?? 0)
  const prevRevenue = Number(prev?.green_fee_revenue ?? 0)
  const momChange = prevRevenue > 0 ? Math.round(((revenueMtd - prevRevenue) / prevRevenue) * 100) : null

  const csvData = history.map(h => ({
    Month: h.month,
    'Green Fee Revenue': Number(h.green_fee_revenue),
    'Avg Green Fee': Number(h.avg_green_fee),
    'Rounds': h.rounds_booked,
  }))

  const latestMonthLabel = latest?.month
    ? new Date(latest.month + '-01').toLocaleString('en-US', { month: 'long', year: 'numeric' })
    : 'Latest Month'

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Revenue</h1>
        <CsvExportButton data={csvData} filename={`${slug}-revenue.csv`} />
      </div>

      <DateRangePicker />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <KpiTile label={`Revenue — ${latestMonthLabel}`} value={`$${revenueMtd.toLocaleString()}`} accent />
        <KpiTile label="Avg Green Fee" value={`$${Number(latest?.avg_green_fee ?? 0).toFixed(0)}`} />
        {momChange !== null && (
          <KpiTile label="Month-over-Month" value={`${momChange > 0 ? '+' : ''}${momChange}%`} />
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-[#1A1A1A] mb-4">Green Fee Revenue</h2>
        <RevenueLineChart data={history} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 id="revenue-table-heading" className="font-semibold text-[#1A1A1A] mb-4">Monthly Breakdown</h2>
        <table className="w-full text-sm" aria-labelledby="revenue-table-heading">
          <thead>
            <tr className="border-b border-gray-100">
              {['Month', 'Revenue', 'Avg Green Fee', 'Rounds', 'MoM'].map(h => (
                <th key={h} scope="col" className="text-left py-2 px-3 text-xs text-[#6B7770] font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {history.map((row, i) => {
              const prevRow = history[i - 1]
              const rev = Number(row.green_fee_revenue)
              const prevRev = Number(prevRow?.green_fee_revenue ?? rev)
              const change = prevRow && prevRev > 0 ? Math.round(((rev - prevRev) / prevRev) * 100) : null
              return (
                <tr key={row.month} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3">{row.month}</td>
                  <td className="py-2 px-3 font-medium">${rev.toLocaleString()}</td>
                  <td className="py-2 px-3">${Number(row.avg_green_fee).toFixed(0)}</td>
                  <td className="py-2 px-3">{row.rounds_booked.toLocaleString()}</td>
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

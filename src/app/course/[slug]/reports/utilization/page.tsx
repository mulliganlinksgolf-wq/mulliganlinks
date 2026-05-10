import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUtilizationData } from '@/lib/reports/courseMetrics'
import { resolveDateRange } from '@/lib/reports/dateRange'
import { requireManager } from '@/lib/courseRole'
import KpiTile from '@/components/reports/KpiTile'
import CsvExportButton from '@/components/reports/CsvExportButton'
import DateRangePicker from '@/components/reports/DateRangePicker'
import { UtilizationHeatmap } from './UtilizationHeatmap'

export default async function UtilizationReportPage({
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
  if (courseError && courseError.code !== 'PGRST116') throw new Error(`[UtilizationReport] ${courseError.message}`)
  if (!course) notFound()

  const sp = await searchParams
  const dateRange = resolveDateRange(sp.preset, sp.from, sp.to)
  const data = await getUtilizationData(course.id, dateRange.from, dateRange.to)

  const csvData = data.monthlySummary.map(row => ({
    Month: row.month,
    Rounds: row.rounds,
    'Peak Day': row.peakDay,
    'Peak Slot': row.peakSlot,
    'Avg Party Size': row.avgPartySize,
  }))

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Tee Sheet Utilization</h1>
        <CsvExportButton data={csvData} filename={`${slug}-utilization.csv`} disabled={csvData.length === 0} />
      </div>

      <DateRangePicker />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiTile label="Peak Day" value={data.peakDay} accent />
        <KpiTile label="Peak Time Slot" value={data.peakSlot} />
        <KpiTile label="Avg Party Size" value={data.avgPartySize.toString()} />
        <KpiTile label="Off-Peak Bookings" value={`${data.offPeakPct}%`} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-[#1A1A1A] mb-4">Booking Heatmap</h2>
        <p className="text-xs text-gray-500 mb-4">Number of bookings by day of week and time of day</p>
        <UtilizationHeatmap cells={data.cells} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-[#1A1A1A] mb-4">Monthly Summary</h2>
        {data.monthlySummary.length === 0 ? (
          <p className="text-sm text-gray-500">No data for this date range.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Month', 'Rounds', 'Peak Day', 'Peak Slot', 'Avg Party Size'].map(h => (
                  <th key={h} scope="col" className="text-left py-2 px-3 text-xs text-[#6B7770] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.monthlySummary.map(row => (
                <tr key={row.month} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3">{row.month}</td>
                  <td className="py-2 px-3 font-medium">{row.rounds.toLocaleString()}</td>
                  <td className="py-2 px-3">{row.peakDay}</td>
                  <td className="py-2 px-3">{row.peakSlot}</td>
                  <td className="py-2 px-3">{row.avgPartySize}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

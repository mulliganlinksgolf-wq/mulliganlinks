import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'
import KpiTile from '@/components/reports/KpiTile'
import CsvExportButton from '@/components/reports/CsvExportButton'

export default async function CourseDrilldownPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireAdmin()
  const admin = createAdminClient()

  const { data: course, error: courseError } = await admin
    .from('courses').select('id, name, slug').eq('id', id).single()
  if (courseError || !course) notFound()

  const { data: metrics, error: metricsError } = await admin
    .from('crm_course_metrics')
    .select('*')
    .eq('course_id', id)
    .order('month', { ascending: false })
    .limit(12)
  if (metricsError) throw new Error(`[CourseDrilldown] metrics query failed: ${metricsError.message}`)

  const latest = metrics?.[0]
  const csvData = (metrics ?? []).map(m => ({
    Month: m.month,
    'Rounds Booked': m.rounds_booked,
    Revenue: m.green_fee_revenue,
    'Members Attributed': m.members_attributed,
    'Waitlist Fills': m.waitlist_fills,
  }))

  const storedAvgGreenFee = Number(latest?.avg_green_fee ?? 0)
  const avgGreenFee = storedAvgGreenFee > 0
    ? storedAvgGreenFee
    : latest && latest.rounds_booked > 0
      ? Number(latest.green_fee_revenue) / latest.rounds_booked
      : 0
  const golfnowCostMtd = latest ? latest.rounds_booked * avgGreenFee * 0.20 : 0

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/admin/reports/courses" className="text-[#6B7770] hover:text-[#1A1A1A] text-sm">← All Courses</Link>
        <span className="text-[#6B7770]">/</span>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">{course.name}</h1>
      </div>

      {latest ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiTile label="Rounds MTD" value={latest.rounds_booked.toLocaleString()} accent />
          <KpiTile label="Revenue MTD" value={`$${Number(latest.green_fee_revenue).toLocaleString()}`} />
          <KpiTile label="Members Attributed" value={latest.members_attributed.toString()} />
          <KpiTile label="Waitlist Fills" value={latest.waitlist_fills.toString()} />
        </div>
      ) : (
        <p className="text-sm text-[#6B7770]">No metrics data available for this course yet.</p>
      )}

      {avgGreenFee > 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h2 className="font-semibold text-[#1A1A1A] mb-2">What GolfNow Would Have Cost This Month</h2>
          <p className="text-sm text-[#6B7770] mb-4">
            GolfNow charges ~20% of green fee value as barter. Based on {latest?.rounds_booked ?? 0} rounds × ${avgGreenFee.toFixed(0)}/avg green fee:
          </p>
          <div className="text-3xl font-bold text-amber-700 mb-2">
            ${golfnowCostMtd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <p className="text-sm text-[#6B7770]">in tee time value surrendered if on GolfNow</p>
          <p className="text-sm font-semibold text-emerald-700 mt-3">Your TeeAhead cost this month: $0</p>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h2 className="font-semibold text-[#1A1A1A] mb-2">What GolfNow Would Have Cost This Month</h2>
          <p className="text-sm text-[#6B7770]">
            Add green fee data (via the course portal or seed data) to see the GolfNow cost comparison.
          </p>
          <p className="text-sm font-semibold text-emerald-700 mt-3">Your TeeAhead cost this month: $0</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 id="history-heading" className="font-semibold text-[#1A1A1A]">Monthly History</h2>
          <CsvExportButton data={csvData} filename={`${course.slug ?? id}-history.csv`} />
        </div>
        {(metrics ?? []).length === 0 ? (
          <p className="text-sm text-[#6B7770]">No historical data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-labelledby="history-heading">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Month', 'Rounds', 'Revenue', 'Members', 'Waitlist Fills'].map(h => (
                    <th key={h} scope="col" className="text-left py-2 px-3 text-xs text-[#6B7770] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(metrics ?? []).map(m => (
                  <tr key={m.month} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 px-3">{m.month}</td>
                    <td className="py-2 px-3">{m.rounds_booked.toLocaleString()}</td>
                    <td className="py-2 px-3">${Number(m.green_fee_revenue).toLocaleString()}</td>
                    <td className="py-2 px-3">{m.members_attributed}</td>
                    <td className="py-2 px-3">{m.waitlist_fills}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-sm text-[#6B7770]">
        View the full course portal:{' '}
        <Link href={`/course/${course.slug}/reports`} className="text-[#1B4332] hover:underline">
          /course/{course.slug}/reports
        </Link>
      </p>
    </div>
  )
}

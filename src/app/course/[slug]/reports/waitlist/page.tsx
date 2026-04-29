import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCourseMetricHistory, calcWaitlistFillRate } from '@/lib/reports/courseMetrics'
import KpiTile from '@/components/reports/KpiTile'
import { WaitlistBarChart } from './WaitlistChart'

export default async function WaitlistReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/course/${slug}/login`)

  const admin = createAdminClient()
  const { data: course, error: courseError } = await admin.from('courses').select('id').eq('slug', slug).single()
  if (courseError && courseError.code !== 'PGRST116') throw new Error(`[WaitlistReportPage] course query failed: ${courseError.message}`)
  if (!course) notFound()

  const history = await getCourseMetricHistory(course.id, 12)
  const latest = history[history.length - 1]
  const fillRate = latest
    ? calcWaitlistFillRate({ fills: latest.waitlist_fills, totalCancellations: latest.total_cancellations })
    : 0
  const revenueRecovered = Number(latest?.cancellations_recovered_revenue ?? 0)

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[#1A1A1A]">Waitlist &amp; Recovery</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiTile label="Cancellations Auto-Filled" value={(latest?.waitlist_fills ?? 0).toString()} accent />
        <KpiTile label="Revenue Recovered" value={`$${revenueRecovered.toLocaleString()}`} />
        <KpiTile label="Fill Rate" value={`${fillRate}%`} sub="fills / total cancellations" />
        <KpiTile label="Total Cancellations" value={(latest?.total_cancellations ?? 0).toString()} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-[#1A1A1A] mb-4">Waitlist Fills (last 6 months)</h2>
        <WaitlistBarChart data={history} />
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
        <h2 className="font-semibold text-emerald-900 mb-2">What This Means</h2>
        <p className="text-sm text-emerald-800">
          TeeAhead automatically filled <strong>{latest?.waitlist_fills ?? 0} cancelled tee times</strong> this month
          via the waitlist system, recovering an estimated <strong>${revenueRecovered.toLocaleString()}</strong> in green fee
          revenue that would have been lost — with zero staff effort.
        </p>
      </div>
    </div>
  )
}

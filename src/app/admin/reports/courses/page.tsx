import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCourseNetworkData } from '@/lib/reports/courses'
import KpiTile from '@/components/reports/KpiTile'
import CsvExportButton from '@/components/reports/CsvExportButton'

export const metadata = { title: 'Course Network Reports' }

const HEALTH_BADGE: Record<string, string> = {
  healthy: 'bg-emerald-100 text-emerald-800',
  at_risk: 'bg-amber-100 text-amber-800',
  critical: 'bg-red-100 text-red-800',
}
const HEALTH_LABEL: Record<string, string> = {
  healthy: 'Healthy',
  at_risk: 'At Risk',
  critical: 'Critical',
}

export default async function CourseNetworkReportPage() {
  await requireAdmin()
  const admin = createAdminClient()

  const currentMonth = new Date().toISOString().slice(0, 7)
  const { kpis, rows } = await getCourseNetworkData(currentMonth)

  const csvData = rows.map(r => ({
    Course: r.name,
    'Rounds MTD': r.roundsMtd,
    'Revenue MTD': r.revenueMtd,
    'Members Attributed': r.membersAttributed,
    'Points Earned': r.pointsEarned,
    'Points Redeemed': r.pointsRedeemed,
    'Waitlist Fills': r.waitlistFills,
    'Health Score': r.healthScore,
    Status: HEALTH_LABEL[r.healthLabel],
  }))

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Course Network — {currentMonth}</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiTile label="Active Partner Courses" value={kpis.totalActive.toString()} accent />
        <KpiTile label="Rounds Booked MTD" value={kpis.totalRoundsMtd.toLocaleString()} />
        <KpiTile label="Green Fee Revenue MTD" value={`$${kpis.totalRevenueMtd.toLocaleString()}`} />
        <KpiTile label="Avg Health Score" value={`${kpis.avgHealthScore}/100`} />
        {kpis.criticalOrAtRiskCount > 0 && (
          <KpiTile label="Courses Flagged" value={kpis.criticalOrAtRiskCount.toString()} alert sub="Critical or At Risk" />
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 id="all-courses-heading" className="font-semibold text-[#1A1A1A]">All Courses</h2>
          <CsvExportButton data={csvData} filename={`course-network-${currentMonth}.csv`} />
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-[#6B7770] py-4">No active courses for this month.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-labelledby="all-courses-heading">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Course', 'Rounds MTD', 'Revenue MTD', 'Members', 'Pts Earned', 'Pts Redeemed', 'Waitlist Fills', 'Health'].map(h => (
                    <th key={h} scope="col" className="text-left py-2 px-3 text-xs text-[#6B7770] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 px-3">
                      <Link href={`/admin/reports/courses/${r.id}`} className="font-medium text-[#1B4332] hover:underline">
                        {r.name}
                      </Link>
                    </td>
                    <td className="py-2 px-3">{r.roundsMtd.toLocaleString()}</td>
                    <td className="py-2 px-3">${r.revenueMtd.toLocaleString()}</td>
                    <td className="py-2 px-3">{r.membersAttributed}</td>
                    <td className="py-2 px-3">{r.pointsEarned.toLocaleString()}</td>
                    <td className="py-2 px-3">{r.pointsRedeemed.toLocaleString()}</td>
                    <td className="py-2 px-3">{r.waitlistFills}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${HEALTH_BADGE[r.healthLabel]}`}>
                        {HEALTH_LABEL[r.healthLabel]} {r.healthScore}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

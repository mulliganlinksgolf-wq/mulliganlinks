import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getGuestData } from '@/lib/reports/courseMetrics'
import { resolveDateRange } from '@/lib/reports/dateRange'
import { requireManager } from '@/lib/courseRole'
import KpiTile from '@/components/reports/KpiTile'
import CsvExportButton from '@/components/reports/CsvExportButton'
import DateRangePicker from '@/components/reports/DateRangePicker'
import { GuestChart } from './GuestChart'

export default async function GuestReportPage({
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
  if (courseError && courseError.code !== 'PGRST116') throw new Error(`[GuestReport] ${courseError.message}`)
  if (!course) notFound()

  const sp = await searchParams
  const dateRange = resolveDateRange(sp.preset, sp.from, sp.to)
  const data = await getGuestData(course.id, dateRange.from, dateRange.to)

  const csvData = data.details.map(row => ({
    Member: row.fullName,
    Source: row.source,
    'Join Date': row.joinDate,
    Tier: row.tier,
  }))

  const hasMonthlyData = data.monthly.some(m => m.passesRedeemed > 0)

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Guest Passes &amp; Referral Activity</h1>
        <CsvExportButton data={csvData} filename={`${slug}-guests.csv`} disabled={csvData.length === 0} />
      </div>

      <DateRangePicker />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiTile label="Guest Passes Redeemed" value={data.passesRedeemed.toString()} accent />
        <KpiTile label="Guest-to-Member Conversions" value={data.guestToMemberConversions.toString()} />
        <KpiTile label="Referral Link Members" value={data.membersViaReferral.toString()} />
        <KpiTile label="Total New-Golfer Attributions" value={data.totalAttributions.toString()} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-[#1A1A1A] mb-4">Monthly Guest Pass Redemptions</h2>
        {hasMonthlyData
          ? <GuestChart months={data.monthly} />
          : <p className="text-sm text-gray-500">No guest pass data for this period.</p>}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-[#1A1A1A] mb-4">Referral &amp; Conversion Detail</h2>
        {data.details.length === 0 ? (
          <p className="text-sm text-gray-500">No guest or referral activity for this period.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Member', 'Source', 'Join Date', 'Tier'].map(h => (
                  <th key={h} scope="col" className="text-left py-2 px-3 text-xs text-[#6B7770] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.details.map((row, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3 font-medium">{row.fullName}</td>
                  <td className="py-2 px-3">{row.source}</td>
                  <td className="py-2 px-3">{row.joinDate}</td>
                  <td className="py-2 px-3 capitalize">{row.tier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

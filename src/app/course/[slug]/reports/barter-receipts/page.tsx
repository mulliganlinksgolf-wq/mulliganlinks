import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireManager } from '@/lib/courseRole'
import { GenerateNowButton } from './GenerateNowButton'
import { DownloadButton } from './DownloadButton'

export const dynamic = 'force-dynamic'

interface BarterReceiptRow {
  id: string
  receipt_month: string
  total_rounds: number
  peak_rounds: number
  peak_pct: number
  avg_green_fee: number
  estimated_barter_rounds: number
  estimated_barter_cost: number
  generated_by: 'cron' | 'manual'
  generated_at: string
  emailed_at: string | null
  email_recipient: string | null
}

export default async function BarterReceiptsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const ctx = await requireManager(slug)

  const admin = createAdminClient()
  const { data: course } = await admin
    .from('courses')
    .select('id, name')
    .eq('id', ctx.courseId)
    .single()
  if (!course) notFound()

  const { data: receipts } = await admin
    .from('barter_receipts')
    .select(
      'id, receipt_month, total_rounds, peak_rounds, peak_pct, avg_green_fee, estimated_barter_rounds, estimated_barter_cost, generated_by, generated_at, emailed_at, email_recipient',
    )
    .eq('course_id', ctx.courseId)
    .order('receipt_month', { ascending: false })

  const rows = (receipts ?? []) as BarterReceiptRow[]

  // Default the "Generate Now" target to the last completed month.
  const now = new Date()
  const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
  const lastMonthIso = lastMonthStart.toISOString().slice(0, 10)
  const lastMonthLabel = lastMonthStart.toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href={`/course/${slug}/reports`}
            className="text-xs text-[#6B7770] hover:text-[#1B4332]"
          >
            ← Reports
          </Link>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mt-1">Monthly Barter Receipts</h1>
          <p className="text-[#6B7770] text-sm mt-1 max-w-2xl">
            What GolfNow would have cost you each month, using the NGCOA/ORCA methodology. Generated
            automatically on the 1st and emailed to your billing contact.
          </p>
        </div>
        <GenerateNowButton
          slug={slug}
          defaultMonth={lastMonthIso}
          defaultMonthLabel={lastMonthLabel}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-[#6B7770]">No receipts yet.</p>
            <p className="text-xs text-[#9CA3AF] mt-2">
              The first scheduled receipt will be emailed on the 1st of next month. Or click{' '}
              <span className="font-medium">Generate Now</span> above to produce one immediately for any month
              with booking data.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-[#6B7770]">
              <tr>
                <th scope="col" className="text-left py-3 px-4 font-medium">Month</th>
                <th scope="col" className="text-right py-3 px-4 font-medium">Rounds</th>
                <th scope="col" className="text-right py-3 px-4 font-medium">Peak %</th>
                <th scope="col" className="text-right py-3 px-4 font-medium">Avg green fee</th>
                <th scope="col" className="text-right py-3 px-4 font-medium">Est. GolfNow cost</th>
                <th scope="col" className="text-left py-3 px-4 font-medium">Delivery</th>
                <th scope="col" className="text-right py-3 px-4 font-medium">PDF</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const monthLabel = new Date(`${r.receipt_month}T00:00:00Z`).toLocaleString('en-US', {
                  month: 'long',
                  year: 'numeric',
                  timeZone: 'UTC',
                })
                const deliveryLabel = r.emailed_at
                  ? `Emailed to ${r.email_recipient ?? '—'}`
                  : r.generated_by === 'manual'
                    ? 'Generated manually (not emailed)'
                    : 'Not yet emailed'
                return (
                  <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{monthLabel}</td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      {r.total_rounds.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      {Number(r.peak_pct).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      ${Number(r.avg_green_fee).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-semibold text-[#1B4332]">
                      ${Number(r.estimated_barter_cost).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#6B7770]">{deliveryLabel}</td>
                    <td className="py-3 px-4 text-right">
                      <DownloadButton slug={slug} receiptId={r.id} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="text-xs text-[#9CA3AF] max-w-2xl">
        Methodology: Peak-hour rounds × 30% (NGCOA/ORCA conservative middle of the 25–40% published range)
        × your actual average green fee × 0.85 (GolfNow effective take rate). This is an estimate; your
        actual GolfNow cost depends on the specific terms in your contract. Full methodology and sources
        appear on the last page of every PDF.
      </div>
    </div>
  )
}

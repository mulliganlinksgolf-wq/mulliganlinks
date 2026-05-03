import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Referrals — Admin' }

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  queued: 'bg-blue-50 text-blue-700 border-blue-200',
  paid: 'bg-green-50 text-green-700 border-green-200',
  reversed: 'bg-red-50 text-red-700 border-red-200',
  expired: 'bg-gray-50 text-gray-600 border-gray-200',
}

export default async function AdminReferralsPage() {
  const supabase = createAdminClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { data: referrals } = await supabase
    .from('course_referrals')
    .select(`
      id,
      attributed_at,
      attribution_method,
      membership_tier,
      rev_share_cents,
      payout_status,
      paid_at,
      courses!inner(name, slug),
      profiles!inner(full_name)
    `)
    .order('attributed_at', { ascending: false })
    .limit(500)

  const all = referrals ?? []

  // Summary stats
  const mtdReferrals = all.filter(r => r.attributed_at >= startOfMonth)
  const totalPaid = all.filter(r => r.payout_status === 'paid').reduce((s, r) => s + (r.rev_share_cents ?? 0), 0)
  const totalPending = all.filter(r => ['pending', 'queued'].includes(r.payout_status)).reduce((s, r) => s + (r.rev_share_cents ?? 0), 0)
  const mtdPaid = all.filter(r => r.payout_status === 'paid' && (r.paid_at ?? '') >= startOfMonth).reduce((s, r) => s + (r.rev_share_cents ?? 0), 0)

  // Top 10 referring courses
  const courseMap = new Map<string, { name: string; slug: string; count: number; earned: number }>()
  for (const r of all) {
    const name = (r.courses as any)?.name ?? 'Unknown'
    const slug = (r.courses as any)?.slug ?? ''
    const key = slug || name
    const existing = courseMap.get(key) ?? { name, slug, count: 0, earned: 0 }
    existing.count++
    existing.earned += r.rev_share_cents ?? 0
    courseMap.set(key, existing)
  }
  const topCourses = Array.from(courseMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  function fmt(cents: number) {
    return `$${(cents / 100).toFixed(2)}`
  }

  // Build CSV
  const csvRows = [
    ['Course', 'Golfer', 'Method', 'Date', 'Tier', 'Rev Share', 'Status', 'Paid At'].join(','),
    ...all.map(r => [
      JSON.stringify((r.courses as any)?.name ?? ''),
      JSON.stringify((r.profiles as any)?.full_name ?? ''),
      r.attribution_method,
      r.attributed_at.split('T')[0],
      r.membership_tier ?? '',
      r.rev_share_cents != null ? (r.rev_share_cents / 100).toFixed(2) : '',
      r.payout_status,
      r.paid_at ? r.paid_at.split('T')[0] : '',
    ].join(',')),
  ].join('\n')

  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(csvRows)}`

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Referrals</h1>
        <a
          href={csvHref}
          download="teeahead-referrals.csv"
          className="text-sm px-4 py-2 bg-[#0F3D2E] text-white rounded-lg hover:bg-[#0F3D2E]/90 transition-colors"
        >
          Export CSV
        </a>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Referrals MTD', value: mtdReferrals.length },
          { label: 'All-time referrals', value: all.length },
          { label: 'Rev share paid MTD', value: fmt(mtdPaid) },
          { label: 'All-time paid', value: fmt(totalPaid) },
          { label: 'Pending payout', value: fmt(totalPending) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-black/8 p-4">
            <p className="text-xs text-[#6B7770] mb-1">{label}</p>
            <p className="text-xl font-bold text-[#0F3D2E]">{value}</p>
          </div>
        ))}
      </div>

      {/* Top 10 referring courses */}
      <div>
        <h2 className="text-base font-semibold text-[#1A1A1A] mb-3">Top Referring Courses</h2>
        <div className="bg-white rounded-xl border border-black/8 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#FAF7F2] border-b border-black/8">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Course</th>
                <th className="text-right px-4 py-3 font-semibold">Referrals</th>
                <th className="text-right px-4 py-3 font-semibold">Total Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {topCourses.map((c, i) => (
                <tr key={i} className="hover:bg-[#FAF7F2]/60">
                  <td className="px-4 py-3 font-medium text-[#1A1A1A]">
                    {c.slug ? (
                      <Link href={`/course/${c.slug}/referrals`} className="text-[#0F3D2E] underline underline-offset-2">
                        {c.name}
                      </Link>
                    ) : c.name}
                  </td>
                  <td className="px-4 py-3 text-right text-[#6B7770]">{c.count}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[#0F3D2E]">{fmt(c.earned)}</td>
                </tr>
              ))}
              {topCourses.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-[#6B7770]">No referrals yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* All referrals */}
      <div>
        <h2 className="text-base font-semibold text-[#1A1A1A] mb-3">All Referrals ({all.length})</h2>
        <div className="bg-white rounded-xl border border-black/8 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#FAF7F2] border-b border-black/8">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Course</th>
                <th className="text-left px-4 py-3 font-semibold">Golfer</th>
                <th className="text-left px-4 py-3 font-semibold">Via</th>
                <th className="text-left px-4 py-3 font-semibold">Date</th>
                <th className="text-left px-4 py-3 font-semibold">Tier</th>
                <th className="text-right px-4 py-3 font-semibold">Rev Share</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {all.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-[#6B7770]">No referrals yet.</td></tr>
              ) : all.map(r => (
                <tr key={r.id} className="hover:bg-[#FAF7F2]/60">
                  <td className="px-4 py-3 text-[#1A1A1A] font-medium">
                    {(r.courses as any)?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-[#6B7770]">
                    {(r.profiles as any)?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-[#6B7770] capitalize">{r.attribution_method}</td>
                  <td className="px-4 py-3 text-[#6B7770] whitespace-nowrap">
                    {new Date(r.attributed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-[#6B7770] capitalize">{r.membership_tier ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-medium text-[#0F3D2E]">
                    {r.rev_share_cents != null ? fmt(r.rev_share_cents) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[r.payout_status] ?? 'bg-gray-50 text-gray-600'}`}>
                      {r.payout_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

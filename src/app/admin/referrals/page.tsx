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

const STRIPE_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  onboarding: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  restricted: 'bg-orange-50 text-orange-700 border-orange-200',
  not_started: 'bg-gray-50 text-gray-500 border-gray-200',
  disabled: 'bg-red-50 text-red-700 border-red-200',
}

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function AdminReferralsPage() {
  const supabase = createAdminClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [{ data: referrals }, { data: courses }] = await Promise.all([
    supabase
      .from('course_referrals')
      .select(`
        id,
        course_id,
        attributed_at,
        expires_at,
        attribution_method,
        membership_tier,
        rev_share_cents,
        payout_status,
        paid_at,
        courses!inner(name, slug),
        profiles!inner(full_name)
      `)
      .order('attributed_at', { ascending: false })
      .limit(500),
    supabase
      .from('courses')
      .select('id, name, slug, stripe_account_id, stripe_account_status')
      .order('name'),
  ])

  const all = referrals ?? []
  const allCourses = courses ?? []

  // --- Summary stats ---
  const mtdReferrals = all.filter(r => r.attributed_at >= startOfMonth)
  const totalPaid = all.filter(r => r.payout_status === 'paid').reduce((s, r) => s + (r.rev_share_cents ?? 0), 0)
  const totalPending = all.filter(r => ['pending', 'queued'].includes(r.payout_status)).reduce((s, r) => s + (r.rev_share_cents ?? 0), 0)
  const mtdPaid = all
    .filter(r => r.payout_status === 'paid' && (r.paid_at ?? '') >= startOfMonth)
    .reduce((s, r) => s + (r.rev_share_cents ?? 0), 0)

  // --- Payout report: per-course breakdown ---
  type CoursePayoutRow = {
    courseId: string
    name: string
    slug: string
    stripeAccountId: string | null
    stripeStatus: string
    pendingCount: number
    owedCents: number
    paidCents: number
    earliestExpiry: string | null
    totalReferrals: number
  }

  const coursePayoutMap = new Map<string, CoursePayoutRow>()

  // Seed from courses table so courses with 0 referrals don't appear
  // (we only want courses that actually have referrals)

  for (const r of all) {
    const courseId = r.course_id
    const courseName = (r.courses as any)?.name ?? 'Unknown'
    const courseSlug = (r.courses as any)?.slug ?? ''

    // Find Stripe info from courses query
    const courseInfo = allCourses.find(c => c.id === courseId)

    if (!coursePayoutMap.has(courseId)) {
      coursePayoutMap.set(courseId, {
        courseId,
        name: courseName,
        slug: courseSlug,
        stripeAccountId: courseInfo?.stripe_account_id ?? null,
        stripeStatus: courseInfo?.stripe_account_status ?? 'not_started',
        pendingCount: 0,
        owedCents: 0,
        paidCents: 0,
        earliestExpiry: null,
        totalReferrals: 0,
      })
    }

    const row = coursePayoutMap.get(courseId)!
    row.totalReferrals++

    if (['pending', 'queued'].includes(r.payout_status)) {
      row.pendingCount++
      row.owedCents += r.rev_share_cents ?? 0
      // Track earliest expiry for urgency flagging
      if (r.expires_at && (!row.earliestExpiry || r.expires_at < row.earliestExpiry)) {
        row.earliestExpiry = r.expires_at
      }
    }
    if (r.payout_status === 'paid') {
      row.paidCents += r.rev_share_cents ?? 0
    }
  }

  const payoutRows = Array.from(coursePayoutMap.values())
    .filter(r => r.pendingCount > 0)
    .sort((a, b) => b.owedCents - a.owedCents)

  const totalOwedAllCourses = payoutRows.reduce((s, r) => s + r.owedCents, 0)

  // --- Top referring courses (by referral count, all time) ---
  const courseCountMap = new Map<string, { name: string; slug: string; count: number; earned: number }>()
  for (const r of all) {
    const name = (r.courses as any)?.name ?? 'Unknown'
    const slug = (r.courses as any)?.slug ?? ''
    const key = r.course_id
    const existing = courseCountMap.get(key) ?? { name, slug, count: 0, earned: 0 }
    existing.count++
    existing.earned += r.rev_share_cents ?? 0
    courseCountMap.set(key, existing)
  }
  const topCourses = Array.from(courseCountMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // --- CSV export ---
  const csvRows = [
    ['Course', 'Golfer', 'Method', 'Date', 'Tier', 'Rev Share', 'Status', 'Paid At', 'Expires At'].join(','),
    ...all.map(r => [
      JSON.stringify((r.courses as any)?.name ?? ''),
      JSON.stringify((r.profiles as any)?.full_name ?? ''),
      r.attribution_method,
      r.attributed_at.split('T')[0],
      r.membership_tier ?? '',
      r.rev_share_cents != null ? (r.rev_share_cents / 100).toFixed(2) : '',
      r.payout_status,
      r.paid_at ? r.paid_at.split('T')[0] : '',
      r.expires_at ? r.expires_at.split('T')[0] : '',
    ].join(',')),
  ].join('\n')

  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(csvRows)}`

  const expiringSoon = payoutRows.filter(r => {
    if (!r.earliestExpiry) return false
    const daysLeft = (new Date(r.earliestExpiry).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return daysLeft <= 30
  })

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
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Referrals MTD', value: mtdReferrals.length },
          { label: 'All-time referrals', value: all.length },
          { label: 'Rev share paid MTD', value: fmt(mtdPaid) },
          { label: 'All-time paid', value: fmt(totalPaid) },
          { label: 'Pending payout', value: fmt(totalPending), highlight: totalPending > 0 },
        ].map(({ label, value, highlight }) => (
          <div key={label} className={`rounded-xl border p-4 ${highlight ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-black/8'}`}>
            <p className="text-xs text-[#6B7770] mb-1">{label}</p>
            <p className={`text-xl font-bold ${highlight ? 'text-yellow-700' : 'text-[#0F3D2E]'}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Expiring soon alert */}
      {expiringSoon.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 flex items-start gap-3">
          <span className="text-orange-500 text-lg leading-none mt-0.5">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-orange-800">Rev share expiring within 30 days</p>
            <p className="text-xs text-orange-700 mt-0.5">
              {expiringSoon.map(r => r.name).join(', ')} — pay out before the window closes or the referral expires.
            </p>
          </div>
        </div>
      )}

      {/* Payout Report */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-[#1A1A1A]">Payout Report</h2>
            <p className="text-xs text-[#6B7770] mt-0.5">Courses with pending rev share. Cron runs the 1st of each month.</p>
          </div>
          {totalOwedAllCourses > 0 && (
            <div className="text-right">
              <p className="text-xs text-[#6B7770]">Total owed</p>
              <p className="text-lg font-bold text-[#0F3D2E]">{fmt(totalOwedAllCourses)}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-black/8 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#FAF7F2] border-b border-black/8">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Course</th>
                <th className="text-left px-4 py-3 font-semibold">Stripe Status</th>
                <th className="text-right px-4 py-3 font-semibold">Pending #</th>
                <th className="text-right px-4 py-3 font-semibold">Owed</th>
                <th className="text-right px-4 py-3 font-semibold">Paid to Date</th>
                <th className="text-left px-4 py-3 font-semibold">Earliest Expiry</th>
                <th className="text-left px-4 py-3 font-semibold">Stripe Account</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {payoutRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[#6B7770]">No pending payouts.</td>
                </tr>
              ) : payoutRows.map(r => {
                const daysLeft = r.earliestExpiry
                  ? Math.ceil((new Date(r.earliestExpiry).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                  : null
                const urgent = daysLeft !== null && daysLeft <= 30
                return (
                  <tr key={r.courseId} className={`hover:bg-[#FAF7F2]/60 ${urgent ? 'bg-orange-50/40' : ''}`}>
                    <td className="px-4 py-3 font-medium text-[#1A1A1A]">
                      {r.slug ? (
                        <Link href={`/course/${r.slug}/referrals`} className="text-[#0F3D2E] underline underline-offset-2">
                          {r.name}
                        </Link>
                      ) : r.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full border font-medium ${STRIPE_STATUS_COLORS[r.stripeStatus] ?? STRIPE_STATUS_COLORS.not_started}`}>
                        {r.stripeStatus === 'active' ? '✓ Active' : r.stripeStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-[#6B7770]">{r.pendingCount}</td>
                    <td className="px-4 py-3 text-right font-bold text-[#0F3D2E]">{fmt(r.owedCents)}</td>
                    <td className="px-4 py-3 text-right text-[#6B7770]">{r.paidCents > 0 ? fmt(r.paidCents) : '—'}</td>
                    <td className="px-4 py-3">
                      {r.earliestExpiry ? (
                        <span className={`text-xs font-medium ${urgent ? 'text-orange-600' : 'text-[#6B7770]'}`}>
                          {fmtDate(r.earliestExpiry)}
                          {urgent && ` (${daysLeft}d)`}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {r.stripeAccountId ? (
                        <code className="text-xs text-[#6B7770] bg-[#FAF7F2] px-1.5 py-0.5 rounded">{r.stripeAccountId}</code>
                      ) : (
                        <span className="text-xs text-red-500">Not connected</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {payoutRows.some(r => r.stripeStatus !== 'active') && (
          <p className="text-xs text-[#6B7770] mt-2">
            Courses without an active Stripe account cannot receive transfers. The monthly cron will skip them until their account is verified.
          </p>
        )}
      </div>

      {/* Top referring courses */}
      <div>
        <h2 className="text-base font-semibold text-[#1A1A1A] mb-3">Top Referring Courses (All Time)</h2>
        <div className="bg-white rounded-xl border border-black/8 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#FAF7F2] border-b border-black/8">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Course</th>
                <th className="text-right px-4 py-3 font-semibold">Referrals</th>
                <th className="text-right px-4 py-3 font-semibold">Total Rev Share</th>
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

      {/* All referrals detail */}
      <div>
        <h2 className="text-base font-semibold text-[#1A1A1A] mb-3">All Referrals ({all.length})</h2>
        <div className="bg-white rounded-xl border border-black/8 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#FAF7F2] border-b border-black/8">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Course</th>
                <th className="text-left px-4 py-3 font-semibold">Golfer</th>
                <th className="text-left px-4 py-3 font-semibold">Via</th>
                <th className="text-left px-4 py-3 font-semibold">Attributed</th>
                <th className="text-left px-4 py-3 font-semibold">Expires</th>
                <th className="text-left px-4 py-3 font-semibold">Tier</th>
                <th className="text-right px-4 py-3 font-semibold">Rev Share</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {all.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-[#6B7770]">No referrals yet.</td></tr>
              ) : all.map(r => (
                <tr key={r.id} className="hover:bg-[#FAF7F2]/60">
                  <td className="px-4 py-3 text-[#1A1A1A] font-medium">
                    {(r.courses as any)?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-[#6B7770]">
                    {(r.profiles as any)?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-[#6B7770] capitalize">{r.attribution_method}</td>
                  <td className="px-4 py-3 text-[#6B7770] whitespace-nowrap">{fmtDate(r.attributed_at)}</td>
                  <td className="px-4 py-3 text-[#6B7770] whitespace-nowrap">{fmtDate(r.expires_at)}</td>
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

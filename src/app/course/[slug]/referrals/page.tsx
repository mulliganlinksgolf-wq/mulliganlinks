import { createClient } from '@/lib/supabase/server'
import { requireManager } from '@/lib/courseRole'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  queued: 'Queued',
  paid: 'Paid',
  reversed: 'Reversed',
  expired: 'Expired',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  queued: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  reversed: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-600',
}

export default async function ReferralsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { courseId } = await requireManager(slug)
  const supabase = await createClient()

  const { data: course } = await supabase
    .from('courses')
    .select('id, name')
    .eq('slug', slug)
    .single()
  if (!course) notFound()

  const { data: referrals } = await supabase
    .from('course_referrals')
    .select(`
      id,
      attribution_method,
      attributed_at,
      membership_tier,
      rev_share_cents,
      payout_status,
      paid_at,
      profiles!inner(full_name)
    `)
    .eq('course_id', courseId)
    .order('attributed_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A]">Referrals</h1>
          <p className="text-sm text-[#6B7770] mt-1">{course.name}</p>
        </div>
        <Link
          href={`/course/${slug}/dashboard`}
          className="text-sm text-[#0F3D2E] underline underline-offset-2"
        >
          ← Dashboard
        </Link>
      </div>

      {!referrals?.length ? (
        <div className="text-center py-16 text-[#6B7770]">
          <p className="text-2xl mb-2">⛳</p>
          <p className="font-medium">No referrals yet</p>
          <p className="text-sm mt-1">Share your referral link from the dashboard to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-black/8">
          <table className="w-full text-sm">
            <thead className="bg-[#FAF7F2] border-b border-black/8">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-[#1A1A1A]">Golfer</th>
                <th className="text-left px-4 py-3 font-semibold text-[#1A1A1A]">Via</th>
                <th className="text-left px-4 py-3 font-semibold text-[#1A1A1A]">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-[#1A1A1A]">Tier</th>
                <th className="text-right px-4 py-3 font-semibold text-[#1A1A1A]">Rev Share</th>
                <th className="text-left px-4 py-3 font-semibold text-[#1A1A1A]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {referrals.map((r) => {
                const fullName = (r.profiles as any)?.full_name ?? ''
                const parts = fullName.trim().split(' ')
                // Privacy: show first name + last initial only
                const displayName = parts.length >= 2
                  ? `${parts[0]} ${parts[parts.length - 1][0]}.`
                  : parts[0] || '—'

                return (
                  <tr key={r.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                    <td className="px-4 py-3 text-[#1A1A1A] font-medium">{displayName}</td>
                    <td className="px-4 py-3 text-[#6B7770] capitalize">{r.attribution_method}</td>
                    <td className="px-4 py-3 text-[#6B7770]">
                      {new Date(r.attributed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-[#6B7770] capitalize">{r.membership_tier ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-medium text-[#0F3D2E]">
                      {r.rev_share_cents != null ? `$${(r.rev_share_cents / 100).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[r.payout_status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[r.payout_status] ?? r.payout_status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import QRCode from 'qrcode'
import { ReferralWidgetClient } from './ReferralWidgetClient'

interface ReferralWidgetProps {
  courseId: string
  slug: string
  referralCode: string
}

export async function ReferralWidget({ courseId, slug, referralCode }: ReferralWidgetProps) {
  const supabase = await createClient()

  const referralUrl = `https://www.teeahead.com/join?ref=${referralCode}`
  const qrDataUrl = await QRCode.toDataURL(referralUrl, { width: 280, margin: 2 })

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { data: referrals } = await supabase
    .from('course_referrals')
    .select('id, rev_share_cents, payout_status, attributed_at')
    .eq('course_id', courseId)

  const mtdReferrals = (referrals ?? []).filter(r => r.attributed_at >= startOfMonth)
  const mtdCount = mtdReferrals.length

  const mtdEarned = (referrals ?? [])
    .filter(r => r.attributed_at >= startOfMonth && ['pending', 'queued'].includes(r.payout_status))
    .reduce((sum, r) => sum + (r.rev_share_cents ?? 0), 0)

  const lifetimeEarned = (referrals ?? [])
    .filter(r => r.payout_status === 'paid')
    .reduce((sum, r) => sum + (r.rev_share_cents ?? 0), 0)

  const pendingPayout = (referrals ?? [])
    .filter(r => r.payout_status === 'queued')
    .reduce((sum, r) => sum + (r.rev_share_cents ?? 0), 0)

  function fmt(cents: number) {
    return `$${(cents / 100).toFixed(2)}`
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-[#1A1A1A]">Referral Program</CardTitle>
        <p className="text-xs text-[#6B7770]">Earn 10% of every membership you refer, paid monthly for 12 months.</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <ReferralWidgetClient referralUrl={referralUrl} qrDataUrl={qrDataUrl} />

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#F4F1EA] rounded-lg p-3">
            <p className="text-xs text-[#6B7770] mb-1">Referrals this month</p>
            <p className="text-xl font-bold text-[#0F3D2E]">{mtdCount}</p>
          </div>
          <div className="bg-[#F4F1EA] rounded-lg p-3">
            <p className="text-xs text-[#6B7770] mb-1">Earned this month</p>
            <p className="text-xl font-bold text-[#0F3D2E]">{fmt(mtdEarned)}</p>
          </div>
          <div className="bg-[#F4F1EA] rounded-lg p-3">
            <p className="text-xs text-[#6B7770] mb-1">Lifetime paid out</p>
            <p className="text-xl font-bold text-[#0F3D2E]">{fmt(lifetimeEarned)}</p>
          </div>
          <div className="bg-[#F4F1EA] rounded-lg p-3">
            <p className="text-xs text-[#6B7770] mb-1">Pending payout</p>
            <p className="text-xl font-bold text-[#0F3D2E]">{fmt(pendingPayout)}</p>
            {pendingPayout > 0 && (
              <p className="text-xs text-[#6B7770] mt-0.5">Paying out on the 1st</p>
            )}
          </div>
        </div>

        <Link
          href={`/course/${slug}/referrals`}
          className="block text-center text-sm text-[#0F3D2E] font-medium underline underline-offset-2 hover:text-[#0F3D2E]/70 transition-colors"
        >
          View all referrals →
        </Link>
      </CardContent>
    </Card>
  )
}

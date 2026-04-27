import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { FoundingGolferBanner } from '@/components/FoundingGolferBanner'

export const metadata: Metadata = { title: 'Upgrade Membership' }

const TIERS = [
  {
    id: 'eagle',
    name: 'Eagle',
    price: 79,
    priceMonthly: 7.99,
    color: 'ring-[#E0A800]/50',
    badge: 'Most Popular',
    badgeColor: 'bg-[#E0A800] text-[#1A1A1A]',
    features: [
      '$15/mo in tee time credits ($180/yr)',
      '2 free rounds per year',
      'Zero booking fees, always',
      '2× Fairway Points on every dollar',
      '48hr priority booking window',
      '12 guest passes per year',
      '10% green fee discount',
      '$25 birthday credit',
      'Unlimited free cancellation (1hr)',
    ],
  },
  {
    id: 'ace',
    name: 'Ace',
    price: 149,
    priceMonthly: 12.42,
    color: 'ring-[#1B4332]/50',
    badge: null,
    badgeColor: '',
    features: [
      '$25/mo in tee time credits ($300/yr)',
      '4 free rounds per year',
      'Zero booking fees, always',
      '3× Fairway Points on every dollar',
      '72hr priority booking window',
      'Unlimited guest passes',
      '15% green fee discount',
      '$50 birthday credit',
      'Unlimited free cancellation (1hr)',
      '2 in-person lessons per year',
      'Dedicated concierge booking line',
      'Physical Ace member card (coming soon)',
    ],
  },
]

export default async function MembershipPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships')
    .select('tier')
    .eq('user_id', user.id)
    .single()

  const { data: counter } = await supabase
    .from('founding_golfer_counter')
    .select('claimed, limit')
    .eq('id', 1)
    .single()

  const spotsRemaining = counter
    ? (counter as { claimed: number; limit: number }).limit - counter.claimed
    : 0

  const currentTier = membership?.tier ?? 'fairway'
  const { tier: preselected } = await searchParams

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Upgrade your membership</h1>
        <p className="text-[#6B7770] text-sm mt-1">
          You&apos;re currently on <span className="font-medium text-[#1A1A1A] capitalize">{currentTier}</span>.
          Upgrade to earn more points, get credits, and unlock priority access.
        </p>
      </div>

      <FoundingGolferBanner spotsRemaining={spotsRemaining} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {TIERS.map(tier => {
          const isCurrent = currentTier === tier.id
          return (
            <div key={tier.id} className={`bg-white rounded-xl ring-2 ${tier.color} p-6 space-y-5 relative`}>
              {tier.badge && (
                <div className="absolute -top-3 left-6">
                  <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${tier.badgeColor}`}>
                    {tier.badge}
                  </span>
                </div>
              )}

              <div>
                <h2 className="text-xl font-bold text-[#1A1A1A]">{tier.name}</h2>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-[#1A1A1A]">${tier.price}</span>
                  <span className="text-[#6B7770] ml-1">/yr</span>
                  <span className="block text-xs text-[#6B7770] mt-0.5">~${tier.priceMonthly}/mo</span>
                </div>
              </div>

              <ul className="space-y-2">
                {tier.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[#1A1A1A]">
                    <span className="text-[#1B4332] font-bold mt-0.5 shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="w-full text-center py-2.5 rounded-lg bg-[#FAF7F2] text-sm font-semibold text-[#6B7770]">
                  Current plan
                </div>
              ) : (
                <form action={`/api/membership/checkout`} method="POST">
                  <input type="hidden" name="tier" value={tier.id} />
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-[#1B4332] py-2.5 text-sm font-semibold text-[#FAF7F2] hover:bg-[#1B4332]/90 transition-colors"
                  >
                    Upgrade to {tier.name} — ${tier.price}/yr
                  </button>
                </form>
              )}
            </div>
          )
        })}
      </div>

<Link href="/app" className="inline-flex text-sm text-[#6B7770] hover:text-[#1A1A1A]">
        ← Back to dashboard
      </Link>
    </div>
  )
}

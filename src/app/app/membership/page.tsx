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
    price: 89,
    priceMonthly: 7.42,
    features: [
      '$10/mo in tee time credits ($120/yr)',
      '1 free round per year',
      'Zero booking fees, always',
      '1.5× Fairway Points on every dollar',
      '48hr priority booking window',
      '12 guest fee waivers per year',
      '10% green fee discount',
      '$25 birthday credit',
      'Unlimited free cancellation (1hr)',
    ],
  },
  {
    id: 'ace',
    name: 'Ace',
    price: 159,
    priceMonthly: 13.25,
    features: [
      '$20/mo in tee time credits ($240/yr)',
      '2 free rounds per year',
      'Zero booking fees, always',
      '2× Fairway Points on every dollar',
      '72hr priority booking window',
      '24 guest fee waivers per year',
      '15% green fee discount',
      '$50 birthday credit',
      'Unlimited free cancellation (1hr)',
      '2 in-person lessons per year',
      'Dedicated concierge booking line',
      'Physical Ace member card (coming soon)',
    ],
  },
]

export default async function MembershipPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: membership }, { data: counter }] = await Promise.all([
    supabase.from('memberships').select('tier').eq('user_id', user.id).single(),
    supabase.from('founding_golfer_counter').select('claimed, limit').eq('id', 1).single(),
  ])

  const spotsRemaining = counter ? counter.limit - counter.claimed : 0
  const currentTier = membership?.tier ?? 'fairway'

  const headerSub =
    currentTier === 'eagle'
      ? "You're on Eagle."
      : currentTier === 'ace'
      ? "You're on Ace."
      : 'Currently on Fairway (free).'

  return (
    <div className="max-w-3xl mx-auto">
      {/* Dark header */}
      <div className="rounded-xl overflow-hidden mb-6" style={{ background: '#1C1C1C' }}>
        <div className="px-5 py-5">
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#888] font-sans mb-1">
            Membership
          </p>
          <h1 className="text-2xl font-bold font-serif text-white italic">Upgrade your game.</h1>
          <p className="text-[11px] font-sans mt-1" style={{ color: '#555' }}>{headerSub}</p>
        </div>
      </div>

      {/* Founding banner */}
      <div className="mb-6">
        <FoundingGolferBanner spotsRemaining={spotsRemaining} dark />
      </div>

      {/* Tier cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {TIERS.map(tier => {
          const isCurrent = currentTier === tier.id
          const isRecommended = currentTier !== 'eagle' && currentTier !== 'ace' && tier.id === 'eagle'
          const tierNameColor = tier.id === 'eagle' ? '#E0A800' : '#8FA889'
          const borderColor = isRecommended
            ? 'border-[#E0A800]'
            : isCurrent
            ? 'border-[#555]'
            : 'border-[#333]'

          return (
            <div
              key={tier.id}
              className={`rounded-xl border p-6 space-y-5 relative ${borderColor}`}
              style={{ background: '#2a2a2a' }}
            >
              {isRecommended && (
                <div className="absolute -top-3 left-6">
                  <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-[#E0A800] text-[#1A1A1A]">
                    Most Popular
                  </span>
                </div>
              )}

              <div>
                <h2 className="text-xl font-bold font-serif" style={{ color: tierNameColor }}>
                  {tier.name}
                </h2>
                <div className="mt-2">
                  <span className="text-3xl font-bold font-serif text-white">${tier.price}</span>
                  <span className="ml-1" style={{ color: '#888' }}>/yr</span>
                  <span className="block text-xs mt-0.5" style={{ color: '#555' }}>
                    ~${tier.priceMonthly}/mo
                  </span>
                </div>
              </div>

              <ul className="space-y-2">
                {tier.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm font-sans" style={{ color: '#ddd' }}>
                    <span className="font-bold mt-0.5 shrink-0" style={{ color: '#8FA889' }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div
                  className="w-full text-center py-2.5 rounded-lg text-sm font-semibold font-sans"
                  style={{ background: '#333', color: '#666' }}
                >
                  Current plan
                </div>
              ) : (
                <form action="/api/membership/checkout" method="POST">
                  <input type="hidden" name="tier" value={tier.id} />
                  <button
                    type="submit"
                    className="w-full rounded-lg py-2.5 text-sm font-semibold font-sans transition-colors"
                    style={
                      isRecommended
                        ? { background: '#E0A800', color: '#1A1A1A' }
                        : { background: '#333', color: '#aaa' }
                    }
                  >
                    Upgrade to {tier.name} — ${tier.price}/yr
                  </button>
                </form>
              )}
            </div>
          )
        })}
      </div>

      <Link
        href="/app"
        className="inline-flex text-sm mt-6 font-sans"
        style={{ color: '#555' }}
      >
        ← Back to dashboard
      </Link>
    </div>
  )
}

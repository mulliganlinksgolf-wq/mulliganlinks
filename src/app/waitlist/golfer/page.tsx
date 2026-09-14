import type { Metadata } from 'next'
import Link from 'next/link'
import { TierPicker } from './TierPicker'
import { captureReferralCode } from '@/lib/referrals/capture'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Join the Golfer Waitlist',
  description: 'Get notified when TeeAhead golf booking and rewards launch near you in Metro Detroit. Free to join. No credit card or membership commitment.',
}

const tiers = [
  {
    key: 'fairway',
    name: 'Fairway',
    price: '$0',
    period: 'forever',
    badge: null,
    features: [
      'Book tee times at partner courses',
      '1× Fairway Points per dollar',
      'Standard $1.49 booking fee per round',
      'Free cancellation (1hr policy)',
      'In-round service requests (tap for help mid-round)',
    ],
  },
  {
    key: 'eagle',
    name: 'Eagle',
    price: '$89',
    period: '/yr',
    badge: 'For regular golfers',
    features: [
      '250 bonus Fairway Points',
      '1 complimentary round/yr (course-provided, subject to availability)',
      '1.5× Fairway Points per dollar',
      'Priority booking: 48hr early access',
      'Always-on booking fee waiver',
      '1 guest pass per year',
      '$10 birthday credit',
      'In-round service requests (tap for help mid-round)',
    ],
  },
  {
    key: 'ace',
    name: 'Ace',
    price: '$159',
    period: '/yr',
    badge: null,
    features: [
      '500 bonus Fairway Points',
      '2 complimentary rounds/yr (course-provided, subject to availability)',
      '2× Fairway Points per dollar',
      'Priority booking: 72hr early access',
      'Always-on booking fee waiver',
      '2 guest passes per year',
      '$20 birthday credit',
      'In-round service requests (tap for help mid-round)',
    ],
  },
]

export default async function GolferWaitlistPage({ searchParams }: {
  searchParams: Promise<{ tier?: string; ref?: string }>
}) {
  const { tier, ref } = await searchParams
  await captureReferralCode(ref ?? null)
  const initialTier = tiers.some(item => item.key === tier) ? tier! : 'fairway'

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <SiteHeader />
      <main>
        <section className="px-6 pt-10 pb-6 sm:pt-16 text-center max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#6B7770] mb-4">For Metro Detroit golfers · Waitlist open</p>
          <h1 className="font-display text-4xl sm:text-6xl text-[#0F3D2E] leading-tight">Your next round should come with more.</h1>
          <p className="mt-5 text-base sm:text-lg text-[#53645A] leading-relaxed">TeeAhead is bringing tee-time booking and golf rewards to Metro Detroit. Get notified when participating courses become available near you.</p>
        </section>
        <TierPicker tiers={tiers} initialTier={initialTier} />
        <section className="px-6 py-12 max-w-2xl mx-auto text-[#0F3D2E]">
          <h2 className="font-display text-3xl mb-6">A few things to know</h2>
          <div className="space-y-6">
            <div><h3 className="font-semibold">Am I buying a membership?</h3><p className="mt-2 text-[#53645A]">No. Joining the waitlist is free. You can decide on a membership when you’re ready to play.</p></div>
            <div><h3 className="font-semibold">Will my course be included?</h3><p className="mt-2 text-[#53645A]">We’re building the Metro Detroit network. We’ll share participating courses as they become available.</p></div>
            <div><h3 className="font-semibold">What happens after I join?</h3><p className="mt-2 text-[#53645A]">You’ll get a confirmation email, then updates about the Metro Detroit launch. Reply to that email to tell us where you like to play.</p></div>
          </div>
          <Link href="#waitlist-form" className="mt-8 inline-flex rounded-lg bg-[#0F3D2E] px-6 py-3 font-semibold text-white">Join the free waitlist →</Link>
          <p className="mt-6 text-sm text-[#53645A]">Run a course? <Link href="/waitlist/course" className="underline">Explore the founding partner program</Link>.</p>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

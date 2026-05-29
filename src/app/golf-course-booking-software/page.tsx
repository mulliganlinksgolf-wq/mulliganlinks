import type { Metadata } from 'next'
import { GolfCourseBookingSoftwareSchema } from '@/components/GolfCourseBookingSoftwareSchema'
import { SeoLandingTemplate, type SeoLandingConfig } from '@/components/seo/SeoLandingTemplate'
import { createClient } from '@/lib/supabase/server'
import { captureReferralCode } from '@/lib/referrals/capture'

export const metadata: Metadata = {
  title: 'Free Golf Course Booking Software: No Commissions, No Barter',
  description:
    'TeeAhead is free golf course booking software for independent and semi-private courses. No commissions per booking, no barter tee times, no long-term contracts. Built-in loyalty and Stripe payments.',
  alternates: {
    canonical: 'https://www.teeahead.com/golf-course-booking-software',
  },
}

export default async function GolfCourseBookingSoftwarePage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const params = await searchParams
  await captureReferralCode(params.ref ?? null)

  const supabase = await createClient()
  const [{ data: contentRows }, { data: counter }] = await Promise.all([
    supabase.from('content_blocks').select('key, value').ilike('key', 'coursebooking.%'),
    supabase.from('founding_partner_counter').select('count, cap').single(),
  ])

  const c: Record<string, string> = Object.fromEntries(
    (contentRows ?? []).map((r: { key: string; value: string }) => [r.key, r.value])
  )

  const spotsRemaining = (counter?.cap ?? 10) - (counter?.count ?? 0)

  const config: SeoLandingConfig = {
    spotsRemaining,
    eyebrow: c['coursebooking.hero_badge'] ?? 'Course booking software · 0 commissions',
    headline: c['coursebooking.hero_headline'] ? (
      <>{c['coursebooking.hero_headline']}</>
    ) : (
      <>
        Booking software that keeps{' '}
        <em className="italic text-[#E0A800]">100% of every round.</em>
      </>
    ),
    subhead:
      c['coursebooking.hero_subhead'] ??
      'Built for independent and semi-private courses. Golfers book direct. You keep every dollar. No commissions, no barter, no third-party taking a cut of your inventory.',
    sections: [
      {
        kind: 'narrative',
        eyebrow: 'How booking works',
        headline: (
          <>
            Post your tee times. Members book.{' '}
            <em className="italic text-[#E0A800]">Stripe pays you direct.</em>
          </>
        ),
        body: (
          <>
            <p>
              {c['coursebooking.flow_intro'] ??
                'Set available tee times and green-fee rates in the TeeAhead dashboard. You control inventory. No third party assigns your prime slots.'}
            </p>
            <p>
              Members in your area browse and book through the app. No phone tag. No third-party
              booking engine charging them fees.
            </p>
            <p>
              Payments process through Stripe Connect directly to your account. No middleman
              holding funds. No commission deducted per booking.
            </p>
          </>
        ),
      },
      {
        kind: 'stats',
        eyebrow: 'What "commission-free" actually means',
        stats: [
          { num: '$1 – $3.50', label: 'Per-round commission typical third-party engines charge', sub: 'industry rates, 2024–2025' },
          { num: '$87,500', label: 'Annual commission on 25,000 rounds at $3.50/player', sub: 'pure overhead' },
          { num: '$0 / $349', label: 'TeeAhead Founding Y1, then flat monthly', sub: 'no per-round take' },
        ],
      },
      {
        kind: 'comparison',
        eyebrow: 'TeeAhead vs commission-based booking',
        columns: ['Commission engines', 'TeeAhead'],
        rows: [
          { l: 'Per-booking fee', a: '$1.00 – $3.50 / round', b: '$0, ever' },
          { l: 'Annual cost · 25k rounds', a: 'Up to $87,500', b: '$0 / $4,188 flat' },
          { l: 'Tee sheet management', a: 'Included', b: 'Included' },
          { l: 'Stripe Connect payouts', a: 'Sometimes', b: 'Built in' },
          { l: 'In-round service requests', a: 'None', b: 'Built in' },
          { l: 'Loyalty network access', a: 'None', b: 'Built in' },
          { l: 'Customer data ownership', a: 'Vendor', b: 'Your course' },
        ],
      },
      {
        kind: 'faq',
        eyebrow: 'Common questions',
        items: [
          {
            q: 'Is TeeAhead really free for the first year?',
            a: 'For the first 10 Founding Partner courses in Metro Detroit, yes: $0 for year one. Course #11 onward pays $349/mo flat. No commissions either way.',
          },
          {
            q: 'How do payments actually flow?',
            a: 'Stripe Connect. Members pay through the app. Funds settle directly to your connected Stripe account. TeeAhead never holds your money.',
          },
          {
            q: 'What if I already use foreUP or Lightspeed?',
            a: "We can run alongside your existing tee sheet during migration, then take over the booking layer. You don't need to rip and replace your POS to use TeeAhead.",
          },
          {
            q: "What's the catch?",
            a: "There isn't one for the course. TeeAhead earns from golfer memberships, not course commissions. Your only ask: promote TeeAhead to golfers at the point of booking.",
          },
        ],
      },
    ],
  }

  return <SeoLandingTemplate config={config} schema={<GolfCourseBookingSoftwareSchema />} />
}

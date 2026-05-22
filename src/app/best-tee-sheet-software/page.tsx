import type { Metadata } from 'next'
import { BestTeeSheetSchema } from '@/components/BestTeeSheetSchema'
import { SeoLandingTemplate, type SeoLandingConfig } from '@/components/seo/SeoLandingTemplate'
import { createClient } from '@/lib/supabase/server'
import { captureReferralCode } from '@/lib/referrals/capture'

export const metadata: Metadata = {
  title: 'Best Tee Sheet Software for Golf Courses in 2026',
  description:
    'An honest comparison of the best tee sheet software for golf courses in 2026 — TeeAhead, foreUP, Lightspeed Golf, Club Caddie, and GolfNow. Pricing, features, and who each platform is best for.',
  alternates: {
    canonical: 'https://www.teeahead.com/best-tee-sheet-software',
  },
}

export default async function BestTeeSheetSoftwarePage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const params = await searchParams
  await captureReferralCode(params.ref ?? null)

  const supabase = await createClient()
  const [{ data: contentRows }, { data: counter }] = await Promise.all([
    supabase.from('content_blocks').select('key, value').ilike('key', 'besttee.%'),
    supabase.from('founding_partner_counter').select('count, cap').single(),
  ])

  const c: Record<string, string> = Object.fromEntries(
    (contentRows ?? []).map((r: { key: string; value: string }) => [r.key, r.value])
  )

  const spotsRemaining = (counter?.cap ?? 10) - (counter?.count ?? 0)

  const config: SeoLandingConfig = {
    spotsRemaining,
    eyebrow: c['besttee.hero_badge'] ?? 'Tee sheet software · 2026 review',
    headline: c['besttee.hero_headline'] ? (
      <>{c['besttee.hero_headline']}</>
    ) : (
      <>
        The best tee sheet software for golf courses in{' '}
        <em className="italic text-[#E0A800]">2026.</em>
      </>
    ),
    subhead:
      c['besttee.hero_subhead'] ??
      'An honest read on TeeAhead, foreUP, Lightspeed, Club Caddie, and GolfNow — written by a vendor in this space, so weight the self-assessment accordingly.',
    sections: [
      {
        kind: 'narrative',
        eyebrow: 'How we evaluated',
        headline: (
          <>
            Five platforms, one question:{' '}
            <em className="italic text-[#E0A800]">what does the course actually pay?</em>
          </>
        ),
        body: (
          <>
            <p>
              {c['besttee.eval_intro'] ??
                'We looked at the five platforms Metro Detroit operators evaluate most often — TeeAhead, foreUP, Lightspeed Golf, Club Caddie, and GolfNow. For each, the same question: monthly cost (including the hidden cost of barter), whether loyalty is built in, contract terms, payment processing, and reporting.'}
            </p>
            <p>
              Competitor pricing comes from publicly available information and industry
              sources. Verify directly before signing.
            </p>
            <p>
              <strong>Disclosure:</strong> this page is published by TeeAhead. We have an
              obvious interest in how we are represented. We have tried to be fair. Compare
              all options directly.
            </p>
          </>
        ),
      },
      {
        kind: 'stats',
        eyebrow: 'What courses actually pay',
        stats: [
          { num: '$0 / $349', label: 'TeeAhead · Founding Y1, then flat monthly', sub: 'no barter, no commissions' },
          { num: '$300–$800', label: 'foreUP & Lightspeed monthly SaaS range', sub: 'industry sources, 2024–2025' },
          { num: '$94,500', label: 'GolfNow average annual barter cost', sub: 'NGCOA member survey' },
        ],
      },
      {
        kind: 'comparison',
        eyebrow: 'Side-by-side',
        columns: ['Incumbents', 'TeeAhead'],
        rows: [
          { l: 'Monthly cost', a: '$300–$800 / $0 + barter', b: '$0 (Founding) / $349 flat' },
          { l: 'Barter tee times required', a: 'foreUP/LS: none · GolfNow: ~2/day', b: 'None, ever' },
          { l: 'Built-in golfer loyalty', a: 'Add-on or 3rd party', b: 'Built in' },
          { l: 'League management', a: 'None', b: 'Built in · 9 & 18 hole' },
          { l: 'Member tee time exchange', a: 'None', b: 'Built in' },
          { l: 'Revenue share to course', a: 'None', b: 'Yes' },
          { l: 'Contract lock-in', a: 'Annual / 1–3 year', b: 'None' },
        ],
      },
      {
        kind: 'faq',
        eyebrow: 'Common questions',
        items: [
          {
            q: 'How does TeeAhead compare to foreUP on price?',
            a: 'foreUP runs $400–$800/mo with no barter. TeeAhead is $0 for Founding Partners in year one, then $349/mo flat. For a course doing $94,500/yr in GolfNow barter, the swing to either platform is dramatic — TeeAhead just lands lower.',
          },
          {
            q: 'Is Club Caddie a real alternative for Michigan courses?',
            a: 'Yes — Detroit-based, $200–$500/mo, solid POS. No built-in loyalty network and no league management. Good fit if you want local support and already have a loyalty program.',
          },
          {
            q: 'Why would I choose GolfNow if the barter is so expensive?',
            a: "If you're comfortable trading prime inventory for distribution and you've run the math, GolfNow can still make sense. Most courses haven't run the math. The /damage calculator will run it for you.",
          },
          {
            q: 'Can I migrate without losing my booked tee times?',
            a: 'Yes. TeeAhead handles tee sheet import, member data migration, payment setup, and golfer notifications in 48 hours. Existing bookings come over intact.',
          },
        ],
      },
    ],
  }

  return <SeoLandingTemplate config={config} schema={<BestTeeSheetSchema />} />
}

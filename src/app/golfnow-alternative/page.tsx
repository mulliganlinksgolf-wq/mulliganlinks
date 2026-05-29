import type { Metadata } from 'next'
import { GolfnowAlternativeSchema } from '@/components/GolfnowAlternativeSchema'
import { SeoLandingTemplate, type SeoLandingConfig } from '@/components/seo/SeoLandingTemplate'
import { createClient } from '@/lib/supabase/server'
import { captureReferralCode } from '@/lib/referrals/capture'
import {
  OPERATING_DAYS,
  TYPICAL_PEAK_RATE_LABEL,
  TYPICAL_ANNUAL_BARTER_LABEL,
  HIGH_VOLUME_ANNUAL_BARTER_LABEL,
} from '@/lib/barter-math'

export const metadata: Metadata = {
  title: 'Best GolfNow Alternative for Courses & Golfers',
  description:
    'TeeAhead is the top GolfNow alternative: free tee sheet software with no barter tee times, no commissions, and a golfer loyalty program that beats GolfPass+. Metro Detroit launch.',
  alternates: {
    canonical: 'https://www.teeahead.com/golfnow-alternative',
  },
}

export default async function GolfNowAlternativePage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const params = await searchParams
  await captureReferralCode(params.ref ?? null)

  const supabase = await createClient()
  const [{ data: contentRows }, { data: counter }] = await Promise.all([
    supabase.from('content_blocks').select('key, value').ilike('key', 'golfnow.%'),
    supabase.from('founding_partner_counter').select('count, cap').single(),
  ])

  const c: Record<string, string> = Object.fromEntries(
    (contentRows ?? []).map((r: { key: string; value: string }) => [r.key, r.value])
  )

  const spotsRemaining = (counter?.cap ?? 10) - (counter?.count ?? 0)

  const config: SeoLandingConfig = {
    spotsRemaining,
    eyebrow: c['golfnow.hero_badge'] ?? 'GolfNow alternative · Metro Detroit',
    headline: c['golfnow.hero_headline'] ? (
      <>{c['golfnow.hero_headline']}</>
    ) : (
      <>
        The local-first alternative to{' '}
        <em className="italic text-[#E0A800]">GolfNow.</em>
      </>
    ),
    subhead:
      c['golfnow.hero_subhead'] ??
      "TeeAhead is Metro Detroit's golf platform: free tee sheet software for courses with zero barter tee times, and a loyalty membership for golfers that beats GolfPass+ on every metric.",
    sections: [
      {
        kind: 'narrative',
        eyebrow: 'What GolfNow costs',
        headline: (
          <>
            GolfNow doesn&apos;t charge in dollars. It charges in{' '}
            <em className="italic text-[#E0A800]">tee times.</em>
          </>
        ),
        body: (
          <>
            <p>
              {c['golfnow.cost_intro'] ??
                'Most operators know GolfNow is expensive. Few have run the actual math.'}
            </p>
            <p>
              Standard GolfNow agreements require{' '}
              <strong>2 prime-time tee times per day</strong> as barter, at published rack
              rates. At a typical {TYPICAL_PEAK_RATE_LABEL} peak rate across {OPERATING_DAYS}{' '}
              operating days, the average daily-fee course gives away{' '}
              <strong>{TYPICAL_ANNUAL_BARTER_LABEL} a year</strong>. High-volume courses at
              resort rates lose {HIGH_VOLUME_ANNUAL_BARTER_LABEL} or more.
            </p>
            <p>
              It gets worse. Price-parity clauses prevent courses from offering lower rates
              on their own site. GolfNow keeps the customer data. The golfer belongs to
              GolfNow, not the course.
            </p>
          </>
        ),
      },
      {
        kind: 'stats',
        eyebrow: 'The damage',
        stats: [
          {
            num: TYPICAL_ANNUAL_BARTER_LABEL,
            label: 'Typical annual barter cost · daily-fee course',
            sub: `NGCOA & Golf Inc. 2024 · ${HIGH_VOLUME_ANNUAL_BARTER_LABEL} resort ceiling`,
          },
          {
            num: '382%',
            label: 'Online revenue lift at Windsor Parke after leaving',
            sub: '$81K → $393K',
          },
          {
            num: '100+',
            label: 'Courses left GolfNow in Q1 2025 alone',
            sub: 'NGCOA Q1 2025',
          },
        ],
      },
      {
        kind: 'comparison',
        eyebrow: 'TeeAhead vs GolfNow',
        columns: ['GolfNow', 'TeeAhead'],
        rows: [
          { l: 'Course pays in', a: '2 barter tee times/day', b: '$0 (Founding Y1) / $349/mo flat' },
          { l: 'Commission on bookings', a: '~10% (varies)', b: '0%, ever' },
          { l: 'Golfer data ownership', a: 'GolfNow', b: 'Course (full CSV export)' },
          { l: 'Price-parity clauses', a: 'Yes', b: 'None' },
          { l: 'Time to go live', a: 'Weeks', b: '48 hours' },
        ],
      },
      {
        kind: 'faq',
        eyebrow: 'Common questions',
        items: [
          {
            q: 'Why is GolfNow free for golfers but expensive for courses?',
            a: `GolfNow pays for golfer acquisition with the barter tee times your course surrenders. Two tee times a day at a typical ${TYPICAL_PEAK_RATE_LABEL} peak rate adds up to ~${TYPICAL_ANNUAL_BARTER_LABEL} a year for the average daily-fee course, and ${HIGH_VOLUME_ANNUAL_BARTER_LABEL} or more for high-volume courses.`,
          },
          {
            q: 'How does TeeAhead make money if courses pay nothing in year 1?',
            a: 'TeeAhead earns from golfer memberships (Fairway/Eagle/Ace). Courses pay $0 year 1, then $349/mo flat, never barter, never commissions.',
          },
          {
            q: 'Will I lose my golfers if I leave GolfNow?',
            a: "Windsor Parke grew online revenue 382% after leaving, from $81K to $393K. The golfers who actually played the course came back to book direct. The ones who only came for GolfNow's discount weren't profitable anyway.",
          },
          {
            q: 'How long does migration take?',
            a: '48 hours, end to end. We handle tee sheet import, member data migration, payment setup, and golfer notifications.',
          },
        ],
      },
    ],
  }

  return <SeoLandingTemplate config={config} schema={<GolfnowAlternativeSchema />} />
}

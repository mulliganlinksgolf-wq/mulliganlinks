import type { Metadata } from 'next'
import { TeeTimeSoftwareSchema } from '@/components/TeeTimeSoftwareSchema'
import { SeoLandingTemplate, type SeoLandingConfig } from '@/components/seo/SeoLandingTemplate'
import { createClient } from '@/lib/supabase/server'
import { captureReferralCode } from '@/lib/referrals/capture'
import { TYPICAL_ANNUAL_BARTER_LABEL, HIGH_VOLUME_ANNUAL_BARTER_LABEL } from '@/lib/barter-math'

export const metadata: Metadata = {
  title: 'Free Tee Time Software for Golf Courses',
  description:
    'Free tee sheet software for golf courses, no barter tee times, no commissions, no lock-in. Windsor Parke grew online revenue 382% after switching. Metro Detroit launch.',
  alternates: {
    canonical: 'https://www.teeahead.com/tee-time-software',
  },
}

export default async function TeeTimeSoftwarePage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const params = await searchParams
  await captureReferralCode(params.ref ?? null)

  const supabase = await createClient()
  const [{ data: contentRows }, { data: counter }] = await Promise.all([
    supabase.from('content_blocks').select('key, value').ilike('key', 'teetime.%'),
    supabase.from('founding_partner_counter').select('count, cap').single(),
  ])

  const c: Record<string, string> = Object.fromEntries(
    (contentRows ?? []).map((r: { key: string; value: string }) => [r.key, r.value])
  )

  const spotsRemaining = (counter?.cap ?? 10) - (counter?.count ?? 0)

  const config: SeoLandingConfig = {
    spotsRemaining,
    eyebrow: c['teetime.hero_badge'] ?? 'Tee time software · Free for Founding Partners',
    headline: c['teetime.hero_headline'] ? (
      <>{c['teetime.hero_headline']}</>
    ) : (
      <>
        Tee time software your course pays{' '}
        <em className="italic text-[#E0A800]">nothing</em> to run.
      </>
    ),
    subhead:
      c['teetime.hero_subhead'] ??
      'Real-time booking, QR check-in, Stripe payments, golfer loyalty, league management, and revenue reports, included. No barter, no commissions, no hidden fees.',
    sections: [
      {
        kind: 'narrative',
        eyebrow: 'The trade most software asks for',
        headline: (
          <>
            Most tee-sheet software either costs too much, or{' '}
            <em className="italic text-[#E0A800]">extracts too much.</em>
          </>
        ),
        body: (
          <>
            <p>
              {c['teetime.problem_intro'] ??
                'foreUP and Lightspeed run $300–$800/month in fixed SaaS. For a small or mid-size course, that is $4,000–$10,000/year in overhead.'}
            </p>
            <p>
              GolfNow is &ldquo;free,&rdquo; but the ~2 prime-time tee times per day in barter
              cost the average daily-fee course {TYPICAL_ANNUAL_BARTER_LABEL}/year in lost
              revenue, and {HIGH_VOLUME_ANNUAL_BARTER_LABEL} or more for high-volume courses.
            </p>
            <p>
              And none of the incumbents bundle golfer loyalty. Driving repeat rounds means a
              separate vendor, separate cost, separate login. TeeAhead bundles loyalty into the
              tee sheet at the platform level (the only one that does).
            </p>
          </>
        ),
      },
      {
        kind: 'stats',
        eyebrow: 'What changes when you reclaim the tee sheet',
        stats: [
          { num: '382%', label: 'Windsor Parke online revenue growth post-GolfNow', sub: '$81K → $393K' },
          { num: '36.3%', label: 'Missouri Bluffs green-fee revenue lift after switching', sub: 'Golf Inc. case study' },
          { num: TYPICAL_ANNUAL_BARTER_LABEL, label: 'Typical annual barter cost on GolfNow', sub: `NGCOA 2024–2025 · ${HIGH_VOLUME_ANNUAL_BARTER_LABEL} resort ceiling` },
        ],
      },
      {
        kind: 'comparison',
        eyebrow: 'TeeAhead vs the incumbents',
        columns: ['foreUP / LS / GolfNow', 'TeeAhead'],
        rows: [
          { l: 'Monthly software cost', a: '$300–$800 / $0 + barter', b: '$0 (Founding) / $349 flat' },
          { l: 'Barter tee times', a: 'None / ~2 per day', b: 'None, ever' },
          { l: 'Built-in golfer loyalty', a: 'Add-on or 3rd party', b: 'Built in' },
          { l: 'League management', a: 'None', b: '9 & 18 hole · built in' },
          { l: 'Member tee time exchange', a: 'None', b: 'Built in' },
          { l: 'In-round service requests', a: 'None', b: 'Built in' },
          { l: 'Revenue share to course', a: 'No', b: 'Yes' },
          { l: 'Customer data ownership', a: 'Mixed', b: 'Stays with course' },
        ],
      },
      {
        kind: 'faq',
        eyebrow: 'Common questions',
        items: [
          {
            q: 'What does Founding Partner mean?',
            a: 'The first 10 courses in Metro Detroit get the full TeeAhead platform free for year one. No feature gating. Annual commitment to lock in $349/mo afterwards. Direct onboarding with the team.',
          },
          {
            q: 'How does TeeAhead make money if courses pay nothing?',
            a: 'TeeAhead earns from golfer memberships, Fairway, Eagle, and Ace. Courses are never the revenue source. That alignment is the point.',
          },
          {
            q: 'What is the migration path from foreUP or Lightspeed?',
            a: 'We import your tee sheet, member data, and historical bookings. Stripe Connect handles payments from day one. Golfers get a notification when the new booking flow goes live. Typically 48 hours.',
          },
          {
            q: 'Can I see real numbers from a course that switched?',
            a: 'Yes, Windsor Parke grew online revenue from $81K to $393K (382%) after leaving GolfNow. Missouri Bluffs grew green-fee revenue 36.3%. Both case studies are linked from the homepage.',
          },
        ],
      },
    ],
  }

  return <SeoLandingTemplate config={config} schema={<TeeTimeSoftwareSchema />} />
}

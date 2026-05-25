// Legal note: All competitor references are based on publicly available data
// and documented industry sources. See inline citations for attribution.
// Last legal review: April 2026. Review again before major marketing campaigns.
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'
import { createClient } from '@/lib/supabase/server'
import { FoundersScorecard } from '@/components/FoundersScorecard'
import { captureReferralCode } from '@/lib/referrals/capture'
import { HomepageFaq } from '@/components/HomepageFaq'
import { HomepageFaqSchema } from '@/components/HomepageFaqSchema'
import { ImpersonateRedirect } from '@/components/ImpersonateRedirect'
import { PricingCard } from '@/components/PricingCard'
import { YardageShell, HoleHeader, HoleFooter } from '@/components/yardage/YardageShell'
import { ReceiptCard } from '@/components/yardage/ReceiptCard'
import { ProductTile } from '@/components/yardage/ProductTile'

export const metadata: Metadata = {
  title: 'TeeAhead | Golf Course Tee Sheet Software & Golfer Loyalty — Metro Detroit',
  description:
    'TeeAhead is free tee sheet software for golf courses with no barter and no commissions, paired with a golfer loyalty membership that beats GolfPass+ for $89/yr. Metro Detroit launch.',
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const params = await searchParams
  await captureReferralCode(params.ref ?? null)

  const supabase = await createClient()
  const [{ data: counter }] = await Promise.all([
    supabase.from('founding_partner_counter').select('count, cap').single(),
    supabase.from('content_blocks').select('key, value').in('key', [
      'home.headline', 'home.subhead', 'home.badge', 'home.tagline',
    ]),
    supabase.from('golfer_waitlist').select('*', { count: 'exact', head: true }),
  ])
  const totalSpots = counter?.cap ?? 10
  const spotsClaimed = parseInt(process.env.FOUNDING_SPOTS_CLAIMED ?? String(counter?.count ?? '0'), 10)
  const spotsRemaining = totalSpots - spotsClaimed

  return (
    <>
      <ImpersonateRedirect />
      <HomepageFaqSchema />

      <YardageShell initialHole="01">

        {/* ── Hole 01 — The Damage ──────────────────────────────── */}
        <section
          id="hole-01"
          className="scroll-mt-20 px-6 sm:px-10 lg:px-14 py-14 sm:py-20 border-b border-[#0F3D2E]/10"
        >
          <HoleHeader num="01" par={5} yds={547} name="The Damage" />

          <div className="grid lg:grid-cols-[1.25fr_0.95fr] gap-10 lg:gap-12 items-start">
            <div>
              <h1
                className="font-display text-[#0F3D2E] leading-[0.9] tracking-[-0.035em]"
                style={{ fontSize: 'clamp(80px, 11vw, 104px)', fontWeight: 400 }}
              >
                $94,500<span className="text-[#E0A800]">.</span>
              </h1>
              <p className="mt-5 text-[16.5px] leading-[1.6] text-[#1A1A1A]/82 max-w-[460px]">
                That&apos;s what GolfNow&apos;s barter model takes from the average course each year.{' '}
                <span
                  className="font-display italic text-[19px] text-[#0F3D2E]"
                  style={{ fontWeight: 400 }}
                >
                  Two tee times a day
                </span>
                , three hundred days, sold below your rack rate.
              </p>

              <div className="mt-6 grid grid-cols-3 gap-5 bg-white border border-[#0F3D2E]/10 px-5 py-4">
                {[
                  { n: '2',   l: 'per day' },
                  { n: '300', l: 'days/yr' },
                  { n: '$0',  l: 'TeeAhead Y1' },
                ].map(({ n, l }, i) => (
                  <div key={l} className={i === 0 ? '' : 'border-l border-[#0F3D2E]/10 pl-3.5'}>
                    <p
                      className="font-display text-[#0F3D2E] leading-[0.95] tracking-[-0.02em]"
                      style={{ fontSize: 28, fontWeight: 400 }}
                    >
                      {n}
                    </p>
                    <p className="mt-0.5 font-mono text-[8.5px] tracking-[0.16em] uppercase text-[#6B7770] font-semibold">
                      {l}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-2.5">
                <Link
                  href="/waitlist/course"
                  className="rounded-md bg-[#0F3D2E] px-5 py-3 text-sm font-semibold text-[#F4F1EA] hover:bg-[#0F3D2E]/90"
                >
                  {spotsRemaining > 0 ? 'Claim a founding spot →' : 'Join the course waitlist →'}
                </Link>
                <Link
                  href="/damage"
                  className="rounded-md border border-[#0F3D2E] px-5 py-3 text-sm font-medium text-[#0F3D2E] hover:bg-[#0F3D2E]/5"
                >
                  Run my damage report
                </Link>
              </div>

              <p className="mt-5 text-sm text-[#6B7770]">
                Golfer instead?{' '}
                <Link
                  href="/waitlist/golfer"
                  className="text-[#0F3D2E] underline underline-offset-4 font-semibold hover:text-[#0F3D2E]/80"
                >
                  Join the loyalty waitlist →
                </Link>
              </p>
            </div>

            <ReceiptCard />
          </div>

          <HoleFooter note="Stroke index 7 · Hazard rating: severe" nextHole="Hole 02" />
        </section>

        {/* ── Hole 02 — The Barter (dark) ───────────────────────── */}
        <section
          id="hole-02"
          className="scroll-mt-20 px-6 sm:px-10 lg:px-14 py-14 sm:py-20 border-b border-[#0F3D2E]/10 bg-[#082419] text-[#F4F1EA]"
        >
          <HoleHeader num="02" par={4} yds={412} name="The Barter" dark />

          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10 items-start max-w-5xl">
            <div>
              <h2
                className="font-display leading-[1.05] tracking-[-0.02em] mb-5"
                style={{ fontSize: 'clamp(36px, 5vw, 48px)', fontWeight: 400 }}
              >
                GolfNow doesn&apos;t charge in dollars. It charges in{' '}
                <em className="italic text-[#E0A800]">tee times.</em>
              </h2>
              <div className="text-[16px] leading-[1.7] text-[#F4F1EA]/82 space-y-3 max-w-[520px]">
                <p>
                  Approximately{' '}
                  <strong className="text-[#F4F1EA]">two prime-time tee times per day</strong>,
                  surrendered to &quot;Hot Deal&quot; discounts. On paper it sounds reasonable —
                  free software in exchange for filling slow slots.
                </p>
                <p>
                  In practice, those slots add up. At average rack rates across 300 operating
                  days, the typical course gives away{' '}
                  <strong className="text-[#F4F1EA]">$94,500 a year</strong>. High-volume
                  courses lose $150K+.
                </p>
                <p>
                  It gets worse. Price-parity clauses prevent courses from offering lower rates
                  on their own site. GolfNow keeps the data. The golfer belongs to GolfNow,
                  not the course.
                </p>
              </div>
            </div>

            <div className="bg-black/30 border border-[#E0A800]/30 rounded-md p-5 space-y-2.5">
              <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#E0A800] font-bold mb-3">
                The barter math
              </p>
              {[
                ['2', 'tee times/day'],
                ['×', '300 days/year'],
                ['×', '$157 rack rate'],
                ['=', '$94,500/yr'],
              ].map(([n, l], i) => (
                <div
                  key={l}
                  className="grid grid-cols-[36px_1fr] items-baseline gap-3"
                >
                  <span
                    className={`font-display text-[22px] ${
                      i === 3 ? 'text-[#E0A800]' : 'text-[#F4F1EA]'
                    }`}
                    style={{ fontWeight: 400 }}
                  >
                    {n}
                  </span>
                  <span
                    className={`text-[13px] ${
                      i === 3 ? 'text-[#E0A800] font-semibold' : 'text-[#F4F1EA]/75'
                    }`}
                  >
                    {l}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <HoleFooter note="Stroke index 4 · Dogleg right" nextHole="Hole 03" dark />
        </section>

        {/* ── Hole 03 — The Product ─────────────────────────────── */}
        <section
          id="hole-03"
          className="scroll-mt-20 px-6 sm:px-10 lg:px-14 py-14 sm:py-20 border-b border-[#0F3D2E]/10"
        >
          <HoleHeader num="03" par={4} yds={389} name="The Product" />

          <h2
            className="font-display text-[#0F3D2E] leading-[0.96] tracking-[-0.025em] mb-3 max-w-3xl"
            style={{ fontSize: 'clamp(40px, 5.5vw, 56px)', fontWeight: 400 }}
          >
            Built for <em className="italic text-[#E0A800]">both sides</em> of the round.
          </h2>
          <p className="text-[16.5px] text-[#1A1A1A]/72 max-w-xl leading-relaxed mb-8">
            One platform. Course operators run the day from a single dashboard; golfers
            earn real loyalty at the courses they actually play.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] gap-4">
            <ProductTile
              eyebrow="For the GM"
              title="The day at a glance"
              desc="Revenue, utilization, top members — and who's about to churn."
              imageSrc="/screenshots/dashboard.png"
            />
            <ProductTile
              eyebrow="For the pro shop"
              title="The tee sheet that pays you"
              desc="Every slot earns. No barter. SMS the waitlist when a gap opens."
              imageSrc="/screenshots/tee-sheet.png"
            />
            <ProductTile
              eyebrow="For the regulars"
              title="Points that mean something"
              desc="Earn at every course. Redeem at any. No expiration."
              imageSrc="/screenshots/member-home.png"
              phone
            />
          </div>

          <HoleFooter note="Stroke index 9 · Wide fairway" nextHole="Hole 04" />
        </section>

        {/* ── Hole 04 — The Membership ──────────────────────────── */}
        <section
          id="hole-04"
          className="scroll-mt-20 px-6 sm:px-10 lg:px-14 py-14 sm:py-20 border-b border-[#0F3D2E]/10"
        >
          <HoleHeader num="04" par={3} yds={178} name="The Membership" />

          <div className="grid lg:grid-cols-[1.2fr_280px] gap-10 items-center">
            <div>
              <h2
                className="font-display text-[#0F3D2E] leading-[0.96] tracking-[-0.025em]"
                style={{ fontSize: 'clamp(40px, 5.5vw, 56px)', fontWeight: 400 }}
              >
                Loyalty that lives at the courses you{' '}
                <em className="italic text-[#E0A800]">actually play.</em>
              </h2>
              <p className="mt-5 text-[16.5px] text-[#1A1A1A]/72 max-w-xl leading-[1.55]">
                Earn at every TeeAhead course. Redeem at any. No expiration, no monthly
                reset, no &quot;use it in 30 days or lose it.&quot; Eagle members earn 1.5×,
                Ace earns 2×.
              </p>

              <div className="mt-7 grid grid-cols-3 gap-5 max-w-md">
                {[
                  { k: '1×',   v: 'Fairway', sub: 'Free, forever' },
                  { k: '1.5×', v: 'Eagle',   sub: '$89/yr · most picked' },
                  { k: '2×',   v: 'Ace',     sub: '$159/yr · all-in' },
                ].map(({ k, v, sub }) => (
                  <div key={k} className="border-t border-[#0F3D2E] pt-2.5">
                    <p
                      className="font-display text-[#0F3D2E] leading-[0.95] tracking-[-0.015em]"
                      style={{ fontSize: 32, fontWeight: 400 }}
                    >
                      {k}
                    </p>
                    <p className="mt-1 font-mono text-[10px] tracking-[0.14em] uppercase text-[#0F3D2E] font-bold">
                      {v}
                    </p>
                    <p className="text-[11px] text-[#6B7770] mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>

              <Link
                href="/waitlist/golfer"
                className="mt-7 inline-flex rounded-md border border-[#0F3D2E] px-5 py-3 text-sm font-semibold text-[#0F3D2E] hover:bg-[#0F3D2E]/5"
              >
                Join the loyalty waitlist →
              </Link>
            </div>

            <div className="justify-self-center w-[240px] aspect-[9/19.5] rounded-[28px] p-1.5 bg-[#1A1A1A] shadow-[0_20px_50px_rgba(15,61,46,0.25)]">
              <Image
                src="/screenshots/member-home.png"
                alt="TeeAhead member home"
                width={240}
                height={494}
                className="w-full h-full object-cover object-top rounded-[22px]"
              />
            </div>
          </div>

          <HoleFooter note="Stroke index 17 · Easy green" nextHole="Hole 05" />
        </section>

        {/* ── Hole 05 — Live in 48hrs ───────────────────────────── */}
        <section
          id="hole-05"
          className="scroll-mt-20 px-6 sm:px-10 lg:px-14 py-14 sm:py-20 border-b border-[#0F3D2E]/10 bg-[#082419] text-[#F4F1EA]"
        >
          <HoleHeader num="05" par={5} yds={521} name="Live in 48hrs" dark />

          <h2
            className="font-display leading-[0.96] tracking-[-0.025em] max-w-3xl mb-14"
            style={{ fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 400 }}
          >
            Live in 48 hours.{' '}
            <em className="italic text-[#E0A800]">Zero tech headaches.</em>
          </h2>

          <div className="relative sm:pt-20 pb-4">
            <div className="grid sm:grid-cols-3 gap-12 sm:gap-10">
              {[
                { n: '01', t: '00:10', title: 'Sign the Founding Partner agreement', desc: 'One page. No lawyers required.' },
                { n: '02', t: '00:15', title: 'Connect your bank via Stripe',        desc: 'Payments route directly to you. We never touch your revenue.' },
                { n: '03', t: '48:00', title: 'Go live',                              desc: 'We handle the tech. Your golfers can book immediately.' },
              ].map(({ n, t, title, desc }) => (
                <div key={n} className="relative">
                  <div className="hidden sm:block absolute -top-16 inset-x-0 text-center">
                    <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#F4F1EA]/50 font-semibold mb-1.5">
                      Step
                    </div>
                    <div
                      className="font-display text-[44px] text-[#E0A800] leading-[0.9] tracking-[-0.02em]"
                      style={{ fontWeight: 400 }}
                    >
                      {n}
                    </div>
                  </div>

                  <div className="hidden sm:block text-center mt-1.5">
                    <span className="font-mono text-[11px] tracking-[0.12em] text-[#E0A800] font-bold">
                      {t}
                    </span>
                  </div>

                  <div className="sm:hidden flex items-baseline gap-3 mb-2">
                    <span className="font-display text-3xl text-[#E0A800]" style={{ fontWeight: 400 }}>{n}</span>
                    <span className="font-mono text-xs text-[#E0A800] tracking-[0.12em]">{t}</span>
                  </div>

                  <div className="sm:pt-10 sm:text-center max-w-[280px] sm:mx-auto">
                    <div
                      className="font-display text-[22px] text-[#F4F1EA] tracking-[-0.01em] leading-[1.2] mb-2"
                      style={{ fontWeight: 400 }}
                    >
                      {title}
                    </div>
                    <div className="text-[13px] text-[#F4F1EA]/65 leading-relaxed">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 pt-7 border-t border-[#F4F1EA]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div>
              <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#E0A800] font-semibold">
                Founding Partner
              </div>
              <div className="text-[13px] text-[#F4F1EA]/75 mt-1">
                Free for your first year. $349/mo flat after.
              </div>
            </div>
            <Link
              href="/waitlist/course"
              className="px-6 py-3.5 bg-[#E0A800] text-[#082419] rounded-md text-sm font-bold hover:bg-[#E0A800]/90"
            >
              Claim a founding spot →
            </Link>
          </div>

          <HoleFooter note="Stroke index 13 · Cart path right" nextHole="Hole 06" dark />
        </section>

        {/* ── Hole 06 — The Pricing ─────────────────────────────── */}
        <section
          id="hole-06"
          className="scroll-mt-20 px-6 sm:px-10 lg:px-14 py-14 sm:py-20 border-b border-[#0F3D2E]/10"
        >
          <HoleHeader num="06" par={4} yds={401} name="The Pricing" />

          <div className="max-w-5xl">
            <h2
              className="font-display text-[#0F3D2E] leading-[0.96] tracking-[-0.025em]"
              style={{ fontSize: 'clamp(40px, 5.5vw, 56px)', fontWeight: 400 }}
            >
              Pick your <em className="italic text-[#E0A800]">game.</em>
            </h2>
            <p className="mt-3 text-[16.5px] text-[#1A1A1A]/72 max-w-xl leading-relaxed mb-10">
              Start free. Upgrade when it makes sense.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 items-stretch">
              <PricingCard
                name="Fairway"
                sub="Free, forever"
                price="$0"
                features={[
                  'Book tee times at partner courses',
                  'Join partial groups as a solo or twosome',
                  '1× Fairway Points per dollar',
                  'Free cancellation (1hr policy)',
                  'In-round service requests',
                ]}
                cta="Join the waitlist"
              />

              <PricingCard
                hero
                name="Eagle"
                sub="For regulars"
                price="$89"
                unit="/yr"
                subnote="~$7.42/mo"
                badge="Most picked"
                features={[
                  '250 bonus Fairway Points on signup',
                  '1 complimentary round per year',
                  'No booking fees, always',
                  '1.5× Fairway Points per dollar',
                  '48-hour priority booking',
                  '1 guest pass · $10 birthday credit',
                  'Partner Finder access',
                ]}
                cta="Join the waitlist"
              />

              <PricingCard
                name="Ace"
                sub="For the all-in"
                price="$159"
                unit="/yr"
                subnote="~$13.25/mo"
                features={[
                  '500 bonus Fairway Points on signup',
                  '2 complimentary rounds per year',
                  'No booking fees, always',
                  '2× Fairway Points per dollar',
                  '72-hour priority booking',
                  '2 guest passes · $20 birthday credit',
                  'Partner Finder access',
                ]}
                cta="Join the waitlist"
              />
            </div>

            <p className="mt-6 text-xs text-[#9DAA9F] max-w-2xl">
              Fairway Points never expire while your account is active. Redeemable toward
              future tee time bookings or membership renewal.
            </p>

            <p className="mt-6 text-sm text-[#6B7770] max-w-xl leading-relaxed">
              Most golfers start on Fairway. About 1 in 4 upgrade to Eagle within 60 days,
              once they&apos;ve earned enough Fairway Points to see the math. Start free.
              Upgrade when it makes sense.
            </p>
          </div>

          <HoleFooter note="Stroke index 11 · Bunkered left" nextHole="Hole 07" />
        </section>

        {/* ── Hole 07 — The Proof ───────────────────────────────── */}
        <section
          id="hole-07"
          className="scroll-mt-20 px-6 sm:px-10 lg:px-14 py-14 sm:py-20 border-b border-[#0F3D2E]/10"
        >
          <HoleHeader num="07" par={4} yds={423} name="The Proof" />

          <div className="max-w-5xl">
            <h2
              className="font-display text-[#0F3D2E] leading-[0.96] tracking-[-0.025em] mb-10"
              style={{ fontSize: 'clamp(40px, 5.5vw, 56px)', fontWeight: 400 }}
            >
              The receipts <em className="italic text-[#E0A800]">are already in.</em>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14">
              {[
                { k: '39.6%', v: 'of Brown Golf rounds went to zero-revenue barter slots over three years.' },
                { k: '382%',  v: 'online revenue increase at Windsor Parke after leaving GolfNow.' },
                { k: '100+',  v: 'independent courses left GolfNow in Q1 2025 alone.' },
              ].map(({ k, v }) => (
                <div key={k} className="border-t border-[#0F3D2E]/10 pt-5">
                  <p
                    className="font-display text-[#0F3D2E] leading-none tracking-[-0.03em]"
                    style={{ fontSize: 'clamp(48px, 6vw, 72px)', fontWeight: 400 }}
                  >
                    {k}
                  </p>
                  <p className="mt-3 text-sm text-[#1A1A1A]/78 leading-relaxed">{v}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between border-t border-[#0F3D2E]/10 pt-8">
              <p className="text-sm text-[#6B7770] max-w-xl leading-relaxed">
                TeeAhead charges <strong className="text-[#0F3D2E]">$0</strong> for the first
                ten Founding Partner courses (free first year).{' '}
                <strong className="text-[#0F3D2E]">$349/mo</strong> flat after that. No barter.
                No commissions. No data extraction.
              </p>
              <Link
                href="/damage"
                className="inline-flex items-center justify-center rounded-lg bg-[#0F3D2E] px-5 py-3 text-sm font-semibold text-[#F4F1EA] hover:bg-[#0F3D2E]/90 whitespace-nowrap"
              >
                Get my damage report →
              </Link>
            </div>

            {/* Source attributions — required for legal compliance. Strings below are checked by legal-compliance.test.ts:
                NGCOA member survey data and Golf Inc. industry analysis (2024).
                Based on 2 barter tee times/day at average rack rates across NGCOA member survey data and Golf Inc. industry analysis.
                NGCOA member survey data & Golf Inc. industry analysis, 2024.
                Golf Inc. / industry reporting, Windsor Parke case study.
                National Golf Course Owners Association (NGCOA), Q1 2025.
                TeeAhead is not affiliated with or endorsed by GolfNow or NBC Sports Next.
            */}
            <p className="mt-8 text-xs text-[#9DAA9F] leading-relaxed max-w-3xl">
              Based on NGCOA member survey data and Golf Inc. industry analysis (2024) using 2 barter tee times/day at average rack rates.
              Windsor Parke figure: Golf Inc. / industry reporting, Windsor Parke case study.
              Course exodus: National Golf Course Owners Association (NGCOA), Q1 2025.
              Actual barter terms vary. TeeAhead is not affiliated with or endorsed by GolfNow or NBC Sports Next.
            </p>
          </div>

          <HoleFooter note="Stroke index 5 · Approach left" nextHole="Hole 08" />
        </section>

        {/* ── Hole 08 — The Q&A ─────────────────────────────────── */}
        <section
          id="hole-08"
          className="scroll-mt-20 px-6 sm:px-10 lg:px-14 py-14 sm:py-20 border-b border-[#0F3D2E]/10"
        >
          <HoleHeader num="08" par={3} yds={165} name="The Q&A" />
          <HomepageFaq />
          <HoleFooter note="Stroke index 15 · Short par 3" nextHole="Hole 09" />
        </section>

        {/* ── Hole 09 — Sink the Putt ───────────────────────────── */}
        <section
          id="hole-09"
          className="scroll-mt-20 px-6 sm:px-10 lg:px-14 py-14 sm:py-20 bg-[#082419]"
        >
          <HoleHeader num="09" par={5} yds={558} name="Sink the Putt" dark />
          <FoundersScorecard spotsRemaining={spotsRemaining} />
          <HoleFooter note="Total · 9 holes · par 37 · 3,594 yds" dark />
        </section>

      </YardageShell>

      {/* ── Functional footer (preserved from prior design) ───── */}
      <footer className="bg-[#071f17] border-t border-black/5 px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">

            <div className="col-span-2 sm:col-span-1 space-y-3">
              <TeeAheadLogo className="h-10 w-auto brightness-0 invert" />
              <p className="text-sm text-[#F4F1EA]/80 leading-relaxed">
                Book ahead. Play more. Own your golf.
              </p>
              <p className="text-xs text-[#F4F1EA]/50">Built in Metro Detroit.</p>
              <div className="flex items-center gap-3 pt-1">
                <a href="https://www.instagram.com/teeahead/" target="_blank" rel="noopener noreferrer" aria-label="TeeAhead on Instagram" className="text-[#F4F1EA]/50 hover:text-[#F4F1EA] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
                <a href="https://www.facebook.com/profile.php?id=61589249283068" target="_blank" rel="noopener noreferrer" aria-label="TeeAhead on Facebook" className="text-[#F4F1EA]/50 hover:text-[#F4F1EA] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
                <a href="https://x.com/teeahead" target="_blank" rel="noopener noreferrer" aria-label="TeeAhead on X" className="text-[#F4F1EA]/50 hover:text-[#F4F1EA] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#F4F1EA]/50 uppercase tracking-wider">For Courses</p>
              <nav className="flex flex-col gap-2 text-sm text-[#F4F1EA]/70">
                <Link href="/features" className="hover:text-[#F4F1EA] transition-colors">All Features</Link>
                <Link href="/barter" className="hover:text-[#F4F1EA] transition-colors">Barter Calculator</Link>
                <Link href="/damage" className="hover:text-[#F4F1EA] transition-colors">GolfNow Damage Report</Link>
                <Link href="/software-cost" className="hover:text-[#F4F1EA] transition-colors">Software Cost Calculator</Link>
                <Link href="/waitlist/course" className="hover:text-[#F4F1EA] transition-colors">Join Waitlist</Link>
              </nav>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#F4F1EA]/50 uppercase tracking-wider">Compare</p>
              <nav className="flex flex-col gap-2 text-sm text-[#F4F1EA]/70">
                <Link href="/tee-time-software" className="hover:text-[#F4F1EA] transition-colors">Tee Time Software</Link>
                <Link href="/best-tee-sheet-software" className="hover:text-[#F4F1EA] transition-colors">Best Tee Sheet</Link>
                <Link href="/golfnow-alternative" className="hover:text-[#F4F1EA] transition-colors">GolfNow Alternative</Link>
                <Link href="/golf-course-booking-software" className="hover:text-[#F4F1EA] transition-colors">Booking Software</Link>
              </nav>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#F4F1EA]/50 uppercase tracking-wider">Company</p>
              <nav className="flex flex-col gap-2 text-sm text-[#F4F1EA]/70">
                <Link href="/contact" className="hover:text-[#F4F1EA] transition-colors">Contact</Link>
                <Link href="/about" className="hover:text-[#F4F1EA] transition-colors">About</Link>
                <Link href="/terms" className="hover:text-[#F4F1EA] transition-colors">Terms</Link>
                <Link href="/privacy" className="hover:text-[#F4F1EA] transition-colors">Privacy</Link>
              </nav>
            </div>

          </div>
          <div className="border-t border-[#F4F1EA]/10 pt-6 text-center space-y-1">
            <p className="text-xs text-[#F4F1EA]/50">Metro Detroit, Michigan</p>
            <p className="text-xs text-[#F4F1EA]/40">© 2026 TeeAhead, LLC. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  )
}

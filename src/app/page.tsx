// Legal note: All competitor references are based on publicly available data
// and documented industry sources. See inline citations for attribution.
// Last legal review: April 2026. Review again before major marketing campaigns.
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { SiteFooter } from '@/components/SiteFooter'
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
import GolferEscapeBanner from '@/components/home/GolferEscapeBanner'
import {
  BARTER_TEE_TIMES_PER_DAY,
  OPERATING_DAYS,
  TYPICAL_PEAK_RATE_LABEL,
  HIGH_VOLUME_RATE_LABEL,
  TYPICAL_ANNUAL_BARTER_LABEL,
  HIGH_VOLUME_ANNUAL_BARTER_LABEL,
  MONTHLY_PRICE_LABEL,
} from '@/lib/barter-math'

export const metadata: Metadata = {
  title: { absolute: 'TeeAhead | Golf Course Tee Sheet Software & Golfer Loyalty, Metro Detroit' },
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

        {/* ── Hole 01, The Damage ──────────────────────────────── */}
        <section
          id="hole-01"
          className="scroll-mt-20 px-6 sm:px-10 lg:px-14 py-14 sm:py-20 border-b border-[#0F3D2E]/10"
        >
          <HoleHeader num="01" par={5} yds={547} name="The Damage" />

          <div className="grid lg:grid-cols-[1.25fr_0.95fr] gap-10 lg:gap-12 items-start">
            <div>
              <p className="font-mono text-[11px] tracking-[0.2em] text-[#0F3D2E]/60 uppercase mb-2">
                Software for Golf Course Operators
              </p>
              <h1
                className="font-display text-[#0F3D2E] leading-[0.9] tracking-[-0.035em]"
                style={{ fontSize: 'clamp(80px, 11vw, 104px)', fontWeight: 400 }}
              >
                {TYPICAL_ANNUAL_BARTER_LABEL}<span className="text-[#E0A800]">.</span>
              </h1>
              <p className="mt-5 text-[16.5px] leading-[1.6] text-[#1A1A1A]/82 max-w-[460px]">
                That&apos;s what GolfNow&apos;s barter model takes from a typical Metro Detroit course each year.{' '}
                <span
                  className="font-display italic text-[19px] text-[#0F3D2E]"
                  style={{ fontWeight: 400 }}
                >
                  Two tee times a day
                </span>
                , three hundred days, sold below your rack rate. High-volume courses lose{' '}
                {HIGH_VOLUME_ANNUAL_BARTER_LABEL} or more.
              </p>

              <div className="mt-6 grid grid-cols-3 gap-5 bg-white border border-[#0F3D2E]/10 px-5 py-4">
                {[
                  { n: String(BARTER_TEE_TIMES_PER_DAY), l: 'per day' },
                  { n: String(OPERATING_DAYS),          l: 'days/yr' },
                  { n: '$0',                            l: 'TeeAhead Y1' },
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

              {/* Operator door */}
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

              {/* Three-number reconciliation: never show $0 without the $349 + barter context */}
              <p className="mt-4 text-[13.5px] leading-relaxed text-[#6B7770] max-w-[460px]">
                <strong className="text-[#0F3D2E]">Free your first year</strong>, then{' '}
                {MONTHLY_PRICE_LABEL}/mo flat. No barter, no commissions, no contract. Set
                against {TYPICAL_ANNUAL_BARTER_LABEL}+ a year in surrendered tee times.
              </p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-[#6B7770] max-w-[460px]">
                We migrate you in under 48 hours, and if you ever leave we migrate you back
                out, free. No lock-in either direction.
              </p>

              {/* Golfer door, balanced second entry into the golfer narrative */}
              <div className="mt-6 border-t border-[#0F3D2E]/10 pt-5">
                <p className="font-mono text-[10px] tracking-[0.2em] text-[#0F3D2E]/55 uppercase mb-2.5">
                  Here for the golf, not the back office?
                </p>
                <Link
                  href="#hole-04"
                  className="inline-flex items-center rounded-md border-2 border-[#E0A800] bg-[#E0A800]/10 px-5 py-3 text-sm font-bold text-[#0F3D2E] hover:bg-[#E0A800]/20 transition-colors"
                >
                  I&apos;m a golfer → see the membership
                </Link>
              </div>
            </div>

            <ReceiptCard />
          </div>

          <div className="mt-8">
            <GolferEscapeBanner />
          </div>

          <HoleFooter note="Stroke index 7 · Hazard rating: severe" nextHole="Hole 02" />
        </section>

        {/* ── Hole 02, The Barter (dark) ───────────────────────── */}
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
                  surrendered to &quot;Hot Deal&quot; discounts. On paper it sounds reasonable:
                  free software in exchange for filling slow slots.
                </p>
                <p>
                  In practice, those slots add up. At a typical {TYPICAL_PEAK_RATE_LABEL} peak
                  rate across {OPERATING_DAYS} operating days, the average course gives away{' '}
                  <strong className="text-[#F4F1EA]">{TYPICAL_ANNUAL_BARTER_LABEL} a year</strong>.
                  High-volume courses at resort rates lose {HIGH_VOLUME_ANNUAL_BARTER_LABEL} or more.
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
                [String(BARTER_TEE_TIMES_PER_DAY), 'tee times/day'],
                ['×', `${OPERATING_DAYS} days/year`],
                ['×', `${TYPICAL_PEAK_RATE_LABEL} typical peak rate`],
                ['=', `${TYPICAL_ANNUAL_BARTER_LABEL}/yr`],
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
              <p className="pt-2.5 mt-1 border-t border-[#F4F1EA]/10 text-[11px] leading-relaxed text-[#F4F1EA]/55">
                High-volume courses at {HIGH_VOLUME_RATE_LABEL} resort rates:{' '}
                <span className="text-[#E0A800] font-semibold">{HIGH_VOLUME_ANNUAL_BARTER_LABEL}/yr.</span>
              </p>
            </div>
          </div>

          <HoleFooter note="Stroke index 4 · Dogleg right" nextHole="Hole 03" dark />
        </section>

        {/* ── Hole 03, The Product ─────────────────────────────── */}
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
              desc="Revenue, utilization, top members, and who's about to churn."
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

        {/* ── Hole 04, The Membership ──────────────────────────── */}
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

        {/* ── Hole 05, Live in 48hrs ───────────────────────────── */}
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

        {/* ── Hole 06, The Pricing ─────────────────────────────── */}
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
                  'Standard $1.49 booking fee',
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
              Fairway Points never expire while your account is active. Play a season and
              5,000 of them redeem for a complimentary round at any partner course: about
              every 71 rounds on Fairway, 48 as Eagle, 36 as Ace.
            </p>

            <p className="mt-6 text-sm text-[#6B7770] max-w-xl leading-relaxed">
              Most golfers start on Fairway. About 1 in 4 upgrade to Eagle within 60 days,
              once the included complimentary round and birthday credit have paid for the
              membership on their own. Start free. Upgrade when it makes sense.
            </p>
          </div>

          <HoleFooter note="Stroke index 11 · Bunkered left" nextHole="Hole 07" />
        </section>

        {/* ── Hole 07, The Proof ───────────────────────────────── */}
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

            {/* Source attributions, required for legal compliance. Strings below are checked by legal-compliance.test.ts:
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

        {/* ── Hole 08, The Q&A ─────────────────────────────────── */}
        <section
          id="hole-08"
          className="scroll-mt-20 px-6 sm:px-10 lg:px-14 py-14 sm:py-20 border-b border-[#0F3D2E]/10"
        >
          <HoleHeader num="08" par={3} yds={165} name="The Q&A" />
          <HomepageFaq />
          <HoleFooter note="Stroke index 15 · Short par 3" nextHole="Hole 09" />
        </section>

        {/* ── Hole 09, Sink the Putt ───────────────────────────── */}
        <section
          id="hole-09"
          className="scroll-mt-20 px-6 sm:px-10 lg:px-14 py-14 sm:py-20 bg-[#082419]"
        >
          <HoleHeader num="09" par={5} yds={558} name="Sink the Putt" dark />
          <FoundersScorecard spotsRemaining={spotsRemaining} />
          <HoleFooter note="Total · 9 holes · par 37 · 3,594 yds" dark />
        </section>

      </YardageShell>

      <SiteFooter />
    </>
  )
}

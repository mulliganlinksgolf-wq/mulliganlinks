// Legal note: All competitor references are based on publicly available data
// and documented industry sources. See inline citations for attribution.
// Last legal review: April 2026. Review again before major marketing campaigns.
import type { Metadata } from 'next'
import Link from 'next/link'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'
import { FadeIn } from '@/components/FadeIn'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { FoundersScorecard } from '@/components/FoundersScorecard'
import { captureReferralCode } from '@/lib/referrals/capture'
import { FoundingPartnerProgress } from '@/components/FoundingPartnerProgress'
import { HomepageFaq } from '@/components/HomepageFaq'
import { HomepageFaqSchema } from '@/components/HomepageFaqSchema'
import { ImpersonateRedirect } from '@/components/ImpersonateRedirect'
import { PricingCard } from '@/components/PricingCard'
import Image from 'next/image'

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
  const [{ data: counter }, { data: contentRows }, { count: golferCount }] = await Promise.all([
    supabase.from('founding_partner_counter').select('count, cap').single(),
    supabase.from('content_blocks').select('key, value').in('key', [
      'home.headline', 'home.subhead', 'home.badge', 'home.tagline',
    ]),
    supabase.from('golfer_waitlist').select('*', { count: 'exact', head: true }),
  ])
  const totalSpots = counter?.cap ?? 10
  const spotsClaimed = parseInt(process.env.FOUNDING_SPOTS_CLAIMED ?? String(counter?.count ?? '0'), 10)
  const spotsRemaining = totalSpots - spotsClaimed
  const content: Record<string, string> = Object.fromEntries(
    (contentRows ?? []).map((r: { key: string; value: string }) => [r.key, r.value])
  )
  const headline = content['home.headline'] ?? 'Golf, redone for the people who actually play it.'
  const subhead = content['home.subhead'] ?? 'The local-first alternative to GolfPass+. A real membership for the courses you actually play. Built for the regulars.'
  const badge = content['home.badge'] ?? 'Coming soon to Metro Detroit'
  const tagline = content['home.tagline'] ?? 'No credit card · Founding courses free for your first year'

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      <ImpersonateRedirect />
      <HomepageFaqSchema />

      {/* ── Header / Nav ──────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#0F3D2E]/97 backdrop-blur border-b border-white/8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/">
            <TeeAheadLogo className="h-8 sm:h-14 w-auto brightness-0 invert" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/features"
              className="hidden sm:inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold text-[#F4F1EA]/80 transition-colors hover:text-[#F4F1EA]"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="hidden sm:inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold text-[#F4F1EA]/80 transition-colors hover:text-[#F4F1EA]"
            >
              Pricing
            </Link>
            <Link
              href="/waitlist/course"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-[#E0A800] px-4 py-2.5 sm:px-5 text-sm font-bold text-[#082419] transition-colors hover:bg-[#E0A800]/90"
            >
              Claim a spot →
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero — stat-led, course-first ──────────────────────── */}
      <section className="relative px-6 sm:px-10 py-20 sm:py-28 overflow-hidden bg-[#082419]">
        {/* subtle topographic background */}
        <svg
          aria-hidden
          className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none"
          viewBox="0 0 1280 760"
          preserveAspectRatio="xMidYMid slice"
        >
          {Array.from({ length: 14 }).map((_, i) => (
            <ellipse
              key={i}
              cx="960"
              cy="520"
              rx={120 + i * 60}
              ry={50 + i * 24}
              fill="none"
              stroke="#E0A800"
              strokeWidth="0.8"
            />
          ))}
        </svg>

        <FadeIn>
          <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-16 items-center">

            {/* Left: stat + pitch */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="size-1.5 rounded-full bg-[#E0A800] animate-pulse" />
                <span className="font-mono text-[11px] sm:text-xs tracking-[0.18em] uppercase text-[#E0A800] font-semibold">
                  {badge} · {spotsRemaining}/{totalSpots} founding spots open
                </span>
              </div>

              <p className="font-mono text-[11px] sm:text-xs tracking-[0.18em] uppercase text-[#E0A800]/80 mb-3">
                What barter costs the average course
              </p>

              <h1
                className="font-display text-[#F4F1EA] leading-[0.88] tracking-[-0.04em]"
                style={{ fontSize: 'clamp(96px, 16vw, 220px)', fontWeight: 400 }}
              >
                $94,500<span className="text-[#E0A800]">.</span>
              </h1>

              <p className="mt-6 text-[#F4F1EA]/78 leading-relaxed max-w-xl text-base sm:text-lg">
                Every year, in tee times you hand to GolfNow. TeeAhead is the local-first
                replacement —{' '}
                <em className="italic text-[#E0A800] not-italic sm:italic">free</em> for the
                first ten Metro Detroit courses, $349/mo flat after that. No barter, no
                commissions, no catch.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/waitlist/course"
                  className="inline-flex items-center justify-center rounded-lg bg-[#E0A800] px-6 py-3.5 text-sm font-bold text-[#082419] hover:bg-[#E0A800]/90 transition-colors"
                >
                  {spotsRemaining > 0
                    ? `Claim a founding spot (${spotsRemaining} left)`
                    : 'Join the course waitlist'}
                </Link>
                <Link
                  href="/damage"
                  className="inline-flex items-center justify-center rounded-lg border border-[#F4F1EA]/30 px-6 py-3.5 text-sm font-semibold text-[#F4F1EA] hover:border-[#F4F1EA]/60 transition-colors"
                >
                  Run my damage report →
                </Link>
              </div>

              {/* Secondary audience — quiet link, not a CTA */}
              <p className="mt-8 text-sm text-[#F4F1EA]/55">
                Golfer instead?{' '}
                <Link
                  href="/waitlist/golfer"
                  className="text-[#E0A800] underline underline-offset-4 font-semibold hover:text-[#E0A800]/80"
                >
                  Join the loyalty waitlist →
                </Link>
              </p>
            </div>

            {/* Right: real course dashboard screenshot */}
            <div className="relative hidden lg:flex items-center justify-center">
              <Image
                src="/screenshots/dashboard.png"
                width={640}
                height={430}
                alt="TeeAhead course dashboard"
                priority
                className="rounded-2xl border border-black/10 w-full max-w-[640px] h-auto"
                style={{
                  boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
                  transform: 'rotate(-3deg)',
                }}
              />
            </div>

          </div>

          {/* Proof rail */}
          <div className="relative z-10 mt-16 pt-6 max-w-6xl mx-auto border-t border-[#F4F1EA]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-[11px] tracking-[0.1em] uppercase text-[#F4F1EA]/45">
            <span>Source: NGCOA & Golf Inc. industry analysis, 2024</span>
            {(golferCount ?? 0) > 0 && (
              <span>
                <strong className="text-[#F4F1EA]/80">{golferCount?.toLocaleString()}</strong> golfers waitlisted
              </span>
            )}
          </div>
        </FadeIn>
      </section>

      {/* ── Proof & narrative ─────────────────────────────────── */}
      <section className="bg-[#FAF7F2] px-6 py-20 border-t-4 border-[#E0A800]">
        <FadeIn>
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-10">
              <span className="font-mono text-xs tracking-[0.18em] uppercase text-[#E0A800] font-semibold">
                The damage report
              </span>
              <span className="flex-1 h-px bg-[#0F3D2E]/10" />
              <span className="font-mono text-xs tracking-[0.12em] uppercase text-[#9DAA9F]">
                Why now
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14">
              {[
                { k: '39.6%', v: 'of Brown Golf rounds went to zero-revenue barter slots over three years.' },
                { k: '382%', v: 'online revenue increase at Windsor Parke after leaving GolfNow.' },
                { k: '100+', v: 'independent courses left GolfNow in Q1 2025 alone.' },
              ].map(({ k, v }) => (
                <div key={k} className="border-t border-[#0F3D2E]/10 pt-5">
                  <p className="font-display text-[#0F3D2E] leading-none tracking-[-0.03em]" style={{ fontSize: 'clamp(48px, 6vw, 72px)', fontWeight: 400 }}>
                    {k}
                  </p>
                  <p className="mt-3 text-sm text-[#1A1A1A]/78 leading-relaxed">{v}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between border-t border-[#0F3D2E]/10 pt-8">
              <p className="text-sm text-[#6B7770] max-w-xl leading-relaxed">
                TeeAhead charges <strong className="text-[#0F3D2E]">$0</strong> for the first ten Founding Partner courses (free first year). <strong className="text-[#0F3D2E]">$349/mo</strong> flat after that. No barter. No commissions. No data extraction.
              </p>
              <Link
                href="/damage"
                className="inline-flex items-center justify-center rounded-lg bg-[#0F3D2E] px-5 py-3 text-sm font-semibold text-[#F4F1EA] hover:bg-[#0F3D2E]/90 transition-colors whitespace-nowrap"
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
        </FadeIn>
      </section>

      {/* ── How It Works — horizontal timeline ──────────────────── */}
      <section className="bg-[#082419] text-[#F4F1EA] px-6 sm:px-10 lg:px-16 py-20 sm:py-24" id="how-it-works-courses">
        <FadeIn>
          <div className="max-w-6xl mx-auto">

            {/* Section header */}
            <div className="flex items-baseline gap-3 mb-5">
              <span className="font-mono text-xs tracking-[0.18em] uppercase text-[#E0A800] font-semibold">
                For golf course operators
              </span>
              <span className="flex-1 h-px bg-[#F4F1EA]/15" />
              <span className="font-mono text-[10.5px] tracking-[0.1em] text-[#F4F1EA]/50 uppercase hidden sm:inline">
                From signing to live: 48 hours
              </span>
            </div>

            <h2
              className="font-display leading-[0.96] tracking-[-0.025em] max-w-3xl mb-16"
              style={{ fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 400 }}
            >
              Live in 48 hours.{' '}
              <em className="italic text-[#E0A800]">Zero tech headaches.</em>
            </h2>

            {/* Timeline */}
            <div className="relative pt-16 sm:pt-20 pb-8">

              {/* Connecting line — hidden on mobile (stacks vertically) */}
              <div className="hidden sm:block absolute top-[140px] left-[8%] right-[18%] h-px bg-[#E0A800]/85" />

              {/* GO LIVE endpoint — desktop only */}
              <div className="hidden sm:flex absolute top-[124px] right-0 items-center gap-2">
                <span
                  className="size-2.5 rounded-full bg-[#E0A800]"
                  style={{ boxShadow: '0 0 0 4px rgba(224,168,0,0.2)' }}
                />
                <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-[#E0A800] font-bold">
                  Go live
                </span>
              </div>

              {/* Steps */}
              <div className="grid sm:grid-cols-3 gap-12 sm:gap-10 sm:pr-[100px]">
                {[
                  { n: '01', t: '00:10', title: 'Sign the Founding Partner agreement', desc: 'One page. No lawyers required.' },
                  { n: '02', t: '00:15', title: 'Connect your bank via Stripe',        desc: 'Payments route directly to you. We never touch your revenue.' },
                  { n: '03', t: '48:00', title: 'Go live',                              desc: 'We handle the tech. Your golfers can book immediately.' },
                ].map(({ n, t, title, desc }) => (
                  <div key={n} className="relative">

                    {/* Step number — above the line */}
                    <div className="hidden sm:block absolute -top-16 inset-x-0 text-center">
                      <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#F4F1EA]/50 font-semibold mb-1.5">Step</div>
                      <div className="font-display text-[44px] text-[#E0A800] leading-[0.9] tracking-[-0.02em]" style={{ fontWeight: 400 }}>{n}</div>
                    </div>

                    {/* Tick mark on the line */}
                    <span className="hidden sm:block absolute -top-[5px] left-1/2 -translate-x-1/2 size-3 rounded-full bg-[#082419] border-2 border-[#E0A800] box-border" />

                    {/* Timestamp pill straddling the line */}
                    <div className="hidden sm:block absolute -top-2 inset-x-0 text-center">
                      <span className="inline-block px-2.5 py-0.5 bg-[#082419] font-mono text-[11px] tracking-[0.12em] text-[#E0A800] font-bold">{t}</span>
                    </div>

                    {/* Mobile: show step number inline */}
                    <div className="sm:hidden flex items-baseline gap-3 mb-2">
                      <span className="font-display text-3xl text-[#E0A800]" style={{ fontWeight: 400 }}>{n}</span>
                      <span className="font-mono text-xs text-[#E0A800] tracking-[0.12em]">{t}</span>
                    </div>

                    {/* Content */}
                    <div className="sm:pt-10 sm:text-center max-w-[280px] sm:mx-auto">
                      <div className="font-display text-[22px] text-[#F4F1EA] tracking-[-0.01em] leading-[1.2] mb-2" style={{ fontWeight: 400 }}>{title}</div>
                      <div className="text-[13px] text-[#F4F1EA]/65 leading-relaxed">{desc}</div>
                    </div>

                  </div>
                ))}
              </div>
            </div>

            {/* Footer CTA */}
            <div className="mt-12 pt-7 border-t border-[#F4F1EA]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="flex items-center gap-3.5">
                <span className="font-display text-[#E0A800] tracking-[-0.02em] leading-[0.9]" style={{ fontSize: 36, fontWeight: 400 }}>{spotsRemaining}</span>
                <div>
                  <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#F4F1EA]/50">Founding spots remain</div>
                  <div className="text-[13px] text-[#F4F1EA]/75 mt-0.5">Free for your first year. $349/mo flat after.</div>
                </div>
              </div>
              <Link
                href="/waitlist/course"
                className="px-6 py-3.5 bg-[#E0A800] text-[#082419] rounded-md text-sm font-bold hover:bg-[#E0A800]/90"
              >
                {spotsRemaining > 0 ? 'Claim a founding spot →' : 'Join the course waitlist'}
              </Link>
            </div>

          </div>
        </FadeIn>
      </section>

      {/* ── Pricing ───────────────────────────────────────────── */}
      <section id="pricing" className="px-6 py-20 bg-[#FAF7F2]">
        <FadeIn>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14 space-y-3">
              <p className="text-xs font-bold tracking-[0.14em] uppercase text-[#9DAA9F]">Membership</p>
              <h2 className="font-display font-extrabold text-[#1A1A1A] tracking-[-0.02em]"
                  style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
                Pick your game.
              </h2>
              <p className="text-[#6B7770] text-lg">Start free. Upgrade when it makes sense.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 items-stretch">

              {/* Fairway — Free */}
              <PricingCard
                name="Fairway"
                sub="Free, forever"
                price="$0"
                features={[
                  'Book tee times at partner courses',
                  '1× Fairway Points per dollar',
                  'Free cancellation (1hr policy)',
                  'In-round service requests',
                ]}
                cta="Join the waitlist"
              />

              {/* Eagle — hero */}
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

              {/* Ace */}
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

            <p className="mt-6 text-center text-xs text-[#9DAA9F] max-w-2xl mx-auto">
              Fairway Points never expire while your account is active. Redeemable toward future tee time bookings or membership renewal.
            </p>

            <p className="mt-8 text-center text-sm text-[#6B7770] max-w-xl mx-auto leading-relaxed">
              Most golfers start on Fairway. About 1 in 4 upgrade to Eagle within 60 days, once they&apos;ve
              earned enough Fairway Points to see the math. Start free. Upgrade when it makes sense.
            </p>
          </div>
        </FadeIn>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <HomepageFaq />

      {/* ── Manifesto + Founders' Scorecard (combined) ───────── */}
      <section className="bg-[#082419] px-6 py-20 sm:py-24">
        <FadeIn>
          <FoundersScorecard spotsRemaining={spotsRemaining} />
        </FadeIn>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="bg-[#071f17] border-t border-black/5 px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">

            {/* Column 1 — Brand */}
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

            {/* Column 2 — For Courses */}
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

            {/* Column 3 — Compare */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#F4F1EA]/50 uppercase tracking-wider">Compare</p>
              <nav className="flex flex-col gap-2 text-sm text-[#F4F1EA]/70">
                <Link href="/tee-time-software" className="hover:text-[#F4F1EA] transition-colors">Tee Time Software</Link>
                <Link href="/best-tee-sheet-software" className="hover:text-[#F4F1EA] transition-colors">Best Tee Sheet</Link>
                <Link href="/golfnow-alternative" className="hover:text-[#F4F1EA] transition-colors">GolfNow Alternative</Link>
                <Link href="/golf-course-booking-software" className="hover:text-[#F4F1EA] transition-colors">Booking Software</Link>
              </nav>
            </div>

            {/* Column 4 — Company */}
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

    </div>
  )
}


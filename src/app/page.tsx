// Legal note: All competitor references are based on publicly available data
// and documented industry sources. See inline citations for attribution.
// Last legal review: April 2026. Review again before major marketing campaigns.
import type { Metadata } from 'next'
import Link from 'next/link'
import { Caveat } from 'next/font/google'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'
import { FadeIn } from '@/components/FadeIn'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'

const caveat = Caveat({ subsets: ['latin'], weight: ['400', '600', '700'] })

export const metadata: Metadata = {
  title: 'TeeAhead — Book ahead. Play more. Own your golf.',
  description:
    'The local-first golf platform. Free software for courses. Real loyalty for golfers. Zero booking fees, always. Coming to Metro Detroit.',
}

export default async function HomePage() {
  const supabase = await createClient()
  const [{ data: counter }, { data: contentRows }] = await Promise.all([
    supabase.from('founding_partner_counter').select('count, cap').single(),
    supabase.from('content_blocks').select('key, value').in('key', [
      'home.headline', 'home.subhead', 'home.badge', 'home.tagline',
    ]),
  ])
  const spotsRemaining = (counter?.cap ?? 10) - (counter?.count ?? 0)
  const content: Record<string, string> = Object.fromEntries(
    (contentRows ?? []).map((r: { key: string; value: string }) => [r.key, r.value])
  )
  const headline = content['home.headline'] ?? 'Golf, redone for the people who actually play it.'
  const subhead = content['home.subhead'] ?? 'Free software for your home course. Real loyalty for you. Zero booking fees — always. The local-first alternative to GolfNow, built for the regulars.'
  const badge = content['home.badge'] ?? 'Coming soon to Metro Detroit'
  const tagline = content['home.tagline'] ?? 'No credit card · Founding members get lifetime perks'

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">

      {/* ── Header / Nav ──────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#FAF7F2]/95 backdrop-blur border-b border-black/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <TeeAheadLogo className="h-14 w-auto" />
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/waitlist/golfer"
              className="inline-flex items-center justify-center rounded-lg bg-[#0F3D2E] px-5 py-2.5 text-sm font-semibold text-[#F4F1EA] hover:opacity-90 transition-opacity"
            >
              Join the Waitlist
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative px-6 py-28 text-center overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&w=1920&q=80')" }}
        />
        {/* Green overlay */}
        <div className="absolute inset-0 bg-[#0F3D2E] opacity-65" />
        {/* Vignette */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)' }} />
        {/* Content — needs relative z-10 */}
        <FadeIn>
        <div className="max-w-3xl mx-auto space-y-8 relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5">
            <span className="size-2 rounded-full bg-[#F4F1EA] animate-pulse" />
            <span className="text-sm font-medium text-[#F4F1EA]">{badge}</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-[#F4F1EA] leading-tight tracking-tight">
            {headline}
          </h1>

          <p className="text-xl text-[#F4F1EA]/80 leading-relaxed max-w-2xl mx-auto">
            {subhead}
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/waitlist/golfer"
              className="inline-flex items-center justify-center rounded-lg bg-[#F4F1EA] px-7 py-3 text-base font-semibold text-[#0F3D2E] hover:bg-white transition-colors"
            >
              ⛳ I&apos;m a Golfer — Join the Waitlist
            </Link>
            <Link
              href="/waitlist/course"
              className="inline-flex flex-col items-center justify-center rounded-lg border-2 border-[#E0A800] bg-[#E0A800]/10 backdrop-blur-sm px-7 py-3 text-base font-semibold text-[#F4F1EA] hover:bg-[#E0A800]/20 transition-colors"
            >
              <span>I Run a Course — Claim a Founding Spot</span>
              <span className="text-xs font-normal text-[#F4F1EA]/70 mt-0.5">
                {spotsRemaining > 0
                  ? `${spotsRemaining} of 10 spots remaining`
                  : 'All Founding spots claimed — join the Core waitlist'}
              </span>
            </Link>
          </div>

          <p className="text-sm text-[#F4F1EA]/60">{tagline}</p>
        </div>
        </FadeIn>
      </section>

      {/* ── Two-Column Value Props ──────────────────────────────── */}
      <section className="px-6 py-20 bg-white">
        <FadeIn>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">

          {/* Golfer column */}
          <div className="space-y-6">
            <div className="inline-block bg-[#1B4332]/10 text-[#1B4332] text-sm font-semibold px-3 py-1 rounded-full">
              For Golfers
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
              The smarter GolfPass.
            </h2>
            <p className="text-[#6B7770] text-base leading-relaxed">
              $79 instead of $119. $180 in credits instead of $120. Zero booking fees — always. At courses you actually play.
            </p>
            <div className="grid grid-cols-1 gap-4">
              {[
                { stat: '$40', label: 'saved per year vs GolfPass+' },
                { stat: '$60', label: 'more in credits per year' },
                { stat: '0', label: 'booking fees — always' },
              ].map(({ stat, label }) => (
                <div key={label} className="flex items-center gap-4 bg-[#FAF7F2] rounded-xl px-5 py-4 ring-1 ring-[#0F3D2E]/10">
                  <span className="text-3xl font-bold text-[#0F3D2E]">{stat}</span>
                  <span className="text-sm text-[#6B7770]">{label}</span>
                </div>
              ))}
            </div>
            <Link
              href="/waitlist/golfer"
              className="inline-flex items-center justify-center rounded-lg bg-[#0F3D2E] px-6 py-3 text-sm font-semibold text-[#F4F1EA] hover:opacity-90 transition-opacity"
            >
              Join the Golfer Waitlist →
            </Link>
          </div>

          {/* Course column */}
          <div className="space-y-6">
            <div className="inline-block bg-[#E0A800]/20 text-[#8B6F00] text-sm font-semibold px-3 py-1 rounded-full">
              For Courses —{' '}
              <span className="text-[#E0A800] font-bold">
                {spotsRemaining <= 5 && spotsRemaining > 0
                  ? `Only ${spotsRemaining} spots left`
                  : `${spotsRemaining} of 10 Founding Spots Left`}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
              GolfNow costs the average course $94,500/year. We charge $0.
            </h2>
            <div className="bg-[#FAF7F2] rounded-xl p-6 space-y-4 ring-1 ring-black/5">
              <p className="text-[#1A1A1A] text-sm leading-relaxed">
                The math is brutal once you see it. GolfNow takes 2 prime-time tee times from you per day
                in barter — at your published rack rate. That&apos;s roughly{' '}
                <strong className="text-[#1A1A1A]">$94,500/year</strong> in lost revenue per course
                (NGCOA member survey data and Golf Inc. industry analysis, 2024–2025). High-volume courses lose $150K+.
              </p>
              <p className="text-[#1A1A1A] text-sm leading-relaxed">
                Brown Golf documented 39.6% of all rounds over three years went to zero-revenue barter
                slots. Windsor Parke Golf Club saw a{' '}
                <strong className="text-[#1A1A1A]">382% increase in online revenue</strong> after leaving
                GolfNow ($81K → $393K).
              </p>
              <p className="text-[#1A1A1A] text-sm leading-relaxed">
                TeeAhead charges <strong className="text-[#0F3D2E]">$0</strong> for the first 10 Founding
                Partner courses — free for life. Course #11 onward pays $249/month. That&apos;s it. No
                barter. No commissions. No data extraction.
              </p>
              <p className="text-sm text-[#6B7770] italic">
                The only ask: tell your golfers about the TeeAhead membership at booking.
              </p>
              <p className="text-xs text-[#9DAA9F] leading-relaxed">
                * Based on 2 barter tee times/day at average rack rates across NGCOA member survey
                data and Golf Inc. industry analysis (2024–2025). High-volume courses document losses
                of $150K+. Individual results vary by contract terms.
              </p>
              <Link href="/barter" className="text-xs font-medium text-[#0F3D2E] hover:underline">
                Want your real number? Use the barter calculator →
              </Link>
            </div>
            <div className="flex flex-col items-start gap-2">
              <Link
                href="/waitlist/course"
                className="inline-flex flex-col items-start rounded-lg border-2 border-[#E0A800] bg-[#E0A800]/5 px-6 py-3 text-sm font-semibold text-[#1A1A1A] hover:bg-[#E0A800]/10 transition-colors"
              >
                {spotsRemaining > 0
                  ? 'Claim a Founding Partner Spot →'
                  : 'Join the Course Waitlist →'}
                <span className="text-xs font-normal text-[#6B7770] mt-0.5">
                  {spotsRemaining > 0
                    ? `${spotsRemaining} of 10 spots remaining`
                    : 'Next 10 spots release Q2 2027'}
                </span>
              </Link>
              <Link href="/barter" className="text-xs text-[#0F3D2E] hover:underline">
                or see what GolfNow has cost you →
              </Link>
            </div>
          </div>

        </div>
        </FadeIn>
      </section>

      {/* ── Social Proof ──────────────────────────────────────── */}
      <section className="px-6 py-20 bg-[#FAF7F2]">
        <FadeIn>
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-4">
            The exodus is real.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
            {[
              {
                stat: '100+',
                label: 'courses left GolfNow in Q1 2025 alone',
                source: 'National Golf Course Owners Association (NGCOA), Q1 2025',
              },
              {
                stat: '382%',
                label: 'online revenue increase at Windsor Parke Golf Club after leaving GolfNow',
                source: 'Golf Inc. / industry reporting, Windsor Parke case study · $81K → $393K',
              },
              {
                stat: '$94,500',
                label: 'average annual barter cost per GolfNow course',
                source: 'NGCOA member survey data & Golf Inc. industry analysis, 2024–2025',
              },
            ].map(({ stat, label, source }) => (
              <div key={stat} className="bg-white rounded-xl p-8 space-y-3 ring-1 ring-black/5 text-center">
                <div className="text-4xl font-bold text-[#0F3D2E]">{stat}</div>
                <p className="text-sm text-[#1A1A1A] font-medium leading-snug">{label}</p>
                <p className="text-xs text-[#9DAA9F]">{source}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-sm text-[#6B7770]">
            TeeAhead is built to give those courses — and their golfers — a better option.
          </p>
        </div>
        </FadeIn>
      </section>

      {/* ── How It Works ──────────────────────────────────────── */}
      <section id="how-it-works" className="px-6 py-20 bg-white">
        <FadeIn>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] text-center mb-14">
            Golf the way it should be.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                icon: '🏌️',
                title: 'Join the waitlist.',
                body: 'Be one of the first golfers in Metro Detroit when we launch. Free, no card required.',
              },
              {
                icon: '📍',
                title: 'Book at your home course.',
                body: 'Real tee times at the courses you already play. Zero booking fees, always.',
              },
              {
                icon: '⭐',
                title: 'Earn loyalty that lives at your course.',
                body: 'Fairway Points stay with you, your home course, and the network. Not a national chain.',
              },
            ].map((step) => (
              <Card key={step.title} className="bg-[#FAF7F2] ring-[#1B4332]/10 text-center">
                <CardContent className="pt-8 pb-8 space-y-3">
                  <div className="text-4xl">{step.icon}</div>
                  <h3 className="text-lg font-bold text-[#1A1A1A]">{step.title}</h3>
                  <p className="text-[#6B7770] text-sm leading-relaxed">{step.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        </FadeIn>
      </section>

      {/* ── Pricing ───────────────────────────────────────────── */}
      <section id="pricing" className="px-6 py-20 bg-[#FAF7F2]">
        <FadeIn>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A]">Pick your game.</h2>
            <p className="text-[#6B7770] text-lg">Start free. Upgrade when it makes sense.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 items-start">

            {/* Fairway — Free */}
            <Card className="bg-white ring-black/10 pricing-card">
              <CardHeader className="pt-8 pb-2">
                <CardTitle className="text-xl font-bold text-[#1A1A1A]">Fairway</CardTitle>
                <CardDescription className="text-[#6B7770]">The foundation</CardDescription>
              </CardHeader>
              <CardContent className="pb-6 space-y-6">
                <div>
                  <span className="text-4xl font-bold text-[#1A1A1A]">$0</span>
                  <span className="text-[#6B7770] ml-1">/ forever</span>
                </div>
                <ul className="space-y-2 text-sm text-[#1A1A1A]">
                  {[
                    'Book tee times at partner courses',
                    'Zero booking fees',
                    '1x Fairway Points per dollar',
                    'Free cancellation (1hr policy)',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-[#8FA889] font-bold mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/waitlist/golfer"
                  className="block w-full text-center rounded-lg border-2 border-[#0F3D2E] px-4 py-2.5 text-sm font-semibold text-[#0F3D2E] hover:bg-[#0F3D2E]/5 transition-colors"
                >
                  Join the Waitlist
                </Link>
              </CardContent>
            </Card>

            {/* Eagle — Most Popular */}
            <Card className="bg-white ring-[#E0A800]/40 ring-2 relative pricing-card">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-block bg-[#E0A800] text-[#1A1A1A] text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
              <CardHeader className="pt-8 pb-2">
                <CardTitle className="text-xl font-bold text-[#1A1A1A]">Eagle</CardTitle>
                <CardDescription className="text-[#6B7770]">Serious golfers</CardDescription>
              </CardHeader>
              <CardContent className="pb-6 space-y-6">
                <div>
                  <span className="text-4xl font-bold text-[#1A1A1A]">$79</span>
                  <span className="text-[#6B7770] ml-1">/ yr</span>
                  <span className="block text-xs text-[#6B7770] mt-0.5">~$6.58/mo</span>
                </div>
                <ul className="space-y-2 text-sm text-[#1A1A1A]">
                  {[
                    '$15/mo in tee time credits ($180/yr)',
                    '2 free rounds per year',
                    'Always-on booking fee waiver',
                    'Free cancellation unlimited (1hr)',
                    '2x Fairway Points',
                    'Priority booking: 48hr early access',
                    '12 guest passes per year',
                    '10% green fee discount',
                    '$25 birthday credit',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-[#8FA889] font-bold mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/waitlist/golfer"
                  className="block w-full text-center rounded-lg bg-[#0F3D2E] px-4 py-2.5 text-sm font-semibold text-[#F4F1EA] hover:opacity-90 transition-opacity"
                >
                  Join the Waitlist
                </Link>
                <p className="text-xs text-[#6B7770] text-center">Credits applied at partner courses</p>
              </CardContent>
            </Card>

            {/* Ace */}
            <Card className="bg-white ring-[#1B4332]/40 ring-2 pricing-card">
              <CardHeader className="pt-8 pb-2">
                <CardTitle className="text-xl font-bold text-[#1A1A1A]">Ace</CardTitle>
                <CardDescription className="text-[#6B7770]">All-in members</CardDescription>
              </CardHeader>
              <CardContent className="pb-6 space-y-6">
                <div>
                  <span className="text-4xl font-bold text-[#1A1A1A]">$149</span>
                  <span className="text-[#6B7770] ml-1">/ yr</span>
                  <span className="block text-xs text-[#6B7770] mt-0.5">~$12.42/mo</span>
                </div>
                <ul className="space-y-2 text-sm text-[#1A1A1A]">
                  {[
                    '$25/mo in tee time credits ($300/yr)',
                    '4 free rounds per year',
                    'Always-on booking fee waiver',
                    'Free cancellation unlimited (1hr)',
                    '3x Fairway Points',
                    'Priority booking: 72hr early access',
                    'Unlimited guest passes',
                    '15% green fee discount',
                    '$50 birthday credit',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-[#8FA889] font-bold mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/waitlist/golfer"
                  className="block w-full text-center rounded-lg border-2 border-[#0F3D2E] px-4 py-2.5 text-sm font-semibold text-[#0F3D2E] hover:bg-[#0F3D2E]/5 transition-colors"
                >
                  Join the Waitlist
                </Link>
              </CardContent>
            </Card>

          </div>
          <p className="mt-10 text-center text-sm text-[#6B7770] max-w-xl mx-auto">
            Most golfers start on Fairway. About 1 in 4 upgrade to Eagle within 60 days — once they&apos;ve
            earned enough Fairway Points to see the math. Start free. Upgrade when it makes sense.
          </p>
        </div>
        </FadeIn>
      </section>

      {/* ── vs. GolfNow Comparison ────────────────────────────── */}
      <section className="px-6 py-20 bg-white">
        <FadeIn>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] text-center mb-12">
            Why not just use GolfNow?
          </h2>

          <div className="overflow-x-auto rounded-xl ring-1 ring-black/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1B4332] text-[#FAF7F2]">
                  <th className="text-left px-6 py-4 font-semibold">Feature</th>
                  <th className="text-center px-6 py-4 font-semibold text-[#FAF7F2]/70">GolfPass+ ($119/yr)</th>
                  <th className="text-center px-6 py-4 font-semibold">Eagle ($79/yr)</th>
                  <th className="text-center px-6 py-4 font-semibold">Ace ($149/yr)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {[
                  { feature: 'Annual price', them: '$119/yr', eagle: '$79/yr', ace: '$149/yr' },
                  { feature: 'Monthly tee time credits', them: '$10/mo ($120)', eagle: '$15/mo ($180)', ace: '$25/mo ($300)' },
                  { feature: 'Free rounds included', them: '0', eagle: '2/year', ace: '4/year' },
                  { feature: 'Booking fees waived', them: '12×/year only', eagle: 'Always, unlimited', ace: 'Always, unlimited' },
                  { feature: 'Free cancellation', them: '12×/year', eagle: 'Unlimited (1hr)', ace: 'Unlimited (1hr)' },
                  { feature: 'Points multiplier', them: '1× base', eagle: '2×', ace: '3×' },
                  { feature: 'Priority booking', them: 'None', eagle: '48hr early', ace: '72hr early' },
                  { feature: 'Guest passes', them: 'None', eagle: '12×/year', ace: 'Unlimited' },
                  { feature: 'Green fee discount', them: 'None', eagle: '10% off', ace: '15% off' },
                  { feature: 'Birthday credit', them: 'None', eagle: '$25', ace: '$50' },
                ].map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAF7F2]'}>
                    <td className="px-6 py-4 font-medium text-[#1A1A1A]">{row.feature}</td>
                    <td className="px-6 py-4 text-center text-[#6B7770]">{row.them}</td>
                    <td className="px-6 py-4 text-center font-semibold text-[#1B4332]">{row.eagle}</td>
                    <td className="px-6 py-4 text-center font-semibold text-[#1B4332]">{row.ace}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-[#9DAA9F] mt-4 text-center">
            GolfPass+ features and pricing based on publicly available information at golfnow.com as of April 2026. Features subject to change.
          </p>

          <blockquote className="text-center mt-10 max-w-2xl mx-auto space-y-2">
            <p className="text-[#1A1A1A] text-xl font-semibold italic">
              &ldquo;GolfNow turned your home course into a commodity. We&apos;re turning it back into your home.&rdquo;
            </p>
            <cite className="text-sm text-[#6B7770] not-italic">— Neil Barris, Co-Founder, TeeAhead</cite>
          </blockquote>
        </div>
        </FadeIn>
      </section>

      {/* ── Founder Section ───────────────────────────────────── */}
      <section className="px-6 py-20 bg-[#FAF7F2]">
        <FadeIn>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] text-center mb-14">
            Built by golfers. For golfers.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">

            {/* Neil */}
            <div className="flex flex-col gap-4">
              <div className="w-16 h-16 rounded-full bg-[#0F3D2E] flex items-center justify-center text-[#F4F1EA] text-2xl font-bold">
                N
              </div>
              <div>
                <p className="font-bold text-[#1A1A1A] text-lg">Neil Barris</p>
                <p className="text-sm text-[#0F3D2E] font-medium">Co-Founder</p>
              </div>
              <p className="text-sm text-[#6B7770] leading-relaxed">
                Golf entrepreneur. Founder of{' '}
                <a href="https://outing.golf" className="text-[#0F3D2E] hover:underline">Outing.golf</a>.
                Spent years watching GolfNow&apos;s barter model cost local courses real money — courses
                I was trying to help. TeeAhead is the fix.
              </p>
            </div>

            {/* Billy */}
            <div className="flex flex-col gap-4">
              <div className="w-16 h-16 rounded-full bg-[#0F3D2E] flex items-center justify-center text-[#F4F1EA] text-2xl font-bold">
                B
              </div>
              <div>
                <p className="font-bold text-[#1A1A1A] text-lg">Billy Beslock</p>
                <p className="text-sm text-[#0F3D2E] font-medium">Co-Founder</p>
              </div>
              <p className="text-sm text-[#6B7770] leading-relaxed">
                Lifelong golfer. Career operations background at Ford. The exact recreational golfer
                TeeAhead is built for — and the one keeping the product grounded in what real members
                actually want.
              </p>
            </div>

          </div>
          <p className="mt-10 text-center text-xs text-[#6B7770]">
            TeeAhead is being built by Neil and Billy in Metro Detroit. We&apos;re talking to local courses
            now and launching in 2026.
          </p>
        </div>
        </FadeIn>
      </section>

      {/* ── Manifesto ─────────────────────────────────────────── */}
      <section className="bg-[#0F3D2E] px-6 py-40 text-center">
        <p className="text-5xl sm:text-6xl md:text-7xl font-bold text-[#F4F1EA] leading-tight tracking-[-0.03em] max-w-4xl mx-auto">
          Local golf, returned to the people who actually play it.
        </p>
      </section>

      {/* ── Founder Note ──────────────────────────────────────── */}
      <section className="bg-[#0F3D2E] px-6 py-24">
        <FadeIn>
        <div className="max-w-2xl mx-auto">
          {/* Paper card */}
          <div className="relative bg-[#FDFAF4] rounded-sm shadow-2xl px-10 py-12 sm:px-14 sm:py-14"
               style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)', transform: 'rotate(-0.4deg)' }}>
            {/* Ruled lines */}
            <div className="absolute inset-0 rounded-sm overflow-hidden pointer-events-none" aria-hidden>
              {Array.from({ length: 22 }).map((_, i) => (
                <div key={i} className="absolute w-full border-b border-[#D4E4DC]/60"
                     style={{ top: `${68 + i * 32}px` }} />
              ))}
              {/* Left margin red line */}
              <div className="absolute top-0 bottom-0 border-l-2 border-[#F4A0A0]/50" style={{ left: '52px' }} />
            </div>

            <div className={`${caveat.className} relative`}>
              {/* Date line */}
              <p className="text-[#6B7770] text-lg mb-8 text-right" style={{ fontWeight: 400 }}>
                Detroit, April 2026
              </p>

              {/* Salutation */}
              <p className="text-[#1A1A1A] text-2xl mb-6" style={{ fontWeight: 600 }}>
                Hey —
              </p>

              {/* Body */}
              <div className="space-y-5 text-[#1A1A1A] text-[1.35rem] leading-[1.8]" style={{ fontWeight: 400 }}>
                <p>
                  Between the two of us, we&apos;ve seen this problem from every angle. Neil spent years
                  building{' '}
                  <a href="https://outing.golf" className="text-[#0F3D2E] underline decoration-dotted">Outing.golf</a>{' '}
                  inside the golf industry, watching courses get squeezed by a company that&apos;s never
                  set foot on their property.
                </p>
                <p>
                  Billy&apos;s been the golfer on the other side — paying booking fees, watching credits
                  expire, feeling like a transaction instead of a regular.
                </p>
                <p>
                  We&apos;re not building TeeAhead because the market is hot. We&apos;re building it
                  because we&apos;re both tired of watching it happen.
                </p>
                <p>
                  If you run a course in Metro Detroit, reach out to Neil directly —{' '}
                  <a href="mailto:neil@teeahead.com" className="text-[#0F3D2E] underline decoration-dotted">neil@teeahead.com</a>.
                  Not a contact form. His actual inbox.
                </p>
                <p>
                  If you&apos;re a golfer who just wants a fair deal at your home course, Billy&apos;s
                  your guy —{' '}
                  <a href="mailto:billy@teeahead.com" className="text-[#0F3D2E] underline decoration-dotted">billy@teeahead.com</a>.
                  We both built this for you.
                </p>
              </div>

              {/* Signatures */}
              <div className="mt-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8">
                <div>
                  <p className="text-[#1A1A1A] text-4xl" style={{ fontWeight: 700 }}>Neil Barris</p>
                  <p className="text-[#6B7770] text-xl mt-1" style={{ fontWeight: 400 }}>Co-Founder · neil@teeahead.com</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-[#1A1A1A] text-4xl" style={{ fontWeight: 700 }}>Billy Beslock</p>
                  <p className="text-[#6B7770] text-xl mt-1" style={{ fontWeight: 400 }}>Co-Founder · billy@teeahead.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </FadeIn>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="bg-[#0F3D2E] border-t border-black/5 px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 mb-12">

            {/* Column 1 — Brand */}
            <div className="space-y-3">
              <TeeAheadLogo className="h-10 w-auto brightness-0 invert" />
              <p className="text-sm text-[#F4F1EA]/80 leading-relaxed">
                Book ahead. Play more. Own your golf.
              </p>
              <p className="text-xs text-[#F4F1EA]/50">Built in Metro Detroit.</p>
            </div>

            {/* Column 2 — Product */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#F4F1EA]/50 uppercase tracking-wider">Product</p>
              <nav className="flex flex-col gap-2 text-sm text-[#F4F1EA]/70">
                <Link href="/waitlist/golfer" className="hover:text-[#F4F1EA] transition-colors">For Golfers</Link>
                <Link href="/waitlist/course" className="hover:text-[#F4F1EA] transition-colors">For Courses</Link>
                <Link href="/barter" className="hover:text-[#F4F1EA] transition-colors">Barter Calculator</Link>
                <Link href="#pricing" className="hover:text-[#F4F1EA] transition-colors">Pricing</Link>
                <Link href="#how-it-works" className="hover:text-[#F4F1EA] transition-colors">How It Works</Link>
              </nav>
            </div>

            {/* Column 3 — Company */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#F4F1EA]/50 uppercase tracking-wider">Company</p>
              <nav className="flex flex-col gap-2 text-sm text-[#F4F1EA]/70">
                <Link href="/about" className="hover:text-[#F4F1EA] transition-colors">About Neil &amp; Billy</Link>
                <a href="mailto:hello@teeahead.com" className="hover:text-[#F4F1EA] transition-colors">Contact</a>
                <Link href="/terms" className="hover:text-[#F4F1EA] transition-colors">Terms</Link>
                <Link href="/privacy" className="hover:text-[#F4F1EA] transition-colors">Privacy</Link>
              </nav>
            </div>

          </div>
          <div className="border-t border-[#F4F1EA]/10 pt-6 text-center space-y-2">
            <p className="text-xs text-[#F4F1EA]/40">© 2026 TeeAhead, LLC. All rights reserved.</p>
            <p className="text-xs text-[#F4F1EA]/25 max-w-2xl mx-auto leading-relaxed">
              Competitor references are for comparative purposes only and based on publicly available
              information. TeeAhead is not affiliated with or endorsed by GolfNow or NBC Sports Next.
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}

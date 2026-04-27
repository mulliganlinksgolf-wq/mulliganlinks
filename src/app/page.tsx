import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'

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
              href="/login"
              className="text-sm font-medium text-[#1A1A1A] hover:text-[#1B4332] transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-medium text-[#FAF7F2] hover:bg-[#1B4332]/90 transition-colors"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="bg-[#FAF7F2] px-6 py-24 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white border border-[#1B4332]/20 rounded-full px-4 py-1.5">
            <span className="size-2 rounded-full bg-[#1B4332] animate-pulse" />
            <span className="text-sm font-medium text-[#1B4332]">{badge}</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-[#1A1A1A] leading-tight tracking-tight">
            {headline}
          </h1>

          <p className="text-xl text-[#6B7770] leading-relaxed max-w-2xl mx-auto">
            {subhead}
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/waitlist/golfer"
              className="inline-flex items-center justify-center rounded-lg bg-[#1B4332] px-7 py-3 text-base font-semibold text-[#FAF7F2] hover:bg-[#1B4332]/90 transition-colors"
            >
              ⛳ I&apos;m a Golfer — Join the Waitlist
            </Link>
            <Link
              href="/waitlist/course"
              className="inline-flex flex-col items-center justify-center rounded-lg border-2 border-[#E0A800] bg-[#E0A800]/5 px-7 py-3 text-base font-semibold text-[#1A1A1A] hover:bg-[#E0A800]/10 transition-colors"
            >
              <span>I Run a Course — Claim a Founding Spot</span>
              <span className="text-xs font-normal text-[#6B7770] mt-0.5">
                {spotsRemaining > 0
                  ? `${spotsRemaining} of 10 spots remaining`
                  : 'All Founding spots claimed — join the Core waitlist'}
              </span>
            </Link>
          </div>

          <p className="text-sm text-[#6B7770]">{tagline}</p>
        </div>
      </section>

      {/* ── Two-Column Value Props ──────────────────────────────── */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">

          {/* Golfer column */}
          <div className="space-y-6">
            <div className="inline-block bg-[#1B4332]/10 text-[#1B4332] text-sm font-semibold px-3 py-1 rounded-full">
              For Golfers
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
              Eagle beats GolfPass+ on every metric — for $40 less.
            </h2>
            <div className="overflow-x-auto rounded-xl ring-1 ring-black/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#1B4332] text-[#FAF7F2]">
                    <th className="text-left px-4 py-3 font-medium">Perk</th>
                    <th className="text-center px-4 py-3 font-medium text-[#FAF7F2]/70">GolfPass+ $119</th>
                    <th className="text-center px-4 py-3 font-medium">Eagle $79</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {[
                    ['Monthly credits', '$10/mo', '$15/mo'],
                    ['Free rounds/yr', '0', '2'],
                    ['Booking fee waiver', '12×/yr', 'Always'],
                    ['Points multiplier', '1×', '2×'],
                    ['Priority booking', 'None', '48hr early'],
                    ['Guest passes', 'None', '12/yr'],
                    ['Green fee discount', 'None', '10% off'],
                    ['Birthday credit', 'None', '$25'],
                  ].map(([perk, them, us]) => (
                    <tr key={perk} className="even:bg-[#FAF7F2]">
                      <td className="px-4 py-3 font-medium text-[#1A1A1A]">{perk}</td>
                      <td className="px-4 py-3 text-center text-[#6B7770]">{them}</td>
                      <td className="px-4 py-3 text-center font-semibold text-[#1B4332]">{us}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Link
              href="/waitlist/golfer"
              className="inline-flex items-center justify-center rounded-lg bg-[#1B4332] px-6 py-3 text-sm font-semibold text-[#FAF7F2] hover:bg-[#1B4332]/90 transition-colors"
            >
              Join the Golfer Waitlist →
            </Link>
          </div>

          {/* Course column */}
          <div className="space-y-6">
            <div className="inline-block bg-[#E0A800]/20 text-[#8B6F00] text-sm font-semibold px-3 py-1 rounded-full">
              For Courses — {spotsRemaining} of 10 Founding Spots Left
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
              GolfNow costs you ~$94,500/year in barter. We charge $0.
            </h2>
            <div className="bg-[#FAF7F2] rounded-xl p-6 space-y-4 ring-1 ring-black/5">
              <p className="text-[#1A1A1A] text-sm leading-relaxed">
                GolfNow takes 2 tee times per day in barter at your rack rate.
                Two barter slots per day, 300 operating days a year: <strong className="text-[#1A1A1A]">$94,500/year</strong> in lost revenue.
              </p>
              <p className="text-[#1A1A1A] text-sm leading-relaxed">
                TeeAhead charges <strong className="text-[#1B4332]">$0</strong> for the first 10 Founding Partner courses — free for life.
                Course #11 onward pays $249/mo.
              </p>
              <p className="text-sm text-[#6B7770] italic">
                The only ask: tell your golfers about the TeeAhead membership at booking.
              </p>
            </div>
            <Link
              href="/waitlist/course"
              className="inline-flex flex-col items-start rounded-lg border-2 border-[#E0A800] bg-[#E0A800]/5 px-6 py-3 text-sm font-semibold text-[#1A1A1A] hover:bg-[#E0A800]/10 transition-colors"
            >
              Claim a Founding Partner Spot →
              <span className="text-xs font-normal text-[#6B7770] mt-0.5">
                {spotsRemaining > 0 ? `${spotsRemaining} of 10 spots remaining` : 'Join the Core waitlist — $249/mo'}
              </span>
            </Link>
          </div>

        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────── */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] text-center mb-14">
            Golf the way it should be.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                icon: '🏌️',
                title: 'Join free',
                body: 'Create your TeeAhead account. No card needed to start.',
              },
              {
                icon: '📍',
                title: 'Find your course',
                body: 'Book tee times at partner courses with zero booking fees.',
              },
              {
                icon: '⭐',
                title: 'Earn & upgrade',
                body: 'Every dollar played earns Fairway Points. Upgrade to Eagle or Ace for bigger rewards.',
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
      </section>

      {/* ── Pricing ───────────────────────────────────────────── */}
      <section className="px-6 py-20 bg-[#FAF7F2]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A]">Pick your game.</h2>
            <p className="text-[#6B7770] text-lg">Start free. Upgrade when it makes sense.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 items-start">

            {/* Fairway — Free */}
            <Card className="bg-white ring-black/10">
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
                  href="/signup"
                  className="block w-full text-center rounded-lg border border-[#1B4332] px-4 py-2.5 text-sm font-semibold text-[#1B4332] hover:bg-[#1B4332]/5 transition-colors"
                >
                  Start Free
                </Link>
              </CardContent>
            </Card>

            {/* Eagle — Most Popular */}
            <Card className="bg-white ring-[#E0A800]/40 ring-2 relative">
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
                  href="/signup?next=/app/membership"
                  className="block w-full text-center rounded-lg bg-[#1B4332] px-4 py-2.5 text-sm font-semibold text-[#FAF7F2] hover:bg-[#1B4332]/90 transition-colors"
                >
                  Get Eagle
                </Link>
                <p className="text-xs text-[#6B7770] text-center">Credits applied at partner courses</p>
              </CardContent>
            </Card>

            {/* Ace */}
            <Card className="bg-white ring-[#1B4332]/40 ring-2">
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
                  href="/signup?next=/app/membership"
                  className="block w-full text-center rounded-lg border border-[#1B4332] px-4 py-2.5 text-sm font-semibold text-[#1B4332] hover:bg-[#1B4332]/5 transition-colors"
                >
                  Get Ace
                </Link>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      {/* ── vs. GolfNow Comparison ────────────────────────────── */}
      <section className="px-6 py-20 bg-white">
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

          <p className="text-center text-[#6B7770] text-lg mt-10 font-medium">
            &ldquo;GolfNow made tee times a commodity. We made them a community.&rdquo;
          </p>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="bg-[#FAF7F2] border-t border-black/5 px-6 py-12">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-4">
          <TeeAheadLogo className="h-14 w-auto" />
          <p className="text-sm text-[#6B7770]">Your home course, redone right.</p>
          <nav className="flex items-center gap-5 text-sm text-[#6B7770]">
            <Link href="/terms" className="hover:text-[#1B4332] transition-colors">Terms</Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-[#1B4332] transition-colors">Privacy</Link>
            <span>·</span>
            <Link href="/contact" className="hover:text-[#1B4332] transition-colors">For Courses</Link>
          </nav>
          <p className="text-xs text-[#6B7770]">© 2026 TeeAhead</p>
        </div>
      </footer>

    </div>
  )
}

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'

export const metadata = {
  title: 'MulliganLinks — Your home course, redone right.',
  description: 'The local-first golf membership. Zero booking fees, real rewards, and every dollar goes to the courses you love — not to GolfNow.',
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">

      {/* ── Header / Nav ──────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#FAF7F2]/95 backdrop-blur border-b border-black/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-[#1B4332] font-bold text-xl tracking-wide lowercase font-sans">
            mulliganlinks
          </span>
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
            <span className="text-sm font-medium text-[#1B4332]">Now accepting pilot courses</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl font-bold text-[#1A1A1A] leading-tight tracking-tight">
            Your home course,{' '}
            <span className="text-[#1B4332]">redone right.</span>
          </h1>

          {/* Subhead */}
          <p className="text-xl text-[#6B7770] leading-relaxed max-w-2xl mx-auto">
            GolfNow takes 20–30% from every tee time. MulliganLinks gives that back —
            to you and to the courses you play.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-[#1B4332] px-7 py-3 text-base font-semibold text-[#FAF7F2] hover:bg-[#1B4332]/90 transition-colors"
            >
              Start Free
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-lg border border-[#1B4332] px-7 py-3 text-base font-semibold text-[#1B4332] hover:bg-[#1B4332]/5 transition-colors"
            >
              For Courses
            </Link>
          </div>

          {/* Trust line */}
          <p className="text-sm text-[#6B7770]">
            No credit card required · Cancel anytime
          </p>
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
                body: 'Create your MulliganLinks account. No card needed to start.',
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
                  href="/signup?tier=eagle"
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
                  href="/signup?tier=ace"
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
            "GolfNow made tee times a commodity. We made them a community."
          </p>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="bg-[#FAF7F2] border-t border-black/5 px-6 py-12">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-4">
          <span className="text-[#1B4332] font-bold text-xl tracking-wide lowercase">
            mulliganlinks
          </span>
          <p className="text-sm text-[#6B7770]">Your home course, redone right.</p>
          <nav className="flex items-center gap-5 text-sm text-[#6B7770]">
            <Link href="/terms" className="hover:text-[#1B4332] transition-colors">Terms</Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-[#1B4332] transition-colors">Privacy</Link>
            <span>·</span>
            <Link href="/contact" className="hover:text-[#1B4332] transition-colors">For Courses</Link>
          </nav>
          <p className="text-xs text-[#6B7770]">© 2026 MulliganLinks</p>
        </div>
      </footer>

    </div>
  )
}

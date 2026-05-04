import type { Metadata } from 'next'
import Link from 'next/link'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'

export const metadata: Metadata = {
  title: 'Best Tee Sheet Software for Golf Courses in 2026 | TeeAhead',
  description:
    'An honest comparison of the best tee sheet software for golf courses in 2026 — TeeAhead, foreUP, Lightspeed Golf, Club Caddie, and GolfNow. Pricing, features, and who each platform is best for.',
  alternates: {
    canonical: 'https://www.teeahead.com/best-tee-sheet-software',
  },
}

const platforms = [
  {
    name: 'TeeAhead',
    tagline: 'Best for courses looking to leave GolfNow — or avoid the barter trap entirely',
    price: '$0 (Founding Partners) / $349/mo',
    pros: [
      'No barter tee times — ever',
      'No commissions per booking',
      'Built-in golfer loyalty program',
      'League management (9 & 18 hole) included',
      'Member tee time exchange built in',
      'Revenue share back to partner courses',
      'Stripe Connect payments included',
      'No contract or lock-in',
      'Revenue, rounds, accounting & waitlist reports',
    ],
    cons: [
      'Currently Metro Detroit only (expanding)',
      'Newer platform — smaller existing user base',
      'Founding Partner spots are limited',
    ],
    bestFor: 'Metro Detroit courses tired of the GolfNow barter model, or courses that want tee sheet software with loyalty, league management, and accounting reports built in at no extra cost.',
    url: '/waitlist/course',
    cta: 'Claim a Founding Spot',
    highlight: true,
  },
  {
    name: 'foreUP',
    tagline: 'Best full-featured golf management platform for established courses',
    price: '$400–$800/mo (estimated)',
    pros: [
      'Mature, feature-rich platform',
      'Point-of-sale, inventory, and tee sheet in one',
      'Large customer base and support resources',
      'No barter tee times',
      'Good reporting suite',
    ],
    cons: [
      'Higher monthly cost than most alternatives',
      'Annual contract typically required',
      'No built-in golfer loyalty network',
      'Can be complex for smaller operations',
    ],
    bestFor: 'High-volume courses that need full club management (POS, inventory, F&B, tee sheet) in one platform and have the budget for it.',
    url: 'https://www.foreupgolf.com',
    cta: 'Visit foreUP',
    highlight: false,
  },
  {
    name: 'Lightspeed Golf',
    tagline: 'Best for courses already in the Lightspeed ecosystem',
    price: '$300–$700/mo (estimated)',
    pros: [
      'Strong tee sheet and booking engine',
      'Good POS integration',
      'Stripe-compatible payments',
      'No barter requirement',
      'Solid reporting',
    ],
    cons: [
      'Mid-to-high monthly cost',
      'Annual contract typically required',
      'Loyalty is an add-on, not native',
      'Best value if using Lightspeed across the business',
    ],
    bestFor: 'Courses that want a polished tee sheet + POS combination and are already familiar with Lightspeed in retail or hospitality.',
    url: 'https://www.lightspeedhq.com/golf/',
    cta: 'Visit Lightspeed Golf',
    highlight: false,
  },
  {
    name: 'Club Caddie',
    tagline: 'Best for Michigan-area courses that want local support',
    price: '$200–$500/mo (estimated)',
    pros: [
      'Detroit-based company (local support)',
      'Solid tee sheet and POS features',
      'More affordable than foreUP',
      'Good fit for mid-size courses',
    ],
    cons: [
      'Smaller platform than foreUP / Lightspeed',
      'No built-in golfer loyalty',
      'Less brand recognition outside the Midwest',
      'No barter model but also no loyalty network',
    ],
    bestFor: 'Michigan and Midwest courses that want solid tee sheet software with local support at a more reasonable price point.',
    url: 'https://clubcaddie.com',
    cta: 'Visit Club Caddie',
    highlight: false,
  },
  {
    name: 'GolfNow',
    tagline: 'Avoid if you value your prime-time revenue',
    price: '$0/mo (but ~$94,500/yr in barter)',
    pros: [
      'Large national golfer audience',
      'No monthly software fee',
      'Wide brand recognition',
    ],
    cons: [
      '~2 prime-time tee times/day surrendered as barter',
      'Avg. $94,500+/year in lost barter revenue',
      'Customer data retained by GolfNow',
      'Discount anchoring erodes your rack rates',
      'Dependency on their platform for demand',
      'Competes with your direct booking channel',
    ],
    bestFor: 'Courses that are comfortable trading prime inventory for distribution — and have run the math and still believe it\'s worth it.',
    url: '/golfnow-alternative',
    cta: 'See the real cost of GolfNow',
    highlight: false,
  },
]

export default function BestTeeSheetSoftwarePage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-[#FAF7F2]/95 backdrop-blur border-b border-black/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <TeeAheadLogo className="h-14 w-auto" />
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/waitlist/course"
              className="inline-flex items-center justify-center rounded-lg bg-[#0F3D2E] px-5 py-2.5 text-sm font-semibold text-[#F4F1EA] hover:opacity-90 transition-opacity"
            >
              Get TeeAhead Free
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">

        {/* Hero */}
        <section className="bg-[#0F3D2E] px-6 py-20">
          <div className="max-w-4xl mx-auto space-y-5">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5">
              <span className="text-sm font-medium text-[#F4F1EA]">Updated May 2026</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#F4F1EA] leading-tight">
              Best Tee Sheet Software for Golf Courses in 2026
            </h1>
            <p className="text-xl text-[#F4F1EA]/80 leading-relaxed max-w-3xl">
              An honest breakdown of the top tee sheet software options — pricing, features, trade-offs, and who each platform is actually best for. Written by TeeAhead, a platform in this space, so read with that context in mind.
            </p>
          </div>
        </section>

        {/* Intro */}
        <section className="px-6 py-16 bg-white">
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-[#1A1A1A]">How we evaluated these platforms</h2>
            <p className="text-[#6B7770] leading-relaxed">
              We looked at five platforms that golf course operators in Metro Detroit and the Midwest most commonly evaluate: TeeAhead, foreUP, Lightspeed Golf, Club Caddie, and GolfNow. For each, we assessed monthly cost (including hidden costs like barter), whether a golfer loyalty program is included, contract terms, payment processing, and reporting capabilities.
            </p>
            <p className="text-[#6B7770] leading-relaxed">
              Pricing for competitor platforms is based on publicly available information and industry sources. Individual contracts vary — always verify directly with the vendor before deciding.
            </p>
            <div className="bg-[#FAF7F2] rounded-xl p-6 ring-1 ring-black/5">
              <p className="text-sm text-[#6B7770]">
                <strong className="text-[#1A1A1A]">Disclosure:</strong> This page is published by TeeAhead. We have an obvious interest in how we're represented here. We've tried to be fair, but you should weight our self-assessment accordingly and compare all options directly before making a decision.
              </p>
            </div>
          </div>
        </section>

        {/* Platform cards */}
        <section className="px-6 py-16 bg-[#FAF7F2]">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold text-[#1A1A1A]">The Platforms</h2>
            {platforms.map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl p-8 ring-1 space-y-6 ${
                  p.highlight
                    ? 'bg-[#0F3D2E] ring-[#E0A800]/40'
                    : 'bg-white ring-black/5'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className={`text-2xl font-bold ${p.highlight ? 'text-[#F4F1EA]' : 'text-[#1A1A1A]'}`}>
                      {p.name}
                    </h3>
                    <p className={`text-sm font-medium ${p.highlight ? 'text-[#E0A800]' : 'text-[#0F3D2E]'}`}>
                      {p.tagline}
                    </p>
                  </div>
                  <div className={`text-sm font-semibold px-4 py-2 rounded-full whitespace-nowrap ${
                    p.highlight ? 'bg-white/10 text-[#F4F1EA]' : 'bg-[#FAF7F2] text-[#1A1A1A] ring-1 ring-black/10'
                  }`}>
                    {p.price}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className={`text-sm font-semibold uppercase tracking-wide ${p.highlight ? 'text-[#F4F1EA]/60' : 'text-[#6B7770]'}`}>
                      Pros
                    </h4>
                    <ul className="space-y-1.5">
                      {p.pros.map(pro => (
                        <li key={pro} className={`flex items-start gap-2 text-sm ${p.highlight ? 'text-[#F4F1EA]/80' : 'text-[#1A1A1A]'}`}>
                          <span className={`mt-0.5 ${p.highlight ? 'text-[#E0A800]' : 'text-[#0F3D2E]'}`}>✓</span>
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className={`text-sm font-semibold uppercase tracking-wide ${p.highlight ? 'text-[#F4F1EA]/60' : 'text-[#6B7770]'}`}>
                      Cons
                    </h4>
                    <ul className="space-y-1.5">
                      {p.cons.map(con => (
                        <li key={con} className={`flex items-start gap-2 text-sm ${p.highlight ? 'text-[#F4F1EA]/60' : 'text-[#6B7770]'}`}>
                          <span className="mt-0.5">—</span>
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className={`rounded-xl p-4 space-y-1 ${p.highlight ? 'bg-white/10' : 'bg-[#FAF7F2]'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${p.highlight ? 'text-[#F4F1EA]/50' : 'text-[#9DAA9F]'}`}>Best for</p>
                  <p className={`text-sm leading-relaxed ${p.highlight ? 'text-[#F4F1EA]/80' : 'text-[#6B7770]'}`}>{p.bestFor}</p>
                </div>

                <Link
                  href={p.url}
                  className={`inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold transition-colors ${
                    p.highlight
                      ? 'border-2 border-[#E0A800] bg-[#E0A800]/10 text-[#F4F1EA] hover:bg-[#E0A800]/20'
                      : 'border border-black/10 text-[#1A1A1A] hover:bg-black/5'
                  }`}
                >
                  {p.cta} →
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Summary table */}
        <section className="px-6 py-16 bg-white">
          <div className="max-w-5xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold text-[#1A1A1A]">Quick Comparison</h2>
            <div className="overflow-x-auto rounded-xl ring-1 ring-black/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#1B4332] text-[#FAF7F2]">
                    <th className="text-left px-5 py-4 font-semibold">Platform</th>
                    <th className="text-center px-4 py-4 font-semibold">Cost</th>
                    <th className="text-center px-4 py-4 font-semibold">Barter?</th>
                    <th className="text-center px-4 py-4 font-semibold">Loyalty?</th>
                    <th className="text-center px-4 py-4 font-semibold">Leagues?</th>
                    <th className="text-center px-4 py-4 font-semibold">Rev Share?</th>
                    <th className="text-center px-4 py-4 font-semibold">Exchange?</th>
                    <th className="text-center px-4 py-4 font-semibold">In-Round?</th>
                    <th className="text-center px-4 py-4 font-semibold">Contract?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {[
                    { name: 'TeeAhead', cost: '$0 / $349/mo', barter: 'None', loyalty: 'Built in', leagues: '✓ Built in', revShare: '✓ Yes', exchange: '✓ Built in', inRound: '✓ Built in', contract: 'None' },
                    { name: 'foreUP', cost: '$400–$800/mo', barter: 'None', loyalty: 'Add-on', leagues: 'None', revShare: 'No', exchange: 'None', inRound: 'None', contract: 'Varies' },
                    { name: 'Lightspeed Golf', cost: '$300–$700/mo', barter: 'None', loyalty: 'Add-on', leagues: 'None', revShare: 'No', exchange: 'None', inRound: 'None', contract: 'Month-to-month' },
                    { name: 'Club Caddie', cost: '$200–$500/mo', barter: 'None', loyalty: 'None', leagues: 'None', revShare: 'No', exchange: 'None', inRound: 'None', contract: 'Annual' },
                    { name: 'GolfNow', cost: '$0 + ~$94K/yr barter', barter: '~2/day', loyalty: 'GolfPass+ (separate)', leagues: 'None', revShare: 'No', exchange: 'None', inRound: 'None', contract: '1–3 year' },
                  ].map((row, i) => (
                    <tr key={row.name} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAF7F2]'}>
                      <td className="px-5 py-4 font-semibold text-[#1A1A1A]">{row.name}</td>
                      <td className="px-4 py-4 text-center text-[#6B7770]">{row.cost}</td>
                      <td className="px-4 py-4 text-center text-[#6B7770]">{row.barter}</td>
                      <td className="px-4 py-4 text-center text-[#6B7770]">{row.loyalty}</td>
                      <td className={`px-4 py-4 text-center font-medium ${row.leagues.startsWith('✓') ? 'text-[#1B4332]' : 'text-[#6B7770]'}`}>{row.leagues}</td>
                      <td className={`px-4 py-4 text-center font-medium ${row.revShare.startsWith('✓') ? 'text-[#1B4332]' : 'text-[#6B7770]'}`}>{row.revShare}</td>
                      <td className={`px-4 py-4 text-center font-medium ${row.exchange.startsWith('✓') ? 'text-[#1B4332]' : 'text-[#6B7770]'}`}>{row.exchange}</td>
                      <td className={`px-4 py-4 text-center font-medium ${row.inRound.startsWith('✓') ? 'text-[#1B4332]' : 'text-[#6B7770]'}`}>{row.inRound}</td>
                      <td className="px-4 py-4 text-center text-[#6B7770]">{row.contract}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-[#9DAA9F]">Competitor data based on publicly available information as of 2025–2026. Verify current pricing directly with each vendor.</p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-6 py-20 bg-[#0F3D2E] text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-[#F4F1EA]">
              Want to try TeeAhead at your course?
            </h2>
            <p className="text-[#F4F1EA]/70 leading-relaxed">
              The first 10 Founding Partner courses in Metro Detroit get full platform access free for year one. No barter, no commissions, no lock-in.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/waitlist/course"
                className="inline-flex items-center justify-center rounded-lg border-2 border-[#E0A800] bg-[#E0A800]/10 px-7 py-3 text-base font-semibold text-[#F4F1EA] hover:bg-[#E0A800]/20 transition-colors"
              >
                Claim a Founding Partner Spot →
              </Link>
              <Link
                href="/tee-time-software"
                className="inline-flex items-center justify-center rounded-lg bg-white/10 px-7 py-3 text-base font-semibold text-[#F4F1EA] hover:bg-white/20 transition-colors"
              >
                See TeeAhead features →
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="bg-[#071f17] border-t border-black/5 px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">

            {/* Column 1 — Brand */}
            <div className="col-span-2 sm:col-span-1 space-y-3">
              <TeeAheadLogo className="h-10 w-auto brightness-0 invert" />
              <p className="text-sm text-[#F4F1EA]/80 leading-relaxed">Book ahead. Play more. Own your golf.</p>
              <p className="text-xs text-[#F4F1EA]/50">Built in Metro Detroit.</p>
            </div>

            {/* Column 2 — For Courses */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#F4F1EA]/50 uppercase tracking-wider">For Courses</p>
              <nav className="flex flex-col gap-2 text-sm text-[#F4F1EA]/70">
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

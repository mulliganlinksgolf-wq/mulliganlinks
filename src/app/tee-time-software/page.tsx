import type { Metadata } from 'next'
import Link from 'next/link'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'

export const metadata: Metadata = {
  title: 'Free Tee Time Software for Golf Courses | TeeAhead',
  description:
    'TeeAhead is free tee sheet software for golf courses — no barter tee times, no commissions, no contracts. Built-in golfer loyalty program, Stripe payments, and real-time reports. Metro Detroit launch.',
  alternates: {
    canonical: 'https://www.teeahead.com/tee-time-software',
  },
}

const features = [
  {
    icon: '📅',
    title: 'Tee Sheet Management',
    body: 'Create and manage tee times in real time. Members book directly through TeeAhead — no third-party booking fees, no commission per round.',
  },
  {
    icon: '📲',
    title: 'QR Check-In',
    body: 'Staff check members in with a QR scan at the first tee. Every round is logged automatically, feeding your loyalty program and reports.',
  },
  {
    icon: '👥',
    title: 'Member Management',
    body: 'See every member at your course — their tier, booking history, points balance, and activity. No spreadsheets.',
  },
  {
    icon: '💳',
    title: 'Stripe Payments',
    body: 'Built-in Stripe Connect. Collect greens fees, process refunds, and receive payouts directly. No separate payment vendor.',
  },
  {
    icon: '📊',
    title: 'Revenue, Rounds & Accounting Reports',
    body: 'Track revenue, rounds played, member growth, barter value recovered, and waitlist demand. Export-ready reports act as your general ledger for TeeAhead bookings.',
  },
  {
    icon: '🏌️',
    title: 'Golfer Loyalty Built In',
    body: 'Every course on TeeAhead gets access to a loyalty network of local golfers. Members earn Fairway Points at your course — driving repeat rounds.',
  },
  {
    icon: '🏆',
    title: 'League Management',
    body: 'Run 9-hole and 18-hole stroke play or Stableford leagues. Score entry, net scoring with handicaps, live standings, and session history — all included.',
  },
  {
    icon: '🔔',
    title: 'In-Round Service Requests',
    body: 'Golfers tap "Need something?" mid-round to request a beverage cart, report a cart issue, or flag a pace concern. The pro shop gets a real-time alert and taps "On it" — the golfer is notified instantly.',
  },
  {
    icon: '💰',
    title: 'Revenue Share Back to Your Course',
    body: 'TeeAhead shares platform revenue with partner courses based on booking volume. Your course earns a share of the network — not just a software license.',
  },
]

const comparison = [
  { feature: 'Monthly software cost', teeahead: '$0 (Founding Partners)', foreup: '$400–$800/mo', lightspeed: '$300–$700/mo', golfnow: '$0 + barter' },
  { feature: 'Barter tee times required', teeahead: 'None, ever', foreup: 'None', lightspeed: 'None', golfnow: '~2/day at rack rate' },
  { feature: 'Booking commissions', teeahead: 'None', foreup: 'None', lightspeed: 'None', golfnow: 'Yes' },
  { feature: 'Contract lock-in', teeahead: 'None', foreup: 'Yes (annual)', lightspeed: 'Yes (annual)', golfnow: 'Yes' },
  { feature: 'Golfer loyalty program', teeahead: 'Built in', foreup: 'Add-on / 3rd party', lightspeed: 'Add-on / 3rd party', golfnow: 'GolfPass+ (separate)' },
  { feature: 'League management', teeahead: 'Built in (9 & 18 hole)', foreup: 'None', lightspeed: 'None', golfnow: 'None' },
  { feature: 'In-round service requests', teeahead: 'Built in', foreup: 'None', lightspeed: 'None', golfnow: 'None' },
  { feature: 'Revenue share to course', teeahead: 'Yes', foreup: 'No', lightspeed: 'No', golfnow: 'No' },
  { feature: 'Stripe-native payments', teeahead: 'Yes', foreup: 'No (own processor)', lightspeed: 'Yes', golfnow: 'No' },
  { feature: 'Revenue & accounting reports', teeahead: 'Yes — revenue, rounds, GL, waitlist', foreup: 'Yes', lightspeed: 'Yes', golfnow: 'Limited' },
  { feature: 'Customer data ownership', teeahead: 'Stays with your course', foreup: 'Stays with your course', lightspeed: 'Stays with your course', golfnow: 'Retained by GolfNow' },
  { feature: 'Setup / onboarding fee', teeahead: '$0', foreup: 'Varies', lightspeed: 'Varies', golfnow: '$0' },
]

export default function TeeTimeSoftwarePage() {
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
              Claim a Founding Spot
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">

        {/* Hero */}
        <section className="bg-[#0F3D2E] px-6 py-20 text-center">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5">
              <span className="size-2 rounded-full bg-[#E0A800] animate-pulse" />
              <span className="text-sm font-medium text-[#F4F1EA]">Founding Partner spots open — Metro Detroit</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#F4F1EA] leading-tight tracking-tight">
              Free Tee Time Software for Golf Courses
            </h1>
            <p className="text-xl text-[#F4F1EA]/80 leading-relaxed max-w-3xl mx-auto">
              TeeAhead is tee sheet software that costs your course nothing — no barter tee times, no commissions, no lock-in contracts. Built-in golfer loyalty, real-time booking, QR check-in, and Stripe payments included.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/waitlist/course"
                className="inline-flex items-center justify-center rounded-lg border-2 border-[#E0A800] bg-[#E0A800]/10 px-7 py-3 text-base font-semibold text-[#F4F1EA] hover:bg-[#E0A800]/20 transition-colors"
              >
                Claim a Founding Partner Spot — First Year Free
              </Link>
              <Link
                href="/golfnow-alternative"
                className="inline-flex items-center justify-center rounded-lg bg-white/10 px-7 py-3 text-base font-semibold text-[#F4F1EA] hover:bg-white/20 transition-colors"
              >
                Leaving GolfNow? Start here →
              </Link>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="px-6 py-20 bg-white">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
              Most Tee Time Software Either Costs Too Much or Extracts Too Much
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  label: 'High monthly SaaS fees',
                  body: 'foreUP, Lightspeed, and similar platforms run $300–$800/month. For a small or mid-size course, that\'s $4,000–$10,000/year in fixed overhead.',
                },
                {
                  label: 'GolfNow\'s barter model',
                  body: 'GolfNow is "free" — but requires ~2 prime-time tee times per day as barter. At average rack rates, that costs courses $94,500+/year in lost revenue.',
                },
                {
                  label: 'No built-in loyalty',
                  body: 'Most tee sheet software manages bookings but does nothing to bring golfers back. You need a separate loyalty platform, separate cost, separate login.',
                },
              ].map(({ label, body }) => (
                <div key={label} className="bg-[#FAF7F2] rounded-xl p-6 ring-1 ring-black/5 space-y-3">
                  <h3 className="font-bold text-[#1A1A1A]">{label}</h3>
                  <p className="text-sm text-[#6B7770] leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
            <p className="text-[#6B7770] leading-relaxed text-lg">
              TeeAhead solves all three. Founding Partner courses pay <strong className="text-[#0F3D2E]">$0</strong> in the first year. After that, $349/month flat — no commissions, no barter, no variable costs. And a golfer loyalty network is built into the platform from day one.
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="px-6 py-20 bg-[#FAF7F2]">
          <div className="max-w-4xl mx-auto space-y-10">
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
                Everything Your Course Needs, Nothing You Don't
              </h2>
              <p className="text-[#6B7770] text-lg">
                TeeAhead is tee sheet software built for the way golf courses actually operate — not enterprise bloat.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {features.map(({ icon, title, body }) => (
                <div key={title} className="bg-white rounded-xl p-6 ring-1 ring-black/5 space-y-3">
                  <div className="text-3xl">{icon}</div>
                  <h3 className="font-bold text-[#1A1A1A]">{title}</h3>
                  <p className="text-sm text-[#6B7770] leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="px-6 py-20 bg-white">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
              Simple, Transparent Pricing
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="bg-[#0F3D2E] rounded-xl p-8 space-y-4">
                <div className="inline-block bg-[#E0A800]/20 text-[#E0A800] text-sm font-semibold px-3 py-1 rounded-full">
                  Founding Partner — First 10 Courses
                </div>
                <div className="text-5xl font-bold text-[#F4F1EA]">$0</div>
                <p className="text-[#F4F1EA]/60 text-sm">First year free</p>
                <ul className="space-y-2 text-sm text-[#F4F1EA]/80">
                  {[
                    'Full platform access — no feature gating',
                    'No barter tee times',
                    'No commissions per booking',
                    'No contract — cancel any time',
                    'Direct onboarding with the TeeAhead team',
                    'Lock in $349/mo rate after year one',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-[#E0A800] mt-0.5">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/waitlist/course"
                  className="inline-flex items-center justify-center rounded-lg border-2 border-[#E0A800] bg-[#E0A800]/10 px-6 py-3 text-sm font-semibold text-[#F4F1EA] hover:bg-[#E0A800]/20 transition-colors w-full text-center"
                >
                  Claim a Founding Spot →
                </Link>
              </div>
              <div className="bg-[#FAF7F2] rounded-xl p-8 ring-1 ring-black/10 space-y-4">
                <div className="inline-block bg-[#1A1A1A]/10 text-[#1A1A1A] text-sm font-semibold px-3 py-1 rounded-full">
                  Standard — Course #11 and beyond
                </div>
                <div className="text-5xl font-bold text-[#1A1A1A]">$349<span className="text-2xl font-normal text-[#6B7770]">/mo</span></div>
                <p className="text-[#6B7770] text-sm">Flat monthly rate, no variable fees</p>
                <ul className="space-y-2 text-sm text-[#6B7770]">
                  {[
                    'Full platform access',
                    'No barter, no commissions',
                    'Month-to-month, no lock-in',
                    'Stripe Connect payouts',
                    'Loyalty network access',
                    '~96% cheaper than GolfNow barter costs',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-[#0F3D2E] mt-0.5">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/waitlist/course"
                  className="inline-flex items-center justify-center rounded-lg border border-black/10 px-6 py-3 text-sm font-semibold text-[#1A1A1A] hover:bg-black/5 transition-colors w-full text-center"
                >
                  Join the Waitlist →
                </Link>
              </div>
            </div>
            <p className="text-xs text-[#9DAA9F]">
              * GolfNow barter cost estimate based on ~2 prime-time tee times/day at average rack rates. NGCOA member survey data, 2024–2025.
            </p>
          </div>
        </section>

        {/* Comparison table */}
        <section className="px-6 py-20 bg-[#FAF7F2]">
          <div className="max-w-5xl mx-auto space-y-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
              TeeAhead vs. Other Tee Time Software
            </h2>
            <p className="text-[#6B7770] text-lg">
              How TeeAhead stacks up against the platforms golf courses most commonly evaluate.
            </p>
            <div className="overflow-x-auto rounded-xl ring-1 ring-black/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#1B4332] text-[#FAF7F2]">
                    <th className="text-left px-5 py-4 font-semibold">Feature</th>
                    <th className="text-center px-4 py-4 font-semibold">TeeAhead</th>
                    <th className="text-center px-4 py-4 font-semibold text-[#FAF7F2]/60">foreUP</th>
                    <th className="text-center px-4 py-4 font-semibold text-[#FAF7F2]/60">Lightspeed</th>
                    <th className="text-center px-4 py-4 font-semibold text-[#FAF7F2]/60">GolfNow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {comparison.map((row, i) => (
                    <tr key={row.feature} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAF7F2]'}>
                      <td className="px-5 py-4 font-medium text-[#1A1A1A]">{row.feature}</td>
                      <td className="px-4 py-4 text-center font-semibold text-[#1B4332]">{row.teeahead}</td>
                      <td className="px-4 py-4 text-center text-[#6B7770]">{row.foreup}</td>
                      <td className="px-4 py-4 text-center text-[#6B7770]">{row.lightspeed}</td>
                      <td className="px-4 py-4 text-center text-[#6B7770]">{row.golfnow}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-[#9DAA9F]">
              Competitor pricing and features based on publicly available information as of 2025–2026. Individual contracts may vary.
            </p>
          </div>
        </section>

        {/* Case study callout */}
        <section className="px-6 py-20 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="bg-[#FAF7F2] rounded-2xl p-10 ring-1 ring-black/5 space-y-6">
              <div className="text-6xl font-bold text-[#0F3D2E]">382%</div>
              <h3 className="text-2xl font-bold text-[#1A1A1A]">
                What happens when a course reclaims its tee sheet
              </h3>
              <p className="text-[#6B7770] leading-relaxed">
                Windsor Parke Golf Club grew online revenue from $81,000 to $393,000 — a $312,000 swing — after switching away from GolfNow's barter model and taking direct control of their booking channel. That's not a projection. That's a documented outcome.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/case-studies/windsor-parke"
                  className="inline-flex items-center justify-center rounded-lg bg-[#0F3D2E] px-6 py-3 text-sm font-semibold text-[#F4F1EA] hover:opacity-90 transition-opacity"
                >
                  Read the Windsor Parke case study →
                </Link>
                <Link
                  href="/damage"
                  className="inline-flex items-center justify-center rounded-lg border border-black/10 px-6 py-3 text-sm font-semibold text-[#1A1A1A] hover:bg-black/5 transition-colors"
                >
                  Calculate your GolfNow cost →
                </Link>
              </div>
              <p className="text-xs text-[#9DAA9F]">Source: Golf Inc. / industry reporting, Windsor Parke case study</p>
            </div>
          </div>
        </section>

        {/* Long-tail body copy (SEO) */}
        <section className="px-6 py-20 bg-[#FAF7F2]">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold text-[#1A1A1A]">
              What to Look for in Tee Time Software for Golf Courses
            </h2>
            <div className="prose prose-lg max-w-none text-[#6B7770] space-y-6">
              <p className="leading-relaxed">
                When golf course operators evaluate tee time software, the conversation usually starts with price and ends with switching costs. The platforms that have dominated the space — GolfNow, foreUP, Lightspeed Golf — all have trade-offs worth understanding before you sign anything.
              </p>
              <p className="leading-relaxed">
                <strong className="text-[#1A1A1A]">True cost of free software:</strong> GolfNow's tee sheet is marketed as free, but the barter model — surrendering prime-time tee times at rack rate — costs most courses between $60,000 and $150,000 per year in foregone revenue. That's not a fee. It's a revenue drain that doesn't show up in your P&amp;L until someone does the math.
              </p>
              <p className="leading-relaxed">
                <strong className="text-[#1A1A1A]">SaaS fees vs. variable costs:</strong> foreUP and Lightspeed Golf charge monthly SaaS fees with no barter requirement. That's a legitimate trade. At $300–$800/month, a course that would otherwise pay $94,500/year in barter comes out dramatically ahead. The question is whether you're getting software that justifies the fee.
              </p>
              <p className="leading-relaxed">
                <strong className="text-[#1A1A1A]">Loyalty and repeat rounds:</strong> Most tee sheet software handles booking and payment, but none of the incumbent platforms have a golfer loyalty program built into the same ecosystem. Driving repeat rounds from your existing golfer base requires either a separate loyalty vendor or building your own CRM workflow. TeeAhead is the only tee time software that includes a loyalty network at the course level as a core feature — not an add-on.
              </p>
              <p className="leading-relaxed">
                TeeAhead is currently accepting Founding Partner applications from golf courses in Metro Detroit. The first 10 courses get platform access free for the first year. If you run a course in Oakland, Macomb, or Wayne County and want to learn more, reach out directly to{' '}
                <a href="mailto:neil@teeahead.com" className="text-[#0F3D2E] underline decoration-dotted">neil@teeahead.com</a>.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-6 py-20 bg-[#0F3D2E] text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#F4F1EA]">
              Ready to switch your tee sheet software?
            </h2>
            <p className="text-[#F4F1EA]/70 leading-relaxed">
              Founding Partner spots are limited to the first 10 courses. No barter. No commissions. First year free.
            </p>
            <Link
              href="/waitlist/course"
              className="inline-flex items-center justify-center rounded-lg border-2 border-[#E0A800] bg-[#E0A800]/10 px-8 py-4 text-base font-semibold text-[#F4F1EA] hover:bg-[#E0A800]/20 transition-colors"
            >
              Claim a Founding Partner Spot →
            </Link>
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

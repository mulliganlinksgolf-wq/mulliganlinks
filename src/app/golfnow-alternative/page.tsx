import type { Metadata } from 'next'
import Link from 'next/link'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'

export const metadata: Metadata = {
  title: 'Best GolfNow Alternative for Courses & Golfers',
  description:
    'TeeAhead is the top GolfNow alternative — free tee sheet software with no barter tee times, no commissions, and a golfer loyalty program that beats GolfPass+. Metro Detroit launch.',
  alternates: {
    canonical: 'https://www.teeahead.com/golfnow-alternative',
  },
}

export default function GolfNowAlternativePage() {
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
              href="/waitlist/golfer"
              className="inline-flex items-center justify-center rounded-lg bg-[#0F3D2E] px-5 py-2.5 text-sm font-semibold text-[#F4F1EA] hover:opacity-90 transition-opacity"
            >
              Join the Waitlist
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">

        {/* Hero */}
        <section className="bg-[#0F3D2E] px-6 py-20 text-center">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5">
              <span className="size-2 rounded-full bg-[#F4F1EA] animate-pulse" />
              <span className="text-sm font-medium text-[#F4F1EA]">Coming soon to Metro Detroit</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#F4F1EA] leading-tight tracking-tight">
              The Best GolfNow Alternative for Golf Courses and Golfers
            </h1>
            <p className="text-xl text-[#F4F1EA]/80 leading-relaxed max-w-3xl mx-auto">
              TeeAhead is Metro Detroit&apos;s local-first golf platform — free tee sheet software for courses with zero barter tee times, and a loyalty membership for golfers that beats GolfPass+ on every single metric.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/waitlist/course"
                className="inline-flex items-center justify-center rounded-lg border-2 border-[#E0A800] bg-[#E0A800]/10 px-7 py-3 text-base font-semibold text-[#F4F1EA] hover:bg-[#E0A800]/20 transition-colors"
              >
                I Run a Course — Claim a Founding Spot
              </Link>
              <Link
                href="/waitlist/golfer"
                className="inline-flex items-center justify-center rounded-lg bg-[#F4F1EA] px-7 py-3 text-base font-semibold text-[#0F3D2E] hover:bg-white transition-colors"
              >
                ⛳ I&apos;m a Golfer — Join the Waitlist
              </Link>
            </div>
          </div>
        </section>

        {/* Section 1: What GolfNow actually costs */}
        <section className="px-6 py-20 bg-white">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
              What GolfNow Actually Costs a Golf Course
            </h2>
            <p className="text-[#6B7770] text-lg leading-relaxed">
              Most golf course operators know GolfNow is expensive. Few have run the actual math. Here it is.
            </p>
            <div className="bg-[#FAF7F2] rounded-xl p-8 ring-1 ring-black/5 space-y-6">
              <h3 className="text-xl font-bold text-[#1A1A1A]">The barter model, explained</h3>
              <p className="text-[#1A1A1A] leading-relaxed">
                GolfNow&apos;s standard agreement requires courses to provide approximately{' '}
                <strong>2 prime-time tee times per day</strong> as barter — at your published rack rate. These go to GolfNow inventory, sold at discounts to consumers, generating zero revenue for your course.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { figure: '2', label: 'barter tee times per day at rack rate' },
                  { figure: '300', label: 'operating days per year (typical course)' },
                  { figure: '$94,500', label: 'in lost revenue annually (average course)' },
                ].map(({ figure, label }) => (
                  <div key={label} className="bg-white rounded-xl p-6 ring-1 ring-black/5 text-center space-y-2">
                    <div className="text-4xl font-bold text-[#0F3D2E]">{figure}</div>
                    <p className="text-sm text-[#6B7770] leading-snug">{label}</p>
                  </div>
                ))}
              </div>
              <p className="text-[#1A1A1A] leading-relaxed">
                That $94,500 figure is based on NGCOA member survey data and Golf Inc. industry analysis (2024–2025). High-volume courses — those with higher rack rates or more than 2 daily barter slots — routinely document losses exceeding $150,000 per year. Brown Golf documented that 39.6% of all rounds across three years went to zero-revenue barter slots.
              </p>
              <p className="text-[#1A1A1A] leading-relaxed">
                And that&apos;s before the secondary costs: the dependency on GolfNow&apos;s discount-anchored customer base, the gradual erosion of your direct booking channel, and the data on your own customers being retained by a third party.
              </p>
              <p className="text-xs text-[#9DAA9F]">
                * Based on 2 barter tee times/day at average rack rates across NGCOA member survey data and Golf Inc. industry analysis (2024–2025). Individual results vary by contract terms.
              </p>
            </div>
            <p className="text-[#6B7770] leading-relaxed">
              TeeAhead charges Founding Partner courses <strong className="text-[#0F3D2E]">$0</strong>. The first 10 courses to join get free platform access for their first year — no barter, no commissions, no data extraction. Course #11 onward pays a flat $299/month, which for a course losing $94,500/year to GolfNow represents an immediate 97% cost reduction.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/waitlist/course"
                className="inline-flex items-center justify-center rounded-lg border-2 border-[#E0A800] bg-[#E0A800]/5 px-6 py-3 text-sm font-semibold text-[#1A1A1A] hover:bg-[#E0A800]/10 transition-colors"
              >
                Claim a Founding Partner Spot →
              </Link>
              <Link
                href="/barter"
                className="inline-flex items-center justify-center rounded-lg border border-black/10 px-6 py-3 text-sm font-semibold text-[#1A1A1A] hover:bg-black/5 transition-colors"
              >
                Calculate your real GolfNow cost →
              </Link>
            </div>
          </div>
        </section>

        {/* Section 2: Real results */}
        <section className="px-6 py-20 bg-[#FAF7F2]">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
              Real Results from Courses That Left GolfNow
            </h2>
            <p className="text-[#6B7770] text-lg leading-relaxed">
              These aren&apos;t projections. These are documented outcomes from golf courses that made the switch away from GolfNow.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl p-8 ring-1 ring-black/5 space-y-4">
                <div className="text-5xl font-bold text-[#0F3D2E]">382%</div>
                <h3 className="text-lg font-bold text-[#1A1A1A]">Windsor Parke Golf Club</h3>
                <p className="text-[#6B7770] leading-relaxed text-sm">
                  Online revenue increased from $81,000 to $393,000 after leaving GolfNow. That&apos;s a $312,000 swing — by reclaiming their own booking channel, eliminating barter, and owning their customer relationships directly.
                </p>
                <p className="text-xs text-[#9DAA9F]">Source: Golf Inc. / industry reporting, Windsor Parke case study</p>
              </div>
              <div className="bg-white rounded-xl p-8 ring-1 ring-black/5 space-y-4">
                <div className="text-5xl font-bold text-[#0F3D2E]">36.3%</div>
                <h3 className="text-lg font-bold text-[#1A1A1A]">Missouri Bluffs Golf Club</h3>
                <p className="text-[#6B7770] leading-relaxed text-sm">
                  Green fee revenue increased 36.3% after moving away from GolfNow&apos;s barter model. The course rebuilt its direct booking relationship with golfers — which is the long-term asset GolfNow slowly erodes.
                </p>
                <p className="text-xs text-[#9DAA9F]">Source: Golf Inc. industry reporting, Missouri Bluffs case study</p>
              </div>
            </div>
            <div className="bg-[#0F3D2E] rounded-xl p-8 text-center space-y-4">
              <div className="text-4xl font-bold text-[#F4F1EA]">100+</div>
              <p className="text-[#F4F1EA]/80 leading-relaxed">
                Golf courses left GolfNow in Q1 2025 alone, according to the National Golf Course Owners Association. The exodus is real — and accelerating.
              </p>
              <p className="text-xs text-[#F4F1EA]/40">Source: NGCOA, Q1 2025</p>
            </div>
          </div>
        </section>

        {/* Section 3: Course comparison table */}
        <section className="px-6 py-20 bg-white">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
              GolfNow vs. TeeAhead: For Golf Courses
            </h2>
            <p className="text-[#6B7770] text-lg leading-relaxed">
              A direct comparison of what each platform costs and delivers for course operators.
            </p>
            <div className="overflow-x-auto rounded-xl ring-1 ring-black/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#1B4332] text-[#FAF7F2]">
                    <th className="text-left px-6 py-4 font-semibold">For Your Course</th>
                    <th className="text-center px-6 py-4 font-semibold text-[#FAF7F2]/70">GolfNow</th>
                    <th className="text-center px-6 py-4 font-semibold">TeeAhead</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {[
                    { feature: 'Monthly cost', them: '$0 (but see barter)', us: '$0 (Founding Partners)' },
                    { feature: 'Barter tee times required', them: '~2/day at rack rate', us: 'None, ever' },
                    { feature: 'Annual cost in barter (avg)', them: '~$94,500+', us: '$0' },
                    { feature: 'Booking commissions', them: 'Yes', us: 'None' },
                    { feature: 'Your customer data', them: 'Retained by GolfNow', us: 'Stays with you' },
                    { feature: 'Direct booking channel', them: 'Competes with yours', us: 'Strengthens yours' },
                    { feature: 'Golfer loyalty program', them: 'GolfPass+ (your competitor)', us: 'Branded to your network' },
                    { feature: 'Discount anchoring', them: 'Yes — erodes rack rates', us: 'No discounting' },
                    { feature: 'Contract lock-in', them: 'Yes', us: 'None' },
                  ].map((row, i) => (
                    <tr key={row.feature} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAF7F2]'}>
                      <td className="px-6 py-4 font-medium text-[#1A1A1A]">{row.feature}</td>
                      <td className="px-6 py-4 text-center text-[#6B7770]">{row.them}</td>
                      <td className="px-6 py-4 text-center font-semibold text-[#1B4332]">{row.us}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-[#9DAA9F]">
              GolfNow pricing and contract terms based on publicly available information and NGCOA member reporting as of 2024–2025. Individual course contracts may vary.
            </p>
            <Link
              href="/waitlist/course"
              className="inline-flex items-center justify-center rounded-lg border-2 border-[#E0A800] bg-[#E0A800]/5 px-6 py-3 text-sm font-semibold text-[#1A1A1A] hover:bg-[#E0A800]/10 transition-colors"
            >
              Claim a Founding Partner Spot — First Year Free →
            </Link>
          </div>
        </section>

        {/* Section 4: Golfer comparison table */}
        <section className="px-6 py-20 bg-[#FAF7F2]">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
              GolfPass+ vs. TeeAhead Eagle: For Golfers
            </h2>
            <p className="text-[#6B7770] text-lg leading-relaxed">
              GolfPass+ costs $119/year and delivers perks spread thin across a national network. TeeAhead Eagle costs $79/year and delivers more — at the courses you actually play.
            </p>
            <div className="overflow-x-auto rounded-xl ring-1 ring-black/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#1B4332] text-[#FAF7F2]">
                    <th className="text-left px-6 py-4 font-semibold">For Golfers</th>
                    <th className="text-center px-6 py-4 font-semibold text-[#FAF7F2]/70">GolfPass+ ($119/yr)</th>
                    <th className="text-center px-6 py-4 font-semibold">Eagle ($79/yr)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {[
                    { feature: 'Annual price', them: '$119/yr', us: '$79/yr' },
                    { feature: 'Savings vs GolfPass+', them: '—', us: '$40/yr' },
                    { feature: 'Annual tee time credits', them: '$120 ($10/mo)', us: '$120 ($10/mo)' },
                    { feature: 'Free rounds per year', them: '0', us: '1' },
                    { feature: 'Booking fees waived', them: '12×/year only', us: 'Always, unlimited' },
                    { feature: 'Guest fee waivers', them: 'None', us: '12×/year' },
                    { feature: 'Green fee discount', them: 'None', us: '10% at partner courses' },
                    { feature: 'Birthday credit', them: 'None', us: '$25' },
                    { feature: 'Points multiplier', them: '1× base', us: '1.5×' },
                    { feature: 'Priority booking access', them: 'None', us: '48hr early access' },
                    { feature: 'Local loyalty', them: 'National chain perks', us: 'Courses you actually play' },
                  ].map((row, i) => (
                    <tr key={row.feature} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAF7F2]'}>
                      <td className="px-6 py-4 font-medium text-[#1A1A1A]">{row.feature}</td>
                      <td className="px-6 py-4 text-center text-[#6B7770]">{row.them}</td>
                      <td className="px-6 py-4 text-center font-semibold text-[#1B4332]">{row.us}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-[#9DAA9F]">
              GolfPass+ features and pricing based on publicly available information at golfnow.com as of April 2026. Features subject to change.
            </p>
            <Link
              href="/waitlist/golfer"
              className="inline-flex items-center justify-center rounded-lg bg-[#0F3D2E] px-6 py-3 text-sm font-semibold text-[#F4F1EA] hover:opacity-90 transition-opacity"
            >
              ⛳ Join the Golfer Waitlist — It&apos;s Free →
            </Link>
          </div>
        </section>

        {/* Section 5: Keyword-rich body copy */}
        <section className="px-6 py-20 bg-white">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
              Why Courses and Golfers in Metro Detroit Are Looking for a GolfNow Alternative
            </h2>
            <div className="prose prose-lg max-w-none text-[#6B7770] space-y-6">
              <p className="leading-relaxed">
                The search for a GolfNow alternative is accelerating in 2025 and 2026. Courses in Oakland County, Macomb County, and Wayne County are re-evaluating their dependency on GolfNow&apos;s tee sheet software — and for good reason. The barter model that seemed like free distribution in 2010 now looks very different when you run the numbers against today&apos;s green fee rates.
              </p>
              <p className="leading-relaxed">
                TeeAhead is built specifically for this moment. It&apos;s free tee sheet software for golf courses that want to cancel GolfNow, take back their direct booking channel, and stop subsidizing a platform that treats their prime-time inventory as a commodity. Unlike GolfNow, TeeAhead doesn&apos;t take barter tee times, doesn&apos;t charge commissions, and doesn&apos;t retain your customer data.
              </p>
              <p className="leading-relaxed">
                For golfers, TeeAhead is the local-first GolfNow alternative. Book tee times at Metro Detroit golf courses with zero booking fees — not &ldquo;waived for members 12 times a year,&rdquo; but zero, always. Earn Fairway Points on every dollar you spend at partner courses. Upgrade to Eagle membership ($79/yr) or Ace membership ($149/yr) for credits, free rounds, and discounts that actually apply to the courses in Oakland County, Macomb County, and Wayne County where you already play.
              </p>
              <p className="leading-relaxed">
                TeeAhead is not trying to be a national golf booking aggregator. It&apos;s a local platform for local golfers and local courses. That&apos;s the point. GolfNow turns your home course into a commodity. TeeAhead turns it back into your home.
              </p>
              <p className="leading-relaxed">
                If you run a golf course in Metro Detroit and you want to learn more about leaving GolfNow, reach out to Neil directly at{' '}
                <a href="mailto:neil@teeahead.com" className="text-[#0F3D2E] underline decoration-dotted">neil@teeahead.com</a>.
                {' '}If you&apos;re a golfer ready to book tee times in Metro Detroit without booking fees,{' '}
                <Link href="/waitlist/golfer" className="text-[#0F3D2E] underline decoration-dotted">join the waitlist</Link>.
              </p>
            </div>
          </div>
        </section>

        {/* Dual CTA */}
        <section className="px-6 py-20 bg-[#FAF7F2]">
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-10">
            <div className="bg-white rounded-xl p-8 ring-1 ring-black/5 space-y-4">
              <div className="inline-block bg-[#E0A800]/20 text-[#8B6F00] text-sm font-semibold px-3 py-1 rounded-full">
                For Courses
              </div>
              <h3 className="text-2xl font-bold text-[#1A1A1A]">Ready to cancel GolfNow?</h3>
              <p className="text-[#6B7770] leading-relaxed">
                The first 10 Founding Partner courses in Metro Detroit get TeeAhead free for their first year. No barter. No commissions. No data extraction.
              </p>
              <Link
                href="/waitlist/course"
                className="inline-flex items-center justify-center rounded-lg border-2 border-[#E0A800] bg-[#E0A800]/5 px-6 py-3 text-sm font-semibold text-[#1A1A1A] hover:bg-[#E0A800]/10 transition-colors w-full text-center"
              >
                Claim a Founding Partner Spot →
              </Link>
            </div>
            <div className="bg-[#0F3D2E] rounded-xl p-8 space-y-4">
              <div className="inline-block bg-white/10 text-[#F4F1EA] text-sm font-semibold px-3 py-1 rounded-full">
                For Golfers
              </div>
              <h3 className="text-2xl font-bold text-[#F4F1EA]">Done paying booking fees?</h3>
              <p className="text-[#F4F1EA]/70 leading-relaxed">
                Join the waitlist for free. Eagle membership is $79/yr — $40 less than GolfPass+, with more credits, more perks, and loyalty at the courses you actually play.
              </p>
              <Link
                href="/waitlist/golfer"
                className="inline-flex items-center justify-center rounded-lg bg-[#F4F1EA] px-6 py-3 text-sm font-semibold text-[#0F3D2E] hover:bg-white transition-colors w-full text-center"
              >
                ⛳ Join the Golfer Waitlist →
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-[#0F3D2E] border-t border-black/5 px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <TeeAheadLogo className="h-10 w-auto brightness-0 invert" />
          <nav className="flex items-center gap-6 text-sm text-[#F4F1EA]/60">
            <Link href="/" className="hover:text-[#F4F1EA] transition-colors">Home</Link>
            <Link href="/waitlist/golfer" className="hover:text-[#F4F1EA] transition-colors">Golfer Waitlist</Link>
            <Link href="/waitlist/course" className="hover:text-[#F4F1EA] transition-colors">Course Waitlist</Link>
            <Link href="/barter" className="hover:text-[#F4F1EA] transition-colors">Barter Calculator</Link>
          </nav>
          <p className="text-xs text-[#F4F1EA]/30">© 2026 TeeAhead, LLC.</p>
        </div>
      </footer>

    </div>
  )
}

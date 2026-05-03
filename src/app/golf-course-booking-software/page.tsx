import type { Metadata } from 'next'
import Link from 'next/link'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'

export const metadata: Metadata = {
  title: 'Free Golf Course Booking Software — No Commissions, No Barter | TeeAhead',
  description:
    'TeeAhead is free golf course booking software for independent and semi-private courses. No commissions per booking, no barter tee times, no long-term contracts. Built-in loyalty and Stripe payments.',
  alternates: {
    canonical: 'https://www.teeahead.com/golf-course-booking-software',
  },
}

export default function GolfCourseBookingSoftwarePage() {
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
            <h1 className="text-4xl sm:text-5xl font-bold text-[#F4F1EA] leading-tight tracking-tight">
              Golf Course Booking Software With No Commissions and No Barter
            </h1>
            <p className="text-xl text-[#F4F1EA]/80 leading-relaxed max-w-3xl mx-auto">
              TeeAhead is booking software built for independent and semi-private golf courses. Golfers book direct. You keep 100% of every round. No commissions. No barter tee times. No third-party taking a cut of your inventory.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/waitlist/course"
                className="inline-flex items-center justify-center rounded-lg border-2 border-[#E0A800] bg-[#E0A800]/10 px-7 py-3 text-base font-semibold text-[#F4F1EA] hover:bg-[#E0A800]/20 transition-colors"
              >
                Claim a Founding Partner Spot — First Year Free
              </Link>
              <Link
                href="/tee-time-software"
                className="inline-flex items-center justify-center rounded-lg bg-white/10 px-7 py-3 text-base font-semibold text-[#F4F1EA] hover:bg-white/20 transition-colors"
              >
                See all features →
              </Link>
            </div>
          </div>
        </section>

        {/* How booking works */}
        <section className="px-6 py-20 bg-white">
          <div className="max-w-4xl mx-auto space-y-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
              How TeeAhead Booking Works for Your Course
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  step: '1',
                  title: 'You post your tee times',
                  body: 'Set your available tee times and green fee rates in the TeeAhead dashboard. You control your inventory — no third party assigns your prime slots.',
                },
                {
                  step: '2',
                  title: 'Members book directly',
                  body: 'TeeAhead members in your area browse your tee times and book through the app. No phone tag. No third-party booking engine charging them fees.',
                },
                {
                  step: '3',
                  title: 'You get paid via Stripe',
                  body: 'Payments process through Stripe Connect directly to your account. No middleman holding funds. No commission deducted per booking.',
                },
              ].map(({ step, title, body }) => (
                <div key={step} className="space-y-4">
                  <div className="size-10 rounded-full bg-[#0F3D2E] text-[#F4F1EA] flex items-center justify-center font-bold text-lg">
                    {step}
                  </div>
                  <h3 className="font-bold text-[#1A1A1A]">{title}</h3>
                  <p className="text-sm text-[#6B7770] leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The no-commission argument */}
        <section className="px-6 py-20 bg-[#FAF7F2]">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
              Why Commission-Free Booking Software Matters
            </h2>
            <div className="prose prose-lg max-w-none text-[#6B7770] space-y-6">
              <p className="leading-relaxed">
                Most golf course booking software comes with a hidden cost. GolfNow takes barter tee times — effectively a commission paid in inventory instead of cash. Other third-party booking engines charge per-round commissions ranging from $1 to $3.50 per player. On a course doing 25,000 rounds per year, that's up to $87,500 annually in commission fees on top of your software cost.
              </p>
              <p className="leading-relaxed">
                The framing that booking software drives "incremental revenue" obscures the real math. If a golfer would have booked directly — or if your pro shop could have handled the reservation — the commission on that round is pure cost, not an acquisition fee. And for courses with an existing local following, the majority of rounds fall into that category.
              </p>
              <p className="leading-relaxed">
                TeeAhead doesn't charge commissions. Founding Partner courses pay $0 for their first year. After year one, the rate is $349/month flat — regardless of how many rounds get booked or what your green fee rates are. The math is simple: you book 1,000 rounds in a month at $65/player, you collect $65,000. TeeAhead gets $349. Full stop.
              </p>
              <p className="leading-relaxed">
                For course operators in Oakland County, Macomb County, and Wayne County who are evaluating golf booking software in 2026, TeeAhead is currently accepting Founding Partner applications. The first 10 courses get the full platform at no cost for year one.
              </p>
            </div>
          </div>
        </section>

        {/* Feature list */}
        <section className="px-6 py-20 bg-white">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold text-[#1A1A1A]">
              What's Included in TeeAhead Booking Software
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                'Online tee time booking for members',
                'Real-time tee sheet management',
                'QR code check-in for staff',
                'Stripe Connect payment processing',
                'Member profiles and booking history',
                'Revenue and rounds reporting',
                'Waitlist demand tracking',
                'Built-in golfer loyalty program',
                'Rain check and credit system',
                'Email notifications for bookings',
                'Staff invite and role management',
                'No per-booking commissions',
              ].map(item => (
                <div key={item} className="flex items-center gap-3 py-3 border-b border-black/5">
                  <span className="text-[#0F3D2E] font-bold">✓</span>
                  <span className="text-[#1A1A1A]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing callout */}
        <section className="px-6 py-20 bg-[#FAF7F2]">
          <div className="max-w-4xl mx-auto">
            <div className="bg-[#0F3D2E] rounded-2xl p-10 text-center space-y-6">
              <h2 className="text-3xl font-bold text-[#F4F1EA]">Simple Pricing. No Surprises.</h2>
              <div className="flex flex-col sm:flex-row justify-center gap-8">
                <div className="space-y-1">
                  <div className="text-5xl font-bold text-[#E0A800]">$0</div>
                  <p className="text-[#F4F1EA]/60 text-sm">First year — Founding Partners (first 10 courses)</p>
                </div>
                <div className="hidden sm:block w-px bg-white/10" />
                <div className="space-y-1">
                  <div className="text-5xl font-bold text-[#F4F1EA]">$349<span className="text-2xl font-normal text-[#F4F1EA]/50">/mo</span></div>
                  <p className="text-[#F4F1EA]/60 text-sm">Standard rate — no commissions, no barter</p>
                </div>
              </div>
              <Link
                href="/waitlist/course"
                className="inline-flex items-center justify-center rounded-lg border-2 border-[#E0A800] bg-[#E0A800]/10 px-8 py-4 text-base font-semibold text-[#F4F1EA] hover:bg-[#E0A800]/20 transition-colors"
              >
                Claim a Founding Partner Spot →
              </Link>
            </div>
          </div>
        </section>

        {/* Related links */}
        <section className="px-6 py-16 bg-white">
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-xl font-bold text-[#1A1A1A]">Learn more</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { href: '/tee-time-software', label: 'Tee Time Software', desc: 'Full feature breakdown and pricing comparison.' },
                { href: '/best-tee-sheet-software', label: 'Best Tee Sheet Software 2026', desc: 'How TeeAhead compares to foreUP, Lightspeed, and GolfNow.' },
                { href: '/golfnow-alternative', label: 'GolfNow Alternative', desc: 'The real cost of GolfNow\'s barter model and what switching looks like.' },
              ].map(({ href, label, desc }) => (
                <Link
                  key={href}
                  href={href}
                  className="block bg-[#FAF7F2] rounded-xl p-6 ring-1 ring-black/5 space-y-2 hover:ring-[#0F3D2E]/20 transition-all"
                >
                  <p className="font-semibold text-[#0F3D2E]">{label} →</p>
                  <p className="text-sm text-[#6B7770]">{desc}</p>
                </Link>
              ))}
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

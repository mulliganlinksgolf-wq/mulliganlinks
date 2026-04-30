import type { Metadata } from 'next'
import Link from 'next/link'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'

export const metadata: Metadata = {
  title: 'About',
  description: 'Meet the team behind TeeAhead — Metro Detroit\'s local-first golf booking and loyalty platform built by golfers, for golfers.',
  openGraph: {
    title: 'About TeeAhead | Built by Golfers, for Golfers',
    description: 'Meet the team behind TeeAhead — Metro Detroit\'s local-first golf booking and loyalty platform built by golfers, for golfers.',
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      <header className="bg-[#FAF7F2]/95 border-b border-black/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/">
            <TeeAheadLogo className="h-14 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/waitlist/golfer"
              className="inline-flex items-center justify-center rounded-lg border border-[#1B4332] px-4 py-2 text-sm font-medium text-[#1B4332] hover:bg-[#1B4332]/5 transition-colors"
            >
              Join waitlist
            </Link>
            <Link
              href="/waitlist/course"
              className="inline-flex items-center justify-center rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-medium text-[#FAF7F2] hover:bg-[#1B4332]/90 transition-colors"
            >
              Partner with us
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-20 bg-[#1B4332] text-[#FAF7F2]">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5">
            <span className="text-sm font-medium">Est. 2026 · Detroit, MI</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            Built by golfers.<br />For golfers.
          </h1>
          <p className="text-lg text-[#FAF7F2]/80 max-w-2xl mx-auto leading-relaxed">
            TeeAhead started as a simple observation: the platforms that were supposed
            to help golf courses were quietly extracting $94,500 a year from them. We
            decided to build the alternative.
          </p>
        </div>
      </section>

      {/* Origin story */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-[#1A1A1A]">The story</h2>
          <p className="text-[#6B7770] leading-relaxed">
            In 2024, Neil was running Outing.golf — a group booking platform for corporate
            golf outings. Talking to course operators every week, he kept hearing the same
            thing: GolfNow is bleeding us dry. Two prime-time tee times surrendered every
            single day, in exchange for distribution that most courses could replicate
            themselves with a halfway decent website.
          </p>
          <p className="text-[#6B7770] leading-relaxed">
            Billy had spent years at Ford Motor Company and knew what it looked like when
            a supply chain intermediary extracted more value than it created. He saw the
            same dynamic in golf and had been quietly frustrated by it as a player — the
            booking fee tacked onto every round, the loyalty programs that benefited the
            platform and not the course.
          </p>
          <p className="text-[#6B7770] leading-relaxed">
            TeeAhead is the platform they wished existed: free for courses, fair for
            golfers, and built to strengthen the relationship between a golfer and their
            home course rather than replace it with an algorithm.
          </p>
        </div>
      </section>

      {/* Team */}
      <section className="px-6 py-16 bg-[#FAF7F2]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-12 text-center">The team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

            {/* Neil */}
            <div className="bg-white rounded-2xl p-8 space-y-4">
              <div className="size-16 rounded-full bg-[#1B4332]/10 flex items-center justify-center text-2xl font-bold text-[#1B4332]">
                NB
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#1A1A1A]">Neil Barris</h3>
                <p className="text-sm text-[#6B7770]">Co-founder</p>
              </div>
              <p className="text-[#6B7770] leading-relaxed text-sm">
                Neil previously founded Outing.golf, a golf group booking platform that
                worked directly with courses and corporate event organizers across the
                Midwest. That work put him in weekly contact with course operators — and
                gave him a front-row view of exactly how much GolfNow&apos;s barter model was
                costing them.
              </p>
              <p className="text-[#6B7770] leading-relaxed text-sm">
                A Metro Detroit native and avid golfer, Neil plays 20–30 rounds a year at
                a rotating set of Oakland County courses. TeeAhead is his attempt to fix
                the thing he kept getting asked to fix.
              </p>
              <a
                href="mailto:neil@teeahead.com"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1B4332] hover:underline"
              >
                neil@teeahead.com
              </a>
            </div>

            {/* Billy */}
            <div className="bg-white rounded-2xl p-8 space-y-4">
              <div className="size-16 rounded-full bg-[#1B4332]/10 flex items-center justify-center text-2xl font-bold text-[#1B4332]">
                BB
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#1A1A1A]">Billy Beslock</h3>
                <p className="text-sm text-[#6B7770]">Co-founder</p>
              </div>
              <p className="text-[#6B7770] leading-relaxed text-sm">
                Billy spent his career at Ford Motor Company, where he developed a sharp
                eye for supply chains and the dynamics of who captures value versus who
                creates it. He saw the same extractive pattern in golf tech — platforms
                that positioned themselves as partners while quietly becoming a tax on
                every tee time.
              </p>
              <p className="text-[#6B7770] leading-relaxed text-sm">
                A lifelong golfer and Metro Detroit local, Billy has played courses across
                Oakland and Macomb County for decades. He joined TeeAhead to build the
                version of golf software that actually works for courses and players —
                not for the platform.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-2xl font-bold text-[#1A1A1A]">What we&apos;re building toward</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left mt-8">
            {[
              {
                label: 'Zero cost for courses',
                body: 'Golf course software should not be a profit center for a third party. TeeAhead is free for partner courses. We make money when golfers become loyal members — not when we take a cut of your rounds.',
              },
              {
                label: 'Loyalty that stays local',
                body: 'Fairway Points earned at your home course can be redeemed at your home course. We are not building a points program that dilutes loyalty across 10,000 national courses. We are building one for Metro Detroit.',
              },
              {
                label: 'Data that stays yours',
                body: 'Every golfer email, every round played, every booking preference — that data belongs to your course. We do not sell it, we do not use it to market against you, and you can export it as a CSV any time.',
              },
            ].map((item) => (
              <div key={item.label} className="space-y-2">
                <h3 className="font-semibold text-[#1A1A1A]">{item.label}</h3>
                <p className="text-sm text-[#6B7770] leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 bg-[#1B4332] text-[#FAF7F2]">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-2xl font-bold">Ready to see TeeAhead in action?</h2>
          <p className="text-[#FAF7F2]/80">
            10 founding partner spots are available for Metro Detroit courses.
            Golfer waitlist is open now.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/waitlist/course"
              className="inline-flex items-center justify-center rounded-lg bg-[#FAF7F2] px-6 py-3 text-sm font-semibold text-[#1B4332] hover:bg-[#FAF7F2]/90 transition-colors"
            >
              Claim a founding partner spot
            </Link>
            <Link
              href="/waitlist/golfer"
              className="inline-flex items-center justify-center rounded-lg border border-[#FAF7F2]/30 px-6 py-3 text-sm font-semibold text-[#FAF7F2] hover:bg-white/10 transition-colors"
            >
              Join the golfer waitlist
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-[#FAF7F2] border-t border-black/5 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-3">
          <TeeAheadLogo className="h-14 w-auto" />
          <nav className="flex flex-wrap justify-center items-center gap-4 text-sm text-[#6B7770]">
            <Link href="/" className="hover:text-[#1B4332] transition-colors">Home</Link>
            <span>·</span>
            <Link href="/golfnow-alternative" className="hover:text-[#1B4332] transition-colors">GolfNow Alternative</Link>
            <span>·</span>
            <Link href="/contact" className="hover:text-[#1B4332] transition-colors">Contact</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-[#1B4332] transition-colors">Terms</Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-[#1B4332] transition-colors">Privacy</Link>
          </nav>
          <p className="text-xs text-[#6B7770]">© 2026 TeeAhead · Detroit, MI</p>
        </div>
      </footer>
    </div>
  )
}

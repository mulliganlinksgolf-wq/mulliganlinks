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
  title: 'TeeAhead | Free Golf Tee Time Booking & Loyalty App — Metro Detroit',
  description:
    'Book tee times at Metro Detroit golf courses with zero booking fees. Earn Fairway Points and save $40/yr vs GolfPass+ with TeeAhead Eagle membership. Free for courses, always.',
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
      <header className="sticky top-0 z-50 bg-[#0F3D2E]/97 backdrop-blur border-b border-white/8">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <TeeAheadLogo className="h-14 w-auto brightness-0 invert" />
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/barter"
              className="text-sm font-medium text-[#F4F1EA]/70 hover:text-[#F4F1EA] transition-colors hidden sm:block"
            >
              Barter Calculator
            </Link>
            <Link
              href="/waitlist/golfer"
              className="inline-flex items-center justify-center rounded-lg bg-[#E0A800] px-5 py-2.5 text-sm font-semibold text-[#0a0a0a] hover:bg-[#E0A800]/90 transition-colors"
            >
              Join the Waitlist
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative px-6 py-28 overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&w=1920&q=80')" }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(8,36,25,0.88) 0%, rgba(15,61,46,0.82) 50%, rgba(8,36,25,0.92) 100%)' }} />
        {/* Vignette */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.45) 100%)' }} />

        <FadeIn>
          <div className="max-w-3xl mx-auto text-center space-y-8 relative z-10">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[#E0A800]/15 backdrop-blur-sm border border-[#E0A800]/40 rounded-full px-4 py-1.5">
              <span className="size-2 rounded-full bg-[#E0A800] animate-pulse" />
              <span className="text-sm font-semibold text-[#E0A800] tracking-wide uppercase">{badge}</span>
            </div>

            {/* Headline */}
            <h1 className="font-display font-black text-[#F4F1EA] leading-[1.08] tracking-[-0.02em]" style={{ fontSize: 'clamp(40px, 6vw, 62px)' }}>
              Golf, returned to the people who{' '}
              <em style={{ fontStyle: 'italic', color: '#E0A800' }}>actually</em>{' '}
              play it.
            </h1>

            {/* Subhead */}
            <p className="text-lg text-[#F4F1EA]/72 leading-relaxed max-w-xl mx-auto">
              {subhead}
            </p>

            {/* Audience cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[620px] mx-auto pt-2">

              {/* Golfer card */}
              <div className="rounded-xl p-6 text-left space-y-4 transition-transform hover:-translate-y-0.5 duration-150"
                   style={{ background: 'rgba(244,241,234,0.10)', border: '1.5px solid rgba(244,241,234,0.22)', backdropFilter: 'blur(8px)' }}>
                <div className="text-2xl">⛳</div>
                <div>
                  <p className="font-bold text-[#F4F1EA] text-base mb-1">I&apos;m a Golfer</p>
                  <p className="text-xs text-[#F4F1EA]/60 leading-relaxed">Zero fees. Real loyalty at the courses you already play. Beat GolfPass+ for $40 less.</p>
                </div>
                <Link
                  href="/waitlist/golfer"
                  className="block text-center rounded-lg bg-[#F4F1EA] px-4 py-2.5 text-sm font-semibold text-[#0F3D2E] hover:bg-white transition-colors"
                >
                  Join the Waitlist
                </Link>
                <p className="text-xs text-[#F4F1EA]/40 text-center">Free · No credit card</p>
              </div>

              {/* Course card */}
              <div className="rounded-xl p-6 text-left space-y-4 transition-transform hover:-translate-y-0.5 duration-150"
                   style={{ background: 'rgba(224,168,0,0.12)', border: '1.5px solid rgba(224,168,0,0.50)', backdropFilter: 'blur(8px)' }}>
                <div className="text-2xl">🏌️</div>
                <div>
                  <p className="font-bold text-[#E0A800] text-base mb-1">I Run a Course</p>
                  <p className="text-xs text-[#F4F1EA]/60 leading-relaxed">Free forever for Founding Partners. No barter. No commissions. No data extraction.</p>
                </div>
                <Link
                  href="/waitlist/course"
                  className="block text-center rounded-lg bg-[#E0A800] px-4 py-2.5 text-sm font-semibold text-[#0a0a0a] hover:bg-[#E0A800]/90 transition-colors"
                >
                  {spotsRemaining > 0 ? 'Claim a Founding Spot' : 'Join the Course Waitlist'}
                </Link>
                <p className="text-xs text-[#F4F1EA]/40 text-center">
                  {spotsRemaining > 0
                    ? `${spotsRemaining} of 10 spots remaining`
                    : 'All founding spots claimed'}
                </p>
              </div>

            </div>

            <p className="text-sm text-[#F4F1EA]/50">{tagline}</p>
          </div>
        </FadeIn>
      </section>

      {/* ── Stat Moment ──────────────────────────────────────── */}
      <section className="bg-white px-6 py-20 text-center border-t-4 border-[#E0A800]">
        <FadeIn>
          <div className="max-w-3xl mx-auto space-y-6">
            <p className="text-xs font-bold tracking-[0.14em] uppercase text-[#9DAA9F]">
              What GolfNow costs the average course, per year
            </p>
            <p className="font-display font-black text-[#0F3D2E] leading-none tracking-[-0.03em]"
               style={{ fontSize: 'clamp(72px, 12vw, 96px)' }}>
              $94,500
            </p>
            <p className="text-xl font-medium text-[#1A1A1A] max-w-md mx-auto leading-snug">
              in barter tee times — revenue taken directly out of your pocket
            </p>
            <p className="text-base text-[#6B7770] max-w-xl mx-auto leading-relaxed">
              Brown Golf documented 39.6% of all rounds over three years went to zero-revenue barter
              slots. Windsor Parke Golf Club saw a 382% increase in online revenue after leaving GolfNow.
            </p>
            <p className="text-base text-[#6B7770]">
              TeeAhead charges <strong className="text-[#0F3D2E] font-bold">$0</strong>. For Founding Partners, forever.
            </p>

            {/* Barter callout — visually distinct, not just a text link */}
            <div className="inline-flex items-center gap-3 bg-[#0F3D2E] rounded-full px-6 py-3 mt-2">
              <span className="text-sm font-semibold text-[#F4F1EA]">Want your exact number?</span>
              <Link
                href="/barter"
                className="text-sm font-bold text-[#E0A800] hover:text-[#E0A800]/80 transition-colors"
              >
                Use the barter calculator →
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── Proof Strip ───────────────────────────────────────── */}
      <section className="bg-[#FAF7F2] px-6 py-10 border-t border-black/5">
        <FadeIn>
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16 text-center">
            {[
              { num: '100+', label: 'courses left GolfNow in Q1 2025 alone' },
              { num: '382%', label: 'revenue increase at Windsor Parke after leaving' },
              { num: '$0', label: 'what TeeAhead charges Founding Partner courses' },
            ].map(({ num, label }) => (
              <div key={num} className="space-y-1">
                <p className="font-display font-extrabold text-[#0F3D2E] leading-none" style={{ fontSize: '32px' }}>
                  {num}
                </p>
                <p className="text-xs text-[#6B7770] max-w-[160px] leading-snug">{label}</p>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* ── Solution ──────────────────────────────────────────────────────── */}
      <section className="bg-[#0F3D2E] px-6 py-20">
        <FadeIn>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14 space-y-3">
              <h2 className="font-display font-extrabold text-[#F4F1EA] leading-tight tracking-[-0.02em]"
                  style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}>
                The better way to play — and to run a course.
              </h2>
              <p className="text-[#F4F1EA]/60 text-base leading-relaxed max-w-md mx-auto">
                Free for courses. Fair for golfers. Built in Metro Detroit for the people who show up every week.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">

              {/* Golfer card */}
              <div className="rounded-2xl p-8 space-y-5"
                   style={{ background: 'rgba(244,241,234,0.07)', border: '1px solid rgba(244,241,234,0.12)' }}>
                <div className="text-xs font-bold tracking-[0.12em] uppercase text-[#F4F1EA]/50">For Golfers</div>
                <h3 className="font-display font-bold text-[#F4F1EA] text-xl leading-snug">
                  The smarter alternative to GolfPass+
                </h3>
                <ul className="space-y-2.5">
                  {[
                    'Book tee times at your home course with zero fees',
                    'Earn Fairway Points on every round',
                    'Eagle membership: $79/yr, $180 in credits — beats GolfPass+ by $40',
                    'Priority booking, guest passes, birthday credit',
                    'Loyalty that lives at courses you actually play',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-[#F4F1EA]/75 leading-snug">
                      <span className="text-[#8FA889] font-bold mt-0.5 flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/waitlist/golfer"
                  className="block text-center rounded-lg bg-[#F4F1EA] px-5 py-3 text-sm font-semibold text-[#0F3D2E] hover:bg-white transition-colors"
                >
                  Join the Golfer Waitlist →
                </Link>
              </div>

              {/* Course card */}
              <div className="rounded-2xl p-8 space-y-5"
                   style={{ background: 'rgba(224,168,0,0.10)', border: '1px solid rgba(224,168,0,0.30)' }}>
                <div className="text-xs font-bold tracking-[0.12em] uppercase text-[#E0A800]/70">For Courses</div>
                <h3 className="font-display font-bold text-[#E0A800] text-xl leading-snug">
                  Free software. No barter. No catch.
                </h3>
                <ul className="space-y-2.5">
                  {[
                    'Free for Founding Partners — forever',
                    'No barter tee times, ever',
                    'No commissions on bookings',
                    'Full tee sheet control stays with you',
                    'Only ask: tell your golfers about TeeAhead at booking',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-[#F4F1EA]/75 leading-snug">
                      <span className="text-[#E0A800] font-bold mt-0.5 flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/waitlist/course"
                  className="block text-center rounded-lg bg-[#E0A800] px-5 py-3 text-sm font-semibold text-[#0a0a0a] hover:bg-[#E0A800]/90 transition-colors"
                >
                  {spotsRemaining > 0 ? 'Claim a Founding Partner Spot →' : 'Join the Course Waitlist →'}
                </Link>
              </div>

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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">

              {/* Fairway — Free */}
              <div className="bg-white rounded-2xl overflow-hidden border border-black/8">
                <div className="p-7 border-b border-black/5">
                  <p className="font-display font-bold text-xl text-[#1A1A1A]">Fairway</p>
                  <p className="text-sm text-[#9DAA9F] mt-0.5">The foundation</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="font-display font-black text-4xl text-[#1A1A1A]">$0</span>
                    <span className="text-[#6B7770] text-sm">/ forever</span>
                  </div>
                </div>
                <div className="p-7 space-y-5">
                  <ul className="space-y-2 text-sm text-[#1A1A1A]">
                    {[
                      'Book tee times at partner courses',
                      'Zero booking fees',
                      '1× Fairway Points per dollar',
                      'Free cancellation (1hr policy)',
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <span className="text-[#8FA889] font-bold mt-0.5">✓</span>{f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/waitlist/golfer"
                    className="block text-center rounded-lg border-2 border-[#0F3D2E] px-4 py-2.5 text-sm font-semibold text-[#0F3D2E] hover:bg-[#0F3D2E]/5 transition-colors"
                  >
                    Join the Waitlist
                  </Link>
                </div>
              </div>

              {/* Eagle — Most Popular (lifted) */}
              <div className="bg-white rounded-2xl overflow-hidden border-2 border-[#E0A800] shadow-[0_8px_32px_rgba(224,168,0,0.18)] relative -translate-y-2">
                <div className="bg-[#E0A800] py-2 text-center">
                  <span className="text-xs font-black text-[#1A1A1A] uppercase tracking-[0.06em]">Most Popular</span>
                </div>
                <div className="p-7 border-b border-black/5">
                  <p className="font-display font-bold text-xl text-[#1A1A1A]">Eagle</p>
                  <p className="text-sm text-[#9DAA9F] mt-0.5">Serious golfers</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="font-display font-black text-4xl text-[#1A1A1A]">$79</span>
                    <span className="text-[#6B7770] text-sm">/ yr</span>
                  </div>
                  <p className="text-xs text-[#9DAA9F] mt-0.5">~$6.58/mo</p>
                </div>
                <div className="p-7 space-y-5">
                  <ul className="space-y-2 text-sm text-[#1A1A1A]">
                    {[
                      '$15/mo in tee time credits ($180/yr)',
                      '2 free rounds per year',
                      'Always-on booking fee waiver',
                      'Free cancellation unlimited (1hr)',
                      '2× Fairway Points',
                      'Priority booking: 48hr early access',
                      '12 guest passes per year',
                      '10% green fee discount',
                      '$25 birthday credit',
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <span className="text-[#E0A800] font-bold mt-0.5">✓</span>{f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/waitlist/golfer"
                    className="block text-center rounded-lg bg-[#0F3D2E] px-4 py-2.5 text-sm font-semibold text-[#F4F1EA] hover:opacity-90 transition-opacity"
                  >
                    Join the Waitlist
                  </Link>
                  <p className="text-xs text-[#9DAA9F] text-center">Credits applied at partner courses</p>
                </div>
              </div>

              {/* Ace */}
              <div className="bg-white rounded-2xl overflow-hidden border-2 border-[#1B4332]">
                <div className="p-7 border-b border-black/5">
                  <p className="font-display font-bold text-xl text-[#1A1A1A]">Ace</p>
                  <p className="text-sm text-[#9DAA9F] mt-0.5">All-in members</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="font-display font-black text-4xl text-[#1A1A1A]">$149</span>
                    <span className="text-[#6B7770] text-sm">/ yr</span>
                  </div>
                  <p className="text-xs text-[#9DAA9F] mt-0.5">~$12.42/mo</p>
                </div>
                <div className="p-7 space-y-5">
                  <ul className="space-y-2 text-sm text-[#1A1A1A]">
                    {[
                      '$25/mo in tee time credits ($300/yr)',
                      '4 free rounds per year',
                      'Always-on booking fee waiver',
                      'Free cancellation unlimited (1hr)',
                      '3× Fairway Points',
                      'Priority booking: 72hr early access',
                      'Unlimited guest passes',
                      '15% green fee discount',
                      '$50 birthday credit',
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <span className="text-[#1B4332] font-bold mt-0.5">✓</span>{f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/waitlist/golfer"
                    className="block text-center rounded-lg border-2 border-[#1B4332] px-4 py-2.5 text-sm font-semibold text-[#1B4332] hover:bg-[#1B4332]/5 transition-colors"
                  >
                    Join the Waitlist
                  </Link>
                </div>
              </div>

            </div>

            <p className="mt-12 text-center text-sm text-[#6B7770] max-w-xl mx-auto leading-relaxed">
              Most golfers start on Fairway. About 1 in 4 upgrade to Eagle within 60 days — once they&apos;ve
              earned enough Fairway Points to see the math. Start free. Upgrade when it makes sense.
            </p>
          </div>
        </FadeIn>
      </section>

      {/* ── Manifesto ─────────────────────────────────────────── */}
      <section className="bg-[#0F3D2E] px-6 py-32 text-center border-t border-[#F4F1EA]/8">
        <FadeIn>
          <div className="max-w-4xl mx-auto space-y-10">
            <p className="font-display font-black text-[#F4F1EA] leading-[1.1] tracking-[-0.03em]"
               style={{ fontSize: 'clamp(36px, 6vw, 72px)' }}>
              Local golf, returned to the people who{' '}
              <em style={{ fontStyle: 'italic', color: '#E0A800' }}>actually</em>{' '}
              play it.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/waitlist/golfer"
                className="inline-flex items-center justify-center rounded-lg bg-[#F4F1EA] px-7 py-3.5 text-sm font-semibold text-[#0F3D2E] hover:bg-white transition-colors"
              >
                ⛳ Join the Golfer Waitlist
              </Link>
              <Link
                href="/waitlist/course"
                className="inline-flex items-center justify-center rounded-lg border border-[#F4F1EA]/30 px-7 py-3.5 text-sm font-semibold text-[#F4F1EA] hover:border-[#F4F1EA]/60 transition-colors"
              >
                Claim a Founding Course Spot →
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── Founder Note ──────────────────────────────────────── */}
      <section className="bg-[#0F3D2E] px-6 py-24">
        <FadeIn>
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-xs font-bold tracking-[0.14em] uppercase text-[#F4F1EA]/35 mb-10">
            A note from the founders
          </p>
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
      <footer className="bg-[#071f17] border-t border-black/5 px-6 py-16">
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
          <div className="border-t border-[#F4F1EA]/10 pt-6 text-center">
            <p className="text-xs text-[#F4F1EA]/40">© 2026 TeeAhead, LLC. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  )
}

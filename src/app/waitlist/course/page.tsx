import Link from 'next/link'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'
import { FadeIn } from '@/components/FadeIn'
import { createClient } from '@/lib/supabase/server'
import { CourseWaitlistSection } from './CourseWaitlistSection'

export const metadata = {
  title: 'Founding Partner Application',
  description: 'Claim one of 10 Founding Partner spots. Free tee sheet software for your first year — zero barter, zero commissions, live within 48 hours.',
  alternates: { canonical: '/waitlist/course' },
  openGraph: {
    url: '/waitlist/course',
    title: 'TeeAhead Founding Partner Application',
    description: 'Claim one of 10 Founding Partner spots. Free platform for your first year — zero barter, zero commissions.',
  },
}

export default async function CourseWaitlistPage() {
  const supabase = await createClient()
  const [{ data: counter }, { data: contentRows }] = await Promise.all([
    supabase.from('founding_partner_counter').select('count, cap').single(),
    supabase.from('content_blocks').select('key, value').ilike('key', 'waitlist_course.%'),
  ])

  const spotsRemaining = Math.max(0, (counter?.cap ?? 10) - (counter?.count ?? 0))
  const c: Record<string, string> = Object.fromEntries(
    (contentRows ?? []).map((r: { key: string; value: string }) => [r.key, r.value])
  )

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">

      {/* ── Header / Nav ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#0F3D2E]/97 backdrop-blur border-b border-white/8">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <TeeAheadLogo className="h-14 w-auto brightness-0 invert" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[#E0A800]/15 border border-[#E0A800]/40 rounded-full px-3 py-1">
              <span className="size-2 rounded-full bg-[#E0A800] animate-pulse" />
              <span className="text-xs font-semibold text-[#E0A800] tracking-wide uppercase">Waitlist Open</span>
            </div>
            <Link href="/" className="text-sm text-[#F4F1EA]/70 hover:text-[#F4F1EA] transition-colors">← Back</Link>
          </div>
        </div>
      </header>

      {/* ── Hero — split: pitch left, form right ─────────────────── */}
      <section className="bg-[#082419] px-6 sm:px-10 lg:px-16 py-16 sm:py-20 text-[#F4F1EA]">
        <FadeIn>
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-14 items-center">

            {/* Left: pitch */}
            <div>
              <p className="font-mono text-xs tracking-[0.18em] uppercase text-[#E0A800] font-semibold mb-4">
                {c['waitlist_course.hero_badge'] ?? 'Founding Partner application · Metro Detroit'}
              </p>

              <h1
                className="font-display leading-[0.96] tracking-[-0.025em]"
                style={{ fontSize: 'clamp(48px, 7vw, 88px)', fontWeight: 400 }}
              >
                Ten courses.<br />
                <em className="italic text-[#E0A800]">First year free.</em><br />
                Live in 48 hours.
              </h1>

              <p className="mt-6 text-base sm:text-lg leading-relaxed text-[#F4F1EA]/78 max-w-xl">
                {c['waitlist_course.hero_subhead'] ?? 'Independent Metro Detroit courses only. No barter, no commissions, no data extraction — and we never market to your golfers. After year one, $349/mo flat. Cancel anytime.'}
              </p>

              {/* Spots counter — calm, not pulsing */}
              <div className="mt-8 flex items-center gap-4 rounded-lg border border-[#E0A800]/40 bg-[#E0A800]/10 px-4 py-3.5 max-w-md">
                <span className="font-display text-4xl leading-none text-[#E0A800]" style={{ fontWeight: 400 }}>
                  {spotsRemaining}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#F4F1EA]">of 10 spots remain</p>
                  <div className="mt-1.5 h-1 rounded-full bg-[#F4F1EA]/10 overflow-hidden">
                    <div
                      className="h-full bg-[#E0A800]"
                      style={{ width: `${((10 - spotsRemaining) / 10) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#E0A800]">
                  {10 - spotsRemaining} claimed
                </span>
              </div>
            </div>

            {/* Right: CTA card (form lives below in CourseWaitlistSection) */}
            <div className="lg:sticky lg:top-24">
              <div className="bg-[#F4F1EA] rounded-2xl p-6 sm:p-7 text-[#1A1A1A] shadow-[0_30px_60px_rgba(0,0,0,0.3)]">
                <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-[#6B7770] font-semibold">
                  Step 1 of 1
                </p>
                <h2 className="mt-1.5 font-display text-3xl text-[#0F3D2E] tracking-[-0.01em]" style={{ fontWeight: 400 }}>
                  Claim your spot
                </h2>
                <p className="mt-3 text-sm text-[#6B7770] leading-relaxed">
                  Independent Metro Detroit course? Tell us about yourself and we&apos;ll reply within 24 hours.
                </p>
                <Link
                  href="#apply"
                  className="mt-5 block text-center rounded-lg bg-[#0F3D2E] px-5 py-3.5 text-sm font-semibold text-[#F4F1EA] hover:bg-[#0F3D2E]/90 transition-colors"
                >
                  Start the application →
                </Link>
                <p className="mt-3 text-xs text-[#6B7770] text-center">We reply within 24 hours.</p>
              </div>
            </div>

          </div>
        </FadeIn>
      </section>

      {/* ── Stat bar ─────────────────────────────────────────── */}
      <section className="bg-white px-6 py-12 border-t-4 border-[#E0A800]">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-8 sm:gap-16 text-center">
          {[
            { value: '200+', label: 'Golfers waiting' },
            { value: '10', label: 'Founding Partner spots' },
            { value: '$0/mo', label: 'Year 1' },
            { value: '$349/mo', label: 'Year 2 onward' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p
                className="font-display text-[#0F3D2E] leading-none mb-1 tracking-[-0.02em]"
                style={{ fontSize: '40px', fontWeight: 400 }}
              >
                {value}
              </p>
              <p className="text-xs text-[#6B7770]">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tab strip ────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#0F3D2E]/10 sticky top-[73px] z-40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-center gap-2 py-3">
            <Link
              href="/waitlist/golfer"
              className="px-6 py-2.5 rounded-lg text-sm font-semibold text-[#6B7770] border border-[#0F3D2E]/15 hover:border-[#0F3D2E]/40 hover:text-[#0F3D2E] hover:bg-[#0F3D2E]/5 transition-colors"
            >
              For golfers
            </Link>
            <span aria-current="page" className="px-6 py-2.5 rounded-lg bg-[#0F3D2E] text-sm font-semibold text-[#F4F1EA]">
              For courses
            </span>
          </div>
        </div>
      </div>

      {/* ── Benefits — numbered, no emoji ────────────────────── */}
      <section className="bg-[#FAF7F2] px-6 sm:px-10 lg:px-16 py-16 border-t-4 border-[#E0A800]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-baseline gap-3 mb-10">
            <span className="font-mono text-xs tracking-[0.18em] uppercase text-[#E0A800] font-semibold">
              What you get
            </span>
            <span className="flex-1 h-px bg-[#0F3D2E]/10" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { n: '01', t: 'Kill the barter', d: 'Stop handing GolfNow $80K–$150K a year in free tee times. Keep every dollar your golfers spend.' },
              { n: '02', t: 'Own your golfer data', d: 'Every profile, every email belongs to your course. Full CSV export anytime. We never market to your golfers.' },
              { n: '03', t: 'Live in 48 hours', d: "We handle the entire setup. Your staff touches nothing. If you're not live within 48 hours, we'll make it right." },
              { n: '04', t: 'Earn while you sleep', d: 'Refer a golfer who picks your course as their home course and earn 10% of their membership monthly — automatic payouts.' },
            ].map(({ n, t, d }) => (
              <div key={n} className="border-t border-[#0F3D2E] pt-4">
                <p className="font-mono text-xs text-[#E0A800] font-bold tracking-[0.1em] mb-2.5">{n}</p>
                <p className="font-display text-xl text-[#0F3D2E] tracking-[-0.01em] mb-1.5" style={{ fontWeight: 400 }}>{t}</p>
                <p className="text-sm text-[#1A1A1A]/75 leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing strip ────────────────────────────────────── */}
      <section className="bg-[#FAF7F2] px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-3xl font-display text-[#0F3D2E] mb-10 tracking-[-0.015em]" style={{ fontWeight: 400 }}>
            Simple, transparent pricing.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            {[
              {
                title: 'Founding Partner Year 1',
                price: '$0/mo',
                description: '10 founding spots. Free for your first year.',
              },
              {
                title: 'Standard (Year 2 Onward)',
                price: '$349/mo',
                description: 'Annual contract, billed monthly. No commissions, no barter.',
                multiYearNote: true,
              },
              {
                title: '3+ Courses',
                price: '$279/mo',
                description: 'Volume pricing for multi-course operators.',
                note: 'per course',
              },
            ].map(({ title, price, description, note, multiYearNote }) => (
              <div key={title} className="bg-white rounded-xl p-6 border border-black/8 shadow-sm space-y-2">
                <p className="text-xs font-bold tracking-[0.1em] uppercase text-[#6B7770]">{title}</p>
                <p className="font-display text-4xl text-[#0F3D2E] leading-none tracking-[-0.02em]" style={{ fontWeight: 400 }}>
                  {price}
                  {note && <span className="text-sm font-semibold text-[#9DAA9F] ml-1">{note}</span>}
                </p>
                <p className="text-sm text-[#6B7770] leading-relaxed">{description}</p>
                {multiYearNote && (
                  <p className="text-xs text-[#9DAA9F] mt-1">
                    Multi-year contracts available at a discount — ask Neil or Billy.
                  </p>
                )}
              </div>
            ))}
          </div>
          {spotsRemaining < 10 && (
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 bg-[#E0A800]/15 border border-[#E0A800]/40 rounded-full px-5 py-2.5">
                <span className="size-2 rounded-full bg-[#E0A800] animate-pulse" />
                <span className="text-sm font-semibold text-[#8B6F00]">
                  {spotsRemaining} of 10 Founding Partner spots remaining
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Social proof bar ────────────────────────────────── */}
      <section className="bg-[#F0F4F1] px-6 py-8 border-t border-[#0F3D2E]/10">
        <div className="max-w-xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="space-y-0.5">
              <p className="font-display text-2xl text-[#0F3D2E] tracking-[-0.02em]" style={{ fontWeight: 400 }}>100+</p>
              <p className="text-xs text-[#6B7770] leading-snug">courses left GolfNow<br/>in Q1 2025 alone</p>
            </div>
            <div className="hidden sm:block w-px h-10 bg-[#0F3D2E]/15" />
            <div className="space-y-0.5">
              <p className="font-display text-2xl text-[#0F3D2E] tracking-[-0.02em]" style={{ fontWeight: 400 }}>$94,500</p>
              <p className="text-xs text-[#6B7770] leading-snug">avg annual barter cost<br/>per course</p>
            </div>
            <div className="hidden sm:block w-px h-10 bg-[#0F3D2E]/15" />
            <div className="space-y-0.5">
              <p className="font-display text-2xl text-[#0F3D2E] tracking-[-0.02em]" style={{ fontWeight: 400 }}>382%</p>
              <p className="text-xs text-[#6B7770] leading-snug">revenue increase at Windsor Parke<br/>after leaving GolfNow</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── GolfNow Countdown + Form section ─────────────────── */}
      <CourseWaitlistSection spotsRemaining={spotsRemaining} />

      {/* ── Footer ───────────────────────────────────────────── */}
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
              <nav className="flex flex-col gap-1.5 text-sm text-[#F4F1EA]/70">
                <Link href="/waitlist/golfer" className="text-[10px] font-bold tracking-wider uppercase text-[#F4F1EA]/50 hover:text-[#F4F1EA] transition-colors">For Golfers</Link>
                <Link href="/waitlist/golfer#pricing" className="hover:text-[#F4F1EA] transition-colors pl-3">Pricing</Link>
                <Link href="/waitlist/course" className="text-[10px] font-bold tracking-wider uppercase text-[#F4F1EA]/50 hover:text-[#F4F1EA] transition-colors mt-1">For Courses</Link>
                <Link href="/barter" className="hover:text-[#F4F1EA] transition-colors pl-3">Barter Calculator</Link>
                <Link href="/damage" className="hover:text-[#F4F1EA] transition-colors pl-3">GolfNow Damage Report</Link>
                <Link href="/software-cost" className="hover:text-[#F4F1EA] transition-colors pl-3">Software Cost Calculator</Link>
              </nav>
            </div>

            {/* Column 3 — Company */}
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

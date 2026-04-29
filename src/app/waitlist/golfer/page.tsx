import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'
import { FadeIn } from '@/components/FadeIn'
import { GolferWaitlistForm } from './GolferWaitlistForm'

export const metadata: Metadata = {
  title: 'Join the Golfer Waitlist — TeeAhead',
  description: 'Get early access to TeeAhead, the local-first golf loyalty network coming to Metro Detroit.',
}

const tiers = [
  {
    key: 'fairway',
    name: 'Fairway',
    price: '$0',
    period: 'forever',
    badge: null,
    features: [
      'Book tee times at partner courses',
      '1× Fairway Points per dollar',
      'Free cancellation (1hr policy)',
    ],
  },
  {
    key: 'eagle',
    name: 'Eagle',
    price: '$89',
    period: '/yr',
    badge: 'Most Popular',
    features: [
      '250 bonus Fairway Points',
      '2× Fairway Points per dollar',
      'Priority booking: 48hr early access',
      'Always-on booking fee waiver',
      '1 guest pass per year',
      '10% birthday credit',
    ],
  },
  {
    key: 'ace',
    name: 'Ace',
    price: '$159',
    period: '/yr',
    badge: null,
    features: [
      '500 bonus Fairway Points',
      '3× Fairway Points per dollar',
      'Priority booking: 72hr early access',
      'Always-on booking fee waiver',
      '2 guest passes per year',
      '15% birthday credit',
    ],
  },
]

export default async function GolferWaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string }>
}) {
  const { tier } = await searchParams

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

      {/* ── Hero ─────────────────────────────────────────────── */}
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

            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 bg-[#E0A800]/15 backdrop-blur-sm border border-[#E0A800]/40 rounded-full px-4 py-1.5">
              <span className="size-2 rounded-full bg-[#E0A800] animate-pulse" />
              <span className="text-sm font-semibold text-[#E0A800] tracking-wide uppercase">Metro Detroit Launch</span>
            </div>

            {/* Headline */}
            <h1
              className="font-display font-black text-[#F4F1EA] leading-[1.08] tracking-[-0.02em]"
              style={{ fontSize: 'clamp(40px, 6vw, 58px)' }}
            >
              Always one tee{' '}
              <em style={{ fontStyle: 'italic', color: '#E0A800' }}>ahead.</em>
            </h1>

            {/* Subhead */}
            <p className="text-lg text-[#F4F1EA]/72 leading-relaxed max-w-xl mx-auto">
              Michigan&apos;s first golf loyalty platform. Join free — no credit card, no commitment.
            </p>

          </div>
        </FadeIn>
      </section>

      {/* ── Stat bar ─────────────────────────────────────────── */}
      <section className="bg-white px-6 py-12 border-t-4 border-[#E0A800]">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-8 sm:gap-16 text-center">
          {[
            { value: '$0', label: 'Free to join' },
            { value: '$89/yr', label: 'Eagle membership' },
            { value: '$40', label: 'Saved vs GolfPass+' },
            { value: '0', label: 'Booking fees on Eagle+' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p
                className="font-display font-extrabold text-[#0F3D2E] leading-none mb-1"
                style={{ fontSize: '32px' }}
              >
                {value}
              </p>
              <p className="text-xs text-[#6B7770]">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tab strip ────────────────────────────────────────── */}
      <div className="bg-white border-b border-black/8 sticky top-[73px] z-40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-1 py-2">
            <span className="px-5 py-2.5 rounded-lg bg-[#0F3D2E] text-sm font-semibold text-[#F4F1EA]">
              ⛳ I&apos;m a Golfer — Free to Join
            </span>
            <Link
              href="/waitlist/course"
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-[#6B7770] hover:text-[#1A1A1A] transition-colors"
            >
              🏌️ I Manage a Course — Founding Partner
            </Link>
          </div>
        </div>
      </div>

      {/* ── Tier cards ───────────────────────────────────────── */}
      <section className="bg-[#FAF7F2] px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <h2 className="text-center text-2xl font-display font-black text-[#0F3D2E] mb-10 tracking-[-0.01em]">
              Pick your tier.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {tiers.map((tierItem) => {
                const isEagle = tierItem.key === 'eagle'
                const isSelected = tier === tierItem.key
                return (
                  <Link
                    key={tierItem.key}
                    href={`?tier=${tierItem.key}`}
                    className={[
                      'relative rounded-2xl bg-white p-6 flex flex-col gap-4 transition-transform duration-150 hover:-translate-y-1',
                      isEagle
                        ? '-translate-y-2 border-2 border-[#E0A800] shadow-[0_8px_32px_rgba(224,168,0,0.18)]'
                        : isSelected
                          ? 'border-2 border-[#1B4332] ring-2 ring-[#E0A800] shadow-sm'
                          : 'border border-black/8 shadow-sm',
                    ].join(' ')}
                  >
                    {tierItem.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E0A800] text-[#0a0a0a] text-xs font-bold px-3 py-1 rounded-full tracking-wide uppercase whitespace-nowrap">
                        {tierItem.badge}
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute -top-3 right-4 bg-[#0F3D2E] text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                        ✓ Selected
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold tracking-[0.12em] uppercase text-[#6B7770] mb-1">{tierItem.name}</p>
                      <p className="text-3xl font-black text-[#0F3D2E] leading-none">
                        {tierItem.price}
                        <span className="text-base font-semibold text-[#9DAA9F] ml-1">{tierItem.period}</span>
                      </p>
                    </div>
                    <ul className="flex-1 space-y-2">
                      {tierItem.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-[#1A1A1A]">
                          <span className="text-[#E0A800] mt-0.5 shrink-0">✓</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <div
                      className={[
                        'w-full text-center text-sm font-semibold py-2.5 rounded-lg transition-colors',
                        isEagle
                          ? 'bg-[#E0A800] text-[#0a0a0a] hover:bg-[#E0A800]/90'
                          : 'border-2 border-[#0F3D2E] text-[#0F3D2E] hover:bg-[#0F3D2E]/8',
                      ].join(' ')}
                    >
                      Select {tierItem.name}
                    </div>
                  </Link>
                )
              })}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Form section ─────────────────────────────────────── */}
      <section className="px-6 py-16 bg-[#FAF7F2]">
        <div className="max-w-xl mx-auto">
          <div className="bg-[#0F3D2E] rounded-2xl p-8 sm:p-10">
            <p className="text-xs font-bold tracking-[0.14em] uppercase text-[#E0A800] mb-2">GOLFER WAITLIST</p>
            <p className="text-lg font-semibold text-[#F4F1EA] mb-8">Claim your spot. Earn every round.</p>
            <Suspense fallback={null}>
              <GolferWaitlistForm />
            </Suspense>
          </div>
        </div>
      </section>

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
              <nav className="flex flex-col gap-2 text-sm text-[#F4F1EA]/70">
                <Link href="/waitlist/golfer" className="hover:text-[#F4F1EA] transition-colors">For Golfers</Link>
                <Link href="/waitlist/course" className="hover:text-[#F4F1EA] transition-colors">For Courses</Link>
                <Link href="/barter" className="hover:text-[#F4F1EA] transition-colors">Barter Calculator</Link>
                <Link href="#pricing" className="hover:text-[#F4F1EA] transition-colors">Pricing</Link>
                <Link href="/software-cost" className="hover:text-[#F4F1EA] transition-colors">Software Cost Calculator</Link>
              </nav>
            </div>

            {/* Column 3 — Company */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#F4F1EA]/50 uppercase tracking-wider">Company</p>
              <nav className="flex flex-col gap-2 text-sm text-[#F4F1EA]/70">
                <a href="mailto:support@teeahead.com" className="hover:text-[#F4F1EA] transition-colors">Contact</a>
                <Link href="/terms" className="hover:text-[#F4F1EA] transition-colors">Terms</Link>
                <Link href="/privacy" className="hover:text-[#F4F1EA] transition-colors">Privacy</Link>
              </nav>
            </div>

          </div>
          <div className="border-t border-[#F4F1EA]/10 pt-6 text-center space-y-1">
            <p className="text-xs text-[#F4F1EA]/50">Metro Detroit, Michigan · <a href="mailto:billy.teeahead@gmail.com" className="hover:text-[#F4F1EA]/70 transition-colors">billy.teeahead@gmail.com</a></p>
            <p className="text-xs text-[#F4F1EA]/40">© 2026 TeeAhead, LLC. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  )
}

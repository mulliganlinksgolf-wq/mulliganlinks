import type { Metadata } from 'next'
import Link from 'next/link'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'
import { FadeIn } from '@/components/FadeIn'
import { TierPicker } from './TierPicker'
import { createClient } from '@/lib/supabase/server'
import { captureReferralCode } from '@/lib/referrals/capture'

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
      'In-round service requests (tap for help mid-round)',
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
      '1 complimentary round/yr (course-provided, subject to availability)',
      '1.5× Fairway Points per dollar',
      'Priority booking: 48hr early access',
      'Always-on booking fee waiver',
      '1 guest pass per year',
      '10% birthday credit',
      'In-round service requests (tap for help mid-round)',
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
      '2× Fairway Points per dollar',
      'Priority booking: 72hr early access',
      'Always-on booking fee waiver',
      '2 guest passes per year',
      '15% birthday credit',
      'In-round service requests (tap for help mid-round)',
    ],
  },
]

export default async function GolferWaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string; ref?: string }>
}) {
  const { tier, ref } = await searchParams
  await captureReferralCode(ref ?? null)

  const supabase = await createClient()
  const [{ count: golferCount }, { data: contentRows }, { data: activeCourses }] = await Promise.all([
    supabase.from('golfer_waitlist').select('*', { count: 'exact', head: true }),
    supabase.from('content_blocks').select('key, value').ilike('key', 'waitlist.%'),
    supabase.from('courses').select('id, name').eq('status', 'active').order('name'),
  ])
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
              <span className="text-sm font-semibold text-[#E0A800] tracking-wide uppercase">{c['waitlist.hero_badge'] ?? 'Metro Detroit Launch'}</span>
            </div>

            {/* Headline */}
            <h1 className="font-display font-black text-[#F4F1EA] leading-[1.08] tracking-[-0.02em]" style={{ fontSize: 'clamp(40px, 6vw, 58px)' }}>
              {c['waitlist.hero_headline'] ?? 'Golf at your home course, done right.'}
            </h1>

            {/* Subhead */}
            <p className="text-lg text-[#F4F1EA]/72 leading-relaxed max-w-xl mx-auto">
              {c['waitlist.hero_subhead'] ?? 'TeeAhead is the local alternative to GolfPass+. Zero booking fees. Real loyalty at the courses you actually play. Eagle membership is $89/yr — $30 less than GolfPass+ with more credits and no expiration.'}
            </p>

            {/* Live count badge */}
            {(golferCount ?? 0) > 0 && (
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5">
                <span className="size-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm text-[#F4F1EA]/80">{golferCount?.toLocaleString()}+ golfers already on the waitlist</span>
              </div>
            )}

          </div>
        </FadeIn>
      </section>

      {/* ── Stat bar ─────────────────────────────────────────── */}
      <section className="bg-white px-6 py-12 border-t-4 border-[#E0A800]">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-8 sm:gap-16 text-center">
          {[
            { value: '$0', label: 'Free to join' },
            { value: '$89/yr', label: 'Eagle membership' },
            { value: '$30', label: 'Saved vs GolfPass+' },
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
          <div className="flex justify-center gap-2 py-3">
            <span className="px-7 py-3 rounded-xl bg-[#0F3D2E] text-base font-semibold text-[#F4F1EA]">
              ⛳ I&apos;m a Golfer — Free to Join
            </span>
            <Link
              href="/waitlist/course"
              className="px-7 py-3 rounded-xl text-base font-semibold text-[#6B7770] border border-[#0F3D2E]/20 hover:border-[#0F3D2E]/50 hover:text-[#1A1A1A] hover:bg-[#0F3D2E]/5 transition-colors"
            >
              🏌️ I Manage a Course — Founding Partner
            </Link>
          </div>
        </div>
      </div>

      {/* ── Quick comparison ──────────────────────────────── */}
      <section className="bg-white px-6 py-12 border-t border-black/6">
        <div className="max-w-xl mx-auto">
          <p className="text-xs font-bold tracking-[0.14em] uppercase text-[#9DAA9F] text-center mb-6">How Eagle stacks up</p>
          <div className="rounded-xl overflow-hidden border border-black/8">
            {/* Header row */}
            <div className="grid grid-cols-3 bg-[#0F3D2E] text-[#F4F1EA] text-xs font-semibold">
              <div className="px-4 py-3"></div>
              <div className="px-4 py-3 text-center text-[#F4F1EA]/60">GolfPass+</div>
              <div className="px-4 py-3 text-center text-[#E0A800]">Eagle ($89/yr)</div>
            </div>
            {[
              { label: 'Booking fees', golfpass: '$2.49–$3.49/round', eagle: 'Zero, always' },
              { label: 'Credits', golfpass: 'Expire monthly', eagle: 'Never expire' },
              { label: 'Works at', golfpass: 'National chains', eagle: 'Your home course' },
            ].map(({ label, golfpass, eagle }, i) => (
              <div key={label} className={`grid grid-cols-3 text-sm ${i % 2 === 0 ? 'bg-white' : 'bg-[#FAF7F2]'}`}>
                <div className="px-4 py-3 font-medium text-[#1A1A1A]">{label}</div>
                <div className="px-4 py-3 text-center text-[#6B7770]">{golfpass}</div>
                <div className="px-4 py-3 text-center font-semibold text-[#0F3D2E]">{eagle}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tier cards + Form ────────────────────────────────── */}
      <TierPicker tiers={tiers} initialTier={tier ?? 'fairway'} courses={activeCourses ?? []} />

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
                <Link href="#pricing" className="hover:text-[#F4F1EA] transition-colors pl-3">Pricing</Link>
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

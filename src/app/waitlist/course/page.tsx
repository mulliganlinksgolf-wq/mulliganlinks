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
              <span className="text-sm font-semibold text-[#E0A800] tracking-wide uppercase">{c['waitlist_course.hero_badge'] ?? 'Metro Detroit Launch'}</span>
            </div>

            {/* Headline */}
            <h1 className="font-display font-black text-[#F4F1EA] leading-[1.08] tracking-[-0.02em]" style={{ fontSize: 'clamp(36px, 5.5vw, 54px)' }}>
              {c['waitlist_course.hero_headline'] ?? 'Stop giving GolfNow your tee times.'}
            </h1>

            {/* Subhead */}
            <p className="text-lg text-[#F4F1EA]/72 leading-relaxed max-w-xl mx-auto">
              {c['waitlist_course.hero_subhead'] ?? 'TeeAhead gives courses a complete booking and loyalty platform — free for your first year. No barter. No commissions. No data extraction.'}
            </p>

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
            <Link
              href="/waitlist/golfer"
              className="px-7 py-3 rounded-xl text-base font-semibold text-[#6B7770] border border-[#0F3D2E]/20 hover:border-[#0F3D2E]/50 hover:text-[#1A1A1A] hover:bg-[#0F3D2E]/5 transition-colors"
            >
              ⛳ I&apos;m a Golfer — Free to Join
            </Link>
            <span aria-current="page" className="px-7 py-3 rounded-xl bg-[#0F3D2E] text-base font-semibold text-[#F4F1EA]">
              🏌️ I Manage a Course — Founding Partner
            </span>
          </div>
        </div>
      </div>

      {/* ── Benefit cards ────────────────────────────────────── */}
      <section className="bg-[#0F3D2E] px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-2xl font-display font-black text-[#F4F1EA] mb-10 tracking-[-0.01em]">
            Why TeeAhead?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: '💸',
                title: 'Kill the Barter',
                description: 'Stop handing GolfNow free tee times worth $80K–$150K a year. Keep every dollar your golfers spend.',
              },
              {
                icon: '📋',
                title: 'Own Your Golfer Data',
                description: 'Every booking, every profile, every email address belongs to your course. Full CSV export anytime. We never market to your golfers.',
              },
              {
                icon: '⚡',
                title: 'Live within 48 hours',
                description: "We handle the entire setup. Your staff touches nothing. If you're not live within 48 hours, we'll make it right.",
              },
              {
                icon: '💰',
                title: 'Earn while you sleep',
                description: 'Refer a golfer to Eagle ($89/yr) and earn $8.90/mo for 12 months — automatically. Drop your QR code at the pro shop, send one email to your list. We handle the payouts.',
              },
            ].map(({ icon, title, description }) => (
              <div
                key={title}
                className="rounded-xl p-6 space-y-3"
                style={{ background: 'rgba(244,241,234,0.07)', border: '1px solid rgba(244,241,234,0.12)' }}
              >
                <p className="text-3xl">{icon}</p>
                <p className="font-semibold text-[#F4F1EA]">{title}</p>
                <p className="text-sm text-[#F4F1EA]/70 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing strip ────────────────────────────────────── */}
      <section className="bg-[#FAF7F2] px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-2xl font-display font-black text-[#0F3D2E] mb-10 tracking-[-0.01em]">
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
                description: 'Flat monthly, no commissions, no barter.',
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
                <p className="text-3xl font-black text-[#0F3D2E] leading-none">
                  {price}
                  {note && <span className="text-sm font-semibold text-[#9DAA9F] ml-1">{note}</span>}
                </p>
                <p className="text-sm text-[#6B7770] leading-relaxed">{description}</p>
                {multiYearNote && (
                  <p className="text-xs text-[#9DAA9F] mt-1">
                    Multi-year contracts available at a discount — ask Neil.
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
              <p className="text-xl font-black text-[#0F3D2E]">100+</p>
              <p className="text-xs text-[#6B7770] leading-snug">courses left GolfNow<br/>in Q1 2025 alone</p>
            </div>
            <div className="hidden sm:block w-px h-10 bg-[#0F3D2E]/15" />
            <div className="space-y-0.5">
              <p className="text-xl font-black text-[#0F3D2E]">$94,500</p>
              <p className="text-xs text-[#6B7770] leading-snug">avg annual barter cost<br/>per course</p>
            </div>
            <div className="hidden sm:block w-px h-10 bg-[#0F3D2E]/15" />
            <div className="space-y-0.5">
              <p className="text-xl font-black text-[#0F3D2E]">382%</p>
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

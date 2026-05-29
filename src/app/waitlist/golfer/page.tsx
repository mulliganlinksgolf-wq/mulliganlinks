import type { Metadata } from 'next'
import Link from 'next/link'
import { FadeIn } from '@/components/FadeIn'
import { TierPicker } from './TierPicker'
import { createClient } from '@/lib/supabase/server'
import { captureReferralCode } from '@/lib/referrals/capture'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Join the Golfer Waitlist',
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
      'Standard $1.49 booking fee per round',
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
      '$10 birthday credit',
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
      '2 complimentary rounds/yr (course-provided, subject to availability)',
      '2× Fairway Points per dollar',
      'Priority booking: 72hr early access',
      'Always-on booking fee waiver',
      '2 guest passes per year',
      '$20 birthday credit',
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

      <SiteHeader />

      {/* ── Hero, editorial, cream, with member card ────────────── */}
      <section className="bg-[#FAF7F2] px-6 sm:px-10 lg:px-16 py-16 sm:py-20">
        <FadeIn>
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-14 items-center">

            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="w-7 h-px bg-[#E0A800]" />
                <span className="font-mono text-xs tracking-[0.16em] uppercase text-[#6B7770]">
                  {c['waitlist.hero_badge'] ?? 'For Metro Detroit golfers · Waitlist open'}
                </span>
              </div>

              <h1
                className="font-display text-[#0F3D2E] leading-[0.96] tracking-[-0.025em]"
                style={{ fontSize: 'clamp(48px, 7vw, 84px)', fontWeight: 400 }}
              >
                Loyalty that lives at the courses you{' '}
                <em className="italic text-[#E0A800]">actually play.</em>
              </h1>

              <p className="mt-6 text-base sm:text-lg leading-relaxed text-[#1A1A1A]/78 max-w-xl">
                TeeAhead is the local-first alternative to GolfPass+. Zero booking fees on Eagle. Points that never expire. Eagle membership is{' '}
                <strong className="text-[#0F3D2E]">$89/yr</strong>, $30 less than GolfPass+ with more credits and more flexibility.
              </p>

              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <Link
                  href="#pricing"
                  className="inline-flex items-center justify-center rounded-lg bg-[#0F3D2E] px-6 py-3.5 text-sm font-semibold text-[#F4F1EA] hover:bg-[#0F3D2E]/90 transition-colors"
                >
                  Join the waitlist →
                </Link>
                <Link
                  href="#compare"
                  className="inline-flex items-center justify-center rounded-lg border border-[#0F3D2E] px-6 py-3.5 text-sm font-semibold text-[#0F3D2E] hover:bg-[#0F3D2E]/5 transition-colors"
                >
                  Compare to GolfPass+
                </Link>
              </div>

              {(golferCount ?? 0) > 0 && (
                <div className="mt-6 flex items-center gap-3 text-sm text-[#6B7770]">
                  <div className="flex">
                    {['#E0A800','#0F3D2E','#8FA889','#6B7770'].map((bg, i) => (
                      <span
                        key={i}
                        className="size-6 rounded-full border-2 border-[#FAF7F2]"
                        style={{ background: bg, marginLeft: i ? -8 : 0 }}
                      />
                    ))}
                  </div>
                  <span>
                    <strong className="text-[#0F3D2E]">{golferCount?.toLocaleString()}+</strong> golfers already on the waitlist
                  </span>
                </div>
              )}
            </div>

            {/* Member card preview */}
            <div className="hidden lg:flex lg:justify-self-end w-full max-w-sm">
              <div className="bg-[#082419] rounded-2xl p-7 text-[#F4F1EA] shadow-[0_30px_60px_rgba(8,36,25,0.3)] w-full">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#E0A800]">Eagle Member · 2026</p>
                    <p className="font-display text-2xl mt-1" style={{ fontWeight: 400 }}>Riley Mahoney</p>
                  </div>
                  <div className="size-10 rounded-full border-[1.5px] border-[#E0A800] flex items-center justify-center text-[#E0A800] font-display text-base">T</div>
                </div>
                <div className="h-px bg-[#F4F1EA]/15 mb-4" />
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { k: '2,140', v: 'Fairway pts' },
                    { k: '18', v: 'Rounds 2026' },
                    { k: '4', v: 'Home courses' },
                  ].map(({ k, v }) => (
                    <div key={v}>
                      <p className="font-display text-2xl text-[#E0A800] leading-none" style={{ fontWeight: 400 }}>{k}</p>
                      <p className="text-[11px] text-[#F4F1EA]/65 mt-1">{v}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-lg p-3.5" style={{ background: 'rgba(244,241,234,0.08)' }}>
                  <p className="text-[11px] text-[#F4F1EA]/60 mb-1">Next round</p>
                  <p className="text-sm font-semibold">Plum Hollow · Sat 9:40 AM</p>
                  <p className="mt-1.5 font-mono text-[10px] tracking-[0.05em] text-[#E0A800]">+45 PTS ON CHECK-IN</p>
                </div>
              </div>
            </div>

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
      <div className="bg-white border-b border-[#0F3D2E]/10 sticky top-[60px] z-40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-center gap-2 py-3">
            <span aria-current="page" className="px-6 py-2.5 rounded-lg bg-[#0F3D2E] text-sm font-semibold text-[#F4F1EA]">
              For golfers
            </span>
            <Link
              href="/waitlist/course"
              className="px-6 py-2.5 rounded-lg text-sm font-semibold text-[#6B7770] border border-[#0F3D2E]/15 hover:border-[#0F3D2E]/40 hover:text-[#0F3D2E] hover:bg-[#0F3D2E]/5 transition-colors"
            >
              For courses
            </Link>
          </div>
        </div>
      </div>

      {/* ── Quick comparison ──────────────────────────────── */}
      <section id="compare" className="bg-white px-6 py-12 border-t border-black/6">
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
              { label: 'Works at', golfpass: 'National chains', eagle: 'Any TeeAhead partner' },
            ].map(({ label, golfpass, eagle }, i) => (
              <div key={label} className={`grid grid-cols-3 text-sm ${i % 2 === 0 ? 'bg-white' : 'bg-[#FAF7F2]'}`}>
                <div className="px-4 py-3 font-medium text-[#1A1A1A]">{label}</div>
                <div className="px-4 py-3 text-center text-[#6B7770]">{golfpass}</div>
                <div className="px-4 py-3 text-center font-semibold text-[#0F3D2E]">{eagle}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-[#9DAA9F] leading-relaxed text-center">
            GolfPass+ pricing and features as of May 2026, subject to change. TeeAhead is not affiliated with or endorsed by NBC Sports Next.
          </p>
          <p className="mt-5 text-sm text-[#6B7770] leading-relaxed text-center">
            Play a season, earn a free round: 5,000 Fairway Points redeem for one complimentary round, about every 71 rounds on Fairway, 48 as Eagle (1.5×), 36 as Ace (2×). Eagle pays for itself on the included complimentary round and $10 birthday credit alone. Points are the long game on top.
          </p>
        </div>
      </section>

      {/* ── Tier cards + Form ────────────────────────────────── */}
      <TierPicker tiers={tiers} initialTier={tier ?? 'fairway'} courses={activeCourses ?? []} />

      <SiteFooter />

    </div>
  )
}

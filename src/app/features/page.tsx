import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'
import { FadeIn } from '@/components/FadeIn'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Features — TeeAhead',
  description: 'One platform, both sides of the round. Tee sheet, loyalty, exchange, and payments for independent golf courses and the people who actually play.',
  alternates: { canonical: '/features' },
}

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <FeaturesNav />
      <FeaturesHero />
      <CourseChapter />
      <GolferChapter />
      <AllFeaturesGrid />
      <FinalCTA />
      <SiteFooter />
    </div>
  )
}

function FeaturesNav() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#0F3D2E]/10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <TeeAheadLogo className="h-10 sm:h-12 w-auto" />
        </Link>
        <div className="flex items-center gap-5">
          <Link href="/features" className="text-sm text-[#0F3D2E] font-semibold">Features</Link>
          <Link href="/pricing" className="text-sm text-[#0F3D2E]/70 hover:text-[#0F3D2E]">Pricing</Link>
          <Link href="/about" className="text-sm text-[#0F3D2E]/70 hover:text-[#0F3D2E] hidden sm:inline">About</Link>
          <Link href="/waitlist/course" className="inline-flex items-center rounded-md bg-[#0F3D2E] px-4 py-2.5 text-sm font-semibold text-[#F4F1EA] hover:bg-[#0F3D2E]/90">
            Claim a spot →
          </Link>
        </div>
      </div>
    </header>
  )
}

function FeaturesHero() {
  return (
    <section className="bg-[#FAF7F2] px-6 sm:px-10 lg:px-16 py-16 sm:py-24">
      <FadeIn>
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.3fr_1fr] gap-12 lg:gap-16 items-center">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="w-7 h-px bg-[#E0A800]" />
              <span className="font-mono text-xs tracking-[0.16em] uppercase text-[#6B7770]">
                The product · everything TeeAhead does
              </span>
            </div>
            <h1
              className="font-display text-[#0F3D2E] leading-[0.96] tracking-[-0.025em]"
              style={{ fontSize: 'clamp(56px, 9vw, 96px)', fontWeight: 400 }}
            >
              One platform.<br />
              <em className="italic text-[#E0A800]">Both sides</em><br />
              of the round.
            </h1>
            <p className="mt-6 text-base sm:text-lg text-[#1A1A1A]/78 leading-relaxed max-w-xl">
              Tee sheet, loyalty, exchange, payments — built for the course operator who actually runs the day, and the regular who actually plays the round. No barter, no commissions, no national-chain lock-in.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="#for-courses"
                className="inline-flex items-center justify-center rounded-md bg-[#0F3D2E] px-6 py-3.5 text-sm font-semibold text-[#F4F1EA] hover:bg-[#0F3D2E]/90"
              >
                For course operators ↓
              </Link>
              <Link
                href="#for-golfers"
                className="inline-flex items-center justify-center rounded-md border border-[#0F3D2E] px-6 py-3.5 text-sm font-semibold text-[#0F3D2E] hover:bg-[#0F3D2E]/5"
              >
                For golfers ↓
              </Link>
            </div>
          </div>

          {/* Product peek — real screenshots from /public/screenshots/ */}
          <div className="hidden lg:block relative h-[460px]">
            <Image
              src="/screenshots/dashboard.png"
              width={400}
              height={234}
              alt="TeeAhead course dashboard"
              priority
              className="absolute top-0 right-0 w-[400px] h-auto rounded-xl shadow-[0_18px_40px_rgba(0,0,0,0.18)] border border-black/8 rotate-[2deg]"
            />
            <Image
              src="/screenshots/member-home.png"
              width={200}
              height={400}
              alt="TeeAhead member home"
              priority
              className="absolute bottom-0 left-0 w-[200px] h-[400px] object-cover rounded-[26px] shadow-[0_20px_40px_rgba(0,0,0,0.25)] border-[5px] border-[#1A1A1A] rotate-[-3deg]"
            />
          </div>
        </div>
      </FadeIn>
    </section>
  )
}

function CourseChapter() {
  return (
    <section id="for-courses" className="bg-[#082419] text-[#F4F1EA] px-6 sm:px-10 lg:px-16 py-20 sm:py-24">
      <FadeIn>
        <div className="max-w-6xl mx-auto space-y-12">

          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xs tracking-[0.18em] uppercase text-[#E0A800] font-semibold">
              Chapter 01 · For course operators
            </span>
            <span className="flex-1 h-px bg-[#F4F1EA]/15" />
            <span className="font-mono text-[10px] tracking-[0.1em] text-[#F4F1EA]/50">06 FEATURES</span>
          </div>

          <h2
            className="font-display leading-[0.96] tracking-[-0.025em] max-w-3xl"
            style={{ fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 400 }}
          >
            Everything you need to run the day,{' '}
            <em className="italic text-[#E0A800]">nothing</em> you don&apos;t.
          </h2>

          {/* Featured pair */}
          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-10 items-center">
            <div>
              <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-[#E0A800] font-semibold mb-3">01 · The dashboard</p>
              <h3 className="font-display text-4xl leading-tight tracking-[-0.015em]" style={{ fontWeight: 400 }}>
                The day at a <em className="italic text-[#E0A800]">single glance.</em>
              </h3>
              <p className="mt-4 text-[15px] leading-relaxed text-[#F4F1EA]/78 max-w-md">
                Today&apos;s revenue, week-over-week change, 30-day utilization, top members, and the golfer who&apos;s about to churn. One screen, no exports, no dashboards-to-the-dashboard.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {['Live revenue', '30-day chart', 'Top members', 'Winback nudges'].map(t => (
                  <span key={t} className="font-mono text-[11px] px-2.5 py-1 rounded bg-white/[0.08] tracking-[0.04em]">{t}</span>
                ))}
              </div>
            </div>
            <Image
              src="/screenshots/dashboard.png"
              width={924}
              height={540}
              alt="Course dashboard — revenue, utilization, top members"
              className="rounded-xl shadow-[0_18px_40px_rgba(0,0,0,0.18)] border border-white/10 w-full h-auto"
            />
          </div>

          {/* 3 secondary cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            <SecondaryFeatureCard
              num="02"
              title="Tee sheet"
              desc="Every slot earns. No barter, ever."
              imageSrc="/screenshots/tee-sheet.png"
              badge="REAL-TIME · LIVE"
            />
            <SecondaryFeatureCard
              num="03"
              title="Members table"
              desc="Your data, exported anytime."
              imageSrc="/screenshots/members.png"
              badge="FULL EXPORT · CSV"
            />
            <SecondaryFeatureCard num="04" title="Direct payouts" desc="Stripe Connect. Greens fees land in your bank." badge="STRIPE · DIRECT · YOUR BANK" />
          </div>

          {/* 2 more secondary cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            <SecondaryFeatureCard num="05" title="QR check-in" desc="One scan. No clipboards, no double-booking, no front-desk lines." badge="ONE SCAN · NO LINES" />
            <SecondaryFeatureCard num="06" title="Leagues & outings" desc="9 + 18-hole league manager, live standings, group payments, handicap tracking." badge="9 · 18 HOLES · LIVE" />
          </div>
        </div>
      </FadeIn>
    </section>
  )
}

function SecondaryFeatureCard({ num, title, desc, badge, imageSrc }: {
  num: string; title: string; desc: string; badge?: string; imageSrc?: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
      {imageSrc ? (
        <div className="h-32 rounded-md overflow-hidden bg-white/[0.04]">
          <Image
            src={imageSrc}
            alt={title}
            width={924}
            height={540}
            className="w-full h-full object-cover object-left-top"
          />
        </div>
      ) : badge ? (
        <div className="h-32 flex items-center justify-center bg-[#F4F1EA]/[0.06] border border-[#F4F1EA]/10 rounded-md px-3">
          <span
            className="font-display text-[#E0A800] text-[24px] tracking-[-0.01em] text-center leading-tight"
            style={{ fontWeight: 400 }}
          >
            {badge}
          </span>
        </div>
      ) : (
        <div className="h-32 bg-white/10 rounded-md" />
      )}
      <div>
        <p className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-[#E0A800] font-bold">{num}</p>
        <p className="font-display text-[22px] mt-1" style={{ fontWeight: 400 }}>{title}</p>
        <p className="text-[12.5px] text-[#F4F1EA]/65 mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function GolferChapter() {
  return (
    <section id="for-golfers" className="bg-[#FAF7F2] px-6 sm:px-10 lg:px-16 py-20 sm:py-24">
      <FadeIn>
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xs tracking-[0.18em] uppercase text-[#E0A800] font-semibold">
              Chapter 02 · For golfers
            </span>
            <span className="flex-1 h-px bg-[#0F3D2E]/10" />
            <span className="font-mono text-[10px] tracking-[0.1em] text-[#6B7770]">05 FEATURES</span>
          </div>

          <h2
            className="font-display text-[#0F3D2E] leading-[0.96] tracking-[-0.025em] max-w-3xl"
            style={{ fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 400 }}
          >
            A membership that <em className="italic text-[#E0A800]">pays for itself.</em>
          </h2>

          {/* Featured: Fairway Points */}
          <div className="grid lg:grid-cols-[1fr_320px] gap-10 items-center">
            <div>
              <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-[#E0A800] font-semibold mb-3">07 · Fairway Points</p>
              <h3 className="font-display text-4xl text-[#0F3D2E] leading-tight tracking-[-0.015em]" style={{ fontWeight: 400 }}>
                Loyalty that lives at the courses you{' '}
                <em className="italic text-[#E0A800]">actually play.</em>
              </h3>
              <p className="mt-4 text-[15px] leading-relaxed text-[#1A1A1A]/78 max-w-lg">
                Earn at every TeeAhead course. Redeem at any. No expiration, no monthly reset, no &ldquo;use it in 30 days or lose it.&rdquo;
              </p>
              <div className="mt-5 grid grid-cols-3 gap-4 max-w-md">
                {[
                  { k: '1×', v: 'Fairway' },
                  { k: '1.5×', v: 'Eagle ($89)' },
                  { k: '2×', v: 'Ace ($159)' },
                ].map(({ k, v }) => (
                  <div key={k} className="border-t border-[#0F3D2E] pt-2">
                    <p className="font-display text-[32px] text-[#0F3D2E] leading-none tracking-[-0.015em]" style={{ fontWeight: 400 }}>{k}</p>
                    <p className="text-[11px] text-[#6B7770] mt-1 font-mono tracking-[0.04em]">{v}</p>
                  </div>
                ))}
              </div>
            </div>
            <Image
              src="/screenshots/member-points.png"
              width={210}
              height={420}
              alt="Fairway Points member view"
              className="justify-self-center rounded-[28px] border-[5px] border-[#1A1A1A] shadow-[0_20px_40px_rgba(0,0,0,0.25)] object-cover"
            />
          </div>

          {/* 4 secondary cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <GolferSecondaryCard num="08" title="Book at zero fees" desc="Eagle and Ace pay $0 in booking fees, always." badge="$0 FEES · ALWAYS" phone />
            <GolferSecondaryCard num="09" title="Tee time exchange" desc="Can't make it? List it. Earn credit when claimed." badge="$0 LOST" />
            <GolferSecondaryCard num="10" title="Find a partner" desc="Browse availability by date. Eagle + Ace only." badge="14 DAYS OUT" />
            <GolferSecondaryCard num="11" title="In-round service" desc="Beverage, cart, pace — one tap to the pro shop." badge="<1S TO RESPOND" />
          </div>
        </div>
      </FadeIn>
    </section>
  )
}

function GolferSecondaryCard({ num, title, desc, badge, phone }: { num: string; title: string; desc: string; badge: string; phone?: boolean }) {
  return (
    <div className="bg-white border border-[#0F3D2E]/10 rounded-xl p-4 flex flex-col gap-3">
      {phone ? (
        <div className="h-36 flex items-center justify-center bg-[#0F3D2E]/[0.06] rounded-md overflow-hidden">
          <Image
            src="/screenshots/member-book.png"
            width={78}
            height={132}
            alt={title}
            className="rounded-[14px] border-[3px] border-[#1A1A1A] shadow-[0_8px_18px_rgba(0,0,0,0.18)] object-cover"
          />
        </div>
      ) : (
        <div className="h-36 flex items-center justify-center bg-[#0F3D2E]/[0.06] rounded-md">
          <span
            className="font-display text-[#0F3D2E] text-[24px] tracking-[-0.01em] text-center px-3"
            style={{ fontWeight: 400 }}
          >
            {badge}
          </span>
        </div>
      )}
      <div>
        <p className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-[#E0A800] font-bold">{num}</p>
        <p className="font-display text-xl text-[#0F3D2E] mt-1" style={{ fontWeight: 400 }}>{title}</p>
        <p className="text-[12.5px] text-[#1A1A1A]/70 mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

const FEATURE_CATS = [
  {
    n: '01', c: 'Bookings & Tee Sheet', stat: '<1s', statLabel: 'avg slot load',
    items: ['Real-time booking', 'Day-grid view', 'QR check-in', 'Buffer + cart logic', 'Walk-in entry', 'Multi-cart booking'],
    mark: 'grid',
  },
  {
    n: '02', c: 'Members & Loyalty', stat: '∞', statLabel: 'point expiration',
    items: ['Fairway Points (no expiry)', '1.5× / 2× tier multipliers', 'Birthday credit', 'Guest passes', 'Bonus signup points', 'Tier upgrades'],
    mark: 'dot',
  },
  {
    n: '03', c: 'Payments', stat: '0%', statLabel: 'commission, ever',
    items: ['Stripe Connect direct payout', 'No commissions', 'Zero booking fees on Eagle+', 'Subscription billing', 'P&L reports', 'GL export'],
    mark: 'ring',
  },
  {
    n: '04', c: 'Operator Tools', stat: '1 click', statLabel: 'CSV export',
    items: ['Revenue + utilization', 'Top-member list', 'Winback nudges', 'CSV export', 'Bulk SMS waitlist', 'Custom rack rates'],
    mark: 'square',
  },
  {
    n: '05', c: 'Player Experience', stat: '14 days', statLabel: 'partner visibility',
    items: ['Find a partner', 'Tee time exchange', 'Mid-round service requests', 'Live wait times', '14-day partner visibility', 'Round ratings'],
    mark: 'flag',
  },
  {
    n: '06', c: 'Leagues & Outings', stat: 'Live', statLabel: 'standings update',
    items: ['9 + 18-hole leagues', 'Live standings', 'Outing manager', 'League payments', 'Handicap tracking', 'Group bookings'],
    mark: 'tri',
  },
]

function FeaturesAllGridMark({ kind, dark }: { kind: string; dark: boolean }) {
  const stroke = dark ? '#E0A800' : '#0F3D2E'
  const fill = dark ? '#E0A800' : '#0F3D2E'
  const op = dark ? 0.9 : 0.85
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" style={{ opacity: op }}>
      {kind === 'grid' && Array.from({ length: 9 }).map((_, i) => (
        <rect key={i} x={6 + (i % 3) * 12} y={6 + Math.floor(i / 3) * 12} width="8" height="8" fill={i % 2 ? fill : 'none'} stroke={stroke} strokeWidth="1" />
      ))}
      {kind === 'dot' && <>
        <circle cx="22" cy="22" r="18" fill="none" stroke={stroke} strokeWidth="1" strokeDasharray="2 3" />
        <circle cx="22" cy="22" r="10" fill="none" stroke={stroke} strokeWidth="1" />
        <circle cx="22" cy="22" r="3" fill={fill} />
      </>}
      {kind === 'ring' && <>
        <circle cx="22" cy="22" r="18" fill="none" stroke={stroke} strokeWidth="1.5" />
        <circle cx="22" cy="22" r="6" fill={fill} />
      </>}
      {kind === 'square' && <>
        <rect x="4" y="4" width="36" height="36" fill="none" stroke={stroke} strokeWidth="1" />
        <rect x="14" y="14" width="16" height="16" fill={fill} />
      </>}
      {kind === 'flag' && <>
        <line x1="14" y1="6" x2="14" y2="38" stroke={stroke} strokeWidth="1.5" />
        <path d="M 14 8 L 32 14 L 14 20 Z" fill={fill} />
      </>}
      {kind === 'tri' && <>
        <path d="M 22 6 L 38 36 L 6 36 Z" fill="none" stroke={stroke} strokeWidth="1.5" />
        <path d="M 22 18 L 30 32 L 14 32 Z" fill={fill} />
      </>}
    </svg>
  )
}

function AllFeaturesGrid() {
  return (
    <section className="bg-[#F4F1EA] px-6 sm:px-10 lg:px-16 py-20">
      <FadeIn>
        <div className="max-w-6xl mx-auto space-y-12">

          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xs tracking-[0.18em] uppercase text-[#E0A800] font-semibold">
              The full surface · 36 features
            </span>
            <span className="flex-1 h-px bg-[#0F3D2E]/10" />
          </div>

          <h2 className="font-display text-[#0F3D2E] tracking-[-0.025em] leading-[0.96] max-w-3xl"
              style={{ fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 400 }}>
            Everything else, in <em className="italic text-[#E0A800]">one place.</em>
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURE_CATS.map((cat, i) => {
              // Checkerboard: cards at index 0, 3, 5 → dark; 1, 2, 4 → light
              const dark = [0, 3, 5].includes(i)
              return (
                <div
                  key={cat.n}
                  className={`relative rounded-2xl p-7 ${
                    dark
                      ? 'bg-[#082419] text-[#F4F1EA] shadow-[0_18px_40px_rgba(8,36,25,0.18)]'
                      : 'bg-white text-[#1A1A1A] border border-[#0F3D2E]/10'
                  }`}
                >
                  {/* Top row: big number + geometric mark */}
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className={`font-display tracking-[-0.02em] leading-none ${dark ? 'text-[#E0A800]' : 'text-[#0F3D2E]'}`}
                      style={{ fontSize: 48, fontWeight: 400 }}
                    >
                      {cat.n}
                    </span>
                    <FeaturesAllGridMark kind={cat.mark} dark={dark} />
                  </div>

                  {/* Category name */}
                  <h3 className={`font-display text-[22px] tracking-[-0.01em] leading-tight mb-5 ${dark ? 'text-[#F4F1EA]' : 'text-[#0F3D2E]'}`}
                      style={{ fontWeight: 400 }}>
                    {cat.c}
                  </h3>

                  {/* Features — 2 columns */}
                  <ul className="grid grid-cols-2 gap-x-3 gap-y-2 mb-6">
                    {cat.items.map(item => (
                      <li key={item} className="grid grid-cols-[10px_1fr] gap-1.5 text-[12.5px] leading-snug items-baseline">
                        <span className={`font-mono text-[10px] ${dark ? 'text-[#E0A800]' : 'text-[#0F3D2E]'}`}>—</span>
                        <span className={dark ? 'text-[#F4F1EA]/85' : 'text-[#1A1A1A]/80'}>{item}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Footer stat */}
                  <div className={`pt-4 border-t flex items-baseline justify-between ${dark ? 'border-[#F4F1EA]/15' : 'border-[#0F3D2E]/10'}`}>
                    <span className={`font-display text-[28px] tracking-[-0.015em] leading-none ${dark ? 'text-[#E0A800]' : 'text-[#0F3D2E]'}`}
                          style={{ fontWeight: 400 }}>
                      {cat.stat}
                    </span>
                    <span className={`font-mono text-[10px] tracking-[0.1em] uppercase ${dark ? 'text-[#F4F1EA]/55' : 'text-[#6B7770]'}`}>
                      {cat.statLabel}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="max-w-3xl text-[14px] text-[#6B7770] leading-relaxed">
            Everything above is included for Founding Partner courses for their first year — and for every TeeAhead golfer on every tier.
          </p>

        </div>
      </FadeIn>
    </section>
  )
}

function FinalCTA() {
  return (
    <section className="bg-[#FAF7F2] px-6 py-20 text-center border-t border-[#0F3D2E]/10">
      <FadeIn>
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="font-display text-[#0F3D2E] leading-tight tracking-[-0.02em]" style={{ fontSize: 'clamp(32px, 4.5vw, 44px)', fontWeight: 400 }}>
            Ready to drop GolfNow?
          </h2>
          <p className="text-base text-[#6B7770]">
            7 of 10 Founding Partner spots open. First year is free.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/waitlist/course" className="inline-flex items-center justify-center rounded-md bg-[#0F3D2E] px-7 py-3.5 text-sm font-semibold text-[#F4F1EA] hover:bg-[#0F3D2E]/90">
              Claim a founding spot →
            </Link>
          </div>
          <p className="text-sm text-[#6B7770]">
            Golfer instead?{' '}
            <Link href="/waitlist/golfer" className="text-[#0F3D2E] font-semibold underline underline-offset-2">Join the loyalty waitlist →</Link>
          </p>
        </div>
      </FadeIn>
    </section>
  )
}

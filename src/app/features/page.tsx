import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { FadeIn } from '@/components/FadeIn'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'

export const metadata: Metadata = {
  title: 'Features',
  description: 'One platform, both sides of the round. Tee sheet, loyalty, exchange, and payments for independent golf courses and the people who actually play.',
  alternates: { canonical: '/features' },
}

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <SiteHeader />
      <FeaturesHero />
      <CourseChapter />
      <GolferChapter />
      <AllFeaturesGrid />
      <FinalCTA />
      <SiteFooter />
    </div>
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
              Tee sheet, loyalty, exchange, payments, built for the course operator who actually runs the day, and the regular who actually plays the round. No barter, no commissions, no national-chain lock-in.
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

          {/* Product peek, real screenshots from /public/screenshots/ */}
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
              alt="Course dashboard showing revenue, utilization, and top members"
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
            />
            <SecondaryFeatureCard
              num="03"
              title="Members table"
              desc="Your data, exported anytime."
              imageSrc="/screenshots/members.png"
            />
            <SecondaryFeatureCard num="04" title="Direct payouts" desc="Stripe Connect. Greens fees land in your bank." graphic="payouts" />
          </div>

          {/* 3 more secondary cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            <SecondaryFeatureCard num="05" title="QR check-in" desc="One scan. No clipboards, no double-booking." graphic="qr" />
            <SecondaryFeatureCard num="06" title="Leagues & outings" desc="9 + 18-hole league manager, live standings." graphic="leagues" />
            <SecondaryFeatureCard num="07" title="Self-grouped tee times" desc="Solos and twosomes join partial groups. Paired by us, emailed the night before." graphic="self-grouping" />
          </div>
        </div>
      </FadeIn>
    </section>
  )
}

type FeatureGraphicKind = 'payouts' | 'qr' | 'leagues' | 'self-grouping'

function FeatureGraphic({ kind, dark = true }: { kind: FeatureGraphicKind; dark?: boolean }) {
  const bg = dark ? 'bg-white/[0.04]' : 'bg-[#0F3D2E]/[0.04]'
  const goldText = '#E0A800'
  const subText = dark ? 'text-[#F4F1EA]/60' : 'text-[#6B7770]'
  const subTextStrong = dark ? 'text-[#F4F1EA]' : 'text-[#0F3D2E]'

  if (kind === 'payouts') {
    return (
      <div className={`h-32 rounded-md ${bg} flex flex-col items-center justify-center gap-1`}>
        <span className="font-display text-[64px] leading-none tracking-[-0.03em]" style={{ fontWeight: 400, color: goldText }}>0%</span>
        <span className={`font-mono text-[10px] tracking-[0.18em] uppercase ${subText}`}>commission · ever</span>
      </div>
    )
  }

  if (kind === 'qr') {
    const pattern = [
      [1,1,1,0,1,0,1,1,1],
      [1,0,1,1,0,1,1,0,1],
      [1,1,1,0,1,1,0,1,1],
      [0,1,0,1,1,0,1,1,0],
      [1,0,1,1,0,1,0,1,1],
      [1,1,0,0,1,1,1,0,1],
      [1,0,1,1,0,0,1,1,1],
    ]
    return (
      <div className={`h-32 rounded-md ${bg} flex items-center justify-center gap-4 px-4`}>
        <div className="grid grid-cols-9 gap-[2px]">
          {pattern.flat().map((v, i) => (
            <span key={i} className={`w-2 h-2 rounded-[1px] ${v ? 'bg-[#E0A800]' : 'bg-transparent'}`} />
          ))}
        </div>
        <div>
          <div className={`font-display text-[24px] leading-none tracking-[-0.01em] ${subTextStrong}`} style={{ fontWeight: 400 }}>One scan.</div>
          <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#E0A800] mt-1">no lines</div>
        </div>
      </div>
    )
  }

  if (kind === 'leagues') {
    return (
      <div className={`h-32 rounded-md ${bg} flex items-center justify-center gap-4 px-4`}>
        <div className="text-center">
          <div className="font-display text-[48px] leading-none tracking-[-0.025em]" style={{ fontWeight: 400, color: goldText }}>9</div>
          <div className={`font-mono text-[9px] tracking-[0.14em] uppercase mt-1 ${subText}`}>holes</div>
        </div>
        <div className={`font-display text-[24px] ${dark ? 'text-[#F4F1EA]/40' : 'text-[#0F3D2E]/40'}`}>/</div>
        <div className="text-center">
          <div className="font-display text-[48px] leading-none tracking-[-0.025em]" style={{ fontWeight: 400, color: goldText }}>18</div>
          <div className={`font-mono text-[9px] tracking-[0.14em] uppercase mt-1 ${subText}`}>holes</div>
        </div>
        <div className="ml-3 flex flex-col gap-[3px]">
          <div className="h-[3px] w-12 bg-[#E0A800] rounded-full" />
          <div className="h-[3px] w-10 bg-[#E0A800]/60 rounded-full" />
          <div className="h-[3px] w-8 bg-[#E0A800]/40 rounded-full" />
          <div className="h-[3px] w-6 bg-[#E0A800]/25 rounded-full" />
          <div className={`font-mono text-[8px] tracking-[0.14em] uppercase mt-1 ${subText}`}>live standings</div>
        </div>
      </div>
    )
  }

  // self-grouping
  return (
    <div className={`h-32 rounded-md ${bg} flex flex-col items-center justify-center gap-3 px-4`}>
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-full" style={{ background: goldText }} />
        <span className={`font-mono text-[14px] ${subText}`}>+</span>
        <span className={`w-6 h-6 rounded-full border ${dark ? 'border-[#E0A800]/70' : 'border-[#0F3D2E]/40'}`} style={{ background: dark ? 'rgba(224,168,0,0.18)' : 'rgba(15,61,46,0.06)' }} />
        <span className={`w-6 h-6 rounded-full border ${dark ? 'border-[#E0A800]/70' : 'border-[#0F3D2E]/40'}`} style={{ background: dark ? 'rgba(224,168,0,0.18)' : 'rgba(15,61,46,0.06)' }} />
        <span className={`w-6 h-6 rounded-full border ${dark ? 'border-[#E0A800]/70' : 'border-[#0F3D2E]/40'}`} style={{ background: dark ? 'rgba(224,168,0,0.18)' : 'rgba(15,61,46,0.06)' }} />
      </div>
      <span className={`font-mono text-[10px] tracking-[0.18em] uppercase ${subText}`}>solo · joined · foursome</span>
    </div>
  )
}

function SecondaryFeatureCard({ num, title, desc, imageSrc, graphic }: {
  num: string; title: string; desc: string; imageSrc?: string; graphic?: FeatureGraphicKind;
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
      ) : graphic ? (
        <FeatureGraphic kind={graphic} dark />
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
        <div className="max-w-6xl mx-auto space-y-10">

          {/* Section header */}
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xs tracking-[0.18em] uppercase text-[#E0A800] font-semibold">
              Chapter 02 · For golfers
            </span>
            <span className="flex-1 h-px bg-[#0F3D2E]/10" />
            <span className="font-mono text-[10px] tracking-[0.1em] text-[#6B7770]">05 FEATURES</span>
          </div>

          <h2
            className="font-display text-[#0F3D2E] tracking-[-0.025em] leading-[0.96] max-w-3xl"
            style={{ fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 400 }}
          >
            A membership that <em className="italic text-[#E0A800]">pays for itself.</em>
          </h2>

          {/* Diagram: 4 callouts framing a centered phone */}
          <div className="relative grid lg:grid-cols-[1fr_320px_1fr] items-center gap-12 lg:gap-0 min-h-[560px]">

            {/* Left column, Fairway Points + Tee time exchange */}
            <div className="flex flex-col gap-14 lg:pr-10">
              <CalloutRight num="07" eyebrow="Fairway Points" headline={<>Play a season, <em className="italic text-[#E0A800]">earn a free round</em></>}>
                5,000 points redeem for a complimentary round. About every 71 rounds on Fairway, 48 as Eagle (1.5×), 36 as Ace (2×). Points never expire.
              </CalloutRight>
              <CalloutRight num="09" eyebrow="Tee time exchange" headline={<>List a round, <em className="italic text-[#E0A800]">earn the credit back</em></>}>
                Can&apos;t make it? Trade your tee time on the member exchange. No Venmo, no group texts.
              </CalloutRight>
            </div>

            {/* Center, phone */}
            <div className="relative flex justify-center items-center">
              <svg viewBox="0 0 500 500" className="absolute inset-0 m-auto w-full max-w-[500px] opacity-[0.08]" aria-hidden>
                <circle cx="250" cy="250" r="240" fill="none" stroke="#0F3D2E" strokeWidth="1" strokeDasharray="2 6" />
                <circle cx="250" cy="250" r="200" fill="none" stroke="#0F3D2E" strokeWidth="1" />
              </svg>
              <div className="relative z-10 rounded-[28px] p-1.5 bg-[#1A1A1A] shadow-[0_40px_80px_rgba(8,36,25,0.25)]">
                <div className="w-[240px] h-[494px] rounded-[22px] overflow-hidden bg-[#082419]">
                  <Image
                    src="/screenshots/member-home.png"
                    alt="TeeAhead member home"
                    width={240}
                    height={494}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>
            </div>

            {/* Right column, Book at zero fees + Find a partner */}
            <div className="flex flex-col gap-14 lg:pl-10">
              <CalloutLeft num="08" eyebrow="Book at zero fees" headline={<>Eagle and Ace pay <em className="italic text-[#E0A800]">$0 in fees</em></>}>
                Every round, every course. No &ldquo;$2.49 service fee&rdquo; surprises at checkout.
              </CalloutLeft>
              <CalloutLeft num="10" eyebrow="Find a partner" headline={<>Browse the next <em className="italic text-[#E0A800]">14 days</em></>}>
                See who else is playing this weekend. Match by course, tee time, handicap. Eagle + Ace only.
              </CalloutLeft>
            </div>

          </div>

          {/* In-round service, wide footer strip */}
          <div className="bg-[#0F3D2E]/[0.06] rounded-2xl px-7 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <span className="font-display text-[#0F3D2E] tracking-[-0.025em] leading-none" style={{ fontSize: 44, fontWeight: 400 }}>&lt;1s</span>
              <div>
                <p className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-[#E0A800] font-bold">11 · In-round service</p>
                <p className="font-display text-[22px] text-[#0F3D2E] mt-0.5" style={{ fontWeight: 400 }}>One tap from the 6th tee to the pro shop.</p>
              </div>
            </div>
            <p className="text-[13px] text-[#1A1A1A]/72 leading-relaxed max-w-sm">
              Beverage, cart, pace-of-play: your staff sees it instantly. No waving down the cart lady.
            </p>
          </div>

        </div>
      </FadeIn>
    </section>
  )
}

/* Right-aligned callout (sits in the left column, line points right toward the phone) */
function CalloutRight({ num, eyebrow, headline, children }: { num: string; eyebrow: string; headline: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative lg:text-right">
      <p className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-[#E0A800] font-bold mb-1.5">
        {num} · {eyebrow}
      </p>
      <p className="font-display text-[22px] sm:text-[26px] text-[#0F3D2E] tracking-[-0.015em] leading-[1.1] mb-1.5" style={{ fontWeight: 400 }}>
        {headline}
      </p>
      <p className="text-[13px] text-[#1A1A1A]/72 leading-relaxed lg:ml-auto max-w-[280px]">
        {children}
      </p>
      <span className="hidden lg:block absolute right-[-40px] top-6 w-[38px] h-px bg-[#E0A800]" aria-hidden />
      <span className="hidden lg:block absolute right-[-42px] top-[22px] w-[5px] h-[5px] rounded-full bg-[#E0A800]" aria-hidden />
    </div>
  )
}

/* Left-aligned callout (sits in the right column, line points left toward the phone) */
function CalloutLeft({ num, eyebrow, headline, children }: { num: string; eyebrow: string; headline: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative">
      <p className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-[#E0A800] font-bold mb-1.5">
        {num} · {eyebrow}
      </p>
      <p className="font-display text-[22px] sm:text-[26px] text-[#0F3D2E] tracking-[-0.015em] leading-[1.1] mb-1.5" style={{ fontWeight: 400 }}>
        {headline}
      </p>
      <p className="text-[13px] text-[#1A1A1A]/72 leading-relaxed max-w-[280px]">
        {children}
      </p>
      <span className="hidden lg:block absolute left-[-40px] top-6 w-[38px] h-px bg-[#E0A800]" aria-hidden />
      <span className="hidden lg:block absolute left-[-42px] top-[22px] w-[5px] h-[5px] rounded-full bg-[#E0A800]" aria-hidden />
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
    items: ['Find a partner', 'Tee time exchange', 'Self-grouped tee times', 'Mid-round service requests', '14-day partner visibility', 'Round ratings'],
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

                  {/* Features, 2 columns */}
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
            Everything above is included for Founding Partner courses for their first year, and for every TeeAhead golfer on every tier.
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
            Founding Partner program is open. First year is free.
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

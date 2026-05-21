import type { Metadata } from 'next'
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

          {/* Product peek — placeholder collage until real screenshots drop in /public/screenshots/ */}
          <div className="hidden lg:block relative h-[460px]">
            {/* TODO Claude Code: replace with <Image src="/screenshots/dashboard.png" /> when ready */}
            <div className="absolute top-0 right-0 w-[400px] h-[260px] bg-white rounded-xl shadow-[0_18px_40px_rgba(0,0,0,0.18)] border border-black/8 overflow-hidden rotate-[2deg]">
              <div className="bg-[#082419] px-5 py-3 text-[#F4F1EA] font-mono text-[10px] tracking-[0.14em]">COURSE · DASHBOARD</div>
              <div className="p-4 space-y-2.5">
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { l: "Today's revenue", v: '$1,840' },
                    { l: 'This week', v: '$12.4K' },
                  ].map(({ l, v }) => (
                    <div key={l} className="bg-[#FAF7F2] rounded p-2.5">
                      <p className="font-mono text-[8px] tracking-[0.12em] uppercase text-[#6B7770] font-semibold">{l}</p>
                      <p className="font-display text-2xl text-[#0F3D2E] tracking-[-0.02em] mt-0.5" style={{ fontWeight: 400 }}>{v}</p>
                    </div>
                  ))}
                </div>
                <div className="h-[110px] bg-[#FAF7F2] rounded flex items-end gap-[2px] p-2">
                  {[42,48,52,45,51,58,63,60,64,70,68,72,78,74,81,88,85,90,86,93].map((h, i) => (
                    <div key={i} className="flex-1 bg-[#0F3D2E]/40 rounded-t" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
            {/* TODO Claude Code: replace with <Image src="/screenshots/member-home.png" /> when ready */}
            <div className="absolute bottom-0 left-0 w-[200px] h-[400px] bg-[#082419] rounded-[26px] shadow-[0_20px_40px_rgba(0,0,0,0.25)] border-[5px] border-[#1A1A1A] rotate-[-3deg] overflow-hidden">
              <div className="px-4 pt-5 pb-3 text-[#F4F1EA]">
                <p className="font-mono text-[8px] tracking-[0.14em] uppercase text-[#E0A800] font-semibold">Fairway points</p>
                <p className="font-display text-5xl leading-[0.9] mt-1 tracking-[-0.025em]" style={{ fontWeight: 400 }}>2,140</p>
                <p className="font-mono text-[9px] text-[#E0A800] mt-1.5">+45 LAST ROUND</p>
              </div>
              <div className="mx-3 mt-3 rounded-lg bg-white/[0.06] p-3">
                <p className="text-[10px] text-[#F4F1EA]/55">Next round</p>
                <p className="text-[11px] font-semibold text-[#F4F1EA] mt-1 leading-tight">Plum Hollow<br/>Sat 9:40 AM</p>
              </div>
              <div className="mx-3 mt-3 space-y-1.5">
                {['Detroit GC', 'Rouge Park', 'Maple Lane'].map((c, i) => (
                  <div key={c} className="flex justify-between items-center text-[10px] text-[#F4F1EA]/85 border-b border-white/10 py-1.5">
                    <span className="truncate">{c}</span>
                    <span className="font-mono text-[#E0A800]">+{[35, 28, 42][i]}</span>
                  </div>
                ))}
              </div>
            </div>
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
            {/* TODO Claude Code: replace placeholder with /screenshots/dashboard.png */}
            <div className="aspect-[3/2] bg-white rounded-xl shadow-[0_18px_40px_rgba(0,0,0,0.18)] border border-white/10 overflow-hidden">
              <div className="bg-[#0F3D2E] px-5 py-3 text-[#F4F1EA] font-mono text-[10px] tracking-[0.14em] flex justify-between">
                <span>GOOD MORNING, NEIL.</span>
                <span className="text-[#E0A800]">LIVE · SAT</span>
              </div>
              <div className="p-5 grid grid-cols-4 gap-3">
                {[
                  { l: 'Revenue', v: '$1,840' },
                  { l: 'Week', v: '$12.4K' },
                  { l: 'Util', v: '88%' },
                  { l: 'Members', v: '142' },
                ].map(({ l, v }) => (
                  <div key={l}>
                    <p className="font-mono text-[8.5px] tracking-[0.12em] uppercase text-[#6B7770] font-semibold">{l}</p>
                    <p className="font-display text-2xl text-[#0F3D2E] mt-0.5 tracking-[-0.02em]" style={{ fontWeight: 400 }}>{v}</p>
                  </div>
                ))}
              </div>
              <div className="px-5">
                <div className="h-[100px] bg-[#FAF7F2] rounded flex items-end gap-[2px] p-1.5">
                  {[42,48,52,45,51,58,63,60,64,70,68,72,78,74,81,88,85,90,86,93,96,92,100,105,102,109,113,110,118,124].map((h, i) => (
                    <div key={i} className="flex-1 bg-[#0F3D2E]/40 rounded-t" style={{ height: `${h * 0.7}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3 secondary cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            <SecondaryFeatureCard num="02" title="Tee sheet" desc="Every slot earns. No barter, ever." />
            <SecondaryFeatureCard num="03" title="Members table" desc="Your data, exported anytime." />
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

function SecondaryFeatureCard({ num, title, desc, badge }: {
  num: string; title: string; desc: string; badge?: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
      {badge ? (
        <div className="h-32 flex items-center justify-center bg-white/[0.04] rounded-md font-mono text-[10px] tracking-[0.14em] text-[#E0A800] text-center px-3">
          {badge}
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
            {/* TODO Claude Code: phone-frame mock with /screenshots/points.png */}
            <div className="justify-self-center w-[210px] h-[420px] bg-[#082419] rounded-[28px] border-[5px] border-[#1A1A1A] shadow-[0_20px_40px_rgba(0,0,0,0.25)] overflow-hidden">
              <div className="px-5 pt-6 pb-5 text-[#F4F1EA]">
                <p className="font-mono text-[8.5px] tracking-[0.14em] uppercase text-[#E0A800] font-semibold">Fairway points</p>
                <p className="font-display text-[56px] leading-[0.88] tracking-[-0.025em] mt-1.5" style={{ fontWeight: 400 }}>2,140</p>
                <p className="font-mono text-[9px] tracking-[0.05em] text-[#E0A800] mt-2">+45 LAST ROUND</p>
                <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#E0A800] w-[68%]" />
                </div>
              </div>
              <div className="mx-4 space-y-2">
                {[
                  { c: 'Plum Hollow', d: 'Sat May 17', p: '+45' },
                  { c: 'Detroit GC', d: 'May 10', p: '+38' },
                  { c: 'Rouge Park', d: 'May 3', p: '+32' },
                ].map(({ c, d, p }) => (
                  <div key={c} className="flex justify-between items-center text-[10px] border-b border-white/10 py-1.5">
                    <div>
                      <p className="text-[#F4F1EA]">{c}</p>
                      <p className="text-[#F4F1EA]/55 text-[8.5px] mt-0.5">{d}</p>
                    </div>
                    <span className="font-mono text-[#E0A800] font-semibold">{p}</span>
                  </div>
                ))}
              </div>
            </div>
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
        // TODO Claude Code: replace placeholder with /screenshots/book.png when the real member-book screenshot lands
        <div className="h-36 flex items-center justify-center bg-[#0F3D2E]/[0.06] rounded-md overflow-hidden">
          <div className="w-[78px] h-[132px] bg-[#082419] rounded-[14px] border-[3px] border-[#1A1A1A] shadow-[0_8px_18px_rgba(0,0,0,0.18)] flex flex-col">
            <div className="px-2 pt-2 text-[#F4F1EA]">
              <p className="font-mono text-[6px] tracking-[0.14em] uppercase text-[#E0A800] font-semibold">Sat 9:40</p>
              <p className="font-display text-[14px] leading-none mt-0.5 tracking-[-0.02em]" style={{ fontWeight: 400 }}>$42</p>
              <p className="font-mono text-[6px] tracking-[0.06em] text-[#E0A800] mt-1">NO FEES · EAGLE</p>
            </div>
            <div className="mx-1.5 mt-1 space-y-0.5">
              {['10:00', '10:10', '10:20'].map((t, i) => (
                <div key={t} className={`flex justify-between items-center text-[5.5px] py-0.5 border-b border-white/10 px-1 rounded-sm ${i === 0 ? 'bg-white/10 text-[#F4F1EA]' : 'text-[#F4F1EA]/55'}`}>
                  <span>{t}</span>
                  <span className="font-mono">{['$42', '$48', '$54'][i]}</span>
                </div>
              ))}
            </div>
          </div>
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
  { c: 'Bookings & Tee Sheet', items: ['Real-time booking', 'Day-grid view', 'QR check-in', 'Buffer + cart logic', 'Walk-in entry', 'Multi-cart booking'] },
  { c: 'Members & Loyalty', items: ['Fairway Points (no expiry)', '1.5× / 2× tier multipliers', 'Birthday credit', 'Guest passes', 'Bonus signup points', 'Tier upgrades'] },
  { c: 'Payments', items: ['Stripe Connect direct payout', 'No commissions', 'Zero booking fees on Eagle+', 'Subscription billing', 'P&L reports', 'GL export'] },
  { c: 'Operator Tools', items: ['Revenue + utilization', 'Top-member list', 'Winback nudges', 'CSV export', 'Bulk SMS waitlist', 'Custom rack rates'] },
  { c: 'Player Experience', items: ['Find a partner', 'Tee time exchange', 'Mid-round service requests', 'Live wait times', '14-day partner visibility', 'Round ratings'] },
  { c: 'Leagues & Outings', items: ['9 + 18-hole leagues', 'Live standings', 'Outing manager', 'League payments', 'Handicap tracking', 'Group bookings'] },
]

function AllFeaturesGrid() {
  return (
    <section className="bg-[#F4F1EA] px-6 sm:px-10 lg:px-16 py-20">
      <FadeIn>
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xs tracking-[0.18em] uppercase text-[#E0A800] font-semibold">
              The full surface · 36 features
            </span>
            <span className="flex-1 h-px bg-[#0F3D2E]/10" />
          </div>
          <h2 className="font-display text-[#0F3D2E] tracking-[-0.025em] leading-none max-w-3xl" style={{ fontSize: 'clamp(36px, 5vw, 52px)', fontWeight: 400 }}>
            Everything else, in <em className="italic text-[#E0A800]">one place.</em>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURE_CATS.map(({ c, items }) => (
              <div key={c} className="bg-white border border-[#0F3D2E]/10 rounded-xl p-5">
                <p className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-[#E0A800] font-bold mb-3">{c}</p>
                <ul className="flex flex-col gap-2">
                  {items.map(i => (
                    <li key={i} className="grid grid-cols-[14px_1fr] gap-2 text-[13px] text-[#1A1A1A]/85 items-baseline">
                      <span className="font-mono text-[11px] text-[#0F3D2E]">—</span>
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
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

'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'

function useRevealAndCount() {
  useEffect(() => {
    const revealEls = document.querySelectorAll('[data-reveal]')
    const revealIO = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed')
          revealIO.unobserve(e.target)
        }
      }),
      { threshold: 0.15 }
    )
    revealEls.forEach(el => revealIO.observe(el))

    const countEls = document.querySelectorAll<HTMLElement>('[data-countup]')
    const countIO = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (!e.isIntersecting) return
        const el = e.target as HTMLElement
        const target = parseInt(el.dataset.target ?? '0')
        if (target === 0) return
        const duration = 1400
        const start = performance.now()
        function tick(now: number) {
          const p = Math.min((now - start) / duration, 1)
          const eased = 1 - Math.pow(1 - p, 3)
          el.textContent = String(Math.round(eased * target))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
        countIO.unobserve(e.target)
      }),
      { threshold: 0.5 }
    )
    countEls.forEach(el => countIO.observe(el))

    return () => { revealIO.disconnect(); countIO.disconnect() }
  }, [])
}

type StatParts = { prefix: string; numeric: number; suffix: string; countable: boolean }

function parseStat(stat: string): StatParts {
  if (stat === '<1s') return { prefix: '<', numeric: 1, suffix: 's', countable: false }
  const m = stat.match(/^(\$?)(\d+)(%|×)?$/)
  if (!m) return { prefix: '', numeric: 0, suffix: stat, countable: false }
  const n = parseInt(m[2])
  return { prefix: m[1] ?? '', numeric: n, suffix: m[3] ?? '', countable: n > 5 }
}

function StatCard({ stat, statLabel, dark, flip }: { stat: string; statLabel: string; dark: boolean; flip?: boolean }) {
  const { prefix, numeric, suffix, countable } = parseStat(stat)
  return (
    <div data-reveal data-delay="2" className={`flex items-center justify-center ${flip ? 'md:justify-start md:order-1' : 'md:justify-end'}`}>
      <div className={`rounded-3xl p-10 text-center space-y-2 min-w-[160px] ${
        dark ? 'bg-white/5 border border-white/8' : 'bg-white border border-black/8 shadow-sm'
      }`}>
        <p className={`font-display font-black tracking-tight leading-none text-6xl sm:text-7xl ${dark ? 'text-[#E0A800]' : 'text-[#0F3D2E]'}`}>
          {prefix}
          {countable
            ? <span data-countup data-target={String(numeric)}>0</span>
            : numeric
          }
          {suffix}
        </p>
        <p className={`text-sm font-medium ${dark ? 'text-[#F4F1EA]/50' : 'text-[#1A1A1A]/50'}`}>
          {statLabel}
        </p>
      </div>
    </div>
  )
}

function Pills({ tags, dark }: { tags: string[]; dark: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t, i) => (
        <span
          key={t}
          data-reveal
          data-delay={String(Math.min(i + 3, 5))}
          className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
            dark
              ? 'text-[#E0A800] bg-[#E0A800]/10 border-[#E0A800]/20'
              : 'text-[#0F3D2E] bg-[#0F3D2E]/8 border-[#0F3D2E]/12'
          }`}
        >
          {t}
        </span>
      ))}
    </div>
  )
}

function GolferPills({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t, i) => (
        <span
          key={t}
          data-reveal
          data-delay={String(Math.min(i + 3, 5))}
          className="text-xs font-medium text-[#E0A800] bg-[#E0A800]/10 px-3 py-1.5 rounded-full border border-[#E0A800]/20"
        >
          {t}
        </span>
      ))}
    </div>
  )
}

const courseFeatures = [
  {
    number: '01', label: 'Sign up',
    headline: 'Zero cost.\nZero commitment.',
    sub: 'Founding Partner courses get TeeAhead free for their first year. No barter. No commission. No contract.',
    stat: '$0', statLabel: 'for your first year',
    tags: ['Free Year 1', '$349/mo after', 'No barter, ever'],
    dark: true,
  },
  {
    number: '02', label: 'Go live',
    headline: 'Real-time booking.\nQR check-in.',
    sub: 'Members book directly through TeeAhead. Staff scan a QR code at the first tee. Every round logs automatically.',
    stat: '100%', statLabel: 'of rounds logged automatically',
    tags: ['Tee Sheet', 'QR Check-In', 'Member Mgmt'],
    dark: false,
  },
  {
    number: '03', label: 'Get paid',
    headline: 'Stripe Connect.\nDirect to your bank.',
    sub: 'Greens fees land in your own Stripe account. TeeAhead never touches your revenue — it goes straight to you.',
    stat: '0%', statLabel: 'TeeAhead cut of your revenue',
    tags: ['Stripe Payments', 'Revenue Reports', 'GL Export'],
    dark: true,
  },
  {
    number: '04', label: 'Keep golfers',
    headline: 'Leagues. Points.\nThe exchange.',
    sub: "Run 9 and 18-hole leagues with live standings. Golfers earn points every round. Can't make it? They trade the tee time — zero staff involvement.",
    stat: '$0', statLabel: 'to add leagues, points & exchange',
    tags: ['Leagues', 'Fairway Points', 'Tee Time Exchange'],
    dark: false,
  },
  {
    number: '05', label: 'Improve the round',
    headline: 'Mid-round requests.\nOne tap to respond.',
    sub: 'Golfers tap "Need something?" out on the course. Your pro shop sees it instantly. Beverages, cart issues, pace — handled.',
    stat: '<1s', statLabel: 'to reach the pro shop',
    tags: ['Service Requests', 'Push Notifications'],
    dark: true,
  },
  {
    number: '06', label: 'Earn more',
    headline: 'Rev share.\nReferral payouts.',
    sub: 'TeeAhead shares platform revenue with partner courses. Refer a golfer — earn 10% of their membership for 12 months, auto-paid via Stripe.',
    stat: '10%', statLabel: 'referral rev share, 12 months',
    tags: ['Rev Share', 'Referral Tracking', 'Stripe Payouts'],
    dark: false,
  },
]

const golferFeatures = [
  {
    number: '07', label: 'Join free',
    headline: 'Fairway tier.\n$0 to start.',
    sub: 'Sign up, pick your home course, and start booking immediately. No signup fee. Upgrade when the math makes sense.',
    stat: '$0', statLabel: 'to get started',
    tags: ['Free to join', 'No signup fee'],
    alt: false,
  },
  {
    number: '08', label: 'Upgrade to Eagle',
    headline: 'Eagle tier.\n$89 a year.',
    sub: 'Zero booking fees on every round. 1.5× Fairway Points per dollar spent. Priority booking opens 48 hours before the public. Plus guest passes and birthday credit.',
    stat: '$89', statLabel: 'per year',
    tags: ['Zero booking fees', '1.5× points', '48-hr priority booking', 'Guest passes'],
    alt: true,
  },
  {
    number: '09', label: 'Go all in with Ace',
    headline: 'Ace tier.\n$159 a year.',
    sub: 'Double your points. 72-hour priority booking window — the best tee times before anyone else sees them. 500 bonus points on signup alone.',
    stat: '$159', statLabel: 'per year',
    tags: ['2× points', '72-hr priority booking', '500 bonus pts on signup', 'Guest passes'],
    alt: false,
  },
  {
    number: '10', label: "Can't make it",
    headline: 'List it.\nEarn credit automatically.',
    sub: "Trade your booked tee time on the member exchange. Someone claims it — you earn TeeAhead credit. No Venmo, no group texts.",
    stat: '$0', statLabel: 'lost when plans change',
    tags: ['Tee Time Exchange', 'Auto credit'],
    alt: true,
  },
]

export default function Features() {
  useRevealAndCount()

  return (
    <div className="min-h-screen bg-[#FAF7F2] overflow-x-hidden">
      <style>{`
        [data-reveal] {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1);
        }
        [data-reveal].revealed { opacity: 1; transform: none; }
        [data-reveal][data-delay="1"] { transition-delay: 0.1s; }
        [data-reveal][data-delay="2"] { transition-delay: 0.2s; }
        [data-reveal][data-delay="3"] { transition-delay: 0.35s; }
        [data-reveal][data-delay="4"] { transition-delay: 0.48s; }
        [data-reveal][data-delay="5"] { transition-delay: 0.61s; }
      `}</style>

      {/* Nav */}
      <header className="sticky top-0 z-50 bg-[#0F3D2E]/97 backdrop-blur border-b border-white/8">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/"><TeeAheadLogo className="h-14 w-auto brightness-0 invert" /></Link>
          <div className="flex items-center gap-3">
            <Link href="/waitlist/course" className="hidden sm:inline-flex items-center rounded-lg border border-[#E0A800] px-4 py-2 text-sm font-semibold text-[#E0A800] hover:bg-[#E0A800]/10 transition-colors">I Run a Course</Link>
            <Link href="/waitlist/golfer" className="inline-flex items-center rounded-lg bg-[#E0A800] px-4 py-2 text-sm font-semibold text-[#0a0a0a] hover:bg-[#E0A800]/90 transition-colors">I&apos;m a Golfer →</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-[#071f17] min-h-[90vh] flex flex-col items-center justify-center px-6 py-32 text-center overflow-hidden">
<div className="relative z-10 max-w-4xl mx-auto space-y-8">
          <div data-reveal className="inline-flex items-center gap-2 bg-[#E0A800]/15 border border-[#E0A800]/30 rounded-full px-4 py-1.5">
            <span className="size-2 rounded-full bg-[#E0A800] animate-pulse" />
            <span className="text-sm font-semibold text-[#E0A800] tracking-wide uppercase">Everything TeeAhead includes</span>
          </div>
          <h1 data-reveal data-delay="1" className="text-5xl sm:text-7xl font-black text-[#F4F1EA] leading-[1.02] tracking-tight">
            Built for courses.<br />
            <span className="text-[#E0A800]">Loved by golfers.</span>
          </h1>
          <p data-reveal data-delay="2" className="text-xl text-[#F4F1EA]/60 max-w-xl mx-auto leading-relaxed">
            One platform. No barter. No commissions. Free for your first year.
          </p>
          <div data-reveal data-delay="3" className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a href="#for-courses" className="text-sm font-semibold text-[#F4F1EA]/60 hover:text-[#F4F1EA] transition-colors">For Golf Courses ↓</a>
            <span className="hidden sm:block text-[#F4F1EA]/20">·</span>
            <a href="#for-golfers" className="text-sm font-semibold text-[#F4F1EA]/60 hover:text-[#F4F1EA] transition-colors">For Golfers ↓</a>
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <span className="text-xs text-[#F4F1EA] uppercase tracking-widest">Scroll</span>
          <div className="w-px h-8 bg-[#F4F1EA]/40 animate-pulse" />
        </div>
      </section>

      {/* Course features */}
      <div id="for-courses">
        {courseFeatures.map((f, i) => {
          const flip = i % 2 !== 0
          return (
          <section key={f.number} className={`px-6 py-28 sm:py-36 ${f.dark ? 'bg-[#0F3D2E]' : 'bg-[#FAF7F2]'}`}>
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
              <div className={`space-y-6${flip ? ' md:order-2' : ''}`}>
                <div data-reveal className="flex items-center gap-3">
                  <span className={`text-xs font-bold tracking-[0.2em] uppercase ${f.dark ? 'text-[#E0A800]' : 'text-[#0F3D2E]/50'}`}>{f.number}</span>
                  <span className={`h-px w-8 ${f.dark ? 'bg-[#E0A800]/40' : 'bg-black/15'}`} />
                  <span className={`text-xs font-semibold uppercase tracking-widest ${f.dark ? 'text-[#F4F1EA]/40' : 'text-[#1A1A1A]/40'}`}>{f.label}</span>
                </div>
                <h2 data-reveal data-delay="1" className={`text-4xl sm:text-5xl font-black leading-[1.05] tracking-tight whitespace-pre-line ${f.dark ? 'text-[#F4F1EA]' : 'text-[#1A1A1A]'}`}>
                  {f.headline}
                </h2>
                <p data-reveal data-delay="2" className={`text-lg leading-relaxed max-w-sm ${f.dark ? 'text-[#F4F1EA]/60' : 'text-[#1A1A1A]/60'}`}>
                  {f.sub}
                </p>
                <Pills tags={f.tags} dark={f.dark} />
              </div>
              <StatCard stat={f.stat} statLabel={f.statLabel} dark={f.dark} flip={flip} />
            </div>
          </section>
          )
        })}
      </div>

      {/* Course CTA */}
      <section className="bg-white px-6 py-24 text-center">
        <div data-reveal className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black text-[#1A1A1A] leading-tight">Ready to drop GolfNow?</h2>
          <p className="text-lg text-[#1A1A1A]/55">Founding Partner spots are limited. First year is free.</p>
          <Link href="/waitlist/course" className="inline-flex items-center justify-center rounded-xl bg-[#0F3D2E] px-8 py-4 text-base font-semibold text-[#F4F1EA] hover:opacity-90 transition-opacity">
            Claim a Founding Partner Spot →
          </Link>
        </div>
      </section>

      {/* Golfer features */}
      <div id="for-golfers" className="bg-[#071f17]">
        <section className="px-6 py-24 text-center">
          <div data-reveal className="max-w-3xl mx-auto space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#E0A800]">For golfers</p>
            <h2 className="text-4xl sm:text-6xl font-black text-[#F4F1EA] leading-tight tracking-tight">
              A membership that<br /><span className="text-[#E0A800]">pays for itself.</span>
            </h2>
          </div>
        </section>

        {golferFeatures.map((f) => (
          <section key={f.number} className={`px-6 py-28 ${f.alt ? 'bg-[#071f17]' : 'bg-[#0F3D2E]'}`}>
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
              <div className={`space-y-6${f.alt ? ' md:order-2' : ''}`}>
                <div data-reveal className="flex items-center gap-3">
                  <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#E0A800]">{f.number}</span>
                  <span className="h-px w-8 bg-[#E0A800]/40" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#F4F1EA]/40">{f.label}</span>
                </div>
                <h3 data-reveal data-delay="1" className="text-4xl sm:text-5xl font-black text-[#F4F1EA] leading-[1.05] tracking-tight whitespace-pre-line">
                  {f.headline}
                </h3>
                <p data-reveal data-delay="2" className="text-lg text-[#F4F1EA]/60 leading-relaxed max-w-sm">{f.sub}</p>
                <GolferPills tags={f.tags} />
              </div>
              <div data-reveal data-delay="2" className={`flex items-center justify-center ${f.alt ? 'md:justify-start md:order-1' : 'md:justify-end'}`}>
                <div className="rounded-3xl p-10 text-center space-y-2 min-w-[160px] bg-white/5 border border-white/8">
                  {(() => {
                    const { prefix, numeric, suffix, countable } = parseStat(f.stat)
                    return (
                      <p className="font-display font-black tracking-tight leading-none text-6xl sm:text-7xl text-[#E0A800]">
                        {prefix}
                        {countable ? <span data-countup data-target={String(numeric)}>0</span> : numeric}
                        {suffix}
                      </p>
                    )
                  })()}
                  <p className="text-sm font-medium text-[#F4F1EA]/50">{f.statLabel}</p>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Final CTA */}
      <section className="bg-[#0F3D2E] px-6 py-28 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <div data-reveal className="space-y-4">
            <h2 className="text-4xl sm:text-5xl font-black text-[#F4F1EA] leading-tight tracking-tight">Pick your path.</h2>
            <p className="text-lg text-[#F4F1EA]/55">Courses go live free. Golfers start on Fairway for $0.</p>
          </div>
          <div data-reveal data-delay="1" className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/waitlist/course" className="inline-flex items-center justify-center rounded-xl border-2 border-[#F4F1EA]/25 px-8 py-4 text-base font-semibold text-[#F4F1EA] hover:border-[#F4F1EA]/50 transition-colors">
              I Run a Course
            </Link>
            <Link href="/waitlist/golfer" className="inline-flex items-center justify-center rounded-xl bg-[#E0A800] px-8 py-4 text-base font-semibold text-[#0a0a0a] hover:bg-[#E0A800]/90 transition-colors">
              I&apos;m a Golfer →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

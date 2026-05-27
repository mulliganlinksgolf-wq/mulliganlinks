// Legal note: All competitor references are based on publicly available data
// and documented industry sources. See inline citations for attribution.
// Last legal review: April 2026. Review again before major marketing campaigns.
'use client'

import { useState, useEffect, ReactNode } from 'react'
import Link from 'next/link'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'

interface BarterPageProps {
  spotsRemaining: number
  content?: Record<string, string>
}

export function BarterPage({ spotsRemaining, content = {} }: BarterPageProps) {
  const [greenFee, setGreenFee] = useState(85)
  const [operatingDays, setOperatingDays] = useState(280)
  const [barterTeeTimes, setBarterTeeTimes] = useState(2)
  const [presetKey, setPresetKey] = useState<'municipal' | 'dailyfee' | 'semiprivate' | 'custom'>('dailyfee')

  const presets = {
    municipal:   { label: 'Municipal · $45',      greenFee: 45,  days: 280 },
    dailyfee:    { label: 'Daily fee · $85',       greenFee: 85,  days: 280 },
    semiprivate: { label: 'Semi-private · $120',   greenFee: 120, days: 260 },
    custom:      { label: 'My own numbers',        greenFee: greenFee, days: operatingDays },
  } as const

  const handlePreset = (key: typeof presetKey) => {
    setPresetKey(key)
    if (key !== 'custom') {
      setGreenFee(presets[key].greenFee)
      setOperatingDays(presets[key].days)
    }
  }

  const annualBarterCost = greenFee * operatingDays * barterTeeTimes
  const [displayedCost, setDisplayedCost] = useState(annualBarterCost)

  useEffect(() => {
    const start = displayedCost
    const end = annualBarterCost
    const duration = 600
    const startTime = performance.now()
    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayedCost(Math.round(start + (end - start) * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annualBarterCost])

  const allClaimed = spotsRemaining <= 0
  const fiveYearCost = annualBarterCost * 5
  const rounds = Math.round(annualBarterCost / greenFee)
  const staff = Math.max(1, Math.round(annualBarterCost / 50000))

  return (
    <div className="min-h-screen bg-[#082419] text-[#F4F1EA] flex flex-col">

      {/* Nav */}
      <header className="border-b border-[#F4F1EA]/8 px-6 py-4 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/"><TeeAheadLogo className="h-10 w-auto brightness-0 invert" /></Link>
          <Link
            href="/waitlist/course"
            className="px-4 py-2 rounded-md bg-[#E0A800] text-[#082419] text-sm font-bold hover:bg-[#E0A800]/90"
          >
            Claim a spot →
          </Link>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero IS the calculator ─────────────────────────────── */}
        <section className="px-6 sm:px-10 lg:px-16 py-14 sm:py-20">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-14 items-center">

            {/* Left: the number */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-7 h-px bg-[#E0A800]" />
                <span className="font-mono text-xs tracking-[0.16em] uppercase text-[#E0A800] font-semibold">
                  {content['barter.hero_badge'] ?? 'Barter calculator'}
                </span>
              </div>
              <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-[#F4F1EA]/50 mb-2">
                GolfNow&apos;s barter model cost you
              </p>
              <p
                className="font-display leading-[0.88] tracking-[-0.04em]"
                style={{ fontSize: 'clamp(80px, 14vw, 168px)', fontWeight: 400 }}
              >
                ${displayedCost.toLocaleString()}<span className="text-[#E0A800]">.</span>
              </p>
              <p className="mt-4 text-base sm:text-lg text-[#F4F1EA]/78 leading-relaxed max-w-md">
                <strong className="text-[#F4F1EA]">This year alone.</strong> Adjust the sliders — the number updates as you drag.
              </p>

              {/* Equivalents — editorial, no emoji */}
              <div className="mt-7 pt-5 border-t border-[#F4F1EA]/10">
                <p className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-[#E0A800] font-bold mb-3">
                  What that money looks like
                </p>
                <ul className="flex flex-col gap-1.5">
                  {[
                    { primary: `$${fiveYearCost.toLocaleString()}`, label: 'over five years, compounded' },
                    { primary: `${rounds.toLocaleString()}`, label: `rounds of revenue per year, at $${greenFee}/round` },
                    { primary: `${staff}×`, label: `full-time staff at $50K/yr` },
                  ].map((row) => (
                    <li key={row.label} className="grid grid-cols-[minmax(96px,auto)_1fr] gap-3.5 items-baseline py-1">
                      <span
                        className="font-display text-[#E0A800] text-right tracking-[-0.02em] leading-none"
                        style={{ fontSize: 26, fontWeight: 400 }}
                      >
                        {row.primary}
                      </span>
                      <span className="text-[15px] text-[#F4F1EA]">{row.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right: sliders */}
            <div className="bg-[#F4F1EA]/[0.04] border border-[#F4F1EA]/10 rounded-2xl p-6 sm:p-7 flex flex-col gap-5">
              <p className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-[#F4F1EA]/60 font-semibold">
                Adjust to match your course
              </p>

              {/* Preset chips */}
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(presets) as Array<keyof typeof presets>).map((key) => {
                  const active = presetKey === key
                  return (
                    <button
                      key={key}
                      onClick={() => handlePreset(key)}
                      className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
                        active
                          ? 'bg-[#E0A800]/15 border border-[#E0A800]/40 text-[#E0A800]'
                          : 'bg-[#F4F1EA]/[0.04] border border-[#F4F1EA]/10 text-[#F4F1EA]/65 hover:text-[#F4F1EA]'
                      }`}
                    >
                      {presets[key].label}
                    </button>
                  )
                })}
              </div>

              <Slider label="Average green fee at peak" value={`$${greenFee}`} range="$20 – $200">
                <input
                  type="range" min={20} max={200} step={5} value={greenFee}
                  onChange={(e) => { setGreenFee(Number(e.target.value)); setPresetKey('custom') }}
                  className="w-full h-1.5 rounded-full cursor-pointer"
                  style={{ accentColor: '#E0A800' }}
                />
              </Slider>

              <Slider label="Days open per year" value={String(operatingDays)} range="100 – 360">
                <input
                  type="range" min={100} max={360} step={10} value={operatingDays}
                  onChange={(e) => { setOperatingDays(Number(e.target.value)); setPresetKey('custom') }}
                  className="w-full h-1.5 rounded-full cursor-pointer"
                  style={{ accentColor: '#E0A800' }}
                />
              </Slider>

              <Slider label="Barter tee times per day" value={String(barterTeeTimes)} range="1 – 4 · GolfNow typically takes 2">
                <input
                  type="range" min={1} max={4} step={1} value={barterTeeTimes}
                  onChange={(e) => setBarterTeeTimes(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full cursor-pointer"
                  style={{ accentColor: '#E0A800' }}
                />
              </Slider>

              <Link
                href="/waitlist/course"
                className="mt-1 rounded-md bg-[#E0A800] py-3.5 text-sm font-bold text-[#082419] hover:bg-[#E0A800]/90 text-center"
              >
                Claim a founding spot — save ${displayedCost.toLocaleString()}/yr →
              </Link>

              <p className="text-[11px] text-[#F4F1EA]/40 text-center font-mono tracking-[0.06em] leading-relaxed">
                Calculation based on GolfNow barter rates and your inputs above.
                Source · NGCOA member survey data and Golf Inc. industry analysis (2024).
                Actual barter arrangements vary by course agreement.
              </p>
            </div>

          </div>
        </section>

        {/* ── Proof — cream ─────────────────────────────────────── */}
        <section className="px-6 sm:px-10 lg:px-16 py-16 bg-[#FAF7F2] text-[#1A1A1A]">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-baseline gap-3 mb-10">
              <span className="font-mono text-xs tracking-[0.18em] uppercase text-[#E0A800] font-semibold">
                {content['barter.stats_eyebrow'] ?? 'Not hypothetical'}
              </span>
              <span className="flex-1 h-px bg-[#0F3D2E]/10" />
            </div>
            <div className="grid sm:grid-cols-3 gap-8">
              {[
                { num: '382%', label: 'Online revenue increase at Windsor Parke Golf Club after leaving GolfNow', sub: '$81K → $393K', source: 'Golf Inc. / industry reporting, Windsor Parke case study' },
                { num: '39.6%', label: 'Of all rounds at Brown Golf went to zero-revenue barter slots over 3 years', sub: null, source: 'NGCOA member reporting / Golf Inc. analysis' },
                { num: '100+', label: 'Golf courses left GolfNow in Q1 2025 alone', sub: null, source: 'National Golf Course Owners Association (NGCOA), Q1 2025' },
              ].map(({ num, label, sub, source }) => (
                <div key={num} className="border-t border-[#0F3D2E] pt-4">
                  <p
                    className="font-display text-[#0F3D2E] leading-none tracking-[-0.025em]"
                    style={{ fontSize: 'clamp(48px, 6vw, 64px)', fontWeight: 400 }}
                  >
                    {num}
                  </p>
                  <p className="mt-3 text-sm text-[#1A1A1A]/80 leading-relaxed">{label}</p>
                  {sub && <p className="mt-1.5 text-xs font-mono text-[#0F3D2E]">{sub}</p>}
                  <p className="mt-2 text-[11px] text-[#6B7770] font-mono tracking-[0.06em]">Source · {source}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ──────────────────────────────────────────── */}
        <section className="px-6 py-16 bg-[#FAF7F2] text-center border-t border-[#0F3D2E]/10">
          <div className="max-w-xl mx-auto space-y-5">
            <h2
              className="font-display text-[#0F3D2E] tracking-[-0.02em] leading-tight"
              style={{ fontSize: 'clamp(30px, 4vw, 40px)', fontWeight: 400 }}
            >
              {content['barter.cta_headline'] ?? 'Ready to stop paying GolfNow in tee times?'}
            </h2>
            <p className="text-base text-[#6B7770] leading-relaxed">
              {content['barter.cta_body'] ?? '10 Founding Partner spots. Free for your first year. Zero barter, zero commissions. Live in 48 hours.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/waitlist/course"
                className="rounded-md bg-[#0F3D2E] px-7 py-3.5 text-sm font-semibold text-[#F4F1EA] hover:bg-[#0F3D2E]/90"
              >
                {allClaimed ? 'Join the course waitlist →' : `Claim a founding spot (${spotsRemaining} left)`}
              </Link>
            </div>
            <p className="text-sm text-[#6B7770]">
              Questions? Email Neil — <a href="mailto:neil@teeahead.com" className="text-[#0F3D2E] underline underline-offset-[3px] font-semibold">neil@teeahead.com</a>
            </p>
          </div>
        </section>

        {/* ── Cross-links ──────────────────────────────────────── */}
        <section className="px-6 py-8 bg-white border-t border-[#0F3D2E]/10">
          <div className="max-w-xl mx-auto text-center space-y-2">
            <p className="text-sm text-[#6B7770]">
              Not on GolfNow?{' '}
              <Link href="/software-cost" className="text-[#0F3D2E] underline underline-offset-[3px] font-semibold">
                See what your software is actually costing you →
              </Link>
            </p>
            <p className="text-sm text-[#6B7770]">
              Want the full historical damage?{' '}
              <Link href="/damage" className="text-[#0F3D2E] underline underline-offset-[3px] font-semibold">
                See the GolfNow Damage Report →
              </Link>
            </p>
          </div>
        </section>

      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="bg-[#0F3D2E] border-t border-black/5 px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 mb-12">
            <div className="space-y-3">
              <TeeAheadLogo className="h-10 w-auto brightness-0 invert" />
              <p className="text-sm text-[#F4F1EA]/80 leading-relaxed">
                Book ahead. Play more. Own your golf.
              </p>
              <p className="text-xs text-[#F4F1EA]/50">Built in Metro Detroit.</p>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#F4F1EA]/50 uppercase tracking-wider">Product</p>
              <nav className="flex flex-col gap-2 text-sm text-[#F4F1EA]/70">
                <Link href="/waitlist/golfer" className="hover:text-[#F4F1EA] transition-colors">For Golfers</Link>
                <Link href="/waitlist/course" className="hover:text-[#F4F1EA] transition-colors">For Courses</Link>
                <Link href="/#pricing" className="hover:text-[#F4F1EA] transition-colors">Pricing</Link>
                <Link href="/#how-it-works" className="hover:text-[#F4F1EA] transition-colors">How It Works</Link>
              </nav>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#F4F1EA]/50 uppercase tracking-wider">Company</p>
              <nav className="flex flex-col gap-2 text-sm text-[#F4F1EA]/70">
                <a href="mailto:hello@teeahead.com" className="hover:text-[#F4F1EA] transition-colors">Contact</a>
                <Link href="/terms" className="hover:text-[#F4F1EA] transition-colors">Terms</Link>
                <Link href="/privacy" className="hover:text-[#F4F1EA] transition-colors">Privacy</Link>
              </nav>
            </div>
          </div>
          <div className="border-t border-[#F4F1EA]/10 pt-6 text-center space-y-2">
            <p className="text-xs text-[#F4F1EA]/50">Metro Detroit, Michigan</p>
            <p className="text-xs text-[#F4F1EA]/40">© 2026 TeeAhead, LLC. All rights reserved.</p>
            <p className="text-xs text-[#F4F1EA]/30 max-w-2xl mx-auto leading-relaxed">
              Competitor references are for comparative purposes only and based on publicly available
              information. TeeAhead is not affiliated with or endorsed by GolfNow or NBC Sports Next.
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}

function Slider({ label, value, range, children }: { label: string; value: string; range: string; children: ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[13px] font-medium text-[#F4F1EA]">{label}</span>
        <span className="font-display text-[22px] text-[#E0A800]" style={{ fontWeight: 400 }}>{value}</span>
      </div>
      {children}
      <p className="mt-1.5 font-mono text-[10px] tracking-[0.08em] text-[#F4F1EA]/40">{range}</p>
    </div>
  )
}

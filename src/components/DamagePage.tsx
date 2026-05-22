// Legal note: All competitor references are based on publicly available data
// and documented industry sources. See inline citations for attribution.
// Last legal review: April 2026. Review again before major marketing campaigns.
'use client'

import { useState, useEffect, ReactNode } from 'react'
import Link from 'next/link'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'
import { FadeIn } from '@/components/FadeIn'
import SoftwareCostLeadCapture from '@/components/SoftwareCostLeadCapture'
import { METRO_DETROIT_COURSES } from '@/lib/metro-detroit-courses'

interface DamagePageProps {
  spotsRemaining: number
}

async function handleLeadSubmit(lead: {
  name: string
  email: string
  role: string
  courseName: string
  calculatedSavings: number
  vendor: string
}) {
  await fetch('/api/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lead),
  })
}

export function DamagePage({ spotsRemaining }: DamagePageProps) {
  const [greenFee, setGreenFee] = useState(85)
  const [operatingDays, setOperatingDays] = useState(280)
  const [barterTeeTimes, setBarterTeeTimes] = useState(2)
  const [yearsOnGolfNow, setYearsOnGolfNow] = useState(3)

  const annualBarterCost = greenFee * operatingDays * barterTeeTimes
  const totalDamage = annualBarterCost * yearsOnGolfNow

  const [displayedAnnual, setDisplayedAnnual] = useState(annualBarterCost)
  const [displayedTotal, setDisplayedTotal] = useState(totalDamage)
  const [openLeadModal, setOpenLeadModal] = useState(0)

  // Animate annualBarterCost
  useEffect(() => {
    const start = displayedAnnual
    const end = annualBarterCost
    const duration = 600
    const startTime = performance.now()
    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayedAnnual(Math.round(start + (end - start) * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annualBarterCost])

  // Animate totalDamage
  useEffect(() => {
    const start = displayedTotal
    const end = totalDamage
    const duration = 600
    const startTime = performance.now()
    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayedTotal(Math.round(start + (end - start) * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalDamage])

  // Tangibles breakdown (inline, mirroring SoftwareCostLeadCapture logic)
  const tangibles = [
    { icon: '🛺', label: 'new golf cart', cost: 8000 },
    { icon: '🌿', label: 'fairway renovation', cost: 25000 },
    { icon: '📣', label: 'local marketing campaign', cost: 3500 },
    { icon: '🏌️', label: 'pro shop remodel', cost: 15000 },
    { icon: '📱', label: 'tee sheet software (10 yrs)', cost: 4200 },
    { icon: '👔', label: 'full-time staff salary', cost: 45000 },
  ]
    .map(item => ({ ...item, qty: Math.floor(totalDamage / item.cost) }))
    .filter(item => item.qty >= 1)
    .map(item => ({
      icon: item.icon,
      label: item.qty === 1 ? `1 ${item.label}` : `${item.qty}× ${item.label}`,
    }))
    .slice(0, 4)

  const allClaimed = spotsRemaining <= 0

  return (
    <div className="min-h-screen bg-[#082419] text-[#F4F1EA] flex flex-col">

      {/* Nav */}
      <header className="border-b border-[#F4F1EA]/8 px-6 py-4 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/"><TeeAheadLogo className="h-10 w-auto brightness-0 invert" /></Link>
          <Link href="/waitlist/course" className="px-4 py-2 rounded-md bg-[#E0A800] text-[#082419] text-sm font-bold hover:bg-[#E0A800]/90">
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
                <span className="font-mono text-xs tracking-[0.16em] uppercase text-[#E0A800] font-semibold">Your damage report</span>
              </div>
              <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-[#F4F1EA]/50 mb-2">
                {yearsOnGolfNow} {yearsOnGolfNow === 1 ? 'year' : 'years'} on GolfNow has cost you
              </p>
              <p
                className="font-display leading-[0.88] tracking-[-0.04em]"
                style={{ fontSize: 'clamp(80px, 14vw, 168px)', fontWeight: 400 }}
              >
                ${displayedTotal.toLocaleString()}<span className="text-[#E0A800]">.</span>
              </p>
              <p className="mt-4 text-base sm:text-lg text-[#F4F1EA]/78 leading-relaxed max-w-md">
                <strong className="text-[#F4F1EA]">${displayedAnnual.toLocaleString()}/year</strong> in barter tee times. Adjust the sliders — the number updates as you drag.
              </p>

              {/* Tangibles — editorial, no emoji */}
              {tangibles.length > 0 && (
                <div className="mt-7 pt-5 border-t border-[#F4F1EA]/10">
                  <p className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-[#E0A800] font-bold mb-3">
                    What that money could have bought
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {tangibles.map((t) => {
                      const [count, ...labelParts] = t.label.split(' ')
                      return (
                        <li key={t.label} className="grid grid-cols-[60px_1fr] gap-3.5 items-baseline py-1">
                          <span
                            className="font-display text-[#E0A800] text-right tracking-[-0.02em] leading-none"
                            style={{ fontSize: 26, fontWeight: 400 }}
                          >
                            {count.replace('×', '')}×
                          </span>
                          <span className="text-[15px] text-[#F4F1EA]">{labelParts.join(' ')}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* Right: sliders */}
            <div className="bg-[#F4F1EA]/[0.04] border border-[#F4F1EA]/10 rounded-2xl p-6 sm:p-7 flex flex-col gap-5">
              <p className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-[#F4F1EA]/60 font-semibold">
                Adjust to match your course
              </p>

              <Slider label="Average green fee at peak" value={`$${greenFee}`} range="$45 – $200">
                <input type="range" min={45} max={200} step={5} value={greenFee} onChange={(e) => setGreenFee(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full cursor-pointer" style={{ accentColor: '#E0A800' }} />
              </Slider>

              <Slider label="Days open per year" value={String(operatingDays)} range="200 – 365">
                <input type="range" min={200} max={365} step={5} value={operatingDays} onChange={(e) => setOperatingDays(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full cursor-pointer" style={{ accentColor: '#E0A800' }} />
              </Slider>

              <Slider label="Barter tee times per day" value={String(barterTeeTimes)} range="1 – 4 · GolfNow typically takes 2">
                <input type="range" min={1} max={4} step={1} value={barterTeeTimes} onChange={(e) => setBarterTeeTimes(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full cursor-pointer" style={{ accentColor: '#E0A800' }} />
              </Slider>

              <Slider label="Years on GolfNow" value={String(yearsOnGolfNow)} range="1 – 15 years">
                <input type="range" min={1} max={15} step={1} value={yearsOnGolfNow} onChange={(e) => setYearsOnGolfNow(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full cursor-pointer" style={{ accentColor: '#E0A800' }} />
              </Slider>

              {/* Course autocomplete */}
              <div className="pt-3 border-t border-[#F4F1EA]/10">
                <label htmlFor="course-name" className="block font-mono text-[10px] tracking-[0.14em] uppercase text-[#F4F1EA]/60 font-semibold mb-1.5">
                  Your course (optional)
                </label>
                <input
                  id="course-name"
                  type="text"
                  list="metro-detroit-courses"
                  placeholder="Start typing your course name…"
                  className="w-full h-10 px-3 rounded-md border border-[#F4F1EA]/10 text-sm text-[#F4F1EA] bg-[#F4F1EA]/[0.04] placeholder:text-[#F4F1EA]/35 focus:outline-none focus:ring-2 focus:ring-[#E0A800]/30"
                />
                <datalist id="metro-detroit-courses">
                  {METRO_DETROIT_COURSES.map((course) => <option key={course} value={course} />)}
                </datalist>
              </div>

              <button
                onClick={() => setOpenLeadModal((n) => n + 1)}
                className="mt-1 rounded-md bg-[#E0A800] py-3.5 text-sm font-bold text-[#082419] hover:bg-[#E0A800]/90"
              >
                Claim a founding spot — save ${displayedTotal.toLocaleString()} going forward →
              </button>

              <p className="text-[11px] text-[#F4F1EA]/40 text-center font-mono tracking-[0.06em]">
                NGCOA &amp; Golf Inc. industry analysis, 2024
              </p>
            </div>

          </div>
        </section>

        {/* ── Proof — cream, restyled ────────────────────────────── */}
        <section className="px-6 sm:px-10 lg:px-16 py-16 bg-[#FAF7F2] text-[#1A1A1A]">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-baseline gap-3 mb-10">
              <span className="font-mono text-xs tracking-[0.18em] uppercase text-[#E0A800] font-semibold">Not hypothetical</span>
              <span className="flex-1 h-px bg-[#0F3D2E]/10" />
            </div>
            <div className="grid sm:grid-cols-3 gap-8">
              {[
                { num: '382%', label: 'Online revenue increase at Windsor Parke after leaving GolfNow', sub: '$81K → $393K', source: 'Golf Inc. / industry reporting' },
                { num: '39.6%', label: 'Of all rounds at Brown Golf went to zero-revenue barter slots over 3 years', sub: null, source: 'NGCOA member reporting' },
                { num: '100+', label: 'Golf courses left GolfNow in Q1 2025 alone', sub: null, source: 'NGCOA, Q1 2025' },
              ].map(({ num, label, sub, source }) => (
                <div key={num} className="border-t border-[#0F3D2E] pt-4">
                  <p className="font-display text-[#0F3D2E] leading-none tracking-[-0.025em]" style={{ fontSize: 'clamp(48px, 6vw, 64px)', fontWeight: 400 }}>{num}</p>
                  <p className="mt-3 text-sm text-[#1A1A1A]/80 leading-relaxed">{label}</p>
                  {sub && <p className="mt-1.5 text-xs font-mono text-[#0F3D2E]">{sub}</p>}
                  <p className="mt-2 text-[11px] text-[#6B7770] font-mono tracking-[0.06em]">Source · {source}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Lead Capture — unchanged behavior, restyled wrapper ── */}
        <section className="px-6 py-10 bg-[#FAF7F2]">
          <div className="max-w-2xl mx-auto">
            <SoftwareCostLeadCapture
              costs={{
                annualSubscription: 0,
                processingMarkup: 0,
                marketplaceBarter: totalDamage,
                totalExtraction: totalDamage,
                savingsAsFounder: totalDamage,
                savingsAsStandard: Math.max(0, totalDamage - 4188),
                selectedVendor: 'GolfNow',
              }}
              onLeadSubmit={handleLeadSubmit}
              autoFireThreshold={10000}
              openTrigger={openLeadModal}
            />
          </div>
        </section>

        {/* ── Final CTA ──────────────────────────────────────────── */}
        <section className="px-6 py-16 bg-[#FAF7F2] text-center">
          <div className="max-w-xl mx-auto space-y-5">
            <h2
              className="font-display text-[#0F3D2E] tracking-[-0.02em] leading-tight"
              style={{ fontSize: 'clamp(30px, 4vw, 40px)', fontWeight: 400 }}
            >
              Ready to stop paying GolfNow in tee times?
            </h2>
            <p className="text-base text-[#6B7770] leading-relaxed">
              10 Founding Partner spots. Free for your first year. Zero barter, zero commissions. Live in 48 hours.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/waitlist/course" className="rounded-md bg-[#0F3D2E] px-7 py-3.5 text-sm font-semibold text-[#F4F1EA] hover:bg-[#0F3D2E]/90">
                {allClaimed ? 'Join the course waitlist →' : `Claim a founding spot (${spotsRemaining} left)`}
              </Link>
            </div>
            <p className="text-sm text-[#6B7770]">
              Questions? Email Neil — <a href="mailto:neil@teeahead.com" className="text-[#0F3D2E] underline underline-offset-[3px] font-semibold">neil@teeahead.com</a>
            </p>
          </div>
        </section>

        {/* ── Cross-link to /software-cost (unchanged) ───────────── */}
        <section className="px-6 py-8 bg-white border-t border-[#0F3D2E]/10">
          <div className="max-w-xl mx-auto text-center">
            <p className="text-sm text-[#6B7770]">
              Not on GolfNow?{' '}
              <Link href="/software-cost" className="text-[#0F3D2E] underline underline-offset-[3px] font-semibold">
                Calculate your full software cost →
              </Link>
            </p>
          </div>
        </section>

      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="bg-[#0F3D2E] border-t border-black/5 px-6 py-16">
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
                <Link href="/#pricing" className="hover:text-[#F4F1EA] transition-colors">Pricing</Link>
                <Link href="/#how-it-works" className="hover:text-[#F4F1EA] transition-colors">How It Works</Link>
              </nav>
            </div>

            {/* Column 3 — Company */}
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

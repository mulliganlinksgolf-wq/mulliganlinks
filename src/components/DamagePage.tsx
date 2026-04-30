// Legal note: All competitor references are based on publicly available data
// and documented industry sources. See inline citations for attribution.
// Last legal review: April 2026. Review again before major marketing campaigns.
'use client'

import { useState, useEffect } from 'react'
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
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">

      {/* ── Header ────────────────────────────────────────────── */}
      <header className="bg-[#0F3D2E]/97 backdrop-blur border-b border-white/8 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/">
            <TeeAheadLogo className="h-12 w-auto brightness-0 invert" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-[#F4F1EA]/65 hover:text-[#F4F1EA] transition-colors hidden sm:block">
              ← Back to Home
            </Link>
            <Link
              href="/waitlist/course"
              className="inline-flex items-center justify-center rounded-lg bg-[#E0A800] px-4 py-2 text-sm font-semibold text-[#0a0a0a] hover:bg-[#E0A800]/90 transition-colors"
            >
              Claim a Founding Spot
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="px-6 py-20 text-center relative overflow-hidden" style={{ background: '#071f17' }}>
          {/* Gold radial glow */}
          <div className="absolute inset-0 pointer-events-none"
               style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(224,168,0,0.08) 0%, transparent 65%)' }} />
          <FadeIn>
            <div className="max-w-2xl mx-auto space-y-7 relative z-10">
              <div className="inline-flex items-center gap-2 bg-[#E0A800]/12 border border-[#E0A800]/30 rounded-full px-4 py-1.5">
                <span className="text-xs font-bold text-[#E0A800] tracking-[0.08em] uppercase">GolfNow Damage Report</span>
              </div>

              <h1 className="font-display font-black text-[#F4F1EA] leading-[1.1] tracking-[-0.02em]"
                  style={{ fontSize: 'clamp(36px, 5vw, 52px)' }}>
                GolfNow has been charging you barter for years.{' '}
                <em style={{ fontStyle: 'italic', color: '#E0A800' }}>See the total damage.</em>
              </h1>

              <p className="text-base leading-relaxed max-w-md mx-auto" style={{ color: 'rgba(244,241,234,0.60)' }}>
                Enter your numbers and see how much GolfNow&apos;s barter model has extracted from your course
                — not just this year, but since you signed. No login. No email required.
              </p>

              <p className="text-xs" style={{ color: 'rgba(244,241,234,0.30)' }}>
                Calculator based on NGCOA member survey data and Golf Inc. industry analysis (2024–2025). Actual costs vary by contract terms.
              </p>
            </div>
          </FadeIn>
        </section>

        {/* ── Calculator ────────────────────────────────────────── */}
        <section className="px-6 pb-6 bg-[#FAF7F2]">
          <FadeIn>
            <div className="max-w-2xl mx-auto bg-white rounded-[20px] p-8 border border-black/7 mt-0"
                 style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>

              {/* Card header with running total */}
              <div className="flex items-start justify-between mb-8 pb-6 border-b border-black/6">
                <div>
                  <p className="text-sm font-bold text-[#1A1A1A]">GolfNow Damage Calculator</p>
                  <p className="text-xs text-[#9DAA9F] mt-0.5">Adjust sliders to match your course</p>
                </div>
                <div className="text-right">
                  <p className="font-display font-black text-[#0F3D2E] leading-none" style={{ fontSize: '32px' }}>
                    ${displayedTotal.toLocaleString()}
                  </p>
                  <p className="text-xs text-[#9DAA9F] mt-0.5">total damage</p>
                </div>
              </div>

              {/* Slider 1: Green Fee */}
              <div className="space-y-3 mb-7">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#1A1A1A]">Your average green fee at peak</label>
                  <span className="font-display font-bold text-[#0F3D2E]" style={{ fontSize: '22px' }}>${greenFee}</span>
                </div>
                <input
                  type="range" min={45} max={200} step={5} value={greenFee}
                  onChange={(e) => setGreenFee(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full cursor-pointer"
                  style={{ accentColor: '#0F3D2E' }}
                />
                <p className="text-xs text-[#9DAA9F]">$45–$200 · Use your published weekend or peak-time rate</p>
              </div>

              {/* Slider 2: Operating Days */}
              <div className="space-y-3 mb-7">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#1A1A1A]">Days your course is open per year</label>
                  <span className="font-display font-bold text-[#0F3D2E]" style={{ fontSize: '22px' }}>{operatingDays}</span>
                </div>
                <input
                  type="range" min={200} max={365} step={5} value={operatingDays}
                  onChange={(e) => setOperatingDays(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full cursor-pointer"
                  style={{ accentColor: '#0F3D2E' }}
                />
                <p className="text-xs text-[#9DAA9F]">200–365 days</p>
              </div>

              {/* Slider 3: Barter Tee Times */}
              <div className="space-y-3 mb-7">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#1A1A1A]">Barter tee times given to GolfNow per day</label>
                  <span className="font-display font-bold text-[#0F3D2E]" style={{ fontSize: '22px' }}>{barterTeeTimes}</span>
                </div>
                <input
                  type="range" min={1} max={4} step={1} value={barterTeeTimes}
                  onChange={(e) => setBarterTeeTimes(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full cursor-pointer"
                  style={{ accentColor: '#0F3D2E' }}
                />
                <p className="text-xs text-[#9DAA9F]">GolfNow typically takes 2 prime-time tee times per day · 1–4</p>
              </div>

              {/* Slider 4: Years on GolfNow */}
              <div className="space-y-3 mb-7">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#1A1A1A]">Years on GolfNow</label>
                  <span className="font-display font-bold text-[#0F3D2E]" style={{ fontSize: '22px' }}>{yearsOnGolfNow}</span>
                </div>
                <input
                  type="range" min={1} max={15} step={1} value={yearsOnGolfNow}
                  onChange={(e) => setYearsOnGolfNow(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full cursor-pointer"
                  style={{ accentColor: '#0F3D2E' }}
                />
                <p className="text-xs text-[#9DAA9F]">1–15 years · How long has your course been on GolfNow?</p>
              </div>

              {/* Course autocomplete */}
              <div className="space-y-2 pt-4 border-t border-black/6">
                <label htmlFor="course-name" className="text-sm font-medium text-[#1A1A1A]">Your course (optional)</label>
                <input
                  id="course-name"
                  type="text"
                  list="metro-detroit-courses"
                  placeholder="Start typing your course name…"
                  className="w-full h-10 px-3 rounded-lg border border-black/10 text-sm text-[#1A1A1A] bg-[#FAF7F2] focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]/20"
                />
                <datalist id="metro-detroit-courses">
                  {METRO_DETROIT_COURSES.map((course) => (
                    <option key={course} value={course} />
                  ))}
                </datalist>
                <p className="text-xs text-[#9DAA9F]">Metro Detroit courses shown. Used only for your lead report — not stored.</p>
              </div>

            </div>
          </FadeIn>
        </section>

        {/* ── Output ─────────────────────────────────────────────── */}
        <section className="px-6 py-16 bg-[#0F3D2E] text-center">
          <FadeIn>
            <div className="max-w-2xl mx-auto space-y-6">
              <p className="text-sm font-medium text-[#F4F1EA]/60">GolfNow&apos;s barter model has cost you</p>
              <p className="font-display font-black text-[#F4F1EA] leading-none tracking-[-0.03em]"
                 style={{ fontSize: 'clamp(72px, 12vw, 96px)' }}>
                ${displayedTotal.toLocaleString()}
              </p>
              <p className="text-base text-[#F4F1EA]/50">over {yearsOnGolfNow} {yearsOnGolfNow === 1 ? 'year' : 'years'}</p>

              <div className="border-t border-[#F4F1EA]/15 pt-6 space-y-2">
                <p className="text-sm font-medium text-[#F4F1EA]/65">Annual barter cost</p>
                <p className="font-display font-black text-[#E0A800] leading-none" style={{ fontSize: '48px' }}>
                  ${displayedAnnual.toLocaleString()}
                </p>
                <p className="text-xs text-[#F4F1EA]/40">per year</p>
              </div>

              {/* Context cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                {[
                  { label: 'Years on GolfNow', value: `${yearsOnGolfNow}`, sub: yearsOnGolfNow === 1 ? 'year of extraction' : 'years of extraction' },
                  { label: 'That equals about', value: `${Math.round(totalDamage / greenFee).toLocaleString()} rounds`, sub: 'of revenue handed over' },
                  { label: 'TeeAhead would have cost you', value: '$0', sub: 'in barter or commissions' },
                ].map(({ label, value, sub }) => (
                  <div key={label} className="rounded-xl p-5 text-center"
                       style={{ background: 'rgba(244,241,234,0.06)', border: '1px solid rgba(244,241,234,0.10)' }}>
                    <p className="text-xs font-medium text-[#F4F1EA]/45 uppercase tracking-wider mb-2">{label}</p>
                    <p className="font-display font-bold text-[#F4F1EA] leading-none" style={{ fontSize: '26px' }}>{value}</p>
                    <p className="text-xs text-[#F4F1EA]/45 mt-1">{sub}</p>
                  </div>
                ))}
              </div>

              {/* Tangibles breakdown */}
              {tangibles.length > 0 && (
                <div className="border-t border-[#F4F1EA]/10 pt-6">
                  <p className="text-xs font-medium text-[#F4F1EA]/40 uppercase tracking-wider mb-4">
                    What ${totalDamage.toLocaleString()} could have bought your course
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {tangibles.map((t, i) => (
                      <div key={i} className="rounded-xl p-4 text-center"
                           style={{ background: 'rgba(244,241,234,0.06)', border: '1px solid rgba(244,241,234,0.10)' }}>
                        <span className="text-2xl block mb-1">{t.icon}</span>
                        <span className="text-xs text-[#F4F1EA]/60 leading-snug">{t.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-[#F4F1EA]/25 leading-relaxed max-w-lg mx-auto pt-2">
                Calculation based on GolfNow&apos;s standard barter model of 2 prime-time tee times per day
                at published rack rates. Actual barter arrangements vary by course agreement.
              </p>
            </div>
          </FadeIn>
        </section>

        {/* ── Lead Capture ───────────────────────────────────────── */}
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
            />
          </div>
        </section>

        {/* ── Proof ──────────────────────────────────────────────── */}
        <section className="px-6 py-16 bg-white">
          <FadeIn>
            <div className="max-w-3xl mx-auto space-y-10">
              <div className="max-w-xl mx-auto text-center space-y-3">
                <h2 className="font-display font-bold text-[#1A1A1A] tracking-[-0.02em]" style={{ fontSize: '32px' }}>
                  This is not a hypothetical.
                </h2>
                <p className="text-[#6B7770] text-base leading-relaxed">
                  The math above isn&apos;t projection — it&apos;s documented industry data.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { num: '382%', label: 'Online revenue increase at Windsor Parke Golf Club after leaving GolfNow', sub: '$81K → $393K', source: 'Golf Inc. / industry reporting, Windsor Parke case study' },
                  { num: '39.6%', label: 'Of all rounds at Brown Golf went to zero-revenue barter slots over 3 years', sub: null, source: 'NGCOA member reporting / Golf Inc. analysis' },
                  { num: '100+', label: 'Golf courses left GolfNow in Q1 2025 alone', sub: null, source: 'National Golf Course Owners Association (NGCOA), Q1 2025' },
                ].map(({ num, label, sub, source }) => (
                  <div key={num} className="bg-[#FAF7F2] rounded-xl p-7 space-y-2 ring-1 ring-black/5">
                    <p className="font-display font-bold text-[#0F3D2E]" style={{ fontSize: '36px' }}>{num}</p>
                    <p className="text-sm font-medium text-[#1A1A1A] leading-snug">{label}</p>
                    {sub && <p className="text-xs text-[#6B7770]">{sub}</p>}
                    <p className="text-xs text-[#9DAA9F]">Source: {source}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </section>

        {/* ── CTA ────────────────────────────────────────────────── */}
        <section className="px-6 py-20 bg-[#FAF7F2] text-center">
          <FadeIn>
            <div className="max-w-xl mx-auto space-y-6">
              <h2 className="font-display font-bold text-[#1A1A1A] tracking-[-0.02em] leading-tight" style={{ fontSize: '34px' }}>
                Ready to stop paying GolfNow to take your tee times?
              </h2>
              <p className="text-[#6B7770] text-base leading-relaxed">
                TeeAhead is free for Founding Partner courses — your first year on us. No barter. No commissions.
                The only ask: tell your golfers about TeeAhead at booking.
              </p>
              <div className="space-y-3">
                <Link
                  href="/waitlist/course"
                  className="inline-flex items-center justify-center w-full sm:w-auto rounded-lg bg-[#0F3D2E] px-8 py-4 text-base font-semibold text-[#F4F1EA] hover:opacity-90 transition-opacity"
                >
                  {allClaimed ? 'Join the Course Waitlist →' : 'Claim a Founding Partner Spot →'}
                </Link>
                {!allClaimed && (
                  <p className="text-sm font-semibold text-[#E0A800]">
                    {spotsRemaining} of 10 founding spots remaining
                  </p>
                )}
              </div>
              <p className="text-sm text-[#6B7770]">
                Questions? Email Neil directly —{' '}
                <a href="mailto:neil@teeahead.com" className="text-[#0F3D2E] hover:underline font-medium">
                  neil@teeahead.com
                </a>. Not a contact form.
              </p>
            </div>
          </FadeIn>
        </section>

        {/* ── Cross-link to /software-cost ─────────────────────── */}
        <section className="px-6 py-8 bg-white border-t border-black/5">
          <div className="max-w-xl mx-auto text-center">
            <p className="text-sm text-[#6B7770]">
              On our non-GolfNow calculators?{' '}
              <Link href="/software-cost" className="text-[#0F3D2E] hover:underline font-medium">
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
                <a href="mailto:support@teeahead.com" className="hover:text-[#F4F1EA] transition-colors">Contact</a>
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

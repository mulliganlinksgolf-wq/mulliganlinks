// Legal note: All competitor references are based on publicly available data
// and documented industry sources. See src/lib/vendorPricing.ts for attribution.
// Last legal review: April 2026. Review again before major marketing campaigns.
'use client'

import { useState, useEffect, ReactNode } from 'react'
import Link from 'next/link'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'
import { VENDOR_PRICING, TEEAHEAD_PRICING, VENDOR_KEYS, type VendorKey } from '@/lib/vendorPricing'
import SoftwareCostLeadCapture from '@/components/SoftwareCostLeadCapture'
import {
  calcAnnualSubscription,
  calcProcessingMarkup,
  calcMarketplaceBarter,
  calcTotalExtraction,
  estimateGolferRecords,
  type MarketplaceDistribution,
} from '@/lib/softwareCostCalc'

interface SoftwareCostPageProps {
  spotsRemaining: number
  content?: Record<string, string>
}

export function SoftwareCostPage({ spotsRemaining, content = {} }: SoftwareCostPageProps) {
  const [selectedVendor, setSelectedVendor] = useState<VendorKey | null>(null)
  const [monthlySubscription, setMonthlySubscription] = useState(300)
  const [annualCardVolume, setAnnualCardVolume] = useState(1_000_000)
  const [paymentProcessingRate, setPaymentProcessingRate] = useState(2.9)
  const [marketplaceDistribution, setMarketplaceDistribution] = useState<MarketplaceDistribution>('unsure')

  const handleVendorSelect = (key: VendorKey) => {
    setSelectedVendor(key)
    setMonthlySubscription(VENDOR_PRICING[key].medianMonthly)
    setMarketplaceDistribution(VENDOR_PRICING[key].marketplaceDefault ? 'yes' : 'no')
  }

  const annualSubscription = calcAnnualSubscription(monthlySubscription)
  const processingMarkup = calcProcessingMarkup(annualCardVolume, paymentProcessingRate)
  const marketplaceBarter = calcMarketplaceBarter(marketplaceDistribution)
  const totalExtraction = calcTotalExtraction(monthlySubscription, annualCardVolume, paymentProcessingRate, marketplaceDistribution)
  const golferRecords = estimateGolferRecords(annualCardVolume)
  const savingsAsFounding = totalExtraction
  const savingsAsStandard = Math.max(0, totalExtraction - TEEAHEAD_PRICING.standardAnnual)
  const isUnusuallyLean = totalExtraction < TEEAHEAD_PRICING.standardAnnual

  const [displayedTotal, setDisplayedTotal] = useState(totalExtraction)

  useEffect(() => {
    const start = displayedTotal
    const end = totalExtraction
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
  }, [totalExtraction])

  const allClaimed = spotsRemaining <= 0
  const vendorData = selectedVendor ? VENDOR_PRICING[selectedVendor] : null

  const fmt = (n: number) => `$${n.toLocaleString()}`

  const fmtVolume = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
      : `$${(n / 1_000).toFixed(0)}K`

  async function handleLeadSubmit(lead: { name: string; email: string; role: string; courseName: string; calculatedSavings: number; vendor: string }) {
    await fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) })
  }

  return (
    <div className="min-h-screen bg-[#082419] text-[#F4F1EA] flex flex-col">

      {/* Nav */}
      <header className="border-b border-[#F4F1EA]/8 px-6 py-4 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/"><TeeAheadLogo className="h-10 w-auto brightness-0 invert" /></Link>
          <Link
            href="/waitlist/course?tier=founding"
            className="px-4 py-2 rounded-md bg-[#E0A800] text-[#082419] text-sm font-bold hover:bg-[#E0A800]/90"
          >
            Claim a spot →
          </Link>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero IS the calculator ─────────────────────────────── */}
        <section className="px-6 sm:px-10 lg:px-16 py-14 sm:py-20">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-14 items-start">

            {/* Left: the number + breakdown */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-7 h-px bg-[#E0A800]" />
                <span className="font-mono text-xs tracking-[0.16em] uppercase text-[#E0A800] font-semibold">
                  {content['software_cost.hero_badge'] ?? 'Software cost calculator'}
                </span>
              </div>
              <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-[#F4F1EA]/50 mb-2">
                Your current vendor extracts
              </p>
              <p
                className="font-display leading-[0.88] tracking-[-0.04em]"
                style={{ fontSize: 'clamp(72px, 13vw, 152px)', fontWeight: 400 }}
              >
                {fmt(displayedTotal)}<span className="text-[#E0A800]">.</span>
              </p>
              <p className="mt-4 text-base sm:text-lg text-[#F4F1EA]/78 leading-relaxed max-w-md">
                <strong className="text-[#F4F1EA]">Per year.</strong> Subscription, processing markup, marketplace barter — added up. Adjust the sliders to match your setup.
              </p>

              {/* Breakdown — editorial ledger */}
              <div className="mt-7 pt-5 border-t border-[#F4F1EA]/10">
                <p className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-[#E0A800] font-bold mb-3">
                  Where it goes
                </p>
                <ul className="flex flex-col gap-1.5">
                  {[
                    { primary: fmt(annualSubscription), label: 'annual subscription' },
                    { primary: fmt(processingMarkup), label: 'processing markup vs 2.5% baseline' },
                    {
                      primary: fmt(marketplaceBarter),
                      label:
                        marketplaceDistribution === 'unsure'
                          ? 'marketplace barter (conservative)'
                          : 'marketplace barter',
                    },
                    { primary: `~${golferRecords.toLocaleString()}`, label: 'golfer records your vendor may share' },
                  ].map((row) => (
                    <li key={row.label} className="grid grid-cols-[minmax(110px,auto)_1fr] gap-3.5 items-baseline py-1">
                      <span
                        className="font-display text-[#E0A800] text-right tracking-[-0.02em] leading-none"
                        style={{ fontSize: 22, fontWeight: 400 }}
                      >
                        {row.primary}
                      </span>
                      <span className="text-[14px] text-[#F4F1EA]">{row.label}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[11px] text-[#F4F1EA]/40 font-mono tracking-[0.06em]">
                  Vendor right to aggregate &amp; sell · UNRESTRICTED
                </p>
              </div>

              {/* TeeAhead counter */}
              <div className="mt-7 pt-5 border-t border-[#F4F1EA]/10">
                <p className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-[#E0A800] font-bold mb-3">
                  TeeAhead would have charged
                </p>
                <ul className="flex flex-col gap-1.5">
                  <li className="grid grid-cols-[minmax(110px,auto)_1fr] gap-3.5 items-baseline py-1">
                    <span className="font-display text-[#E0A800] text-right tracking-[-0.02em] leading-none" style={{ fontSize: 22, fontWeight: 400 }}>$0</span>
                    <span className="text-[14px] text-[#F4F1EA]">Founding Partner · first year · {allClaimed ? 'all spots claimed' : `${spotsRemaining} of 10 remaining`}</span>
                  </li>
                  <li className="grid grid-cols-[minmax(110px,auto)_1fr] gap-3.5 items-baseline py-1">
                    <span className="font-display text-[#E0A800] text-right tracking-[-0.02em] leading-none" style={{ fontSize: 22, fontWeight: 400 }}>{fmt(TEEAHEAD_PRICING.standardAnnual)}</span>
                    <span className="text-[14px] text-[#F4F1EA]">Standard · $349/mo flat, cancel anytime</span>
                  </li>
                </ul>

                {isUnusuallyLean ? (
                  <p className="mt-4 text-[13px] text-[#F4F1EA]/70 leading-relaxed">
                    Your current setup is unusually lean. The case for TeeAhead here is data ownership and the loyalty layer — not cost.
                  </p>
                ) : (
                  <p className="mt-4 text-[13px] text-[#F4F1EA] leading-relaxed">
                    You save <span className="text-[#E0A800] font-semibold">{fmt(savingsAsFounding)}</span> as a Founding Partner. Even at standard pricing — <span className="font-semibold">{fmt(savingsAsStandard)}</span>/yr.
                  </p>
                )}
              </div>
            </div>

            {/* Right: sliders */}
            <div className="bg-[#F4F1EA]/[0.04] border border-[#F4F1EA]/10 rounded-2xl p-6 sm:p-7 flex flex-col gap-5">
              <p className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-[#F4F1EA]/60 font-semibold">
                Select your current software
              </p>

              {/* Vendor chips */}
              <div className="flex flex-wrap gap-1.5">
                {VENDOR_KEYS.map((key) => {
                  const active = selectedVendor === key
                  return (
                    <button
                      key={key}
                      onClick={() => handleVendorSelect(key)}
                      className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
                        active
                          ? 'bg-[#E0A800]/15 border border-[#E0A800]/40 text-[#E0A800]'
                          : 'bg-[#F4F1EA]/[0.04] border border-[#F4F1EA]/10 text-[#F4F1EA]/65 hover:text-[#F4F1EA]'
                      }`}
                    >
                      {VENDOR_PRICING[key].name}
                    </button>
                  )
                })}
              </div>

              <Slider label="Monthly subscription" value={fmt(monthlySubscription)} range="$0 – $1,500 · all add-ons included">
                <input
                  id="monthly-sub"
                  type="range" min={0} max={1500} step={10} value={monthlySubscription}
                  onChange={(e) => setMonthlySubscription(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full cursor-pointer"
                  style={{ accentColor: '#E0A800' }}
                  aria-label="Monthly subscription cost in dollars"
                />
              </Slider>

              <Slider label="Annual card volume" value={fmtVolume(annualCardVolume)} range="$100K – $5M · green fees, pro shop, F&B">
                <input
                  id="card-volume"
                  type="range" min={100_000} max={5_000_000} step={50_000} value={annualCardVolume}
                  onChange={(e) => setAnnualCardVolume(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full cursor-pointer"
                  style={{ accentColor: '#E0A800' }}
                  aria-label="Annual credit card volume in dollars"
                />
              </Slider>

              <Slider label="Blended processing rate" value={`${paymentProcessingRate.toFixed(1)}%`} range="2.4 – 4.0% · baseline 2.5%">
                <input
                  id="processing-rate"
                  type="range" min={2.4} max={4.0} step={0.1} value={paymentProcessingRate}
                  onChange={(e) => setPaymentProcessingRate(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full cursor-pointer"
                  style={{ accentColor: '#E0A800' }}
                  aria-label="Payment processing rate as a percentage"
                />
              </Slider>

              {/* Marketplace toggle */}
              <div>
                <p className="text-[13px] font-medium text-[#F4F1EA] mb-2">
                  Tee times routed to Supreme Golf, Barstool, or Golf Digest?
                </p>
                <div className="flex gap-1.5" role="group" aria-label="Marketplace distribution">
                  {(['yes', 'unsure', 'no'] as MarketplaceDistribution[]).map((opt) => {
                    const active = marketplaceDistribution === opt
                    return (
                      <button
                        key={opt}
                        onClick={() => setMarketplaceDistribution(opt)}
                        aria-pressed={active}
                        className={`flex-1 rounded-md py-2 text-[12px] font-medium transition-colors ${
                          active
                            ? 'bg-[#E0A800]/15 border border-[#E0A800]/40 text-[#E0A800]'
                            : 'bg-[#F4F1EA]/[0.04] border border-[#F4F1EA]/10 text-[#F4F1EA]/65 hover:text-[#F4F1EA]'
                        }`}
                      >
                        {opt === 'unsure' ? "Don't know" : opt === 'yes' ? 'Yes' : 'No'}
                      </button>
                    )
                  })}
                </div>
                <p className="mt-1.5 font-mono text-[10px] tracking-[0.08em] text-[#F4F1EA]/40">
                  If you&apos;re on foreUP, Lightspeed, Club Caddie, or Club Prophet, the answer is almost certainly yes.
                </p>
              </div>

              <Link
                href="/waitlist/course?tier=founding"
                className="mt-1 rounded-md bg-[#E0A800] py-3.5 text-sm font-bold text-[#082419] hover:bg-[#E0A800]/90 text-center"
              >
                {isUnusuallyLean
                  ? 'Claim a founding spot →'
                  : `Claim a founding spot — save ${fmt(savingsAsFounding)}/yr →`}
              </Link>

              <p className="text-[11px] text-[#F4F1EA]/40 text-center font-mono tracking-[0.06em]">
                Market-rate vendor data, April 2026
              </p>
            </div>

          </div>
        </section>

        {/* ── Lead capture ───────────────────────────────────────── */}
        <section className="px-6 py-10 bg-[#FAF7F2]">
          <div className="max-w-2xl mx-auto">
            <SoftwareCostLeadCapture
              costs={{
                annualSubscription,
                processingMarkup,
                marketplaceBarter,
                totalExtraction,
                savingsAsFounder: savingsAsFounding,
                savingsAsStandard,
                selectedVendor: selectedVendor ?? undefined,
              }}
              onLeadSubmit={handleLeadSubmit}
            />
          </div>
        </section>

        {/* ── Proof — cream ─────────────────────────────────────── */}
        <section className="px-6 sm:px-10 lg:px-16 py-16 bg-[#FAF7F2] text-[#1A1A1A]">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-baseline gap-3 mb-10">
              <span className="font-mono text-xs tracking-[0.18em] uppercase text-[#E0A800] font-semibold">
                Not hypothetical
              </span>
              <span className="flex-1 h-px bg-[#0F3D2E]/10" />
            </div>
            <div className="grid sm:grid-cols-3 gap-8">
              {[
                { num: '$548M', label: '2026 golf software market valuation', source: 'Industry analysis, 2026' },
                { num: '5 of 6', label: 'Major non-GolfNow vendors routing tee times to Supreme Golf marketplace by default', source: 'Public integration documentation, 2025–2026' },
                { num: 'Unrestricted', label: "Lightspeed and Club Caddie's stated rights to share aggregated golfer data with third parties", source: 'Vendor privacy policies, 2026' },
              ].map(({ num, label, source }) => (
                <div key={num} className="border-t border-[#0F3D2E] pt-4">
                  <p
                    className="font-display text-[#0F3D2E] leading-none tracking-[-0.025em]"
                    style={{ fontSize: 'clamp(40px, 5vw, 56px)', fontWeight: 400 }}
                  >
                    {num}
                  </p>
                  <p className="mt-3 text-sm text-[#1A1A1A]/80 leading-relaxed">{label}</p>
                  <p className="mt-2 text-[11px] text-[#6B7770] font-mono tracking-[0.06em]">Source · {source}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Vendor receipt (conditional) ──────────────────────── */}
        {vendorData && (
          <section className="px-6 py-12 bg-[#FAF7F2] border-t border-[#0F3D2E]/10">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-2xl p-8 border border-[#0F3D2E]/10 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-[#E0A800] font-bold mb-1">
                      About {vendorData.name}
                    </p>
                    <p className="text-sm text-[#6B7770]">Parent · {vendorData.parent}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#6B7770]">Typical range</p>
                    <p className="text-sm font-semibold text-[#1A1A1A]">
                      ${vendorData.minMonthly}–${vendorData.maxMonthly}/mo
                    </p>
                  </div>
                </div>
                <p className="text-base text-[#1A1A1A] leading-relaxed">{vendorData.receipt}</p>
              </div>
            </div>
          </section>
        )}

        {/* ── Final CTA ──────────────────────────────────────────── */}
        <section className="px-6 py-16 bg-[#FAF7F2] text-center border-t border-[#0F3D2E]/10">
          <div className="max-w-xl mx-auto space-y-5">
            <h2
              className="font-display text-[#0F3D2E] tracking-[-0.02em] leading-tight"
              style={{ fontSize: 'clamp(30px, 4vw, 40px)', fontWeight: 400 }}
            >
              Two ways to join TeeAhead.
            </h2>
            {!isUnusuallyLean && (
              <p className="text-base text-[#6B7770] leading-relaxed">
                Either way, you save <span className="text-[#0F3D2E] font-semibold">{fmt(savingsAsStandard)}+/yr</span> vs your current vendor.
              </p>
            )}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/waitlist/course?tier=founding"
                className="rounded-md bg-[#0F3D2E] px-7 py-3.5 text-sm font-semibold text-[#F4F1EA] hover:bg-[#0F3D2E]/90"
              >
                {allClaimed ? 'Join the waitlist →' : `Claim a founding spot (${spotsRemaining} left)`}
              </Link>
              <Link
                href="/waitlist/course?tier=standard"
                className="rounded-md border border-[#0F3D2E] px-7 py-3.5 text-sm font-semibold text-[#0F3D2E] hover:bg-[#0F3D2E]/5"
              >
                Standard partner list →
              </Link>
            </div>
            <p className="text-sm text-[#6B7770]">
              Questions? Email Neil — <a href="mailto:neil@teeahead.com" className="text-[#0F3D2E] underline underline-offset-[3px] font-semibold">neil@teeahead.com</a>
            </p>
          </div>
        </section>

        {/* ── Cross-link to /damage ──────────────────────────────── */}
        <section className="px-6 py-8 bg-white border-t border-[#0F3D2E]/10">
          <div className="max-w-xl mx-auto text-center">
            <p className="text-sm text-[#6B7770]">
              On GolfNow?{' '}
              <Link href="/damage" className="text-[#0F3D2E] underline underline-offset-[3px] font-semibold">
                Calculate your barter cost →
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
              <p className="text-sm text-[#F4F1EA]/80 leading-relaxed">Book ahead. Play more. Own your golf.</p>
              <p className="text-xs text-[#F4F1EA]/50">Built in Metro Detroit.</p>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#F4F1EA]/50 uppercase tracking-wider">Product</p>
              <nav className="flex flex-col gap-2 text-sm text-[#F4F1EA]/70">
                <Link href="/waitlist/golfer" className="hover:text-[#F4F1EA] transition-colors">For Golfers</Link>
                <Link href="/waitlist/course" className="hover:text-[#F4F1EA] transition-colors">For Courses</Link>
                <Link href="/#pricing" className="hover:text-[#F4F1EA] transition-colors">Pricing</Link>
                <Link href="/barter" className="hover:text-[#F4F1EA] transition-colors">GolfNow Barter Calculator</Link>
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
              Competitor references are for comparative purposes only and based on publicly available information.
              Vendor pricing and marketplace integration data sourced from public documentation as of April 2026.
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

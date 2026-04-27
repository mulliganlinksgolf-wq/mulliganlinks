// Legal note: All competitor references are based on publicly available data
// and documented industry sources. See src/lib/vendorPricing.ts for attribution.
// Last legal review: April 2026. Review again before major marketing campaigns.
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'
import { FadeIn } from '@/components/FadeIn'
import { VENDOR_PRICING, TEEAHEAD_PRICING, VENDOR_KEYS, type VendorKey } from '@/lib/vendorPricing'
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
}

export function SoftwareCostPage({ spotsRemaining }: SoftwareCostPageProps) {
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

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">

      {/* ── Header ────────────────────────────────────────────── */}
      <header className="bg-[#0F3D2E]/97 backdrop-blur border-b border-white/8 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/">
            <TeeAheadLogo className="h-12 w-auto brightness-0 invert" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-[#F4F1EA]/65 hover:text-[#F4F1EA] transition-colors hidden sm:block">
              ← Back to Home
            </Link>
            <Link
              href="/waitlist/course?tier=founding"
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
          <div className="absolute inset-0 pointer-events-none"
               style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(224,168,0,0.08) 0%, transparent 65%)' }} />
          <FadeIn>
            <div className="max-w-3xl mx-auto space-y-7 relative z-10">
              <div className="inline-flex items-center gap-2 bg-[#E0A800]/12 border border-[#E0A800]/30 rounded-full px-4 py-1.5">
                <span className="text-xs font-bold text-[#E0A800] tracking-[0.08em] uppercase">For Golf Course Operators</span>
              </div>

              <h1 className="font-display font-black text-[#F4F1EA] leading-[1.1] tracking-[-0.02em]"
                  style={{ fontSize: 'clamp(36px, 5vw, 52px)' }}>
                Your software vendor isn&apos;t free.{' '}
                <em style={{ fontStyle: 'italic', color: '#E0A800' }}>See exactly what they&apos;re costing you.</em>
              </h1>

              <p className="text-base leading-relaxed max-w-2xl mx-auto" style={{ color: 'rgba(244,241,234,0.60)' }}>
                GolfNow isn&apos;t the only one extracting from your course. foreUP, Lightspeed, Club Caddie, and Club Prophet
                all charge real money — and quietly route your golfer data through marketplaces like Barstool Golf Time and Golf Digest.
                Pick your current setup. We&apos;ll calculate the real cost.
              </p>

              {/* Pricing clarifier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
                <div className="rounded-xl p-5"
                     style={{ background: 'rgba(224,168,0,0.08)', border: '1px solid rgba(224,168,0,0.20)' }}>
                  <p className="text-xs font-bold text-[#E0A800] tracking-[0.08em] uppercase mb-2">
                    Founding Partners — First 10 Courses
                  </p>
                  <p className="font-display font-black text-[#E0A800] leading-none mb-2" style={{ fontSize: '28px' }}>
                    $0 / month
                  </p>
                  <p className="text-sm text-[#F4F1EA]/60 leading-relaxed">
                    Free for your first year. The only obligation: promote TeeAhead to your golfers at the point of booking.
                  </p>
                </div>
                <div className="rounded-xl p-5"
                     style={{ background: 'rgba(244,241,234,0.05)', border: '1px solid rgba(244,241,234,0.12)' }}>
                  <p className="text-xs font-bold text-[#F4F1EA]/50 tracking-[0.08em] uppercase mb-2">
                    Standard Pricing — Course #11+
                  </p>
                  <p className="font-display font-black text-[#F4F1EA] leading-none mb-2" style={{ fontSize: '28px' }}>
                    $299 / month
                  </p>
                  <p className="text-sm text-[#F4F1EA]/60 leading-relaxed">
                    Flat fee. No barter. No commissions. No data extraction. Cancel anytime.
                  </p>
                </div>
              </div>

              {/* Vendor chips */}
              <div className="space-y-3">
                <p className="text-xs font-semibold tracking-[0.08em] uppercase" style={{ color: 'rgba(244,241,234,0.35)' }}>
                  Select your current software
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {VENDOR_KEYS.map((key) => (
                    <button
                      key={key}
                      onClick={() => handleVendorSelect(key)}
                      className="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                      style={selectedVendor === key
                        ? { background: 'rgba(224,168,0,0.15)', border: '1px solid rgba(224,168,0,0.40)', color: '#E0A800' }
                        : { background: 'rgba(244,241,234,0.07)', border: '1px solid rgba(244,241,234,0.15)', color: 'rgba(244,241,234,0.65)' }
                      }
                    >
                      {VENDOR_PRICING[key].name}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs" style={{ color: 'rgba(244,241,234,0.30)' }}>
                Calculator based on market rate data and publicly available vendor pricing (April 2026). Actual costs vary by contract terms.
              </p>
            </div>
          </FadeIn>
        </section>

        {/* ── Calculator + Output ───────────────────────────────── */}
        <section className="px-6 py-8 bg-[#FAF7F2]">
          <div className="max-w-5xl mx-auto md:grid md:grid-cols-5 md:gap-8 md:items-start">

            {/* Left: Sliders */}
            <div className="md:col-span-3 mb-6 md:mb-0">
              <FadeIn>
                <div className="bg-white rounded-[20px] p-8 border border-black/7"
                     style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>

                  <div className="mb-8 pb-6 border-b border-black/6">
                    <p className="text-sm font-bold text-[#1A1A1A]">Software Cost Calculator</p>
                    <p className="text-xs text-[#9DAA9F] mt-0.5">Adjust sliders to match your course</p>
                  </div>

                  {/* Slider 1: Monthly Subscription */}
                  <div className="space-y-3 mb-7">
                    <div className="flex items-center justify-between">
                      <label htmlFor="monthly-sub" className="text-sm font-medium text-[#1A1A1A]">
                        Monthly software subscription
                      </label>
                      <span className="font-display font-bold text-[#0F3D2E]" style={{ fontSize: '22px' }}>
                        ${monthlySubscription}
                      </span>
                    </div>
                    <input
                      id="monthly-sub"
                      type="range" min={0} max={1500} step={10} value={monthlySubscription}
                      onChange={(e) => setMonthlySubscription(Number(e.target.value))}
                      className="w-full h-1.5 rounded-full cursor-pointer"
                      style={{ accentColor: '#0F3D2E' }}
                      aria-label="Monthly subscription cost in dollars"
                    />
                    <p className="text-xs text-[#9DAA9F]">
                      $0–$1,500/month · Include all add-ons (marketing, F&amp;B module, branded app, etc.)
                    </p>
                  </div>

                  {/* Slider 2: Annual Card Volume */}
                  <div className="space-y-3 mb-7">
                    <div className="flex items-center justify-between">
                      <label htmlFor="card-volume" className="text-sm font-medium text-[#1A1A1A]">
                        Annual credit card volume
                      </label>
                      <span className="font-display font-bold text-[#0F3D2E]" style={{ fontSize: '22px' }}>
                        {fmtVolume(annualCardVolume)}
                      </span>
                    </div>
                    <input
                      id="card-volume"
                      type="range" min={100_000} max={5_000_000} step={50_000} value={annualCardVolume}
                      onChange={(e) => setAnnualCardVolume(Number(e.target.value))}
                      className="w-full h-1.5 rounded-full cursor-pointer"
                      style={{ accentColor: '#0F3D2E' }}
                      aria-label="Annual credit card volume in dollars"
                    />
                    <p className="text-xs text-[#9DAA9F]">
                      $100K–$5M · Green fees, pro shop, F&amp;B — everything that runs through cards
                    </p>
                  </div>

                  {/* Slider 3: Payment Processing Rate */}
                  <div className="space-y-3 mb-7">
                    <div className="flex items-center justify-between">
                      <label htmlFor="processing-rate" className="text-sm font-medium text-[#1A1A1A]">
                        Blended payment processing rate
                      </label>
                      <span className="font-display font-bold text-[#0F3D2E]" style={{ fontSize: '22px' }}>
                        {paymentProcessingRate.toFixed(1)}%
                      </span>
                    </div>
                    <input
                      id="processing-rate"
                      type="range" min={2.4} max={4.0} step={0.1} value={paymentProcessingRate}
                      onChange={(e) => setPaymentProcessingRate(Number(e.target.value))}
                      className="w-full h-1.5 rounded-full cursor-pointer"
                      style={{ accentColor: '#0F3D2E' }}
                      aria-label="Payment processing rate as a percentage"
                    />
                    <p className="text-xs text-[#9DAA9F]">
                      2.4%–4.0% · Baseline is 2.5%. Most golf vendors mark this up. Default 2.9% is the median markup.
                    </p>
                  </div>

                  {/* Toggle: Marketplace Distribution */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-[#1A1A1A] block">
                      Tee times distributed on Supreme Golf, Barstool Golf Time, or Golf Digest?
                    </label>
                    <div className="flex gap-2" role="group" aria-label="Marketplace distribution">
                      {(['yes', 'unsure', 'no'] as MarketplaceDistribution[]).map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setMarketplaceDistribution(opt)}
                          aria-pressed={marketplaceDistribution === opt}
                          className="flex-1 rounded-lg py-2 text-sm font-semibold transition-colors"
                          style={marketplaceDistribution === opt
                            ? { background: '#0F3D2E', color: '#F4F1EA' }
                            : { background: '#F4F1EA', border: '1px solid rgba(0,0,0,0.10)', color: '#6B7770' }
                          }
                        >
                          {opt === 'unsure' ? "Don't know" : opt === 'yes' ? 'Yes' : 'No'}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-[#9DAA9F]">
                      If you&apos;re on foreUP, Lightspeed, Club Caddie, or Club Prophet, the answer is almost certainly Yes — even if you don&apos;t know it.
                    </p>
                  </div>

                </div>
              </FadeIn>
            </div>

            {/* Right: Output Panel (sticky on desktop) */}
            <div className="md:col-span-2 md:sticky md:top-6">
              <FadeIn>
                <div className="bg-white rounded-[20px] border border-black/7 overflow-hidden"
                     style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>

                  {/* Section 1: Current vendor cost */}
                  <div className="p-6 space-y-3">
                    <p className="text-xs font-bold tracking-[0.08em] uppercase text-[#6B7770]">
                      What your current vendor actually costs
                    </p>

                    <div className="space-y-2.5">
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm text-[#1A1A1A]">Annual subscription</span>
                        <span className="text-sm font-semibold text-[#1A1A1A]">{fmt(annualSubscription)}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <div>
                          <span className="text-sm text-[#1A1A1A]">Processing markup</span>
                          <p className="text-xs text-[#9DAA9F]">vs. 2.5% baseline</p>
                        </div>
                        <span className="text-sm font-semibold text-[#1A1A1A]">{fmt(processingMarkup)}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <div>
                          <span className="text-sm text-[#1A1A1A]">Marketplace barter</span>
                          {marketplaceDistribution === 'unsure' && (
                            <p className="text-xs text-[#9DAA9F]">conservative estimate</p>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-[#1A1A1A]">
                          {fmt(marketplaceBarter)}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline pt-2 border-t border-black/5">
                        <span className="text-xs text-[#9DAA9F]">Golfer data extracted</span>
                        <span className="text-xs text-[#9DAA9F]">~{golferRecords.toLocaleString()} records/yr</span>
                      </div>
                      <p className="text-xs text-[#9DAA9F] italic">Vendor&apos;s right to aggregate &amp; sell: UNRESTRICTED</p>
                    </div>

                    <div className="bg-[#FAF7F2] rounded-xl p-4 text-center">
                      <p className="text-xs font-medium text-[#6B7770] mb-1">Total annual extraction</p>
                      <p className="font-display font-black text-[#0F3D2E] leading-none" style={{ fontSize: '36px' }}>
                        {fmt(displayedTotal)}
                      </p>
                    </div>
                  </div>

                  {/* VS Divider */}
                  <div className="px-6 py-3 flex items-center gap-3">
                    <div className="flex-1 border-t border-[#0F3D2E]/20" />
                    <span className="text-xs font-bold tracking-[0.12em] uppercase text-[#0F3D2E]">VS. TEEAHEAD</span>
                    <div className="flex-1 border-t border-[#0F3D2E]/20" />
                  </div>

                  {/* Section 2: TeeAhead comparison */}
                  <div className="p-6 space-y-4" style={{ background: 'rgba(15,61,46,0.025)' }}>
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-semibold text-[#0F3D2E]">Founding Partner</p>
                          <p className="text-xs text-[#6B7770]">
                            {allClaimed ? 'All spots claimed' : `${spotsRemaining} of 10 remaining`}
                          </p>
                        </div>
                        <p className="font-display font-black text-[#E0A800]" style={{ fontSize: '22px' }}>$0/yr</p>
                      </div>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-semibold text-[#1A1A1A]">Standard pricing</p>
                          <p className="text-xs text-[#6B7770]">$299/mo, cancel anytime</p>
                        </div>
                        <p className="font-display font-bold text-[#1A1A1A]" style={{ fontSize: '18px' }}>
                          {fmt(TEEAHEAD_PRICING.standardAnnual)}/yr
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-[#6B7770] space-y-1.5">
                      {[
                        'No barter',
                        'No commissions',
                        'No data extraction',
                        'No marketplace routing without your explicit opt-in',
                      ].map((item) => (
                        <p key={item} className="flex items-center gap-1.5">
                          <span className="text-[#0F3D2E] font-bold text-sm">✓</span> {item}
                        </p>
                      ))}
                    </div>

                    <div className="border-t border-black/8 pt-4 space-y-2">
                      <p className="text-xs font-bold tracking-[0.06em] uppercase text-[#6B7770]">Your annual savings</p>
                      {isUnusuallyLean ? (
                        <div className="text-sm leading-relaxed">
                          <p className="font-medium text-[#1A1A1A] mb-1">Your current setup is unusually lean.</p>
                          <p className="text-[#6B7770]">
                            The case for TeeAhead is data ownership and the loyalty layer — not cost.{' '}
                            <Link href="/#how-it-works" className="text-[#0F3D2E] hover:underline">Learn more →</Link>
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex justify-between items-baseline">
                            <span className="text-sm text-[#1A1A1A]">As Founding Partner</span>
                            <span className="font-display font-bold text-[#0F3D2E]" style={{ fontSize: '22px' }}>
                              {fmt(savingsAsFounding)}
                            </span>
                          </div>
                          <div className="flex justify-between items-baseline">
                            <span className="text-sm text-[#6B7770]">As Standard Partner</span>
                            <span className="font-semibold text-[#1A1A1A]">{fmt(savingsAsStandard)}</span>
                          </div>
                          <p className="text-xs text-[#9DAA9F]">
                            Even at standard pricing, you save {fmt(savingsAsStandard)}/year.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </FadeIn>
            </div>

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
                  {
                    num: '$548M',
                    label: '2026 golf software market valuation',
                    source: 'Industry analysis, 2026',
                  },
                  {
                    num: '5 of 6',
                    label: 'Major non-GolfNow vendors routing tee times to Supreme Golf marketplace by default',
                    source: 'Public integration documentation, 2025–2026',
                  },
                  {
                    num: '"Unrestricted"',
                    label: "Lightspeed and Club Caddie's stated rights to share aggregated golfer data with third parties",
                    source: 'Vendor privacy policies, 2026',
                  },
                ].map(({ num, label, source }) => (
                  <div key={num} className="bg-[#FAF7F2] rounded-xl p-7 space-y-2 ring-1 ring-black/5">
                    <p className="font-display font-bold text-[#0F3D2E]" style={{ fontSize: '32px' }}>{num}</p>
                    <p className="text-sm font-medium text-[#1A1A1A] leading-snug">{label}</p>
                    <p className="text-xs text-[#9DAA9F]">Source: {source}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </section>

        {/* ── Vendor Receipt (conditional) ────────────────────────── */}
        {vendorData && (
          <section className="px-6 py-12 bg-[#FAF7F2]">
            <FadeIn>
              <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-[20px] p-8 border border-black/7 space-y-4"
                     style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold tracking-[0.08em] uppercase text-[#6B7770] mb-1">
                        About {vendorData.name}
                      </p>
                      <p className="text-sm text-[#9DAA9F]">Parent company: {vendorData.parent}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#9DAA9F]">Typical range</p>
                      <p className="text-sm font-semibold text-[#1A1A1A]">
                        ${vendorData.minMonthly}–${vendorData.maxMonthly}/mo
                      </p>
                    </div>
                  </div>
                  <p className="text-base text-[#1A1A1A] leading-relaxed">{vendorData.receipt}</p>
                </div>
              </div>
            </FadeIn>
          </section>
        )}

        {/* ── CTA ────────────────────────────────────────────────── */}
        <section className="px-6 py-20 bg-[#FAF7F2] text-center">
          <FadeIn>
            <div className="max-w-2xl mx-auto space-y-8">
              <h2 className="font-display font-bold text-[#1A1A1A] tracking-[-0.02em] leading-tight" style={{ fontSize: '34px' }}>
                Two ways to join TeeAhead.
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                {/* Founding Partner card */}
                <div className="rounded-[20px] p-6 space-y-3" style={{ background: '#0F3D2E' }}>
                  <div>
                    <p className="text-xs font-bold tracking-[0.08em] uppercase text-[#E0A800] mb-1">Founding Partner</p>
                    <p className="font-display font-black text-[#E0A800] leading-none" style={{ fontSize: '24px' }}>
                      Free for your first year
                    </p>
                  </div>
                  <p className="text-sm text-[#F4F1EA]/70 leading-relaxed">
                    10 spots total.{' '}
                    <span className="text-[#E0A800] font-semibold">
                      {allClaimed ? 'All claimed.' : `${spotsRemaining} remaining.`}
                    </span>
                    {' '}Obligation: promote TeeAhead to your golfers at booking.
                  </p>
                  <Link
                    href="/waitlist/course?tier=founding"
                    className="inline-flex items-center justify-center w-full rounded-lg bg-[#E0A800] px-5 py-3 text-sm font-semibold text-[#0a0a0a] hover:bg-[#E0A800]/90 transition-colors"
                  >
                    {allClaimed ? 'Join the Waitlist →' : 'Claim a Founding Partner Spot →'}
                  </Link>
                </div>

                {/* Standard card */}
                <div className="rounded-[20px] p-6 space-y-3 bg-white border border-black/8">
                  <div>
                    <p className="text-xs font-bold tracking-[0.08em] uppercase text-[#6B7770] mb-1">Standard Partner</p>
                    <p className="font-display font-bold text-[#0F3D2E] leading-none" style={{ fontSize: '24px' }}>
                      $299/month
                    </p>
                  </div>
                  <p className="text-sm text-[#6B7770] leading-relaxed">
                    Flat fee. No barter. No commissions. No data extraction. Cancel anytime. Available immediately.
                  </p>
                  <Link
                    href="/waitlist/course?tier=standard"
                    className="inline-flex items-center justify-center w-full rounded-lg bg-[#0F3D2E] px-5 py-3 text-sm font-semibold text-[#F4F1EA] hover:opacity-90 transition-opacity"
                  >
                    Get on the Standard Partner List →
                  </Link>
                </div>
              </div>

              {!isUnusuallyLean && (
                <p className="text-sm text-[#6B7770]">
                  Either way, you save{' '}
                  <span className="font-semibold text-[#0F3D2E]">{fmt(savingsAsStandard)}+/year</span>{' '}
                  vs. your current vendor.
                </p>
              )}

              <p className="text-sm text-[#6B7770]">
                Questions? Email Neil directly —{' '}
                <a href="mailto:neil@teeahead.com" className="text-[#0F3D2E] hover:underline font-medium">
                  neil@teeahead.com
                </a>. Not a contact form.
              </p>
            </div>
          </FadeIn>
        </section>

        {/* ── Cross-link to /barter ──────────────────────────────── */}
        <section className="px-6 py-8 bg-white border-t border-black/5">
          <div className="max-w-xl mx-auto text-center">
            <p className="text-sm text-[#6B7770]">
              On GolfNow?{' '}
              <Link href="/barter" className="text-[#0F3D2E] hover:underline font-medium">
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
                <Link href="/about" className="hover:text-[#F4F1EA] transition-colors">About Neil &amp; Billy</Link>
                <a href="mailto:support@teeahead.com" className="hover:text-[#F4F1EA] transition-colors">Contact</a>
                <Link href="/terms" className="hover:text-[#F4F1EA] transition-colors">Terms</Link>
                <Link href="/privacy" className="hover:text-[#F4F1EA] transition-colors">Privacy</Link>
              </nav>
            </div>
          </div>
          <div className="border-t border-[#F4F1EA]/10 pt-6 text-center space-y-2">
            <p className="text-xs text-[#F4F1EA]/50">Metro Detroit, Michigan · <a href="mailto:billy.teeahead@gmail.com" className="hover:text-[#F4F1EA]/70 transition-colors">billy.teeahead@gmail.com</a></p>
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

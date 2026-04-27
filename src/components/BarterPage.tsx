'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'
import { FadeIn } from '@/components/FadeIn'

interface BarterPageProps {
  spotsRemaining: number
}

export function BarterPage({ spotsRemaining }: BarterPageProps) {
  const [greenFee, setGreenFee] = useState(85)
  const [operatingDays, setOperatingDays] = useState(280)
  const [barterTeeTimes, setBarterTeeTimes] = useState(2)
  const [copied, setCopied] = useState(false)

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
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out-cubic
      setDisplayedCost(Math.round(start + (end - start) * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annualBarterCost])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText('https://teeahead.com/barter')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShareText = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: 'GolfNow Barter Calculator — TeeAhead',
        text: "See exactly what GolfNow's barter model costs your course per year.",
        url: 'https://teeahead.com/barter',
      }).catch(() => {
        handleCopyLink()
      })
    } else {
      handleCopyLink()
    }
  }

  const emailSubject = encodeURIComponent("Worth checking — what GolfNow is costing you")
  const emailBody = encodeURIComponent("I found this calculator that shows exactly what GolfNow's barter model costs courses per year: https://teeahead.com/barter")
  const mailtoHref = `mailto:?subject=${emailSubject}&body=${emailBody}`

  const spotsLow = spotsRemaining <= 5 && spotsRemaining > 0
  const allClaimed = spotsRemaining <= 0

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">

      {/* ── Header ────────────────────────────────────────────── */}
      <header className="bg-[#FAF7F2]/95 backdrop-blur border-b border-black/5 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/">
            <TeeAheadLogo className="h-12 w-auto" />
          </Link>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="px-6 py-20 bg-[#FAF7F2]">
          <FadeIn>
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="inline-block bg-[#0F3D2E]/10 text-[#0F3D2E] text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                For golf course operators
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-[#1A1A1A] leading-tight tracking-tight">
                What has GolfNow actually cost you?
              </h1>
              <p className="text-lg text-[#6B7770] leading-relaxed max-w-2xl">
                Drop in your numbers. We&apos;ll show you the exact dollars GolfNow&apos;s barter model has extracted
                from your course this year. No login. No email required (until you want one).
              </p>
            </div>
          </FadeIn>
        </section>

        {/* ── Calculator ────────────────────────────────────────── */}
        <section className="px-6 pb-8 bg-[#FAF7F2]">
          <FadeIn>
            <div className="max-w-3xl mx-auto space-y-8 bg-white rounded-2xl p-8 ring-1 ring-black/8 shadow-sm">

              {/* Slider 1: Green Fee */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#1A1A1A]">
                    Your average green fee at peak
                  </label>
                  <span className="text-3xl font-bold text-[#0F3D2E]">${greenFee}</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={200}
                  step={5}
                  value={greenFee}
                  onChange={(e) => setGreenFee(Number(e.target.value))}
                  className="w-full h-2 rounded-full cursor-pointer"
                  style={{ accentColor: '#0F3D2E' }}
                />
                <p className="text-xs text-[#6B7770]">
                  $20 – $200, step $5 &nbsp;·&nbsp; Use your published weekend or peak-time rate
                </p>
              </div>

              {/* Slider 2: Operating Days */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#1A1A1A]">
                    Days your course is open per year
                  </label>
                  <span className="text-3xl font-bold text-[#0F3D2E]">{operatingDays}</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={360}
                  step={10}
                  value={operatingDays}
                  onChange={(e) => setOperatingDays(Number(e.target.value))}
                  className="w-full h-2 rounded-full cursor-pointer"
                  style={{ accentColor: '#0F3D2E' }}
                />
                <p className="text-xs text-[#6B7770]">
                  100 – 360 days, step 10 &nbsp;·&nbsp; How many days per year your course is open
                </p>
              </div>

              {/* Slider 3: Barter Tee Times */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#1A1A1A]">
                    Barter tee times given to GolfNow per day
                  </label>
                  <span className="text-3xl font-bold text-[#0F3D2E]">{barterTeeTimes}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={4}
                  step={1}
                  value={barterTeeTimes}
                  onChange={(e) => setBarterTeeTimes(Number(e.target.value))}
                  className="w-full h-2 rounded-full cursor-pointer"
                  style={{ accentColor: '#0F3D2E' }}
                />
                <p className="text-xs text-[#6B7770]">
                  1 – 4, step 1 &nbsp;·&nbsp; GolfNow typically takes 2 prime-time tee times per day in barter
                </p>
              </div>

            </div>
          </FadeIn>
        </section>

        {/* ── Output Card ───────────────────────────────────────── */}
        <section className="px-6 py-8 bg-[#FAF7F2]">
          <FadeIn>
            <div className="max-w-3xl mx-auto">
              <div className="bg-[#0F3D2E] rounded-2xl p-10 text-center space-y-6">
                <p className="text-[#F4F1EA]/80 text-base font-medium">
                  GolfNow&apos;s barter model cost you
                </p>
                <p
                  className="font-bold text-[#F4F1EA] leading-none"
                  style={{ fontSize: '80px' }}
                >
                  ${displayedCost.toLocaleString()}
                </p>
                <p className="text-[#F4F1EA]/70 text-base">
                  this year alone
                </p>

                <div className="border-t border-[#F4F1EA]/20 pt-6 space-y-2">
                  <p className="text-[#F4F1EA]/80 text-sm font-medium">
                    TeeAhead would have charged you:
                  </p>
                  <p
                    className="font-bold leading-none"
                    style={{ fontSize: '56px', color: '#E0A800' }}
                  >
                    $0
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* ── Context Blocks ────────────────────────────────────── */}
        <section className="px-6 py-4 bg-[#FAF7F2]">
          <FadeIn>
            <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-6 ring-1 ring-black/5 text-center space-y-2">
                <p className="text-xs text-[#6B7770] font-medium uppercase tracking-wider">Over 5 years, that&apos;s</p>
                <p className="text-2xl font-bold text-[#0F3D2E]">
                  ${(annualBarterCost * 5).toLocaleString()}
                </p>
                <p className="text-xs text-[#6B7770]">in lost revenue</p>
              </div>
              <div className="bg-white rounded-xl p-6 ring-1 ring-black/5 text-center space-y-2">
                <p className="text-xs text-[#6B7770] font-medium uppercase tracking-wider">That equals about</p>
                <p className="text-2xl font-bold text-[#0F3D2E]">
                  {Math.round(annualBarterCost / greenFee).toLocaleString()} rounds
                </p>
                <p className="text-xs text-[#6B7770]">of revenue per year</p>
              </div>
              <div className="bg-white rounded-xl p-6 ring-1 ring-black/5 text-center space-y-2">
                <p className="text-xs text-[#6B7770] font-medium uppercase tracking-wider">You could hire</p>
                <p className="text-2xl font-bold text-[#0F3D2E]">
                  {Math.max(1, Math.round(annualBarterCost / 50000))} additional staff
                </p>
                <p className="text-xs text-[#6B7770]">with that money</p>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* ── Proof Section ─────────────────────────────────────── */}
        <section className="px-6 py-20 bg-white">
          <FadeIn>
            <div className="max-w-5xl mx-auto space-y-12">
              <div className="max-w-3xl mx-auto space-y-4">
                <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
                  This is not a hypothetical.
                </h2>
                <p className="text-[#6B7770] text-lg leading-relaxed">
                  The math above isn&apos;t projection — it&apos;s documented industry data. GolfNow&apos;s barter model
                  has cost real courses real money for years.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-[#FAF7F2] rounded-xl p-8 space-y-3 ring-1 ring-black/5">
                  <div className="text-4xl font-bold text-[#0F3D2E]">382%</div>
                  <p className="text-sm font-medium text-[#1A1A1A] leading-snug">
                    Online revenue increase at Windsor Parke after leaving GolfNow
                  </p>
                  <p className="text-xs text-[#6B7770]">$81K → $393K</p>
                </div>
                <div className="bg-[#FAF7F2] rounded-xl p-8 space-y-3 ring-1 ring-black/5">
                  <div className="text-4xl font-bold text-[#0F3D2E]">39.6%</div>
                  <p className="text-sm font-medium text-[#1A1A1A] leading-snug">
                    Of all rounds at Brown Golf went to zero-revenue barter slots
                  </p>
                  <p className="text-xs text-[#6B7770]">Over 3 years of documented data</p>
                </div>
                <div className="bg-[#FAF7F2] rounded-xl p-8 space-y-3 ring-1 ring-black/5">
                  <div className="text-4xl font-bold text-[#0F3D2E]">100+</div>
                  <p className="text-sm font-medium text-[#1A1A1A] leading-snug">
                    Golf courses left GolfNow in Q1 2025 alone
                  </p>
                  <p className="text-xs text-[#6B7770]">NGCOA / industry data</p>
                </div>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* ── Offer Section ─────────────────────────────────────── */}
        <section className="px-6 py-20 bg-[#FAF7F2]">
          <FadeIn>
            <div className="max-w-3xl mx-auto space-y-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
                Get this number on your dashboard every month.
              </h2>
              <div className="space-y-4 text-[#6B7770] text-lg leading-relaxed">
                <p>
                  We built TeeAhead to give courses everything GolfNow promised, without the extraction.
                  Free software. Real loyalty for your golfers. Zero barter — ever.
                </p>
                {!allClaimed && (
                  <p>
                    The first 10 partner courses get TeeAhead free for life. As of today,{' '}
                    <span
                      className="font-semibold"
                      style={{ color: spotsLow ? '#E0A800' : undefined }}
                    >
                      {spotsRemaining} of 10 spots are left.
                    </span>
                  </p>
                )}
                <p>
                  The only ask: tell your golfers about TeeAhead at booking. That&apos;s it. No barter.
                  No commissions. No data extraction.
                </p>
              </div>

              <div className="space-y-4">
                <Link
                  href="/waitlist/course"
                  className="inline-flex items-center justify-center w-full sm:w-auto rounded-lg bg-[#0F3D2E] px-8 py-4 text-base font-semibold text-[#F4F1EA] hover:opacity-90 transition-opacity"
                >
                  {allClaimed ? 'Join the Course Waitlist →' : 'Claim a Founding Partner Spot →'}
                </Link>

                <p className="text-sm text-[#6B7770]">
                  Already have a TeeAhead login?{' '}
                  <Link href="/auth/sign-in" className="text-[#0F3D2E] hover:underline">
                    Sign in to view your real barter receipt →
                  </Link>
                </p>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* ── Share Section ─────────────────────────────────────── */}
        <section className="px-6 py-20 bg-white">
          <FadeIn>
            <div className="max-w-3xl mx-auto space-y-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
                Know another course owner getting hit by GolfNow?
              </h2>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center justify-center rounded-lg border-2 border-[#0F3D2E] px-6 py-3 text-sm font-semibold text-[#0F3D2E] hover:bg-[#0F3D2E]/5 transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <a
                  href={mailtoHref}
                  className="inline-flex items-center justify-center rounded-lg border-2 border-[#0F3D2E] px-6 py-3 text-sm font-semibold text-[#0F3D2E] hover:bg-[#0F3D2E]/5 transition-colors"
                >
                  Share via Email
                </a>
                <button
                  onClick={handleShareText}
                  className="inline-flex items-center justify-center rounded-lg border-2 border-[#0F3D2E] px-6 py-3 text-sm font-semibold text-[#0F3D2E] hover:bg-[#0F3D2E]/5 transition-colors"
                >
                  Share via Text
                </button>
              </div>

              <p className="text-sm text-[#6B7770]">
                The link is <span className="font-medium text-[#1A1A1A]">teeahead.com/barter</span>. Easy to remember. Easy to share.
              </p>
            </div>
          </FadeIn>
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
                <Link href="/about" className="hover:text-[#F4F1EA] transition-colors">About Neil &amp; Billy</Link>
                <a href="mailto:hello@teeahead.com" className="hover:text-[#F4F1EA] transition-colors">Contact</a>
                <Link href="/terms" className="hover:text-[#F4F1EA] transition-colors">Terms</Link>
                <Link href="/privacy" className="hover:text-[#F4F1EA] transition-colors">Privacy</Link>
              </nav>
            </div>

          </div>
          <div className="border-t border-[#F4F1EA]/10 pt-6 text-center">
            <p className="text-xs text-[#F4F1EA]/40">© 2026 TeeAhead, LLC. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  )
}

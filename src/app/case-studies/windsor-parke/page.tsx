import Link from 'next/link'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'
import { FadeIn } from '@/components/FadeIn'

export const metadata = {
  title: 'Windsor Parke Golf Club: 382% Revenue Increase After Leaving GolfNow',
  description: 'Windsor Parke Golf Club grew online revenue from $81,000 to $393,000 — a $312,000 swing — after eliminating GolfNow barter tee times and reclaiming direct bookings.',
  alternates: { canonical: '/case-studies/windsor-parke' },
  openGraph: {
    url: '/case-studies/windsor-parke',
    title: 'Windsor Parke Golf Club: 382% Revenue Increase After Leaving GolfNow',
    description: 'Online revenue grew from $81,000 to $393,000 after Windsor Parke eliminated GolfNow barter and took back their booking channel.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
}

function WindsorParkeSchema() {
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      '@id': 'https://www.teeahead.com/case-studies/windsor-parke#article',
      headline: 'Windsor Parke Golf Club: 382% Revenue Increase After Leaving GolfNow',
      description:
        'Windsor Parke Golf Club grew online revenue from $81,000 to $393,000 after eliminating GolfNow barter tee times and reclaiming direct bookings.',
      url: 'https://www.teeahead.com/case-studies/windsor-parke',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': 'https://www.teeahead.com/case-studies/windsor-parke',
      },
      datePublished: '2026-04-30',
      dateModified: '2026-04-30',
      author: { '@id': 'https://www.teeahead.com/#neil-barris' },
      publisher: { '@id': 'https://www.teeahead.com/#organization' },
      image: {
        '@type': 'ImageObject',
        url: 'https://www.teeahead.com/og-image.png',
        width: 1200,
        height: 630,
      },
      articleSection: 'Case Study',
      about: [
        { '@type': 'Thing', name: 'GolfNow barter model' },
        { '@type': 'Thing', name: 'Golf course revenue' },
        { '@type': 'Organization', name: 'Windsor Parke Golf Club' },
      ],
      mentions: [
        { '@type': 'Organization', name: 'GolfNow' },
        { '@type': 'Organization', name: 'National Golf Course Owners Association' },
      ],
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['h1', 'h2', '.speakable'],
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How much did Windsor Parke Golf Club increase revenue after leaving GolfNow?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Windsor Parke Golf Club increased online revenue by 382% — from $81,000 to $393,000 — after leaving GolfNow and reclaiming direct bookings. That is a $312,000 revenue swing by eliminating barter tee times and owning their customer relationships directly.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is GolfNow\'s barter tee time model?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'GolfNow\'s barter model requires partner golf courses to surrender approximately 2 tee times per day at a discounted "Hot Deal" rate in exchange for access to their tee sheet software and marketplace listing. At average rack rates, this costs the typical golf course $37,000 to $150,000 per year in lost revenue.',
          },
        },
        {
          '@type': 'Question',
          name: 'Why did Windsor Parke Golf Club leave GolfNow?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Windsor Parke Golf Club left GolfNow to eliminate barter tee time costs, reclaim ownership of their customer data, and rebuild their direct booking channel. GolfNow\'s model was eroding their revenue while GolfNow retained the customer relationships and data.',
          },
        },
        {
          '@type': 'Question',
          name: 'What does it cost a golf course to use GolfNow?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'GolfNow charges courses in barter tee times — approximately 2 per day at discounted rates — rather than a flat monthly fee. Based on NGCOA member survey data and Golf Inc. industry analysis, this costs the average course approximately $94,500 per year. High-volume courses can lose $150,000 or more annually.',
          },
        },
        {
          '@type': 'Question',
          name: 'What happened to Windsor Parke\'s direct bookings after leaving GolfNow?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'After leaving GolfNow, Windsor Parke Golf Club rebuilt their direct booking channel and grew online revenue from $81,000 to $393,000 — a 382% increase. The course reclaimed ownership of golfer relationships and data that GolfNow had been capturing on their behalf.',
          },
        },
      ],
    },
  ]

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export default function WindsorParkeCaseStudy() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      <WindsorParkeSchema />

      {/* ── Header ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#0F3D2E]/97 backdrop-blur border-b border-white/8">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <TeeAheadLogo className="h-14 w-auto brightness-0 invert" />
          </Link>
          <Link href="/golfnow-alternative" className="text-sm text-[#F4F1EA]/70 hover:text-[#F4F1EA] transition-colors">← Back</Link>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="bg-[#0F3D2E] px-6 py-20">
        <FadeIn>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 bg-[#E0A800]/15 border border-[#E0A800]/40 rounded-full px-4 py-1.5">
              <span className="text-sm font-semibold text-[#E0A800] tracking-wide uppercase">Case Study</span>
            </div>
            <h1 className="font-display font-black text-[#F4F1EA] leading-tight tracking-[-0.02em] speakable" style={{ fontSize: 'clamp(28px, 4.5vw, 46px)' }}>
              Windsor Parke Golf Club grew online revenue{' '}
              <em style={{ color: '#E0A800', fontStyle: 'italic' }}>382%</em>{' '}
              after leaving GolfNow.
            </h1>
            <p className="text-lg text-[#F4F1EA]/72 leading-relaxed max-w-2xl speakable">
              Online revenue went from <strong className="text-[#F4F1EA]">$81,000 to $393,000</strong> — a $312,000 swing — by eliminating barter tee times, reclaiming direct bookings, and owning their customer relationships again.
            </p>
            <p className="text-xs text-[#F4F1EA]/40">Source: Golf Inc. / industry reporting, Windsor Parke case study</p>
          </div>
        </FadeIn>
      </section>

      {/* ── Stat bar ─────────────────────────────────────────── */}
      <section className="bg-white border-b border-black/8 px-6 py-10">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-6 text-center">
          {[
            { value: '382%', label: 'Revenue increase' },
            { value: '$312K', label: 'Dollar swing' },
            { value: '$0', label: 'Barter cost after switch' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="font-display font-extrabold text-[#0F3D2E] leading-none mb-1" style={{ fontSize: '36px' }}>{value}</p>
              <p className="text-xs text-[#6B7770]">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── The problem ──────────────────────────────────────── */}
      <section className="px-6 py-16 bg-[#FAF7F2]">
        <div className="max-w-2xl mx-auto space-y-10">

          <div className="space-y-5">
            <h2 className="font-display font-black text-[#0F3D2E] text-2xl tracking-[-0.01em]">The problem with GolfNow's barter model</h2>
            <p className="text-[#4A5550] leading-relaxed">
              GolfNow doesn&apos;t charge golf courses a monthly fee. Instead, they take payment in barter tee times — approximately <strong>2 tee times per day</strong> at discounted &ldquo;Hot Deal&rdquo; rates. On paper, it sounds like a reasonable trade: free software in exchange for filling slow slots.
            </p>
            <p className="text-[#4A5550] leading-relaxed">
              In practice, those barter slots add up fast. At average rack rates across 300 operating days, the typical course surrenders <strong>$94,500 per year</strong> in revenue. High-volume courses lose $150,000 or more.
            </p>
            <p className="text-[#4A5550] leading-relaxed">
              It gets worse. GolfNow&apos;s price parity clauses prevent courses from offering lower prices on their own website than on GolfNow — so courses can&apos;t even incentivize direct bookings. And GolfNow retains the customer data. The golfer who books through GolfNow belongs to GolfNow, not your course.
            </p>
          </div>

          {/* Barter math callout */}
          <div className="bg-[#0F3D2E] rounded-xl p-8 space-y-4">
            <p className="text-xs font-bold tracking-[0.12em] uppercase text-[#E0A800]">The barter math</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              {[
                { calc: '2 tee times/day', label: 'Barter requirement' },
                { calc: '× 300 days', label: 'Operating season' },
                { calc: '= ~$94,500/yr', label: 'Average annual loss' },
              ].map(({ calc, label }) => (
                <div key={label}>
                  <p className="font-bold text-[#F4F1EA] text-lg">{calc}</p>
                  <p className="text-xs text-[#F4F1EA]/60 mt-1">{label}</p>
                </div>
              ))}
            </div>
            <p className="text-center">
              <Link href="/barter" className="text-sm text-[#E0A800] font-medium hover:underline">
                Calculate your course&apos;s barter cost →
              </Link>
            </p>
          </div>

          <div className="space-y-5">
            <h2 className="font-display font-black text-[#0F3D2E] text-2xl tracking-[-0.01em]">What Windsor Parke did</h2>
            <p className="text-[#4A5550] leading-relaxed">
              Windsor Parke Golf Club made the decision to leave GolfNow and rebuild their direct booking channel. No more barter tee times. No more price parity constraints. No more handing customer data to a platform that would then market back to their own golfers.
            </p>
            <p className="text-[#4A5550] leading-relaxed">
              The results, documented in Golf Inc. industry reporting, speak for themselves.
            </p>
          </div>

          {/* The result */}
          <div className="bg-white rounded-xl p-8 border border-black/8 shadow-sm space-y-6">
            <p className="text-xs font-bold tracking-[0.12em] uppercase text-[#6B7770]">The result</p>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="font-display font-black text-[#9DAA9F] leading-none" style={{ fontSize: '40px' }}>$81K</p>
                <p className="text-xs text-[#9DAA9F] mt-1">Online revenue before</p>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full h-px bg-[#0F3D2E]/20 relative">
                  <span className="absolute left-1/2 -translate-x-1/2 -top-3 text-xs font-bold text-[#0F3D2E] bg-white px-2">+$312,000</span>
                </div>
                <p className="text-xs text-[#6B7770]">after leaving GolfNow</p>
              </div>
              <div className="text-center">
                <p className="font-display font-black text-[#0F3D2E] leading-none" style={{ fontSize: '40px' }}>$393K</p>
                <p className="text-xs text-[#6B7770] mt-1">Online revenue after</p>
              </div>
            </div>
            <div className="pt-2 border-t border-black/8">
              <p className="text-2xl font-black text-[#0F3D2E]">382% increase in online revenue.</p>
              <p className="text-sm text-[#6B7770] mt-1">Source: Golf Inc. / industry reporting, Windsor Parke case study</p>
            </div>
          </div>

          <div className="space-y-5">
            <h2 className="font-display font-black text-[#0F3D2E] text-2xl tracking-[-0.01em]">Why this happens</h2>
            <p className="text-[#4A5550] leading-relaxed">
              When a course is on GolfNow, GolfNow becomes the primary customer-facing brand for that course&apos;s online bookings. Golfers book through GolfNow, not the course website. GolfNow collects the email addresses, the booking history, the payment information.
            </p>
            <p className="text-[#4A5550] leading-relaxed">
              When a course leaves, they reclaim that direct relationship. Their own website becomes the booking destination. Their marketing goes to golfers who actually remember booking directly. The barter inventory that was going to GolfNow at $35–$45 a round now sells at full rack rate.
            </p>
            <p className="text-[#4A5550] leading-relaxed">
              Windsor Parke&apos;s 382% jump reflects the compounding effect of all three: no barter losses, full-rate direct bookings, and owned customer relationships that keep golfers coming back.
            </p>
          </div>

          {/* Missouri Bluffs aside */}
          <div className="bg-[#F0F4F1] rounded-xl p-6 border-l-4 border-[#0F3D2E] space-y-2">
            <p className="font-semibold text-[#0F3D2E] text-sm">Windsor Parke isn&apos;t an outlier.</p>
            <p className="text-sm text-[#4A5550] leading-relaxed">
              Missouri Bluffs Golf Club saw a <strong>36.3% increase</strong> in green fee revenue after moving away from GolfNow&apos;s barter model. Brown Golf documented that <strong>39.6% of all rounds</strong> over three years went to zero-revenue barter slots before they made the switch.
            </p>
            <p className="text-xs text-[#9DAA9F]">Source: Golf Inc. industry reporting</p>
          </div>

        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-2xl mx-auto space-y-8">
          <h2 className="font-display font-black text-[#0F3D2E] text-2xl tracking-[-0.01em]">Common questions</h2>
          <div className="space-y-6">
            {[
              {
                q: 'Is the 382% figure verified?',
                a: 'The Windsor Parke revenue figures — $81,000 before, $393,000 after — are sourced from Golf Inc. industry reporting and the Windsor Parke case study. TeeAhead is not affiliated with Windsor Parke Golf Club.',
              },
              {
                q: 'What is GolfNow\'s barter model?',
                a: 'GolfNow\'s barter model requires partner courses to surrender approximately 2 tee times per day at discounted "Hot Deal" rates in exchange for their tee sheet software and marketplace listing. At average rack rates, this costs the typical course $94,500 per year.',
              },
              {
                q: 'How much does my course lose in barter every year?',
                a: 'It depends on your rack rate and operating days. The TeeAhead Barter Calculator lets you enter your specific numbers to see your estimated annual barter cost.',
              },
              {
                q: 'Does TeeAhead take barter tee times?',
                a: 'No. TeeAhead charges a flat monthly fee ($0 for Founding Partner year one, $349/month after). No barter tee times, no commissions, no price parity clauses.',
              },
              {
                q: 'Who owns the golfer data when a course uses TeeAhead?',
                a: 'The course owns all of it — every booking, every golfer profile, every email address. Full CSV export anytime. TeeAhead never markets to your golfers.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-black/8 pb-6 last:border-0 last:pb-0 space-y-2">
                <p className="font-semibold text-[#0F3D2E]">{q}</p>
                <p className="text-sm text-[#4A5550] leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="px-6 py-16 bg-[#FAF7F2]">
        <div className="max-w-xl mx-auto">
          <div className="bg-[#0F3D2E] rounded-2xl p-8 sm:p-10 text-center space-y-6">
            <p className="text-xs font-bold tracking-[0.14em] uppercase text-[#E0A800]">Founding Partner Program — Metro Detroit</p>
            <h2 className="font-display font-black text-[#F4F1EA] text-2xl leading-snug tracking-[-0.01em]">
              Stop paying GolfNow in tee times.
            </h2>
            <p className="text-[#F4F1EA]/70 text-sm leading-relaxed">
              10 Founding Partner spots. Free for your first year. Zero barter, zero commissions, zero data extraction. Live within 48 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/waitlist/course"
                className="px-7 py-3 rounded-xl bg-[#E0A800] text-[#0F3D2E] font-bold text-sm hover:bg-[#c89700] transition-colors"
              >
                Apply as a Founding Partner
              </Link>
              <Link
                href="/barter"
                className="px-7 py-3 rounded-xl border border-[#F4F1EA]/20 text-[#F4F1EA]/80 font-semibold text-sm hover:border-[#F4F1EA]/40 hover:text-[#F4F1EA] transition-colors"
              >
                Calculate your barter cost
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="bg-[#071f17] border-t border-black/5 px-6 py-10 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <TeeAheadLogo className="h-8 w-auto brightness-0 invert" />
          <p className="text-xs text-[#F4F1EA]/40">© 2026 TeeAhead, LLC. All rights reserved.</p>
          <nav className="flex gap-4 text-xs text-[#F4F1EA]/50">
            <Link href="/terms" className="hover:text-[#F4F1EA] transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-[#F4F1EA] transition-colors">Privacy</Link>
            <a href="mailto:support@teeahead.com" className="hover:text-[#F4F1EA] transition-colors">Contact</a>
          </nav>
        </div>
      </footer>

    </div>
  )
}

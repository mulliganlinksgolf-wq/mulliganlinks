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
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.teeahead.com' },
        { '@type': 'ListItem', position: 2, name: 'Case Studies', item: 'https://www.teeahead.com/case-studies' },
        { '@type': 'ListItem', position: 3, name: 'Windsor Parke Golf Club', item: 'https://www.teeahead.com/case-studies/windsor-parke' },
      ],
    },
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
      dateModified: '2026-05-11',
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

      <header className="bg-white border-b border-[#0F3D2E]/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/"><TeeAheadLogo className="h-12 w-auto" /></Link>
          <p className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-[#6B7770]">Case Study · 001</p>
        </div>
      </header>

      <main className="flex-1 px-6 sm:px-10 lg:px-16 py-14 sm:py-20">
        <div className="max-w-6xl mx-auto">

          {/* Hero */}
          <FadeIn>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-7 h-px bg-[#E0A800]" />
              <span className="font-mono text-xs tracking-[0.16em] uppercase text-[#6B7770]">Windsor Parke Golf Club · Case Study</span>
            </div>
            <h1
              className="font-display text-[#0F3D2E] leading-[1] tracking-[-0.025em] max-w-4xl speakable"
              style={{ fontSize: 'clamp(40px, 6vw, 60px)', fontWeight: 400 }}
            >
              They left GolfNow.<br />
              Online revenue went up <em className="italic text-[#E0A800]">382%.</em>
            </h1>
          </FadeIn>

          {/* The swing visualization */}
          <FadeIn>
            <div className="mt-10 bg-white border border-[#0F3D2E]/10 rounded-2xl p-7 sm:p-9 grid sm:grid-cols-[1fr_120px_1fr] items-center gap-6">
              <div className="text-center">
                <p className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-[#6B7770] mb-2">Online revenue · before</p>
                <p className="font-display text-[#6B7770] leading-[0.88] tracking-[-0.03em]" style={{ fontSize: 'clamp(56px, 8vw, 84px)', fontWeight: 400 }}>$81K</p>
                <p className="mt-2 text-xs text-[#6B7770]">on GolfNow&apos;s barter model</p>
              </div>
              <div className="relative h-14 flex flex-col items-center justify-center">
                <div className="w-full h-px bg-[#E0A800] relative">
                  <span className="absolute -right-1 -top-[5px] w-0 h-0" style={{ borderLeft: '10px solid #E0A800', borderTop: '6px solid transparent', borderBottom: '6px solid transparent' }} />
                </div>
                <span className="absolute -top-2.5 px-2.5 py-1 bg-[#0F3D2E] text-[#E0A800] rounded-full font-mono text-[10px] tracking-[0.12em] font-bold">+$312K</span>
                <p className="mt-4 font-mono text-[9.5px] tracking-[0.14em] uppercase text-[#6B7770]">after leaving</p>
              </div>
              <div className="text-center">
                <p className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-[#E0A800] font-semibold mb-2">Online revenue · after</p>
                <p className="font-display text-[#0F3D2E] leading-[0.88] tracking-[-0.03em]" style={{ fontSize: 'clamp(56px, 8vw, 84px)', fontWeight: 400 }}>$393K<span className="text-[#E0A800]">.</span></p>
                <p className="mt-2 text-xs text-[#6B7770]">direct bookings, full rack rate</p>
              </div>
            </div>
            <p className="mt-3 text-[11px] font-mono text-[#9DAA9F] tracking-[0.06em]">Source · Golf Inc. / industry reporting, Windsor Parke case study</p>
          </FadeIn>

          {/* Narrative + marginalia */}
          <div className="mt-14 grid lg:grid-cols-[1.6fr_1fr] gap-14 items-start">

            {/* Main column */}
            <FadeIn>
              <article className="space-y-10">
                <section className="space-y-4">
                  <p className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-[#E0A800] font-bold">The problem</p>
                  <h2 className="font-display text-[#0F3D2E] tracking-[-0.02em] leading-[1.05] speakable" style={{ fontSize: 36, fontWeight: 400 }}>
                    GolfNow doesn&apos;t charge in dollars. It charges in <em className="italic text-[#E0A800]">tee&nbsp;times.</em>
                  </h2>
                  <p className="text-base leading-[1.7] text-[#1A1A1A]/85">
                    Approximately <strong>two prime-time tee times per day</strong>, surrendered to &ldquo;Hot Deal&rdquo; discounts. On paper, it sounds like a reasonable trade: free software in exchange for filling slow slots.
                  </p>
                  <p className="text-base leading-[1.7] text-[#1A1A1A]/85">
                    In practice, those slots add up fast. At average rack rates across 300 operating days, the typical course gives away <strong>$94,500 a year</strong>. High-volume courses lose $150K+.
                  </p>
                  <p className="text-base leading-[1.7] text-[#1A1A1A]/85">
                    It gets worse. Price-parity clauses prevent courses from offering lower rates on their own site — so courses can&apos;t incentivize direct bookings. And GolfNow keeps the customer data. The golfer belongs to GolfNow, not the course.
                  </p>
                </section>

                {/* Pull quote */}
                <blockquote className="border-l-[3px] border-[#E0A800] bg-white pl-6 pr-6 py-5">
                  <p className="font-display italic text-[22px] leading-[1.35] text-[#0F3D2E]" style={{ fontWeight: 400 }}>
                    &ldquo;Windsor Parke isn&apos;t an outlier — Missouri Bluffs saw a 36.3% green fee increase. Brown Golf documented 39.6% of all rounds went to zero-revenue barter.&rdquo;
                  </p>
                  <p className="mt-2.5 font-mono text-[10.5px] tracking-[0.12em] uppercase text-[#6B7770]">Source · Golf Inc. industry reporting</p>
                </blockquote>

                <section className="space-y-4">
                  <p className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-[#E0A800] font-bold">What Windsor Parke did</p>
                  <h2 className="font-display text-[#0F3D2E] tracking-[-0.02em] leading-[1.05]" style={{ fontSize: 36, fontWeight: 400 }}>
                    They <em className="italic text-[#E0A800]">left.</em> And rebuilt direct.
                  </h2>
                  <p className="text-base leading-[1.7] text-[#1A1A1A]/85">
                    No more barter. No more price-parity constraints. No more handing customer data to a platform that would market it back to their own golfers. They reclaimed the booking channel.
                  </p>
                  <p className="text-base leading-[1.7] text-[#1A1A1A]/85">
                    Their own website became the booking destination. Their marketing went to golfers who actually remembered booking directly. The barter inventory that was going to GolfNow at $35–$45 a round now sells at full rack rate.
                  </p>
                  <p className="text-base leading-[1.7] text-[#1A1A1A]/85">
                    Windsor Parke&apos;s 382% jump reflects the compounding effect of all three: no barter losses, full-rate direct bookings, and owned customer relationships that keep golfers coming back.
                  </p>
                </section>

                {/* FAQ */}
                <section>
                  <p className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-[#E0A800] font-bold mb-4">Common questions</p>
                  <div className="space-y-2">
                    {[
                      { q: 'Is the 382% figure verified?', a: 'The Windsor Parke revenue figures — $81,000 before, $393,000 after — are sourced from Golf Inc. industry reporting and the Windsor Parke case study. TeeAhead is not affiliated with Windsor Parke Golf Club.' },
                      { q: "What is GolfNow's barter model?", a: "GolfNow's barter model requires partner courses to surrender approximately 2 tee times per day at discounted \"Hot Deal\" rates in exchange for their tee sheet software and marketplace listing. At average rack rates, this costs the typical course $94,500 per year." },
                      { q: 'How much does my course lose in barter every year?', a: 'It depends on your rack rate and operating days. The TeeAhead Barter Calculator lets you enter your specific numbers to see your estimated annual barter cost.' },
                      { q: 'Does TeeAhead take barter tee times?', a: 'No. TeeAhead charges a flat monthly fee ($0 for Founding Partner year one, $349/month after). No barter tee times, no commissions, no price parity clauses.' },
                      { q: 'Who owns the golfer data when a course uses TeeAhead?', a: 'The course owns all of it — every booking, every golfer profile, every email address. Full CSV export anytime. TeeAhead never markets to your golfers.' },
                    ].map((f, i) => (
                      <details key={f.q} className="group bg-white border border-[#0F3D2E]/10 rounded-lg px-4 py-3" open={i === 0}>
                        <summary className="flex justify-between items-baseline gap-3 cursor-pointer list-none">
                          <span className="text-[14px] font-medium text-[#1A1A1A] leading-[1.35] flex-1">{f.q}</span>
                          <span className="font-mono text-sm text-[#6B7770] transition-transform group-open:rotate-90" aria-hidden>+</span>
                        </summary>
                        <p className="mt-2 text-[13px] text-[#6B7770] leading-[1.55]">{f.a}</p>
                      </details>
                    ))}
                  </div>
                </section>
              </article>
            </FadeIn>

            {/* Marginalia sidebar */}
            <FadeIn>
              <aside className="space-y-6 lg:pt-[60px]">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#E0A800] font-bold mb-2">The barter math</p>
                  <div className="bg-[#082419] text-[#F4F1EA] rounded-xl p-5 space-y-2.5">
                    {[
                      ['2', 'tee times/day'],
                      ['×', '300 days/year'],
                      ['×', '$157 rack rate'],
                      ['=', '$94,500/yr'],
                    ].map(([n, l], i) => (
                      <div key={i} className="grid grid-cols-[36px_1fr] items-baseline gap-3">
                        <span className={`font-display text-[22px] ${i === 3 ? 'text-[#E0A800]' : 'text-[#F4F1EA]'}`} style={{ fontWeight: 400 }}>{n}</span>
                        <span className={`text-[13px] ${i === 3 ? 'text-[#E0A800] font-semibold' : 'text-[#F4F1EA]/75'}`}>{l}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/damage" className="block mt-3 text-[12px] text-[#0F3D2E] underline underline-offset-[3px]">
                    Calculate your course&apos;s barter cost →
                  </Link>
                </div>

                <div>
                  <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#E0A800] font-bold mb-3">Related reading</p>
                  <div className="flex flex-col gap-2.5">
                    {[
                      { href: '/blog/golfnow-barter-model-explained', label: 'GolfNow Barter Model Explained' },
                      { href: '/blog/michigan-courses-leaving-golfnow', label: 'Michigan Courses Leaving GolfNow' },
                      { href: '/blog/metro-detroit-courses-on-golfnow', label: 'Metro Detroit Courses on GolfNow' },
                    ].map(({ href, label }) => (
                      <Link key={href} href={href} className="text-[13.5px] text-[#0F3D2E] font-medium leading-[1.4] hover:underline">
                        {label} <span className="text-[#E0A800]">→</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </aside>
            </FadeIn>

          </div>

          {/* CTA */}
          <FadeIn>
            <div className="mt-16 bg-[#0F3D2E] rounded-2xl p-8 sm:p-10 text-center">
              <p className="font-mono text-xs tracking-[0.16em] uppercase text-[#E0A800] font-bold mb-3">Founding Partner Program · Metro Detroit</p>
              <h2 className="font-display text-[#F4F1EA] tracking-[-0.02em] leading-tight mb-5" style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 400 }}>
                Stop paying GolfNow in tee times.
              </h2>
              <p className="text-[#F4F1EA]/72 text-base leading-relaxed max-w-md mx-auto mb-6">
                10 Founding Partner spots. Free for your first year. Zero barter, zero commissions. Live in 48 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/waitlist/course" className="rounded-md bg-[#E0A800] px-7 py-3.5 text-sm font-bold text-[#082419]">
                  Claim a founding spot →
                </Link>
                <Link href="/damage" className="rounded-md border border-[#F4F1EA]/30 px-7 py-3.5 text-sm font-semibold text-[#F4F1EA]">
                  Calculate your damage
                </Link>
              </div>
            </div>
          </FadeIn>

        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="bg-[#071f17] border-t border-black/5 px-6 py-10 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <TeeAheadLogo className="h-8 w-auto brightness-0 invert" />
          <p className="text-xs text-[#F4F1EA]/40">© 2026 TeeAhead, LLC. All rights reserved.</p>
          <nav className="flex gap-4 text-xs text-[#F4F1EA]/50">
            <Link href="/terms" className="hover:text-[#F4F1EA] transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-[#F4F1EA] transition-colors">Privacy</Link>
            <a href="mailto:hello@teeahead.com" className="hover:text-[#F4F1EA] transition-colors">Contact</a>
          </nav>
        </div>
      </footer>

    </div>
  )
}

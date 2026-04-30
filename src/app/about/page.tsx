import Link from 'next/link'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'
import { FadeIn } from '@/components/FadeIn'

export const metadata = {
  title: 'About TeeAhead',
  description: 'TeeAhead is a Metro Detroit golf platform built by Neil Barris and Billy Beslock. We give courses free tee sheet software and golfers a loyalty membership that beats GolfPass+ on every metric.',
  alternates: { canonical: '/about' },
  openGraph: {
    url: '/about',
    title: 'About TeeAhead — Built in Metro Detroit',
    description: 'TeeAhead is a Metro Detroit golf platform built by Neil Barris and Billy Beslock. Free software for courses, honest loyalty for golfers.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
}

function AboutPageSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': 'https://www.teeahead.com/about#page',
    url: 'https://www.teeahead.com/about',
    name: 'About TeeAhead',
    description: 'TeeAhead is a Metro Detroit golf platform built by Neil Barris and Billy Beslock.',
    mainEntity: { '@id': 'https://www.teeahead.com/#organization' },
    mentions: [
      { '@id': 'https://www.teeahead.com/#neil-barris' },
      { '@id': 'https://www.teeahead.com/#billy-beslock' },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      <AboutPageSchema />

      {/* ── Header / Nav ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#0F3D2E]/97 backdrop-blur border-b border-white/8">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <TeeAheadLogo className="h-14 w-auto brightness-0 invert" />
          </Link>
          <Link href="/" className="text-sm text-[#F4F1EA]/70 hover:text-[#F4F1EA] transition-colors">← Back</Link>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="bg-[#0F3D2E] px-6 py-20">
        <FadeIn>
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="font-display font-black text-[#F4F1EA] leading-tight tracking-[-0.02em]" style={{ fontSize: 'clamp(32px, 5vw, 48px)' }}>
              We&apos;re building the golf platform{' '}
              <em style={{ fontStyle: 'italic', color: '#E0A800' }}>courses actually want.</em>
            </h1>
            <p className="text-lg text-[#F4F1EA]/72 leading-relaxed max-w-2xl mx-auto">
              TeeAhead is a Metro Detroit golf platform that gives courses free tee sheet software and golfers a loyalty membership that beats GolfPass+ on every metric — zero barter, zero commissions, zero data extraction.
            </p>
          </div>
        </FadeIn>
      </section>

      {/* ── Story ─────────────────────────────────────────────── */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="font-display font-black text-[#0F3D2E] text-2xl tracking-[-0.01em]">Why we built this</h2>
          <p className="text-[#4A5550] leading-relaxed">
            We play golf in Metro Detroit. We watched courses hand GolfNow two free tee times a day — every day — as &quot;barter&quot; for the privilege of being listed on a platform that then markets their own data back to them. At $315 rack rate, that&apos;s <strong>$94,500 a year</strong> walking out the door of an average course.
          </p>
          <p className="text-[#4A5550] leading-relaxed">
            The courses we talked to weren&apos;t happy about it. They stayed because leaving felt complicated and there was no obvious alternative. So we decided to build one.
          </p>
          <p className="text-[#4A5550] leading-relaxed">
            TeeAhead is a complete booking and loyalty platform. We make money from golfer memberships — not from courses. That alignment matters. Courses get free software, own their golfer data, and keep every dollar. Golfers get a loyalty membership that actually rewards them for playing local.
          </p>
          <p className="text-[#4A5550] leading-relaxed">
            We&apos;re starting in Metro Detroit because we know these courses, we play these courses, and we want to get this right before we scale.
          </p>
        </div>
      </section>

      {/* ── Team ─────────────────────────────────────────────── */}
      <section className="px-6 py-16 bg-[#FAF7F2]">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display font-black text-[#0F3D2E] text-2xl tracking-[-0.01em] mb-10">The team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">

            {/* Neil */}
            <article className="bg-white rounded-2xl p-8 border border-black/8 shadow-sm space-y-4">
              <div className="size-14 rounded-full bg-[#0F3D2E]/10 flex items-center justify-center text-2xl font-black text-[#0F3D2E]">
                NB
              </div>
              <div>
                <h3 className="font-bold text-[#0F3D2E] text-lg">Neil Barris</h3>
                <p className="text-sm text-[#6B7770]">Co-Founder</p>
              </div>
              <p className="text-sm text-[#4A5550] leading-relaxed">
                Previously built <strong>Outing.golf</strong>, a golf group booking platform. Spent years learning what courses need from software — and what they don&apos;t. Based in Metro Detroit.
              </p>
              <a href="mailto:neil@teeahead.com" className="text-sm text-[#0F3D2E] font-medium hover:underline">neil@teeahead.com</a>
            </article>

            {/* Billy */}
            <article className="bg-white rounded-2xl p-8 border border-black/8 shadow-sm space-y-4">
              <div className="size-14 rounded-full bg-[#0F3D2E]/10 flex items-center justify-center text-2xl font-black text-[#0F3D2E]">
                BB
              </div>
              <div>
                <h3 className="font-bold text-[#0F3D2E] text-lg">Billy Beslock</h3>
                <p className="text-sm text-[#6B7770]">Co-Founder</p>
              </div>
              <p className="text-sm text-[#4A5550] leading-relaxed">
                Product thinker with a <strong>Ford Motor Company</strong> background. The mind behind the TeeAhead membership model and loyalty mechanic. Metro Detroit golfer who&apos;s been thinking about this problem for years.
              </p>
              <a href="mailto:billy@teeahead.com" className="text-sm text-[#0F3D2E] font-medium hover:underline">billy@teeahead.com</a>
            </article>

          </div>
        </div>
      </section>

      {/* ── Values ─────────────────────────────────────────────── */}
      <section className="px-6 py-16 bg-[#0F3D2E]">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display font-black text-[#F4F1EA] text-2xl tracking-[-0.01em] mb-10">What we believe</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                title: 'Courses own their data',
                body: 'Every booking, every golfer profile, every email address belongs to the course — not us. Full CSV export, anytime, no questions asked.',
              },
              {
                title: 'Flat pricing, no tricks',
                body: 'Free year one. $349/month after that. No barter tee times. No commissions. No hidden fees. You know exactly what you\'re paying and why.',
              },
              {
                title: 'Local first',
                body: 'We\'re building in Metro Detroit because it\'s home. We want to earn trust one course at a time before expanding. Depth over breadth.',
              },
            ].map(({ title, body }) => (
              <div
                key={title}
                className="rounded-xl p-6 space-y-3"
                style={{ background: 'rgba(244,241,234,0.07)', border: '1px solid rgba(244,241,234,0.12)' }}
              >
                <p className="font-semibold text-[#E0A800]">{title}</p>
                <p className="text-sm text-[#F4F1EA]/70 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact CTA ─────────────────────────────────────────── */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-xl mx-auto text-center space-y-6">
          <h2 className="font-display font-black text-[#0F3D2E] text-2xl tracking-[-0.01em]">
            Get in touch
          </h2>
          <p className="text-[#4A5550] leading-relaxed">
            We&apos;re reachable at{' '}
            <a href="mailto:support@teeahead.com" className="text-[#0F3D2E] font-medium hover:underline">support@teeahead.com</a>.
            If you manage a course and want to talk, email Neil directly at{' '}
            <a href="mailto:neil@teeahead.com" className="text-[#0F3D2E] font-medium hover:underline">neil@teeahead.com</a>.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/waitlist/course"
              className="px-6 py-3 rounded-xl bg-[#0F3D2E] text-[#F4F1EA] font-semibold text-sm hover:bg-[#0a2e22] transition-colors"
            >
              Apply as a Founding Partner
            </Link>
            <Link
              href="/waitlist/golfer"
              className="px-6 py-3 rounded-xl border border-[#0F3D2E]/30 text-[#0F3D2E] font-semibold text-sm hover:border-[#0F3D2E] hover:bg-[#0F3D2E]/5 transition-colors"
            >
              Join as a Golfer
            </Link>
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

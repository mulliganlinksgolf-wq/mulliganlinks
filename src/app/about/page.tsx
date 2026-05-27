import Link from 'next/link'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'
import { FadeIn } from '@/components/FadeIn'

export const metadata = {
  title: 'About',
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

      {/* Nav — match homepage */}
      <header className="bg-white border-b border-[#0F3D2E]/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/"><TeeAheadLogo className="h-12 w-auto" /></Link>
          <div className="flex items-center gap-5">
            <Link href="/features" className="text-sm text-[#0F3D2E]/70">Features</Link>
            <Link href="/pricing"  className="text-sm text-[#0F3D2E]/70">Pricing</Link>
            <Link href="/contact"  className="text-sm text-[#0F3D2E]/70">Contact</Link>
            <Link href="/waitlist/course" className="rounded-md bg-[#0F3D2E] px-4 py-2.5 text-sm font-semibold text-[#F4F1EA]">Claim a spot →</Link>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 sm:px-10 lg:px-16 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto">

          {/* Hero */}
          <FadeIn>
            <div className="flex items-center gap-3 mb-5">
              <span className="w-7 h-px bg-[#E0A800]" />
              <span className="font-mono text-xs tracking-[0.16em] uppercase text-[#6B7770]">About · Built in Metro Detroit</span>
            </div>
            <h1
              className="font-display text-[#0F3D2E] leading-[0.96] tracking-[-0.025em] max-w-4xl"
              style={{ fontSize: 'clamp(52px, 8.5vw, 88px)', fontWeight: 400 }}
            >
              We&apos;ve seen this from <em className="italic text-[#E0A800]">every&nbsp;angle.</em>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-[#1A1A1A]/78 leading-relaxed max-w-2xl">
              Operator and golfer. Tee sheet and tee box. Built in Metro Detroit by two people who&apos;d rather fix the problem than complain about it at the turn.
            </p>
          </FadeIn>

          {/* Two operators, two angles */}
          <FadeIn>
            <div className="mt-12 grid lg:grid-cols-2 gap-6">
              <FounderProfile
                name="Neil Barris"
                initials="NB"
                tag="The operator side"
                creds={[
                  '10 years enterprise software · Samsung, FinTech, Observability',
                  'Built Outing.golf — group bookings inside the industry',
                  'Watched what GolfNow was doing to courses he knew',
                ]}
                quote='"I built software for ten years before realizing the people who needed it most were the ones getting squeezed by it."'
                email="neil@teeahead.com"
                dark={false}
              />
              <FounderProfile
                name="Billy Beslock"
                initials="BB"
                tag="The golfer side"
                creds={[
                  'Career engineer at Ford Motor Company',
                  'Systems thinking inside one of the most operationally complex companies on earth',
                  'The regular who got tired of watching credits expire',
                ]}
                quote='"Every week I was paying booking fees at a course I played twice a month. I knew there had to be a better way."'
                email="billy@teeahead.com"
                dark={true}
              />
            </div>
          </FadeIn>

          {/* Values — annotated rows */}
          <FadeIn>
            <div className="mt-16">
              <div className="flex items-baseline gap-3 mb-6">
                <span className="font-mono text-xs tracking-[0.18em] uppercase text-[#E0A800] font-semibold">What we believe</span>
                <span className="flex-1 h-px bg-[#0F3D2E]/10" />
              </div>
              {[
                { h: 'Courses own their data, always.', d: 'Every booking, every email, every profile belongs to the course. Full CSV export, no questions asked.', stat: '100%', sub: 'export · always' },
                { h: 'Flat pricing, no tricks.', d: 'Free first year. $349/mo flat after. No barter, no commissions, no hidden fees.', stat: '$0', sub: 'commissions · ever' },
                { h: 'Local first.', d: "Metro Detroit is home. We're earning trust one course at a time before expanding. Depth, not breadth.", stat: '10', sub: 'founding courses' },
              ].map(({ h, d, stat, sub }) => (
                <div key={h} className="grid sm:grid-cols-[140px_1fr] gap-6 sm:gap-10 py-5 border-t border-[#0F3D2E]/10 items-center">
                  <div>
                    <p className="font-display text-[#0F3D2E] leading-[0.9] tracking-[-0.025em]" style={{ fontSize: 42, fontWeight: 400 }}>{stat}</p>
                    <p className="mt-1 font-mono text-[10px] tracking-[0.12em] uppercase text-[#6B7770]">{sub}</p>
                  </div>
                  <div>
                    <p className="font-display text-[#0F3D2E] tracking-[-0.015em] mb-1.5" style={{ fontSize: 26, fontWeight: 400 }}>{h}</p>
                    <p className="text-sm text-[#1A1A1A]/72 leading-[1.5] max-w-2xl">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* Closing CTA */}
          <FadeIn>
            <div className="mt-16 pt-10 border-t border-[#0F3D2E]/10 text-center">
              <p className="font-mono text-xs tracking-[0.16em] uppercase text-[#E0A800] font-semibold mb-3">Two phones, not a support queue</p>
              <h2 className="font-display text-[#0F3D2E] tracking-[-0.02em] leading-tight mb-6" style={{ fontSize: 'clamp(30px, 4vw, 40px)', fontWeight: 400 }}>
                Reach us directly.
              </h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/contact" className="rounded-md bg-[#0F3D2E] px-7 py-3.5 text-sm font-semibold text-[#F4F1EA]">
                  Reach Neil &amp; Billy →
                </Link>
                <Link href="/waitlist/course" className="rounded-md border border-[#0F3D2E] px-7 py-3.5 text-sm font-semibold text-[#0F3D2E]">
                  Claim a founding spot
                </Link>
              </div>
            </div>
          </FadeIn>

        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="bg-[#071f17] border-t border-black/5 px-6 py-16 mt-auto">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">

            {/* Column 1 — Brand */}
            <div className="col-span-2 sm:col-span-1 space-y-3">
              <TeeAheadLogo className="h-10 w-auto brightness-0 invert" />
              <p className="text-sm text-[#F4F1EA]/80 leading-relaxed">Book ahead. Play more. Own your golf.</p>
              <p className="text-xs text-[#F4F1EA]/50">Built in Metro Detroit.</p>
            </div>

            {/* Column 2 — For Courses */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#F4F1EA]/50 uppercase tracking-wider">For Courses</p>
              <nav className="flex flex-col gap-2 text-sm text-[#F4F1EA]/70">
                <Link href="/barter" className="hover:text-[#F4F1EA] transition-colors">Barter Calculator</Link>
                <Link href="/damage" className="hover:text-[#F4F1EA] transition-colors">GolfNow Damage Report</Link>
                <Link href="/software-cost" className="hover:text-[#F4F1EA] transition-colors">Software Cost Calculator</Link>
                <Link href="/waitlist/course" className="hover:text-[#F4F1EA] transition-colors">Join Waitlist</Link>
              </nav>
            </div>

            {/* Column 3 — Compare */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#F4F1EA]/50 uppercase tracking-wider">Compare</p>
              <nav className="flex flex-col gap-2 text-sm text-[#F4F1EA]/70">
                <Link href="/tee-time-software" className="hover:text-[#F4F1EA] transition-colors">Tee Time Software</Link>
                <Link href="/best-tee-sheet-software" className="hover:text-[#F4F1EA] transition-colors">Best Tee Sheet</Link>
                <Link href="/golfnow-alternative" className="hover:text-[#F4F1EA] transition-colors">GolfNow Alternative</Link>
                <Link href="/golf-course-booking-software" className="hover:text-[#F4F1EA] transition-colors">Booking Software</Link>
              </nav>
            </div>

            {/* Column 4 — Company */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#F4F1EA]/50 uppercase tracking-wider">Company</p>
              <nav className="flex flex-col gap-2 text-sm text-[#F4F1EA]/70">
                <Link href="/contact" className="hover:text-[#F4F1EA] transition-colors">Contact</Link>
                <Link href="/about" className="hover:text-[#F4F1EA] transition-colors">About</Link>
                <Link href="/terms" className="hover:text-[#F4F1EA] transition-colors">Terms</Link>
                <Link href="/privacy" className="hover:text-[#F4F1EA] transition-colors">Privacy</Link>
              </nav>
            </div>

          </div>
          <div className="border-t border-[#F4F1EA]/10 pt-6 text-center space-y-1">
            <p className="text-xs text-[#F4F1EA]/50">Metro Detroit, Michigan</p>
            <p className="text-xs text-[#F4F1EA]/40">© 2026 TeeAhead, LLC. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  )
}

function FounderProfile({ name, initials, tag, creds, quote, email, dark }: {
  name: string; initials: string; tag: string; creds: string[]; quote: string; email: string; dark: boolean;
}) {
  const cls = dark
    ? { card: 'bg-[#0F3D2E] text-[#F4F1EA]', mute: 'text-[#F4F1EA]/65', subhead: 'text-[#F4F1EA]/55', accent: 'text-[#E0A800]', avatar: 'bg-[#E0A800] text-[#082419]', border: 'border-[#E0A800]' }
    : { card: 'bg-white border border-[#0F3D2E]/10 text-[#1A1A1A]', mute: 'text-[#1A1A1A]/72', subhead: 'text-[#6B7770]', accent: 'text-[#0F3D2E]', avatar: 'bg-[#0F3D2E] text-[#E0A800]', border: 'border-[#0F3D2E]' }
  return (
    <article className={`rounded-2xl p-7 sm:p-8 ${cls.card}`}>
      <div className="flex items-center gap-4 mb-4">
        <div className={`size-20 rounded-full flex items-center justify-center font-display text-[28px] ${cls.avatar}`} style={{ fontWeight: 400 }}>
          {initials}
        </div>
        <div>
          <p className={`font-mono text-[10.5px] tracking-[0.14em] uppercase font-bold mb-1 ${cls.accent}`}>{tag}</p>
          <h3 className="font-display text-[30px] leading-none tracking-[-0.015em]" style={{ fontWeight: 400 }}>{name}</h3>
          <p className={`font-mono text-[10px] tracking-[0.14em] uppercase mt-1 ${cls.subhead}`}>Co-Founder</p>
        </div>
      </div>
      <ul className="flex flex-col gap-1.5 mb-5">
        {creds.map((c) => (
          <li key={c} className={`grid grid-cols-[12px_1fr] gap-2.5 text-[13px] leading-[1.45] ${cls.mute}`}>
            <span className={`font-mono ${cls.accent}`}>—</span>{c}
          </li>
        ))}
      </ul>
      <blockquote className={`pl-4 border-l-2 font-display italic text-[17px] leading-[1.4] ${cls.border}`} style={{ fontWeight: 400 }}>
        {quote}
      </blockquote>
      <p className="mt-4 text-[13px]">
        <span className={cls.subhead}>Email — </span>
        <a href={`mailto:${email}`} className={`font-medium underline underline-offset-[3px] ${cls.accent}`}>{email}</a>
      </p>
    </article>
  )
}

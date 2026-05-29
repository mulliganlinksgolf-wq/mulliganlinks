import Link from 'next/link'
import { FadeIn } from '@/components/FadeIn'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata = {
  title: 'About',
  description: 'TeeAhead is a Metro Detroit golf platform built by Neil Barris and Billy Beslock. We give courses free tee sheet software and golfers a loyalty membership that beats GolfPass+ on every metric.',
  alternates: { canonical: '/about' },
  openGraph: {
    url: '/about',
    title: 'About TeeAhead, Built in Metro Detroit',
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

      <SiteHeader />

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
                  'Built Outing.golf, group bookings inside the industry',
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

          {/* Values, annotated rows */}
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

      <SiteFooter />

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
        <span className={cls.subhead}>Email, </span>
        <a href={`mailto:${email}`} className={`font-medium underline underline-offset-[3px] ${cls.accent}`}>{email}</a>
      </p>
    </article>
  )
}

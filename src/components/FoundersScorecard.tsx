import Link from 'next/link'
import type { ReactNode } from 'react'

type Hole = {
  n: string
  par: string
  notes: ReactNode
  hero?: boolean
  accent?: string
}

const HOLES: Hole[] = [
  {
    n: '0',
    par: 'The Manifesto',
    hero: true,
    notes: (
      <span
        className="font-display text-[#0F3D2E] tracking-[-0.015em] leading-[1.05]"
        style={{ fontSize: 'clamp(22px, 2.5vw, 32px)', fontWeight: 400 }}
      >
        Local golf, returned to the people who{' '}
        <em className="italic text-[#E0A800]">actually</em> play it.
      </span>
    ),
  },
  {
    n: '1',
    par: 'The Read',
    notes: (
      <>
        Between the two of us, we&apos;ve seen this problem from{' '}
        <em>every angle</em>. Operator and golfer. Tee sheet and tee box.
      </>
    ),
  },
  {
    n: '2',
    par: "Neil's Side",
    notes: (
      <>
        Neil spent years building{' '}
        <a href="https://outing.golf" className="text-[#0F3D2E] underline decoration-dotted">
          Outing.golf
        </a>{' '}
        inside the industry —
        watching courses get squeezed by a company that&apos;s never set foot on
        their property.
      </>
    ),
  },
  {
    n: '3',
    par: "Billy's Side",
    notes: (
      <>
        Billy&apos;s been the golfer on the other side, paying booking fees,
        watching credits expire, feeling like a transaction instead of a regular.
      </>
    ),
  },
  {
    n: '4',
    par: 'The Why',
    accent: 'text-[#C0392B]',
    notes: (
      <>
        We&apos;re just like every other golfer that wants something more reasonable and innovative.
      </>
    ),
  },
  {
    n: '5',
    par: 'The Ask',
    notes: (
      <>
        If you run a course in Metro Detroit, reach out to Neil or Billy directly —{' '}
        <a
          href="mailto:neil@teeahead.com"
          className="text-[#0F3D2E] underline decoration-dotted"
        >
          neil@teeahead.com
        </a>
        {' '}or{' '}
        <a
          href="mailto:billy@teeahead.com"
          className="text-[#0F3D2E] underline decoration-dotted"
        >
          billy@teeahead.com
        </a>
        .
      </>
    ),
  },
]

export function FoundersScorecard({}: { spotsRemaining?: number }) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-[#FDFAF4] rounded-sm overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.18)]">
        {/* Header */}
        <div className="bg-[#0F3D2E] px-6 py-5">
          <div className="flex justify-between items-start">
            <div className="text-[#F4F1EA] text-xl font-bold tracking-tight">
              <span className="text-[#C9A84C] italic">T</span>eeAhead
            </div>
            <div className="text-right text-[10px] tracking-[0.12em] text-[#F4F1EA]/55 leading-relaxed uppercase">
              Est. 2026
              <br />
              Detroit · MI
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#F4F1EA]/15 flex justify-between text-[10px] tracking-[0.14em] text-[#F4F1EA]/55 uppercase">
            <span>Founders&apos; Scorecard</span>
            <span>Card No. 001</span>
          </div>
        </div>

        {/* Metadata rows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-[#D4E4DC]">
          <div className="px-4 py-2.5 border-r border-[#D4E4DC]">
            <span className="text-[9px] tracking-[0.14em] uppercase text-[#6B7770] font-sans">
              Course
            </span>
            <span className="text-[13px] text-[#1A1A1A] ml-2">Metro Detroit</span>
          </div>
          <div className="px-4 py-2.5">
            <span className="text-[9px] tracking-[0.14em] uppercase text-[#6B7770] font-sans">
              Date
            </span>
            <span className="text-[13px] text-[#1A1A1A] ml-2">April 2026</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 border-b-2 border-[#0F3D2E]">
          <div className="px-4 py-2.5 border-r border-[#D4E4DC]">
            <span className="text-[9px] tracking-[0.14em] uppercase text-[#6B7770] font-sans">
              Conditions
            </span>
            <span className="text-[13px] text-[#1A1A1A] ml-2">Tailwind</span>
          </div>
          <div className="px-4 py-2.5">
            <span className="text-[9px] tracking-[0.14em] uppercase text-[#6B7770] font-sans">
              Tee
            </span>
            <span className="text-[13px] text-[#1A1A1A] ml-2">Founders</span>
          </div>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[44px_100px_1fr] sm:grid-cols-[70px_200px_1fr] bg-[#0F3D2E]">
          <div className="px-3 sm:px-5 py-2 text-[9px] tracking-[0.14em] text-[#F4F1EA]/70 uppercase">
            Hole
          </div>
          <div className="px-3 sm:px-5 py-2 text-[9px] tracking-[0.14em] text-[#F4F1EA]/70 uppercase">
            Par
          </div>
          <div className="px-3 sm:px-5 py-2 text-[9px] tracking-[0.14em] text-[#F4F1EA]/70 uppercase">
            <span className="hidden sm:inline">Notes from the Round</span>
            <span className="sm:hidden">Notes</span>
          </div>
        </div>

        {/* Holes */}
        {HOLES.map((h) => (
          <div
            key={h.n}
            className={`grid grid-cols-[44px_100px_1fr] sm:grid-cols-[70px_200px_1fr] border-b border-[#0F3D2E]/10 last:border-b-0 ${
              h.hero ? 'bg-[#F4F1EA] py-5 sm:py-6' : 'bg-white py-4'
            }`}
          >
            <div
              className={`px-3 sm:px-5 font-display tracking-[-0.02em] leading-none ${
                h.accent || 'text-[#0F3D2E]'
              }`}
              style={{ fontWeight: 400 }}
            >
              <span className="sm:hidden" style={{ fontSize: h.hero ? 32 : 24 }}>{h.n}</span>
              <span className="hidden sm:inline" style={{ fontSize: h.hero ? 44 : 30 }}>{h.n}</span>
            </div>
            <div className="px-3 sm:px-5">
              <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#6B7770] font-semibold mb-1">Par</div>
              <div className={`font-semibold text-[#1A1A1A] leading-tight ${h.hero ? 'text-[15px] sm:text-[17px]' : 'text-[13px] sm:text-sm'}`}>
                {h.par}
              </div>
            </div>
            <div className={`px-3 sm:px-5 leading-relaxed text-[#1A1A1A] ${
              h.hero ? 'text-[15px] sm:text-base' : 'text-[13px] sm:text-sm opacity-85'
            }`}>
              {h.notes}
            </div>
          </div>
        ))}

        {/* Footer, signatures + CTAs */}
        <div className="border-t border-[#0F3D2E]/10 px-4 sm:px-8 py-5 grid sm:grid-cols-2 gap-6 items-center">
          {/* Left: signatures */}
          <div className="flex gap-5 sm:gap-8 flex-wrap">
            <div>
              <div
                className="text-[#0F3D2E] italic leading-none whitespace-nowrap"
                style={{ fontFamily: '"Snell Roundhand", "Lucida Handwriting", cursive', fontSize: 22 }}
              >
                Neil Barris
              </div>
              <p className="mt-1 font-mono text-[9px] tracking-[0.14em] uppercase text-[#6B7770]">Co-Founder</p>
            </div>
            <div>
              <div
                className="text-[#0F3D2E] italic leading-none whitespace-nowrap"
                style={{ fontFamily: '"Snell Roundhand", "Lucida Handwriting", cursive', fontSize: 22 }}
              >
                Billy Beslock
              </div>
              <p className="mt-1 font-mono text-[9px] tracking-[0.14em] uppercase text-[#6B7770]">Co-Founder</p>
            </div>
          </div>

          {/* Right: CTAs */}
          <div className="sm:text-right">
            <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#6B7770] mb-2">
              Total · Always One TeeAhead
            </p>
            <div className="inline-flex flex-wrap gap-2 sm:justify-end">
              <Link
                href="/waitlist/course"
                className="px-5 py-2.5 bg-[#E0A800] text-[#082419] rounded-md text-[12.5px] font-bold hover:bg-[#E0A800]/90"
              >
                Claim a founding spot →
              </Link>
              <Link
                href="/waitlist/golfer"
                className="px-3.5 py-2.5 text-[#0F3D2E] text-[12.5px] font-semibold underline underline-offset-[3px] hover:text-[#0F3D2E]/80"
              >
                Join as a golfer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

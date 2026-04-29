import Link from 'next/link'

const HOLES = [
  {
    number: 1,
    par: 'The Read',
    notes: (
      <>
        Between the two of us, we&apos;ve seen this problem from{' '}
        <em>every angle</em>. Operator and golfer. Tee sheet and tee box.
      </>
    ),
  },
  {
    number: 2,
    par: "Neil's Side",
    notes: (
      <>
        Neil spent years building <em>Outing.golf</em> inside the industry —
        watching courses get squeezed by a company that&apos;s never set foot on
        their property.
      </>
    ),
  },
  {
    number: 3,
    par: "Billy's Side",
    notes: (
      <>
        Billy&apos;s been the golfer on the other side — paying booking fees,
        watching credits expire, feeling like a transaction instead of a regular.
      </>
    ),
  },
  {
    number: 4,
    par: 'The Why',
    notes: (
      <>
        We&apos;re not building TeeAhead because the market is hot. We&apos;re
        building it because <em>we&apos;re both tired of watching it happen</em>.
      </>
    ),
    redNumber: true,
  },
  {
    number: 5,
    par: 'The Ask',
    notes: (
      <>
        If you run a course in Metro Detroit, reach out to Neil directly —{' '}
        <a
          href="mailto:neil@teeahead.com"
          className="text-[#0F3D2E] underline decoration-dotted"
        >
          neil@teeahead.com
        </a>
        . If you&apos;re a golfer who feels the same way —{' '}
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

export function FoundersScorecard() {
  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-center text-xs font-bold tracking-[0.14em] uppercase text-[#F4F1EA]/35 mb-10">
        Why we&apos;re building TeeAhead
      </p>

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
        <div className="grid grid-cols-[56px_80px_1fr] bg-[#0F3D2E]">
          <div className="px-3 py-2 text-[9px] tracking-[0.14em] text-[#F4F1EA]/70 uppercase">
            Hole
          </div>
          <div className="px-3 py-2 text-[9px] tracking-[0.14em] text-[#F4F1EA]/70 uppercase border-l border-[#F4F1EA]/15">
            Par
          </div>
          <div className="px-3 py-2 text-[9px] tracking-[0.14em] text-[#F4F1EA]/70 uppercase border-l border-[#F4F1EA]/15">
            Notes from the Round
          </div>
        </div>

        {/* Holes */}
        {HOLES.map((hole, i) => (
          <div
            key={hole.number}
            className={`grid grid-cols-[56px_80px_1fr] ${
              i < HOLES.length - 1 ? 'border-b border-[#D4E4DC]' : 'border-b-2 border-[#0F3D2E]'
            }`}
          >
            <div
              className={`px-3 py-4 text-[28px] font-bold text-center border-r border-[#D4E4DC] ${
                hole.redNumber ? 'text-[#C0392B]' : 'text-[#0F3D2E]'
              }`}
            >
              {hole.number}
            </div>
            <div className="px-3 py-4 border-r border-[#D4E4DC]">
              <div className="text-[9px] tracking-[0.1em] uppercase text-[#6B7770] font-sans mb-1">
                Par
              </div>
              <div className="text-[13px] font-bold text-[#1A1A1A]">{hole.par}</div>
            </div>
            <div className="px-4 py-4 text-[13px] text-[#1A1A1A] leading-relaxed">
              {hole.notes}
            </div>
          </div>
        ))}

        {/* Signatures */}
        <div className="grid grid-cols-1 sm:grid-cols-2 border-b-2 border-[#0F3D2E]">
          <div className="px-5 py-5 border-r border-[#D4E4DC]">
            <div className="text-[22px] font-bold italic text-[#1A1A1A] border-b border-[#1A1A1A] pb-1 mb-1.5 inline-block">
              Billy Beslock
            </div>
            <div className="text-[9px] tracking-[0.12em] uppercase text-[#6B7770] font-sans">
              Co-Founder
            </div>
          </div>
          <div className="px-5 py-5 text-right">
            <div className="text-[22px] font-bold italic text-[#1A1A1A] border-b border-[#1A1A1A] pb-1 mb-1.5 inline-block">
              Neil Barris
            </div>
            <div className="text-[9px] tracking-[0.12em] uppercase text-[#6B7770] font-sans">
              Co-Founder
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#0F3D2E] px-5 py-4 flex justify-between items-center">
          <span className="text-[10px] tracking-[0.14em] uppercase text-[#F4F1EA]/55">
            Total · Always One TeeAhead
          </span>
          <Link
            href="/waitlist/golfer"
            className="bg-[#C9A84C] text-[#0F3D2E] text-[13px] font-bold px-5 py-2.5 rounded-sm hover:bg-[#D4B86A] transition-colors"
          >
            Join the Waitlist →
          </Link>
        </div>
      </div>
    </div>
  )
}

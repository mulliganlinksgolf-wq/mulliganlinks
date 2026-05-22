'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'

const HOLES = [
  { n: '01', par: 5, yds: 547, name: 'The Damage',     anchor: '#hole-01' },
  { n: '02', par: 4, yds: 412, name: 'The Barter',     anchor: '#hole-02' },
  { n: '03', par: 4, yds: 389, name: 'The Product',    anchor: '#hole-03' },
  { n: '04', par: 3, yds: 178, name: 'The Membership', anchor: '#hole-04' },
  { n: '05', par: 5, yds: 521, name: 'Live in 48hrs',  anchor: '#hole-05' },
  { n: '06', par: 4, yds: 401, name: 'The Pricing',    anchor: '#hole-06' },
  { n: '07', par: 4, yds: 423, name: 'The Proof',      anchor: '#hole-07' },
  { n: '08', par: 3, yds: 165, name: 'The Q&A',        anchor: '#hole-08' },
  { n: '09', par: 5, yds: 558, name: 'Sink the Putt',  anchor: '#hole-09' },
]

export function YardageShell({
  initialHole = '01',
  children,
}: {
  initialHole?: string
  children: React.ReactNode
}) {
  const [currentHole, setCurrentHole] = useState(initialHole)

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>('section[id^="hole-"]')
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const n = entry.target.id.replace('hole-', '')
            setCurrentHole(n)
          }
        }
      },
      { rootMargin: '-90px 0px -70% 0px', threshold: 0 }
    )
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      <header className="bg-[#082419] text-[#F4F1EA] border-b-2 border-[#E0A800] px-6 sm:px-10 lg:px-14 py-4 flex items-center justify-between sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-3">
          <TeeAheadLogo className="h-10 w-auto brightness-0 invert" />
        </Link>
        <span className="hidden sm:inline-block font-mono text-[10.5px] tracking-[0.24em] uppercase text-[#F4F1EA]/65 font-semibold">
          Founders Tee · Card 001
        </span>
        <Link
          href="/waitlist/course"
          className="rounded-md bg-[#E0A800] px-4 py-2 text-[12.5px] font-bold text-[#082419] hover:bg-[#E0A800]/90"
        >
          Claim a spot →
        </Link>
      </header>

      <div className="flex-1 grid lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:flex flex-col bg-[#082419] text-[#F4F1EA] sticky top-[76px] self-start max-h-[calc(100vh-76px)] overflow-y-auto">
          <div className="grid grid-cols-[30px_1fr_26px_36px] gap-0 px-4 py-2.5 font-mono text-[8.5px] tracking-[0.18em] uppercase font-bold text-[#F4F1EA]/50 border-b border-[#F4F1EA]/10">
            <span>H</span>
            <span>Hole</span>
            <span className="text-center">Par</span>
            <span className="text-right">Yds</span>
          </div>

          {HOLES.map((h) => {
            const on = h.n === currentHole
            return (
              <Link
                key={h.n}
                href={h.anchor}
                className={`grid grid-cols-[30px_1fr_26px_36px] gap-0 px-4 py-3 border-b border-[#F4F1EA]/8 items-baseline ${
                  on
                    ? 'bg-black/30 border-l-[3px] border-l-[#E0A800] pl-[13px]'
                    : 'border-l-[3px] border-l-transparent hover:bg-black/15'
                }`}
              >
                <span
                  className="font-display leading-none"
                  style={{
                    fontSize: 18,
                    fontWeight: 400,
                    color: on ? '#E0A800' : 'rgba(244,241,234,0.75)',
                    fontStyle: on ? 'italic' : 'normal',
                  }}
                >
                  {h.n.replace(/^0/, '')}
                </span>
                <span
                  className={`text-[12px] leading-tight ${
                    on ? 'font-bold text-[#F4F1EA]' : 'font-normal text-[#F4F1EA]/85'
                  }`}
                >
                  {h.name}
                </span>
                <span className="font-mono text-[10px] text-center text-[#F4F1EA]/55">{h.par}</span>
                <span className="font-mono text-[10px] text-right text-[#F4F1EA]/55">{h.yds}</span>
              </Link>
            )
          })}

          <div className="mt-auto px-4 py-3.5 bg-black/30 border-t border-[#E0A800]/30">
            <div className="flex justify-between items-baseline">
              <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#E0A800] font-bold">Total</span>
              <span
                className="font-display text-[26px] text-[#E0A800] leading-none tracking-[-0.02em]"
                style={{ fontWeight: 400 }}
              >
                3,594
              </span>
            </div>
            <div className="mt-1 font-mono text-[8.5px] tracking-[0.16em] uppercase text-[#F4F1EA]/50 font-semibold">
              9 holes · par 37
            </div>
          </div>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>

      <div className="bg-[#FAF7F2] border-t border-[#0F3D2E]/10 px-6 sm:px-10 lg:px-14 py-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[9.5px] tracking-[0.18em] uppercase text-[#6B7770] font-semibold">
        <span>Pressed in Detroit, 2026</span>
        <span>Founders Edition</span>
      </div>
    </div>
  )
}

export function HoleHeader({
  num,
  par,
  yds,
  name,
  dark,
}: {
  num: string
  par: number
  yds: number
  name: string
  dark?: boolean
}) {
  return (
    <div className="flex items-baseline gap-3.5 mb-4">
      <span
        className="font-display leading-[0.9] tracking-[-0.02em] text-[#E0A800]"
        style={{ fontSize: 36, fontWeight: 400 }}
      >
        {num}
      </span>
      <span
        className={`font-mono text-[10.5px] tracking-[0.18em] uppercase font-semibold ${
          dark ? 'text-[#F4F1EA]/65' : 'text-[#6B7770]'
        }`}
      >
        Par {par} · {yds} yds · {name}
      </span>
      <span className={`flex-1 h-px ${dark ? 'bg-[#F4F1EA]/15' : 'bg-[#0F3D2E]/10'}`} />
    </div>
  )
}

export function HoleFooter({
  note,
  nextHole,
  dark,
}: {
  note: string
  nextHole?: string
  dark?: boolean
}) {
  return (
    <div
      className={`mt-8 pt-3.5 border-t border-dashed font-mono text-[9.5px] tracking-[0.16em] uppercase font-semibold flex flex-wrap justify-between gap-2 ${
        dark
          ? 'border-[#F4F1EA]/20 text-[#F4F1EA]/55'
          : 'border-[#0F3D2E]/25 text-[#6B7770]'
      }`}
    >
      <span>{note}</span>
      {nextHole && <span>{nextHole} ↓</span>}
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'

const FAQS = [
  {
    q: 'Is TeeAhead really free for courses for founding partners?',
    a: (
      <>
        Yes — completely free for the first 10 Founding Partner courses for your full first year. No barter tee times, no commissions, no hidden fees. After year one, it&apos;s a flat $349/month. No long-term contract. Cancel anytime.
      </>
    ),
  },
  {
    q: 'When does TeeAhead launch?',
    a: (
      <>
        We&apos;re onboarding Founding Partner courses now and targeting a full golfer-facing launch in Summer 2026. Founding Partners go live within 48 hours of signing — your golfers can start booking before the public launch.
      </>
    ),
  },
  {
    q: 'What if my course already uses EZLinks, foreUP, or another system?',
    a: (
      <>
        TeeAhead is designed to work alongside or replace your current booking system. We handle the setup and can walk you through the transition. Email Neil or Billy directly at{' '}
        <a href="mailto:neil@teeahead.com" className="underline text-[#0F3D2E] hover:text-[#0F3D2E]/80">
          neil@teeahead.com
        </a>{' '}
        or{' '}
        <a href="mailto:billy@teeahead.com" className="underline text-[#0F3D2E] hover:text-[#0F3D2E]/80">
          billy@teeahead.com
        </a>{' '}
        — they&apos;ll give you a straight answer about your specific setup.
      </>
    ),
  },
  {
    q: 'Will my golfers actually use this?',
    a: (
      <>
        That depends on you telling them about it — which is the only thing we ask. Golfers pay zero booking fees on TeeAhead vs. fees they pay elsewhere. That&apos;s a strong reason to switch. We&apos;ll give you the materials to communicate it.
      </>
    ),
  },
  {
    q: "Who's behind TeeAhead?",
    a: (
      <>
        Neil Barris and Billy Beslock, both based in Metro Detroit. Neil built{' '}
        <Link href="http://Outing.golf" className="underline text-[#0F3D2E] hover:text-[#0F3D2E]/80">
          Outing.golf
        </Link>{' '}
        inside the golf industry. Billy&apos;s the golfer who got tired of paying fees and watching loyalty points expire. We&apos;re reachable directly —{' '}
        <a href="mailto:neil@teeahead.com" className="underline text-[#0F3D2E] hover:text-[#0F3D2E]/80">
          neil@teeahead.com
        </a>{' '}
        and{' '}
        <a href="mailto:billy@teeahead.com" className="underline text-[#0F3D2E] hover:text-[#0F3D2E]/80">
          billy@teeahead.com
        </a>
        . Not a support ticket system.
      </>
    ),
  },
]

export function HomepageFaq() {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  return (
    <section className="bg-[#FAF7F2] px-6 py-20 border-t border-black/5">
      <div className="max-w-3xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <p className="text-xs font-bold tracking-[0.14em] uppercase text-[#9DAA9F]">FAQ</p>
          <h2
            className="font-display font-extrabold text-[#1A1A1A] tracking-[-0.02em]"
            style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}
          >
            Common questions
          </h2>
        </div>

        <div className="divide-y divide-black/8">
          {FAQS.map(({ q, a }, i) => (
            <div key={i}>
              <button
                type="button"
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 py-5 text-left"
                aria-expanded={openIdx === i}
              >
                <span className="font-semibold text-[#1A1A1A] text-base leading-snug">{q}</span>
                <span
                  className="flex-shrink-0 size-6 rounded-full border border-black/15 flex items-center justify-center text-[#6B7770] transition-transform duration-200"
                  style={{ transform: openIdx === i ? 'rotate(45deg)' : 'rotate(0deg)' }}
                  aria-hidden="true"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
              </button>
              <div
                className="overflow-hidden transition-all duration-200"
                style={{ maxHeight: openIdx === i ? '600px' : '0px' }}
              >
                <p className="pb-5 text-sm text-[#6B7770] leading-relaxed">{a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

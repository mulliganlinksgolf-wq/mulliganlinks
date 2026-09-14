'use client'

import { useState } from 'react'
import { GolferWaitlistForm } from './GolferWaitlistForm'

type Tier = {
  key: string
  name: string
  price: string
  period: string
  badge: string | null
  features: string[]
}

export function TierPicker({ tiers, initialTier }: { tiers: Tier[]; initialTier: string }) {
  const [selectedTier, setSelectedTier] = useState(initialTier)

  return (
    <>
      <section id="waitlist-form" tabIndex={-1} aria-label="Join the free waitlist" className="scroll-mt-24 px-6 pb-12 outline-none">
        <div className="max-w-xl mx-auto bg-[#0F3D2E] rounded-2xl p-6 sm:p-8 text-[#F4F1EA]">
          <h2 className="font-display text-2xl mb-2">Be first to hear when we launch.</h2>
          <p className="text-sm text-white/80 mb-6">Free to join. No credit card. No membership commitment.</p>
          <GolferWaitlistForm tier={selectedTier} />
        </div>
      </section>
      <section id="pricing" className="scroll-mt-24 bg-[#FAF7F2] px-6 py-10 border-t border-[#0F3D2E]/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-2xl font-display font-black text-[#0F3D2E] mb-4 tracking-[-0.01em]">
            Explore memberships for later.
          </h2>
          <p className="text-center text-[#53645A] mb-10">No need to choose now. These are optional preferences for launch.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {tiers.map((tierItem) => {
              const isEagle = tierItem.key === 'eagle'
              const isSelected = selectedTier === tierItem.key
              return (
                <button
                  key={tierItem.key}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    setSelectedTier(tierItem.key)
                    const form = document.getElementById('waitlist-form')
                    form?.scrollIntoView({ block: 'start' })
                    document.getElementById('email')?.focus({ preventScroll: true })
                  }}
                  className={[
                    'relative rounded-2xl bg-white p-6 flex flex-col gap-4 cursor-pointer text-left w-full',
                    'transition-all duration-150 hover:-translate-y-1 hover:shadow-lg',
                    isEagle
                      ? '-translate-y-2 border-2 border-[#E0A800] shadow-[0_8px_32px_rgba(224,168,0,0.18)]'
                      : isSelected
                        ? 'border-2 border-[#1B4332] ring-2 ring-[#E0A800] shadow-sm'
                        : 'border border-black/8 shadow-sm hover:border-[#0F3D2E]/30',
                  ].join(' ')}
                >
                  {tierItem.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E0A800] text-[#0a0a0a] text-xs font-bold px-3 py-1 rounded-full tracking-wide uppercase whitespace-nowrap">
                      {tierItem.badge}
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute -top-3 right-4 bg-[#0F3D2E] text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      ✓ Selected
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold tracking-[0.12em] uppercase text-[#6B7770] mb-1">{tierItem.name}</p>
                    <p className="text-3xl font-black text-[#0F3D2E] leading-none">
                      {tierItem.price}
                      <span className="text-base font-semibold text-[#9DAA9F] ml-1">{tierItem.period}</span>
                    </p>
                  </div>
                  <ul className="flex-1 space-y-2">
                    {tierItem.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-[#1A1A1A]">
                        <span className="text-[#E0A800] mt-0.5 shrink-0">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div
                    className={[
                      'w-full text-center text-sm font-semibold py-2.5 rounded-lg transition-colors',
                      isEagle
                        ? 'bg-[#E0A800] text-[#0a0a0a] hover:bg-[#E0A800]/90'
                        : 'border-2 border-[#0F3D2E] text-[#0F3D2E] hover:bg-[#0F3D2E]/8',
                    ].join(' ')}
                  >
                    Continue with {tierItem.name} →
                  </div>
                </button>
              )
            })}
          </div>
          <p className="text-xs text-[#9DAA9F] text-center mt-4 italic">
            Each course varies on how they would like to promote their deals.
          </p>
        </div>
      </section>


    </>
  )
}

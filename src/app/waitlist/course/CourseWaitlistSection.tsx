'use client'

import { useState, Suspense } from 'react'
import { GolfNowCountdown } from './GolfNowCountdown'
import { CourseWaitlistForm } from './CourseWaitlistForm'

interface CourseWaitlistSectionProps {
  spotsRemaining: number
}

export function CourseWaitlistSection({ spotsRemaining }: CourseWaitlistSectionProps) {
  const [expiryDate, setExpiryDate] = useState('')

  return (
    <>
      {/* GolfNow Countdown */}
      <section className="bg-white px-6 py-12 border-t border-black/5">
        <GolfNowCountdown expiryDate={expiryDate} onExpiryChange={setExpiryDate} />
      </section>

      {/* Waitlist Form */}
      <section className="px-6 py-16 bg-[#FAF7F2]">
        <div className="max-w-xl mx-auto">
          <div className="bg-[#0F3D2E] rounded-2xl p-8 sm:p-10">
            <p className="text-xs font-bold tracking-[0.14em] uppercase text-[#E0A800] mb-2">
              COURSE WAITLIST — FOUNDING PARTNER PROGRAM
            </p>
            {spotsRemaining > 0 && spotsRemaining < 10 && (
              <p className="text-sm text-[#E0A800]/80 mb-2">{spotsRemaining} of 10 founding spots remaining.</p>
            )}
            <p className="text-lg font-semibold text-[#F4F1EA] mb-8">Bring TeeAhead to your course.</p>
            <Suspense fallback={null}>
              <CourseWaitlistForm prefillExpiryDate={expiryDate || undefined} />
            </Suspense>
          </div>
        </div>
      </section>
    </>
  )
}

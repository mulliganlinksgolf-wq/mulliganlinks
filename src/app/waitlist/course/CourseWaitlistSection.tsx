import { Suspense } from 'react'
import { CourseWaitlistForm } from './CourseWaitlistForm'

export function CourseWaitlistSection() {
  return (
    <section id="apply" aria-label="Course interest form" className="scroll-mt-24 rounded-2xl bg-[#0F3D2E] p-6 sm:p-8 text-white">
      <h2 className="font-display text-3xl mb-3">Let’s start with your course.</h2>
      <p className="text-white/80 mb-6">Three details are all we need to start a conversation.</p>
      <Suspense fallback={<p>Loading form…</p>}><CourseWaitlistForm /></Suspense>
    </section>
  )
}

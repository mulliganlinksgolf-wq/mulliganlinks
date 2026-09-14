import Link from 'next/link'
import { CourseWaitlistSection } from './CourseWaitlistSection'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata = {
  title: 'Talk to TeeAhead About Your Course',
  description: 'Explore TeeAhead for your Metro Detroit golf course. Tell us your course name, contact name, and email to start a conversation. No commitment required.',
  alternates: { canonical: '/waitlist/course' },
  openGraph: { url: '/waitlist/course', title: 'Bring TeeAhead to Your Course', description: 'Explore the Founding Partner program. Start with a simple introduction.' },
}

export default function CourseWaitlistPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <SiteHeader />
      <main>
        <div className="max-w-6xl mx-auto px-6 py-10 sm:py-16 grid lg:grid-cols-2 gap-8 lg:gap-14 items-start">
          <section className="text-[#0F3D2E]">
            <p className="text-xs uppercase tracking-widest text-[#53645A] mb-4">For Metro Detroit course operators</p>
            <h1 className="font-display text-4xl sm:text-6xl leading-tight">A better fit for your course starts with a conversation.</h1>
            <p className="mt-5 text-lg text-[#53645A]">Explore tee sheet software without barter or commissions, with golf rewards that bring players back.</p>
            <p className="mt-4 text-[#53645A]">We’re building our Metro Detroit network. Tell us about your course, and Neil or Billy will follow up to discuss your needs, availability, and setup.</p>
            <p className="mt-5 text-sm text-[#53645A]">Looking to play? <Link href="/waitlist/golfer" className="underline font-semibold">Join the free golfer waitlist →</Link></p>
          </section>
          <CourseWaitlistSection />
        </div>
        <section className="max-w-6xl mx-auto px-6 pb-14 text-[#0F3D2E]">
          <h2 className="font-display text-3xl mb-6">What we’ll talk through</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              ['Your current setup', 'How you manage tee times today and what you’d like to improve.'],
              ['The Founding Partner program', 'The first ten Founding Partner courses receive their first year free. After year one, standard pricing is $349 per month. We’ll explain eligibility and terms before you decide.'],
              ['A practical launch plan', 'We’ll review your software, data, and staff needs together before agreeing on a setup timeline.'],
            ].map(([title, body]) => <div key={title} className="border-t border-[#0F3D2E]/20 pt-4"><h3 className="font-semibold mb-2">{title}</h3><p className="text-sm text-[#53645A] leading-relaxed">{body}</p></div>)}
          </div>
          <p className="mt-8 text-sm text-[#53645A]">Submitting the form expresses interest. It does not reserve a founding spot, sign a contract, or commit you to payment.</p>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

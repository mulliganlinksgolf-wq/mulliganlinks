import Link from 'next/link'

export const metadata = { title: 'Thanks — We\'ll be in touch' }

export default function ContactThanksPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center px-6">
      <div className="max-w-md text-center space-y-6">
        <div className="text-6xl">⛳</div>
        <h1 className="text-3xl font-bold text-[#1A1A1A]">We got it.</h1>
        <p className="text-[#6B7770] leading-relaxed">
          Thanks for reaching out. We&apos;ll be in touch within one business day to
          set up a quick call and walk you through what TeeAhead looks like for
          your course.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg border border-[#1B4332] px-6 py-2.5 text-sm font-semibold text-[#1B4332] hover:bg-[#1B4332]/5 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}

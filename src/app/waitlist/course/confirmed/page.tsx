import Link from 'next/link'

export const metadata = {
  title: 'Application Received — MulliganLinks',
}

export default function CourseConfirmedPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center px-6 py-20">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl">🏌️</div>
        <h1 className="text-3xl font-bold text-[#1A1A1A]">Application received!</h1>
        <p className="text-[#6B7770] leading-relaxed">
          Neil or Billy will be in touch within 48 hours to walk you through next steps
          and confirm your Founding Partner status.
        </p>

        <div className="bg-white rounded-xl p-6 ring-1 ring-black/5 text-left space-y-3">
          <p className="text-sm font-semibold text-[#1A1A1A]">What happens next:</p>
          <ol className="text-sm text-[#6B7770] space-y-2 list-decimal list-inside">
            <li>We review your application (usually same day)</li>
            <li>Neil or Billy calls to confirm fit and answer questions</li>
            <li>You receive your Founding Partner confirmation email</li>
            <li>Onboarding call to get your tee sheet connected</li>
          </ol>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg border border-[#1B4332] px-6 py-2.5 text-sm font-semibold text-[#1B4332] hover:bg-[#1B4332]/5 transition-colors"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  )
}

import Link from 'next/link'

export const metadata = {
  title: "You're on the list — MulliganLinks",
}

export default async function GolferConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ position?: string }>
}) {
  const params = await searchParams
  const position = params.position ? parseInt(params.position, 10) : null

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center px-6 py-20">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl">⛳</div>
        <h1 className="text-3xl font-bold text-[#1A1A1A]">
          {position ? `You're #${position} on the list!` : "You're on the list!"}
        </h1>
        <p className="text-[#6B7770] leading-relaxed">
          We&apos;ll email you when MulliganLinks launches in Metro Detroit.
          {position && position <= 100 && (
            <> You&apos;re in the first {position <= 10 ? '10' : position <= 50 ? '50' : '100'} — early access guaranteed.</>
          )}
        </p>

        <div className="bg-white rounded-xl p-6 ring-1 ring-black/5 text-left space-y-3">
          <p className="text-sm font-semibold text-[#1A1A1A]">While you wait:</p>
          <ul className="text-sm text-[#6B7770] space-y-2">
            <li>• Know a course that should partner with us? Send them to <strong className="text-[#1A1A1A]">mulliganlinks.com/waitlist/course</strong></li>
            <li>• Share with golf friends — more local golfers = more partner courses</li>
          </ul>
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

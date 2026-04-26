'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center px-6">
      <div className="max-w-md text-center space-y-6">
        <div className="text-6xl">🏌️</div>
        <h1 className="text-3xl font-bold text-[#1A1A1A]">Something went wrong.</h1>
        <p className="text-[#6B7770] leading-relaxed">
          We hit an unexpected snag. Try reloading — if it keeps happening, email us at{' '}
          <a href="mailto:support@mulliganlinks.com" className="text-[#1B4332] underline">
            support@mulliganlinks.com
          </a>
          .
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-lg bg-[#1B4332] px-6 py-2.5 text-sm font-semibold text-[#FAF7F2] hover:bg-[#1B4332]/90 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-[#1B4332] px-6 py-2.5 text-sm font-semibold text-[#1B4332] hover:bg-[#1B4332]/5 transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}

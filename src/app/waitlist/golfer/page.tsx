import Link from 'next/link'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'
import { GolferWaitlistForm } from './GolferWaitlistForm'

export const metadata = {
  title: 'Join the Golfer Waitlist — TeeAhead',
  description: 'Get early access to TeeAhead, the local-first golf loyalty network coming to Metro Detroit.',
}

export default function GolferWaitlistPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <header className="bg-[#FAF7F2]/95 backdrop-blur border-b border-black/5 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/">
            <TeeAheadLogo className="h-12 w-auto" />
          </Link>
          <Link href="/" className="text-sm text-[#6B7770] hover:text-[#1B4332] transition-colors">
            ← Back
          </Link>
        </div>
      </header>
      <main className="max-w-xl mx-auto px-6 py-16">
        <div className="space-y-2 mb-10">
          <div className="inline-block bg-[#1B4332]/10 text-[#1B4332] text-sm font-semibold px-3 py-1 rounded-full mb-2">
            ⛳ Golfer Waitlist
          </div>
          <h1 className="text-3xl font-bold text-[#1A1A1A]">Join the TeeAhead Waitlist</h1>
          <p className="text-[#6B7770]">
            Be first in line when we launch in Metro Detroit. No credit card, no commitment.
          </p>
        </div>
        <GolferWaitlistForm />
      </main>
    </div>
  )
}

import Link from 'next/link'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'
import { createClient } from '@/lib/supabase/server'
import { CourseWaitlistForm } from './CourseWaitlistForm'

export const metadata = {
  title: 'Founding Partner Application — TeeAhead',
  description: 'Claim one of 10 Founding Partner spots. Free platform for life.',
}

export default async function CourseWaitlistPage() {
  const supabase = await createClient()
  const { data: counter } = await supabase
    .from('founding_partner_counter')
    .select('count, cap')
    .single()

  const spotsRemaining = (counter?.cap ?? 10) - (counter?.count ?? 0)
  const allClaimed = spotsRemaining <= 0

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
        <div className="space-y-2 mb-6">
          <div className={`inline-block text-sm font-semibold px-3 py-1 rounded-full mb-2 ${
            allClaimed ? 'bg-gray-100 text-gray-600' : 'bg-[#E0A800]/20 text-[#8B6F00]'
          }`}>
            {allClaimed ? 'All Founding Spots Claimed' : `${spotsRemaining} of 10 Founding Partner spots remaining`}
          </div>
          <h1 className="text-3xl font-bold text-[#1A1A1A]">
            {allClaimed ? 'Join the Course Waitlist' : 'Claim a Founding Partner Spot'}
          </h1>
        </div>

        <div className="bg-white rounded-xl p-5 ring-1 ring-[#E0A800]/30 mb-8 space-y-3">
          <p className="text-sm font-semibold text-[#1A1A1A]">
            {allClaimed ? 'Core Partner — $249/month' : 'Founding Partners get the full platform free for life.'}
          </p>
          <p className="text-sm text-[#6B7770] leading-relaxed">
            {allClaimed
              ? 'All 10 Founding Partner spots have been claimed. You can still join the waitlist as a Core Partner at $249/month — same software, no barter.'
              : "The only obligation: promote the Tee Ahead membership to your golfers at the point of booking, and allow us to feature your course in our marketing. Course #11 onward pays $249/month."}
          </p>
        </div>

        <CourseWaitlistForm />
      </main>
    </div>
  )
}

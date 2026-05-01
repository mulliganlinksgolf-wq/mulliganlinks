import Link from 'next/link'
import ScorecardRows from './ScorecardRows'
import { getMemberState, getSubHeadline, getTierInfo } from '@/lib/member-dashboard'
import type { MemberTier } from '@/lib/member-dashboard'

// Matches the DB booking shape exactly — snake_case from Supabase
type Booking = {
  id: string
  course_name: string
  scheduled_at: string
  total_price: number
}

type RoundCardProps = {
  firstName: string
  tier: MemberTier
  pointsBalance: number
  creditCents: number
  completedRoundsCount: number
  upcomingBooking: Booking | null
  lastCompletedBooking: Booking | null
}

export function RoundCard({
  firstName,
  tier,
  pointsBalance,
  creditCents,
  completedRoundsCount,
  upcomingBooking,
  lastCompletedBooking,
}: RoundCardProps) {
  const state = getMemberState(completedRoundsCount)
  const tierInfo = getTierInfo(tier)
  const subHeadline = getSubHeadline(state, completedRoundsCount)
  const isActive = state === 'active'

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#1C1C1C' }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] uppercase tracking-[0.2em] text-[#888] font-sans">
            Round Card
          </span>
          <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full font-sans ${tierInfo.badgeBg} ${tierInfo.badgeText}`}>
            {tierInfo.label}
          </span>
        </div>
        <h1 className="text-2xl font-bold font-serif text-white italic">Hey, {firstName}.</h1>
        <p className="text-[11px] text-[#888] font-sans mt-1">{subHeadline}</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 border-y border-[#333]" style={{ background: '#2a2a2a' }}>
        <div className="px-4 py-3 text-center border-r border-[#333]">
          <p className="text-[8px] uppercase tracking-widest text-[#888] font-sans mb-1">Points</p>
          <p className={`text-xl font-bold font-serif ${isActive ? 'text-white' : 'text-[#555]'}`}>
            {isActive ? pointsBalance.toLocaleString() : '0'}
          </p>
          <p className={`text-[8px] font-sans mt-0.5 ${isActive ? 'text-[#8FA889]' : 'text-[#444]'}`}>
            {isActive ? `$${(pointsBalance / 100).toFixed(2)} val` : 'not yet'}
          </p>
        </div>
        <div className="px-4 py-3 text-center border-r border-[#333]">
          <p className="text-[8px] uppercase tracking-widest text-[#888] font-sans mb-1">Credit</p>
          <p className={`text-xl font-bold font-serif ${isActive && creditCents > 0 ? 'text-[#E0A800]' : 'text-[#555]'}`}>
            {isActive && creditCents > 0 ? `$${(creditCents / 100).toFixed(0)}` : '—'}
          </p>
          <p className={`text-[8px] font-sans mt-0.5 ${isActive && creditCents > 0 ? 'text-[#8FA889]' : 'text-[#444]'}`}>
            {isActive && creditCents > 0 ? 'ready to use' : 'earn first'}
          </p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="text-[8px] uppercase tracking-widest text-[#888] font-sans mb-1">Rounds</p>
          <p className={`text-xl font-bold font-serif ${isActive ? 'text-white' : 'text-[#555]'}`}>
            {completedRoundsCount}
          </p>
          <p className={`text-[8px] font-sans mt-0.5 ${isActive ? 'text-[#8FA889]' : 'text-[#444]'}`}>
            {isActive ? 'all-time' : 'played'}
          </p>
        </div>
      </div>

      {/* Section label */}
      <div className="px-3 py-1.5" style={{ background: '#222' }}>
        <span className="text-[8px] uppercase tracking-widest text-[#555] font-sans">
          {state === 'new' ? 'Scorecard — 3 holes left' : 'This week'}
        </span>
      </div>

      {/* Scorecard rows */}
      <div style={{ background: '#2a2a2a' }}>
        <ScorecardRows
          state={state}
          tier={tier}
          pointsBalance={pointsBalance}
          upcomingBooking={upcomingBooking}
          lastBooking={lastCompletedBooking}
        />
      </div>

      {/* CTA */}
      <div className="p-4" style={{ background: '#1C1C1C' }}>
        <Link
          href="/app/courses"
          className="block w-full text-center py-3 rounded-lg text-sm font-semibold font-sans text-[#FAF7F2] transition-colors hover:opacity-90"
          style={{ background: '#1B4332' }}
        >
          ⛳ {state === 'new' ? 'Find a tee time near you' : 'Book another tee time'}
        </Link>
      </div>
    </div>
  )
}

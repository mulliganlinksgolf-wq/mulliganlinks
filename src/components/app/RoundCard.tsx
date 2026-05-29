import Link from 'next/link'
import ScorecardRows from './ScorecardRows'
import { getMemberState, getSubHeadline, getTierInfo } from '@/lib/member-dashboard'
import type { MemberTier } from '@/lib/member-dashboard'

// Matches the DB booking shape exactly, snake_case from Supabase
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
  const state = getMemberState(completedRoundsCount, tier)
  const tierInfo = getTierInfo(tier)
  const subHeadline = getSubHeadline(state, completedRoundsCount)
  const isActive = state === 'active'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening'

  return (
    <div className="rounded-2xl overflow-hidden bg-[#082419]">
      {/* Header, dark editorial */}
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#F4F1EA]/55 font-semibold">
              {greeting} round card
            </p>
            <h1 className="font-display text-[#F4F1EA] mt-1 tracking-[-0.02em]" style={{ fontSize: 32, fontWeight: 400 }}>
              {greeting}, {firstName}.
            </h1>
          </div>
          <span className={`text-[10px] font-mono tracking-[0.12em] uppercase font-bold px-2.5 py-1 rounded-full ${tierInfo.badgeBg} ${tierInfo.badgeText}`}>
            {tierInfo.label}
          </span>
        </div>
        <p className="text-[12px] text-[#F4F1EA]/65 leading-relaxed">{subHeadline}</p>
      </div>

      {/* Stats strip, Playfair 400 numbers */}
      <div className="grid grid-cols-3 bg-white/[0.04] border-y border-white/[0.06]">
        <div className="px-4 py-4 text-center border-r border-white/[0.06]">
          <p className="font-mono text-[9px] tracking-[0.14em] uppercase text-[#F4F1EA]/55 font-semibold mb-1.5">Points</p>
          <p
            className={`font-display leading-none tracking-[-0.02em] ${isActive ? 'text-[#F4F1EA]' : 'text-[#F4F1EA]/45'}`}
            style={{ fontSize: 28, fontWeight: 400 }}
          >
            {isActive ? pointsBalance.toLocaleString() : '0'}
          </p>
          <p className="text-[10px] text-[#F4F1EA]/55 mt-1.5">
            {isActive ? `$${(pointsBalance / 100).toFixed(2)} val` : 'not yet'}
          </p>
        </div>
        <div className="px-4 py-4 text-center border-r border-white/[0.06]">
          <p className="font-mono text-[9px] tracking-[0.14em] uppercase text-[#F4F1EA]/55 font-semibold mb-1.5">Credit</p>
          <p
            className={`font-display leading-none tracking-[-0.02em] ${isActive && creditCents > 0 ? 'text-[#E0A800]' : 'text-[#F4F1EA]/45'}`}
            style={{ fontSize: 28, fontWeight: 400 }}
          >
            {isActive && creditCents > 0 ? `$${(creditCents / 100).toFixed(0)}` : '—'}
          </p>
          <p className="text-[10px] text-[#F4F1EA]/55 mt-1.5">
            {isActive && creditCents > 0 ? 'ready to use' : 'earn first'}
          </p>
        </div>
        <div className="px-4 py-4 text-center">
          <p className="font-mono text-[9px] tracking-[0.14em] uppercase text-[#F4F1EA]/55 font-semibold mb-1.5">Rounds</p>
          <p
            className={`font-display leading-none tracking-[-0.02em] ${isActive ? 'text-[#F4F1EA]' : 'text-[#F4F1EA]/45'}`}
            style={{ fontSize: 28, fontWeight: 400 }}
          >
            {completedRoundsCount}
          </p>
          <p className="text-[10px] text-[#F4F1EA]/55 mt-1.5">
            {isActive ? 'all-time' : 'played'}
          </p>
        </div>
      </div>

      {/* Section label */}
      <div className="px-5 py-2 bg-black/20">
        <span className="font-mono text-[9px] tracking-[0.14em] uppercase text-[#F4F1EA]/55 font-semibold">
          {state === 'new' ? 'Scorecard, 3 holes left' : 'This week'}
        </span>
      </div>

      {/* Scorecard rows, internal styling untouched, isolated row component */}
      <div className="bg-white/[0.03]">
        <ScorecardRows
          state={state}
          tier={tier}
          pointsBalance={pointsBalance}
          upcomingBooking={upcomingBooking}
          lastBooking={lastCompletedBooking}
        />
      </div>

      {/* CTA */}
      <div className="px-5 pt-4 pb-5 bg-[#082419]">
        <Link
          href="/app/courses"
          className="block w-full text-center py-3 rounded-lg text-sm font-semibold bg-[#E0A800] text-[#082419] hover:bg-[#E0A800]/90 transition-colors"
        >
          {state === 'new' ? 'Find a tee time near you' : 'Book another tee time'}
        </Link>
      </div>
    </div>
  )
}

'use server'

import Link from 'next/link'
import { MemberTier, DashboardState, getPointsToNextCredit, formatDaysAway } from '@/lib/member-dashboard'

type Booking = {
  id: string
  course_name: string
  scheduled_at: string
  status: string
  total_price: number
}

interface ScorecardRowsProps {
  state: DashboardState
  tier: MemberTier
  pointsBalance: number
  upcomingBooking: Booking | null
  lastBooking: Booking | null
}

type RowContent = {
  icon: string
  label: string
  primary: string
  subLine?: string
  link?: string
}

function RowTemplate({ icon, label, primary, subLine, link }: RowContent) {
  return (
    <div className="border-t border-[#333] px-4 py-3 flex items-center gap-3">
      <span className="text-[#555] text-xs font-mono w-5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-[#555] uppercase tracking-widest font-sans mb-0.5">{label}</div>
        <div className="text-sm text-white font-semibold font-sans truncate">{primary}</div>
        {subLine && <div className="text-xs text-[#888] font-sans mt-0.5">{subLine}</div>}
      </div>
      {link && (
        <Link href={link} className="text-[#8FA889] text-xs shrink-0 hover:underline">
          →
        </Link>
      )}
    </div>
  )
}

export default function ScorecardRows({
  state,
  tier,
  pointsBalance,
  upcomingBooking,
  lastBooking,
}: ScorecardRowsProps) {
  if (state === 'new') {
    return (
      <>
        <RowTemplate icon="⛳" label="FIND" primary="Find a course near you" subLine="3 partner courses within 5 miles" link="/app/courses" />
        <RowTemplate icon="◎" label="EARN" primary="Bank your first 50 Fairway Points" subLine="100 pts = $1 toward future bookings" link="/app/points" />
        <RowTemplate icon="↑" label="TRY" primary="Eagle preview — 2× points + fee waived" subLine="Upgrade — $50 less than Golf Pass" link="/app/membership" />
      </>
    )
  }

  // state === 'active'
  const nextRow: RowContent = upcomingBooking
    ? {
        icon: '▸',
        label: 'NEXT',
        primary: upcomingBooking.course_name,
        subLine: `${formatDaysAway(upcomingBooking.scheduled_at)} · confirmed`,
        link: '/app/bookings',
      }
    : {
        icon: '▸',
        label: 'NEXT',
        primary: 'No round booked yet',
        subLine: 'Find a tee time →',
        link: '/app/courses',
      }

  const lastRow: RowContent = lastBooking
    ? {
        icon: '✓',
        label: 'LAST',
        primary: lastBooking.course_name,
        subLine: `$${(lastBooking.total_price / 100).toFixed(2)} paid`,
        link: '/app/bookings',
      }
    : {
        icon: '✓',
        label: 'LAST',
        primary: 'No completed rounds yet',
      }

  const thirdRow: RowContent =
    tier === 'free'
      ? {
          icon: '↑',
          label: 'UPGRADE',
          primary: 'Go Eagle — 2× points + fee waived',
          subLine: '$89/yr — $50 less than Golf Pass',
          link: '/app/membership',
        }
      : {
          icon: '◎',
          label: 'GOAL',
          primary: `${getPointsToNextCredit(pointsBalance)} pts to your next $1 credit`,
          subLine: 'Book 1 more round to hit it',
          link: '/app/points',
        }

  return (
    <>
      <RowTemplate {...nextRow} />
      <RowTemplate {...lastRow} />
      <RowTemplate {...thirdRow} />
    </>
  )
}

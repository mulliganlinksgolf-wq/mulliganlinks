export type MemberTier = 'free' | 'eagle' | 'ace'
export type DashboardState = 'new' | 'active'

export function getMemberState(completedRoundsCount: number): DashboardState {
  return completedRoundsCount > 0 ? 'active' : 'new'
}

export function getSubHeadline(state: DashboardState, roundsCount: number): string {
  if (state === 'new') return "Your scorecard's still blank. 3 holes before your first round."
  if (roundsCount <= 4) return `${roundsCount} round${roundsCount === 1 ? '' : 's'} played. You're warming up. 🏌️`
  if (roundsCount <= 9) return `${roundsCount} rounds played. You're on the back nine. 🏌️`
  return `${roundsCount} rounds played. A regular. See you out there. 🏌️`
}

export function getPointsToNextCredit(balance: number): number {
  const remainder = balance % 100
  return remainder === 0 ? 100 : 100 - remainder
}

export function formatDaysAway(scheduledAt: string): string {
  const diff = new Date(scheduledAt).getTime() - Date.now()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'today'
  if (days === 1) return 'tomorrow'
  return `${days} days away`
}

export function getTierInfo(tier: MemberTier): {
  label: string
  badgeBg: string
  badgeText: string
  earnRate: string
} {
  switch (tier) {
    case 'eagle':
      return { label: 'Eagle', badgeBg: 'bg-[#E0A800]', badgeText: 'text-[#1A1A1A]', earnRate: '1.5×' }
    case 'ace':
      return { label: 'Ace', badgeBg: 'bg-[#1B4332]', badgeText: 'text-[#FAF7F2]', earnRate: '2×' }
    default:
      return { label: 'Fairway', badgeBg: 'bg-[#8FA889]', badgeText: 'text-[#1A1A1A]', earnRate: '1×' }
  }
}

// Platform fee by membership tier
export const PLATFORM_FEE_CENTS: Record<string, number> = {
  free:    149, // $1.49
  fairway: 149,
  eagle:     0,
  ace:       0,
}

export function platformFeeCents(tier: string): number {
  return PLATFORM_FEE_CENTS[tier] ?? 149
}

export function deriveAccountStatus(account: {
  details_submitted: boolean
  charges_enabled: boolean
  payouts_enabled: boolean
  requirements?: { disabled_reason?: string | null }
}): string {
  if (!account.details_submitted) return 'onboarding'
  if (account.charges_enabled && account.payouts_enabled) return 'active'
  if (account.requirements?.disabled_reason) return 'disabled'
  return 'restricted'
}

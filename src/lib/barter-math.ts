// Single source of truth for GolfNow barter-cost math across the marketing site.
//
// Assumptions confirmed with Neil (2026-05-28):
//   - Target buyer is the independent Metro Detroit daily-fee course (peak ~$55-$90).
//   - The defensible TYPICAL figure uses an $80 peak rate => ~$48,000/yr.
//   - $94,500 is the HIGH-VOLUME CEILING (resort-grade ~$157.50 rack rate), NOT the average.
//
// Every hero number, calculator default, comparison stat, schema string, and case-study
// figure must derive from these constants so the headline and the calculator never disagree.

export const BARTER_TEE_TIMES_PER_DAY = 2
export const OPERATING_DAYS = 300
export const TYPICAL_PEAK_RATE = 80 // $/round, typical Metro Detroit daily-fee peak
export const HIGH_VOLUME_RATE = 157.5 // $/round, high-volume / resort-grade ceiling

/** Annual barter cost = rate x days open x barter tee times per day. */
export function annualBarterCost(
  rate: number,
  daysOpen: number = OPERATING_DAYS,
  teeTimesPerDay: number = BARTER_TEE_TIMES_PER_DAY,
): number {
  return Math.round(rate * daysOpen * teeTimesPerDay)
}

export const TYPICAL_ANNUAL_BARTER = annualBarterCost(TYPICAL_PEAK_RATE) // 48000
export const HIGH_VOLUME_ANNUAL_BARTER = annualBarterCost(HIGH_VOLUME_RATE) // 94500

const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`

export const TYPICAL_PEAK_RATE_LABEL = usd(TYPICAL_PEAK_RATE) // "$80"
export const HIGH_VOLUME_RATE_LABEL = usd(HIGH_VOLUME_RATE) // "$158" (rounded for display)
export const TYPICAL_ANNUAL_BARTER_LABEL = usd(TYPICAL_ANNUAL_BARTER) // "$48,000"
export const HIGH_VOLUME_ANNUAL_BARTER_LABEL = usd(HIGH_VOLUME_ANNUAL_BARTER) // "$94,500"

// Operator subscription, for the three-number risk-reversal story (free Y1, then this).
export const MONTHLY_PRICE = 349
export const MONTHLY_PRICE_LABEL = usd(MONTHLY_PRICE) // "$349"

export type MarketplaceDistribution = 'yes' | 'unsure' | 'no'

const BASELINE_RATE = 0.025
const MARKETPLACE_DAYS = 280
const MARKETPLACE_AVG_GREEN_FEE = 65

export function calcAnnualSubscription(monthlySubscription: number): number {
  return monthlySubscription * 12
}

export function calcProcessingMarkup(annualCardVolume: number, paymentProcessingRate: number): number {
  const userRate = paymentProcessingRate / 100
  return Math.max(0, Math.round(annualCardVolume * (userRate - BASELINE_RATE)))
}

export function calcMarketplaceBarter(distribution: MarketplaceDistribution): number {
  if (distribution === 'yes') return MARKETPLACE_DAYS * MARKETPLACE_AVG_GREEN_FEE
  if (distribution === 'unsure') return Math.round(MARKETPLACE_DAYS * MARKETPLACE_AVG_GREEN_FEE * 0.5)
  return 0
}

export function calcTotalExtraction(
  monthlySubscription: number,
  annualCardVolume: number,
  paymentProcessingRate: number,
  marketplaceDistribution: MarketplaceDistribution,
): number {
  return (
    calcAnnualSubscription(monthlySubscription) +
    calcProcessingMarkup(annualCardVolume, paymentProcessingRate) +
    calcMarketplaceBarter(marketplaceDistribution)
  )
}

export function estimateGolferRecords(annualCardVolume: number): number {
  return Math.floor(annualCardVolume * 0.04)
}

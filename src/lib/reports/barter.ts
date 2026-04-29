export const GOLFNOW_BARTER_RATE = 0.20

export interface BarterSavings {
  golfnowCostMtd: number
  golfnowCostYtd: number
  staffHoursSaved: number
  teeaheadCost: number
}

export function calcBarterSavings(opts: {
  rounds: number
  avgGreenFee: number
  waitlistFills: number
  monthsElapsed?: number
}): BarterSavings {
  const { rounds, avgGreenFee, waitlistFills, monthsElapsed = 1 } = opts
  const golfnowCostMtd = Math.round(rounds * avgGreenFee * GOLFNOW_BARTER_RATE)
  const golfnowCostYtd = golfnowCostMtd * monthsElapsed
  const staffHoursSaved = Math.round((waitlistFills * 15) / 60 * 10) / 10
  return { golfnowCostMtd, golfnowCostYtd, staffHoursSaved, teeaheadCost: 0 }
}

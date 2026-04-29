import { describe, it, expect } from 'vitest'
import { calcBarterSavings } from '../barter'

describe('calcBarterSavings', () => {
  it('calculates GolfNow barter cost at 20%', () => {
    const { golfnowCostMtd } = calcBarterSavings({ rounds: 100, avgGreenFee: 50, waitlistFills: 0 })
    expect(golfnowCostMtd).toBe(1000) // 100 * 50 * 0.20
  })

  it('calculates staff hours at 15 min per fill', () => {
    const { staffHoursSaved } = calcBarterSavings({ rounds: 0, avgGreenFee: 0, waitlistFills: 40 })
    expect(staffHoursSaved).toBeCloseTo(10) // 40 * 15min = 10h
  })

  it('ytd multiplies monthly by months elapsed', () => {
    const { golfnowCostYtd } = calcBarterSavings({ rounds: 100, avgGreenFee: 50, waitlistFills: 0, monthsElapsed: 4 })
    expect(golfnowCostYtd).toBe(4000) // 1000 * 4
  })

  it('returns 0 cost when no rounds', () => {
    const { golfnowCostMtd } = calcBarterSavings({ rounds: 0, avgGreenFee: 45, waitlistFills: 0 })
    expect(golfnowCostMtd).toBe(0)
  })
})

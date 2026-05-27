import { describe, it, expect } from 'vitest'
import { calcWaitlistFillRate, calcStaffHoursSaved } from '../courseMetrics'

describe('calcWaitlistFillRate', () => {
  it('returns correct percentage', () => {
    expect(calcWaitlistFillRate({ fills: 30, totalCancellations: 50 })).toBeCloseTo(60)
  })
  it('returns 0 when no cancellations', () => {
    expect(calcWaitlistFillRate({ fills: 0, totalCancellations: 0 })).toBe(0)
  })
})

describe('calcStaffHoursSaved', () => {
  it('returns hours at 15 min per fill', () => {
    expect(calcStaffHoursSaved(40)).toBeCloseTo(10) // 40 * 15min = 600min = 10h
  })
  it('rounds to 1 decimal', () => {
    expect(calcStaffHoursSaved(5)).toBeCloseTo(1.3)
  })
})

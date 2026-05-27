import { describe, it, expect } from 'vitest'
import { calcHealthScore, healthLabel } from '../courses'

describe('calcHealthScore', () => {
  it('returns 100 for max inputs', () => {
    expect(calcHealthScore({ roundsScore: 100, membersScore: 100, revenueScore: 100, waitlistFillRate: 100, daysSinceActivity: 0 })).toBe(100)
  })

  it('weights rounds at 30%', () => {
    expect(calcHealthScore({ roundsScore: 100, membersScore: 0, revenueScore: 0, waitlistFillRate: 0, daysSinceActivity: 999 })).toBe(30)
  })

  it('weights members at 25%', () => {
    expect(calcHealthScore({ roundsScore: 0, membersScore: 100, revenueScore: 0, waitlistFillRate: 0, daysSinceActivity: 999 })).toBe(25)
  })

  it('clamps to 0-100', () => {
    expect(calcHealthScore({ roundsScore: 200, membersScore: 200, revenueScore: 200, waitlistFillRate: 200, daysSinceActivity: -10 })).toBe(100)
  })
})

describe('healthLabel', () => {
  it('marks 70+ as healthy', () => { expect(healthLabel(75)).toBe('healthy') })
  it('marks 40-69 as at_risk', () => { expect(healthLabel(55)).toBe('at_risk') })
  it('marks 0-39 as critical', () => { expect(healthLabel(30)).toBe('critical') })
})

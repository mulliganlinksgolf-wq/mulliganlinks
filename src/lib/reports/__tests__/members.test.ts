import { describe, it, expect } from 'vitest'
import { calcChurnRate, calcLtv, labelHealthStatus } from '../members'

describe('calcChurnRate', () => {
  it('returns percentage of churned from total', () => {
    expect(calcChurnRate({ churned: 10, total: 100 })).toBeCloseTo(10)
  })
  it('returns 0 when total is 0', () => {
    expect(calcChurnRate({ churned: 0, total: 0 })).toBe(0)
  })
})

describe('calcLtv', () => {
  it('multiplies monthly price by avg months retained', () => {
    expect(calcLtv({ monthlyPrice: 89, avgMonthsRetained: 14 })).toBe(1246)
  })
})

describe('labelHealthStatus', () => {
  it('labels At Risk correctly', () => {
    expect(labelHealthStatus(45)).toBe('at_risk')
  })
  it('labels Healthy correctly', () => {
    expect(labelHealthStatus(0)).toBe('healthy')
  })
})

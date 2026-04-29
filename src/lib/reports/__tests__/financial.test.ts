import { describe, it, expect } from 'vitest'
import { calcMrr, calcGrossMargin, buildPnlRows } from '../financial'

describe('calcMrr', () => {
  it('sums eagle and ace MRR correctly', () => {
    const result = calcMrr({ eagleCount: 10, aceCount: 5 })
    expect(result).toBe(10 * 89 + 5 * 159)  // 890 + 795 = 1685
  })
  it('returns 0 when no paying members', () => {
    expect(calcMrr({ eagleCount: 0, aceCount: 0 })).toBe(0)
  })
})

describe('calcGrossMargin', () => {
  it('returns correct percentage', () => {
    expect(calcGrossMargin({ revenue: 1000, cogs: 300 })).toBeCloseTo(70)
  })
  it('returns 0 when revenue is 0', () => {
    expect(calcGrossMargin({ revenue: 0, cogs: 0 })).toBe(0)
  })
})

describe('buildPnlRows', () => {
  it('calculates net correctly', () => {
    const rows = buildPnlRows({
      revenue: 5000,
      expensesByCategory: { Engineering: 1000, Marketing: 500 },
    })
    expect(rows.totalExpenses).toBe(1500)
    expect(rows.net).toBe(3500)
  })
})

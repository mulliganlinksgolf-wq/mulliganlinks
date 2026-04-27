/**
 * Unit tests for the software cost calculator core logic.
 * Pure function tests — no rendering needed.
 * These tests intentionally fail until src/lib/softwareCostCalc.ts is created.
 */

import { describe, it, expect } from 'vitest'
import {
  calcAnnualSubscription,
  calcProcessingMarkup,
  calcMarketplaceBarter,
  calcTotalExtraction,
  estimateGolferRecords,
} from '@/lib/softwareCostCalc'

describe('calcAnnualSubscription', () => {
  it('multiplies monthly by 12', () => {
    expect(calcAnnualSubscription(299)).toBe(3588)
  })

  it('handles $0 monthly', () => {
    expect(calcAnnualSubscription(0)).toBe(0)
  })

  it('handles typical foreUP median ($250)', () => {
    expect(calcAnnualSubscription(250)).toBe(3000)
  })
})

describe('calcProcessingMarkup', () => {
  it('returns 0 when rate equals baseline (2.5%)', () => {
    expect(calcProcessingMarkup(1_000_000, 2.5)).toBe(0)
  })

  it('returns 0 when rate is below baseline (no negative markup)', () => {
    expect(calcProcessingMarkup(1_000_000, 2.4)).toBe(0)
  })

  it('calculates markup above baseline correctly', () => {
    // $1M volume × (2.9% - 2.5%) = $1M × 0.004 = $4,000
    expect(calcProcessingMarkup(1_000_000, 2.9)).toBe(4000)
  })

  it('calculates at 4.0% rate', () => {
    // $2M volume × (4.0% - 2.5%) = $2M × 0.015 = $30,000
    expect(calcProcessingMarkup(2_000_000, 4.0)).toBe(30000)
  })

  it('scales linearly with volume', () => {
    const base = calcProcessingMarkup(500_000, 3.0)
    const double = calcProcessingMarkup(1_000_000, 3.0)
    expect(double).toBe(base * 2)
  })
})

describe('calcMarketplaceBarter', () => {
  it('returns full barter value when yes (280 days × $65)', () => {
    // 280 * 65 = 18,200
    expect(calcMarketplaceBarter('yes')).toBe(18200)
  })

  it('returns half barter value when unsure', () => {
    // Math.round(280 * 65 * 0.5) = 9,100
    expect(calcMarketplaceBarter('unsure')).toBe(9100)
  })

  it('returns 0 when no', () => {
    expect(calcMarketplaceBarter('no')).toBe(0)
  })
})

describe('calcTotalExtraction', () => {
  it('sums all three cost components', () => {
    // sub: 250*12=$3,000 | markup: 1M*(2.9%-2.5%)=$4,000 | barter: 18,200
    const result = calcTotalExtraction(250, 1_000_000, 2.9, 'yes')
    expect(result).toBe(3000 + 4000 + 18200)
  })

  it('handles no marketplace correctly', () => {
    const result = calcTotalExtraction(250, 1_000_000, 2.9, 'no')
    expect(result).toBe(3000 + 4000 + 0)
  })

  it('returns 0 for a course with zero costs', () => {
    expect(calcTotalExtraction(0, 100_000, 2.5, 'no')).toBe(0)
  })
})

describe('estimateGolferRecords', () => {
  it('returns 4% of annual card volume', () => {
    // $1M × 0.04 = 40,000 records
    expect(estimateGolferRecords(1_000_000)).toBe(40000)
  })

  it('floors to integer', () => {
    // $100K × 0.04 = 4,000
    expect(estimateGolferRecords(100_000)).toBe(4000)
  })

  it('handles min card volume ($100K)', () => {
    expect(estimateGolferRecords(100_000)).toBeGreaterThan(0)
  })
})

describe('savings edge case', () => {
  it('standard savings never go negative — confirmed by Math.max at call site', () => {
    // A course with $0 everything has totalExtraction=0, which is < standardAnnual ($3,588)
    // The component does: Math.max(0, totalExtraction - 3588) — test the logic here
    const totalExtraction = calcTotalExtraction(0, 100_000, 2.5, 'no')
    const savingsAsStandard = Math.max(0, totalExtraction - 3588)
    expect(savingsAsStandard).toBe(0)
    expect(totalExtraction).toBeLessThan(3588) // triggers "unusually lean" message
  })
})

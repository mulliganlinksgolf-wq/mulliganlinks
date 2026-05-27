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

  it('rounds fractional dollar result to nearest integer', () => {
    // $333,333 × (2.9% - 2.5%) = $333,333 × 0.004 = 1,333.332 → rounds to 1,333
    expect(calcProcessingMarkup(333_333, 2.9)).toBe(1333)
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

  it('handles maximum inputs without overflow', () => {
    // $1,500/mo × 12 + $5M × (4.0% - 2.5%) + 18,200 = $18,000 + $75,000 + $18,200 = $111,200
    const max = calcTotalExtraction(1500, 5_000_000, 4.0, 'yes')
    expect(max).toBe(111200)
    expect(Number.isFinite(max)).toBe(true)
  })
})

describe('estimateGolferRecords', () => {
  it('returns 4% of annual card volume', () => {
    // $1M × 0.04 = 40,000 records
    expect(estimateGolferRecords(1_000_000)).toBe(40000)
  })

  it('floors fractional result to integer', () => {
    // $100,001 × 0.04 = 4,000.04 → Math.floor → 4,000 (not 4,001)
    expect(estimateGolferRecords(100_001)).toBe(4000)
  })
})

describe('savings edge case — unusually lean course', () => {
  it('a course with $0 software and no marketplace has totalExtraction below TeeAhead standard pricing', () => {
    // This documents the threshold for the "unusually lean" UI message.
    // When totalExtraction < 3588 (TEEAHEAD_PRICING.standardAnnual), the component
    // shows a different message instead of the savings calculation.
    // The guard expression Math.max(0, totalExtraction - 3588) is tested in UI tests.
    const totalExtraction = calcTotalExtraction(0, 100_000, 2.5, 'no')
    expect(totalExtraction).toBe(0)
    expect(totalExtraction).toBeLessThan(3588)
  })
})

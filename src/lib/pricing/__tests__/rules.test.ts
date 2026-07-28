import { describe, it, expect } from 'vitest'
import { resolvePricing, type RateRule, type PricingContext } from '../rules'

const baseRule = (overrides: Partial<RateRule> = {}): RateRule => ({
  id: 'r1',
  name: 'test',
  category: 'custom',
  enabled: true,
  daysOfWeek: null,
  startTime: null,
  endTime: null,
  isHoliday: null,
  minDaysOut: null,
  maxDaysOut: null,
  minOccupancyPct: null,
  maxOccupancyPct: null,
  actionType: 'percent_adjust',
  actionValue: 25,
  priority: 100,
  displayLabel: 'Test',
  ...overrides,
})

const baseCtx = (overrides: Partial<PricingContext> = {}): PricingContext => ({
  // 2026-07-04 is a Saturday (day 6) in UTC
  slotTime: new Date('2026-07-04T13:00:00Z'),
  isHoliday: true,
  daysOut: 7,
  occupancyPct: 50,
  ...overrides,
})

describe('resolvePricing', () => {
  it('returns base rate unchanged when no rules', () => {
    const r = resolvePricing(50, [], baseCtx())
    expect(r.finalRate).toBe(50)
    expect(r.baseRate).toBe(50)
    expect(r.appliedRules).toHaveLength(0)
  })

  it('applies +25% peak rule on Saturday', () => {
    const rule = baseRule({ daysOfWeek: [6], actionValue: 25 })
    const r = resolvePricing(50, [rule], baseCtx())
    expect(r.finalRate).toBeCloseTo(62.5)
    expect(r.appliedRules).toHaveLength(1)
    expect(r.appliedRules[0].effectAmount).toBeCloseTo(12.5)
  })

  it('skips rule on non-matching day', () => {
    const rule = baseRule({ daysOfWeek: [0] /* Sunday */, actionValue: 25 })
    const r = resolvePricing(50, [rule], baseCtx())
    expect(r.finalRate).toBe(50)
    expect(r.appliedRules).toHaveLength(0)
  })

  it('applies twilight rule for slots after 6pm', () => {
    const rule = baseRule({ startTime: '18:00:00', actionValue: -30 })
    const r = resolvePricing(60, [rule], baseCtx({ slotTime: new Date('2026-07-04T18:30:00Z') }))
    expect(r.finalRate).toBeCloseTo(42)
  })

  it('skips twilight rule for slots before window', () => {
    const rule = baseRule({ startTime: '18:00:00', actionValue: -30 })
    const r = resolvePricing(60, [rule], baseCtx({ slotTime: new Date('2026-07-04T17:30:00Z') }))
    expect(r.finalRate).toBe(60)
  })

  it('end_time is exclusive', () => {
    const rule = baseRule({ startTime: '06:00:00', endTime: '12:00:00', actionValue: 10 })
    const noon = resolvePricing(50, [rule], baseCtx({ slotTime: new Date('2026-07-04T12:00:00Z') }))
    expect(noon.finalRate).toBe(50)
    const eleven = resolvePricing(50, [rule], baseCtx({ slotTime: new Date('2026-07-04T11:00:00Z') }))
    expect(eleven.finalRate).toBeCloseTo(55)
  })

  it('chains multiple rules in priority order (lowest first)', () => {
    const peak    = baseRule({ id: 'a', priority: 10, actionValue: 25 })
    const holiday = baseRule({ id: 'b', priority: 20, isHoliday: true, actionValue: 10 })
    const r = resolvePricing(50, [peak, holiday], baseCtx())
    // 50 * 1.25 = 62.50, then * 1.10 = 68.75
    expect(r.finalRate).toBeCloseTo(68.75)
    expect(r.appliedRules.map(a => a.rule.id)).toEqual(['a', 'b'])
  })

  it('enforces 50%-of-base safety floor', () => {
    const rule = baseRule({ actionType: 'percent_adjust', actionValue: -90 })
    const r = resolvePricing(60, [rule], baseCtx())
    expect(r.finalRate).toBe(30) // 50% floor of 60
  })

  it('enforces 3x-base safety ceiling', () => {
    const rule = baseRule({ actionType: 'percent_adjust', actionValue: 500 })
    const r = resolvePricing(50, [rule], baseCtx())
    expect(r.finalRate).toBe(150) // 3x ceiling
  })

  it('respects min_occupancy_pct gate', () => {
    const rule = baseRule({ minOccupancyPct: 75, actionValue: 15 })
    const below = resolvePricing(50, [rule], baseCtx({ occupancyPct: 60 }))
    expect(below.finalRate).toBe(50)
    const at = resolvePricing(50, [rule], baseCtx({ occupancyPct: 75 }))
    expect(at.finalRate).toBeCloseTo(57.5)
    const above = resolvePricing(50, [rule], baseCtx({ occupancyPct: 80 }))
    expect(above.finalRate).toBeCloseTo(57.5)
  })

  it('respects max_occupancy_pct gate', () => {
    const rule = baseRule({ maxOccupancyPct: 25, actionValue: -20 })
    const slow = resolvePricing(50, [rule], baseCtx({ occupancyPct: 10 }))
    expect(slow.finalRate).toBeCloseTo(40)
    const busy = resolvePricing(50, [rule], baseCtx({ occupancyPct: 40 }))
    expect(busy.finalRate).toBe(50)
  })

  it('fixed_amount_adjust adds/subtracts a flat dollar amount', () => {
    const up = baseRule({ actionType: 'fixed_amount_adjust', actionValue: 15 })
    expect(resolvePricing(50, [up], baseCtx()).finalRate).toBe(65)
    const down = baseRule({ actionType: 'fixed_amount_adjust', actionValue: -10 })
    expect(resolvePricing(50, [down], baseCtx()).finalRate).toBe(40)
  })

  it('fixed_price_override replaces base entirely', () => {
    const rule = baseRule({ actionType: 'fixed_price_override', actionValue: 99 })
    const r = resolvePricing(50, [rule], baseCtx())
    expect(r.finalRate).toBe(99)
  })

  it('disabled rules do not fire even if conditions match', () => {
    const rule = baseRule({ enabled: false, actionValue: 25 })
    const r = resolvePricing(50, [rule], baseCtx())
    expect(r.finalRate).toBe(50)
  })

  it('is_holiday gate works for both true and false', () => {
    const holidayRule = baseRule({ isHoliday: true, actionValue: 20 })
    const onHoliday  = resolvePricing(50, [holidayRule], baseCtx({ isHoliday: true }))
    expect(onHoliday.finalRate).toBe(60)
    const offHoliday = resolvePricing(50, [holidayRule], baseCtx({ isHoliday: false }))
    expect(offHoliday.finalRate).toBe(50)

    const nonHolidayRule = baseRule({ isHoliday: false, actionValue: -10 })
    const offDay = resolvePricing(50, [nonHolidayRule], baseCtx({ isHoliday: false }))
    expect(offDay.finalRate).toBe(45)
    const onDay  = resolvePricing(50, [nonHolidayRule], baseCtx({ isHoliday: true }))
    expect(onDay.finalRate).toBe(50)
  })

  it('days_out window gates rule', () => {
    const earlyBird = baseRule({ minDaysOut: 14, actionValue: -10 })
    const tooSoon = resolvePricing(50, [earlyBird], baseCtx({ daysOut: 7 }))
    expect(tooSoon.finalRate).toBe(50)
    const farOut = resolvePricing(50, [earlyBird], baseCtx({ daysOut: 21 }))
    expect(farOut.finalRate).toBe(45)
  })

  it('records audit trail for each applied rule', () => {
    const a = baseRule({ id: 'a', priority: 10, actionValue: 20 })  // +20%
    const b = baseRule({ id: 'b', priority: 20, actionType: 'fixed_amount_adjust', actionValue: -5 })
    const r = resolvePricing(50, [a, b], baseCtx())
    expect(r.appliedRules).toHaveLength(2)
    expect(r.appliedRules[0].rule.id).toBe('a')
    expect(r.appliedRules[0].newRate).toBeCloseTo(60)
    expect(r.appliedRules[1].rule.id).toBe('b')
    expect(r.appliedRules[1].newRate).toBeCloseTo(55)
  })
})

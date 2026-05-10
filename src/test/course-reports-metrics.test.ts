import { describe, it, expect } from 'vitest'
import {
  aggregateUtilizationCells,
  calcOffPeakPct,
  aggregateLoyaltyData,
  aggregateCompData,
} from '@/lib/reports/courseMetrics'

// ── Utilization ────────────────────────────────────────────────────────────────

describe('aggregateUtilizationCells', () => {
  it('counts bookings per day/hour cell', () => {
    const slots = [
      { scheduled_at: '2026-05-05T14:00:00+00:00', confirmedPlayers: [2] },
      { scheduled_at: '2026-05-05T14:00:00+00:00', confirmedPlayers: [4] },
      { scheduled_at: '2026-05-06T09:00:00+00:00', confirmedPlayers: [2] },
    ]
    const cells = aggregateUtilizationCells(slots)
    const cell1 = cells.find(c => c.hourSlot === 10) // 14 UTC = ~10 EST
    expect(cell1?.count).toBeGreaterThanOrEqual(2)
  })

  it('returns empty array for no slots', () => {
    expect(aggregateUtilizationCells([])).toEqual([])
  })
})

describe('calcOffPeakPct', () => {
  it('returns 100 when all bookings are before 10am or after 3pm', () => {
    const cells = [
      { dayOfWeek: 1, hourSlot: 7, count: 10, avgParty: 2 },
      { dayOfWeek: 2, hourSlot: 16, count: 5, avgParty: 2 },
    ]
    expect(calcOffPeakPct(cells)).toBe(100)
  })

  it('returns 0 when all bookings are 10am–3pm', () => {
    const cells = [{ dayOfWeek: 1, hourSlot: 11, count: 20, avgParty: 2 }]
    expect(calcOffPeakPct(cells)).toBe(0)
  })

  it('returns 0 when cells is empty', () => {
    expect(calcOffPeakPct([])).toBe(0)
  })
})

// ── Loyalty ────────────────────────────────────────────────────────────────────

describe('aggregateLoyaltyData', () => {
  it('counts visits per user', () => {
    const bookings = [
      { user_id: 'u1', players: 2 },
      { user_id: 'u1', players: 2 },
      { user_id: 'u2', players: 1 },
    ]
    const result = aggregateLoyaltyData(bookings)
    expect(result.visitsByUser.get('u1')).toBe(2)
    expect(result.visitsByUser.get('u2')).toBe(1)
  })

  it('calculates avg visits per member', () => {
    const bookings = [
      { user_id: 'u1', players: 2 },
      { user_id: 'u1', players: 2 },
      { user_id: 'u2', players: 1 },
    ]
    const result = aggregateLoyaltyData(bookings)
    expect(result.avgVisitsPerMember).toBe(1.5)
  })

  it('counts single-visit members', () => {
    const bookings = [
      { user_id: 'u1', players: 2 },
      { user_id: 'u2', players: 1 },
    ]
    const result = aggregateLoyaltyData(bookings)
    expect(result.singleVisitCount).toBe(2)
  })
})

// ── Comp Rounds ────────────────────────────────────────────────────────────────

describe('aggregateCompData', () => {
  it('counts redeemed comps', () => {
    const bookings = [
      { redemption_type: 'complimentary', base_price: 45 },
      { redemption_type: 'complimentary', base_price: 45 },
      { redemption_type: null, base_price: 45 },
    ]
    const result = aggregateCompData(bookings)
    expect(result.redeemed).toBe(2)
  })

  it('calculates estimated cost from avg green fee', () => {
    const bookings = [
      { redemption_type: 'complimentary', base_price: 50 },
      { redemption_type: 'complimentary', base_price: 50 },
    ]
    const result = aggregateCompData(bookings)
    expect(result.estimatedCostCents).toBe(10000)
  })
})

import { describe, it, expect } from 'vitest'
import {
  calcBarterSavings,
  computeMonthlyBarter,
  isPeakSlot,
  BARTER_SHARE,
  BARTER_TAKE_RATE,
} from '../barter'

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

// ─── NGCOA monthly receipt ───────────────────────────────────────────────────

describe('isPeakSlot (NGCOA peak window classification)', () => {
  // Detroit is UTC-5 in winter, UTC-4 in summer (DST). All test ISO timestamps
  // are constructed in UTC; the function must convert to America/Detroit.

  // Saturday Apr 4 2026 — 9:00 AM Detroit = 13:00 UTC (EDT, UTC-4 by Apr).
  it('Sat 9am Detroit is peak', () => {
    expect(isPeakSlot('2026-04-04T13:00:00Z')).toBe(true)
  })

  // Sunday Apr 5 2026 — 11:00 AM Detroit = 15:00 UTC.
  it('Sun 11am Detroit is peak (upper edge inclusive)', () => {
    expect(isPeakSlot('2026-04-05T15:00:00Z')).toBe(true)
  })

  // Sunday — 6:00 AM Detroit is before the window.
  it('Sun 6am Detroit is NOT peak', () => {
    expect(isPeakSlot('2026-04-05T10:00:00Z')).toBe(false)
  })

  // Sunday — 12:00 PM Detroit is after the window.
  it('Sun 12pm Detroit is NOT peak', () => {
    expect(isPeakSlot('2026-04-05T16:00:00Z')).toBe(false)
  })

  // Tuesday morning — never peak regardless of hour.
  it('Tue 9am Detroit is NOT peak', () => {
    expect(isPeakSlot('2026-04-07T13:00:00Z')).toBe(false)
  })

  // Thursday twilight — Thu Apr 9 2026 5pm Detroit = 21:00 UTC.
  it('Thu 5pm Detroit is peak twilight', () => {
    expect(isPeakSlot('2026-04-09T21:00:00Z')).toBe(true)
  })

  // Friday twilight — Fri Apr 10 2026 7pm Detroit = 23:00 UTC.
  it('Fri 7pm Detroit is peak twilight (upper edge)', () => {
    expect(isPeakSlot('2026-04-10T23:00:00Z')).toBe(true)
  })

  // Friday morning — not in the twilight window.
  it('Fri 9am Detroit is NOT peak', () => {
    expect(isPeakSlot('2026-04-10T13:00:00Z')).toBe(false)
  })

  // DST boundary check — Saturday Mar 14 2026 (before DST), Detroit on EST.
  // 9:00 AM Detroit = 14:00 UTC (EST, UTC-5).
  it('Sat 9am Detroit in winter (EST) is peak', () => {
    expect(isPeakSlot('2026-03-14T14:00:00Z')).toBe(true)
  })
})

describe('computeMonthlyBarter', () => {
  const monthStart = new Date(Date.UTC(2026, 3, 1)) // April 2026

  function slot(scheduled_at: string, players: number, total_paid: number, status = 'confirmed') {
    return { scheduled_at, bookings: [{ players, total_paid, status }] }
  }

  it('matches the spec example: 1247 rounds, 38% peak, $58 avg → ~$7k', () => {
    // Build a synthetic month where:
    //   peak slots (Sat 9am):   474 rounds at $58
    //   off-peak (Tue 9am):     773 rounds at $58
    //   total = 1247, peak = 474 (38.0%), avg = $58
    //   estimated_barter_rounds = round(474 * 0.30) = 142
    //   estimated_barter_cost   = 142 * 58 * 0.85   = 7001.56
    const slots: Array<{ scheduled_at: string; bookings: Array<{ players: number; total_paid: number; status: string }> }> = []
    // 119 peak Sat slots × 4 players = 476 rounds
    // We need exactly 474, so 118 slots × 4 + 1 slot × 2 = 472 + 2 = 474. Use 4-person slots minus 1 player.
    for (let i = 0; i < 118; i++) {
      slots.push(slot('2026-04-04T13:00:00Z', 4, 4 * 58))
    }
    slots.push(slot('2026-04-04T13:00:00Z', 2, 2 * 58)) // 472 + 2 = 474 peak rounds
    // Off-peak: Tuesday 9am Detroit. 193 slots × 4 + 1 × 1 = 772 + 1 = 773 rounds.
    for (let i = 0; i < 193; i++) {
      slots.push(slot('2026-04-07T13:00:00Z', 4, 4 * 58))
    }
    slots.push(slot('2026-04-07T13:00:00Z', 1, 1 * 58))

    const result = computeMonthlyBarter({ slots, courseId: 'c1', monthStart })
    expect(result).not.toBeNull()
    expect(result!.totalRounds).toBe(1247)
    expect(result!.peakRounds).toBe(474)
    expect(result!.peakPct).toBeCloseTo(38.01, 1)
    expect(result!.avgGreenFee).toBeCloseTo(58, 1)
    expect(result!.estimatedBarterRounds).toBe(142) // round(474 * 0.30)
    expect(result!.estimatedBarterCost).toBeCloseTo(142 * 58 * 0.85, 0) // ~7001.56
  })

  it('returns null when the month has no played rounds', () => {
    expect(computeMonthlyBarter({ slots: [], courseId: 'c1', monthStart })).toBeNull()
  })

  it('returns null when all bookings were canceled', () => {
    const slots = [slot('2026-04-04T13:00:00Z', 4, 0, 'canceled')]
    expect(computeMonthlyBarter({ slots, courseId: 'c1', monthStart })).toBeNull()
  })

  it('excludes no_show bookings from the round count', () => {
    const slots = [
      slot('2026-04-04T13:00:00Z', 4, 4 * 50, 'confirmed'),
      slot('2026-04-04T13:00:00Z', 4, 0, 'no_show'),
    ]
    const result = computeMonthlyBarter({ slots, courseId: 'c1', monthStart })
    expect(result!.totalRounds).toBe(4)
  })

  it('includes completed bookings as played rounds', () => {
    const slots = [slot('2026-04-04T13:00:00Z', 4, 4 * 50, 'completed')]
    const result = computeMonthlyBarter({ slots, courseId: 'c1', monthStart })
    expect(result!.totalRounds).toBe(4)
  })

  it('returns receiptMonth as ISO YYYY-MM-DD', () => {
    const slots = [slot('2026-04-04T13:00:00Z', 1, 50)]
    const result = computeMonthlyBarter({ slots, courseId: 'c1', monthStart })
    expect(result!.receiptMonth).toBe('2026-04-01')
  })

  it('uses the documented constants', () => {
    expect(BARTER_SHARE).toBe(0.30)
    expect(BARTER_TAKE_RATE).toBe(0.85)
  })
})

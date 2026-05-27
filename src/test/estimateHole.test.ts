import { describe, it, expect } from 'vitest'
import { estimateHole } from '@/lib/estimateHole'

describe('estimateHole', () => {
  const baseTime = new Date('2026-05-02T08:00:00Z')

  it('returns null when elapsed time is negative (before tee time)', () => {
    const now = new Date(baseTime.getTime() - 30 * 60000) // 30 minutes before
    const result = estimateHole(baseTime, now)
    expect(result).toBeNull()
  })

  it('returns 1 at tee time (0 elapsed minutes)', () => {
    const result = estimateHole(baseTime, baseTime)
    expect(result).toBe(1)
  })

  it('returns 6 after 60 minutes elapsed', () => {
    const now = new Date(baseTime.getTime() + 60 * 60000)
    const result = estimateHole(baseTime, now)
    expect(result).toBe(6) // Math.round(60/12) + 1 = 5 + 1 = 6
  })

  it('returns 16 after 180 minutes elapsed', () => {
    const now = new Date(baseTime.getTime() + 180 * 60000)
    const result = estimateHole(baseTime, now)
    expect(result).toBe(16) // Math.round(180/12) + 1 = 15 + 1 = 16
  })

  it('returns 18 when elapsed time exceeds 216 minutes', () => {
    const now = new Date(baseTime.getTime() + 250 * 60000) // 250 minutes in
    const result = estimateHole(baseTime, now)
    expect(result).toBe(18) // capped at 18
  })
})

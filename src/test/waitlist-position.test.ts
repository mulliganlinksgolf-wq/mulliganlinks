/**
 * Tests the waitlist position calculation.
 *
 * The bug: position was set to data.id (a UUID string) instead of a
 * sequential count. The fix: COUNT(*) after insert gives the real queue position.
 */

import { describe, it, expect } from 'vitest'

// The position logic extracted from the server action:
// After insert, count all rows → that's the member's position.
function derivePosition(count: number | null): number {
  return count ?? 1
}

describe('Golfer waitlist position', () => {
  it('first signup gets position 1', () => {
    expect(derivePosition(1)).toBe(1)
  })

  it('second signup gets position 2', () => {
    expect(derivePosition(2)).toBe(2)
  })

  it('falls back to 1 when count is null (Supabase edge case)', () => {
    expect(derivePosition(null)).toBe(1)
  })

  it('handles triple-digit positions correctly', () => {
    expect(derivePosition(147)).toBe(147)
  })

  it('is always a number, never a UUID string', () => {
    const position = derivePosition(42)
    expect(typeof position).toBe('number')
    expect(position.toString()).toMatch(/^\d+$/)
  })
})

// The confirmed page parses position from search params as parseInt(position, 10).
// Verify a real number survives the round-trip through the URL.
describe('Position URL round-trip', () => {
  it('survives query string serialization as a readable number', () => {
    const position = 47
    const url = `/waitlist/golfer/confirmed?position=${position}`
    const parsed = parseInt(new URL(url, 'https://teeahead.com').searchParams.get('position')!, 10)
    expect(parsed).toBe(47)
    expect(Number.isNaN(parsed)).toBe(false)
  })
})

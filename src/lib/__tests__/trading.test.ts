// src/lib/__tests__/trading.test.ts
import { describe, it, expect } from 'vitest'
import {
  calcListingExpiry,
  canCreateListing,
  formatCredit,
  isListingClaimable,
} from '@/lib/trading'
import type { TeeTimeListing } from '@/lib/trading'

describe('calcListingExpiry', () => {
  it('subtracts minHoursBefore from scheduled time', () => {
    const result = calcListingExpiry('2026-05-10T14:00:00.000Z', 4)
    expect(result.toISOString()).toBe('2026-05-10T10:00:00.000Z')
  })

  it('handles 2-hour minimum', () => {
    const result = calcListingExpiry('2026-05-10T08:00:00.000Z', 2)
    expect(result.toISOString()).toBe('2026-05-10T06:00:00.000Z')
  })
})

describe('canCreateListing', () => {
  // tee time 10 hours from now — comfortably eligible with 4h min
  const soon = new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString()
  // tee time 2 hours from now — too close for 4h minimum
  const tooClose = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
  // tee time in the past
  const past = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  it('returns true when all conditions met', () => {
    expect(canCreateListing({
      scheduledAt: soon,
      bookingStatus: 'confirmed',
      tradingEnabled: true,
      minHoursBefore: 4,
    })).toBe(true)
  })

  it('returns false when trading disabled on course', () => {
    expect(canCreateListing({
      scheduledAt: soon,
      bookingStatus: 'confirmed',
      tradingEnabled: false,
      minHoursBefore: 4,
    })).toBe(false)
  })

  it('returns false when booking is not confirmed', () => {
    expect(canCreateListing({
      scheduledAt: soon,
      bookingStatus: 'cancelled',
      tradingEnabled: true,
      minHoursBefore: 4,
    })).toBe(false)
  })

  it('returns false when tee time is within minHoursBefore', () => {
    expect(canCreateListing({
      scheduledAt: tooClose,
      bookingStatus: 'confirmed',
      tradingEnabled: true,
      minHoursBefore: 4,
    })).toBe(false)
  })

  it('returns false when tee time is in the past', () => {
    expect(canCreateListing({
      scheduledAt: past,
      bookingStatus: 'confirmed',
      tradingEnabled: true,
      minHoursBefore: 4,
    })).toBe(false)
  })
})

describe('formatCredit', () => {
  it('formats cents as dollar string', () => {
    expect(formatCredit(5000)).toBe('$50.00')
    expect(formatCredit(0)).toBe('$0.00')
    expect(formatCredit(2599)).toBe('$25.99')
    expect(formatCredit(100)).toBe('$1.00')
  })
})

describe('isListingClaimable', () => {
  const futureExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString()
  const pastExpiry   = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  const makeListing = (status: string, expires_at: string): TeeTimeListing =>
    ({ status, expires_at } as TeeTimeListing)

  it('returns true for active listing with future expiry', () => {
    expect(isListingClaimable(makeListing('active', futureExpiry))).toBe(true)
  })

  it('returns false for claimed listing', () => {
    expect(isListingClaimable(makeListing('claimed', futureExpiry))).toBe(false)
  })

  it('returns false for cancelled listing', () => {
    expect(isListingClaimable(makeListing('cancelled', futureExpiry))).toBe(false)
  })

  it('returns false for active listing past expiry', () => {
    expect(isListingClaimable(makeListing('active', pastExpiry))).toBe(false)
  })
})

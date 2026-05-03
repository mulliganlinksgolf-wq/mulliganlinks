// src/lib/trading.ts

export interface TeeTimeListing {
  id: string
  tee_time_id: string
  course_id: string
  listed_by_member_id: string
  booking_id: string
  credit_amount_cents: number
  status: 'active' | 'claimed' | 'cancelled' | 'expired'
  listed_at: string
  expires_at: string
  claimed_by_member_id: string | null
  claimed_at: string | null
}

export interface TeeTimeTransfer {
  id: string
  listing_id: string
  from_member_id: string
  to_member_id: string
  course_id: string
  credit_issued_cents: number
  transferred_at: string
}

/**
 * The expiry time for a listing: `minHoursBefore` hours before the tee time.
 * After this point, unclaimed listings auto-expire (filtered out on read).
 */
export function calcListingExpiry(scheduledAt: string, minHoursBefore: number): Date {
  const ms = minHoursBefore * 60 * 60 * 1000
  return new Date(new Date(scheduledAt).getTime() - ms)
}

/**
 * Returns true if the member is allowed to create a listing for this booking.
 * All conditions must be met: trading enabled, booking confirmed, enough lead time.
 */
export function canCreateListing(params: {
  scheduledAt: string
  bookingStatus: string
  tradingEnabled: boolean
  minHoursBefore: number
  now?: Date
}): boolean {
  const { scheduledAt, bookingStatus, tradingEnabled, minHoursBefore, now = new Date() } = params
  if (!tradingEnabled) return false
  if (bookingStatus !== 'confirmed') return false
  const expiry = calcListingExpiry(scheduledAt, minHoursBefore)
  return expiry > now
}

/**
 * Format a credit balance in cents to a display string.
 * 5000 → "$50.00"
 */
export function formatCredit(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

/**
 * Returns true if a listing can still be claimed right now.
 */
export function isListingClaimable(listing: TeeTimeListing, now: Date = new Date()): boolean {
  return listing.status === 'active' && new Date(listing.expires_at) > now
}

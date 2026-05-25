import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeAvailability } from './tee-time-availability';

describe('computeAvailability (pure transform)', () => {
  it('flags an empty slot as not partial, not full, with all spots open', () => {
    const out = computeAvailability({
      tee_time_id: 't1',
      scheduled_at: '2026-06-01T13:00:00Z',
      max_players: 4,
      players_booked: 0,
      spots_remaining: 4,
      has_self_grouped_bookings: false,
    });
    expect(out).toEqual({
      teeTimeId: 't1',
      scheduledAt: '2026-06-01T13:00:00Z',
      spotsRemaining: 4,
      isFull: false,
      isPartiallyBooked: false,
      hasSelfGroupedBookings: false,
    });
  });

  it('flags a 3-of-4 slot as partial with 1 spot open', () => {
    const out = computeAvailability({
      tee_time_id: 't2',
      scheduled_at: '2026-06-01T13:00:00Z',
      max_players: 4,
      players_booked: 3,
      spots_remaining: 1,
      has_self_grouped_bookings: true,
    });
    expect(out.isPartiallyBooked).toBe(true);
    expect(out.isFull).toBe(false);
    expect(out.spotsRemaining).toBe(1);
  });

  it('flags a 4-of-4 slot as full, not partial', () => {
    const out = computeAvailability({
      tee_time_id: 't3',
      scheduled_at: '2026-06-01T13:00:00Z',
      max_players: 4,
      players_booked: 4,
      spots_remaining: 0,
      has_self_grouped_bookings: false,
    });
    expect(out.isFull).toBe(true);
    expect(out.isPartiallyBooked).toBe(false);
  });

  it('clamps negative spots_remaining to 0 (defensive)', () => {
    const out = computeAvailability({
      tee_time_id: 't4',
      scheduled_at: '2026-06-01T13:00:00Z',
      max_players: 4,
      players_booked: 5,
      spots_remaining: -1,
      has_self_grouped_bookings: false,
    });
    expect(out.spotsRemaining).toBe(0);
    expect(out.isFull).toBe(true);
  });
});

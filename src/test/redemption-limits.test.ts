import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { checkRedemptionAllowed } from '@/lib/redemption'

const NOW      = new Date('2026-05-09T12:00:00Z')
const FUTURE   = new Date('2026-05-12T10:00:00Z').toISOString() // 3 days out — clears 48h notice
const TOO_SOON = new Date('2026-05-09T14:00:00Z').toISOString() // 2 hours out

const DEFAULT_SETTINGS = {
  points_threshold: 5000,
  max_redemptions_fairway: 1,
  max_redemptions_eagle: 2,
  max_redemptions_ace: 3,
  blackout_dates: [] as string[],
  eligible_slot_start: null as string | null,
  eligible_slot_end: null as string | null,
  monthly_redemption_cap: null as number | null,
  notice_hours: 48,
}

const BASE = {
  courseId: 'course-1',
  userId: 'user-1',
  tier: 'eagle',
  teeTimeAt: FUTURE,
  membershipCreatedAt: '2025-01-01T00:00:00Z',
  redemptionType: 'points' as const,
  pointsBalance: 6000,
}

// Build a supabase mock. bookingsCallResults[0] = seasonal query count,
// bookingsCallResults[1] = monthly query count.
function buildMock({
  settings = DEFAULT_SETTINGS as typeof DEFAULT_SETTINGS | null,
  bookingsCallResults = [{ count: 0 }, { count: 0 }],
}: {
  settings?: typeof DEFAULT_SETTINGS | null
  bookingsCallResults?: Array<{ count: number }>
} = {}) {
  let bookingsIdx = 0
  return {
    from: vi.fn((table: string) => {
      if (table === 'course_redemption_settings') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: settings, error: null }),
        }
      }
      if (table === 'bookings') {
        const result = bookingsCallResults[bookingsIdx++] ?? { count: 0 }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          then: (resolve: (v: { count: number; error: null }) => void) =>
            resolve({ count: result.count, error: null }),
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
    }),
  }
}

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW) })
afterEach(() => vi.useRealTimers())

describe('notice period', () => {
  it('blocks when tee time is less than notice_hours away', async () => {
    const result = await checkRedemptionAllowed(buildMock() as never, { ...BASE, teeTimeAt: TOO_SOON })
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('48 hours') })
  })

  it('passes when tee time is far enough out', async () => {
    const result = await checkRedemptionAllowed(buildMock() as never, BASE)
    expect(result).toMatchObject({ ok: true })
  })
})

describe('blackout dates', () => {
  it('blocks on a blackout date', async () => {
    const s = { ...DEFAULT_SETTINGS, blackout_dates: ['2026-05-12'] }
    const result = await checkRedemptionAllowed(buildMock({ settings: s }) as never, BASE)
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('not eligible') })
  })

  it('passes on a non-blackout date', async () => {
    const s = { ...DEFAULT_SETTINGS, blackout_dates: ['2026-05-13'] }
    const result = await checkRedemptionAllowed(buildMock({ settings: s }) as never, BASE)
    expect(result).toMatchObject({ ok: true })
  })
})

describe('eligible slot window', () => {
  it('blocks when tee time is outside the window', async () => {
    // FUTURE tee time is 10:00 UTC; window is 14:00–18:00
    const s = { ...DEFAULT_SETTINGS, eligible_slot_start: '14:00', eligible_slot_end: '18:00' }
    const result = await checkRedemptionAllowed(buildMock({ settings: s }) as never, BASE)
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('14:00') })
  })

  it('skips window check when both times are null', async () => {
    const result = await checkRedemptionAllowed(buildMock() as never, BASE)
    expect(result).toMatchObject({ ok: true })
  })
})

describe('points threshold', () => {
  it('blocks when balance is below threshold', async () => {
    const result = await checkRedemptionAllowed(buildMock() as never, { ...BASE, pointsBalance: 3000 })
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('5,000 points') })
  })

  it('passes when balance meets threshold', async () => {
    const result = await checkRedemptionAllowed(buildMock() as never, { ...BASE, pointsBalance: 5000 })
    expect(result).toMatchObject({ ok: true })
  })

  it('skips threshold check for complimentary redemption', async () => {
    const result = await checkRedemptionAllowed(buildMock() as never, {
      ...BASE,
      redemptionType: 'complimentary',
      pointsBalance: 0,
    })
    expect(result).toMatchObject({ ok: true })
  })
})

describe('seasonal cap', () => {
  it('blocks when eagle member has hit seasonal cap (2)', async () => {
    const mock = buildMock({ bookingsCallResults: [{ count: 2 }, { count: 0 }] })
    const result = await checkRedemptionAllowed(mock as never, BASE)
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('redemption limit') })
  })

  it('passes when under seasonal cap', async () => {
    const mock = buildMock({ bookingsCallResults: [{ count: 1 }, { count: 0 }] })
    const result = await checkRedemptionAllowed(mock as never, BASE)
    expect(result).toMatchObject({ ok: true })
  })

  it('skips seasonal cap check for complimentary redemption', async () => {
    const mock = buildMock({ bookingsCallResults: [{ count: 99 }, { count: 0 }] })
    const result = await checkRedemptionAllowed(mock as never, {
      ...BASE,
      redemptionType: 'complimentary',
    })
    expect(result).toMatchObject({ ok: true })
  })
})

describe('monthly cap', () => {
  it('blocks when course monthly cap is reached', async () => {
    const s = { ...DEFAULT_SETTINGS, monthly_redemption_cap: 5 }
    const mock = buildMock({ settings: s, bookingsCallResults: [{ count: 0 }, { count: 5 }] })
    const result = await checkRedemptionAllowed(mock as never, BASE)
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('monthly redemption limit') })
  })

  it('skips monthly cap check when cap is null', async () => {
    const mock = buildMock({ bookingsCallResults: [{ count: 0 }, { count: 999 }] })
    const result = await checkRedemptionAllowed(mock as never, BASE)
    expect(result).toMatchObject({ ok: true })
  })

  it('applies monthly cap to complimentary redemptions too', async () => {
    const s = { ...DEFAULT_SETTINGS, monthly_redemption_cap: 3 }
    const mock = buildMock({ settings: s, bookingsCallResults: [{ count: 3 }] })
    const result = await checkRedemptionAllowed(mock as never, {
      ...BASE,
      redemptionType: 'complimentary',
    })
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('monthly redemption limit') })
  })
})

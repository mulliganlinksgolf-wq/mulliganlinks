import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockAuthGetUser, mockFrom } = vi.hoisted(() => ({
  mockAuthGetUser: vi.fn(),
  mockFrom: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockAuthGetUser },
    from: mockFrom,
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn().mockReturnValue({
    from: mockFrom,
  }),
}))

function makeChain(overrides: Partial<{ data: unknown; error: unknown }> = {}) {
  const base = { data: overrides.data ?? null, error: overrides.error ?? null }
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq',
                   'order', 'limit', 'single', 'maybeSingle']
  for (const m of methods) chain[m] = vi.fn().mockReturnThis()
  chain['then'] = (resolve: (v: typeof base) => unknown) => Promise.resolve(resolve(base))
  return chain as any
}

const COURSE_ID = 'course-uuid'

const SAMPLE_HOURS = [
  { dayOfWeek: 0, label: 'Monday', isOpen: true, openTime: '07:00', closeTime: '18:00' },
  { dayOfWeek: 1, label: 'Tuesday', isOpen: false, openTime: '07:00', closeTime: '18:00' },
]

const SAMPLE_TIERS = [
  { id: 'r1', rateName: 'Weekday 18-hole', greenFeeCents: 6500, cartFeeCents: 1800 },
]

const SAMPLE_CONFIG = {
  interval_minutes: 10,
  max_players: 4,
  advance_booking_days: 30,
  cart_policy: 'optional' as const,
  cancellation_window_minutes: 60,
  rain_check_policy: 'full_credit' as const,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

// ---------------------------------------------------------------------------
// updateCourseHours
// ---------------------------------------------------------------------------

describe('updateCourseHours', () => {
  it('returns error when not authenticated', async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null } })

    const { updateCourseHours } = await import('@/lib/actions/teeSheetSettings')
    const result = await updateCourseHours(COURSE_ID, SAMPLE_HOURS)
    expect(result.error).toBe('Not authenticated')
  })

  it('returns error when user is not staff for this course', async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    // staff check returns null (not found)
    mockFrom.mockReturnValue(makeChain({ data: null }))

    const { updateCourseHours } = await import('@/lib/actions/teeSheetSettings')
    const result = await updateCourseHours(COURSE_ID, SAMPLE_HOURS)
    expect(result.error).toBe('Unauthorized')
  })

  it('calls upsert with correct data when authorized', async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

    const staffChain = makeChain({ data: { user_id: 'u1' } })
    const upsertChain = makeChain({ data: null, error: null })
    mockFrom
      .mockReturnValueOnce(staffChain)
      .mockReturnValueOnce(upsertChain)

    const { updateCourseHours } = await import('@/lib/actions/teeSheetSettings')
    const result = await updateCourseHours(COURSE_ID, SAMPLE_HOURS)

    expect(result.error).toBeUndefined()
    expect(upsertChain.upsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ course_id: COURSE_ID, day_of_week: 0, is_open: true }),
        expect.objectContaining({ course_id: COURSE_ID, day_of_week: 1, is_open: false }),
      ]),
      { onConflict: 'course_id,day_of_week' },
    )
  })

  it('returns error when upsert fails', async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

    const staffChain = makeChain({ data: { user_id: 'u1' } })
    const upsertChain = makeChain({ error: { message: 'DB error' } })
    mockFrom
      .mockReturnValueOnce(staffChain)
      .mockReturnValueOnce(upsertChain)

    const { updateCourseHours } = await import('@/lib/actions/teeSheetSettings')
    const result = await updateCourseHours(COURSE_ID, SAMPLE_HOURS)
    expect(result.error).toBe('DB error')
  })
})

// ---------------------------------------------------------------------------
// updateCoursePricing
// ---------------------------------------------------------------------------

describe('updateCoursePricing', () => {
  it('returns error when not authenticated', async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null } })

    const { updateCoursePricing } = await import('@/lib/actions/teeSheetSettings')
    const result = await updateCoursePricing(COURSE_ID, SAMPLE_TIERS)
    expect(result.error).toBe('Not authenticated')
  })

  it('returns error when user is not staff for this course', async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockFrom.mockReturnValue(makeChain({ data: null }))

    const { updateCoursePricing } = await import('@/lib/actions/teeSheetSettings')
    const result = await updateCoursePricing(COURSE_ID, SAMPLE_TIERS)
    expect(result.error).toBe('Unauthorized')
  })

  it('calls upsert with correct data when authorized', async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

    const staffChain = makeChain({ data: { user_id: 'u1' } })
    const upsertChain = makeChain({ data: null, error: null })
    mockFrom
      .mockReturnValueOnce(staffChain)
      .mockReturnValueOnce(upsertChain)

    const { updateCoursePricing } = await import('@/lib/actions/teeSheetSettings')
    const result = await updateCoursePricing(COURSE_ID, SAMPLE_TIERS)

    expect(result.error).toBeUndefined()
    expect(upsertChain.upsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          course_id: COURSE_ID,
          rate_name: 'Weekday 18-hole',
          green_fee_cents: 6500,
          cart_fee_cents: 1800,
          is_active: true,
        }),
      ]),
      { onConflict: 'course_id,rate_name' },
    )
  })
})

// ---------------------------------------------------------------------------
// updateTeeSheetConfig
// ---------------------------------------------------------------------------

describe('updateTeeSheetConfig', () => {
  it('returns error when not authenticated', async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null } })

    const { updateTeeSheetConfig } = await import('@/lib/actions/teeSheetSettings')
    const result = await updateTeeSheetConfig(COURSE_ID, SAMPLE_CONFIG)
    expect(result.error).toBe('Not authenticated')
  })

  it('returns error when user is not staff for this course', async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockFrom.mockReturnValue(makeChain({ data: null }))

    const { updateTeeSheetConfig } = await import('@/lib/actions/teeSheetSettings')
    const result = await updateTeeSheetConfig(COURSE_ID, SAMPLE_CONFIG)
    expect(result.error).toBe('Unauthorized')
  })

  it('calls upsert with course_id merged in when authorized', async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

    const staffChain = makeChain({ data: { user_id: 'u1' } })
    const upsertChain = makeChain({ data: null, error: null })
    mockFrom
      .mockReturnValueOnce(staffChain)
      .mockReturnValueOnce(upsertChain)

    const { updateTeeSheetConfig } = await import('@/lib/actions/teeSheetSettings')
    const result = await updateTeeSheetConfig(COURSE_ID, SAMPLE_CONFIG)

    expect(result.error).toBeUndefined()
    expect(upsertChain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ course_id: COURSE_ID, interval_minutes: 10, max_players: 4 }),
      { onConflict: 'course_id' },
    )
  })
})

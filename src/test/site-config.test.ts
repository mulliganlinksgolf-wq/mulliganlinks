import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSelect = vi.fn()
const mockFrom = vi.fn(() => ({ select: mockSelect }))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: mockFrom }),
}))

import { getSiteConfig, getConfigValue, isFeatureEnabled, isLiveMode } from '@/lib/site-config'

const seedRows = [
  { key: 'launch_mode',             value: 'waitlist' },
  { key: 'metro_area_name',         value: 'Metro Detroit' },
  { key: 'flag_golfer_waitlist',    value: 'true' },
  { key: 'flag_membership_signups', value: 'false' },
  { key: 'fee_fairway_booking',     value: '1.49' },
]

beforeEach(() => {
  vi.clearAllMocks()
  mockSelect.mockResolvedValue({ data: seedRows, error: null })
})

describe('getSiteConfig', () => {
  it('returns a key→value map of all config rows', async () => {
    const config = await getSiteConfig()
    expect(config['launch_mode']).toBe('waitlist')
    expect(config['metro_area_name']).toBe('Metro Detroit')
  })

  it('throws when supabase returns an error', async () => {
    mockSelect.mockResolvedValue({ data: null, error: { message: 'db error' } })
    await expect(getSiteConfig()).rejects.toThrow('Failed to load site config: db error')
  })
})

describe('getConfigValue', () => {
  it('returns the value for a known key', async () => {
    expect(await getConfigValue('metro_area_name')).toBe('Metro Detroit')
  })

  it('returns null for an unknown key', async () => {
    expect(await getConfigValue('nonexistent_key')).toBeNull()
  })
})

describe('isFeatureEnabled', () => {
  it('returns true when flag value is "true"', async () => {
    expect(await isFeatureEnabled('golfer_waitlist')).toBe(true)
  })

  it('returns false when flag value is "false"', async () => {
    expect(await isFeatureEnabled('membership_signups')).toBe(false)
  })

  it('returns false for unknown flags', async () => {
    expect(await isFeatureEnabled('unknown_flag')).toBe(false)
  })
})

describe('isLiveMode', () => {
  it('returns false when launch_mode is "waitlist"', async () => {
    expect(await isLiveMode()).toBe(false)
  })

  it('returns true when launch_mode is "live"', async () => {
    mockSelect.mockResolvedValue({
      data: [{ key: 'launch_mode', value: 'live' }],
      error: null,
    })
    expect(await isLiveMode()).toBe(true)
  })
})

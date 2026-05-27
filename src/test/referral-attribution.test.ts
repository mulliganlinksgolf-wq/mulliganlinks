/**
 * Unit tests for referral attribution logic.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/headers cookies (use in-closure map to avoid hoisting issues)
const mockCookies = new Map<string, string>()
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: (name: string) => mockCookies.has(name) ? { value: mockCookies.get(name) } : undefined,
    set: vi.fn((name: string, value: string) => mockCookies.set(name, value)),
    delete: vi.fn((name: string) => mockCookies.delete(name)),
  }),
}))

// Mock supabase server — use a module-level var that gets reset in beforeEach
let mockSingleResult: { data: unknown } = { data: null }

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      get single() {
        return vi.fn().mockImplementation(() => Promise.resolve(mockSingleResult))
      },
    }),
  }),
}))

import { captureReferralCode, getReferralCodeFromCookie, clearReferralCookie } from '@/lib/referrals/capture'

describe('captureReferralCode', () => {
  beforeEach(() => {
    mockCookies.clear()
    mockSingleResult = { data: null }
  })

  it('sets cookie when code resolves to an active course', async () => {
    mockSingleResult = { data: { id: 'course-1', referral_code: 'test-course' } }
    await captureReferralCode('test-course')
    expect(mockCookies.get('ta_ref')).toBe('test-course')
  })

  it('does nothing when code is null', async () => {
    await captureReferralCode(null)
    expect(mockCookies.has('ta_ref')).toBe(false)
  })

  it('silently ignores invalid or inactive codes', async () => {
    mockSingleResult = { data: null }
    await captureReferralCode('fake-code')
    expect(mockCookies.has('ta_ref')).toBe(false)
  })
})

describe('getReferralCodeFromCookie', () => {
  beforeEach(() => mockCookies.clear())

  it('returns null when no cookie is set', async () => {
    const code = await getReferralCodeFromCookie()
    expect(code).toBeNull()
  })

  it('returns the stored code', async () => {
    mockCookies.set('ta_ref', 'my-course')
    const code = await getReferralCodeFromCookie()
    expect(code).toBe('my-course')
  })
})

describe('clearReferralCookie', () => {
  it('removes the cookie', async () => {
    mockCookies.set('ta_ref', 'my-course')
    await clearReferralCookie()
    expect(mockCookies.has('ta_ref')).toBe(false)
  })
})

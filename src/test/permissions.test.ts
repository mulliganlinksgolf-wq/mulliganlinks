import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockAuthGetUser, mockRpc, mockRedirect } = vi.hoisted(() => ({
  mockAuthGetUser: vi.fn(),
  mockRpc: vi.fn(),
  mockRedirect: vi.fn((path: string) => {
    throw new Error(`__REDIRECT__:${path}`)
  }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockAuthGetUser },
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn().mockReturnValue({
    rpc: mockRpc,
  }),
}))

vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}))

import {
  COURSE_PERMISSIONS,
  hasPermission,
  requirePermission,
  getEffectivePermissions,
} from '@/lib/permissions'

const COURSE_ID = '11111111-1111-1111-1111-111111111111'
const USER_ID = '22222222-2222-2222-2222-222222222222'
const SLUG = 'fox-creek'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('hasPermission', () => {
  it('returns true when rpc returns true', async () => {
    mockRpc.mockResolvedValueOnce({ data: true, error: null })
    const result = await hasPermission(USER_ID, COURSE_ID, 'view_tee_sheet')
    expect(result).toBe(true)
    expect(mockRpc).toHaveBeenCalledWith('user_has_course_permission', {
      p_user_id: USER_ID,
      p_course_id: COURSE_ID,
      p_permission: 'view_tee_sheet',
    })
  })

  it('returns false when rpc returns false', async () => {
    mockRpc.mockResolvedValueOnce({ data: false, error: null })
    expect(await hasPermission(USER_ID, COURSE_ID, 'void_transaction')).toBe(false)
  })

  it('returns false when rpc returns null/undefined', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: null })
    expect(await hasPermission(USER_ID, COURSE_ID, 'view_tee_sheet')).toBe(false)
  })

  it('returns false on rpc error (does not throw)', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'kaboom' } })
    expect(await hasPermission(USER_ID, COURSE_ID, 'view_tee_sheet')).toBe(false)
  })
})

describe('requirePermission', () => {
  it('redirects to /login when no user', async () => {
    mockAuthGetUser.mockResolvedValueOnce({ data: { user: null } })
    await expect(requirePermission(SLUG, COURSE_ID, 'manage_staff'))
      .rejects.toThrow(`__REDIRECT__:/course/${SLUG}/login`)
  })

  it('redirects to /unauthorized when permission denied', async () => {
    mockAuthGetUser.mockResolvedValueOnce({ data: { user: { id: USER_ID } } })
    mockRpc.mockResolvedValueOnce({ data: false, error: null })
    await expect(requirePermission(SLUG, COURSE_ID, 'void_transaction'))
      .rejects.toThrow(`__REDIRECT__:/course/${SLUG}/unauthorized`)
  })

  it('returns userId when allowed', async () => {
    mockAuthGetUser.mockResolvedValueOnce({ data: { user: { id: USER_ID } } })
    mockRpc.mockResolvedValueOnce({ data: true, error: null })
    const result = await requirePermission(SLUG, COURSE_ID, 'view_tee_sheet')
    expect(result).toEqual({ userId: USER_ID })
    expect(mockRedirect).not.toHaveBeenCalled()
  })
})

describe('getEffectivePermissions', () => {
  it('returns one entry per known permission', async () => {
    mockRpc.mockImplementation(async (_fn: string, args: { p_permission: string }) => ({
      data: args.p_permission === 'manage_staff',
      error: null,
    }))
    const result = await getEffectivePermissions(USER_ID, COURSE_ID)
    expect(Object.keys(result).sort()).toEqual([...COURSE_PERMISSIONS].sort())
    expect(result.manage_staff).toBe(true)
    expect(result.view_tee_sheet).toBe(false)
    expect(mockRpc).toHaveBeenCalledTimes(COURSE_PERMISSIONS.length)
  })

  it('coerces null/undefined rpc results to false', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null })
    const result = await getEffectivePermissions(USER_ID, COURSE_ID)
    for (const p of COURSE_PERMISSIONS) {
      expect(result[p]).toBe(false)
    }
  })
})

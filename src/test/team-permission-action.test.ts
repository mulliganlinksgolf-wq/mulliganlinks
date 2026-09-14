import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  mockRequirePermission,
  mockUpsert,
  mockDelete,
  mockWriteAuditLog,
  mockRevalidatePath,
} = vi.hoisted(() => {
  const deleteEqChain = {
    eq: vi.fn().mockReturnThis(),
  }
  // Make .eq() resolve at the end of the chain by overriding the final call.
  return {
    mockRequirePermission: vi.fn(),
    mockUpsert: vi.fn(),
    mockDelete: vi.fn(),
    mockDeleteEq: deleteEqChain,
    mockWriteAuditLog: vi.fn().mockResolvedValue(undefined),
    mockRevalidatePath: vi.fn(),
  }
})

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      upsert: mockUpsert,
      delete: mockDelete,
    }),
  }),
}))

vi.mock('@/lib/permissions', async () => {
  const actual = await vi.importActual<typeof import('@/lib/permissions')>(
    '@/lib/permissions',
  )
  return {
    ...actual,
    requirePermission: mockRequirePermission,
  }
})

vi.mock('@/lib/audit', () => ({
  writeAuditLog: mockWriteAuditLog,
}))

vi.mock('next/cache', () => ({
  revalidatePath: mockRevalidatePath,
}))

import {
  togglePermissionAction,
  resetPermissionToDefaultAction,
} from '@/app/course/[slug]/settings/team/actions'

const COURSE_ID = '11111111-1111-1111-1111-111111111111'
const ACTOR_ID = '22222222-2222-2222-2222-222222222222'
const TARGET_ID = '33333333-3333-3333-3333-333333333333'
const SLUG = 'fox-creek'

beforeEach(() => {
  vi.clearAllMocks()
  mockRequirePermission.mockResolvedValue({ userId: ACTOR_ID })
})

describe('togglePermissionAction', () => {
  it('requires manage_staff before writing', async () => {
    mockUpsert.mockResolvedValue({ error: null })
    await togglePermissionAction({
      courseId: COURSE_ID,
      slug: SLUG,
      userId: TARGET_ID,
      permission: 'void_transaction',
      granted: false,
    })
    expect(mockRequirePermission).toHaveBeenCalledWith(SLUG, COURSE_ID, 'manage_staff')
  })

  it('upserts staff_permissions with the right shape', async () => {
    mockUpsert.mockResolvedValue({ error: null })
    await togglePermissionAction({
      courseId: COURSE_ID,
      slug: SLUG,
      userId: TARGET_ID,
      permission: 'void_transaction',
      granted: false,
    })
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        course_id: COURSE_ID,
        user_id: TARGET_ID,
        permission: 'void_transaction',
        granted: false,
        granted_by: ACTOR_ID,
      },
      { onConflict: 'course_id,user_id,permission' },
    )
  })

  it('writes an audit log entry on success', async () => {
    mockUpsert.mockResolvedValue({ error: null })
    await togglePermissionAction({
      courseId: COURSE_ID,
      slug: SLUG,
      userId: TARGET_ID,
      permission: 'comp_round',
      granted: true,
    })
    expect(mockWriteAuditLog).toHaveBeenCalledWith({
      eventType: 'permission_changed',
      targetType: 'staff_permission',
      targetId: TARGET_ID,
      details: {
        course_id: COURSE_ID,
        permission: 'comp_round',
        granted: true,
      },
    })
  })

  it('revalidates the team page on success', async () => {
    mockUpsert.mockResolvedValue({ error: null })
    await togglePermissionAction({
      courseId: COURSE_ID,
      slug: SLUG,
      userId: TARGET_ID,
      permission: 'view_reports',
      granted: true,
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith(`/course/${SLUG}/settings/team`)
  })

  it('returns ok:false on upsert error and does not audit or revalidate', async () => {
    mockUpsert.mockResolvedValue({ error: { message: 'db down' } })
    const result = await togglePermissionAction({
      courseId: COURSE_ID,
      slug: SLUG,
      userId: TARGET_ID,
      permission: 'view_reports',
      granted: true,
    })
    expect(result).toEqual({ ok: false, error: 'db down' })
    expect(mockWriteAuditLog).not.toHaveBeenCalled()
    expect(mockRevalidatePath).not.toHaveBeenCalled()
  })

  it('returns ok:false when requirePermission throws', async () => {
    mockRequirePermission.mockRejectedValueOnce(new Error('Not authorized'))
    const result = await togglePermissionAction({
      courseId: COURSE_ID,
      slug: SLUG,
      userId: TARGET_ID,
      permission: 'view_reports',
      granted: true,
    })
    expect(result.ok).toBe(false)
    expect(mockUpsert).not.toHaveBeenCalled()
  })
})

describe('resetPermissionToDefaultAction', () => {
  it('deletes the matching override row', async () => {
    // chain: delete().eq().eq().eq() → resolves
    const eqMock = vi.fn()
    // After 3 .eq() calls, the last one returns the awaited result.
    eqMock
      .mockReturnValueOnce({ eq: eqMock })
      .mockReturnValueOnce({ eq: eqMock })
      .mockReturnValueOnce(Promise.resolve({ error: null }))
    mockDelete.mockReturnValue({ eq: eqMock })

    await resetPermissionToDefaultAction({
      courseId: COURSE_ID,
      slug: SLUG,
      userId: TARGET_ID,
      permission: 'void_transaction',
    })
    expect(mockDelete).toHaveBeenCalled()
    expect(eqMock).toHaveBeenCalledWith('course_id', COURSE_ID)
    expect(eqMock).toHaveBeenCalledWith('user_id', TARGET_ID)
    expect(eqMock).toHaveBeenCalledWith('permission', 'void_transaction')
    expect(mockRevalidatePath).toHaveBeenCalledWith(`/course/${SLUG}/settings/team`)
  })
})

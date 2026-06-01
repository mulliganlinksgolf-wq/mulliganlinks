import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ auth: { getUser: mockGetUser } }),
}))

import { getUserFromBearer } from '@/lib/mobile-auth'

function reqWith(headers: Record<string, string>): Request {
  return new Request('http://x', { headers })
}

beforeEach(() => vi.clearAllMocks())

describe('getUserFromBearer', () => {
  it('returns null when Authorization header is missing', async () => {
    const user = await getUserFromBearer(reqWith({}))
    expect(user).toBeNull()
    expect(mockGetUser).not.toHaveBeenCalled()
  })

  it('returns null when header is not a Bearer token', async () => {
    const user = await getUserFromBearer(reqWith({ authorization: 'Basic abc' }))
    expect(user).toBeNull()
  })

  it('returns null when token is invalid', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'bad jwt' } })
    const user = await getUserFromBearer(reqWith({ authorization: 'Bearer bad' }))
    expect(user).toBeNull()
  })

  it('returns the user when token is valid', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'a@b.com' } }, error: null })
    const user = await getUserFromBearer(reqWith({ authorization: 'Bearer good' }))
    expect(user).toEqual({ id: 'u1', email: 'a@b.com' })
    expect(mockGetUser).toHaveBeenCalledWith('good')
  })
})

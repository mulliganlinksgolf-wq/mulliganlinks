import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'

// Bypass next/cache's unstable_cache so getChannels doesn't memoize results
// across tests with different mocked fetch responses.
vi.mock('next/cache', () => ({
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
}))

describe('buffer client', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('throws when BUFFER_API_KEY is missing', async () => {
    vi.stubEnv('BUFFER_API_KEY', '')
    const { getChannels } = await import('@/lib/buffer')
    await expect(getChannels('org1')).rejects.toThrow(
      'BUFFER_API_KEY not configured'
    )
  })

  it('getChannels calls Buffer GraphQL with Authorization header', async () => {
    vi.stubEnv('BUFFER_API_KEY', 'test-key')
    const mockFetch = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      headers: new Headers(),
      json: async () => ({
        data: {
          channels: [
            { id: 'ch1', name: 'TeeAhead Instagram', service: 'instagram', avatar: 'https://example.com/avatar.jpg' },
          ],
        },
      }),
    } as Response)

    const { getChannels } = await import('@/lib/buffer')
    const channels = await getChannels('org1')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.buffer.com/graphql',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer test-key' }),
      })
    )
    expect(channels).toHaveLength(1)
    expect(channels[0].service).toBe('instagram')
  })

  it('getChannels throws on non-200 response', async () => {
    vi.stubEnv('BUFFER_API_KEY', 'test-key')
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: new Headers(),
    } as Response)

    const { getChannels } = await import('@/lib/buffer')
    await expect(getChannels('org1')).rejects.toThrow('Buffer API error: 401')
  })

  it('getChannels throws on GraphQL errors array', async () => {
    vi.stubEnv('BUFFER_API_KEY', 'test-key')
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      headers: new Headers(),
      json: async () => ({
        errors: [{ message: 'Invalid organization ID' }],
      }),
    } as Response)

    const { getChannels } = await import('@/lib/buffer')
    await expect(getChannels('org1')).rejects.toThrow('Invalid organization ID')
  })

  it('createPost fires one mutation per channel', async () => {
    vi.stubEnv('BUFFER_API_KEY', 'test-key')
    const mockFetch = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      headers: new Headers(),
      json: async () => ({
        data: {
          createPost: {
            post: { id: 'p1', dueAt: '2026-05-10T12:00:00Z' },
          },
        },
      }),
    } as Response)

    const { createPost } = await import('@/lib/buffer')
    const results = await createPost({
      text: 'Test post',
      channels: [
        { id: 'ch1', service: 'twitter' },
        { id: 'ch2', service: 'facebook' },
      ],
      mode: 'addToQueue',
    })

    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(results).toHaveLength(2)
    expect(results[0].id).toBe('p1')
  })

  it('createPost throws on MutationError message', async () => {
    vi.stubEnv('BUFFER_API_KEY', 'test-key')
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      headers: new Headers(),
      json: async () => ({
        data: {
          createPost: {
            message: 'Channel not found',
          },
        },
      }),
    } as Response)

    const { createPost } = await import('@/lib/buffer')
    await expect(
      createPost({
        text: 'Test',
        channels: [{ id: 'bad', service: 'twitter' }],
        mode: 'addToQueue',
      })
    ).rejects.toThrow('Channel not found')
  })
})

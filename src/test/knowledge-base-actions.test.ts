import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockAuthGetUser, mockFrom, mockRpc } = vi.hoisted(() => ({
  mockAuthGetUser: vi.fn(),
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
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
    rpc: mockRpc,
  }),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

function makeChain(overrides: Partial<{ data: unknown; error: unknown }> = {}) {
  const base = { data: overrides.data ?? null, error: overrides.error ?? null }
  const chain: Record<string, unknown> = {}
  const methods = ['select','insert','update','delete','eq','neq','ilike','or',
                   'order','limit','single','maybeSingle','returns']
  for (const m of methods) chain[m] = vi.fn().mockReturnThis()
  chain['then'] = (resolve: (v: typeof base) => unknown) => Promise.resolve(resolve(base))
  return chain as any
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('searchKbArticles', () => {
  it('returns published articles matching the query', async () => {
    const fakeArticles = [{ id: 'a1', title: 'Setting Up', slug: 'setting-up', category_id: 'c1' }]
    mockFrom.mockReturnValue(makeChain({ data: fakeArticles }))

    const { searchKbArticles } = await import('@/app/actions/knowledgeBase')
    const results = await searchKbArticles('setup')
    expect(results).toEqual(fakeArticles)
  })
})

describe('voteKbArticle', () => {
  it('calls the vote_kb_article RPC with correct arguments', async () => {
    mockRpc.mockResolvedValue({ error: null })

    const { voteKbArticle } = await import('@/app/actions/knowledgeBase')
    await voteKbArticle('article-uuid', 'yes')
    expect(mockRpc).toHaveBeenCalledWith('vote_kb_article', {
      p_article_id: 'article-uuid',
      p_vote: 'yes',
    })
  })
})

describe('assertAdmin guard', () => {
  it('returns error when user is not authenticated', async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null } })

    const { createKbCategory } = await import('@/app/actions/knowledgeBase')
    const fd = new FormData()
    fd.set('title', 'Test')
    fd.set('slug', 'test')
    const result = await createKbCategory({}, fd)
    expect(result.error).toBeTruthy()
  })

  it('returns error when user is not an admin', async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'random@example.com' } } })
    mockFrom.mockReturnValue(makeChain({ data: { is_admin: false } }))

    const { createKbCategory } = await import('@/app/actions/knowledgeBase')
    const fd = new FormData()
    fd.set('title', 'Test')
    fd.set('slug', 'test')
    const result = await createKbCategory({}, fd)
    expect(result.error).toBeTruthy()
  })
})

describe('deleteKbCategory', () => {
  it('returns an error when articles exist for the category', async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'nbarris11@gmail.com' } } })
    // First call: profiles check in assertAdmin; second call: kb_articles existence check
    mockFrom.mockReturnValueOnce(makeChain({ data: { is_admin: true } }))
    mockFrom.mockReturnValueOnce(makeChain({ data: [{ id: 'a1' }] }))

    const { deleteKbCategory } = await import('@/app/actions/knowledgeBase')
    const result = await deleteKbCategory({}, 'cat-uuid')
    expect(result.error).toMatch(/articles/)
  })
})

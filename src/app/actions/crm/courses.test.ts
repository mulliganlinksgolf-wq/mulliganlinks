// src/app/actions/crm/courses.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const ADMIN_EMAILS = ['nbarris11@gmail.com', 'beslock@yahoo.com']

function makeSupabaseMock(insertData?: unknown) {
  return {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: insertData ?? { id: 'abc' }, error: null }),
  }
}

describe('createCourse', () => {
  it('inserts a new course and returns its id', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const { createAdminClient } = await import('@/lib/supabase/admin')

    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1', email: ADMIN_EMAILS[0] } } }) },
    } as never)

    const adminMock = makeSupabaseMock({ id: 'course-1', name: 'Oak Hollow GC' })
    vi.mocked(createAdminClient).mockReturnValue(adminMock as never)

    const { createCourse } = await import('./courses')
    const fd = new FormData()
    fd.set('name', 'Oak Hollow GC')
    fd.set('city', 'Detroit')
    fd.set('state', 'MI')

    const result = await createCourse({}, fd)
    expect(result.error).toBeUndefined()
    expect(adminMock.from).toHaveBeenCalledWith('crm_courses')
    expect(adminMock.insert).toHaveBeenCalled()
  })
})

describe('updateCourseStage', () => {
  it('updates the stage field on a course', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const { createAdminClient } = await import('@/lib/supabase/admin')

    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1', email: ADMIN_EMAILS[0] } } }) },
    } as never)

    const updateFn = vi.fn()
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          const chain = { select: vi.fn(), eq: vi.fn(), single: vi.fn() }
          chain.select.mockReturnValue(chain)
          chain.eq.mockReturnValue(chain)
          chain.single.mockResolvedValue({ data: { is_admin: true }, error: null })
          return chain
        }
        // crm_courses
        const chain = { update: updateFn, eq: vi.fn() }
        updateFn.mockReturnValue(chain)
        chain.eq.mockResolvedValue({ error: null })
        return chain
      }),
    } as never)

    const { updateCourseStage } = await import('./courses')
    const result = await updateCourseStage('course-1', 'demo')
    expect(result.error).toBeUndefined()
    expect(updateFn).toHaveBeenCalledWith(expect.objectContaining({ stage: 'demo' }))
  })
})

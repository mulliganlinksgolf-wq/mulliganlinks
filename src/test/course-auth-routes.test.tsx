import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import CourseLayout from '@/app/course/[slug]/layout'
import CourseLogin from '@/app/(course-auth)/course/[slug]/login/page'
import Unauthorized from '@/app/(course-auth)/course/[slug]/unauthorized/page'

const state = vi.hoisted(() => ({
  user: null as { id: string; email: string } | null,
  globalAdmin: false,
  courseAdmin: null as { role: string } | null,
  courseUser: null as { role: string } | null,
}))
vi.mock('next/navigation', () => ({
  redirect: (path: string) => { throw new Error(`redirect:${path}`) },
  notFound: () => { throw new Error('not-found') },
}))
vi.mock('@/components/course/CourseSidebar', () => ({ CourseSidebar: () => <nav>Course navigation</nav> }))
vi.mock('@/components/ServiceInbox/ServiceInboxWidget', () => ({ ServiceInboxWidget: () => null }))
vi.mock('@/app/(course-auth)/course/[slug]/login/LoginForm', () => ({ default: () => <form aria-label="Course sign-in" /> }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({
  auth: { getUser: async () => ({ data: { user: state.user } }) },
  from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { id: 'course-1', slug: 'demo', name: 'Demo Golf', service_requests_enabled: false } }) }) }) }),
}) }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({
  from: (table: string) => {
    const query = { select: () => query, eq: () => query, single: async () => ({ data: table === 'profiles' ? { is_admin: state.globalAdmin, full_name: 'Alex' } : table === 'course_admins' ? state.courseAdmin : state.courseUser }) }
    return query
  },
}) }))
const params = Promise.resolve({ slug: 'demo' })
afterEach(cleanup)
beforeEach(() => { state.user = null; state.globalAdmin = false; state.courseAdmin = null; state.courseUser = null })
describe('course authentication routes', () => {
  it('renders the public sign-in page for a signed-out golfer', async () => {
    render(await CourseLogin({ params }))
    expect(screen.getByRole('heading', { name: 'Demo Golf' })).toBeInTheDocument()
    expect(screen.getByRole('form', { name: 'Course sign-in' })).toBeInTheDocument()
  })
  it('redirects a protected course page to its sign-in URL', async () => {
    await expect(CourseLayout({ params, children: 'Protected data' })).rejects.toThrow('redirect:/course/demo/login')
  })
  it('takes an authenticated visitor from sign-in to the tee sheet', async () => {
    state.user = { id: 'user-1', email: 'test@example.com' }
    await expect(CourseLogin({ params })).rejects.toThrow('redirect:/course/demo')
  })
  it('sends an unrelated signed-in user to a renderable access-denied page', async () => {
    state.user = { id: 'user-1', email: 'test@example.com' }
    await expect(CourseLayout({ params, children: 'Protected data' })).rejects.toThrow('redirect:/course/demo/unauthorized')
    render(await Unauthorized({ params }))
    expect(screen.getByRole('heading', { name: 'Access restricted' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to member portal' })).toHaveAttribute('href', '/app')
  })
  it.each(['courseAdmin', 'courseUser', 'globalAdmin'] as const)('preserves access for %s', async role => {
    state.user = { id: 'user-1', email: 'test@example.com' }
    if (role === 'globalAdmin') state.globalAdmin = true
    else state[role] = { role: role === 'courseAdmin' ? 'owner' : 'staff' }
    render(await CourseLayout({ params, children: <h1>Protected data</h1> }))
    expect(screen.getByRole('heading', { name: 'Protected data' })).toBeInTheDocument()
  })
})

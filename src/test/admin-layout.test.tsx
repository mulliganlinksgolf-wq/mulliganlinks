import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// vi.hoisted lets us define mocks that are available inside vi.mock factories
const { mockRedirect, mockGetUser, mockFrom, mockSelect, mockEq, mockSingle } = vi.hoisted(() => {
  const mockSingle = vi.fn()
  const mockEq = vi.fn(() => ({ single: mockSingle }))
  const mockSelect = vi.fn(() => ({ eq: mockEq }))
  const mockFrom = vi.fn(() => ({ select: mockSelect }))
  return {
    mockRedirect: vi.fn(),
    mockGetUser: vi.fn(),
    mockFrom,
    mockSelect,
    mockEq,
    mockSingle,
  }
})

vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({ from: mockFrom })),
}))

// AdminSidebar stub — exposes props as data attributes for easy assertion
interface AdminSidebarProps {
  userEmail: string
  openDisputeCount: number
}
vi.mock('@/components/admin/AdminSidebar', () => ({
  default: ({ userEmail, openDisputeCount }: AdminSidebarProps) => (
    <div
      data-testid="sidebar"
      data-email={userEmail}
      data-disputes={openDisputeCount}
    />
  ),
}))

import AdminLayout from '@/app/admin/layout'

// --- helpers ---

function makeUser(email: string) {
  return { id: 'user-123', email }
}

beforeEach(() => {
  vi.clearAllMocks()
  // Default mockEq: returns chainable object for profile queries
  mockEq.mockReturnValue({ single: mockSingle })
})

// --- tests ---

describe('AdminLayout', () => {
  it('redirects to /login when there is no authenticated user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    // Next.js redirect() throws internally — simulate that so execution stops
    mockRedirect.mockImplementation((url: string) => {
      throw new Error(`NEXT_REDIRECT:${url}`)
    })

    await expect(AdminLayout({ children: <div>test</div> })).rejects.toThrow('NEXT_REDIRECT:/login')
  })

  it('redirects to /app when user is not in hardcoded list and profiles.is_admin is false', async () => {
    const user = makeUser('unknown@example.com')
    mockGetUser.mockResolvedValue({ data: { user } })

    // profiles check: .from('profiles').select('is_admin').eq('id', userId).single()
    mockSingle.mockResolvedValue({ data: { is_admin: false }, error: null })
    // Next.js redirect() throws internally — simulate that so execution stops
    mockRedirect.mockImplementation((url: string) => {
      throw new Error(`NEXT_REDIRECT:${url}`)
    })

    await expect(AdminLayout({ children: <div>test</div> })).rejects.toThrow('NEXT_REDIRECT:/app')
  })

  it('does NOT redirect when user email is in the hardcoded list', async () => {
    const user = makeUser('nbarris11@gmail.com')
    mockGetUser.mockResolvedValue({ data: { user } })

    // Disputes query: .from('payment_disputes').select('id').eq('status', 'open')
    // For hardcoded admins, no profile check runs; only disputes query runs
    mockEq.mockResolvedValue({ data: [], error: null })

    const result = await AdminLayout({ children: <div>test</div> })
    render(result as React.ReactElement)

    expect(mockRedirect).not.toHaveBeenCalled()
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })

  it('renders AdminSidebar with correct userEmail when user is admin', async () => {
    const user = makeUser('nbarris11@gmail.com')
    mockGetUser.mockResolvedValue({ data: { user } })

    mockEq.mockResolvedValue({ data: [], error: null })

    const result = await AdminLayout({ children: <div>test</div> })
    render(result as React.ReactElement)

    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-email', 'nbarris11@gmail.com')
  })

  it('renders AdminSidebar with correct openDisputeCount when user is admin', async () => {
    const user = makeUser('nbarris11@gmail.com')
    mockGetUser.mockResolvedValue({ data: { user } })

    // Three open disputes
    mockEq.mockResolvedValue({ data: [{ id: '1' }, { id: '2' }, { id: '3' }], error: null })

    const result = await AdminLayout({ children: <div>test</div> })
    render(result as React.ReactElement)

    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-disputes', '3')
  })
})

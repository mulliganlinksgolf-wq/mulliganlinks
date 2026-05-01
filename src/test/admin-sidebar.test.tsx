import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AdminSidebar from '@/components/admin/AdminSidebar'

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin',
}))

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

describe('AdminSidebar', () => {
  it('renders the brand name', () => {
    render(<AdminSidebar userEmail="neil@example.com" openDisputeCount={0} />)
    expect(screen.getByText(/TeeAhead/i)).toBeInTheDocument()
  })

  it('renders all nav sections', () => {
    render(<AdminSidebar userEmail="neil@example.com" openDisputeCount={0} />)
    // 'Members' appears as both a section header and a CRM nav item — use getAllByText
    expect(screen.getAllByText('Members').length).toBeGreaterThan(0)
    expect(screen.getByText('Finance')).toBeInTheDocument()
    expect(screen.getByText('Platform')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders all nav items with correct hrefs', () => {
    const { container } = render(<AdminSidebar userEmail="neil@example.com" openDisputeCount={0} />)
    // Check by href — avoids duplicate text/name issues from CRM section reusing labels
    const hrefs = Array.from(container.querySelectorAll('a')).map(a => a.getAttribute('href'))
    expect(hrefs).toContain('/admin')
    expect(hrefs).toContain('/admin/users')
    expect(hrefs).toContain('/admin/communications')
    expect(hrefs).toContain('/admin/config')
    expect(hrefs).toContain('/admin/audit')
    expect(hrefs).toContain('/admin/disputes')
    expect(hrefs).toContain('/admin/content')
    expect(hrefs).toContain('/admin/courses')
    expect(hrefs).toContain('/admin/waitlist')
  })

  it('shows dispute badge when openDisputeCount > 0', () => {
    render(<AdminSidebar userEmail="neil@example.com" openDisputeCount={3} />)
    const badge = screen.getByTestId('dispute-badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('3')
  })

  it('does not show dispute badge when openDisputeCount is 0', () => {
    render(<AdminSidebar userEmail="neil@example.com" openDisputeCount={0} />)
    expect(screen.queryByTestId('dispute-badge')).not.toBeInTheDocument()
  })

  it('shows the signed-in user email', () => {
    render(<AdminSidebar userEmail="neil@example.com" openDisputeCount={0} />)
    expect(screen.getByText('neil@example.com')).toBeInTheDocument()
  })

  it('renders member view link pointing to /app', () => {
    render(<AdminSidebar userEmail="neil@example.com" openDisputeCount={0} />)
    expect(screen.getByRole('link', { name: /member view/i })).toHaveAttribute('href', '/app')
  })
})

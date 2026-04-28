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
    expect(screen.getByText('Members')).toBeInTheDocument()
    expect(screen.getByText('Finance')).toBeInTheDocument()
    expect(screen.getByText('Platform')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders all nav items with correct hrefs', () => {
    render(<AdminSidebar userEmail="neil@example.com" openDisputeCount={0} />)
    expect(screen.getByRole('link', { name: /Dashboard/i })).toHaveAttribute('href', '/admin')
    expect(screen.getByRole('link', { name: /All Members/i })).toHaveAttribute('href', '/admin/users')
    expect(screen.getByRole('link', { name: /Communications/i })).toHaveAttribute('href', '/admin/communications')
    expect(screen.getByRole('link', { name: /Configuration/i })).toHaveAttribute('href', '/admin/config')
    expect(screen.getByRole('link', { name: /Audit Log/i })).toHaveAttribute('href', '/admin/audit')
  })

  it('shows dispute badge when openDisputeCount > 0', () => {
    render(<AdminSidebar userEmail="neil@example.com" openDisputeCount={3} />)
    expect(screen.getByText('3')).toBeInTheDocument()
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

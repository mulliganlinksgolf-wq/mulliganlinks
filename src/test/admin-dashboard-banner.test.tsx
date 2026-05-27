import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/site-config', () => ({
  isLiveMode: vi.fn(),
}))

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

import LaunchModeBanner from '@/components/admin/LaunchModeBanner'

describe('LaunchModeBanner', () => {
  it('shows waitlist mode banner when not live', () => {
    render(<LaunchModeBanner isLive={false} />)
    expect(screen.getByText(/Waitlist Mode is ON/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Go Live/i })).toHaveAttribute('href', '/admin/config')
  })

  it('shows live mode banner when live', () => {
    render(<LaunchModeBanner isLive={true} />)
    expect(screen.getByText(/Live Mode is ON/i)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Go Live/i })).not.toBeInTheDocument()
  })
})

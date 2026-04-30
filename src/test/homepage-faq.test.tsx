import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { HomepageFaq } from '@/components/HomepageFaq'

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('HomepageFaq', () => {
  it('Q1 mentions founding partners', () => {
    render(<HomepageFaq />)
    expect(
      screen.getByText(/Is TeeAhead really free for courses for founding partners\?/i)
    ).toBeInTheDocument()
  })

  it('Q3 answer includes billy@teeahead.com', () => {
    render(<HomepageFaq />)
    // Open Q3
    const q3Button = screen.getByRole('button', {
      name: /What if my course already uses EZLinks/i,
    })
    fireEvent.click(q3Button)
    const billyLinks = screen.getAllByRole('link', { name: 'billy@teeahead.com' })
    expect(billyLinks[0]).toHaveAttribute('href', 'mailto:billy@teeahead.com')
  })
})

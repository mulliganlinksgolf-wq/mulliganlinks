import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MemberListFilters from '@/components/admin/MemberListFilters'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}))

describe('MemberListFilters', () => {
  it('renders search input', () => {
    render(<MemberListFilters />)
    expect(screen.getByPlaceholderText(/search by name or email/i)).toBeInTheDocument()
  })

  it('renders tier filter select', () => {
    render(<MemberListFilters />)
    expect(screen.getByRole('combobox', { name: /tier/i })).toBeInTheDocument()
  })

  it('renders status filter select', () => {
    render(<MemberListFilters />)
    expect(screen.getByRole('combobox', { name: /status/i })).toBeInTheDocument()
  })

  it('renders founding member filter select', () => {
    render(<MemberListFilters />)
    expect(screen.getByRole('combobox', { name: /founding/i })).toBeInTheDocument()
  })

  it('updates URL when search input changes', () => {
    render(<MemberListFilters />)
    const input = screen.getByPlaceholderText(/search by name or email/i)
    fireEvent.change(input, { target: { value: 'john' } })
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('q=john'))
  })

  it('updates URL when tier filter changes', () => {
    render(<MemberListFilters />)
    fireEvent.change(screen.getByRole('combobox', { name: /tier/i }), { target: { value: 'eagle' } })
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('tier=eagle'))
  })

  it('updates URL when status filter changes', () => {
    render(<MemberListFilters />)
    fireEvent.change(screen.getByRole('combobox', { name: /status/i }), { target: { value: 'canceled' } })
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('status=canceled'))
  })

  it('updates URL when founding filter changes', () => {
    render(<MemberListFilters />)
    fireEvent.change(screen.getByRole('combobox', { name: /founding/i }), { target: { value: 'true' } })
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('founding=true'))
  })
})

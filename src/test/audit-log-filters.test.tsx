import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(''),
}))

import AuditLogFilters from '@/components/admin/AuditLogFilters'

describe('AuditLogFilters', () => {
  it('renders search input', () => {
    render(<AuditLogFilters />)
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
  })

  it('renders action type filter', () => {
    render(<AuditLogFilters />)
    expect(screen.getByRole('combobox', { name: /action/i })).toBeInTheDocument()
  })

  it('renders time range filter', () => {
    render(<AuditLogFilters />)
    expect(screen.getByRole('combobox', { name: /time/i })).toBeInTheDocument()
  })

  it('updates search value on input', () => {
    render(<AuditLogFilters />)
    const input = screen.getByPlaceholderText(/search/i)
    fireEvent.change(input, { target: { value: 'John' } })
    expect((input as HTMLInputElement).value).toBe('John')
  })
})

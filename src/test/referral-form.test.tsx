import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { GolferWaitlistForm } from '@/app/waitlist/golfer/GolferWaitlistForm'

vi.mock('@/app/waitlist/golfer/actions', () => ({
  joinGolferWaitlist: vi.fn(),
}))

const mockCourses = [
  { id: 'course-1', name: 'Whispering Willows Golf Club' },
  { id: 'course-2', name: 'Oakland Hills Country Club' },
]

describe('GolferWaitlistForm — referral attribution', () => {
  it('shows "How did you hear about us?" question', () => {
    render(<GolferWaitlistForm courses={mockCourses} />)
    expect(screen.getByLabelText(/how did you hear about us/i)).toBeInTheDocument()
  })

  it('shows "My home course" option in the dropdown', () => {
    render(<GolferWaitlistForm courses={mockCourses} />)
    const select = screen.getByLabelText(/how did you hear about us/i)
    expect(select).toContainHTML('My home course')
  })

  it('shows course search input when "My home course" is selected', () => {
    render(<GolferWaitlistForm courses={mockCourses} />)
    const select = screen.getByLabelText(/how did you hear about us/i)
    fireEvent.change(select, { target: { value: 'my_home_course' } })
    expect(screen.getByPlaceholderText(/search courses/i)).toBeInTheDocument()
  })

  it('hides course search when different option is selected', () => {
    render(<GolferWaitlistForm courses={mockCourses} />)
    const select = screen.getByLabelText(/how did you hear about us/i)
    fireEvent.change(select, { target: { value: 'my_home_course' } })
    fireEvent.change(select, { target: { value: 'friend' } })
    expect(screen.queryByPlaceholderText(/search courses/i)).not.toBeInTheDocument()
  })

  it('displays the legal referral disclosure when "My home course" is selected', () => {
    render(<GolferWaitlistForm courses={mockCourses} />)
    const select = screen.getByLabelText(/how did you hear about us/i)
    fireEvent.change(select, { target: { value: 'my_home_course' } })
    expect(screen.getByText(/your home course earns 10%/i)).toBeInTheDocument()
  })

  it('shows course suggestions when typing in course search', () => {
    render(<GolferWaitlistForm courses={mockCourses} />)
    const select = screen.getByLabelText(/how did you hear about us/i)
    fireEvent.change(select, { target: { value: 'my_home_course' } })
    const courseInput = screen.getByPlaceholderText(/search courses/i)
    fireEvent.change(courseInput, { target: { value: 'Whisper' } })
    fireEvent.focus(courseInput)
    expect(screen.getByText('Whispering Willows Golf Club')).toBeInTheDocument()
  })
})

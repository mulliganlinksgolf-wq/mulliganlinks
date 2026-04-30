import { render, screen } from '@testing-library/react'
import { FoundersScorecard } from '@/components/FoundersScorecard'

test('renders the scorecard header', () => {
  render(<FoundersScorecard />)
  expect(screen.getByText(/Founders' Scorecard/i)).toBeInTheDocument()
  expect(screen.getByText(/Card No. 001/i)).toBeInTheDocument()
})

test('renders all 5 holes', () => {
  render(<FoundersScorecard />)
  expect(screen.getByText('The Read')).toBeInTheDocument()
  expect(screen.getByText("Neil's Side")).toBeInTheDocument()
  expect(screen.getByText("Billy's Side")).toBeInTheDocument()
  expect(screen.getByText('The Why')).toBeInTheDocument()
  expect(screen.getByText('The Ask')).toBeInTheDocument()
})

test('renders both email links', () => {
  render(<FoundersScorecard />)
  expect(screen.getByRole('link', { name: 'neil@teeahead.com' })).toHaveAttribute(
    'href',
    'mailto:neil@teeahead.com'
  )
  expect(screen.getByRole('link', { name: 'billy@teeahead.com' })).toHaveAttribute(
    'href',
    'mailto:billy@teeahead.com'
  )
})

test('renders both founder signatures', () => {
  render(<FoundersScorecard />)
  expect(screen.getByText('Billy Beslock')).toBeInTheDocument()
  expect(screen.getByText('Neil Barris')).toBeInTheDocument()
})

test('renders the waitlist CTA linking to /waitlist/golfer', () => {
  render(<FoundersScorecard />)
  const cta = screen.getByRole('link', { name: /Join the Waitlist/i })
  expect(cta).toHaveAttribute('href', '/waitlist/golfer')
})

test('Hole 4 reflects the updated "Why" copy', () => {
  render(<FoundersScorecard />)
  expect(
    screen.getByText(/just like every other golfer that wants something more reasonable and innovative/i)
  ).toBeInTheDocument()
})

test('Hole 5 does not contain "feels the same way"', () => {
  render(<FoundersScorecard />)
  expect(screen.queryByText(/feels the same way/i)).not.toBeInTheDocument()
})

test('Hole 5 includes billy email in the course outreach text', () => {
  render(<FoundersScorecard />)
  const billyLinks = screen.getAllByRole('link', { name: 'billy@teeahead.com' })
  expect(billyLinks.length).toBeGreaterThanOrEqual(1)
})

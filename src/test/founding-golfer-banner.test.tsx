import { render, screen } from '@testing-library/react'
import { FoundingGolferBanner } from '@/components/FoundingGolferBanner'

test('shows banner text and counter when spots remain', () => {
  render(<FoundingGolferBanner spotsRemaining={47} />)
  expect(screen.getByText(/Founding Golfer Offer/)).toBeInTheDocument()
  expect(screen.getByText(/47 of 100 spots remaining/)).toBeInTheDocument()
})

test('renders nothing when no spots remain', () => {
  const { container } = render(<FoundingGolferBanner spotsRemaining={0} />)
  expect(container.firstChild).toBeNull()
})

test('renders nothing when spotsRemaining is negative', () => {
  const { container } = render(<FoundingGolferBanner spotsRemaining={-1} />)
  expect(container.firstChild).toBeNull()
})

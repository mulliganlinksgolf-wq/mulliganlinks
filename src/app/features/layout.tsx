import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Features',
  description: 'Every tool golfers and courses need — tee time booking, loyalty points, leagues, in-round service, tee time trading, and more. Zero booking fees. Free for partner courses.',
  alternates: { canonical: '/features' },
  openGraph: {
    url: '/features',
    title: 'TeeAhead Features — Booking, Loyalty, Leagues & More',
    description: 'Every tool golfers and courses need — tee time booking, loyalty points, leagues, in-round service, tee time trading, and more. Zero booking fees. Free for partner courses.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'TeeAhead Features' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TeeAhead Features',
    description: 'Tee time booking, loyalty, leagues, in-round service & more — all in one platform.',
    images: ['/og-image.png'],
  },
}

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return children
}

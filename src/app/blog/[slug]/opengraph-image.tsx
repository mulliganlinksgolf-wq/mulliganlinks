import { ImageResponse } from 'next/og'
import { getPostBySlug } from '@/lib/blog'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const CATEGORY_LABELS: Record<string, string> = {
  courses: 'For Course Operators',
  golfers: 'For Golfers',
  'case-studies': 'Case Study',
}

const CATEGORY_COLORS: Record<string, string> = {
  courses: '#E0A800',
  golfers: '#4A9E6B',
  'case-studies': '#7B9FCC',
}

export default async function Image({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug)

  const title = post?.title ?? 'TeeAhead Blog'
  const category = post?.category ?? 'courses'
  const label = CATEGORY_LABELS[category] ?? 'Golf Industry'
  const badgeColor = CATEGORY_COLORS[category] ?? '#E0A800'

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#0F3D2E',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top: wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#F4F1EA', fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>
            TeeAhead
          </span>
          <span style={{ color: '#F4F1EA', opacity: 0.3, fontSize: 28 }}>·</span>
          <span style={{ color: '#F4F1EA', opacity: 0.5, fontSize: 20 }}>teeahead.com</span>
        </div>

        {/* Middle: category badge + title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 960 }}>
          <div
            style={{
              display: 'inline-flex',
              background: badgeColor,
              color: '#0F3D2E',
              fontSize: 16,
              fontWeight: 700,
              padding: '6px 16px',
              borderRadius: 999,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              width: 'fit-content',
            }}
          >
            {label}
          </div>
          <div
            style={{
              color: '#F4F1EA',
              fontSize: title.length > 60 ? 42 : 52,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
            }}
          >
            {title}
          </div>
        </div>

        {/* Bottom: tagline */}
        <div style={{ color: '#F4F1EA', opacity: 0.45, fontSize: 18 }}>
          Free tee sheet software for courses · A loyalty membership for golfers · Metro Detroit
        </div>
      </div>
    ),
    { ...size }
  )
}

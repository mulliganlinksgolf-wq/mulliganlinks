import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCreate = vi.fn()

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn(function () {
      return {
        messages: {
          create: mockCreate,
        },
      }
    }),
  }
})

import Anthropic from '@anthropic-ai/sdk'

const mockCaptionsJson = {
  instagram: {
    caption: "Windsor Parke left GolfNow. Revenue went from $81K to $393K. That's the story. #TeeAhead #MetroDetroitGolf #GolfMichigan",
    bestTime: 'Saturday 8:00 AM EST',
    growthNote: 'Saturday morning is peak golf-mindset scroll time in Metro Detroit.',
  },
  facebook: {
    caption: "Windsor Parke saw a 382% online revenue lift after leaving GolfNow. Does your course know what data it's giving away?",
    bestTime: 'Wednesday 11:00 AM EST',
    growthNote: 'Mid-week morning reaches the course-owner audience before afternoon tee times.',
  },
}

describe('caption generation route', () => {
  beforeEach(() => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(mockCaptionsJson) }],
    })
  })

  it('returns captions for requested platforms', async () => {
    const { POST } = await import('@/app/api/social/generate-caption/route')
    const req = new Request('http://localhost/api/social/generate-caption', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'Windsor Parke left GolfNow',
        pillar: 'Education/Outrage (35%)',
        platforms: ['instagram', 'facebook'],
        audience: 'Course Operators',
      }),
    })
    const res = await POST(req as any)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.captions).toHaveProperty('instagram')
    expect(data.captions).toHaveProperty('facebook')
    expect(data.captions.instagram.bestTime).toBe('Saturday 8:00 AM EST')
  })

  it('returns 500 on JSON parse failure', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'not valid json' }],
    })

    const { POST } = await import('@/app/api/social/generate-caption/route')
    const req = new Request('http://localhost/api/social/generate-caption', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'test',
        pillar: 'Education/Outrage (35%)',
        platforms: ['instagram'],
        audience: 'Golfers',
      }),
    })
    const res = await POST(req as any)
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('Parse failed')
  })
})

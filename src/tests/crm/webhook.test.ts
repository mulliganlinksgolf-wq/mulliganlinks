import { describe, it, expect } from 'vitest'
import { parseOpenEvent } from '@/app/api/webhooks/resend/route'

describe('parseOpenEvent', () => {
  it('returns emailId for valid email.opened event', () => {
    const payload = {
      type: 'email.opened',
      data: { email_id: 're_abc123', created_at: '2026-05-11T10:00:00Z' },
    }
    expect(parseOpenEvent(payload)).toEqual({ emailId: 're_abc123' })
  })

  it('returns null for wrong event type', () => {
    const payload = { type: 'email.delivered', data: { email_id: 're_abc123' } }
    expect(parseOpenEvent(payload)).toBeNull()
  })

  it('returns null when email_id is missing', () => {
    const payload = { type: 'email.opened', data: {} }
    expect(parseOpenEvent(payload)).toBeNull()
  })

  it('returns null for null input', () => {
    expect(parseOpenEvent(null)).toBeNull()
  })
})

import { describe, it, expect } from 'vitest'

function isTokenExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date()
}

describe('setup token expiry', () => {
  it('rejects tokens older than 72 hours', () => {
    const pastDate = new Date(Date.now() - 73 * 60 * 60 * 1000).toISOString()
    expect(isTokenExpired(pastDate)).toBe(true)
  })
  it('accepts tokens within 72 hours', () => {
    const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    expect(isTokenExpired(futureDate)).toBe(false)
  })
})

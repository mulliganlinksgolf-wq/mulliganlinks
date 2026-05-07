import { describe, it, expect } from 'vitest'

// Validation logic tested inline (pure function, no imports needed)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

function validateUpload(
  mimeType: string,
  sizeBytes: number
): { valid: true } | { valid: false; error: string } {
  if (!ALLOWED_TYPES.includes(mimeType)) {
    return { valid: false, error: 'File must be JPEG, PNG, or WebP' }
  }
  if (sizeBytes > MAX_BYTES) {
    return { valid: false, error: 'File must be under 5MB' }
  }
  return { valid: true }
}

describe('upload image validation', () => {
  it('accepts image/jpeg', () => {
    expect(validateUpload('image/jpeg', 1024).valid).toBe(true)
  })

  it('accepts image/png', () => {
    expect(validateUpload('image/png', 1024).valid).toBe(true)
  })

  it('accepts image/webp', () => {
    expect(validateUpload('image/webp', 1024).valid).toBe(true)
  })

  it('rejects image/gif', () => {
    const result = validateUpload('image/gif', 1024)
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.error).toMatch(/JPEG|PNG|WebP/i)
  })

  it('rejects files over 5MB', () => {
    const result = validateUpload('image/png', 5 * 1024 * 1024 + 1)
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.error).toMatch(/5MB/)
  })

  it('accepts exactly 5MB', () => {
    expect(validateUpload('image/png', 5 * 1024 * 1024).valid).toBe(true)
  })
})

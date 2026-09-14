import { createHmac, timingSafeEqual } from 'node:crypto'

// Issued only for a newly saved signup, never for an existing email address.
// A short-lived signature authorizes changing only that signup's course preference.
function sign(payload: string) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('Waitlist signing key is unavailable')
  return createHmac('sha256', key).update(`waitlist-course:${payload}`).digest('base64url')
}

export function createCoursePreferenceToken(email: string) {
  const payload = Buffer.from(JSON.stringify({ email, expires: Date.now() + 30 * 60 * 1000 })).toString('base64url')
  return `${payload}.${sign(payload)}`
}

export function readCoursePreferenceToken(token: string): string | null {
  try {
    if (token.length > 2048) return null
    const [payload, signature, extra] = token.split('.')
    if (!payload || !signature || extra) return null
    const expected = Buffer.from(sign(payload))
    const actual = Buffer.from(signature)
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (typeof data.email !== 'string' || typeof data.expires !== 'number' || data.expires <= Date.now()) return null
    return data.email
  } catch { return null }
}

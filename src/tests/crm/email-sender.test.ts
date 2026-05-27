import { describe, it, expect } from 'vitest'

// Inline the sender resolution logic so we can test it in isolation
const SENDER_MAP: Record<string, string> = {
  'nbarris11@gmail.com': 'Neil Barris <neil@teeahead.com>',
  'beslock@yahoo.com':   'Billy Eslock <billy@teeahead.com>',
}
const DEFAULT_SENDER = 'TeeAhead <hello@teeahead.com>'

function resolveSender(userEmail: string | undefined): string {
  return (userEmail && SENDER_MAP[userEmail]) ?? DEFAULT_SENDER
}

function buildHtmlWithSignature(bodyHtml: string, signature: string | null): string {
  if (!signature) return bodyHtml
  const escaped = signature
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br />')
  return `${bodyHtml}<br /><br />--<br />${escaped}`
}

describe('resolveSender', () => {
  it('returns neil@ for nbarris11@gmail.com', () => {
    expect(resolveSender('nbarris11@gmail.com')).toBe('Neil Barris <neil@teeahead.com>')
  })
  it('returns billy@ for beslock@yahoo.com', () => {
    expect(resolveSender('beslock@yahoo.com')).toBe('Billy Eslock <billy@teeahead.com>')
  })
  it('returns hello@ for unknown admin', () => {
    expect(resolveSender('mulliganlinksgolf@gmail.com')).toBe('TeeAhead <hello@teeahead.com>')
  })
  it('returns hello@ for undefined', () => {
    expect(resolveSender(undefined)).toBe('TeeAhead <hello@teeahead.com>')
  })
})

describe('buildHtmlWithSignature', () => {
  it('appends signature with separator', () => {
    const result = buildHtmlWithSignature('<p>Hello</p>', 'Neil Barris\nneil@teeahead.com')
    expect(result).toContain('--<br />')
    expect(result).toContain('Neil Barris')
    expect(result).toContain('<br />')
  })
  it('returns body unchanged when signature is null', () => {
    const body = '<p>Hello</p>'
    expect(buildHtmlWithSignature(body, null)).toBe(body)
  })
  it('escapes HTML in signature', () => {
    const result = buildHtmlWithSignature('<p>Hi</p>', '<script>alert(1)</script>')
    expect(result).not.toContain('<script>')
    expect(result).toContain('&lt;script&gt;')
  })
})

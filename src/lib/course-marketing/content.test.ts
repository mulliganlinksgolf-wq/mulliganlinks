// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { renderCampaign, validateCampaign } from './content'
describe('campaign content', () => {
  it('escapes course names and message markup in outgoing emails', () => {
    const html = renderCampaign({
      sender: '<script>Course</script>',
      address: '123 Main & Oak',
      body: '<img src=x onerror=alert(1)>',
      unsubscribeUrl: 'https://example.com/unsubscribe?token=abc',
    })
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img')
    expect(html).toContain('Unsubscribe from this course')
  })
  it('rejects header injection, blank content, invalid audiences and oversized campaigns', () => {
    expect(validateCampaign('Hi\nBcc: someone', 'Body', 'all')).toBeTruthy()
    expect(validateCampaign('Hi', ' ', 'all')).toBeTruthy()
    expect(validateCampaign('Hi', 'Body', '__proto__')).toBeTruthy()
    expect(validateCampaign('Hi', 'x'.repeat(10001), 'all')).toBeTruthy()
    expect(
      validateCampaign('A round this weekend?', 'See you soon.', 'eagle_ace'),
    ).toBeNull()
  })
})

import { describe, it, expect } from 'vitest'
import { htmlToPlainText, plainTextToHtml } from './email-format'

describe('htmlToPlainText', () => {
  it('converts <p> blocks to paragraphs separated by blank lines', () => {
    const html = '<p>Hi Rick,</p><p>How are you?</p><p>Thanks,<br>Neil</p>'
    expect(htmlToPlainText(html)).toBe('Hi Rick,\n\nHow are you?\n\nThanks,\nNeil')
  })

  it('decodes common entities', () => {
    const html = '<p>It&#39;s a great day &amp; the math works</p>'
    expect(htmlToPlainText(html)).toBe("It's a great day & the math works")
  })

  it('strips unknown tags', () => {
    const html = '<p>Hello <strong>world</strong></p>'
    expect(htmlToPlainText(html)).toBe('Hello world')
  })

  it('handles empty/null input', () => {
    expect(htmlToPlainText('')).toBe('')
  })
})

describe('plainTextToHtml', () => {
  it('wraps paragraphs in <p> with inline styles', () => {
    const text = 'Hi Rick,\n\nHow are you?'
    const html = plainTextToHtml(text)
    expect(html).toContain('<p style="')
    expect(html).toContain('Hi Rick,')
    expect(html).toContain('How are you?')
    expect(html).toContain('margin: 0 0 14px 0')
  })

  it('escapes HTML in user input', () => {
    const text = 'Watch out for <script>alert(1)</script>'
    const html = plainTextToHtml(text)
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('converts single newlines inside a paragraph to <br>', () => {
    const text = 'Line one\nLine two'
    const html = plainTextToHtml(text)
    expect(html).toContain('Line one<br>Line two')
  })

  it('round-trips with htmlToPlainText', () => {
    const original = 'Hi Rick,\n\nQuick question about your tee sheet.\n\nNeil'
    const html = plainTextToHtml(original)
    const back = htmlToPlainText(html)
    expect(back).toBe(original)
  })

  it('returns empty string for blank input', () => {
    expect(plainTextToHtml('')).toBe('')
    expect(plainTextToHtml('   \n\n  ')).toBe('')
  })
})

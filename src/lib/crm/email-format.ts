// Convert a stored HTML template body to plaintext for editing.
// Treats <p> blocks as paragraphs separated by a blank line, <br> as a single line break,
// and strips other tags. Decodes the small set of HTML entities used in our templates.
export function htmlToPlainText(html: string): string {
  if (!html) return ''
  let text = html
  // Block-level breaks
  text = text.replace(/<\/p\s*>/gi, '\n\n')
  text = text.replace(/<p[^>]*>/gi, '')
  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/li\s*>/gi, '\n')
  text = text.replace(/<\/(div|h[1-6])\s*>/gi, '\n\n')
  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, '')
  // Decode entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
  // Collapse 3+ consecutive newlines into 2 and trim
  return text.replace(/\n{3,}/g, '\n\n').trim()
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// Convert plaintext (with \n\n paragraph breaks and \n line breaks) to inline-styled HTML
// that renders consistently across email clients (Gmail, Outlook, Apple Mail).
export function plainTextToHtml(text: string): string {
  if (!text.trim()) return ''
  const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
  const style = 'margin: 0 0 14px 0; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; color: #1A1A1A;'
  return paragraphs
    .map(p => `<p style="${style}">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('\n')
}

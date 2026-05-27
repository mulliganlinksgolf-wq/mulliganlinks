import { describe, it, expect } from 'vitest'

function buildCsvContent(rows: Record<string, string | number | null>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  return [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((h) => {
        const val = row[h]
        if (val == null) return ''
        const str = String(val)
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }).join(',')
    ),
  ].join('\n')
}

describe('CSV content building', () => {
  it('creates header row from object keys', () => {
    const csv = buildCsvContent([{ name: 'Oak Hollow', city: 'Detroit' }])
    expect(csv.split('\n')[0]).toBe('name,city')
  })

  it('wraps values with commas in quotes', () => {
    const csv = buildCsvContent([{ name: 'Smith, Jr.', value: 100 }])
    expect(csv).toContain('"Smith, Jr."')
  })

  it('handles null values as empty string', () => {
    const csv = buildCsvContent([{ name: 'Test', phone: null }])
    const rows = csv.split('\n')
    expect(rows[1]).toBe('Test,')
  })
})

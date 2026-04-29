export type DatePreset = 'this_month' | 'last_month' | 'this_quarter' | 'ytd' | 'custom'

export interface DateRange {
  from: string  // YYYY-MM-DD
  to: string
  preset: DatePreset
}

export function resolveDateRange(
  preset: string | undefined,
  customFrom?: string,
  customTo?: string,
): DateRange {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = today.getMonth()   // 0-indexed
  const dd = String(today.getDate()).padStart(2, '0')
  const pad = (n: number) => String(n).padStart(2, '0')
  const toISO = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`
  const lastDayOf = (y: number, m: number) => new Date(y, m + 1, 0).getDate()

  switch (preset) {
    case 'last_month': {
      const lm = mm === 0 ? 11 : mm - 1
      const ly = mm === 0 ? yyyy - 1 : yyyy
      return { from: toISO(ly, lm, 1), to: toISO(ly, lm, lastDayOf(ly, lm)), preset: 'last_month' }
    }
    case 'this_quarter': {
      const qStart = Math.floor(mm / 3) * 3
      return { from: toISO(yyyy, qStart, 1), to: `${yyyy}-${pad(mm + 1)}-${dd}`, preset: 'this_quarter' }
    }
    case 'ytd':
      return { from: `${yyyy}-01-01`, to: `${yyyy}-${pad(mm + 1)}-${dd}`, preset: 'ytd' }
    case 'custom':
      if (customFrom && customTo) {
        return { from: customFrom, to: customTo, preset: 'custom' }
      }
      // fall through to default
    default:
    case 'this_month':
      return { from: toISO(yyyy, mm, 1), to: `${yyyy}-${pad(mm + 1)}-${dd}`, preset: 'this_month' }
  }
}

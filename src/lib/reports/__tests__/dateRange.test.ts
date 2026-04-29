import { describe, it, expect, vi, beforeAll } from 'vitest'
import { resolveDateRange } from '../dateRange'

describe('resolveDateRange', () => {
  beforeAll(() => {
    vi.setSystemTime(new Date('2026-04-29T12:00:00Z'))
  })

  it('this_month returns Apr 1 – Apr 29', () => {
    const { from, to } = resolveDateRange('this_month')
    expect(from).toBe('2026-04-01')
    expect(to).toBe('2026-04-29')
  })

  it('last_month returns Mar 1 – Mar 31', () => {
    const { from, to } = resolveDateRange('last_month')
    expect(from).toBe('2026-03-01')
    expect(to).toBe('2026-03-31')
  })

  it('ytd returns Jan 1 – Apr 29', () => {
    const { from, to } = resolveDateRange('ytd')
    expect(from).toBe('2026-01-01')
    expect(to).toBe('2026-04-29')
  })

  it('custom passes through provided dates', () => {
    const { from, to } = resolveDateRange('custom', '2026-02-01', '2026-02-28')
    expect(from).toBe('2026-02-01')
    expect(to).toBe('2026-02-28')
  })

  it('defaults to this_month when preset is unknown', () => {
    const { from } = resolveDateRange(undefined)
    expect(from).toBe('2026-04-01')
  })

  it('custom without dates falls back to this_month', () => {
    const { from, preset } = resolveDateRange('custom')
    expect(from).toBe('2026-04-01')
    expect(preset).toBe('this_month')
  })

  it('this_quarter returns Apr 1 – Apr 29 (Q2)', () => {
    const { from, to } = resolveDateRange('this_quarter')
    expect(from).toBe('2026-04-01')
    expect(to).toBe('2026-04-29')
  })
})

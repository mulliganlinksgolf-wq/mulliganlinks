import { describe, it, expect } from 'vitest'
import {
  getMemberState,
  getSubHeadline,
  getPointsToNextCredit,
  formatDaysAway,
  getTierInfo,
} from '@/lib/member-dashboard'

describe('getMemberState', () => {
  it('returns new when 0 completed rounds', () => {
    expect(getMemberState(0)).toBe('new')
  })
  it('returns active when 1+ completed rounds', () => {
    expect(getMemberState(1)).toBe('active')
    expect(getMemberState(10)).toBe('active')
  })
})

describe('getSubHeadline', () => {
  it('returns blank scorecard copy for new state', () => {
    expect(getSubHeadline('new', 0)).toBe(
      "Your scorecard's still blank. 3 holes before your first round."
    )
  })
  it('returns warming up for 1–4 rounds', () => {
    expect(getSubHeadline('active', 1)).toContain("You're warming up")
    expect(getSubHeadline('active', 4)).toContain("You're warming up")
  })
  it('returns back nine for 5–9 rounds', () => {
    expect(getSubHeadline('active', 5)).toContain('back nine')
    expect(getSubHeadline('active', 9)).toContain('back nine')
  })
  it('returns regular for 10+ rounds', () => {
    expect(getSubHeadline('active', 10)).toContain('A regular')
    expect(getSubHeadline('active', 25)).toContain('A regular')
  })
  it('includes the round count in active headlines', () => {
    expect(getSubHeadline('active', 7)).toContain('7')
  })
})

describe('getPointsToNextCredit', () => {
  it('returns 100 when balance is 0', () => {
    expect(getPointsToNextCredit(0)).toBe(100)
  })
  it('returns 100 when balance is an exact multiple of 100', () => {
    expect(getPointsToNextCredit(100)).toBe(100)
    expect(getPointsToNextCredit(500)).toBe(100)
  })
  it('returns correct remainder', () => {
    expect(getPointsToNextCredit(891)).toBe(9)
    expect(getPointsToNextCredit(50)).toBe(50)
    expect(getPointsToNextCredit(99)).toBe(1)
  })
})

describe('getTierInfo', () => {
  it('returns correct labels', () => {
    expect(getTierInfo('free').label).toBe('Fairway')
    expect(getTierInfo('eagle').label).toBe('Eagle')
    expect(getTierInfo('ace').label).toBe('Ace')
  })
  it('returns correct earn rates', () => {
    expect(getTierInfo('free').earnRate).toBe('1×')
    expect(getTierInfo('eagle').earnRate).toBe('1.5×')
    expect(getTierInfo('ace').earnRate).toBe('2×')
  })
})

describe('formatDaysAway', () => {
  it('returns today for a past or same-second date', () => {
    const past = new Date(Date.now() - 1000).toISOString()
    expect(formatDaysAway(past)).toBe('today')
  })
  it('returns tomorrow for ~1 day out', () => {
    const tomorrow = new Date(Date.now() + 1000 * 60 * 60 * 25).toISOString()
    expect(formatDaysAway(tomorrow)).toBe('tomorrow')
  })
  it('returns N days away for further dates', () => {
    const fiveDays = new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString()
    expect(formatDaysAway(fiveDays)).toBe('5 days away')
  })
})

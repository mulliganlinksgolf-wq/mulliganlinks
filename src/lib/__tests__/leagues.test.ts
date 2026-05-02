import { describe, it, expect } from 'vitest'
import {
  calcNetScore,
  calcStandingsRank,
  formatLeagueStatus,
  formatLeagueFormat,
  type StandingRow,
} from '@/lib/leagues'

describe('calcNetScore', () => {
  it('subtracts handicap from gross', () => {
    expect(calcNetScore(90, 18)).toBe(72)
  })

  it('returns gross unchanged when handicap is 0', () => {
    expect(calcNetScore(82, 0)).toBe(82)
  })

  it('handles scratch golfer with no handicap', () => {
    expect(calcNetScore(72, 0)).toBe(72)
  })

  it('never returns negative (clamps to 0)', () => {
    expect(calcNetScore(5, 18)).toBe(0)
  })
})

describe('calcStandingsRank', () => {
  const rows: StandingRow[] = [
    { league_member_id: 'a', user_id: 'u1', full_name: 'Alice', handicap: 10, rounds_played: 3, avg_net_score: 78.0, best_net: 74, total_gross: 240 },
    { league_member_id: 'b', user_id: 'u2', full_name: 'Bob',   handicap: 15, rounds_played: 3, avg_net_score: 75.5, best_net: 72, total_gross: 250 },
    { league_member_id: 'c', user_id: 'u3', full_name: 'Carol', handicap: 5,  rounds_played: 2, avg_net_score: 81.0, best_net: 79, total_gross: 168 },
    { league_member_id: 'd', user_id: 'u4', full_name: 'Dave',  handicap: 20, rounds_played: 0, avg_net_score: null, best_net: null, total_gross: null },
  ]

  it('sorts by avg_net_score ascending (lower is better)', () => {
    const ranked = calcStandingsRank(rows)
    expect(ranked[0].full_name).toBe('Bob')
    expect(ranked[1].full_name).toBe('Alice')
    expect(ranked[2].full_name).toBe('Carol')
  })

  it('places players with no rounds at the bottom', () => {
    const ranked = calcStandingsRank(rows)
    expect(ranked[ranked.length - 1].full_name).toBe('Dave')
  })

  it('assigns sequential rank numbers starting from 1', () => {
    const ranked = calcStandingsRank(rows)
    expect(ranked.map(r => r.rank)).toEqual([1, 2, 3, 4])
  })
})

describe('formatLeagueStatus', () => {
  it('formats draft', () => expect(formatLeagueStatus('draft')).toBe('Draft'))
  it('formats active', () => expect(formatLeagueStatus('active')).toBe('Active'))
  it('formats completed', () => expect(formatLeagueStatus('completed')).toBe('Completed'))
})

describe('formatLeagueFormat', () => {
  it('formats stroke_play', () => expect(formatLeagueFormat('stroke_play')).toBe('Stroke Play'))
  it('formats stableford', () => expect(formatLeagueFormat('stableford')).toBe('Stableford'))
})

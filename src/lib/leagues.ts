export interface StandingRow {
  league_member_id: string
  user_id: string
  full_name: string
  handicap: number
  rounds_played: number
  avg_net_score: number | null
  best_net: number | null
  total_gross: number | null
}

export interface RankedStandingRow extends StandingRow {
  rank: number
}

/** Net score = gross − handicap strokes, minimum 0. */
export function calcNetScore(gross: number, handicapStrokes: number): number {
  return Math.max(0, gross - handicapStrokes)
}

/**
 * Sort standings rows by avg_net_score ascending (lower = better).
 * Rows with no rounds played sort to the bottom.
 * Returns a new array with a `rank` field appended (1-indexed).
 */
export function calcStandingsRank(rows: StandingRow[]): RankedStandingRow[] {
  const withRounds = rows
    .filter(r => r.rounds_played > 0 && r.avg_net_score !== null)
    .sort((a, b) => (a.avg_net_score as number) - (b.avg_net_score as number))

  const noRounds = rows.filter(r => r.rounds_played === 0 || r.avg_net_score === null)

  return [...withRounds, ...noRounds].map((r, i) => ({ ...r, rank: i + 1 }))
}

export function formatLeagueStatus(status: string): string {
  const map: Record<string, string> = {
    draft: 'Draft',
    active: 'Active',
    completed: 'Completed',
  }
  return map[status] ?? status
}

export function formatLeagueFormat(format: string): string {
  const map: Record<string, string> = {
    stroke_play: 'Stroke Play',
    stableford: 'Stableford',
  }
  return map[format] ?? format
}

export function formatHoles(holes: number): string {
  return `${holes} Holes`
}

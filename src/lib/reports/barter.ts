import { createAdminClient } from '@/lib/supabase/admin'

export const GOLFNOW_BARTER_RATE = 0.20

export interface BarterSavings {
  golfnowCostMtd: number
  golfnowCostYtd: number
  staffHoursSaved: number
  teeaheadCost: number
}

export function calcBarterSavings(opts: {
  rounds: number
  avgGreenFee: number
  waitlistFills: number
  monthsElapsed?: number
}): BarterSavings {
  const { rounds, avgGreenFee, waitlistFills, monthsElapsed = 1 } = opts
  const golfnowCostMtd = Math.round(rounds * avgGreenFee * GOLFNOW_BARTER_RATE)
  const golfnowCostYtd = golfnowCostMtd * monthsElapsed
  const staffHoursSaved = Math.round((waitlistFills * 15) / 60 * 10) / 10
  return { golfnowCostMtd, golfnowCostYtd, staffHoursSaved, teeaheadCost: 0 }
}

// ─── NGCOA-methodology monthly receipt ────────────────────────────────────────
//
// The Barter Receipt is one of TeeAhead's five strategic differentiators.
// It is generated monthly and emailed to every active partner course.
//
// Formula (NGCOA/ORCA Operator Barter Cost Study):
//   estimated_barter_rounds = peak_rounds * BARTER_SHARE
//   estimated_barter_cost   = estimated_barter_rounds * avg_green_fee * BARTER_TAKE_RATE
//
// BARTER_SHARE     = 0.30  conservative middle of the published 25–40% range
//                          (share of peak inventory GolfNow takes as barter)
// BARTER_TAKE_RATE = 0.85  GolfNow's effective take rate after resale discount
//
// Peak hours, per the NGCOA study, are:
//   - Sat & Sun, 7 AM – 11 AM (weekend morning)
//   - Thu & Fri, 4 PM – 7 PM (twilight)
// classified in the course's local timezone (America/Detroit).

export const BARTER_SHARE = 0.30
export const BARTER_TAKE_RATE = 0.85
const COURSE_TZ = 'America/Detroit'

export interface MonthlyBarterCalc {
  courseId: string
  receiptMonth: string // 'YYYY-MM-DD' first day of reported month
  totalRounds: number
  peakRounds: number
  peakPct: number // 0–100
  avgGreenFee: number // dollars, 2dp
  estimatedBarterRounds: number
  estimatedBarterCost: number // dollars, 2dp
}

// Exported for unit testing. Classifies whether a given UTC ISO timestamp
// lands inside an NGCOA-defined peak window in the course's local time.
export function isPeakSlot(iso: string, tz: string = COURSE_TZ): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(new Date(iso))

  const weekday = parts.find(p => p.type === 'weekday')?.value ?? ''
  const hourStr = parts.find(p => p.type === 'hour')?.value ?? '0'
  const hour = Number(hourStr) % 24

  // Sat/Sun, 7 AM – 11 AM (inclusive of 11 means a tee time starting at 11
  // still counts as a weekend-morning slot).
  if ((weekday === 'Sat' || weekday === 'Sun') && hour >= 7 && hour <= 11) {
    return true
  }
  // Thu/Fri twilight, 4 PM – 7 PM.
  if ((weekday === 'Thu' || weekday === 'Fri') && hour >= 16 && hour <= 19) {
    return true
  }
  return false
}

interface BookingRow {
  players: number
  total_paid: number
  status: string
}

interface SlotRow {
  scheduled_at: string
  bookings: BookingRow[] | null
}

// Exported for unit testing, runs the calculation against an in-memory
// slot array, no DB. Returns null when the month has no qualifying rounds.
export function computeMonthlyBarter(opts: {
  slots: Array<{ scheduled_at: string; bookings: BookingRow[] | null }>
  courseId: string
  monthStart: Date
}): MonthlyBarterCalc | null {
  let totalRounds = 0
  let peakRounds = 0
  let totalRevenue = 0

  for (const slot of opts.slots) {
    const bookings = slot.bookings ?? []
    const playedRounds = bookings
      .filter(b => b.status === 'confirmed' || b.status === 'completed')
      .reduce((s, b) => s + (b.players ?? 0), 0)
    if (playedRounds === 0) continue

    const playedRevenue = bookings
      .filter(b => b.status === 'confirmed' || b.status === 'completed')
      .reduce((s, b) => s + Number(b.total_paid ?? 0), 0)

    totalRounds += playedRounds
    totalRevenue += playedRevenue
    if (isPeakSlot(slot.scheduled_at)) {
      peakRounds += playedRounds
    }
  }

  if (totalRounds === 0) return null

  const avgGreenFee = totalRevenue / totalRounds
  const peakPct = (peakRounds / totalRounds) * 100
  const estimatedBarterRounds = Math.round(peakRounds * BARTER_SHARE)
  const estimatedBarterCost = estimatedBarterRounds * avgGreenFee * BARTER_TAKE_RATE

  return {
    courseId: opts.courseId,
    receiptMonth: toIsoDate(opts.monthStart),
    totalRounds,
    peakRounds,
    peakPct: Math.round(peakPct * 100) / 100,
    avgGreenFee: Math.round(avgGreenFee * 100) / 100,
    estimatedBarterRounds,
    estimatedBarterCost: Math.round(estimatedBarterCost * 100) / 100,
  }
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// Loads bookings for the given course/month and runs the NGCOA calculation.
// Used by the monthly cron and the "Generate Now" manual button.
export async function calculateMonthlyBarterReceipt(opts: {
  courseId: string
  monthStart: Date // first day of the month at 00:00 UTC
}): Promise<MonthlyBarterCalc | null> {
  const admin = createAdminClient()

  const monthEnd = new Date(opts.monthStart)
  monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1)

  const { data: slots, error } = await admin
    .from('tee_times')
    .select('scheduled_at, bookings(players, total_paid, status)')
    .eq('course_id', opts.courseId)
    .gte('scheduled_at', opts.monthStart.toISOString())
    .lt('scheduled_at', monthEnd.toISOString())

  if (error) throw new Error(`[calculateMonthlyBarterReceipt] ${error.message}`)

  return computeMonthlyBarter({
    slots: (slots ?? []) as SlotRow[],
    courseId: opts.courseId,
    monthStart: opts.monthStart,
  })
}

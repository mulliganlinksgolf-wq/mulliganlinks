// src/lib/pricing/rules.ts
//
// Pure rule resolver. No IO. Test target.

export type RateRuleActionType =
  | 'percent_adjust'
  | 'fixed_amount_adjust'
  | 'fixed_price_override'

export type RateRuleCategory =
  | 'peak'
  | 'twilight'
  | 'off_peak'
  | 'holiday'
  | 'weather'
  | 'occupancy'
  | 'days_out'
  | 'custom'

export type RateRule = {
  id: string
  name: string
  category: RateRuleCategory
  enabled: boolean
  daysOfWeek: number[] | null      // JS Sunday=0 ... Saturday=6
  startTime: string | null         // 'HH:MM' or 'HH:MM:SS'
  endTime: string | null
  isHoliday: boolean | null
  minDaysOut: number | null
  maxDaysOut: number | null
  minOccupancyPct: number | null
  maxOccupancyPct: number | null
  actionType: RateRuleActionType
  actionValue: number
  priority: number
  displayLabel: string | null
}

export type PricingContext = {
  slotTime: Date
  isHoliday: boolean
  daysOut: number
  occupancyPct: number // 0..100
}

export type RuleMatchResult = {
  rule: RateRule
  effectAmount: number  // signed change applied
  newRate: number       // rate after this rule
}

export type PricingResolution = {
  baseRate: number
  finalRate: number
  appliedRules: RuleMatchResult[]
}

const TIME_RE = /^(\d{2}):(\d{2})(?::(\d{2}))?$/

function timeStrToMinutes(t: string): number {
  const m = t.match(TIME_RE)
  if (!m) throw new Error(`Invalid time string: ${t}`)
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10)
}

function ruleMatches(rule: RateRule, ctx: PricingContext): boolean {
  if (!rule.enabled) return false

  if (rule.daysOfWeek && !rule.daysOfWeek.includes(ctx.slotTime.getUTCDay())) return false

  if (rule.startTime || rule.endTime) {
    const slotMin = ctx.slotTime.getUTCHours() * 60 + ctx.slotTime.getUTCMinutes()
    if (rule.startTime && slotMin < timeStrToMinutes(rule.startTime)) return false
    if (rule.endTime && slotMin >= timeStrToMinutes(rule.endTime)) return false
  }

  if (rule.isHoliday !== null && rule.isHoliday !== ctx.isHoliday) return false
  if (rule.minDaysOut !== null && ctx.daysOut < rule.minDaysOut) return false
  if (rule.maxDaysOut !== null && ctx.daysOut > rule.maxDaysOut) return false
  if (rule.minOccupancyPct !== null && ctx.occupancyPct < rule.minOccupancyPct) return false
  if (rule.maxOccupancyPct !== null && ctx.occupancyPct > rule.maxOccupancyPct) return false

  return true
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function applyRule(currentRate: number, rule: RateRule): number {
  switch (rule.actionType) {
    case 'percent_adjust':
      return round2(currentRate * (1 + rule.actionValue / 100))
    case 'fixed_amount_adjust':
      return round2(currentRate + rule.actionValue)
    case 'fixed_price_override':
      return round2(rule.actionValue)
  }
}

export function resolvePricing(
  baseRate: number,
  rules: RateRule[],
  ctx: PricingContext,
): PricingResolution {
  const sorted = [...rules].sort((a, b) => a.priority - b.priority)
  const applied: RuleMatchResult[] = []
  let currentRate = baseRate

  const floor   = round2(baseRate * 0.5)
  const ceiling = round2(baseRate * 3)

  for (const rule of sorted) {
    if (!ruleMatches(rule, ctx)) continue
    const prev = currentRate
    let next = applyRule(currentRate, rule)
    if (next < floor) next = floor
    if (next > ceiling) next = ceiling
    currentRate = next
    applied.push({
      rule,
      effectAmount: round2(currentRate - prev),
      newRate: currentRate,
    })
  }

  return { baseRate, finalRate: currentRate, appliedRules: applied }
}

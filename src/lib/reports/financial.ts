import { createAdminClient } from '@/lib/supabase/admin'

export const EAGLE_PRICE = 89
export const ACE_PRICE = 159

export const EXPENSE_CATEGORIES = [
  'Engineering',
  'Sales',
  'Marketing',
  'Operations',
  'Infrastructure',
  'G&A',
] as const

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]

export function calcMrr({ eagleCount, aceCount }: { eagleCount: number; aceCount: number }): number {
  return eagleCount * EAGLE_PRICE + aceCount * ACE_PRICE
}

export function calcGrossMargin({ revenue, cogs }: { revenue: number; cogs: number }): number {
  if (revenue === 0) return 0
  return Math.round(((revenue - cogs) / revenue) * 100 * 10) / 10
}

export function buildPnlRows({
  revenue,
  expensesByCategory,
}: {
  revenue: number
  expensesByCategory: Partial<Record<string, number>>
}) {
  const totalExpenses = Object.values(expensesByCategory).reduce<number>((s, v) => s + (v ?? 0), 0)
  return { totalExpenses, net: revenue - totalExpenses }
}

export interface FinancialKpis {
  mrrCurrent: number
  arrCurrent: number
  totalRevenueMtd: number
  grossMarginPct: number
  netBurn: number | null
  eagleCount: number
  aceCount: number
}

export async function getFinancialKpis(from: string, to: string): Promise<FinancialKpis> {
  const admin = createAdminClient()

  const [{ data: memberships, error: membershipsError }, { data: expenses, error: expensesError }] = await Promise.all([
    admin.from('memberships').select('tier, status').eq('status', 'active'),
    admin.from('crm_expenses').select('amount, month').gte('month', from.slice(0, 7)).lte('month', to.slice(0, 7)),
  ])
  if (membershipsError) throw new Error(`[getFinancialKpis] memberships query failed: ${membershipsError.message}`)
  if (expensesError) throw new Error(`[getFinancialKpis] expenses query failed: ${expensesError.message}`)

  const active = memberships ?? []
  const eagleCount = active.filter(m => m.tier === 'eagle').length
  const aceCount = active.filter(m => m.tier === 'ace').length
  const mrr = calcMrr({ eagleCount, aceCount })
  const arr = mrr * 12
  const totalExpenses = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0)
  const grossMarginPct = calcGrossMargin({ revenue: mrr, cogs: totalExpenses })

  return {
    mrrCurrent: mrr,
    arrCurrent: arr,
    totalRevenueMtd: mrr,
    grossMarginPct,
    netBurn: totalExpenses > 0 ? totalExpenses - mrr : null,
    eagleCount,
    aceCount,
  }
}

export interface RevenueByMonth {
  month: string
  membership: number
  outing: number
  affiliate: number
}

export async function getRevenueByMonth(from: string, to: string): Promise<RevenueByMonth[]> {
  const admin = createAdminClient()
  const { data: metrics, error: metricsError } = await admin
    .from('crm_member_metrics')
    .select('month, mrr_eagle, mrr_ace')
    .gte('month', from.slice(0, 7))
    .lte('month', to.slice(0, 7))
    .order('month')
  if (metricsError) throw new Error(`[getRevenueByMonth] query failed: ${metricsError.message}`)

  return (metrics ?? []).map(m => ({
    month: m.month,
    membership: Number(m.mrr_eagle) + Number(m.mrr_ace),
    outing: 0,
    affiliate: 0,
  }))
}

export interface MrrHistory {
  month: string
  mrr: number
  eagle: number
  ace: number
}

export async function getMrrHistory(months = 12): Promise<MrrHistory[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('crm_member_metrics')
    .select('month, mrr_eagle, mrr_ace')
    .order('month', { ascending: false })
    .limit(months)
  if (error) throw new Error(`[getMrrHistory] query failed: ${error.message}`)

  return (data ?? []).reverse().map(m => ({
    month: m.month,
    eagle: Number(m.mrr_eagle),
    ace: Number(m.mrr_ace),
    mrr: Number(m.mrr_eagle) + Number(m.mrr_ace),
  }))
}

export interface PnlRow {
  month: string
  revenue: number
  expenses: Partial<Record<ExpenseCategory, number>>
  totalExpenses: number
  net: number
}

export async function getPnlByMonth(from: string, to: string): Promise<PnlRow[]> {
  const admin = createAdminClient()
  const [{ data: metrics, error: metricsError }, { data: expenses, error: expensesError }] = await Promise.all([
    admin.from('crm_member_metrics').select('month, mrr_eagle, mrr_ace')
      .gte('month', from.slice(0, 7)).lte('month', to.slice(0, 7)).order('month'),
    admin.from('crm_expenses').select('month, category, amount')
      .gte('month', from.slice(0, 7)).lte('month', to.slice(0, 7)),
  ])
  if (metricsError) throw new Error(`[getPnlByMonth] metrics query failed: ${metricsError.message}`)
  if (expensesError) throw new Error(`[getPnlByMonth] expenses query failed: ${expensesError.message}`)

  const expMap: Record<string, Partial<Record<ExpenseCategory, number>>> = {}
  for (const e of expenses ?? []) {
    if (!expMap[e.month]) expMap[e.month] = {}
    if ((EXPENSE_CATEGORIES as readonly string[]).includes(e.category)) {
      expMap[e.month][e.category as ExpenseCategory] =
        (expMap[e.month][e.category as ExpenseCategory] ?? 0) + Number(e.amount)
    }
  }

  return (metrics ?? []).map(m => {
    const revenue = Number(m.mrr_eagle) + Number(m.mrr_ace)
    const exps = expMap[m.month] ?? {}
    const totalExpenses = Object.values(exps).reduce((s, v) => s + (v ?? 0), 0)
    return { month: m.month, revenue, expenses: exps, totalExpenses, net: revenue - totalExpenses }
  })
}

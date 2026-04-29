import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveDateRange } from '@/lib/reports/dateRange'
import { getFinancialKpis, getRevenueByMonth, getMrrHistory, getPnlByMonth, EXPENSE_CATEGORIES } from '@/lib/reports/financial'
import KpiTile from '@/components/reports/KpiTile'
import DateRangePicker from '@/components/reports/DateRangePicker'
import CsvExportButton from '@/components/reports/CsvExportButton'
import { RevenueStackedChart, MrrAreaChart } from './FinancialCharts'
import ExpenseForm from './ExpenseForm'

export const metadata = { title: 'Financial Reports' }

export default async function FinancialReportPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/app')

  const sp = await searchParams
  const range = resolveDateRange(sp.preset, sp.from, sp.to)

  const [kpis, revenueByMonth, mrrHistory, pnl] = await Promise.all([
    getFinancialKpis(range.from, range.to),
    getRevenueByMonth(range.from, range.to),
    getMrrHistory(12),
    getPnlByMonth(range.from, range.to),
  ])

  const revenueTableData = revenueByMonth.map(r => ({
    Month: r.month,
    'Membership Revenue': r.membership,
    'Outing Revenue': r.outing,
    'Affiliate Revenue': r.affiliate,
    Total: r.membership + r.outing + r.affiliate,
  }))

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Financial Reports</h1>
        <DateRangePicker />
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiTile label="MRR" value={`$${kpis.mrrCurrent.toLocaleString()}`} accent />
        <KpiTile label="ARR" value={`$${kpis.arrCurrent.toLocaleString()}`} />
        <KpiTile label="Total Revenue MTD" value={`$${kpis.totalRevenueMtd.toLocaleString()}`} />
        <KpiTile label="Gross Margin" value={`${kpis.grossMarginPct}%`} />
        {kpis.netBurn !== null && (
          <KpiTile label="Net Burn" value={`$${Math.abs(kpis.netBurn).toLocaleString()}`} sub={kpis.netBurn > 0 ? 'burning' : 'profitable'} alert={kpis.netBurn > 0} />
        )}
      </div>

      {/* Revenue by Stream */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[#1A1A1A]">Revenue by Stream</h2>
          <CsvExportButton data={revenueTableData} filename="revenue-by-stream.csv" />
        </div>
        <RevenueStackedChart data={revenueByMonth} />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Month', 'Membership', 'Outing', 'Affiliate', 'Total'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-xs text-[#6B7770] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {revenueByMonth.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-sm text-[#6B7770]">No data for this period.</td></tr>
              ) : revenueByMonth.map(r => (
                <tr key={r.month} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3 text-[#1A1A1A]">{r.month}</td>
                  <td className="py-2 px-3">${r.membership.toLocaleString()}</td>
                  <td className="py-2 px-3">${r.outing.toLocaleString()}</td>
                  <td className="py-2 px-3">${r.affiliate.toLocaleString()}</td>
                  <td className="py-2 px-3 font-medium">${(r.membership + r.outing + r.affiliate).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MRR / ARR Tracker */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-[#1A1A1A] mb-4">MRR / ARR (Last 12 Months)</h2>
        <MrrAreaChart data={mrrHistory} />
      </div>

      {/* P&L */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[#1A1A1A]">P&amp;L View</h2>
          <a
            href={`/api/reports/financial/pnl-pdf?preset=${range.preset}${range.preset === 'custom' ? `&from=${range.from}&to=${range.to}` : ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-[#6B7770] hover:border-[#1B4332] hover:text-[#1A1A1A] transition-colors"
          >
            Export as PDF
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-xs text-[#6B7770] font-medium">Month</th>
                <th className="text-right py-2 px-3 text-xs text-[#6B7770] font-medium">Revenue</th>
                {EXPENSE_CATEGORIES.map(c => (
                  <th key={c} className="text-right py-2 px-3 text-xs text-[#6B7770] font-medium">{c}</th>
                ))}
                <th className="text-right py-2 px-3 text-xs text-[#6B7770] font-medium">Total Expenses</th>
                <th className="text-right py-2 px-3 text-xs text-[#6B7770] font-medium">Net</th>
              </tr>
            </thead>
            <tbody>
              {pnl.length === 0 ? (
                <tr><td colSpan={EXPENSE_CATEGORIES.length + 3} className="py-8 text-center text-sm text-[#6B7770]">No data for this period.</td></tr>
              ) : pnl.map(row => (
                <tr key={row.month} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3">{row.month}</td>
                  <td className="py-2 px-3 text-right text-emerald-700">${row.revenue.toLocaleString()}</td>
                  {EXPENSE_CATEGORIES.map(c => (
                    <td key={c} className="py-2 px-3 text-right">${(row.expenses[c] ?? 0).toLocaleString()}</td>
                  ))}
                  <td className="py-2 px-3 text-right font-medium">${row.totalExpenses.toLocaleString()}</td>
                  <td className={`py-2 px-3 text-right font-semibold ${row.net >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    ${row.net.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ExpenseForm />
    </div>
  )
}

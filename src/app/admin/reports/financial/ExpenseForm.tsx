'use client'

import { useState } from 'react'
import { saveExpenses } from './expenseActions'
import { EXPENSE_CATEGORIES } from '@/lib/reports/financial'

export default function ExpenseForm() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<{ error?: string; success?: boolean } | null>(null)
  const [loading, setLoading] = useState(false)

  const defaultMonth = new Date().toISOString().slice(0, 7)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    const result = await saveExpenses(new FormData(e.currentTarget))
    setStatus(result)
    setLoading(false)
    if (result.success) setTimeout(() => { setOpen(false); setStatus(null) }, 1500)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold text-[#1A1A1A]">Log Expenses</h2>
        <button onClick={() => setOpen(v => !v)}
          className="text-sm text-[#1B4332] font-medium hover:underline">
          {open ? 'Hide' : 'Enter expenses'}
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {status?.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{status.error}</div>
          )}
          {status?.success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm text-emerald-800">Expenses saved.</div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Month</label>
            <input name="month" type="month" defaultValue={defaultMonth} required
              disabled={loading}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] disabled:opacity-50" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {EXPENSE_CATEGORIES.map(category => (
              <div key={category}>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">{category}</label>
                <input name={`expense_${category}`} type="number" min="0" step="0.01" defaultValue="0"
                  disabled={loading}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] disabled:opacity-50" />
              </div>
            ))}
          </div>

          <button type="submit" disabled={loading}
            className="bg-[#1B4332] text-[#FAF7F2] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#163829] disabled:opacity-50">
            {loading ? 'Saving…' : 'Save Expenses'}
          </button>
        </form>
      )}
    </div>
  )
}

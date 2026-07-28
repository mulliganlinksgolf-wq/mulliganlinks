'use client'

import { useEffect, useState } from 'react'

const HOURS = Array.from({ length: 14 }, (_, i) => i + 6) // 6am..7pm

function hourLabel(h: number) {
  if (h === 12) return '12p'
  if (h > 12) return `${h - 12}p`
  return `${h}a`
}

export function PricingPreviewCalendar({ courseId }: { courseId: string }) {
  const [grid, setGrid] = useState<Record<string, { rate: number; rules: string[] }> | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/course/${courseId}/pricing-preview`)
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => { if (!cancelled) setGrid(data) })
      .catch(e => { if (!cancelled) setErr(e.message) })
    return () => { cancelled = true }
  }, [courseId])

  if (err) return <div className="text-sm text-red-700">Preview failed: {err}</div>
  if (!grid) return <div className="text-sm text-[#6B7770]">Loading preview…</div>

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() + i)
    return d
  })

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-xs">
        <thead>
          <tr>
            <th className="bg-slate-50 p-2"></th>
            {HOURS.map(h => (
              <th key={h} className="bg-slate-50 p-2 font-medium">{hourLabel(h)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map(d => (
            <tr key={d.toISOString()}>
              <th className="bg-slate-50 p-2 text-left whitespace-nowrap font-medium">
                {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}
              </th>
              {HOURS.map(h => {
                const key = `${d.toISOString().slice(0, 10)}T${String(h).padStart(2, '0')}:00`
                const cell = grid[key]
                if (!cell) {
                  return <td key={h} className="bg-slate-50/50 p-2 text-center w-16 text-slate-300">—</td>
                }
                return (
                  <td
                    key={h}
                    className="p-2 text-center border border-slate-100 w-16"
                    title={cell.rules.length ? `Rules applied: ${cell.rules.join(', ')}` : 'Base rate'}
                  >
                    <div className="font-medium">${cell.rate.toFixed(0)}</div>
                    {cell.rules[0] && (
                      <div className="text-[10px] text-[#6B7770] truncate">{cell.rules[0]}</div>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

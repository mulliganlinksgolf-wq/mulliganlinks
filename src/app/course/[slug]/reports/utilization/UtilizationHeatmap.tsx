'use client'

import type { UtilizationCell } from '@/lib/reports/courseMetrics'

const HOURS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]
const DAYS  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatHour(h: number) {
  if (h === 12) return '12:00 PM'
  if (h === 0) return '12:00 AM'
  return `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`
}

function intensityClass(count: number, max: number): string {
  if (max === 0 || count === 0) return 'bg-gray-100'
  const ratio = count / max
  if (ratio < 0.2) return 'bg-emerald-100'
  if (ratio < 0.4) return 'bg-emerald-200'
  if (ratio < 0.6) return 'bg-emerald-300'
  if (ratio < 0.8) return 'bg-emerald-400'
  return 'bg-emerald-600'
}

export function UtilizationHeatmap({ cells }: { cells: UtilizationCell[] }) {
  const cellMap = new Map<string, UtilizationCell>()
  for (const c of cells) cellMap.set(`${c.dayOfWeek}:${c.hourSlot}`, c)
  const max = Math.max(0, ...cells.map(c => c.count))

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[520px]">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 mb-1">
          <div />
          {DAYS.map(d => (
            <div key={d} className="text-xs text-center text-gray-500 font-medium">{d}</div>
          ))}
        </div>
        {HOURS.map(hour => (
          <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 mb-1">
            <div className="text-xs text-right pr-2 text-gray-400 leading-6">{formatHour(hour)}</div>
            {DAYS.map((_, dayIdx) => {
              const cell = cellMap.get(`${dayIdx}:${hour}`)
              return (
                <div
                  key={dayIdx}
                  title={cell ? `${cell.count} booking${cell.count !== 1 ? 's' : ''}, avg ${cell.avgParty} players` : 'No bookings'}
                  className={`h-6 rounded text-xs flex items-center justify-center ${intensityClass(cell?.count ?? 0, max)}`}
                >
                  {cell && cell.count > 0 ? (
                    <span className="text-[10px] font-medium text-emerald-900">{cell.count}</span>
                  ) : null}
                </div>
              )
            })}
          </div>
        ))}
        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="text-xs text-gray-400">Low</span>
          {['bg-gray-100', 'bg-emerald-100', 'bg-emerald-200', 'bg-emerald-400', 'bg-emerald-600'].map(c => (
            <div key={c} className={`w-4 h-4 rounded ${c}`} />
          ))}
          <span className="text-xs text-gray-400">High</span>
        </div>
      </div>
    </div>
  )
}

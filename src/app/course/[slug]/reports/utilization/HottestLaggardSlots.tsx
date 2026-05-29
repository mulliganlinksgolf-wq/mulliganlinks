// Top-5 / bottom-5 ranked slot lists derived from the same utilization
// cell data the heatmap renders. Surfaces "hottest" and "laggard" slots
// at a glance for operators planning pricing or pace-of-play adjustments.
//
// Note: cells with zero bookings don't appear in the source data (the
// aggregator filters them out). The "laggard" list is therefore the
// least-booked among slots that *did* see at least one booking. A future
// enhancement would compare booked vs. offered to surface truly cold slots.

import type { UtilizationCell } from '@/lib/reports/courseMetrics'

const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatHour(h: number): string {
  if (h === 0) return '12 AM'
  if (h === 12) return '12 PM'
  return h > 12 ? `${h - 12} PM` : `${h} AM`
}

function formatCell(c: UtilizationCell): string {
  return `${DAY_FULL[c.dayOfWeek]} ${formatHour(c.hourSlot)}`
}

export function HottestLaggardSlots({ cells }: { cells: UtilizationCell[] }) {
  if (cells.length === 0) return null

  const sorted = [...cells].sort((a, b) => b.count - a.count)
  const hottest = sorted.slice(0, 5)
  const laggard = sorted.slice(-5).reverse()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SlotList
        title="Hottest Slots"
        tagline="Sells out the most consistently, best candidates for pricing experiments"
        accent="emerald"
        cells={hottest}
      />
      <SlotList
        title="Laggard Slots"
        tagline="Least-booked among slots that got at least one booking, candidates for promotion or pace-of-play tweaks"
        accent="amber"
        cells={laggard}
      />
    </div>
  )
}

function SlotList({
  title,
  tagline,
  accent,
  cells,
}: {
  title: string
  tagline: string
  accent: 'emerald' | 'amber'
  cells: UtilizationCell[]
}) {
  const dot = accent === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-[#1A1A1A] flex items-center gap-2">
        <span className={`inline-block w-2 h-2 rounded-full ${dot}`} />
        {title}
      </h3>
      <p className="text-xs text-[#6B7770] mt-1 mb-4">{tagline}</p>
      <ol className="space-y-2">
        {cells.map((c, i) => (
          <li
            key={`${c.dayOfWeek}-${c.hourSlot}`}
            className="flex items-center justify-between text-sm border-b border-gray-50 pb-2 last:border-b-0 last:pb-0"
          >
            <span className="flex items-center gap-3">
              <span className="text-xs text-[#9CA3AF] tabular-nums w-4 text-right">{i + 1}</span>
              <span className="text-[#1A1A1A]">{formatCell(c)}</span>
            </span>
            <span className="text-xs text-[#6B7770] tabular-nums">
              {c.count.toLocaleString()} bookings · {c.avgParty.toFixed(1)} avg party
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

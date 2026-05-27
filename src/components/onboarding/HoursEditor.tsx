'use client'

export type DayHours = {
  dayOfWeek: number // 0=Monday, 6=Sunday
  label: string
  isOpen: boolean
  openTime: string  // "07:00"
  closeTime: string // "18:00"
}

export const DEFAULT_HOURS: DayHours[] = [
  { dayOfWeek: 0, label: 'Monday',    isOpen: true, openTime: '07:00', closeTime: '18:00' },
  { dayOfWeek: 1, label: 'Tuesday',   isOpen: true, openTime: '07:00', closeTime: '18:00' },
  { dayOfWeek: 2, label: 'Wednesday', isOpen: true, openTime: '07:00', closeTime: '18:00' },
  { dayOfWeek: 3, label: 'Thursday',  isOpen: true, openTime: '07:00', closeTime: '18:00' },
  { dayOfWeek: 4, label: 'Friday',    isOpen: true, openTime: '07:00', closeTime: '18:00' },
  { dayOfWeek: 5, label: 'Saturday',  isOpen: true, openTime: '06:30', closeTime: '18:30' },
  { dayOfWeek: 6, label: 'Sunday',    isOpen: true, openTime: '06:30', closeTime: '18:30' },
]

type Props = {
  value: DayHours[]
  onChange: (days: DayHours[]) => void
}

export default function HoursEditor({ value, onChange }: Props) {
  function update(index: number, patch: Partial<DayHours>) {
    const next = value.map((day, i) => (i === index ? { ...day, ...patch } : day))
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header row */}
      <div className="grid grid-cols-[120px_1fr_1fr_auto] gap-2 items-center">
        <span className="text-xs text-gray-400" />
        <span className="text-xs text-gray-400">Opens</span>
        <span className="text-xs text-gray-400">Closes</span>
        <span className="text-xs text-gray-400 w-10 text-center">Open</span>
      </div>

      {value.map((day, i) => (
        <div key={day.dayOfWeek} className="grid grid-cols-[120px_1fr_1fr_auto] gap-2 items-center">
          {/* Day label */}
          <span className="text-sm text-gray-700">{day.label}</span>

          {/* Open time */}
          <input
            type="time"
            value={day.openTime}
            disabled={!day.isOpen}
            onChange={(e) => update(i, { openTime: e.target.value })}
            className={`rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B6D11] ${!day.isOpen ? 'opacity-40' : ''}`}
          />

          {/* Close time */}
          <input
            type="time"
            value={day.closeTime}
            disabled={!day.isOpen}
            onChange={(e) => update(i, { closeTime: e.target.value })}
            className={`rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B6D11] ${!day.isOpen ? 'opacity-40' : ''}`}
          />

          {/* Toggle */}
          <label className="relative inline-flex items-center cursor-pointer w-10">
            <input
              type="checkbox"
              className="sr-only"
              checked={day.isOpen}
              onChange={() => update(i, { isOpen: !day.isOpen })}
            />
            <div
              className={`relative w-10 h-5 rounded-full transition-colors ${day.isOpen ? 'bg-[#3B6D11]' : 'bg-gray-200'}`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${day.isOpen ? 'translate-x-5' : 'translate-x-0.5'}`}
              />
            </div>
          </label>
        </div>
      ))}
    </div>
  )
}

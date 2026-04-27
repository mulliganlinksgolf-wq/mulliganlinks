'use client'

const AMENITIES = [
  { key: 'driving_range',     label: 'Driving range' },
  { key: 'putting_green',     label: 'Putting green' },
  { key: 'chipping_area',     label: 'Chipping area' },
  { key: 'pro_shop',          label: 'Pro shop' },
  { key: 'restaurant_bar',    label: 'Restaurant / bar' },
  { key: 'banquet_space',     label: 'Banquet space' },
  { key: 'club_rentals',      label: 'Club rentals' },
  { key: 'gps_carts',         label: 'GPS carts' },
  { key: 'pull_carts',        label: 'Pull carts' },
  { key: 'simulator_bay',     label: 'Simulator bay' },
  { key: 'lessons_available', label: 'Lessons available' },
  { key: 'beverage_cart',     label: 'Beverage cart' },
  { key: 'locker_rooms',      label: 'Locker rooms' },
  { key: 'fitness_center',    label: 'Fitness center' },
  { key: 'pool',              label: 'Pool' },
]

type Props = {
  value: string[]
  onChange: (selected: string[]) => void
}

export default function AmenitiesSelector({ value, onChange }: Props) {
  function toggle(key: string) {
    if (value.includes(key)) {
      onChange(value.filter((k) => k !== key))
    } else {
      onChange([...value, key])
    }
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2">
      {AMENITIES.map(({ key, label }) => {
        const selected = value.includes(key)
        return (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            className={`rounded-lg border px-3 py-2 text-sm cursor-pointer flex items-center gap-2 transition-colors text-left ${
              selected
                ? 'bg-[#EAF3DE] border-[#639922] text-[#3B6D11]'
                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
            }`}
          >
            {/* Dot indicator */}
            {selected ? (
              <span className="w-2.5 h-2.5 rounded-full bg-[#3B6D11] flex-shrink-0" />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full border border-gray-400 flex-shrink-0" />
            )}
            {label}
          </button>
        )
      })}
    </div>
  )
}

'use client'

interface Props {
  greenFeeCents: number
  cartFeeCents: number
  cartPolicy: 'optional' | 'mandatory' | 'walking_only'
  value: boolean
  onChange: (cartSelected: boolean) => void
}

const fmt = (cents: number) => '$' + (cents / 100).toFixed(2)

export default function CartSelector({
  greenFeeCents,
  cartFeeCents,
  cartPolicy,
  value,
  onChange,
}: Props) {
  if (cartPolicy === 'mandatory') {
    return (
      <div className="text-sm text-gray-700">
        <span className="font-medium">Cart included</span>
        <span className="ml-2 text-gray-500">
          Total: {fmt(greenFeeCents + cartFeeCents)}
        </span>
      </div>
    )
  }

  if (cartPolicy === 'walking_only') {
    return (
      <div className="text-sm text-gray-700">
        <span className="font-medium">Walking only</span>
        <span className="ml-2 text-gray-500">{fmt(greenFeeCents)}</span>
      </div>
    )
  }

  // optional
  const rideTotal = greenFeeCents + cartFeeCents
  const rideLabel =
    cartFeeCents > 0
      ? `${fmt(greenFeeCents)} + ${fmt(cartFeeCents)} cart = ${fmt(rideTotal)}`
      : fmt(rideTotal)

  const selectedClass = 'border-2 border-emerald-500 bg-emerald-50'
  const unselectedClass = 'border-2 border-gray-200 hover:border-gray-300'

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Walk card */}
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`rounded-lg p-4 text-left cursor-pointer transition-colors ${
          !value ? selectedClass : unselectedClass
        }`}
      >
        <div className="font-medium text-gray-900">Walk</div>
        <div className="text-sm text-gray-600 mt-1">{fmt(greenFeeCents)}</div>
      </button>

      {/* Ride card */}
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`rounded-lg p-4 text-left cursor-pointer transition-colors ${
          value ? selectedClass : unselectedClass
        }`}
      >
        <div className="font-medium text-gray-900">Ride</div>
        <div className="text-sm text-gray-600 mt-1">{rideLabel}</div>
      </button>
    </div>
  )
}

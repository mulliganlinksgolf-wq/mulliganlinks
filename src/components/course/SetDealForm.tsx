'use client'

import { useState, useTransition } from 'react'
import { setTeeTimeDeal } from '@/app/actions/teeTime'

export function SetDealForm({
  teeTimeId,
  basePrice,
  initialSpecialPrice,
  initialSpecialLabel,
  onSuccess,
  onClose,
}: {
  teeTimeId: string
  basePrice: number
  initialSpecialPrice: number | null
  initialSpecialLabel: string | null
  onSuccess: () => void
  onClose: () => void
}) {
  const [price, setPrice] = useState(initialSpecialPrice?.toString() ?? '')
  const [label, setLabel] = useState(initialSpecialLabel ?? '')
  const [error, setError] = useState('')
  const [, startTransition] = useTransition()

  function handleSave() {
    const parsed = parseFloat(price)
    if (isNaN(parsed) || parsed < 0) {
      setError('Enter a valid price.')
      return
    }
    setError('')
    startTransition(async () => {
      await setTeeTimeDeal(teeTimeId, parsed, label.trim() || null)
      onSuccess()
    })
  }

  function handleRemove() {
    startTransition(async () => {
      await setTeeTimeDeal(teeTimeId, null, null)
      onSuccess()
    })
  }

  return (
    <div className="flex flex-col gap-1 mt-2">
      <div className="flex gap-2 items-center flex-wrap">
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder={`Special price (base: $${basePrice.toFixed(2)})`}
          value={price}
          onChange={e => setPrice(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-xs w-44"
        />
        <input
          type="text"
          placeholder="Label (optional)"
          value={label}
          onChange={e => setLabel(e.target.value)}
          maxLength={40}
          className="border border-gray-300 rounded px-2 py-1 text-xs w-32"
        />
        <button
          onClick={handleSave}
          className="text-xs px-3 py-1 bg-[#1B4332] text-white rounded hover:bg-[#1B4332]/90"
        >
          Save
        </button>
        {initialSpecialPrice !== null && (
          <button
            onClick={handleRemove}
            className="text-xs px-3 py-1 border border-red-300 text-red-600 rounded hover:bg-red-50"
          >
            Remove
          </button>
        )}
        <button
          onClick={onClose}
          className="text-xs px-2 py-1 text-[#6B7770] hover:text-gray-800"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

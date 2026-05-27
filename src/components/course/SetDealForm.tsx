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
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    const parsed = parseFloat(price)
    if (isNaN(parsed) || parsed < 0) {
      setError('Enter a valid price.')
      return
    }
    setError('')
    startTransition(async () => {
      try {
        const result = await setTeeTimeDeal(teeTimeId, parsed, label.trim() || null)
        if (result?.error) {
          setError(result.error)
          return
        }
        onSuccess()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save deal')
      }
    })
  }

  function handleRemove() {
    setError('')
    startTransition(async () => {
      try {
        const result = await setTeeTimeDeal(teeTimeId, null, null)
        if (result?.error) {
          setError(result.error)
          return
        }
        onSuccess()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to remove deal')
      }
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
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="text-xs px-3 py-1 bg-[#1B4332] text-white rounded hover:bg-[#1B4332]/90 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Save'}
        </button>
        {initialSpecialPrice !== null && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={isPending}
            className="text-xs px-3 py-1 border border-red-300 text-red-600 rounded hover:bg-red-50 disabled:opacity-50"
          >
            Remove
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="text-xs px-2 py-1 text-[#6B7770] hover:text-gray-800 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

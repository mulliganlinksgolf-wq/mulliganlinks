'use client'

import { useTransition } from 'react'
import { deleteAvailability } from '../actions'

export function DeleteAvailabilityButton({ availabilityId }: { availabilityId: string }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      await deleteAvailability(availabilityId)
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50 font-medium"
    >
      {isPending ? '…' : 'Delete'}
    </button>
  )
}

'use client'
import { useState, useTransition } from 'react'
import { editTier } from '@/app/admin/users/[userId]/actions'

interface EditTierModalProps {
  userId: string
  currentTier: string | null
}

export default function EditTierModal({ userId, currentTier }: EditTierModalProps) {
  const [open, setOpen] = useState(false)
  const [tier, setTier] = useState(currentTier ?? 'fairway')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSave() {
    startTransition(async () => {
      const result = await editTier(userId, tier, currentTier ?? 'fairway')
      if (result.error) { setError(result.error); return }
      setOpen(false)
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-black/15 bg-white px-4 py-2 text-sm font-medium hover:bg-[#FAF7F2] transition-colors"
      >
        Edit Tier
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl p-6 w-80 shadow-xl">
        <h2 className="font-bold text-lg mb-4">Change Tier</h2>
        <select
          value={tier}
          onChange={e => setTier(e.target.value)}
          className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm mb-4"
        >
          <option value="fairway">Fairway</option>
          <option value="eagle">Eagle</option>
          <option value="ace">Ace</option>
        </select>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm rounded-lg border border-black/15">Cancel</button>
          <button
            onClick={handleSave}
            disabled={pending || tier === currentTier}
            className="px-4 py-2 text-sm rounded-lg bg-[#1B4332] text-white font-medium disabled:opacity-50"
          >
            {pending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

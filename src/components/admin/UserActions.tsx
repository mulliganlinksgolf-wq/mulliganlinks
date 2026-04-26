'use client'

import { useTransition, useState } from 'react'
import Link from 'next/link'
import { setAdminStatus, setMemberTier, deleteMember } from '@/app/actions/admin'

interface Props {
  userId: string
  currentTier: string
  isAdmin: boolean
  isSelf: boolean
}

export function UserActions({ userId, currentTier, isAdmin, isSelf }: Props) {
  const [pending, startTransition] = useTransition()
  const [confirm, setConfirm] = useState(false)

  function handleTierChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const tier = e.target.value
    startTransition(() => setMemberTier(userId, tier))
  }

  function handleAdminToggle() {
    startTransition(() => setAdminStatus(userId, !isAdmin))
  }

  function handleDelete() {
    if (!confirm) { setConfirm(true); return }
    startTransition(() => deleteMember(userId))
  }

  return (
    <td className="px-4 py-3">
      <div className="flex items-center gap-2 flex-wrap">
        {/* View as member */}
        <Link
          href={`/admin/users/${userId}/view`}
          className="text-xs text-[#1B4332] hover:underline font-medium"
        >
          View as member →
        </Link>

        {/* Tier selector */}
        <select
          defaultValue={currentTier}
          onChange={handleTierChange}
          disabled={pending}
          className="rounded border border-black/15 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#1B4332]/30 disabled:opacity-50"
        >
          <option value="fairway">Fairway</option>
          <option value="eagle">Eagle</option>
          <option value="ace">Ace</option>
        </select>

        {/* Admin toggle */}
        {!isSelf && (
          <button
            onClick={handleAdminToggle}
            disabled={pending}
            title={isAdmin ? 'Remove admin' : 'Make admin'}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
              isAdmin
                ? 'bg-[#1B4332] text-[#FAF7F2] hover:bg-red-700'
                : 'bg-[#FAF7F2] text-[#6B7770] ring-1 ring-black/10 hover:bg-[#1B4332]/10'
            }`}
          >
            {isAdmin ? '★ Admin' : '☆ Admin'}
          </button>
        )}
        {isSelf && (
          <span className="rounded px-2 py-1 text-xs font-medium bg-[#1B4332] text-[#FAF7F2]">★ You</span>
        )}

        {/* Delete */}
        {!isSelf && (
          <button
            onClick={handleDelete}
            disabled={pending}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
              confirm
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'text-red-500 hover:text-red-700'
            }`}
          >
            {confirm ? 'Confirm delete' : 'Delete'}
          </button>
        )}
      </div>
    </td>
  )
}

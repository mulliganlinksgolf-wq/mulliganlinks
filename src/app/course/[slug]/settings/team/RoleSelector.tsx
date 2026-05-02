'use client'

import { useTransition } from 'react'
import { updateMemberRole } from '@/lib/actions/courseTeam'

const ROLES = ['owner', 'manager', 'staff'] as const

export default function RoleSelector({
  targetUserId,
  courseId,
  slug,
  currentRole,
  disabled,
}: {
  targetUserId: string
  courseId: string
  slug: string
  currentRole: string
  disabled?: boolean
}) {
  const [pending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value as 'owner' | 'manager' | 'staff'
    startTransition(async () => {
      await updateMemberRole(targetUserId, courseId, slug, newRole)
    })
  }

  return (
    <select
      value={currentRole}
      onChange={handleChange}
      disabled={pending || disabled}
      className={`text-xs rounded-full px-2 py-0.5 font-medium capitalize border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 disabled:opacity-60 disabled:cursor-default ${
        currentRole === 'owner'   ? 'bg-[#1B4332]/10 text-[#1B4332]' :
        currentRole === 'manager' ? 'bg-amber-50 text-amber-700' :
                                    'bg-gray-100 text-gray-600'
      }`}
    >
      {ROLES.map(r => (
        <option key={r} value={r} className="text-[#1A1A1A] bg-white capitalize">
          {r}
        </option>
      ))}
    </select>
  )
}

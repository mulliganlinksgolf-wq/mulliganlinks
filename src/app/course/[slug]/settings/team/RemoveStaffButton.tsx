'use client'

import { useTransition } from 'react'
import { removeStaff } from '@/lib/actions/courseTeam'

export default function RemoveStaffButton({
  targetUserId,
  courseId,
  slug,
  name,
}: {
  targetUserId: string
  courseId: string
  slug: string
  name: string
}) {
  const [pending, startTransition] = useTransition()

  function handleRemove() {
    if (!confirm(`Remove ${name} from this course? They will lose portal access immediately.`)) return
    startTransition(async () => {
      await removeStaff(targetUserId, courseId, slug)
    })
  }

  return (
    <button
      onClick={handleRemove}
      disabled={pending}
      className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50 font-medium"
    >
      {pending ? 'Removing…' : 'Remove'}
    </button>
  )
}

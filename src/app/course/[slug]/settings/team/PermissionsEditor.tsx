'use client'

import { useState, useTransition } from 'react'
import { Switch } from '@/components/ui/switch'
import {
  COURSE_PERMISSIONS,
  PERMISSION_LABELS,
  type CoursePermission,
} from '@/lib/permission-constants'
import { togglePermissionAction } from './actions'

export interface StaffMemberPerms {
  userId: string
  name: string
  email: string
  role: string
  perms: Record<CoursePermission, boolean>
}

export default function PermissionsEditor({
  courseId,
  slug,
  members,
  currentUserId,
}: {
  courseId: string
  slug: string
  members: StaffMemberPerms[]
  currentUserId: string
}) {
  if (members.length === 0) return null

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-[#1A1A1A]">Permission overrides</h2>
        <p className="text-sm text-[#6B7770] mt-0.5">
          Defaults come from the role. Toggle to override per staff member.
        </p>
      </div>
      <div className="space-y-2">
        {members.map(m => (
          <MemberCard
            key={m.userId}
            courseId={courseId}
            slug={slug}
            member={m}
            isSelf={m.userId === currentUserId}
          />
        ))}
      </div>
    </div>
  )
}

function MemberCard({
  courseId,
  slug,
  member,
  isSelf,
}: {
  courseId: string
  slug: string
  member: StaffMemberPerms
  isSelf: boolean
}) {
  const [open, setOpen] = useState(false)
  const [perms, setPerms] = useState(member.perms)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggle(p: CoursePermission, next: boolean) {
    const prev = perms[p]
    setPerms({ ...perms, [p]: next })
    setError(null)
    startTransition(async () => {
      const res = await togglePermissionAction({
        courseId,
        slug,
        userId: member.userId,
        permission: p,
        granted: next,
      })
      if (!res.ok) {
        setPerms({ ...perms, [p]: prev })
        setError(res.error)
      }
    })
  }

  return (
    <div className="bg-white rounded-xl ring-1 ring-black/5 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#FAF7F2]/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span
            className={`inline-block h-2 w-2 rounded-full transition-transform ${
              open ? 'rotate-90' : ''
            }`}
            aria-hidden
          >
            <svg width="10" height="10" viewBox="0 0 10 10" className="text-[#6B7770]">
              <path d="M3 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </span>
          <div>
            <div className="font-medium text-[#1A1A1A]">
              {member.name}
              {isSelf && (
                <span className="ml-2 text-xs text-[#6B7770] font-normal">(you)</span>
              )}
            </div>
            <div className="text-xs text-[#6B7770]">{member.email}</div>
          </div>
        </div>
        <span
          className={`text-xs rounded-full px-2 py-0.5 font-medium capitalize ${
            member.role === 'owner'
              ? 'bg-[#1B4332]/10 text-[#1B4332]'
              : member.role === 'manager'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-gray-100 text-gray-600'
          }`}
        >
          {member.role}
        </span>
      </button>
      {open && (
        <div className="border-t border-black/5 px-4 py-3 bg-[#FAF7F2]/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            {COURSE_PERMISSIONS.map(p => (
              <label
                key={p}
                className="flex items-center justify-between gap-3 py-1 text-sm"
              >
                <span className="text-[#1A1A1A]">{PERMISSION_LABELS[p]}</span>
                <Switch
                  size="sm"
                  checked={perms[p]}
                  disabled={isPending}
                  onCheckedChange={next => toggle(p, next)}
                />
              </label>
            ))}
          </div>
          {error && (
            <div className="mt-2 text-xs text-red-600">
              Couldn&apos;t save: {error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

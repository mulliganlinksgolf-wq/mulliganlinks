import { createAdminClient } from '@/lib/supabase/admin'
import { requireManager } from '@/lib/courseRole'
import InviteStaffModal from './InviteStaffModal'
import RemoveStaffButton from './RemoveStaffButton'
import RoleSelector from './RoleSelector'
import ResendInviteButton from './ResendInviteButton'

export default async function CourseTeamPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { courseId, userId: currentUserId } = await requireManager(slug)

  const admin = createAdminClient()

  const { data: members } = await admin
    .from('course_admins')
    .select('user_id, role, created_at')
    .eq('course_id', courseId)
    .order('created_at', { ascending: true })

  const userIds = (members ?? []).map(m => m.user_id)
  const { data: profileRows } = userIds.length > 0
    ? await admin
        .from('profiles_with_email')
        .select('id, full_name, email, last_sign_in_at, invited_at, email_confirmed_at')
        .in('id', userIds)
    : { data: [] }

  const profileMap = Object.fromEntries((profileRows ?? []).map(p => [p.id, p]))

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A]">Team</h1>
          <p className="text-sm text-[#6B7770] mt-0.5">Manage who has access to this course portal.</p>
        </div>
        <InviteStaffModal courseId={courseId} slug={slug} />
      </div>

      <div className="bg-white rounded-xl ring-1 ring-black/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#FAF7F2] border-b border-black/5">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Name</th>
              <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Email</th>
              <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Role</th>
              <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Last login</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {(members ?? []).map(m => {
              const p = profileMap[m.user_id] as any
              const name = p?.full_name ?? '—'
              const email = p?.email ?? '—'
              const isPending = !p?.last_sign_in_at
              const isSelf = m.user_id === currentUserId

              return (
                <tr key={m.user_id} className="hover:bg-[#FAF7F2]/50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#1A1A1A]">{name}</div>
                    {isPending && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 mt-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 inline-block" />
                        Invite pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#6B7770]">{email}</td>
                  <td className="px-4 py-3">
                    <RoleSelector
                      targetUserId={m.user_id}
                      courseId={courseId}
                      slug={slug}
                      currentRole={m.role}
                      disabled={isSelf}
                    />
                  </td>
                  <td className="px-4 py-3 text-[#6B7770] text-xs">
                    {p?.last_sign_in_at
                      ? new Date(p.last_sign_in_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })
                      : <span className="text-[#6B7770]/60 italic">Never</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {isPending && email !== '—' && (
                        <ResendInviteButton email={email} courseId={courseId} slug={slug} />
                      )}
                      {!isSelf && m.role === 'staff' && (
                        <RemoveStaffButton
                          targetUserId={m.user_id}
                          courseId={courseId}
                          slug={slug}
                          name={name}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

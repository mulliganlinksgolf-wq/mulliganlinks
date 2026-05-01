import { createAdminClient } from '@/lib/supabase/admin'
import { requireManager } from '@/lib/courseRole'
import InviteStaffModal from './InviteStaffModal'
import RemoveStaffButton from './RemoveStaffButton'

export default async function CourseTeamPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { courseId } = await requireManager(slug)

  const admin = createAdminClient()

  // Fetch course_admins then look up profiles separately (view join not guaranteed via FK hint)
  const { data: members } = await admin
    .from('course_admins')
    .select('user_id, role, created_at')
    .eq('course_id', courseId)
    .order('created_at', { ascending: true })

  const userIds = (members ?? []).map(m => m.user_id)
  const { data: profileRows } = userIds.length > 0
    ? await admin.from('profiles_with_email').select('id, full_name, email').in('id', userIds)
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
              <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Added</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {(members ?? []).map(m => {
              const p = profileMap[m.user_id] as any
              const name = p?.full_name ?? '—'
              const email = p?.email ?? '—'
              return (
                <tr key={m.user_id} className="hover:bg-[#FAF7F2]/50">
                  <td className="px-4 py-3 font-medium text-[#1A1A1A]">{name}</td>
                  <td className="px-4 py-3 text-[#6B7770]">{email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                      m.role === 'owner'   ? 'bg-[#1B4332]/10 text-[#1B4332]' :
                      m.role === 'manager' ? 'bg-amber-50 text-amber-700' :
                                            'bg-gray-100 text-gray-600'
                    }`}>
                      {m.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#6B7770]">
                    {new Date(m.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {m.role === 'staff' && (
                      <RemoveStaffButton
                        targetUserId={m.user_id}
                        courseId={courseId}
                        slug={slug}
                        name={name}
                      />
                    )}
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

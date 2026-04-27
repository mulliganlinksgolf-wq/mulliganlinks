import { createAdminClient } from '@/lib/supabase/admin'
import { ApproveButton, BarterReceiptButton } from './ApproveButton'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Waitlist — Admin' }

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    approved: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  }
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full border font-medium ${styles[status] ?? 'bg-gray-50 text-gray-600'}`}>
      {status}
    </span>
  )
}

export default async function AdminWaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const tab = params.tab === 'courses' ? 'courses' : 'golfers'

  const adminClient = createAdminClient()

  const [
    { data: golfers },
    { data: simpleWaitlist },
    { data: courses },
    { data: counter },
  ] = await Promise.all([
    adminClient.from('golfer_waitlist').select('*').order('id', { ascending: true }),
    adminClient.from('waitlist').select('*').order('created_at', { ascending: true }),
    adminClient.from('course_waitlist').select('*').order('created_at', { ascending: false }),
    adminClient.from('founding_partner_counter').select('count, cap').single(),
  ])

  // Merge simple email-only signups into golfer list, marking their source
  const simpleEmails = new Set((golfers ?? []).map((g: any) => g.email))
  const emailOnlySignups = (simpleWaitlist ?? [])
    .filter((w: any) => !simpleEmails.has(w.email))
    .map((w: any) => ({ ...w, _email_only: true }))

  const spotsUsed = counter?.count ?? 0
  const spotsCap = counter?.cap ?? 10

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Waitlist</h1>
          <p className="text-[#6B7770] text-sm mt-1">
            {(golfers?.length ?? 0) + emailOnlySignups.length} golfers · {courses?.length ?? 0} courses · {spotsUsed}/{spotsCap} Founding spots filled
          </p>
        </div>
        <a
          href={`/admin/waitlist/export?type=${tab}`}
          className="text-sm text-[#1B4332] border border-[#1B4332]/30 rounded-lg px-3 py-1.5 hover:bg-[#1B4332]/5 transition-colors"
        >
          Export CSV
        </a>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white ring-1 ring-black/5 rounded-xl p-1 w-fit">
        {[
          { value: 'golfers', label: `Golfers (${(golfers?.length ?? 0) + emailOnlySignups.length})` },
          { value: 'courses', label: `Courses (${courses?.length ?? 0})` },
        ].map(({ value, label }) => (
          <a
            key={value}
            href={`/admin/waitlist?tab=${value}`}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === value
                ? 'bg-[#1B4332] text-[#FAF7F2]'
                : 'text-[#6B7770] hover:text-[#1A1A1A]'
            }`}
          >
            {label}
          </a>
        ))}
      </div>

      {tab === 'golfers' && (
        <div className="bg-white rounded-xl ring-1 ring-black/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#FAF7F2] border-b border-black/5">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">#</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">ZIP</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Rounds/yr</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Tier interest</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Signed up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {((golfers?.length ?? 0) + emailOnlySignups.length) > 0 ? (
                  <>
                    {(golfers ?? []).map((g: any) => (
                      <tr key={`gw-${g.id}`} className="hover:bg-[#FAF7F2] transition-colors">
                        <td className="px-4 py-3 text-[#6B7770]">{g.id}</td>
                        <td className="px-4 py-3 font-medium text-[#1A1A1A]">
                          {g.first_name} {g.last_name}
                        </td>
                        <td className="px-4 py-3 text-[#6B7770]">{g.email}</td>
                        <td className="px-4 py-3 text-[#6B7770]">{g.zip_code}</td>
                        <td className="px-4 py-3 text-[#6B7770]">{g.rounds_per_year ?? '—'}</td>
                        <td className="px-4 py-3 text-[#6B7770]">{g.interested_tier ?? '—'}</td>
                        <td className="px-4 py-3 text-[#6B7770] text-xs">
                          {new Date(g.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                    {emailOnlySignups.map((w: any) => (
                      <tr key={`w-${w.id}`} className="hover:bg-[#FAF7F2] transition-colors">
                        <td className="px-4 py-3 text-[#6B7770]">—</td>
                        <td className="px-4 py-3 text-[#6B7770] italic text-xs">email only</td>
                        <td className="px-4 py-3 text-[#6B7770]">{w.email}</td>
                        <td className="px-4 py-3 text-[#6B7770]">—</td>
                        <td className="px-4 py-3 text-[#6B7770]">—</td>
                        <td className="px-4 py-3 text-[#6B7770]">—</td>
                        <td className="px-4 py-3 text-[#6B7770] text-xs">
                          {new Date(w.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </>
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[#6B7770]">
                      No golfer signups yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'courses' && (
        <div className="bg-white rounded-xl ring-1 ring-black/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#FAF7F2] border-b border-black/5">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Course</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Contact</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Location</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">GolfNow?</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Barter est.</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Applied</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {courses && courses.length > 0 ? (
                  courses.map((c: any) => (
                    <tr key={c.id} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#1A1A1A]">{c.course_name}</div>
                        {c.is_founding_partner && (
                          <div className="text-xs text-[#E0A800] font-semibold">
                            Founding Partner #{c.founding_partner_number}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#6B7770]">
                        {c.contact_name}
                        {c.contact_role && <span className="block text-xs">{c.contact_role}</span>}
                      </td>
                      <td className="px-4 py-3 text-[#6B7770]">{c.email}</td>
                      <td className="px-4 py-3 text-[#6B7770]">
                        {[c.city, c.state].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {c.on_golfnow ? '✓' : '—'}
                      </td>
                      <td className="px-4 py-3 text-[#6B7770]">
                        {c.estimated_barter_cost
                          ? `$${c.estimated_barter_cost.toLocaleString()}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3 text-[#6B7770] text-xs">
                        {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        {c.status === 'pending' && (
                          <ApproveButton courseId={c.id} spotsRemaining={spotsCap - spotsUsed} />
                        )}
                        {c.is_founding_partner && c.estimated_barter_cost && (
                          <BarterReceiptButton courseId={c.id} />
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-[#6B7770]">
                      No course applications yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// src/app/course/[slug]/leagues/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireManager } from '@/lib/courseRole'
import { formatLeagueStatus, formatLeagueFormat } from '@/lib/leagues'

export default async function CourseLeaguesPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const ctx = await requireManager(slug)

  const admin = createAdminClient()

  const { data: leagues } = await admin
    .from('leagues')
    .select('id, name, format, status, season_start, season_end, max_players')
    .eq('course_id', ctx.courseId)
    .order('created_at', { ascending: false })

  if (leagues === null) notFound()

  const statusColor: Record<string, string> = {
    draft:     'bg-gray-100 text-gray-600',
    active:    'bg-emerald-100 text-emerald-700',
    completed: 'bg-blue-100 text-blue-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Leagues</h1>
          <p className="text-sm text-[#6B7770] mt-0.5">Manage weekly or seasonal leagues for your members</p>
        </div>
        <Link
          href={`/course/${slug}/leagues/create`}
          className="bg-[#1B4332] text-[#FAF7F2] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#163829]"
        >
          + New League
        </Link>
      </div>

      {!leagues || leagues.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-4xl mb-3">🏆</p>
          <p className="font-semibold text-[#1A1A1A]">No leagues yet</p>
          <p className="text-sm text-[#6B7770] mt-1">Create your first league to start tracking member scores and standings.</p>
          <Link
            href={`/course/${slug}/leagues/create`}
            className="inline-block mt-4 bg-[#1B4332] text-[#FAF7F2] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#163829]"
          >
            Create a League
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Name', 'Format', 'Season', 'Max Players', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-[#6B7770] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leagues.map(league => (
                <tr key={league.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-[#1A1A1A]">{league.name}</td>
                  <td className="px-4 py-3 text-[#6B7770]">{formatLeagueFormat(league.format)}</td>
                  <td className="px-4 py-3 text-[#6B7770]">
                    {new Date(league.season_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' – '}
                    {new Date(league.season_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-[#6B7770]">{league.max_players}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[league.status] ?? statusColor.draft}`}>
                      {formatLeagueStatus(league.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/course/${slug}/leagues/${league.id}`}
                      className="text-[#1B4332] hover:underline font-medium text-xs"
                    >
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
